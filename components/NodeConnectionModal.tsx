
import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, MapPin, Star, Handshake, ChevronRight, Zap, Info, Package, Tractor, Truck, Calculator, FileText, CheckCircle2, Loader2 } from 'lucide-react';
import { User, UserRole, DiscoverableNode, HarvestBatch, Product, FoodCategory, OrderStatus, TradeOrder, SmartContract, AuditRecord } from '../types';
import { TrueChainDB } from '../services/storage';

interface NodeConnectionModalProps {
  currentNode: User;
  targetNode: DiscoverableNode;
  onClose: () => void;
  onTransactionComplete: (order: TradeOrder) => void;
  onAuditLog?: (record: Omit<AuditRecord, 'id' | 'timestamp' | 'blockchainHash'>) => Promise<void>;
}

const NodeConnectionModal: React.FC<NodeConnectionModalProps> = ({ currentNode, targetNode, onClose, onTransactionComplete, onAuditLog }) => {
  const [step, setStep] = useState<'PROFILE' | 'NEGOTIATE' | 'CONFIRM'>('PROFILE');
  const [negotiatedPrice, setNegotiatedPrice] = useState<number>(0);
  const [negotiatedQuantity, setNegotiatedQuantity] = useState<number>(0);
  const [selectedItem, setSelectedItem] = useState<HarvestBatch | Product | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Fetch target node's active inventory from DB
  const inventory = useMemo(() => {
    if (targetNode.role === UserRole.FARMER) {
      return TrueChainDB.getBatches().filter(b => b.farmerId === targetNode.id || b.farmerName === targetNode.name);
    } else if (targetNode.role === UserRole.MANUFACTURER || targetNode.role === UserRole.RETAILER) {
      return TrueChainDB.getProducts().filter(p => p.manufacturerId === targetNode.id);
    }
    return [];
  }, [targetNode]);

  const handleSelectItem = (item: any) => {
    setSelectedItem(item);
    setNegotiatedPrice(item.pricePerUnit || 45);
    setNegotiatedQuantity(Math.min(100, item.currentQuantity || 0));
    setStep('NEGOTIATE');
    
    onAuditLog?.({
      actionType: 'NEGOTIATION_START',
      actorId: currentNode.id,
      actorRole: currentNode.role,
      targetId: item.id,
      prevStatus: 'Profile Review',
      nextStatus: 'In Negotiation',
      details: `Started price/quantity negotiation for ${item.cropName || item.name} from ${targetNode.name}.`
    });
  };

  const handleInitiateTrade = async () => {
    setIsProcessing(true);
    // Simulate chain latency
    await new Promise(r => setTimeout(r, 1500));

    const orderId = 'ORD-' + Math.random().toString(36).substr(2, 6).toUpperCase();
    
    const contract: SmartContract = {
      contractId: 'CNTR-' + orderId,
      terms: `B2B Agreement between ${currentNode.name} and ${targetNode.name}. Price set at ₹${negotiatedPrice}/unit for ${negotiatedQuantity} units.`,
      complianceRef: 'TC-PROT-2025-GEN',
      penaltyClauses: '15% Slash on non-delivery. Quality verification mandatory.',
      sellerId: targetNode.role === UserRole.FARMER ? targetNode.id : currentNode.id,
      buyerId: targetNode.role === UserRole.MANUFACTURER ? targetNode.id : currentNode.id,
      sellerSignature: 'CHAIN-SIG-' + targetNode.id,
      buyerSignature: 'CHAIN-SIG-' + currentNode.id,
      timestamp: new Date().toISOString(),
      validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
    };

    const newOrder: TradeOrder = {
      id: orderId,
      sellerId: targetNode.role === UserRole.FARMER ? targetNode.id : currentNode.id,
      sellerName: targetNode.role === UserRole.FARMER ? targetNode.name : currentNode.name,
      buyerId: targetNode.role === UserRole.MANUFACTURER ? targetNode.id : currentNode.id,
      buyerName: targetNode.role === UserRole.MANUFACTURER ? targetNode.name : currentNode.name,
      assetId: selectedItem?.id || 'GEN-ASSET',
      assetType: targetNode.role === UserRole.FARMER ? 'Batch' : 'SKU',
      assetName: (selectedItem as any)?.cropName || (selectedItem as any)?.name || 'Generic Asset',
      quantity: negotiatedQuantity,
      unitPrice: negotiatedPrice,
      totalPrice: negotiatedPrice * negotiatedQuantity,
      status: OrderStatus.DISCOVERY_CONFIRMED,
      contract,
      events: [{
        type: 'ORDER_CREATED',
        timestamp: new Date().toISOString(),
        location: { address: 'TrueChain Virtual Hub', lat: 0, lng: 0 },
        actorId: currentNode.id,
        actorRole: currentNode.role,
        blockchainHash: 'INIT-' + Math.random().toString(36).substr(2, 8)
      }],
      isVerified: true,
      category: targetNode.categories[0] || FoodCategory.PACKAGED,
      blockchainHash: 'TX-' + Math.random().toString(36).substr(2, 12).toUpperCase()
    };

    onAuditLog?.({
      actionType: 'SMART_CONTRACT_INIT',
      actorId: currentNode.id,
      actorRole: currentNode.role,
      targetId: orderId,
      prevStatus: 'Negotiation',
      nextStatus: OrderStatus.DISCOVERY_CONFIRMED,
      details: `Generated digital agreement for ₹${newOrder.totalPrice}. Linked to asset ${newOrder.assetId}.`
    });

    setIsProcessing(false);
    onTransactionComplete(newOrder);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-6">
            <div className="w-14 h-14 bg-emerald-500 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-500/20">
              <Handshake className="w-8 h-8 text-white" />
            </div>
            <div>
              <h3 className="text-2xl font-black uppercase tracking-tight">Direct Node Connection</h3>
              <div className="flex items-center gap-3 mt-1">
                <span className="px-2 py-0.5 bg-emerald-600 text-[8px] font-black uppercase rounded tracking-widest">Protocol V1.0 Active</span>
                <span className="text-slate-400 text-[10px] font-mono uppercase tracking-widest">Channel: {currentNode.id} ↔ {targetNode.id}</span>
              </div>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6 text-slate-400 hover:text-white" /></button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-10 space-y-10 no-scrollbar">
          {step === 'PROFILE' && (
            <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Target Node Profile</h4>
                  <div className="bg-slate-50 p-8 rounded-[2rem] border border-slate-100 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Operator</span>
                      <span className="text-sm font-black text-slate-800 uppercase">{targetNode.name}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Role Tier</span>
                      <span className="px-2 py-0.5 bg-blue-100 text-blue-700 text-[8px] font-black uppercase rounded-lg border border-blue-200">{targetNode.role}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Proximity</span>
                      <div className="flex items-center gap-1.5 text-slate-800 font-black text-sm">
                        <MapPin className="w-3 h-3 text-red-500" /> {targetNode.distance} KM
                      </div>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-xs font-bold text-slate-500 uppercase">Reputation</span>
                      <div className="flex items-center gap-1.5 text-amber-500 font-black text-sm">
                        <Star className="w-4 h-4 fill-current" /> {targetNode.trustScore}%
                      </div>
                    </div>
                  </div>
                </div>

                <div className="space-y-6">
                  <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Chain Validation</h4>
                  <div className="p-6 bg-emerald-50 rounded-[2rem] border border-emerald-100 flex items-start gap-4">
                    <ShieldCheck className="w-6 h-6 text-emerald-600 shrink-0" />
                    <div>
                      <h5 className="text-[11px] font-black text-emerald-800 uppercase mb-1">Identity Verified</h5>
                      <p className="text-[10px] text-emerald-700 font-medium leading-relaxed uppercase">Node signature matches regulatory database. Smart-contracts initiated via this channel are legally binding on-chain.</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Active Inventory Ledger</h4>
                {inventory.length === 0 ? (
                  <div className="py-12 text-center bg-slate-50 rounded-3xl border-2 border-dashed border-slate-200">
                    <Package className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                    <p className="text-[10px] font-black text-slate-400 uppercase">No active tradeable assets found on this node</p>
                  </div>
                ) : (
                  <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
                    {inventory.map((item: any) => (
                      <div key={item.id} className="bg-white p-5 rounded-3xl border border-slate-100 shadow-sm hover:border-emerald-400 hover:shadow-md transition-all group">
                        <div className="flex justify-between items-start mb-3">
                          <div className="p-2 bg-slate-50 rounded-xl text-slate-400 group-hover:text-emerald-600 group-hover:bg-emerald-50 transition-colors">
                            {targetNode.role === UserRole.FARMER ? <Tractor className="w-5 h-5" /> : <Package className="w-5 h-5" />}
                          </div>
                          <span className="text-[8px] font-mono text-slate-300 uppercase">ID: {item.id}</span>
                        </div>
                        <h5 className="font-black text-slate-800 text-sm uppercase truncate mb-1">{item.cropName || item.name}</h5>
                        <div className="text-[10px] font-bold text-slate-400 uppercase mb-4">{item.category}</div>
                        <div className="flex justify-between items-end border-t border-slate-50 pt-4">
                          <div>
                            <div className="text-[8px] font-black text-slate-400 uppercase">Listed Price</div>
                            <div className="text-xs font-black text-emerald-600">₹{item.pricePerUnit || 45}/U</div>
                          </div>
                          <button 
                            onClick={() => handleSelectItem(item)}
                            className="p-2 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition-colors shadow-lg active:scale-90"
                          >
                            <ChevronRight className="w-4 h-4" />
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {step === 'NEGOTIATE' && selectedItem && (
            <div className="space-y-10 animate-in slide-in-from-right-4 duration-300">
              <button onClick={() => setStep('PROFILE')} className="text-[10px] font-black text-slate-400 uppercase hover:text-slate-800 transition flex items-center gap-2">
                <ChevronRight className="w-3 h-3 rotate-180" /> Back to Profile
              </button>

              <div className="flex flex-col md:flex-row gap-8 items-center bg-slate-900 p-8 rounded-[2.5rem] text-white overflow-hidden relative">
                <div className="absolute top-0 right-0 p-8 opacity-5"><Zap className="w-48 h-48" /></div>
                <div className="w-24 h-24 bg-white/10 rounded-[2rem] flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
                  {targetNode.role === UserRole.FARMER ? <Tractor className="w-10 h-10 text-emerald-400" /> : <Package className="w-10 h-10 text-emerald-400" />}
                </div>
                <div className="flex-1 text-center md:text-left">
                  <h4 className="text-2xl font-black uppercase tracking-tight italic">Negotiating: {(selectedItem as any).cropName || (selectedItem as any).name}</h4>
                  <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sourcing from {targetNode.name}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-10">
                <div className="space-y-6 bg-slate-50 p-8 rounded-[2rem] border border-slate-200 shadow-inner">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2 flex items-center gap-2">
                     <Calculator className="w-4 h-4" /> Transaction Parameters
                   </h5>
                   <div className="space-y-6">
                      <div className="space-y-2">
                         <div className="flex justify-between items-end">
                            <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Negotiated Price (₹/Unit)</label>
                            <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Base: ₹{(selectedItem as any).pricePerUnit || 45}</span>
                         </div>
                         <input 
                           type="number" 
                           value={negotiatedPrice} 
                           onChange={e => setNegotiatedPrice(parseFloat(e.target.value))}
                           className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                         />
                      </div>
                      <div className="space-y-2">
                         <div className="flex justify-between items-end">
                           <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Order Quantity</label>
                           <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest">Available: {(selectedItem as any).currentQuantity}</span>
                         </div>
                         <input 
                           type="number" 
                           value={negotiatedQuantity} 
                           onChange={e => setNegotiatedQuantity(Math.min((selectedItem as any).currentQuantity, parseFloat(e.target.value)))}
                           className="w-full p-4 bg-white border border-slate-200 rounded-2xl font-black text-lg text-slate-800 outline-none focus:ring-4 focus:ring-emerald-500/10 transition-all" 
                         />
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                   <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                     <FileText className="w-4 h-4" /> Financial Summary
                   </h5>
                   <div className="bg-emerald-900 p-8 rounded-[2rem] text-white shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-10"><Zap className="w-16 h-16" /></div>
                      <div className="space-y-4">
                         <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tight">Total Contract Value</span><span className="text-2xl font-black">₹{(negotiatedPrice * negotiatedQuantity).toLocaleString()}</span></div>
                         <div className="flex justify-between items-center"><span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tight">System Fee (0.5%)</span><span className="text-xs font-black">₹{(negotiatedPrice * negotiatedQuantity * 0.005).toFixed(2)}</span></div>
                         <div className="pt-4 border-t border-emerald-800 flex justify-between items-center"><span className="text-[11px] font-bold text-emerald-400 uppercase tracking-tight">Est. Logistics Fee</span><span className="text-xs font-black">₹850.00</span></div>
                      </div>
                   </div>
                   <div className="p-4 bg-blue-50 border border-blue-100 rounded-2xl flex items-start gap-3">
                      <Info className="w-5 h-5 text-blue-600 shrink-0" />
                      <p className="text-[9px] text-blue-700 font-medium leading-relaxed uppercase italic">Final price includes blockchain gas fees for manifest anchoring.</p>
                   </div>
                </div>
              </div>
            </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
          {step === 'PROFILE' ? (
            <>
              <button onClick={onClose} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-50">Cancel Request</button>
              <button disabled={inventory.length === 0} onClick={() => setStep('NEGOTIATE')} className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                 Start Transaction Negotiation <ChevronRight className="w-5 h-5" />
              </button>
            </>
          ) : (
            <>
              <button onClick={() => setStep('PROFILE')} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-50">Cancel Negotiation</button>
              <button onClick={handleInitiateTrade} disabled={isProcessing || negotiatedQuantity <= 0} className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95 disabled:opacity-50">
                {isProcessing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Zap className="w-5 h-5 text-emerald-400" />} 
                {isProcessing ? 'Anchoring Contract...' : 'Authorize & Commit to Ledger'}
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default NodeConnectionModal;
