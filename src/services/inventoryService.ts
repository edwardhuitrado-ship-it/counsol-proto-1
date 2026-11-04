import {
  collection,
  doc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  onSnapshot,
  query,
  orderBy,
} from 'firebase/firestore';
import { db, handleFirestoreError, OperationType } from '../firebase';
import {
  Product,
  Requisition,
  RequisitionStatus,
  Shipment,
  StockMovement,
  MovementType,
  UserProfile,
  UserRole,
} from '../types/inventory';
import {
  INITIAL_PRODUCTS,
  INITIAL_REQUISITIONS,
  INITIAL_SHIPMENTS,
  INITIAL_MOVEMENTS,
  DEMO_USERS,
} from '../data/seedData';

const PRODUCTS_COLLECTION = 'products';
const REQUISITIONS_COLLECTION = 'requisitions';
const SHIPMENTS_COLLECTION = 'shipments';
const MOVEMENTS_COLLECTION = 'stockMovements';
const USERS_COLLECTION = 'users';

// In-memory fallback / cache for smooth offline and demo interactions
let localProducts: Product[] = [...INITIAL_PRODUCTS];
let localRequisitions: Requisition[] = [...INITIAL_REQUISITIONS];
let localShipments: Shipment[] = [...INITIAL_SHIPMENTS];
let localMovements: StockMovement[] = [...INITIAL_MOVEMENTS];
let localUsers: UserProfile[] = [...DEMO_USERS];

export const inventoryService = {
  // --- Initialization & Seeding ---
  async seedIfEmpty() {
    try {
      const snap = await getDocs(collection(db, PRODUCTS_COLLECTION));
      if (snap.empty) {
        // Seed products
        for (const p of INITIAL_PRODUCTS) {
          await setDoc(doc(db, PRODUCTS_COLLECTION, p.id), p);
        }
        // Seed requisitions
        for (const r of INITIAL_REQUISITIONS) {
          await setDoc(doc(db, REQUISITIONS_COLLECTION, r.id), r);
        }
        // Seed shipments
        for (const s of INITIAL_SHIPMENTS) {
          await setDoc(doc(db, SHIPMENTS_COLLECTION, s.id), s);
        }
        // Seed movements
        for (const m of INITIAL_MOVEMENTS) {
          await setDoc(doc(db, MOVEMENTS_COLLECTION, m.id), m);
        }
        // Seed demo users
        for (const u of DEMO_USERS) {
          await setDoc(doc(db, USERS_COLLECTION, u.id), u);
        }
      }
    } catch (err) {
      console.warn('Could not seed Firestore directly (running local cache):', err);
    }
  },

  // --- Products ---
  subscribeProducts(callback: (products: Product[]) => void) {
    try {
      const q = query(collection(db, PRODUCTS_COLLECTION), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as Product);
            localProducts = list;
            callback(list);
          } else {
            callback(localProducts);
          }
        },
        (error) => {
          console.warn('Firestore subscription fallback to local cache for products:', error.message);
          callback(localProducts);
        }
      );
    } catch (err) {
      console.warn('Using local cache for products');
      callback(localProducts);
      return () => {};
    }
  },

  async addProduct(
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>,
    operatorEmail: string
  ): Promise<Product> {
    const id = `prod-${Date.now()}`;
    const now = new Date().toISOString();
    const newProduct: Product = {
      ...productData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    // Update local cache
    localProducts = [newProduct, ...localProducts];

    // Try Firestore
    try {
      await setDoc(doc(db, PRODUCTS_COLLECTION, id), newProduct);
    } catch (err) {
      console.warn('Saved product to local cache:', err);
    }

    // Log stock movement
    await this.logMovement({
      productId: id,
      sku: newProduct.sku,
      productName: newProduct.name,
      movementType: 'inbound',
      quantityDelta: newProduct.stockQuantity,
      previousQuantity: 0,
      newQuantity: newProduct.stockQuantity,
      referenceId: 'INITIAL-CATALOG-CREATION',
      operatorEmail,
      reason: `Initial stock entry for new SKU ${newProduct.sku}`,
    });

    return newProduct;
  },

  async updateProduct(
    id: string,
    updates: Partial<Product>,
    operatorEmail: string,
    reason?: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const existing = localProducts.find((p) => p.id === id);
    if (!existing) return;

    const updated: Product = { ...existing, ...updates, updatedAt: now };

    // Calculate stock status dynamically
    if (updated.stockQuantity <= 0) {
      updated.status = 'out_of_stock';
    } else if (updated.stockQuantity <= updated.reorderPoint) {
      updated.status = 'low_stock';
    } else {
      updated.status = 'in_stock';
    }

    localProducts = localProducts.map((p) => (p.id === id ? updated : p));

    try {
      await updateDoc(doc(db, PRODUCTS_COLLECTION, id), { ...updated });
    } catch (err) {
      console.warn('Updated product in local cache:', err);
    }

    // If stock quantity changed directly
    if (updates.stockQuantity !== undefined && updates.stockQuantity !== existing.stockQuantity) {
      const delta = updates.stockQuantity - existing.stockQuantity;
      await this.logMovement({
        productId: id,
        sku: updated.sku,
        productName: updated.name,
        movementType: delta > 0 ? 'inbound' : 'adjustment',
        quantityDelta: delta,
        previousQuantity: existing.stockQuantity,
        newQuantity: updated.stockQuantity,
        referenceId: `UPD-${Date.now()}`,
        operatorEmail,
        reason: reason || 'Direct product record stock update',
      });
    }
  },

  async deleteProduct(id: string, operatorEmail: string): Promise<void> {
    const existing = localProducts.find((p) => p.id === id);
    if (existing) {
      await this.logMovement({
        productId: id,
        sku: existing.sku,
        productName: existing.name,
        movementType: 'adjustment',
        quantityDelta: -existing.stockQuantity,
        previousQuantity: existing.stockQuantity,
        newQuantity: 0,
        referenceId: 'DELETE-PRODUCT',
        operatorEmail,
        reason: `Product and SKU ${existing.sku} removed from catalog`,
      });
    }

    localProducts = localProducts.filter((p) => p.id !== id);

    try {
      await deleteDoc(doc(db, PRODUCTS_COLLECTION, id));
    } catch (err) {
      console.warn('Deleted product from local cache:', err);
    }
  },

  async adjustStock(
    productId: string,
    quantityDelta: number,
    movementType: MovementType,
    reason: string,
    referenceId: string,
    operatorEmail: string
  ): Promise<void> {
    const product = localProducts.find((p) => p.id === productId);
    if (!product) throw new Error('Product not found');

    const previousQuantity = product.stockQuantity;
    const newQuantity = Math.max(0, previousQuantity + quantityDelta);

    let newStatus = product.status;
    if (newQuantity <= 0) {
      newStatus = 'out_of_stock';
    } else if (newQuantity <= product.reorderPoint) {
      newStatus = 'low_stock';
    } else {
      newStatus = 'in_stock';
    }

    const updatedProduct: Product = {
      ...product,
      stockQuantity: newQuantity,
      status: newStatus,
      updatedAt: new Date().toISOString(),
    };

    localProducts = localProducts.map((p) => (p.id === productId ? updatedProduct : p));

    try {
      await updateDoc(doc(db, PRODUCTS_COLLECTION, productId), {
        stockQuantity: newQuantity,
        status: newStatus,
        updatedAt: updatedProduct.updatedAt,
      });
    } catch (err) {
      console.warn('Stock adjusted in local cache:', err);
    }

    await this.logMovement({
      productId,
      sku: product.sku,
      productName: product.name,
      movementType,
      quantityDelta,
      previousQuantity,
      newQuantity,
      referenceId: referenceId || `ADJ-${Date.now()}`,
      operatorEmail,
      reason,
    });
  },

  // --- Requisitions ---
  subscribeRequisitions(
    callback: (requisitions: Requisition[]) => void,
    userFilter?: { userId?: string; role?: UserRole }
  ) {
    try {
      const q = query(collection(db, REQUISITIONS_COLLECTION), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            let list = snapshot.docs.map((d) => d.data() as Requisition);
            if (userFilter && userFilter.role === 'end_user' && userFilter.userId) {
              list = list.filter((r) => r.userId === userFilter.userId);
            }
            localRequisitions = list;
            callback(list);
          } else {
            let filtered = localRequisitions;
            if (userFilter && userFilter.role === 'end_user' && userFilter.userId) {
              filtered = filtered.filter((r) => r.userId === userFilter.userId);
            }
            callback(filtered);
          }
        },
        (error) => {
          console.warn('Firestore fallback for requisitions:', error.message);
          let filtered = localRequisitions;
          if (userFilter && userFilter.role === 'end_user' && userFilter.userId) {
            filtered = filtered.filter((r) => r.userId === userFilter.userId);
          }
          callback(filtered);
        }
      );
    } catch {
      callback(localRequisitions);
      return () => {};
    }
  },

  async createRequisition(
    reqData: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Requisition> {
    const id = `req-${Date.now()}`;
    const now = new Date().toISOString();
    const newReq: Requisition = {
      ...reqData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    localRequisitions = [newReq, ...localRequisitions];

    try {
      await setDoc(doc(db, REQUISITIONS_COLLECTION, id), newReq);
    } catch (err) {
      console.warn('Requisition stored in local cache:', err);
    }

    return newReq;
  },

  async updateRequisitionStatus(
    id: string,
    status: RequisitionStatus,
    operatorEmail: string
  ): Promise<void> {
    const now = new Date().toISOString();
    const existing = localRequisitions.find((r) => r.id === id);
    if (!existing) return;

    // If approving or fulfilling, adjust allocated or stock quantities
    if (status === 'allocated' && existing.status !== 'allocated') {
      for (const item of existing.items) {
        const prod = localProducts.find((p) => p.id === item.productId);
        if (prod) {
          const newAllocated = (prod.allocatedQuantity || 0) + item.quantity;
          await this.updateProduct(
            prod.id,
            { allocatedQuantity: newAllocated },
            operatorEmail,
            `Reserved ${item.quantity} units for ${existing.requisitionNumber}`
          );
        }
      }
    } else if (status === 'shipped' && existing.status !== 'shipped') {
      for (const item of existing.items) {
        const prod = localProducts.find((p) => p.id === item.productId);
        if (prod) {
          const newStock = Math.max(0, prod.stockQuantity - item.quantity);
          const newAllocated = Math.max(0, (prod.allocatedQuantity || 0) - item.quantity);
          await this.updateProduct(
            prod.id,
            { stockQuantity: newStock, allocatedQuantity: newAllocated },
            operatorEmail,
            `Dispatched ${item.quantity} units for ${existing.requisitionNumber}`
          );
          await this.logMovement({
            productId: prod.id,
            sku: prod.sku,
            productName: prod.name,
            movementType: 'outbound',
            quantityDelta: -item.quantity,
            previousQuantity: prod.stockQuantity,
            newQuantity: newStock,
            referenceId: existing.requisitionNumber,
            operatorEmail,
            reason: `Dispatched to site ${existing.jobSiteAddress}`,
          });
        }
      }
    }

    const updated = { ...existing, status, updatedAt: now };
    localRequisitions = localRequisitions.map((r) => (r.id === id ? updated : r));

    try {
      await updateDoc(doc(db, REQUISITIONS_COLLECTION, id), { status, updatedAt: now });
    } catch (err) {
      console.warn('Updated requisition in local cache:', err);
    }
  },

  // --- Shipments ---
  subscribeShipments(
    callback: (shipments: Shipment[]) => void,
    vendorFilter?: { vendorId?: string; role?: UserRole }
  ) {
    try {
      const q = query(collection(db, SHIPMENTS_COLLECTION), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            let list = snapshot.docs.map((d) => d.data() as Shipment);
            if (vendorFilter && vendorFilter.role === 'vendor' && vendorFilter.vendorId) {
              list = list.filter((s) => s.vendorId === vendorFilter.vendorId);
            }
            localShipments = list;
            callback(list);
          } else {
            let filtered = localShipments;
            if (vendorFilter && vendorFilter.role === 'vendor' && vendorFilter.vendorId) {
              filtered = filtered.filter((s) => s.vendorId === vendorFilter.vendorId);
            }
            callback(filtered);
          }
        },
        (error) => {
          console.warn('Firestore fallback for shipments:', error.message);
          let filtered = localShipments;
          if (vendorFilter && vendorFilter.role === 'vendor' && vendorFilter.vendorId) {
            filtered = filtered.filter((s) => s.vendorId === vendorFilter.vendorId);
          }
          callback(filtered);
        }
      );
    } catch {
      callback(localShipments);
      return () => {};
    }
  },

  async createShipment(
    shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>
  ): Promise<Shipment> {
    const id = `shp-${Date.now()}`;
    const now = new Date().toISOString();
    const newShipment: Shipment = {
      ...shipmentData,
      id,
      createdAt: now,
      updatedAt: now,
    };

    localShipments = [newShipment, ...localShipments];

    try {
      await setDoc(doc(db, SHIPMENTS_COLLECTION, id), newShipment);
    } catch (err) {
      console.warn('Shipment stored in local cache:', err);
    }

    return newShipment;
  },

  async receiveShipmentIntoStock(shipmentId: string, operatorEmail: string): Promise<void> {
    const shipment = localShipments.find((s) => s.id === shipmentId);
    if (!shipment) return;

    for (const item of shipment.items) {
      const prod = localProducts.find((p) => p.id === item.productId || p.sku === item.sku);
      if (prod) {
        await this.adjustStock(
          prod.id,
          item.quantity,
          'inbound',
          `Restock shipment ${shipment.shipmentNumber} received at counSOL warehouse`,
          shipment.shipmentNumber,
          operatorEmail
        );
      }
    }

    const now = new Date().toISOString();
    const updated: Shipment = {
      ...shipment,
      status: 'received_into_stock',
      updatedAt: now,
    };

    localShipments = localShipments.map((s) => (s.id === shipmentId ? updated : s));

    try {
      await updateDoc(doc(db, SHIPMENTS_COLLECTION, shipmentId), {
        status: 'received_into_stock',
        updatedAt: now,
      });
    } catch (err) {
      console.warn('Shipment updated in local cache:', err);
    }
  },

  // --- Movements / Audit Ledger ---
  subscribeMovements(callback: (movements: StockMovement[]) => void) {
    try {
      const q = query(collection(db, MOVEMENTS_COLLECTION), orderBy('timestamp', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as StockMovement);
            localMovements = list;
            callback(list);
          } else {
            callback(localMovements);
          }
        },
        (error) => {
          console.warn('Firestore fallback for stock movements:', error.message);
          callback(localMovements);
        }
      );
    } catch {
      callback(localMovements);
      return () => {};
    }
  },

  async logMovement(movement: Omit<StockMovement, 'id' | 'timestamp'>): Promise<void> {
    const id = `mov-${Date.now()}-${Math.floor(Math.random() * 1000)}`;
    const now = new Date().toISOString();
    const newMovement: StockMovement = {
      ...movement,
      id,
      timestamp: now,
    };

    localMovements = [newMovement, ...localMovements];

    try {
      await setDoc(doc(db, MOVEMENTS_COLLECTION, id), newMovement);
    } catch (err) {
      console.warn('Movement logged to local cache:', err);
    }
  },

  // --- Users & RBAC ---
  subscribeUsers(callback: (users: UserProfile[]) => void) {
    try {
      const q = query(collection(db, USERS_COLLECTION), orderBy('createdAt', 'desc'));
      return onSnapshot(
        q,
        (snapshot) => {
          if (!snapshot.empty) {
            const list = snapshot.docs.map((d) => d.data() as UserProfile);
            localUsers = list;
            callback(list);
          } else {
            callback(localUsers);
          }
        },
        (error) => {
          console.warn('Firestore fallback for users:', error.message);
          callback(localUsers);
        }
      );
    } catch {
      callback(localUsers);
      return () => {};
    }
  },

  async updateUserRole(userId: string, role: UserRole): Promise<void> {
    const now = new Date().toISOString();
    localUsers = localUsers.map((u) => (u.id === userId ? { ...u, role, updatedAt: now } : u));

    try {
      await updateDoc(doc(db, USERS_COLLECTION, userId), { role, updatedAt: now });
    } catch (err) {
      console.warn('User role updated in local cache:', err);
    }
  },
};
