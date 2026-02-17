
import React, { useState } from 'react';
import { User, UserRole, DiscoverableNode, FoodCategory, TradeOrder, AuditRecord } from '../types';
import { MapPin, ShieldCheck, UserCheck, ArrowRight, Star, Globe } from 'lucide-react';
import NodeConnectionModal from './NodeConnectionModal';

interface NearbyNetworkProps {
  user: User;
  nodes: DiscoverableNode[];
  onConnectSuccess?: (order: TradeOrder) => void;
  onAuditLog?: (record: Omit<AuditRecord, 'id' | 'timestamp' | 'blockchainHash'>) => Promise<void>;
}

const NearbyNetwork: React.FC<NearbyNetworkProps> = ({ user, nodes, onConnectSuccess, onAuditLog }) => {
  const [selectedNode, setSelectedNode] = useState<DiscoverableNode | null>(null);

  const getDiscoveryTitle = () => {
    switch (user.role) {
      case UserRole.CONSUMER: return "Nearby Retailers";
      case UserRole.MANUFACTURER: return "Local Farmers & Transporters";
      case UserRole.RETAILER: return "Nearby Distributors";
      case UserRole.FARMER: return "Local Manufacturers & Transporters";
      default: return "Local Blockchain Nodes";
    }
  };

  const handleConnect = (node: DiscoverableNode) => {
    setSelectedNode(node);
  };

  const handleTransactionComplete = (order: TradeOrder) => {
    onConnectSuccess?.(order);
    setSelectedNode(null);
  };

  return (
    <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h3 className="text-xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
            <Globe className="w-6 h-6 text-emerald-600" />
            {getDiscoveryTitle()}
          </h3>
          <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Discover verified actors in your radius</p>
        </div>
        <div className="px-4 py-2 bg-emerald-50 rounded-full border border-emerald-100 flex items-center gap-2">
           <div className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></div>
           <span className="text-[10px] font-black text-emerald-700 uppercase tracking-widest">Live Node Scan</span>
        </div>
      </div>

      <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
        {nodes.map(node => (
          <div key={node.id} className="group bg-slate-50 p-6 rounded-3xl border border-slate-100 hover:border-emerald-300 hover:shadow-xl hover:shadow-emerald-600/5 transition-all duration-300 relative overflow-hidden">
             <div className="absolute top-0 right-0 p-4 opacity-[0.03] group-hover:opacity-10 transition-opacity">
                <Globe className="w-24 h-24" />
             </div>
             
             <div className="flex justify-between items-start mb-4">
                <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100">
                   <UserCheck className="w-6 h-6" />
                </div>
                <div className="flex flex-col items-end">
                   <div className="flex items-center gap-1 text-amber-500">
                      <Star className="w-3 h-3 fill-current" />
                      <span className="text-xs font-black">{node.trustScore}%</span>
                   </div>
                   <div className="text-[9px] font-black text-slate-400 uppercase tracking-tighter">Trust Score</div>
                </div>
             </div>

             <div>
                <h4 className="font-black text-slate-800 text-sm uppercase truncate mb-1">{node.name}</h4>
                <div className="flex items-center gap-1.5 text-slate-400 mb-4">
                   <MapPin className="w-3 h-3 text-red-500" />
                   <span className="text-[10px] font-bold uppercase">{node.distance} KM Away</span>
                </div>
             </div>

             <div className="flex flex-wrap gap-2 mb-6">
                {node.categories.slice(0, 2).map(cat => (
                   <span key={cat} className="px-2 py-0.5 bg-emerald-100/50 text-emerald-700 text-[8px] font-black uppercase rounded-lg tracking-widest">{cat}</span>
                ))}
             </div>

             <button 
                onClick={() => handleConnect(node)}
                className="w-full py-3 bg-white border border-slate-200 text-slate-600 group-hover:bg-emerald-600 group-hover:text-white group-hover:border-emerald-600 rounded-xl font-black uppercase text-[9px] tracking-widest transition-all flex items-center justify-center gap-2 active:scale-95"
             >
                Connect Node <ArrowRight className="w-3 h-3" />
             </button>
          </div>
        ))}
      </div>

      {selectedNode && (
        <NodeConnectionModal 
          currentNode={user} 
          targetNode={selectedNode} 
          onClose={() => setSelectedNode(null)} 
          onTransactionComplete={handleTransactionComplete}
          onAuditLog={onAuditLog}
        />
      )}
    </div>
  );
};

export default NearbyNetwork;
