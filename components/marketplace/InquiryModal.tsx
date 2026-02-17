import React, { useState } from 'react';
import { X, Send, ShieldCheck, CheckCircle2, MessageSquare, AlertCircle } from 'lucide-react';

interface InquiryModalProps {
  sellerName: string;
  onClose: () => void;
}

const InquiryModal: React.FC<InquiryModalProps> = ({ sellerName, onClose }) => {
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(onClose, 2500);
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white w-full max-w-lg rounded-[2.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200">
        <div className="bg-slate-900 p-8 text-white flex justify-between items-center">
          <div className="flex items-center gap-4">
            <div className="w-10 h-10 bg-emerald-500/20 rounded-xl flex items-center justify-center border border-emerald-500/30">
              <MessageSquare className="w-5 h-5 text-emerald-400" />
            </div>
            <div>
              <h3 className="text-xl font-black uppercase tracking-tight">Send B2B Inquiry</h3>
              <p className="text-slate-400 text-[10px] font-bold uppercase tracking-widest mt-0.5">To: {sellerName}</p>
            </div>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-white transition"><X className="w-6 h-6" /></button>
        </div>

        <div className="p-8">
          {submitted ? (
            <div className="text-center py-12 space-y-6 animate-in fade-in">
              <div className="w-20 h-20 bg-emerald-100 text-emerald-600 rounded-full flex items-center justify-center mx-auto shadow-inner">
                <CheckCircle2 className="w-10 h-10" />
              </div>
              <h4 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Inquiry Dispatched</h4>
              <p className="text-slate-500 text-sm font-medium">Supplier has been notified via TrueChain Node. Expect a response on-chain shortly.</p>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Quantity Required</label>
                  <input required type="number" placeholder="e.g. 500" className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold" />
                </div>
                <div className="space-y-2">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Unit Type</label>
                  <select className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl font-bold outline-none">
                    <option>Kilograms (KG)</option>
                    <option>Metric Tons (MT)</option>
                    <option>Units/Pieces</option>
                    <option>Cases</option>
                  </select>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Requirements Detail</label>
                <textarea required rows={4} placeholder="Describe your wholesale requirements, shipping terms, or specific batch quality needs..." className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none font-bold resize-none text-sm"></textarea>
              </div>

              <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-start gap-3">
                <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0" />
                <p className="text-[10px] text-emerald-800 font-medium leading-relaxed uppercase">Your business profile and blockchain node ID will be shared with the supplier for verification.</p>
              </div>

              <button type="submit" className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[11px] tracking-[0.2em] transition-all shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-3">
                <Send className="w-4 h-4" /> Finalize & Send Lead
              </button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default InquiryModal;