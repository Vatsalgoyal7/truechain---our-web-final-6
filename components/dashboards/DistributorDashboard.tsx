
import React, { useState, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, Product, Wallet, UserRole, FoodCategory, DiscoverableNode, LogisticsManifest } from '../../types';
import { Package, Scan, ArrowUpRight, AlertTriangle, Activity, BarChart2, Truck, Users, Thermometer, Droplets, CheckCircle, ShieldCheck, History, Box, Layers, Globe, FileCheck, Loader2, X, BadgeCheck, Microscope, Info } from 'lucide-react';
import InventoryControls from '../inventory/InventoryControls';
import ChainStatusPanel from '../ChainStatusPanel';
import NearbyNetwork from '../NearbyNetwork';
import { generateBlockchainHash } from '../../services/blockchain';
import { TrueChainDB } from '../../services/storage';

interface DistributorDashboardProps {
  user: User;
  products: Product[];
  onUpdateQuantity: (id: string, delta: number, reason: any) => void;
  onDeleteProduct: (id: string) => void;
  wallet: Wallet;
}

const DistributorDashboard: React.FC<DistributorDashboardProps> = ({ user, products, onUpdateQuantity, onDeleteProduct, wallet }) => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'inventory';
  const [showManifestModal, setShowManifestModal] = useState<string | null>(null);
  const [isDeploying, setIsDeploying] = useState(false);
  const [viewingVerifiedReport, setViewingVerifiedReport] = useState<any | null>(null);

  // Fetch verified manifests from global store for upstream trust context
  const verifiedManifests = useMemo(() => TrueChainDB.getVerifiedManifests(), []);

  // NEARBY MOCK NODES
  const nearbyNodes: DiscoverableNode[] = [
    { id: 'R1', name: 'Metro Fresh Mart', role: UserRole.RETAILER, distance: 3.1, trustScore: 97, categories: [FoodCategory.FRUITS_VEG, FoodCategory.BEVERAGES] },
    { id: 'R2', name: 'Downtown Organic Co', role: UserRole.RETAILER, distance: 8.5, trustScore: 95, categories: [FoodCategory.ORGANIC, FoodCategory.PACKAGED] },
  ];

  const handleCreateLogisticsManifest = async (productId: string) => {
    const product = products.find(p => p.id === productId);
    if (!product) return;

    setIsDeploying(true);
    const manifestData: Omit<LogisticsManifest, 'blockchainHash'> = {
       id: 'LM' + Math.random().toString(36).substr(2, 6).toUpperCase(),
       handlerId: user.id,
       targetId: productId,
       storageType: 'Cold',
       transportConditions: 'Maintain 4°C ± 1°C. Refrigerated cold-chain protocol active.',
       dispatchTime: new Date().toISOString(),
       quantityShipped: product.currentQuantity
    };

    const hash = await generateBlockchainHash(manifestData);
    const logisticsManifest: LogisticsManifest = { ...manifestData, blockchainHash: hash };

    console.log("Logistics Manifest Created:", logisticsManifest);
    
    await new Promise(r => setTimeout(r, 1200));
    setIsDeploying(false);
    setShowManifestModal(null);
  };

  const nearExpiryCount = products.filter(p => {
    const expiry = new Date(p.expiryDate).getTime();
    const now = new Date().getTime();
    return (expiry - now) < (30 * 24 * 60 * 60 * 1000) && (expiry - now) > 0;
  }).length;

  const lowStockProducts = products.filter(p => p.currentQuantity < 50);

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ChainStatusPanel user={user} wallet={wallet} />

      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
        <div className="absolute top-0 right-0 p-8 opacity-5"><BarChart2 className="w-48 h-48" /></div>
        <div className="relative z-10">
          <h2 className="text-2xl font-black text-slate-800 uppercase tracking-widest mb-6">Logistics Command Center</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-6 bg-slate-50 rounded-2xl border border-slate-100 flex flex-col justify-between">
              <div className="text-slate-400 text-[9px] font-black uppercase tracking-widest">Global Inventory</div>
              <div className="text-2xl font-black text-slate-800 mt-2">{products.reduce((acc, p) => acc + p.currentQuantity, 0)} <span className="text-xs font-medium text-slate-400">SKUs</span></div>
            </div>
            <div className={`p-6 rounded-2xl border flex flex-col justify-between ${nearExpiryCount > 0 ? 'bg-red-50 border-red-100' : 'bg-emerald-50 border-emerald-100'}`}>
              <div className={`text-[9px] font-black uppercase tracking-widest flex items-center gap-1 ${nearExpiryCount > 0 ? 'text-red-600' : 'text-emerald-600'}`}>
                {nearExpiryCount > 0 ? <AlertTriangle className="w-3 h-3" /> : <CheckCircle className="w-3 h-3" />} Expiry Health
              </div>
              <div className={`text-2xl font-black mt-2 ${nearExpiryCount > 0 ? 'text-red-700' : 'text-emerald-700'}`}>{nearExpiryCount} Critical</div>
            </div>
            <div className="p-6 bg-amber-50 rounded-2xl border border-amber-100 flex flex-col justify-between">
              <div className="text-amber-600 text-[9px] font-black uppercase tracking-widest">Low Stock Alerts</div>
              <div className="text-2xl font-black text-amber-700 mt-2">{lowStockProducts.length} Items</div>
            </div>
            <div className="p-6 bg-blue-50 rounded-2xl border border-blue-100 flex flex-col justify-between">
              <div className="text-blue-600 text-[9px] font-black uppercase tracking-widest">Active Dispatch</div>
              <div className="text-2xl font-black text-blue-700 mt-2">14 Units</div>
            </div>
          </div>
        </div>
      </div>

      {currentTab === 'inventory' && (
        <div className="space-y-8">
           <NearbyNetwork user={user} nodes={nearbyNodes} />

           <div className="bg-white rounded-[2rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 flex justify-between items-center bg-slate-50/50">
                <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest flex items-center gap-2">
                   <Activity className="w-4 h-4 text-emerald-600" />
                   Logistics Dispatch Manifest
                </h3>
              </div>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase">
                    <tr>
                      <th className="px-6 py-4">SKU & Category</th>
                      <th className="px-6 py-4">Quantity</th>
                      <th className="px-6 py-4">Upstream Trust</th>
                      <th className="px-6 py-4 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {products.map(p => {
                        const verifiedReport = verifiedManifests[p.batchId];
                        return (
                          <tr key={p.id} className="hover:bg-slate-50 transition group">
                            <td className="px-6 py-4">
                              <div className="font-black text-slate-800 text-sm uppercase truncate w-32">{p.name}</div>
                              <div className="text-[9px] font-black uppercase text-slate-400 tracking-tighter">{p.category}</div>
                            </td>
                            <td className="px-6 py-4">
                              <div className="text-xs font-black text-slate-600">{p.currentQuantity} Units</div>
                            </td>
                            <td className="px-6 py-4">
                               {verifiedReport ? (
                                 <button 
                                   onClick={() => setViewingVerifiedReport({ ...verifiedReport, assetName: p.name, batchId: p.batchId })}
                                   className="flex items-center gap-1.5 text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100 hover:bg-emerald-100 transition-colors active:scale-95"
                                 >
                                    <BadgeCheck className="w-3.5 h-3.5" />
                                    <span className="text-[9px] font-black uppercase tracking-widest">Upstream Verified</span>
                                 </button>
                               ) : (
                                 <span className="flex items-center gap-1.5 text-slate-400">
                                    <FileCheck className="w-3.5 h-3.5" />
                                    <span className="text-[10px] font-black uppercase tracking-widest">Standard Manifest</span>
                                 </span>
                               )}
                            </td>
                            <td className="px-6 py-4 text-right">
                               <button 
                                 onClick={() => setShowManifestModal(p.id)}
                                 className="px-4 py-2 bg-slate-900 text-white rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-blue-600 transition-all shadow-lg active:scale-95"
                               >
                                 Dispatch Node
                               </button>
                            </td>
                          </tr>
                        );
                    })}
                  </tbody>
                </table>
              </div>
           </div>
        </div>
      )}

      {currentTab === 'telemetry' && (
        <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm animate-in zoom-in-95">
           <h3 className="font-black text-slate-800 text-xs uppercase tracking-widest mb-8 flex items-center gap-2">
              <Thermometer className="w-5 h-5 text-blue-600" />
              Storage Environment History
           </h3>
           <div className="space-y-4">
              {[
                { node: 'Cold Room A', temp: '4.1°C', humidity: '42%', time: 'Last 10m', status: 'Stable' },
                { node: 'Main Warehouse', temp: '22.5°C', humidity: '15%', time: 'Last 5m', status: 'Stable' },
                { node: 'Refrigerated Unit 4', temp: '-2.0°C', humidity: '80%', time: 'Last 2m', status: 'Active' },
              ].map((log, i) => (
                <div key={i} className="flex flex-col md:flex-row md:items-center justify-between p-6 bg-slate-50 border border-slate-100 rounded-3xl gap-4">
                   <div className="flex items-center gap-4">
                      <div className="p-3 bg-white rounded-2xl shadow-sm"><Box className="w-5 h-5 text-slate-400" /></div>
                      <div>
                         <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{log.time}</div>
                         <div className="text-lg font-black text-slate-800">{log.node}</div>
                      </div>
                   </div>
                   <div className="flex gap-8">
                      <div className="text-center">
                         <div className="text-[9px] font-black text-slate-400 uppercase">Temp</div>
                         <div className="text-sm font-black text-blue-600">{log.temp}</div>
                      </div>
                      <div className="text-center">
                         <div className="text-[9px] font-black text-slate-400 uppercase">Humidity</div>
                         <div className="text-sm font-black text-blue-600">{log.humidity}</div>
                      </div>
                      <div className="text-center">
                         <div className="text-[9px] font-black text-slate-400 uppercase">Status</div>
                         <div className="text-[9px] font-black uppercase tracking-widest text-emerald-600 px-2 py-0.5 bg-emerald-50 rounded border border-emerald-100">{log.status}</div>
                      </div>
                   </div>
                </div>
              ))}
           </div>
        </div>
      )}

      {/* DISPATCH MANIFEST MODAL */}
      {showManifestModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
           <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
                 <h3 className="text-xl font-black uppercase tracking-tight">Logistics Manifest Leg</h3>
                 <button onClick={() => setShowManifestModal(null)}><X className="w-6 h-6 text-slate-400 hover:text-white transition" /></button>
              </div>
              <div className="p-8 space-y-6">
                 <div className="p-6 bg-blue-50 rounded-3xl border border-blue-100 flex items-center gap-4">
                    <Truck className="w-10 h-10 text-blue-600" />
                    <div>
                       <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest">Dispatching SKU</div>
                       <div className="text-lg font-black text-slate-800 uppercase">{showManifestModal}</div>
                    </div>
                 </div>

                 <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Storage Type</label>
                          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm">
                             <option>Cold Chain</option>
                             <option>Dry Ambient</option>
                             <option>Special Handling</option>
                          </select>
                       </div>
                       <div className="space-y-2">
                          <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Transport Fleet</label>
                          <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm">
                             <option>Fleet Alpha (Refrigerated)</option>
                             <option>Fleet Delta (Dry)</option>
                          </select>
                       </div>
                    </div>
                    <div className="space-y-2">
                       <label className="text-[10px] font-black text-slate-400 uppercase ml-1 tracking-widest">Approx. Delivery Window</label>
                       <input type="datetime-local" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none text-sm" />
                    </div>
                 </div>

                 <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                    <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                    <p className="text-[9px] text-emerald-800 font-medium leading-relaxed uppercase">Dispatch will auto-link this Logistics Manifest to Product #{showManifestModal}. The Retailer node will verify receipt on arrival.</p>
                 </div>

                 <button 
                   onClick={() => handleCreateLogisticsManifest(showManifestModal)}
                   disabled={isDeploying}
                   className="w-full py-5 bg-blue-600 hover:bg-blue-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition shadow-xl active:scale-95 disabled:opacity-50"
                 >
                   {isDeploying ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'Confirm Dispatch & Sign'}
                 </button>
              </div>
           </div>
        </div>
      )}

      {/* UPSTREAM VERIFIED REPORT MODAL (Read-Only) */}
      {viewingVerifiedReport && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-emerald-950 p-10 text-white flex justify-between items-center relative shrink-0">
                 <div className="absolute top-0 right-0 p-8 opacity-10"><Microscope className="w-32 h-32" /></div>
                 <div className="relative z-10 flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                       <BadgeCheck className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-xl font-black uppercase tracking-tight">Upstream Verification Report</h3>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-emerald-400 text-[9px] font-black uppercase tracking-widest">Protocol Secured • Read Only</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setViewingVerifiedReport(null)} className="p-2 hover:bg-white/10 rounded-full transition relative z-10"><X className="w-6 h-6 text-slate-400 hover:text-white" /></button>
              </div>
              
              <div className="p-10 space-y-8 bg-slate-50/30">
                 <div className="grid grid-cols-2 gap-8">
                    <div className="space-y-1">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Asset Identified</div>
                       <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{viewingVerifiedReport.assetName}</div>
                    </div>
                    <div className="space-y-1">
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Batch Reference</div>
                       <div className="text-sm font-mono font-bold text-blue-600 uppercase">{viewingVerifiedReport.batchId}</div>
                    </div>
                 </div>

                 <div className="p-6 bg-white rounded-3xl border border-slate-100 shadow-sm space-y-4">
                    <div className="flex items-center justify-between mb-4">
                       <div className="flex items-center gap-2 text-emerald-600">
                          <ShieldCheck className="w-5 h-5" />
                          <h4 className="text-xs font-black uppercase tracking-widest">Manufacturer Audit Result</h4>
                       </div>
                       <div className="text-right">
                          <div className="text-[8px] font-black text-slate-400 uppercase">Trust Score</div>
                          <div className="text-2xl font-black text-emerald-600">{viewingVerifiedReport.score}%</div>
                       </div>
                    </div>
                    
                    <div className="space-y-4 pt-4 border-t border-slate-50">
                       <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Auditing Node</div>
                          <div className="text-xs font-bold text-slate-700 uppercase">{viewingVerifiedReport.verifierName}</div>
                       </div>
                       <div>
                          <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Manifest Verdict</div>
                          <p className="text-xs text-slate-500 font-medium leading-relaxed italic">"{viewingVerifiedReport.verdict}"</p>
                       </div>
                    </div>
                 </div>

                 <div className="pt-6 border-t border-slate-100 flex items-start gap-4">
                    <div className="p-3 bg-blue-50 text-blue-600 rounded-xl"><Info className="w-5 h-5" /></div>
                    <div>
                       <h5 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-1">Distributor Instruction</h5>
                       <p className="text-[9px] text-blue-600 font-medium leading-relaxed uppercase">This batch has been digitally signed by the manufacturer. No further quality intake audit is required by your node before dispatch.</p>
                    </div>
                 </div>

                 <div className="bg-slate-900 p-4 rounded-2xl flex items-center justify-between gap-4">
                    <div className="flex-1 overflow-hidden">
                       <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest mb-1">Audit Trail Hash</div>
                       <div className="text-[9px] font-mono text-emerald-500 truncate uppercase">{viewingVerifiedReport.reportHash}</div>
                    </div>
                    <div className="px-3 py-1 bg-emerald-600 rounded-lg text-[8px] font-black text-white uppercase tracking-widest">Signed</div>
                 </div>
              </div>
              
              <div className="p-8 border-t border-slate-100 bg-slate-50/50">
                 <button onClick={() => setViewingVerifiedReport(null)} className="w-full py-4 bg-white border border-slate-200 text-slate-600 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-100">Dismiss Review</button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default DistributorDashboard;
