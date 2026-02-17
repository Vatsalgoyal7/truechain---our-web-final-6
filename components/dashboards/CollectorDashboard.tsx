
import React, { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Wallet, UserRole, FoodCategory, TradeOrder, OrderStatus, SupplyChainEvent, AuditRecord } from '../../types';
import { getCurrentLocation } from '../../services/location';
import { 
  Truck, Map, Thermometer, Droplets, History, Navigation, CheckCircle, 
  AlertTriangle, MapPin, Gauge, ShieldCheck, Clock, Activity, ArrowRight, 
  RotateCcw, Loader2, Globe, Layers, Database, FilePlus, X, Box, CheckCircle2, ClipboardCheck, Zap, Info
} from 'lucide-react';
import ChainStatusPanel from '../ChainStatusPanel';
import { generateBlockchainHash } from '../../services/blockchain';
import { TrueChainDB } from '../../services/storage';

const CollectorDashboard: React.FC<{ user: User, wallet: Wallet, onAuditLog?: (record: Omit<AuditRecord, 'id' | 'timestamp' | 'blockchainHash'>) => Promise<void> }> = ({ user, wallet, onAuditLog }) => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'shipments';
  
  const [isSyncing, setIsSyncing] = useState(false);
  const [currentLoc, setCurrentLoc] = useState('Awaiting GPS...');
  const [jobs, setJobs] = useState<TradeOrder[]>([]);

  useEffect(() => {
    const allTrades = TrueChainDB.getTradeOrders();
    // Show available jobs (PENDING_COLLECTOR) or assigned jobs
    const myJobs = allTrades.filter(t => t.collectorId === user.id || (!t.collectorId && t.status === OrderStatus.PENDING_COLLECTOR));
    setJobs(myJobs);
  }, [user.id]);

  const handleAcceptJob = async (orderId: string) => {
    const allTrades = TrueChainDB.getTradeOrders();
    const trade = allTrades.find(t => t.id === orderId);
    if (!trade) return;

    // Vehicle validation logic
    const isDairy = trade.category === FoodCategory.DRINKS_DAIRY;
    if (isDairy && user.vehicleType !== 'Refrigerated Van' && user.vehicleType !== 'Cold Storage Truck') {
      alert("CRITICAL ERROR: This job requires Cold-Chain transport. Your vehicle is not certified for Dairy products.");
      return;
    }

    const updated = allTrades.map(t => {
      if (t.id === orderId) {
        return { 
          ...t, 
          collectorId: user.id, 
          collectorName: user.name,
          status: OrderStatus.COLLECTOR_ASSIGNED,
          events: [...t.events, {
            type: 'COLLECTOR_JOINED',
            timestamp: new Date().toISOString(),
            location: { address: user.location?.address || 'Logistics Hub', lat: user.location?.lat || 0, lng: user.location?.lng || 0 },
            actorId: user.id,
            actorRole: user.role,
            blockchainHash: 'LOG-HASH-' + Math.random().toString(36).substr(2, 6)
          } as SupplyChainEvent]
        };
      }
      return t;
    });
    TrueChainDB.saveTradeOrders(updated);
    setJobs(updated.filter(t => t.collectorId === user.id || (!t.collectorId && t.status === OrderStatus.PENDING_COLLECTOR)));

    onAuditLog?.({
      actionType: 'LOGISTICS_JOB_ACCEPT',
      actorId: user.id,
      actorRole: UserRole.COLLECTOR,
      targetId: orderId,
      prevStatus: OrderStatus.PENDING_COLLECTOR,
      nextStatus: OrderStatus.COLLECTOR_ASSIGNED,
      details: `Claimed shipment for ${trade.assetName} (${trade.quantity} units). Route linkage secured.`
    });
  };

  const handleUpdateStatus = async (orderId: string, nextStatus: OrderStatus) => {
    const allTrades = TrueChainDB.getTradeOrders();
    const trade = allTrades.find(t => t.id === orderId);
    const updated = allTrades.map(t => {
      if (t.id === orderId) {
        const eventType = nextStatus === OrderStatus.IN_TRANSIT ? 'PICKUP' : 'DELIVERY';
        return { 
          ...t, 
          status: nextStatus,
          events: [...t.events, {
            type: eventType,
            timestamp: new Date().toISOString(),
            location: { address: 'Node Point Check', lat: 0, lng: 0 },
            actorId: user.id,
            actorRole: user.role,
            notes: `${eventType} confirmed via TrueChain Protocol. Environment stable.`,
            blockchainHash: 'EVT-HASH-' + Math.random().toString(36).substr(2, 6)
          } as SupplyChainEvent]
        };
      }
      return t;
    });
    TrueChainDB.saveTradeOrders(updated);
    setJobs(updated.filter(t => t.collectorId === user.id || (!t.collectorId && t.status === OrderStatus.PENDING_COLLECTOR)));

    onAuditLog?.({
      actionType: 'LOGISTICS_STATUS_CHANGE',
      actorId: user.id,
      actorRole: UserRole.COLLECTOR,
      targetId: orderId,
      prevStatus: trade?.status || 'Unknown',
      nextStatus: nextStatus,
      details: `Shipment status progressed to ${nextStatus}. Chain environmental logs synced.`
    });
  };

  const myHistory = jobs.filter(j => j.status === OrderStatus.COMPLETED);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ChainStatusPanel user={user} wallet={wallet} />

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 mb-8">
           <div>
              <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                 <Truck className="w-6 h-6 text-blue-600" />
                 Transporter Job Board
              </h3>
              <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Accept verified deliveries across the chain</p>
           </div>
           <div className="flex items-center gap-3 bg-slate-50 p-3 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-blue-600 shadow-sm"><Info className="w-5 h-5" /></div>
              <div>
                 <div className="text-[10px] font-black text-slate-400 uppercase">Vehicle Registered</div>
                 <div className="text-xs font-black text-slate-800 uppercase tracking-tight">{user.vehicleType || 'Unknown'} / {user.vehicleNo || '---'}</div>
              </div>
           </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {jobs.filter(j => j.status !== OrderStatus.COMPLETED).length === 0 ? (
            <div className="text-center py-20 bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
               <Zap className="w-12 h-12 text-slate-200 mx-auto mb-4" />
               <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No active shipments in your radius</p>
            </div>
          ) : jobs.filter(j => j.status !== OrderStatus.COMPLETED).map(job => (
            <div key={job.id} className="p-6 bg-slate-50 border border-slate-100 hover:border-blue-200 transition-all rounded-3xl flex flex-col lg:flex-row justify-between items-center gap-6 group">
              <div className="flex items-center gap-4 flex-1">
                <div className="p-4 bg-white rounded-2xl shadow-sm text-blue-600"><Box className="w-6 h-6" /></div>
                <div>
                   <div className="flex items-center gap-2 mb-1">
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-600 text-[8px] font-black uppercase rounded tracking-widest">{job.category}</span>
                      <span className="text-[9px] font-mono text-slate-400 font-bold uppercase tracking-widest">ORD: {job.id}</span>
                   </div>
                   <h4 className="font-black text-slate-800 text-sm uppercase">{job.assetName}</h4>
                   <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">From: {job.sellerName} → To: {job.buyerName}</p>
                </div>
              </div>

              <div className="flex items-center gap-6 shrink-0">
                <div className="text-right">
                   <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Job Status</div>
                   <div className={`text-[10px] font-black uppercase ${job.status === OrderStatus.PENDING_COLLECTOR ? 'text-amber-500' : 'text-blue-600'}`}>{job.status === OrderStatus.PENDING_COLLECTOR ? 'Awaiting Transporter' : job.status}</div>
                </div>
                
                {job.status === OrderStatus.PENDING_COLLECTOR && (
                  <button onClick={() => handleAcceptJob(job.id)} className="px-8 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-blue-600/20 transition-all active:scale-95">Claim Route</button>
                )}
                {job.status === OrderStatus.COLLECTOR_ASSIGNED && (
                  <button onClick={() => handleUpdateStatus(job.id, OrderStatus.IN_TRANSIT)} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 transition-all active:scale-95">Sign Pickup</button>
                )}
                {job.status === OrderStatus.IN_TRANSIT && (
                  <button onClick={() => handleUpdateStatus(job.id, OrderStatus.DELIVERED)} className="px-8 py-3 bg-slate-900 hover:bg-black text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95">Sign Delivery</button>
                )}
                {job.status === OrderStatus.DELIVERED && (
                   <div className="flex items-center gap-2 text-emerald-600 bg-emerald-50 px-4 py-2 rounded-xl border border-emerald-100">
                      <CheckCircle2 className="w-4 h-4" />
                      <span className="text-[9px] font-black uppercase tracking-widest">Handover Pending</span>
                   </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {currentTab === 'shipments' && (
        <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
           <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
              <History className="w-5 h-5 text-blue-600" />
              Chain Transporter History
           </h3>
           <div className="overflow-x-auto">
              <table className="w-full text-left">
                 <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-[0.2em]">
                    <tr>
                       <th className="px-6 py-4">Shipment ID</th>
                       <th className="px-6 py-4">Item Type</th>
                       <th className="px-6 py-4">Route Leg</th>
                       <th className="px-6 py-4 text-right">Integrity Score</th>
                    </tr>
                 </thead>
                 <tbody className="divide-y divide-slate-50">
                    {myHistory.map(order => (
                       <tr key={order.id} className="hover:bg-slate-50 transition">
                          <td className="px-6 py-4 font-mono text-xs text-slate-400 font-bold">{order.id}</td>
                          <td className="px-6 py-4 text-[10px] font-black text-slate-600 uppercase">{order.assetName}</td>
                          <td className="px-6 py-4 text-[9px] font-bold text-slate-400 uppercase">{order.sellerName} → {order.buyerName}</td>
                          <td className="px-6 py-4 text-right">
                             <div className="flex items-center justify-end gap-1.5 text-emerald-600">
                                <ShieldCheck className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-black">100% Verified</span>
                             </div>
                          </td>
                       </tr>
                    ))}
                    {myHistory.length === 0 && (
                       <tr><td colSpan={4} className="py-20 text-center text-slate-300 text-[10px] font-black uppercase italic">No completed nodes found</td></tr>
                    )}
                 </tbody>
              </table>
           </div>
        </div>
      )}
    </div>
  );
};

export default CollectorDashboard;
