
import React, { useEffect, useState } from 'react';
import { useParams, Link, useNavigate } from 'react-router-dom';
import { Product, HarvestBatch, UserRole, User, SavedItem, Order } from '../../types';
import { 
  ShieldCheck, Calendar, ArrowLeft, ExternalLink, CheckCircle2, 
  AlertTriangle, Truck, Factory, Tractor, MapPin, ShoppingCart, 
  Heart, ScanLine, Share2, X, ArrowRight
} from 'lucide-react';
import CheckoutModal from './CheckoutModal';

interface ProductDetailProps {
  products: Product[];
  batches: HarvestBatch[];
  onUpdateQuantity: (id: string, delta: number, reason: any) => void;
  user: User | null;
  savedItems: SavedItem[];
  toggleSaveItem: (id: string, type: 'product' | 'batch') => void;
  logView: (id: string) => void;
  onPurchaseComplete?: (order: Order) => void;
}

const ProductDetail: React.FC<ProductDetailProps> = ({ 
  products, 
  batches, 
  onUpdateQuantity, 
  user, 
  savedItems, 
  toggleSaveItem,
  logView,
  onPurchaseComplete
}) => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [showCheckout, setShowCheckout] = useState(false);
  
  const safeId = id?.toUpperCase();
  const product = products.find(p => p.id.toUpperCase() === safeId) || products.find(p => p.batchId.toUpperCase() === safeId);
  const batch = batches.find(b => b.id.toUpperCase() === safeId) || batches.find(b => b.id.toUpperCase() === product?.batchId?.toUpperCase());

  useEffect(() => {
    window.scrollTo(0, 0);
    if (id) {
      logView(id);
    }
  }, [id, logView]);

  if (!product && !batch) {
    return (
      <div className="text-center py-20 px-6 animate-in fade-in duration-300 pointer-events-auto">
        <div className="w-20 h-20 bg-slate-100 rounded-full flex items-center justify-center mx-auto mb-6 text-slate-300">
           <ShieldCheck className="w-10 h-10" />
        </div>
        <h2 className="text-xl md:text-2xl font-black text-slate-800 uppercase tracking-tight">Record Not Found</h2>
        <p className="text-slate-400 mt-2 mb-8 font-medium">The provenance record does not exist on the TrueChain network.</p>
        <button 
          onClick={() => navigate('/dashboard/consumer')}
          className="bg-emerald-600 text-white px-8 py-3 rounded-2xl font-black uppercase tracking-widest text-[10px] shadow-lg shadow-emerald-600/20 active:scale-95 transition-all"
        >
          Return to Dashboard
        </button>
      </div>
    );
  }

  const displayName = product?.name || batch?.cropName || "Unknown Item";
  const displayId = product?.id || batch?.id || id;
  const isExpired = product ? new Date(product.expiryDate) < new Date() : false;
  const isOutOfStock = product ? product.currentQuantity === 0 : true;
  const isSaved = savedItems.find(si => si.product_id === displayId && si.user_id === user?.id);

  const handleShare = async () => {
    const shareData = {
      title: `TrueChain Traceability: ${displayName}`,
      text: `Check out the provenance audit trail for this product on TrueChain.`,
      url: window.location.href,
    };
    try {
      if (navigator.share) {
        await navigator.share(shareData);
      } else {
        await navigator.clipboard.writeText(window.location.href);
        alert('Product traceability link copied to clipboard!');
      }
    } catch (err) { console.error('Error sharing:', err); }
  };

  const timeline = [
    { title: 'Harvested', date: batch?.harvestDate, icon: Tractor, desc: `Batch #${batch?.id} harvested at ${batch?.location.address} by ${batch?.farmerName}.`, color: 'bg-emerald-100 text-emerald-600' },
    { title: 'Quality Check', date: batch?.harvestDate, icon: ShieldCheck, desc: `${batch?.farmingMethod} certification verified. Grade ${batch?.qualityGrade} quality.`, color: 'bg-blue-100 text-blue-600' },
    { title: 'Processed', date: product?.mfgDate || 'Pending', icon: Factory, desc: product ? `Manufacturing completed. Safety tests initiated under ${product.certification.authority}.` : 'Processing step not yet recorded.', color: 'bg-purple-100 text-purple-600' },
    { title: 'Certified', date: product?.mfgDate || 'Pending', icon: CheckCircle2, desc: product ? `Safety score: ${product.certification.matchPercentage.toFixed(1)}%. Digital signature attached.` : 'Certification finalizing...', color: product ? 'bg-emerald-600 text-white shadow-lg' : 'bg-slate-100 text-slate-400' },
  ];

  return (
    <div className="max-w-6xl mx-auto space-y-6 md:space-y-8 animate-in fade-in duration-500 pointer-events-auto relative">
      <div className="flex items-center justify-between px-2 relative z-20">
        <button 
          onClick={() => navigate('/dashboard/consumer')}
          className="inline-flex items-center gap-2 text-slate-500 hover:text-emerald-600 font-black uppercase tracking-widest transition text-[10px] active:scale-95"
        >
          <ArrowLeft className="w-4 h-4" />
          Back to Dashboard
        </button>
        <div className="flex gap-2">
          <button 
            onClick={() => toggleSaveItem(displayId!, product ? 'product' : 'batch')}
            className={`p-2.5 rounded-xl transition shadow-sm border ${isSaved ? 'bg-red-50 border-red-100 text-red-500' : 'bg-white border-slate-200 text-slate-400 hover:text-red-400'}`}
          >
            <Heart className={`w-5 h-5 ${isSaved ? 'fill-current' : ''}`} />
          </button>
          <button 
            onClick={handleShare}
            className="p-2.5 bg-white border border-slate-200 rounded-xl text-slate-400 hover:text-blue-500 transition shadow-sm"
          >
            <Share2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-6 md:gap-8">
        {/* Left Col: Info */}
        <div className="lg:col-span-2 space-y-6 md:space-y-8">
          <div className="bg-white rounded-[2.5rem] overflow-hidden shadow-sm border border-slate-200">
            <div className="aspect-[21/9] bg-slate-100 relative">
              <img src={product?.imageUrl || batch?.imageUrl || `https://picsum.photos/seed/${displayId}/800/450`} alt={displayName} className="w-full h-full object-cover" />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent flex items-end p-6 md:p-10">
                <div className="text-white w-full flex justify-between items-end">
                  <div>
                    <div className="text-[9px] md:text-[10px] font-black uppercase tracking-[0.3em] text-emerald-400 mb-2">{product?.category || batch?.category}</div>
                    <h1 className="text-2xl md:text-4xl font-black leading-tight uppercase tracking-tight">{displayName}</h1>
                  </div>
                  <div className="text-right">
                    <div className="text-[8px] md:text-[9px] font-black text-emerald-300 uppercase mb-2 tracking-widest">Node Status</div>
                    <div className={`px-4 py-2 rounded-xl font-black text-[10px] md:text-xs tracking-widest uppercase ${isOutOfStock ? 'bg-red-500 text-white' : 'bg-emerald-500 text-emerald-950 shadow-xl'}`}>
                      {isOutOfStock ? 'OUT OF STOCK' : 'Verified Available'}
                    </div>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="p-6 md:p-10">
              <div className="flex items-center justify-between mb-10">
                <h2 className="text-lg md:text-2xl font-black text-slate-800 uppercase tracking-tight flex items-center gap-3">
                  <ShieldCheck className="text-emerald-600 w-6 h-6 md:w-8 md:h-8" />
                  Provenance Audit Trail
                </h2>
                <button 
                  onClick={() => navigate(`/traceability/${displayId}`)}
                  className="bg-slate-100 hover:bg-emerald-50 text-emerald-600 font-black text-[9px] md:text-[10px] uppercase tracking-widest flex items-center gap-2 px-4 py-2 rounded-full transition-all active:scale-95"
                >
                  Full Traceability <ScanLine className="w-3 h-3 md:w-4 md:h-4" />
                </button>
              </div>

              <div className="relative space-y-8 md:space-y-12">
                <div className="absolute left-5 md:left-6 top-2 bottom-2 w-0.5 bg-slate-100"></div>
                {timeline.map((item, idx) => (
                  <div key={idx} className="relative flex gap-6 md:gap-10">
                    <div className={`w-10 h-10 md:w-14 md:h-14 rounded-xl md:rounded-2xl flex items-center justify-center shrink-0 z-10 ${item.color} shadow-md`}>
                      <item.icon className="w-5 h-5 md:w-7 md:h-7" />
                    </div>
                    <div>
                      <div className="text-[8px] md:text-[9px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.date}</div>
                      <h4 className="font-black text-slate-800 text-sm md:text-lg uppercase tracking-tight">{item.title}</h4>
                      <p className="text-[11px] md:sm text-slate-500 mt-1 leading-relaxed font-medium">{item.desc}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {product && (
            <div className="bg-white p-6 md:p-10 rounded-[2.5rem] shadow-sm border border-slate-200">
               <h3 className="text-base md:text-xl font-black text-slate-800 uppercase tracking-tight mb-8 flex items-center gap-3">
                 <ShieldCheck className="text-emerald-600 w-6 h-6" />
                 Lab Analysis Manifest
               </h3>
               <div className="overflow-x-auto">
                 <table className="w-full text-left">
                   <thead>
                     <tr className="text-[9px] font-black text-slate-400 uppercase tracking-[0.25em] border-b border-slate-100">
                       <th className="pb-5">Compound Parameter</th>
                       <th className="pb-5 text-center">Reading</th>
                       <th className="pb-5 text-center">Safety Limit</th>
                       <th className="pb-5 text-right">Ledger Status</th>
                     </tr>
                   </thead>
                   <tbody className="divide-y divide-slate-50">
                     {product.certification.parameters.map(p => (
                       <tr key={p.name} className="group hover:bg-slate-50 transition-colors">
                         <td className="py-4 font-bold text-slate-700 text-xs md:sm">{p.name}</td>
                         <td className="py-4 text-[11px] md:text-sm font-mono text-center font-black text-slate-600">{p.value} {p.unit}</td>
                         <td className="py-4 text-[9px] md:text-xs text-slate-400 text-center font-bold">{p.limit} {p.unit}</td>
                         <td className="py-4 text-right">
                           <span className={`px-2 py-1 rounded-lg text-[8px] md:text-[9px] font-black tracking-widest border ${p.passed ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-red-50 text-red-600 border-red-100'}`}>
                             {p.passed ? 'COMPLIANT' : 'VIOLATION'}
                           </span>
                         </td>
                       </tr>
                     ))}
                   </tbody>
                 </table>
               </div>
            </div>
          )}
        </div>

        {/* Right Col: Badges & Verify */}
        <div className="space-y-6">
          <div className="bg-slate-900 text-white p-8 md:p-10 rounded-[2.5rem] shadow-2xl sticky top-24 border border-slate-800">
            <div className="text-center mb-10">
              <div className="w-16 h-16 md:w-24 md:h-24 bg-emerald-500/10 rounded-[2rem] flex items-center justify-center mx-auto mb-6 border border-emerald-500/30">
                <ShieldCheck className="w-8 h-8 md:w-12 md:h-12 text-emerald-500" />
              </div>
              <h3 className="text-3xl md:text-5xl font-black tracking-tighter mb-2">
                {product ? product.certification.matchPercentage.toFixed(1) : '---'}%
              </h3>
              <p className="text-emerald-500 text-[10px] font-black uppercase tracking-[0.3em]">{product?.certification.status || 'Verification Pending'}</p>
            </div>

            <div className="space-y-5 border-t border-white/10 pt-8">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-black uppercase text-[8px] md:text-[9px] tracking-widest">Certified Body</span>
                <span className="font-black text-white text-xs md:text-sm">{product?.certification.authority || 'N/A'}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-black uppercase text-[8px] md:text-[9px] tracking-widest">Safety Expiry</span>
                <span className={`font-black text-xs md:text-sm ${isExpired ? 'text-red-500' : 'text-emerald-500'}`}>{product?.expiryDate || 'N/A'}</span>
              </div>
            </div>

            <div className="mt-10 bg-black/40 p-5 rounded-2xl border border-white/5">
              <div className="text-[8px] font-black text-emerald-600 uppercase mb-3 flex items-center gap-2 tracking-[0.2em]">
                <ExternalLink className="w-3 h-3" />
                Immutable Chain Hash
              </div>
              <div className="font-mono text-[8px] break-all leading-relaxed text-slate-500 uppercase">
                {product?.blockchainHash || batch?.blockchainHash || 'GENESIS-PENDING'}
              </div>
            </div>

            <div className="mt-10 space-y-4">
              <button 
                disabled={isExpired || isOutOfStock || !product}
                onClick={() => setShowCheckout(true)}
                className="w-full py-5 bg-emerald-600 hover:bg-emerald-500 text-emerald-950 font-black rounded-2xl transition shadow-xl shadow-emerald-600/20 uppercase tracking-[0.2em] text-[10px] md:text-xs flex items-center justify-center gap-3 disabled:opacity-30 disabled:grayscale active:scale-95"
              >
                <ShoppingCart className="w-4 h-4 md:w-5 h-5" /> Initialize Purchase
              </button>
              <button 
                onClick={() => navigate(`/traceability/${displayId}`)}
                className="w-full py-4 border border-white/10 text-white hover:bg-white/5 font-black rounded-2xl transition uppercase tracking-widest text-[9px] md:text-[10px] flex items-center justify-center gap-3 active:scale-95"
              >
                <ScanLine className="w-4 h-4" /> View Full Journey
              </button>
            </div>
          </div>

          <div className="bg-white p-6 md:p-8 rounded-[2rem] border border-slate-200 shadow-sm">
            <h4 className="font-black text-slate-800 mb-6 flex items-center gap-3 uppercase text-[9px] md:text-[10px] tracking-widest">
               <MapPin className="text-red-500 w-4 h-4" />
               Origin Point
            </h4>
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-100 rounded-xl overflow-hidden shrink-0 shadow-sm border border-slate-50">
                <img src={batch?.imageUrl || `https://picsum.photos/seed/${batch?.id}/100`} className="w-full h-full object-cover" />
              </div>
              <div className="overflow-hidden">
                <div className="text-sm font-black text-slate-800 truncate">{batch?.farmerName || "Heirloom Node"}</div>
                <div className="text-[10px] text-slate-400 font-bold truncate mt-1">{batch?.location.address || "GPS Locating..."}</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showCheckout && product && user && (
        <CheckoutModal 
           user={user} 
           items={[{ productId: product.id, quantity: 1 }]} 
           products={products} 
           batches={batches} 
           onClose={() => setShowCheckout(false)} 
           onPaymentSuccess={(order) => {
             onPurchaseComplete?.(order);
             setShowCheckout(false);
             navigate('/dashboard/consumer?tab=orders');
           }}
        />
      )}
    </div>
  );
};

export default ProductDetail;
