
import React, { useState, useMemo } from 'react';
import { X, ShieldCheck, ShoppingCart, CreditCard, Wallet as WalletIcon, Smartphone, CheckCircle2, Loader2, ArrowRight, MapPin, Package, Tractor, Zap, History } from 'lucide-react';
import { Product, HarvestBatch, Order, User, Wallet, OrderStatus, FoodCategory } from '../../types';
import { generateBlockchainHash } from '../../services/blockchain';

interface CheckoutModalProps {
  user: User;
  items: { productId: string; quantity: number }[];
  products: Product[];
  batches: HarvestBatch[];
  onClose: () => void;
  onPaymentSuccess: (order: Order) => void;
}

const CheckoutModal: React.FC<CheckoutModalProps> = ({ user, items, products, batches, onClose, onPaymentSuccess }) => {
  const [step, setStep] = useState<'REVIEW' | 'PAYMENT' | 'PROCESSING' | 'SUCCESS'>('REVIEW');
  const [paymentMethod, setPaymentMethod] = useState<'UPI' | 'CARD' | 'WALLET'>('UPI');
  const [isPayLoading, setIsPayLoading] = useState(false);

  const checkoutItems = useMemo(() => {
    return items.map(item => {
      const product = products.find(p => p.id === item.productId);
      const batch = batches.find(b => b.id === product?.batchId);
      return {
        ...item,
        product,
        batch,
        total: (product?.pricePerUnit || 0) * item.quantity
      };
    }).filter(i => i.product);
  }, [items, products, batches]);

  const totalAmount = checkoutItems.reduce((acc, curr) => acc + curr.total, 0);

  const handleProcessPayment = async () => {
    setIsPayLoading(true);
    setStep('PROCESSING');

    // Simulate blockchain confirmation and payment gateway latency
    await new Promise(r => setTimeout(r, 2500));

    const orderId = 'TRC-ORD-' + Math.random().toString(36).substr(2, 8).toUpperCase();
    const orderItems = checkoutItems.map(i => ({
      productId: i.productId,
      productName: i.product!.name,
      quantity: i.quantity,
      price: i.product!.pricePerUnit || 0
    }));

    const newOrder: Order = {
      id: orderId,
      userId: user.id,
      items: orderItems,
      totalAmount,
      timestamp: new Date().toISOString(),
      status: 'Processing',
      blockchainHash: await generateBlockchainHash({ orderId, userId: user.id, totalAmount })
    };

    setIsPayLoading(false);
    setStep('SUCCESS');
    
    // Notify parent after a short delay for UX
    setTimeout(() => {
        onPaymentSuccess(newOrder);
    }, 2000);
  };

  return (
    <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
      <div className="bg-white w-full max-w-2xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
        
        {/* Header */}
        <div className="bg-emerald-950 p-8 text-white flex justify-between items-center shrink-0">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
              <ShoppingCart className="w-6 h-6 text-white" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Verified Checkout</h3>
              <p className="text-emerald-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">TrueChain Secure Protocol</p>
            </div>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6 text-slate-400 hover:text-white" /></button>
        </div>

        {/* Content */}
        <div className="overflow-y-auto p-10 space-y-10 no-scrollbar flex-1">
          {step === 'REVIEW' && (
            <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4">
              <div className="space-y-4">
                <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                  <Package className="w-4 h-4" /> Order Summary
                </h4>
                <div className="space-y-4">
                  {checkoutItems.map((item, idx) => (
                    <div key={idx} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex justify-between items-center gap-4 group">
                      <div className="flex items-center gap-4 overflow-hidden">
                        <img src={item.product?.imageUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm grayscale-[0.3] group-hover:grayscale-0 transition-all" alt="" />
                        <div className="overflow-hidden">
                          <h5 className="font-black text-slate-800 text-sm uppercase truncate">{item.product?.name}</h5>
                          <div className="flex items-center gap-2 mt-1">
                            <span className="text-[9px] font-mono text-slate-400 font-bold uppercase">Batch: {item.product?.batchId}</span>
                            <span className="w-1 h-1 bg-slate-300 rounded-full"></span>
                            <span className="text-[9px] font-black text-emerald-600 uppercase flex items-center gap-1">
                                <Tractor className="w-2.5 h-2.5" /> {item.batch?.farmerName || 'Heirloom Node'}
                            </span>
                          </div>
                        </div>
                      </div>
                      <div className="text-right shrink-0">
                        <div className="text-xs font-black text-slate-800">₹{item.total.toLocaleString()}</div>
                        <div className="text-[9px] font-bold text-slate-400 uppercase">{item.quantity} Units</div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white space-y-6 relative overflow-hidden">
                <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-48 h-48" /></div>
                <div className="flex justify-between items-center border-b border-white/10 pb-4">
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-widest">Total Payable Amount</span>
                  <span className="text-3xl font-black text-emerald-400 tracking-tighter">₹{totalAmount.toLocaleString()}</span>
                </div>
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg"><MapPin className="w-4 h-4 text-emerald-400" /></div>
                  <div>
                    <div className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Delivery Point</div>
                    <div className="text-xs font-bold uppercase">Consumer Default Node • Primary Hub</div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {step === 'PAYMENT' && (
            <div className="space-y-8 animate-in slide-in-from-right-4 duration-300">
               <h4 className="text-xs font-black text-slate-400 uppercase tracking-widest border-b pb-2">Select Secure Payment Node</h4>
               <div className="grid grid-cols-1 gap-4">
                  {[
                    { id: 'UPI', label: 'UPI (PhonePe, GPay, BHIM)', icon: Smartphone, color: 'text-purple-600', bg: 'bg-purple-50' },
                    { id: 'CARD', label: 'Credit / Debit Card', icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-50' },
                    { id: 'WALLET', label: 'TrueChain Credits', icon: WalletIcon, color: 'text-emerald-600', bg: 'bg-emerald-50' },
                  ].map((method) => (
                    <button 
                      key={method.id}
                      onClick={() => setPaymentMethod(method.id as any)}
                      className={`p-6 rounded-[2rem] border-2 transition-all flex items-center justify-between group ${paymentMethod === method.id ? 'border-emerald-500 bg-emerald-50/50 shadow-lg' : 'border-slate-100 bg-slate-50 hover:border-emerald-200'}`}
                    >
                      <div className="flex items-center gap-4">
                        <div className={`p-4 rounded-2xl bg-white shadow-sm ${method.color}`}><method.icon className="w-6 h-6" /></div>
                        <span className="font-black text-slate-800 text-sm uppercase tracking-tight">{method.label}</span>
                      </div>
                      <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-all ${paymentMethod === method.id ? 'border-emerald-500 bg-emerald-500 text-white' : 'border-slate-200 bg-white'}`}>
                        {paymentMethod === method.id && <CheckCircle2 className="w-4 h-4" />}
                      </div>
                    </button>
                  ))}
               </div>
               <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                  <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                  <p className="text-[10px] text-blue-700 font-medium leading-relaxed uppercase">TrueChain encrypts all payment data. Transaction hash will be generated upon confirmation.</p>
               </div>
            </div>
          )}

          {step === 'PROCESSING' && (
             <div className="flex flex-col items-center justify-center py-16 space-y-8 animate-in fade-in">
                <div className="relative">
                  <div className="w-32 h-32 border-4 border-slate-100 rounded-full"></div>
                  <div className="w-32 h-32 border-t-4 border-emerald-500 rounded-full animate-spin absolute top-0 left-0"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <Zap className="w-12 h-12 text-emerald-500 animate-pulse" />
                  </div>
                </div>
                <div className="text-center">
                   <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tighter italic">Securing Transaction...</h4>
                   <p className="text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em] mt-2 animate-pulse">Anchoring Payment to Blockchain Ledger</p>
                </div>
             </div>
          )}

          {step === 'SUCCESS' && (
             <div className="flex flex-col items-center justify-center py-12 space-y-8 animate-in zoom-in-95 duration-500">
                <div className="w-24 h-24 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center shadow-inner border border-emerald-200">
                  <CheckCircle2 className="w-12 h-12" />
                </div>
                <div className="text-center">
                   <h4 className="text-3xl font-black text-slate-800 uppercase tracking-tighter">Verified Payment</h4>
                   <p className="text-emerald-600 text-[11px] font-black uppercase tracking-widest mt-2 px-4 py-1 bg-emerald-50 rounded-full border border-emerald-100 inline-block">Transaction Recorded on Chain</p>
                </div>
                <div className="w-full bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                   <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span>Total Paid</span>
                     <span className="text-slate-800">₹{totalAmount.toLocaleString()}</span>
                   </div>
                   <div className="flex justify-between text-[10px] font-black text-slate-400 uppercase tracking-widest">
                     <span>Node Status</span>
                     <span className="text-emerald-600">CONFIRMED</span>
                   </div>
                </div>
             </div>
          )}
        </div>

        {/* Footer Actions */}
        <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
          {step === 'REVIEW' && (
            <>
              <button onClick={onClose} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all hover:bg-slate-50 active:scale-95">Cancel</button>
              <button onClick={() => setStep('PAYMENT')} className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">
                 Proceed to Payment <ArrowRight className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 'PAYMENT' && (
            <>
              <button onClick={() => setStep('REVIEW')} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">Back to Summary</button>
              <button onClick={handleProcessPayment} className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-emerald-600/20 active:scale-95 flex items-center justify-center gap-3">
                 Confirm & Pay ₹{totalAmount.toLocaleString()} <ShieldCheck className="w-5 h-5" />
              </button>
            </>
          )}

          {step === 'SUCCESS' && (
            <button onClick={onClose} className="w-full py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all active:scale-95">Close & View Orders</button>
          )}
        </div>
      </div>
    </div>
  );
};

export default CheckoutModal;
