import React from 'react';
import {
  Sun,
  Shield,
  Briefcase,
  User,
  LogOut,
  LogIn,
  ShoppingCart,
  Database,
  Sparkles,
  ChevronDown,
} from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { UserRole } from '../types/inventory';

interface NavbarProps {
  cartCount: number;
  onOpenCart?: () => void;
  onOpenSkuGen?: () => void;
}

export const Navbar: React.FC<NavbarProps> = ({ cartCount, onOpenCart, onOpenSkuGen }) => {
  const { userProfile, role, switchDemoRole, currentUser, signInWithGoogle, signOut } = useAuth();
  const [showRoleMenu, setShowRoleMenu] = React.useState(false);

  const getRoleDisplay = (r: UserRole) => {
    switch (r) {
      case 'admin':
        return {
          label: 'Administrative Account',
          badge: 'Administrator (Full RBAC)',
          color: 'bg-amber-500/20 text-amber-300 border-amber-500/40',
          icon: Shield,
        };
      case 'vendor':
        return {
          label: 'Vendor Portal',
          badge: 'Vendor / Supplier',
          color: 'bg-emerald-500/20 text-emerald-300 border-emerald-500/40',
          icon: Briefcase,
        };
      case 'end_user':
        return {
          label: 'End-User Portal',
          badge: 'Contractor / Engineer',
          color: 'bg-cyan-500/20 text-cyan-300 border-cyan-500/40',
          icon: User,
        };
    }
  };

  const currentRoleInfo = getRoleDisplay(role);
  const RoleIcon = currentRoleInfo.icon;

  return (
    <header className="bg-slate-900 border-b border-slate-800 sticky top-0 z-30 shadow-md">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand Logo & Name */}
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 via-amber-400 to-yellow-300 flex items-center justify-center shadow-lg shadow-amber-500/20">
            <Sun className="w-6 h-6 text-slate-950 stroke-[2.2]" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-white">
                coun<span className="text-amber-400">SOL</span> america
              </span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/30">
                Solar Tech IMS
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Photovoltaic & Storage Inventory • Unique SKU Architecture
            </p>
          </div>
        </div>

        {/* Center / Right controls */}
        <div className="flex items-center gap-2 sm:gap-4">
          {/* Quick SKU Generator Trigger */}
          {role === 'admin' && onOpenSkuGen && (
            <button
              onClick={onOpenSkuGen}
              className="hidden md:flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold bg-slate-800 hover:bg-slate-750 text-amber-300 border border-amber-500/30 rounded-lg transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5 text-amber-400" />
              <span>SKU Builder</span>
            </button>
          )}

          {/* End-User Cart Button */}
          {role === 'end_user' && onOpenCart && (
            <button
              onClick={onOpenCart}
              className="relative flex items-center gap-1.5 px-3 py-1.5 bg-amber-500/10 hover:bg-amber-500/20 text-amber-300 border border-amber-500/30 rounded-lg text-xs font-semibold transition-colors"
            >
              <ShoppingCart className="w-4 h-4 text-amber-400" />
              <span className="hidden sm:inline">Project Cart</span>
              {cartCount > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full bg-amber-500 text-slate-950 font-bold text-[10px]">
                  {cartCount}
                </span>
              )}
            </button>
          )}

          {/* Role Switcher Dropdown (Crucial for evaluation & RBAC verification) */}
          <div className="relative">
            <button
              onClick={() => setShowRoleMenu(!showRoleMenu)}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-semibold transition-all ${currentRoleInfo.color} hover:brightness-110 shadow-xs`}
            >
              <RoleIcon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{currentRoleInfo.badge}</span>
              <span className="sm:hidden">{role.toUpperCase()}</span>
              <ChevronDown className="w-3 h-3 opacity-70" />
            </button>

            {showRoleMenu && (
              <div className="absolute right-0 mt-2 w-64 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl p-2 z-50 text-xs animate-in fade-in zoom-in-95">
                <div className="px-3 py-2 border-b border-slate-800">
                  <p className="text-[10px] uppercase font-bold text-slate-400">
                    Switch Account Role (RBAC)
                  </p>
                  <p className="text-[11px] text-slate-300 mt-0.5">
                    Test role-based access control behaviors
                  </p>
                </div>

                <div className="py-1 space-y-1">
                  <button
                    onClick={() => {
                      switchDemoRole('admin');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                      role === 'admin'
                        ? 'bg-amber-500/20 text-amber-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Shield className="w-4 h-4 text-amber-400 shrink-0" />
                    <div>
                      <div className="text-xs">Administrative</div>
                      <div className="text-[10px] text-slate-400">
                        Full catalog, SKU creation, audit ledger, approvals
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchDemoRole('vendor');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                      role === 'vendor'
                        ? 'bg-emerald-500/20 text-emerald-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <Briefcase className="w-4 h-4 text-emerald-400 shrink-0" />
                    <div>
                      <div className="text-xs">Vendor (SunVolt Dynamics)</div>
                      <div className="text-[10px] text-slate-400">
                        Manage supplied SKUs & inbound restock shipments
                      </div>
                    </div>
                  </button>

                  <button
                    onClick={() => {
                      switchDemoRole('end_user');
                      setShowRoleMenu(false);
                    }}
                    className={`w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-left transition-colors ${
                      role === 'end_user'
                        ? 'bg-cyan-500/20 text-cyan-300 font-semibold'
                        : 'text-slate-300 hover:bg-slate-800'
                    }`}
                  >
                    <User className="w-4 h-4 text-cyan-400 shrink-0" />
                    <div>
                      <div className="text-xs">End-User (Apex Contractors)</div>
                      <div className="text-[10px] text-slate-400">
                        Browse catalog, size solar kits, submit project orders
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* User Account / Auth */}
          <div className="flex items-center gap-2 border-l border-slate-800 pl-3">
            <div className="text-right hidden md:block">
              <div className="text-xs font-semibold text-white leading-tight">
                {userProfile.displayName}
              </div>
              <div className="text-[10px] text-slate-400 leading-tight">
                {userProfile.companyName}
              </div>
            </div>

            {currentUser ? (
              <button
                onClick={signOut}
                title="Sign out of Firebase"
                className="p-2 text-slate-400 hover:text-rose-400 hover:bg-slate-800 rounded-lg transition-colors"
              >
                <LogOut className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={signInWithGoogle}
                title="Sign in with Google"
                className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs text-slate-300 hover:text-white bg-slate-800 hover:bg-slate-750 rounded-lg border border-slate-700 transition-colors"
              >
                <LogIn className="w-3.5 h-3.5 text-amber-400" />
                <span className="hidden sm:inline">Sign In</span>
              </button>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
