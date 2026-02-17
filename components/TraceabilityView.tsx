
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, HarvestBatch, SavedItem, User, UserRole, GenesisManifest, ProcessingManifest, LogisticsManifest, AggregationManifest } from '../types';
import { 
  Tractor, Factory, Truck, Store, CheckCircle2, ShieldCheck, 
  MapPin, Calendar, Scale, Microscope, ArrowLeft, Heart, 
  Share2, ExternalLink, BadgeCheck, ShoppingBag, Box, FileDown, History, Info, X, ChevronRight, Zap
} from 'lucide-react';
import { generateProductPDF } from '../services/report';

interface TraceabilityViewProps {
  products: Product[];
  batches: HarvestBatch[];
  user: User | null;
  toggleSaveItem: (id: string, type: 'product' | 'batch') => void;
  savedItems: SavedItem[];
  logView: (id: string) => void;
}

const TraceabilityView: React.FC<TraceabilityViewProps> = ({ 
  products, 
  batches, 
  user, 
  toggleSaveItem, 
  savedItems,
  logView
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [selectedNode, setSelectedNode] = useState<number | null>(null);
  
  // Exhaustive lookup: ID might be SKU or BatchID, ensure case-insensitivity
  const safeId = id?.toUpperCase();
  const product = products.find(p => p.id.toUpperCase() === safeId) || products.find(p => p.batchId.toUpperCase() === safeId);
  const batch = batches.find(b => b.id.toUpperCase() === safeId) || batches.find(b => b.id.toUpperCase() === product?.batchId?.toUpperCase());
  
  const displayId = product?.id || batch?.id || id;
  const isSaved = savedItems.find(si => si.product_id === displayId && si.user_id === user?.id);

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      logView(id);
    }
  }, [id, logView]);

  if (!batch) {
    return (
      <div className="text-center py-20 px-6 animate-in fade-in duration-300 pointer-events-auto">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
           <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Record Not Found</h2>
        <p className="text-slate-400 mt-2 mb-8 font-medium">The scanned ID does not exist on the TrueChain network.</p>
        <button 
          onClick={() => navigate('/dashboard/consumer')}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const handleDownload = () => {
    if (product && batch) {
      generateProductPDF(product, batch);
    } else {
      console.warn("Full report requires both manufacturing and harvest data.");
    }
  };

  const handleShare = async () => {
    const shareData = {
      title: `TrueChain Lifecycle Traceability: ${product?.name || batch.cropName}`,
      text: `View the complete immutable audit trail for this product.`,
      url: window.location.href,
    };

    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Traceability report link copied to clipboard!');
      }
    } catch (err) {
      console.error('Error sharing:', err);
    }
  };

  const steps = [
    {
      role: 'Farmer',
      title: 'Genesis Origin',
      icon: Tractor,
      details: [
        { label: 'Verified Farmer', value: batch.farmerName },
        { label: 'Farm Geolocation', value: batch.location.address },
        { label: 'Cultivation Method', value: batch.farmingMethod },
        { label: 'Harvest Sign-off', value: batch.harvestDate },
        { label: 'Origin Batch ID', value: batch.id }
      ],
      manifest: batch.genesisManifest,
      color: 'text-orange-600 bg-orange-50',
      active: true,
      hash: batch.blockchainHash
    },
    {
      role: 'Collector',
      title: 'Node Aggregation',
      icon: Truck,
      details: [
        { label: 'Vehicle Telemetry', value: 'Active' },
        { label: 'Aggregation Hub', value: 'Central Logistics Zone' },
        { label: 'Transport Mode', value: 'Cold-Chain Refrigerated' }
      ],
      manifest: null, // Collector manifest would be here
      color: 'text-blue-600 bg-blue-50',
      active: true,
      hash: 'AGG-SIM-' + batch.id.slice(-4)
    },
    {
      role: 'Manufacturer',
      title: 'Facility Processing',
      icon: Factory,
      details: product ? [
        { label: 'Packaging Date', value: product.mfgDate },
        { label: 'Regulatory Body', value: product.certification.authority },
        { label: 'Safety Compliance', value: `${product.certification.matchPercentage}%` },
        { label: 'Audit Record', value: product.certification.status },
        { label: 'Retail SKU', value: product.id }
      ] : null,
      manifest: product?.processingManifest,
      color: 'text-purple-600 bg-purple-50',
      active: !!product,
      hash: product?.blockchainHash
    },
    {
      role: 'Distributor',
      title: 'Supply Logistics',
      icon: Box,
      details: [
        { label: 'Storage Node', value: 'Wholesale Hub-4' },
        { label: 'Inventory ID', value: 'SKU-LOG-88' },
        { label: 'Protocol', value: 'Blockchain Verified Storage' }
      ],
      manifest: null, // Logistics manifest would be here
      color: 'text-emerald-600 bg-emerald-50',
      active: true,
      hash: 'DIST-SIM-' + batch.id.slice(-4)
    },
    {
      role: 'Retailer',
      title: 'Consumer Access',
      icon: Store,
      details: [
        { label: 'Shelf Status', value: product?.currentQuantity && product.currentQuantity > 0 ? 'Active Stock' : 'Sold Out' },
        { label: 'Public Access', value: 'Verified Retail Node' },
        { label: 'Compliance Sign-off', value: 'Completed' }
      ],
      manifest: null,
      color: 'text-pink-600 bg-pink-50',
      active: true,
      hash: 'RETAIL-SIM-' + batch.id.slice(-4)
    }
  ];

  return (
    <div className="max-w-5xl mx-auto py-6 md:py-8 space-y-6 md:space-y-8 px-1 md:px-0 overflow-x-hidden animate-in fade-in duration-700 pointer-events-auto relative">
      <div className="flex items-center justify-between px-2 relative z-20">
        <button 
          onClick={() => navigate('/dashboard/consumer')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-black uppercase tracking-[0.2em] transition text-[10px] active:scale-95"
        >
          <ArrowLeft className="w-5 h-5" />
          Back to Dashboard
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => toggleSaveItem(displayId!, product ? 'product' : 'batch')}
            className={`p-2.5 md:p-3 rounded-2xl transition shadow-sm border ${isSaved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-red-400'}`}
          >
            <Heart className={`w-5 h-5 md:w-6 md:h-6 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2.5 md:p-3 bg-white border border-slate-200 rounded-2xl text-slate-400 hover:text-blue-500 transition shadow-sm"
          >
            <Share2 className="w-5 h-5 md:w-6 md:h-6" />
          </button>
        </div>
      </div>

      <div className="bg-white rounded-[2.5rem] md:rounded-[3.5rem] shadow-2xl border border-slate-200 overflow-hidden">
        <div className="bg-emerald-950 p-8 md:p-16 text-white relative">
          <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
          <div className="absolute top-0 right-0 p-12 opacity-10 hidden md:block">
            <ShieldCheck className="w-64 h-64" />
          </div>
          <div className="relative z-10 flex flex-col lg:flex-row lg:items-end justify-between gap-10">
            <div className="w-full lg:max-w-3xl">
              <div className="flex flex-wrap items-center gap-3 mb-6">
                <span className="px-4 py-1.5 bg-emerald-600 text-white font-black text-[10px] rounded-full uppercase tracking-[0.25em] shadow-lg">Verified Chain History</span>
                <span className="text-emerald-400 font-mono text-xs font-bold bg-white/5 px-3 py-1.5 rounded-lg border border-white/10 uppercase tracking-widest">Node: {displayId}</span>
              </div>
              <h1 className="text-3xl md:text-5xl lg:text-7xl font-black leading-tight break-words uppercase tracking-tighter">
                {product?.name || batch.cropName}
              </h1>
              <p className="text-emerald-100/60 text-sm md:text-xl mt-6 font-medium leading-relaxed max-w-xl">
                Universal Provenance Manifest Enabled. Click any node to explore detailed blockchain audit records.
              </p>
            </div>
          </div>
        </div>

        {/* Life-cycle Visualization */}
        <div className="px-8 md:px-16 pt-16 pb-8">
           <div className="flex items-center justify-between overflow-x-auto no-scrollbar pb-8 gap-4">
              {steps.map((step, idx) => (
                <React.Fragment key={idx}>
                  <div 
                    onClick={() => setSelectedNode(idx)}
                    className={`flex flex-col items-center gap-3 cursor-pointer group transition-all ${selectedNode === idx ? 'scale-110' : 'hover:scale-105'}`}
                  >
                    <div className={`w-14 h-14 md:w-16 md:h-16 rounded-2xl flex items-center justify-center transition-all shadow-lg ${selectedNode === idx ? 'bg-emerald-600 text-white ring-4 ring-emerald-100 shadow-emerald-500/20' : 'bg-slate-50 text-slate-400 border border-slate-200 group-hover:border-emerald-500 group-hover:text-emerald-600'}`}>
                      <step.icon className="w-6 h-6 md:w-8 md:h-8" />
                    </div>
                    <span className={`text-[9px] font-black uppercase tracking-widest text-center whitespace-nowrap ${selectedNode === idx ? 'text-emerald-700' : 'text-slate-400 group-hover:text-slate-700'}`}>
                       {step.role}
                    </span>
                  </div>
                  {idx < steps.length - 1 && (
                    <div className="flex flex-col items-center pt-5">
                       <ChevronRight className="w-5 h-5 text-slate-200" />
                    </div>
                  )}
                </React.Fragment>
              ))}
           </div>
        </div>

        <div className="p-8 md:p-16 border-t border-slate-100 bg-slate-50/30">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-12">
            <h2 className="text-xl md:text-3xl font-black text-slate-800 flex items-center gap-4 uppercase tracking-tight">
              <BadgeCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-600" />
              Manifest Segment Audit
            </h2>
            <div className="flex items-center gap-3">
               <div className="px-4 py-2 bg-emerald-50 border border-emerald-100 text-emerald-600 rounded-xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4" /> Integrity Confirmed
               </div>
            </div>
          </div>

          <div className="relative space-y-12 md:space-y-20">
            <div className="absolute left-6 md:left-10 top-6 bottom-6 w-0.5 bg-slate-100 hidden sm:block"></div>
            
            {steps.map((step, idx) => (
              <div key={idx} className={`relative flex flex-col sm:flex-row gap-6 md:gap-12 transition-all duration-500 ${step.active ? 'opacity-100' : 'opacity-30 grayscale cursor-not-allowed'} ${selectedNode !== null && selectedNode !== idx ? 'opacity-40 blur-[1px]' : ''}`}>
                <div className={`w-14 h-14 md:w-20 md:h-20 rounded-[1.5rem] md:rounded-[2rem] flex items-center justify-center shrink-0 z-10 shadow-2xl transition-transform group-hover:scale-110 ${step.active ? step.color : 'bg-slate-50 text-slate-300'}`}>
                  <step.icon className="w-7 h-7 md:w-10 md:h-10" />
                </div>
                
                <div className="flex-1 bg-white rounded-[2.5rem] md:rounded-[3rem] p-6 md:p-10 border border-slate-100 hover:border-emerald-200 hover:shadow-xl transition-all duration-500 group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-10 opacity-[0.03] group-hover:opacity-[0.08] transition-opacity"><step.icon className="w-32 h-32" /></div>
                  <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 mb-10">
                    <div>
                      <div className="text-[10px] md:text-[11px] font-black text-slate-400 uppercase tracking-[0.3em] mb-2">{step.role} Node Leg</div>
                      <h3 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight">{step.title}</h3>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-10 relative z-10 mb-8">
                    {step.details ? step.details.map((detail, dIdx) => (
                      <div key={dIdx}>
                        <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">{detail.label}</div>
                        <div className="text-xs md:text-sm font-bold text-slate-700 uppercase tracking-tight truncate">{detail.value}</div>
                      </div>
                    )) : (
                      <div className="col-span-full italic text-slate-300 text-xs font-bold uppercase tracking-widest">Entry pending validation on next block...</div>
                    )}
                  </div>

                  {step.manifest && (
                     <div className="bg-slate-50/50 p-6 rounded-3xl border border-slate-100 mb-8 animate-in slide-in-from-top-4">
                        <div className="flex items-center gap-2 mb-4 text-blue-600">
                           <Zap className="w-4 h-4 fill-current" />
                           <span className="text-[10px] font-black uppercase tracking-widest">Linked Manifest Data</span>
                        </div>
                        <div className="space-y-4">
                           {/* GENESIS SPECIFICS */}
                           {(step.manifest as GenesisManifest).dairyDetails && (
                              <div className="grid grid-cols-2 gap-4">
                                 <div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Animal Breed</div>
                                    <div className="text-[10px] font-bold text-slate-700 uppercase">{(step.manifest as GenesisManifest).dairyDetails?.breed}</div>
                                 </div>
                                 <div>
                                    <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Feed System</div>
                                    <div className="text-[10px] font-bold text-slate-700 uppercase">{(step.manifest as GenesisManifest).dairyDetails?.feedType}</div>
                                 </div>
                              </div>
                           )}
                           
                           {/* PROCESSING SPECIFICS */}
                           {(step.manifest as ProcessingManifest).processingSteps && (
                              <div>
                                 <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-2">Facility Workflow</div>
                                 <div className="flex flex-wrap gap-2">
                                    {(step.manifest as ProcessingManifest).processingSteps.map(s => (
                                       <span key={s} className="px-2 py-0.5 bg-white border border-slate-200 text-[8px] font-black text-slate-500 rounded uppercase tracking-tighter">{s}</span>
                                    ))}
                                 </div>
                              </div>
                           )}
                        </div>
                     </div>
                  )}

                  {step.hash && (
                    <div className="mt-6 pt-6 border-t border-slate-100 flex items-center justify-between">
                      <div className="flex-1 overflow-hidden mr-6">
                        <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                           <History className="w-3 h-3" /> Block Reference
                        </div>
                        <div className="text-[9px] font-mono text-slate-300 truncate uppercase tracking-tighter font-bold">{step.hash}</div>
                      </div>
                      <button className="p-3 bg-slate-50 rounded-xl text-slate-300 group-hover:text-emerald-500 group-hover:bg-emerald-50 transition-all">
                        <ExternalLink className="w-5 h-5" />
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* FOOTER CTA */}
      <div className="bg-slate-900 text-white p-8 md:p-16 rounded-[3rem] md:rounded-[4rem] flex flex-col md:flex-row items-center justify-between gap-12 border border-slate-800 shadow-2xl relative overflow-hidden">
        <div className="absolute top-0 left-0 w-full h-full opacity-5 pointer-events-none flex justify-center items-center">
           <BadgeCheck className="w-[400px] h-[400px]" />
        </div>
        <div className="flex flex-col md:flex-row items-center gap-6 md:gap-10 text-center md:text-left relative z-10">
          <div className="w-20 h-20 md:w-28 md:h-28 bg-emerald-500/10 rounded-[2.5rem] flex items-center justify-center border border-emerald-500/20 shrink-0 shadow-2xl">
            <CheckCircle2 className="w-10 h-10 md:w-14 md:h-14 text-emerald-400" />
          </div>
          <div>
            <h3 className="text-2xl md:text-4xl font-black italic tracking-tighter uppercase">"Soil to Shelf, Linked Forever."</h3>
            <p className="text-slate-400 text-xs md:text-base mt-3 max-w-lg font-medium leading-relaxed">
              This report contains linked Farmer, Manufacturer, and Logistics manifests. Fully compliant with TrueChain V1.0 transparency protocols.
            </p>
          </div>
        </div>
        <button 
          onClick={handleDownload}
          disabled={!product || !batch}
          className="w-full md:w-auto px-10 py-6 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 font-black rounded-2xl transition shadow-2xl shadow-emerald-600/30 uppercase tracking-[0.25em] text-[10px] md:text-xs flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale active:scale-95 z-10"
        >
          <FileDown className="w-5 h-5" /> Download Blockchain Audit
        </button>
      </div>

      {/* NODE MODAL OVERLAY */}
      {selectedNode !== null && (
        <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-md transition-all duration-300">
           <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
              <div className="bg-slate-900 p-10 text-white relative">
                 <div className="absolute top-0 right-0 p-10 opacity-5">
                    <History className="w-32 h-32" />
                 </div>
                 <div className="relative z-10">
                    <div className="flex justify-between items-start mb-6">
                       <span className="px-4 py-1 bg-emerald-600 text-white font-black text-[9px] rounded-full uppercase tracking-widest">Node Segment Details</span>
                       <button onClick={() => setSelectedNode(null)} className="text-slate-400 hover:text-white transition"><X className="w-6 h-6" /></button>
                    </div>
                    <h3 className="text-3xl font-black uppercase tracking-tight">{steps[selectedNode].title}</h3>
                    <p className="text-slate-400 text-sm mt-2 font-medium">Digital signatures and environmental logs for the {steps[selectedNode].role} stage.</p>
                 </div>
              </div>
              
              <div className="p-10 space-y-8">
                 <div className="grid grid-cols-2 gap-8">
                    {steps[selectedNode].details?.map((d, i) => (
                       <div key={i} className="space-y-1">
                          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{d.label}</div>
                          <div className="text-sm font-black text-slate-800 uppercase tracking-tight">{d.value}</div>
                       </div>
                    ))}
                 </div>
                 
                 <div className="pt-8 border-t border-slate-100 flex items-center justify-between">
                    <div>
                       <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-1">Block Address</div>
                       <div className="text-[10px] font-mono text-emerald-600 font-black break-all">{steps[selectedNode].hash}</div>
                    </div>
                    <button className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest active:scale-95 transition-all">View Explorer</button>
                 </div>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default TraceabilityView;
