
import React, { useState } from 'react';
import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { User, UserRole, SubscriptionStatus } from '../types';
import { 
  Home, Box, Truck, Store, User as UserIcon, LogOut, ShieldCheck, 
  Menu, Bell, Search, LayoutDashboard, Tractor, Factory, ScanLine, X, ClipboardList, MapPin, Layers, Heart, FileCheck, ClipboardCheck, Zap, AlertCircle
} from 'lucide-react';

interface LayoutProps {
  user: User;
  onLogout: () => void;
}

const Layout: React.FC<LayoutProps> = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  const isActive = (path: string, tab?: string) => {
    const isPathActive = location.pathname === path;
    if (tab) {
      const params = new URLSearchParams(location.search);
      return isPathActive && params.get('tab') === tab;
    }
    return isPathActive && !new URLSearchParams(location.search).get('tab');
  };

  const rolePath = `/dashboard/${user.role.toLowerCase()}`;

  const displayRole = user.role === UserRole.COLLECTOR ? 'Transporter' : user.role;

  return (
    <div className="flex min-h-screen bg-slate-50 relative">
      {isSidebarOpen && (
        <div 
          className="fixed inset-0 bg-slate-900/60 backdrop-blur-sm z-40 md:hidden"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      <aside className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-emerald-900 text-white flex flex-col transition-transform duration-300 ease-in-out
        ${isSidebarOpen ? 'translate-x-0' : '-translate-x-full'}
        md:translate-x-0 md:relative md:flex shrink-0
      `}>
        <div className="p-6 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-8 h-8 text-emerald-400" />
            <span className="text-xl font-bold tracking-tight">TrueChain</span>
          </div>
          <button onClick={() => setIsSidebarOpen(false)} className="md:hidden text-emerald-400">
            <X className="w-6 h-6" />
          </button>
        </div>
        
        <nav className="flex-1 px-4 py-4 space-y-1 overflow-y-auto">
          <Link 
            to={rolePath} 
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath) ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
          >
            <LayoutDashboard className="w-5 h-5" />
            {displayRole} Dashboard
          </Link>

          <Link 
            to="/scan" 
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/scan') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
          >
            <ScanLine className="w-5 h-5" />
            Chain Verification
          </Link>
          
          <div className="pt-6 pb-2 px-4 uppercase text-[10px] font-bold text-emerald-500 tracking-wider">
            Role Specific
          </div>

          {user.role === UserRole.FARMER && (
            <>
              <Link 
                to={`${rolePath}?tab=batches`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'batches') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Tractor className="w-5 h-5" /> Harvest Batches
              </Link>
              <Link 
                to={`${rolePath}?tab=notes`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'notes') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <ClipboardList className="w-5 h-5" /> Field Notes
              </Link>
            </>
          )}

          {user.role === UserRole.MANUFACTURER && (
            <>
              <Link 
                to={`${rolePath}?tab=workflow`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'workflow') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Factory className="w-5 h-5" /> Production SKUs
              </Link>
              <Link 
                to={`${rolePath}?tab=archive`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'archive') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <ShieldCheck className="w-5 h-5" /> Certification Engine
              </Link>
            </>
          )}

          {user.role === UserRole.COLLECTOR && (
            <>
              <Link 
                to={`${rolePath}?tab=shipments`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'shipments') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Truck className="w-5 h-5" /> Active Shipments
              </Link>
              <Link 
                to={`${rolePath}?tab=tracking`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'tracking') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <MapPin className="w-5 h-5" /> Route Tracking
              </Link>
            </>
          )}

          {user.role === UserRole.DISTRIBUTOR && (
            <>
              <Link 
                to={`${rolePath}?tab=inventory`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'inventory') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Layers className="w-5 h-5" /> Inventory Logs
              </Link>
              <Link 
                to={`${rolePath}?tab=telemetry`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'telemetry') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Box className="w-5 h-5" /> Storage Telemetry
              </Link>
            </>
          )}

          {user.role === UserRole.RETAILER && (
            <>
              <Link 
                to={`${rolePath}?tab=shelf`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'shelf') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Store className="w-5 h-5" /> Shelf Monitor
              </Link>
              <Link 
                to={`${rolePath}?tab=cards`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'cards') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <ShieldCheck className="w-5 h-5" /> Trust Cards
              </Link>
            </>
          )}

          {user.role === UserRole.CONSUMER && (
            <>
              <Link 
                to={`${rolePath}?tab=market`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'market') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Search className="w-5 h-5" /> Market Browser
              </Link>
              <Link 
                to={`${rolePath}?tab=saves`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'saves') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <Heart className="w-5 h-5" /> Verified Saves
              </Link>
            </>
          )}

          {user.role === UserRole.AUTHORIZER && (
            <>
              <Link 
                to={`${rolePath}?tab=queue`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'queue') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <FileCheck className="w-5 h-5" /> Verification Queue
              </Link>
              <Link 
                to={`${rolePath}?tab=audit`}
                onClick={() => setIsSidebarOpen(false)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive(rolePath, 'audit') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
              >
                <ClipboardCheck className="w-5 h-5" /> Audit Trail
              </Link>
            </>
          )}
          
          <div className="pt-6 pb-2 px-4 uppercase text-[10px] font-bold text-emerald-500 tracking-wider">
            Profile & Security
          </div>

          <Link 
            to="/profile" 
            onClick={() => setIsSidebarOpen(false)}
            className={`flex items-center gap-3 px-4 py-3 rounded-lg transition ${isActive('/profile') ? 'bg-emerald-800 text-white shadow-inner' : 'text-emerald-100/70 hover:bg-emerald-800/50 hover:text-white'}`}
          >
            <UserIcon className="w-5 h-5" />
            Account Settings
          </Link>
        </nav>

        <div className="p-4 border-t border-emerald-800">
          <div className="flex items-center gap-3 px-4 py-2">
            <div className="w-8 h-8 rounded-full bg-emerald-700 flex items-center justify-center relative">
              <UserIcon className="w-4 h-4" />
              {user.subscription.status === SubscriptionStatus.ACTIVE && (
                <div className="absolute -top-1 -right-1 bg-amber-400 rounded-full p-0.5 border border-emerald-900">
                  <Zap className="w-2 h-2 text-emerald-900 fill-current" />
                </div>
              )}
            </div>
            <div className="flex-1 overflow-hidden">
              <p className="text-sm font-medium truncate">{user.name}</p>
              <p className="text-[10px] text-emerald-400 truncate uppercase font-bold flex items-center gap-1">
                {user.subscription.tier} {user.subscription.status === SubscriptionStatus.EXPIRED ? '(Expired)' : ''}
              </p>
            </div>
          </div>
          <button 
            onClick={() => { onLogout(); navigate('/login'); }}
            className="w-full mt-4 flex items-center gap-3 px-4 py-3 text-emerald-300 hover:text-white hover:bg-red-500/20 rounded-lg transition"
          >
            <LogOut className="w-5 h-5" />
            Sign Out
          </button>
        </div>
      </aside>

      <main className="flex-1 flex flex-col min-w-0 h-screen overflow-auto">
        <header className="h-16 bg-white border-b border-slate-200 flex items-center justify-between px-4 md:px-6 sticky top-0 z-10 shrink-0">
          <div className="flex items-center gap-4">
            <button 
              onClick={() => setIsSidebarOpen(true)}
              className="md:hidden p-2 -ml-2 hover:bg-slate-100 rounded-lg transition"
            >
              <Menu className="w-6 h-6 text-slate-600" />
            </button>
            <h1 className="text-sm md:text-lg font-semibold text-slate-800 truncate">
              {displayRole} Portal
            </h1>
          </div>
          
          <div className="flex items-center gap-2 md:gap-4">
            {user.subscription.status === SubscriptionStatus.EXPIRED && (
               <div className="hidden lg:flex items-center gap-2 px-4 py-1.5 bg-red-50 border border-red-100 text-red-600 rounded-full text-[10px] font-black uppercase tracking-widest animate-pulse">
                  <AlertCircle className="w-3 h-3" /> Subscription Expired - Read Only Mode
               </div>
            )}
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input 
                type="text" 
                placeholder="Search Chain..." 
                className="pl-9 pr-4 py-2 bg-slate-100 border-none rounded-full text-sm w-32 lg:w-64 focus:ring-2 focus:ring-emerald-500 transition outline-none"
              />
            </div>
            <button className="p-2 text-slate-400 hover:text-emerald-600 transition relative">
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-red-500 rounded-full border-2 border-white"></span>
            </button>
          </div>
        </header>

        <div className="p-4 md:p-6 w-full max-w-[100vw] overflow-x-hidden">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default Layout;
