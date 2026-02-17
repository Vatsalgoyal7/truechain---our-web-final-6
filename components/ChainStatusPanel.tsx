import React from 'react';
import { User, UserRole, Wallet, ChainTransaction, TransactionType } from '../types';
import { 
  ArrowRight, ShieldCheck, Wallet as WalletIcon, TrendingUp, 
  Clock, Activity, AlertCircle, CheckCircle2, Lock 
} from 'lucide-react';

interface ChainStatusPanelProps {
  user: User;
  wallet: Wallet;
}

const ChainStatusPanel: React.FC<ChainStatusPanelProps> = ({ user, wallet }) => {
  const getDependencyStatus = () => {
    switch (user.role) {
      case UserRole.FARMER:
        return { prev: 'Environment', next: 'Manufacturer', readiness: 'High', action: 'List Batches' };
      case UserRole.MANUFACTURER:
        return { prev: 'Farmer', next: 'Collector', readiness: 'Medium', action: 'Buy Raw Material' };
      case UserRole.COLLECTOR:
        return { prev: 'Mfr / Dist', next: 'Dist / Retail', readiness: 'Active', action: 'Verify Shipment' };
      case UserRole.DISTRIBUTOR:
        return { prev: 'Collector', next: 'Retailer', readiness: 'Stable', action: 'Wholesale Dispatch' };
      case UserRole.RETAILER:
        return { prev: 'Distributor', next: 'Consumer', readiness: 'Peak', action: 'Mark Shelf Ready' };
      default:
        return null;
    }
  };

  const status = getDependencyStatus();
  if (!status) return null;

  const totalEarnings = wallet.transactionHistory
    .filter(t => t.toId === user.id)
    .reduce((acc, curr) => acc + curr.amount, 0);

  return (
    <div className="bg-white rounded-[2rem] border border-slate-200 shadow-sm overflow-hidden mb-8 animate-in slide-in-from-top-4 duration-500">
      <div className="bg-slate-900 p-6 text-white flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 bg-emerald-500/20 rounded-2xl flex items-center justify-center border border-emerald-500/30">
            <Activity className="w-6 h-6 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-widest">Chain Economic Hub</h3>
            <div className="flex items-center gap-2 mt-1">
              <span className="px-2 py-0.5 bg-emerald-600 text-[8px] font-black uppercase rounded tracking-widest">Active Earning Node</span>
              <span className="text-slate-400 text-[10px] font-mono">Sync: {new Date().toLocaleTimeString()}</span>
            </div>
          </div>
        </div>

        <div className="flex gap-8">
           <div className="text-right">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Total Chain Yield</div>
              <div className="text-xl font-black text-emerald-400">₹{totalEarnings.toLocaleString()}</div>
           </div>
           <div className="text-right">
              <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Payment Escrow</div>
              <div className="text-xl font-black text-amber-400 flex items-center gap-2 justify-end">
                <Lock className="w-4 h-4" /> ₹{wallet.pendingBalance.toLocaleString()}
              </div>
           </div>
        </div>
      </div>

      <div className="p-8 grid md:grid-cols-3 gap-8 items-center bg-slate-50/50">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <ShieldCheck className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Upstream Node</div>
            <div className="font-black text-slate-800 text-sm uppercase">{status.prev} Verified</div>
          </div>
        </div>

        <div className="flex flex-col items-center justify-center gap-2">
           <div className="w-full flex items-center gap-2 px-4 py-2 bg-white rounded-full border border-slate-200 shadow-inner">
             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></div>
             <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest flex-1 text-center">Node Dependency Pipeline</span>
             <ArrowRight className="w-3 h-3 text-slate-400" />
           </div>
        </div>

        <div className="flex items-center gap-4 justify-end">
          <div className="text-right">
            <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">Downstream Capacity</div>
            <div className="font-black text-slate-800 text-sm uppercase">{status.next} Ready</div>
          </div>
          <div className="p-3 bg-white rounded-xl shadow-sm border border-slate-100">
            <TrendingUp className="w-5 h-5 text-emerald-500" />
          </div>
        </div>
      </div>

      <div className="px-8 py-4 bg-emerald-50 border-t border-emerald-100 flex items-center justify-between">
        <div className="flex items-center gap-2 text-emerald-700">
          <CheckCircle2 className="w-4 h-4" />
          <span className="text-[10px] font-black uppercase tracking-widest">System Instruction: {status.action} to unlock next tier earnings.</span>
        </div>
        <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">
          Market Connectivity: {status.readiness}
        </div>
      </div>
    </div>
  );
};

export default ChainStatusPanel;