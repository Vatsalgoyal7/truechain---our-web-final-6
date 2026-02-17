import React, { useState } from 'react';
import { HelpCircle, X, ShieldAlert, MessageSquare, Send, CheckCircle2, History, Loader2, ShieldCheck } from 'lucide-react';
import { Complaint } from '../types';

interface HelpSystemProps {
  onSubmitComplaint: (complaint: Partial<Complaint>) => void;
  complaints: Complaint[];
}

const HelpSystem: React.FC<HelpSystemProps> = ({ onSubmitComplaint, complaints }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [view, setView] = useState<'options' | 'report' | 'status'>('options');
  const [form, setForm] = useState({ targetId: '', targetName: '', type: 'Counterfeit' as any, description: '' });
  const [submittedId, setSubmittedId] = useState<string | null>(null);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSubmitComplaint(form);
    setSubmittedId('pending');
    setTimeout(() => {
      setSubmittedId(null);
      setView('status');
    }, 1500);
  };

  return (
    <div className="fixed bottom-8 right-8 z-[1000]">
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="w-16 h-16 bg-emerald-600 text-white rounded-full shadow-2xl flex items-center justify-center hover:bg-emerald-700 transition-all active:scale-95 shadow-emerald-600/40"
      >
        {isOpen ? <X className="w-8 h-8" /> : <HelpCircle className="w-8 h-8" />}
      </button>

      {isOpen && (
        <div className="absolute bottom-20 right-0 w-80 md:w-96 bg-white rounded-[2.5rem] shadow-[0_20px_50px_rgba(0,0,0,0.2)] border border-slate-100 overflow-hidden animate-in slide-in-from-bottom-4 zoom-in-95 duration-200">
          <div className="bg-emerald-950 p-6 text-white flex justify-between items-center">
            <div className="flex items-center gap-3">
              <ShieldAlert className="w-5 h-5 text-emerald-400" />
              <h3 className="font-black uppercase tracking-widest text-xs">Help & Support</h3>
            </div>
            <div className="flex gap-2">
              <button onClick={() => setView('options')} className="text-[10px] font-black uppercase text-emerald-400">Back</button>
            </div>
          </div>

          <div className="p-6 max-h-[450px] overflow-y-auto no-scrollbar">
            {view === 'options' && (
              <div className="space-y-4">
                <button onClick={() => setView('report')} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-left hover:border-emerald-500 transition-all group">
                   <ShieldAlert className="w-6 h-6 text-red-500 mb-3" />
                   <h4 className="font-black text-slate-800 text-sm uppercase">Report Discrepancy</h4>
                   <p className="text-[10px] text-slate-500 mt-1 font-medium">Report fake products, tampered QR codes, or quality violations to Authorities.</p>
                </button>
                <button onClick={() => setView('status')} className="w-full p-6 bg-slate-50 border border-slate-100 rounded-3xl text-left hover:border-emerald-500 transition-all">
                   <History className="w-6 h-6 text-blue-500 mb-3" />
                   <h4 className="font-black text-slate-800 text-sm uppercase">Check Status</h4>
                   <p className="text-[10px] text-slate-500 mt-1 font-medium">Track your previous reports and view Authority investigation status.</p>
                </button>
                <div className="p-4 bg-emerald-50 rounded-2xl border border-emerald-100 flex items-center gap-3">
                   <MessageSquare className="w-4 h-4 text-emerald-600" />
                   <span className="text-[10px] font-bold text-emerald-800 uppercase">Live Chat coming soon</span>
                </div>
              </div>
            )}

            {view === 'report' && (
              <form onSubmit={handleSubmit} className="space-y-4">
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Issue Type</label>
                  <select 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold outline-none focus:ring-2 focus:ring-emerald-500"
                    onChange={e => setForm({...form, type: e.target.value as any})}
                  >
                    <option value="Counterfeit">Counterfeit / Fake Product</option>
                    <option value="Bad Quality">Bad Quality / Spoiled</option>
                    <option value="Incorrect Provenance">Incorrect Origin Data</option>
                    <option value="Tampered QR">Tampered QR / Packaging</option>
                  </select>
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Target Name (ID or Brand)</label>
                  <input 
                    required 
                    type="text" 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-bold" 
                    placeholder="e.g. B-FV-01 or FreshMilk Co."
                    onChange={e => setForm({...form, targetId: e.target.value, targetName: e.target.value})}
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[9px] font-black text-slate-400 uppercase tracking-widest ml-1">Description</label>
                  <textarea 
                    required 
                    className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl text-xs font-medium resize-none h-24" 
                    placeholder="Provide details about the discrepancy..."
                    onChange={e => setForm({...form, description: e.target.value})}
                  />
                </div>
                <button 
                  type="submit" 
                  disabled={submittedId === 'pending'}
                  className="w-full py-4 bg-emerald-600 text-white rounded-2xl font-black uppercase tracking-widest text-[10px] flex items-center justify-center gap-2 shadow-lg shadow-emerald-600/20 active:scale-[0.98]"
                >
                  {submittedId === 'pending' ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />}
                  Finalize Report
                </button>
              </form>
            )}

            {view === 'status' && (
              <div className="space-y-4">
                {complaints.length === 0 ? (
                  <div className="py-12 text-center">
                    <History className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                    <p className="text-[10px] font-black text-slate-400 uppercase">No reports found on chain.</p>
                  </div>
                ) : complaints.map(c => (
                  <div key={c.id} className="p-4 bg-slate-50 border border-slate-100 rounded-3xl space-y-2">
                    <div className="flex justify-between items-center">
                      <span className="text-[8px] font-black text-slate-400 uppercase tracking-tighter">ID: {c.id}</span>
                      <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase ${c.status === 'Open' ? 'bg-amber-50 text-amber-600' : 'bg-emerald-50 text-emerald-600'}`}>
                        {c.status}
                      </span>
                    </div>
                    <div className="font-black text-slate-800 text-xs uppercase">{c.targetName}</div>
                    <p className="text-[9px] text-slate-500 font-medium line-clamp-1 italic">"{c.description}"</p>
                    {c.authorizerComment && (
                       <div className="mt-2 pt-2 border-t border-slate-100">
                          <div className="text-[8px] font-black text-emerald-600 uppercase">Authority Verdict</div>
                          <p className="text-[9px] text-slate-600 font-bold">{c.authorizerComment}</p>
                       </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
          
          <div className="p-4 bg-slate-50 border-t border-slate-100 flex items-center justify-center gap-2">
            <ShieldCheck className="w-3 h-3 text-emerald-600" />
            <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">Signed TrueChain Audit Engine</span>
          </div>
        </div>
      )}
    </div>
  );
};

export default HelpSystem;