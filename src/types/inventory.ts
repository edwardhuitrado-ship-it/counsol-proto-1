export type UserRole = 'admin' | 'vendor' | 'end_user';

export interface UserProfile {
  id: string;
  email: string;
  displayName: string;
  role: UserRole;
  companyName: string;
  status: 'active' | 'pending' | 'suspended';
  vendorId?: string; // If role is vendor, identifier for their vendor entity
  createdAt: string;
  updatedAt: string;
}

export type SolarCategory =
  | 'Panels & Modules'
  | 'Inverters'
  | 'Battery Storage'
  | 'Racking & Mounting'
  | 'Charge Controllers'
  | 'Electrical BOS'
  | 'Monitoring & IoT'
  | 'Cables & Wiring';

export type ProductStatus = 'in_stock' | 'low_stock' | 'out_of_stock' | 'discontinued';

export interface Product {
  id: string;
  sku: string; // Unique SKU e.g. CS-MOD-550-BIF
  name: string;
  category: SolarCategory;
  description: string;
  specifications: string; // e.g. "550W, Bifacial Dual-Glass, 21.3% Eff, MC4"
  wattage?: number;
  voltage?: number;
  stockQuantity: number;
  allocatedQuantity: number; // Reserved for pending requisitions
  reorderPoint: number;
  unitCost: number; // Vendor supply cost (Admin & Vendor only)
  unitPrice: number; // Project / End-User price
  vendorId: string;
  vendorName: string;
  warehouseLocation: string; // e.g. "Zone A - Bay 04 - Shelf 2"
  status: ProductStatus;
  warrantyYears?: number;
  certification?: string; // e.g. "UL 1703, IEC 61215"
  createdAt: string;
  updatedAt: string;
}

export type RequisitionStatus =
  | 'pending'
  | 'approved'
  | 'allocated'
  | 'shipped'
  | 'fulfilled'
  | 'rejected';

export interface RequisitionItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
  unitPrice: number;
}

export interface Requisition {
  id: string;
  requisitionNumber: string; // e.g. REQ-2026-0042
  userId: string;
  userEmail: string;
  userName: string;
  projectName: string;
  jobSiteAddress: string;
  requiredDate: string;
  status: RequisitionStatus;
  items: RequisitionItem[];
  itemsSummary: string;
  totalItemsCount: number;
  totalEstimatedCost: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type ShipmentStatus =
  | 'draft'
  | 'dispatched'
  | 'in_transit'
  | 'delivered'
  | 'received_into_stock';

export interface ShipmentItem {
  productId: string;
  sku: string;
  name: string;
  quantity: number;
}

export interface Shipment {
  id: string;
  shipmentNumber: string; // e.g. SHP-2026-0812
  vendorId: string;
  vendorName: string;
  carrier: string; // e.g. "Freightliner Logistics", "Old Dominion"
  trackingNumber: string;
  estimatedDelivery: string;
  status: ShipmentStatus;
  items: ShipmentItem[];
  itemsSummary: string;
  totalUnits: number;
  notes: string;
  createdAt: string;
  updatedAt: string;
}

export type MovementType =
  | 'inbound' // Vendor restock delivery
  | 'outbound' // Requisition project fulfillment
  | 'adjustment' // Manual inventory count adjustment
  | 'audit_cycle' // Physical audit cycle count
  | 'damaged' // Damaged during warehouse transport
  | 'return'; // Customer return into stock

export interface StockMovement {
  id: string;
  productId: string;
  sku: string;
  productName: string;
  movementType: MovementType;
  quantityDelta: number; // positive or negative
  previousQuantity: number;
  newQuantity: number;
  referenceId: string; // Requisition ID, Shipment ID, or Audit Code
  operatorEmail: string;
  reason: string;
  timestamp: string;
}
