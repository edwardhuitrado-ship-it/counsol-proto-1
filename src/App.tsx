/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { Navbar } from './components/Navbar';
import { AdminView } from './components/AdminView';
import { VendorView } from './components/VendorView';
import { EndUserView } from './components/EndUserView';
import { SkuGeneratorModal } from './components/SkuGeneratorModal';
import { inventoryService } from './services/inventoryService';
import {
  Product,
  Requisition,
  Shipment,
  StockMovement,
  UserProfile,
  MovementType,
  RequisitionStatus,
} from './types/inventory';
import { Shield, Briefcase, User, Sun, CheckCircle2, ArrowRight } from 'lucide-react';

const MainContent: React.FC = () => {
  const { role, userProfile, isAdmin, isVendor, isEndUser, activeVendorId, switchDemoRole } =
    useAuth();

  const [products, setProducts] = useState<Product[]>([]);
  const [requisitions, setRequisitions] = useState<Requisition[]>([]);
  const [shipments, setShipments] = useState<Shipment[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [users, setUsers] = useState<UserProfile[]>([]);
  const [showGlobalSkuGen, setShowGlobalSkuGen] = useState(false);

  // Real-time Firestore subscriptions
  useEffect(() => {
    const unsubProducts = inventoryService.subscribeProducts((list) => {
      setProducts(list);
    });

    const unsubRequisitions = inventoryService.subscribeRequisitions(
      (list) => {
        setRequisitions(list);
      },
      { userId: userProfile.id, role }
    );

    const unsubShipments = inventoryService.subscribeShipments(
      (list) => {
        setShipments(list);
      },
      { vendorId: userProfile.vendorId || activeVendorId, role }
    );

    const unsubMovements = inventoryService.subscribeMovements((list) => {
      setMovements(list);
    });

    const unsubUsers = inventoryService.subscribeUsers((list) => {
      setUsers(list);
    });

    return () => {
      unsubProducts();
      unsubRequisitions();
      unsubShipments();
      unsubMovements();
      unsubUsers();
    };
  }, [userProfile.id, userProfile.vendorId, role, activeVendorId]);

  // Handlers
  const handleAddProduct = async (
    productData: Omit<Product, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    return await inventoryService.addProduct(productData, userProfile.email);
  };

  const handleUpdateProduct = async (
    id: string,
    updates: Partial<Product>,
    reason?: string
  ) => {
    await inventoryService.updateProduct(id, updates, userProfile.email, reason);
  };

  const handleDeleteProduct = async (id: string) => {
    await inventoryService.deleteProduct(id, userProfile.email);
  };

  const handleAdjustStock = async (
    productId: string,
    delta: number,
    type: MovementType,
    reason: string,
    ref: string
  ) => {
    await inventoryService.adjustStock(
      productId,
      delta,
      type,
      reason,
      ref,
      userProfile.email
    );
  };

  const handleUpdateRequisitionStatus = async (
    id: string,
    status: RequisitionStatus
  ) => {
    await inventoryService.updateRequisitionStatus(id, status, userProfile.email);
  };

  const handleSaveShipment = async (
    shipmentData: Omit<Shipment, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    return await inventoryService.createShipment(shipmentData);
  };

  const handleReceiveShipment = async (shipmentId: string) => {
    await inventoryService.receiveShipmentIntoStock(shipmentId, userProfile.email);
  };

  const handleUpdateUserRole = async (
    targetUserId: string,
    newRole: UserProfile['role']
  ) => {
    await inventoryService.updateUserRole(targetUserId, newRole);
  };

  const handleCreateRequisition = async (
    reqData: Omit<Requisition, 'id' | 'createdAt' | 'updatedAt'>
  ) => {
    return await inventoryService.createRequisition(reqData);
  };

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col font-sans selection:bg-amber-500 selection:text-slate-950">
      {/* Top Navigation */}
      <Navbar
        cartCount={0}
        onOpenSkuGen={() => setShowGlobalSkuGen(true)}
      />

      {/* Role Demonstration Switcher Header Pill */}
      <div className="bg-slate-900/90 border-b border-slate-800 py-2 px-4">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-2">
            <span className="text-slate-400">Current Role Mode:</span>
            <span
              className={`px-2.5 py-0.5 rounded-full font-bold uppercase tracking-wider text-[10px] ${
                isAdmin
                  ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                  : isVendor
                  ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                  : 'bg-cyan-500/20 text-cyan-300 border border-cyan-500/40'
              }`}
            >
              {role === 'admin'
                ? 'Administrative Account (Full Access)'
                : role === 'vendor'
                ? 'Vendor Account (Supplier Portal)'
                : 'End-User Account (Contractor/Requisitioner)'}
            </span>
          </div>

          <div className="flex items-center gap-1 text-[11px]">
            <span className="text-slate-400 hidden md:inline">Quick Test Perspectives:</span>
            <button
              onClick={() => switchDemoRole('admin')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                isAdmin ? 'bg-amber-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Admin
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => switchDemoRole('vendor')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                isVendor ? 'bg-emerald-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              Vendor (SunVolt)
            </button>
            <span className="text-slate-600">•</span>
            <button
              onClick={() => switchDemoRole('end_user')}
              className={`px-2.5 py-1 rounded transition-colors font-medium ${
                isEndUser ? 'bg-cyan-500 text-slate-950 font-bold' : 'text-slate-300 hover:bg-slate-800'
              }`}
            >
              End-User (Apex Solar)
            </button>
          </div>
        </div>
      </div>

      {/* Main Body */}
      <main className="flex-1 max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6">
        {isAdmin && (
          <AdminView
            products={products}
            requisitions={requisitions}
            shipments={shipments}
            movements={movements}
            users={users}
            operatorEmail={userProfile.email}
            onAddProduct={handleAddProduct}
            onUpdateProduct={handleUpdateProduct}
            onDeleteProduct={handleDeleteProduct}
            onAdjustStock={handleAdjustStock}
            onUpdateRequisitionStatus={handleUpdateRequisitionStatus}
            onSaveShipment={handleSaveShipment}
            onReceiveShipment={handleReceiveShipment}
            onUpdateUserRole={handleUpdateUserRole}
          />
        )}

        {isVendor && (
          <VendorView
            products={products}
            shipments={shipments}
            vendorId={userProfile.vendorId || activeVendorId}
            vendorName={userProfile.companyName || 'SunVolt Dynamics Inc.'}
            onAddProduct={handleAddProduct}
            onSaveShipment={handleSaveShipment}
          />
        )}

        {isEndUser && (
          <EndUserView
            products={products}
            requisitions={requisitions}
            userId={userProfile.id}
            userName={userProfile.displayName}
            userEmail={userProfile.email}
            companyName={userProfile.companyName}
            onSubmitRequisition={handleCreateRequisition}
          />
        )}
      </main>

      {/* Footer */}
      <footer className="bg-slate-900 border-t border-slate-800 py-6 text-xs text-slate-400">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <Sun className="w-4 h-4 text-amber-400" />
            <span className="font-semibold text-slate-200">
              coun<span className="text-amber-400">SOL</span> america
            </span>
            <span className="text-slate-600">|</span>
            <span>Solar Energy Technology Inventory Management System</span>
          </div>

          <div className="flex items-center gap-4 text-[11px] text-slate-500">
            <span>Standardized Solar SKU: CS-[CAT]-[RATING]-[TYPE]-[REV]</span>
            <span>•</span>
            <span className="flex items-center gap-1 text-emerald-400">
              <CheckCircle2 className="w-3.5 h-3.5" /> Persistent Firestore Connected
            </span>
          </div>
        </div>
      </footer>

      {showGlobalSkuGen && (
        <SkuGeneratorModal
          existingProducts={products}
          onSelectSku={() => {
            setShowGlobalSkuGen(false);
          }}
          onClose={() => setShowGlobalSkuGen(false)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <AuthProvider>
      <MainContent />
    </AuthProvider>
  );
}
