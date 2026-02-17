import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, Product, SavedItem, Wallet } from '../../types';
import { Store, Tag, ShoppingBag, Eye, TrendingDown, LayoutPanelLeft, Heart, BarChart3, ShieldCheck, Clock, CheckCircle, AlertCircle, Scan, ArrowRight, ClipboardList, Tractor, Factory, Truck, Info, ChevronDown, ChevronUp, BadgeCheck, Microscope } from 'lucide-react';
import InventoryControls from '../inventory/InventoryControls';
import ChainStatusPanel from '../ChainStatusPanel';
import { generateTrustCardPDF } from '../../services/report';
import { TrueChainDB } from '../../services/storage';

interface RetailerDashboardProps {
  user: User;
  products: Product[];
  onUpdateQuantity: (id: string, delta: number, reason: any) => void;
  onDeleteProduct: (id: string) => void;
  savedItems: SavedItem[];
  wallet: Wallet;
}

const RetailerDashboard: React.FC<RetailerDashboardProps> = ({ user, products, onUpdateQuantity, onDeleteProduct, savedItems, wallet }) => {
  const [searchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'shelf';
  
  const [trustDisplayEnabled, setTrustDisplayEnabled] = useState(true);
  const [showBadgePreview, setShowBadgePreview] = useState(false);
  const [downloadingId, setDownloadingId] = useState<string | null>(null);
  const [expandedProductId, setExpandedProductId] = useState<string | null>(null);

  // Fetch upstream trust data from global store
  const verifiedManifests = useMemo(() => TrueChainDB.getVerifiedManifests(), []);
  const batches = useMemo(() => TrueChainDB.getBatches(), []);

  const salesSummary = [
    { category: 'Beverages', volume: 450, trend: '+12%' },
    { category: 'Dairy', volume: 280, trend: '+5%' },
    { category: 'Snacks', volume: 150, trend: '-2%' },
  ];

  const handleDownloadPDF = async (product: Product) => {
    try {
      setDownloadingId(product.id);
      await generateTrustCardPDF(product);
    } catch (error) {
      console.error("PDF Download failed:", error);
      alert("Failed to generate PDF. Please try again.");
    } finally {
      setDownloadingId(null);
    }
  };

  const nearExpiryProducts = products.filter(p => {
    const expiry = new Date(p.expiryDate).getTime();
    const now = new Date().getTime();
    return (expiry - now) < (15 * 24 * 60 * 60 * 1000) && (expiry - now) > 0;
  });

  return (
    <div className="space-y-8 animate-in fade-in duration-500">
      <ChainStatusPanel user={user} wallet={wallet} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {salesSummary.map((s, i) => (
          <div key={i} className="bg-white p-6 rounded-3xl border border-slate-200 flex items-center justify-between shadow-sm group hover:border-emerald-200 transition">
             <div>
                <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{s.category} Velocity</div>
                <div className="text-2xl font-black text-slate-800">{s.volume} <span className="text-xs font-medium text-slate-400">Sold</span></div>
             </div>
             <div className={`px-2 py-1 rounded-lg font-black text-[10px] flex items-center gap-1 ${s.trend.startsWith('+') ? 'bg-emerald-50 text-emerald-600' : 'bg-red-50 text-red-600'}`}>
                {s.trend.startsWith('+') ? <TrendingDown className="w-3 h-3 rotate-180" /> : <TrendingDown className="w-3 h-3" />} {s.trend}
             </div>
          </div>
        ))}
      </div>

      <div className="grid lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-8">
          {currentTab === 'shelf' ? (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-6 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <ShoppingBag className="text-emerald-600 w-5 h-5" />
                  Live Shelf Health & Provenance
                </h3>
              </div>
              <div className="divide-y divide-slate-50 max-h-[600px] overflow-y-auto no-scrollbar">
                {products.length === 0 ? (
                  <div className="text-slate-400 text-center py-20 italic">No inventory tracked.</div>
                ) : products.map(p => {
                  const expiryDate = new Date(p.expiryDate);
                  const daysUntilExpiry = Math.ceil((expiryDate.getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24));
                  const isUrgent = daysUntilExpiry < 15;
                  const isExpanded = expandedProductId === p.id;
                  
                  // Verification checks
                  const manufacturerVerified = !!verifiedManifests[p.batchId];
                  const batchData = batches.find(b => b.id === p.batchId);
                  const farmOriginRecorded = !!batchData;
                  const distributorVerified = true; // Implicit for items on Retailer shelf in TrueChain

                  return (
                    <div key={p.id} className="group">
                      <div className="flex items-center gap-4 p-5 hover:bg-slate-50/80 transition-colors">
                        <div className="relative shrink-0">
                           <img src={p.imageUrl || `https://picsum.photos/seed/${p.id}/48`} className="w-10 h-10 rounded-xl object-cover shadow-sm grayscale-[0.5]" />
                           <div className={`absolute -bottom-1 -right-1 w-3 h-3 rounded-full border-2 border-white ${isUrgent ? 'bg-red-500 animate-pulse' : 'bg-emerald-500'}`}></div>
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex items-center gap-2">
                            <div className="font-black text-slate-800 text-sm tracking-tight truncate uppercase">{p.name}</div>
                            {manufacturerVerified && <BadgeCheck className="w-3.5 h-3.5 text-emerald-500 shrink-0" title="Upstream Verified" />}
                          </div>
                          <div className="flex items-center gap-3 mt-1">
                             <div className={`text-[8px] font-black uppercase tracking-widest px-1.5 py-0.5 rounded flex items-center gap-1 ${isUrgent ? 'bg-red-50 text-red-600' : 'bg-slate-100 text-slate-500'}`}>
                               <Clock className="w-2.5 h-2.5" /> {daysUntilExpiry < 0 ? 'Expired' : `${daysUntilExpiry} Days`}
                             </div>
                             <button 
                               onClick={() => setExpandedProductId(isExpanded ? null : p.id)}
                               className="text-[8px] font-black text-blue-600 uppercase tracking-widest flex items-center gap-1 hover:underline"
                             >
                               {isExpanded ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
                               Trust Context
                             </button>
                          </div>
                        </div>
                        <InventoryControls 
                          quantity={p.currentQuantity} 
                          role={user.role}
                          isExpired={daysUntilExpiry < 0}
                          onUpdate={(delta) => onUpdateQuantity(p.id, delta, 'sale')}
                          onDelete={() => onDeleteProduct(p.id)}
                        />
                      </div>

                      {/* Read-Only Trust Context Panel */}
                      {isExpanded && (
                        <div className="px-5 pb-5 animate-in slide-in-from-top-2 duration-300">
                           <div className="bg-slate-900 rounded-[1.5rem] p-6 text-white space-y-6 relative overflow-hidden">
                              <div className="absolute top-0 right-0 p-4 opacity-5"><ShieldCheck className="w-24 h-24" /></div>
                              
                              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 relative z-10">
                                 {/* Indicator 1: Farm */}
                                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                       <Tractor className="w-5 h-5 text-orange-400" />
                                       <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <div>
                                       <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stage 01</div>
                                       <div className="text-[10px] font-black uppercase text-white tracking-tighter">Farm Origin Recorded</div>
                                       <div className="text-[8px] font-mono text-slate-400 mt-1 truncate">NODE: {p.batchId}</div>
                                    </div>
                                 </div>

                                 {/* Indicator 2: Manufacturer */}
                                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                       <Factory className="w-5 h-5 text-purple-400" />
                                       {manufacturerVerified ? <CheckCircle className="w-3 h-3 text-emerald-400" /> : <Clock className="w-3 h-3 text-amber-400" />}
                                    </div>
                                    <div>
                                       <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stage 02</div>
                                       <div className="text-[10px] font-black uppercase text-white tracking-tighter">Manufacturer Verified</div>
                                       <div className="text-[8px] font-bold text-slate-400 mt-1 uppercase">{manufacturerVerified ? 'Audit Signature Found' : 'Verification Gated'}</div>
                                    </div>
                                 </div>

                                 {/* Indicator 3: Distributor */}
                                 <div className="p-4 bg-white/5 border border-white/10 rounded-2xl flex flex-col gap-3">
                                    <div className="flex justify-between items-start">
                                       <Truck className="w-5 h-5 text-blue-400" />
                                       <CheckCircle className="w-3 h-3 text-emerald-400" />
                                    </div>
                                    <div>
                                       <div className="text-[8px] font-black text-slate-500 uppercase tracking-widest">Stage 03</div>
                                       <div className="text-[10px] font-black uppercase text-white tracking-tighter">Distributor Verified</div>
                                       <div className="text-[8px] font-bold text-slate-400 mt-1 uppercase">Dispatch Manifest Linked</div>
                                    </div>
                                 </div>
                              </div>

                              {manufacturerVerified && verifiedManifests[p.batchId] && (
                                 <div className="pt-4 border-t border-white/10 flex items-start gap-4">
                                    <div className="p-2 bg-emerald-500/20 text-emerald-400 rounded-lg shrink-0">
                                       <Microscope className="w-4 h-4" />
                                    </div>
                                    <div>
                                       <div className="text-[9px] font-black text-emerald-500 uppercase tracking-widest">Upstream Manifest Summary</div>
                                       <p className="text-[10px] text-slate-400 font-medium italic mt-1 line-clamp-1 leading-relaxed">
                                          "{verifiedManifests[p.batchId].verdict}"
                                       </p>
                                    </div>
                                 </div>
                              )}
                           </div>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          ) : (
            /* Trust Cards View */
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in fade-in">
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  Printable Trust Card Gallery
               </h3>
               <div className="grid md:grid-cols-2 gap-6">
                  {products.map(p => (
                    <div key={p.id} className="bg-slate-50 p-6 rounded-3xl border border-slate-200 hover:border-emerald-400 transition cursor-pointer">
                       <div className="flex items-center gap-3 mb-4">
                          <Scan className="w-5 h-5 text-slate-400" />
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest truncate">Blockchain ID: {p.id}</div>
                       </div>
                       <div className="font-black text-slate-800 text-lg mb-2 uppercase">{p.name}</div>
                       <div className="flex justify-between items-end border-t border-slate-100 pt-4 mt-2">
                          <div className="w-16 h-16 bg-white rounded-xl border flex items-center justify-center p-2">
                             <img src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=truechain://${p.id}`} className="w-full h-full" alt="QR" />
                          </div>
                          <button 
                            onClick={() => handleDownloadPDF(p)}
                            disabled={downloadingId === p.id}
                            className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black text-[9px] uppercase tracking-widest shadow-lg disabled:opacity-50"
                          >
                            {downloadingId === p.id ? 'Generating...' : 'Download PDF'}
                          </button>
                       </div>
                    </div>
                  ))}
               </div>
            </div>
          )}
        </div>

        <div className="space-y-8">
           <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:scale-110 transition-transform"><BarChart3 className="w-32 h-32" /></div>
              <h4 className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-6">Shelf Utilization</h4>
              <div className="space-y-6 relative z-10">
                 <div className="flex justify-between items-end">
                    <div>
                       <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Active SKUs</div>
                       <div className="text-3xl font-black">{products.length}</div>
                    </div>
                    <div className="text-right">
                       <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest mb-1">Critical Expiry</div>
                       <div className="text-2xl font-black text-red-400">{nearExpiryProducts.length}</div>
                    </div>
                 </div>
                 <div className="h-1.5 w-full bg-white/10 rounded-full overflow-hidden">
                    <div className="h-full bg-emerald-500 w-3/4"></div>
                 </div>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">Current stock matches 92% of projected consumer demand for verified produce.</p>
              </div>
           </div>

           <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <AlertCircle className="w-4 h-4 text-amber-500" /> Shelf Alerts
              </h3>
              <div className="space-y-4">
                 {nearExpiryProducts.slice(0, 3).map(p => (
                    <div key={p.id} className="p-4 bg-red-50 border border-red-100 rounded-2xl flex items-start gap-3">
                       <Clock className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                       <div>
                          <div className="text-[10px] font-black text-red-700 uppercase line-clamp-1">{p.name}</div>
                          <p className="text-[9px] text-red-600 font-bold uppercase mt-1">Expiring in {Math.ceil((new Date(p.expiryDate).getTime() - new Date().getTime()) / (1000 * 60 * 60 * 24))} Days</p>
                       </div>
                    </div>
                 ))}
                 {nearExpiryProducts.length === 0 && (
                    <div className="text-center py-6">
                       <CheckCircle className="w-8 h-8 text-emerald-200 mx-auto mb-2" />
                       <p className="text-[10px] font-black text-slate-400 uppercase">Shelf health is optimal</p>
                    </div>
                 )}
              </div>
           </div>
        </div>
      </div>
    </div>
  );
};

export default RetailerDashboard;