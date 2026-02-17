
import React, { useState, useMemo, useEffect } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, UserRole, Product, Complaint, AuditRecord, LabParameter, CertAuthority } from '../../types';
// Added ArrowRight to the imports from lucide-react
import { 
  ShieldCheck, UserCheck, UserX, Clock, Search, Filter, 
  FileText, CheckCircle2, XCircle, AlertCircle, Info, 
  History, ClipboardList, Database, Landmark, Mail, Phone, Building2, Camera, ShieldAlert, CheckSquare, AlertTriangle, Scale, Hammer, Zap, Trash2,
  Activity, Microscope, FlaskConical, ExternalLink, BadgeCheck, X, RefreshCcw, Eye, LayoutDashboard, PieChart, TrendingUp, Flame, Fingerprint, ArrowRight
} from 'lucide-react';
import { TrueChainDB } from '../../services/storage';

interface AuthorizerDashboardProps {
  user: User;
  complaints: Complaint[];
  onResolveComplaint: (id: string, comment: string) => void;
  auditRecords: AuditRecord[];
}

const AuthorizerDashboard: React.FC<AuthorizerDashboardProps> = ({ user, complaints, onResolveComplaint, auditRecords }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [resolutionComment, setResolutionComment] = useState('');
  const [faultyId, setFaultyId] = useState('');
  const [penaltyType, setPenaltyType] = useState<'Monetary' | 'ScoreReduction' | 'Suspension' | 'Ban'>('ScoreReduction');
  const [auditSearch, setAuditSearch] = useState('');
  const [safetySearch, setSafetySearch] = useState('');
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);

  const [systemUsers, setSystemUsers] = useState<User[]>([]);
  const [productsForVerification, setProductsForVerification] = useState<Product[]>([]);

  useEffect(() => {
    setSystemUsers(TrueChainDB.getUsers());
    const products = TrueChainDB.getProducts();
    // Simulate some products needing verification if they don't have these fields
    // Fix: Explicitly cast status to avoid type mismatch in SetStateAction<Product[]> and ensure it matches the literal union type
    const enriched: Product[] = products.map(p => ({
        ...p,
        certification: {
            ...p.certification,
            labName: p.certification.labName || 'National Food Safety Lab',
            certificateNo: p.certification.certificateNo || 'TC-CERT-' + p.id.slice(-4),
            issueDate: p.certification.issueDate || '2025-01-10',
            expiryDate: p.certification.expiryDate || '2026-01-10',
            status: (p.certification.status === 'Certified' ? 'Certified' : (p.certification.status || 'Verification Pending')) as Product['certification']['status']
        }
    }));
    setProductsForVerification(enriched);
  }, []);

  const handleApplyPenalty = (complaint: Complaint) => {
    if (!faultyId) {
      alert("Select a Node ID to penalize.");
      return;
    }
    
    let scoreDelta = 0;
    switch(penaltyType) {
      case 'ScoreReduction': scoreDelta = -15; break;
      case 'Suspension': scoreDelta = -40; break;
      case 'Ban': scoreDelta = -100; break;
      case 'Monetary': scoreDelta = -5; break;
    }

    TrueChainDB.updateUserTrust(faultyId, scoreDelta);
    onResolveComplaint(complaint.id, `Penalty [${penaltyType}] enforced on Node ${faultyId}. Supply-chain record updated.`);
    setFaultyId('');
    alert(`Node ${faultyId} penalized. Trust Score updated on chain.`);
  };

  const handleVerifySafety = (productId: string, action: 'Approve' | 'Flag' | 'Retest') => {
    const nextStatus = action === 'Approve' ? 'Certified' : action === 'Flag' ? 'Flagged' : 'Re-test Triggered';
    
    const updated = productsForVerification.map(p => {
        if (p.id === productId) {
            return {
                ...p,
                certification: {
                    ...p.certification,
                    status: nextStatus as any,
                    verifiedBy: user.id,
                    verifiedAt: new Date().toISOString()
                }
            };
        }
        return p;
    });
    
    setProductsForVerification(updated);
    TrueChainDB.saveProducts(updated);
    setSelectedProduct(null);
    alert(`Safety Protocol: ${action} processed. Ledger updated.`);
  };

  const filteredAudit = useMemo(() => {
    return auditRecords.filter(r => 
      r.actionType.toLowerCase().includes(auditSearch.toLowerCase()) ||
      r.actorId.toLowerCase().includes(auditSearch.toLowerCase()) ||
      r.targetId.toLowerCase().includes(auditSearch.toLowerCase())
    );
  }, [auditRecords, auditSearch]);

  const filteredSafety = useMemo(() => {
    return productsForVerification.filter(p => 
      p.name.toLowerCase().includes(safetySearch.toLowerCase()) ||
      p.id.toLowerCase().includes(safetySearch.toLowerCase()) ||
      p.certification.labName?.toLowerCase().includes(safetySearch.toLowerCase())
    );
  }, [productsForVerification, safetySearch]);

  const activeComplaints = complaints.filter(c => c.status === 'Open' || c.status === 'Investigating');

  // --- High Level Oversight Data ---
  const totalVerified = productsForVerification.filter(p => p.certification.status === 'Certified').length;
  const totalPending = productsForVerification.filter(p => p.certification.status === 'Verification Pending').length;
  const totalFlagged = productsForVerification.filter(p => p.certification.status === 'Flagged' || p.certification.status === 'Re-test Triggered').length;

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <div className="bg-slate-900 p-8 md:p-12 rounded-[2.5rem] md:rounded-[3.5rem] border border-slate-800 shadow-2xl relative overflow-hidden text-white">
        <div className="absolute top-0 right-0 p-12 opacity-5"><Landmark className="w-64 h-64" /></div>
        <div className="relative z-10 flex flex-col md:flex-row justify-between gap-10">
          <div className="flex items-center gap-6">
            <div className="w-20 h-20 bg-blue-600/20 rounded-3xl flex items-center justify-center border border-blue-500/30 shadow-2xl">
              <ShieldCheck className="w-12 h-12 text-blue-400" />
            </div>
            <div>
              <h2 className="text-3xl font-black uppercase tracking-tighter">Oversight Command</h2>
              <div className="flex items-center gap-3 mt-2">
                 <span className="px-3 py-1 bg-emerald-600 text-[9px] font-black uppercase rounded-full tracking-widest">Authority Node Active</span>
                 <span className="text-slate-400 text-[11px] font-mono">Governing Ledger Tier 1 • {new Date().toLocaleDateString()}</span>
              </div>
            </div>
          </div>
          <div className="flex gap-10">
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Global Verification Rate</div>
                <div className="text-4xl font-black text-white tracking-tighter">98.4%</div>
             </div>
             <div className="text-right">
                <div className="text-[10px] font-black text-slate-500 uppercase tracking-widest mb-1">Reputation Delta</div>
                <div className="text-4xl font-black text-emerald-400 tracking-tighter">+2.1%</div>
             </div>
          </div>
        </div>
      </div>

      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Network Oversight', icon: LayoutDashboard },
          { id: 'safety', label: 'Verification Queue', icon: FlaskConical },
          { id: 'complaints', label: 'Dispute Investigation', icon: AlertTriangle },
          { id: 'queue', label: 'Network Registry', icon: ClipboardList },
          { id: 'audit', label: 'Governance Logs', icon: History }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`pb-4 px-2 flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-colors border-b-2 ${currentTab === tab.id ? 'border-blue-600 text-blue-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB - NEW HIGH LEVEL OVERSIGHT VIEW */}
      {currentTab === 'overview' && (
        <div className="space-y-10 animate-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform"><CheckCircle2 className="w-24 h-24 text-emerald-600" /></div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6 flex items-center gap-2">
                 <BadgeCheck className="w-4 h-4 text-emerald-600" /> Verification Summary
               </div>
               <div className="space-y-6">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Approved Records</span>
                    <span className="text-2xl font-black text-slate-800">{totalVerified}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Pending Audits</span>
                    <span className="text-2xl font-black text-blue-600">{totalPending}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Flagged/Re-test</span>
                    <span className="text-2xl font-black text-red-600">{totalFlagged}</span>
                  </div>
               </div>
            </div>

            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-5"><Flame className="w-24 h-24 text-red-600" /></div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-6">Network Risk Heatmap</div>
               <div className="space-y-5">
                  {[
                    { l: 'Dairy Products', r: 'High', c: 'bg-red-500' },
                    { l: 'Fresh Produce', r: 'Medium', c: 'bg-amber-500' },
                    { l: 'Packaged Goods', r: 'Low', c: 'bg-emerald-500' },
                    { l: 'Oils & Spices', r: 'Low', c: 'bg-emerald-500' }
                  ].map((risk, i) => (
                    <div key={i} className="flex items-center gap-4">
                       <div className={`w-2 h-2 rounded-full ${risk.c}`}></div>
                       <span className="flex-1 text-xs font-bold text-slate-700 uppercase">{risk.l}</span>
                       <span className={`text-[10px] font-black uppercase ${risk.r === 'High' ? 'text-red-600' : risk.r === 'Medium' ? 'text-amber-600' : 'text-emerald-600'}`}>{risk.r} Risk</span>
                    </div>
                  ))}
               </div>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl flex flex-col justify-between">
               <div>
                  <div className="text-[10px] font-black text-blue-400 uppercase tracking-widest mb-6">Governance Quick Access</div>
                  <div className="space-y-3">
                    <button onClick={() => setSearchParams({ tab: 'safety' })} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/btn">
                      <span className="text-xs font-black uppercase">Open Verification Queue</span>
                      <ArrowRight className="w-4 h-4 text-blue-400 group-hover/btn:translate-x-1 transition-transform" />
                    </button>
                    <button onClick={() => setSearchParams({ tab: 'audit' })} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/btn">
                      <span className="text-xs font-black uppercase">Review Audit Trail</span>
                      <History className="w-4 h-4 text-blue-400" />
                    </button>
                    <button onClick={() => setSearchParams({ tab: 'complaints' })} className="w-full flex items-center justify-between p-4 bg-white/5 rounded-2xl border border-white/10 hover:bg-white/10 transition-all group/btn">
                      <span className="text-xs font-black uppercase">Dispute Investigation</span>
                      <AlertTriangle className="w-4 h-4 text-red-400" />
                    </button>
                  </div>
               </div>
            </div>
          </div>

          <div className="grid lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Authority Activity (Read-only Oversight) */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Zap className="w-5 h-5 text-blue-600" /> Recent Governance Activity
                  </h3>
                  <span className="text-[9px] font-mono font-black text-slate-400 uppercase">Live Pulse</span>
                </div>
                <div className="divide-y divide-slate-50">
                  {auditRecords.slice(0, 5).map((record, i) => (
                    <div key={i} className="p-6 flex items-center justify-between group">
                       <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                             <Fingerprint className="w-5 h-5" />
                          </div>
                          <div>
                             <div className="text-[8px] font-black text-slate-400 uppercase mb-1">{new Date(record.timestamp).toLocaleString()}</div>
                             <h4 className="text-sm font-black text-slate-800 uppercase">{record.actionType}</h4>
                          </div>
                       </div>
                       <div className="text-right">
                          <span className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{record.actorRole} Node</span>
                          <div className="text-[9px] font-mono text-slate-300 mt-1">{record.id}</div>
                       </div>
                    </div>
                  ))}
                  {auditRecords.length === 0 && <div className="p-20 text-center text-slate-300 uppercase font-black text-xs">No recent activity detected</div>}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Recent Escalations List (Read-only) */}
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><ShieldAlert className="w-32 h-32" /></div>
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <Scale className="w-4 h-4 text-red-600" /> Active Escalations
                 </h3>
                 <div className="space-y-6">
                    {complaints.slice(0, 3).map((c, i) => (
                      <div key={i} className="p-5 rounded-2xl border border-red-100 bg-red-50/30 animate-in fade-in slide-in-from-right-4" style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex justify-between items-start mb-3">
                           <div className="text-[9px] font-black text-red-600 uppercase tracking-widest">URGENT</div>
                           <span className="text-[8px] font-mono text-slate-400">{c.id}</span>
                        </div>
                        <h4 className="text-xs font-black text-slate-800 uppercase line-clamp-1">{c.targetName}</h4>
                        <p className="text-[10px] text-slate-500 mt-1 font-medium leading-relaxed italic line-clamp-2">"{c.description}"</p>
                      </div>
                    ))}
                    {complaints.length === 0 && <div className="text-center py-12 text-slate-300 uppercase font-black text-[10px]">No active disputes</div>}
                 </div>
              </section>

              <div className="bg-emerald-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-emerald-900/20">
                 <h4 className="font-black text-sm uppercase tracking-[0.2em] mb-4 flex items-center gap-3"><Activity className="w-5 h-5 text-emerald-400" /> Network Health</h4>
                 <p className="text-[10px] text-emerald-100/60 font-medium leading-relaxed uppercase">The network is operating with high integrity. No critical chain forks or identity collisions detected in the last 24 hours.</p>
                 <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black uppercase text-slate-400">Ledger Consistency</span>
                       <span className="text-[10px] font-black text-emerald-400">100%</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-full"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* SAFETY VERIFICATION TAB - PRESERVED WORKFLOW */}
      {currentTab === 'safety' && (
             <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                   <div>
                      <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                         <Microscope className="w-5 h-5 text-emerald-600" /> Third-Party Lab Verification Hub
                      </h3>
                      <p className="text-[10px] text-slate-400 font-bold uppercase mt-1">Validating safety certificates across the chain</p>
                   </div>
                   <div className="relative w-full md:w-64">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                      <input 
                        type="text" 
                        placeholder="Search Safety Manifests..." 
                        value={safetySearch}
                        onChange={(e) => setSafetySearch(e.target.value)}
                        className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" 
                      />
                   </div>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                         <tr>
                            <th className="px-8 py-4">Product / SKU</th>
                            <th className="px-8 py-4">Issuing Lab</th>
                            <th className="px-8 py-4">Cert status</th>
                            <th className="px-8 py-4 text-right">Audit Action</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {filteredSafety.map(product => (
                            <tr key={product.id} className="hover:bg-slate-50/50 transition group">
                               <td className="px-8 py-5">
                                  <div className="font-black text-slate-800 text-sm uppercase">{product.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">UID: {product.id}</div>
                               </td>
                               <td className="px-8 py-5">
                                  <div className="text-[10px] font-black text-slate-600 uppercase tracking-tight">{product.certification.labName}</div>
                                  <div className="text-[9px] font-bold text-slate-400 uppercase">REF: {product.certification.certificateNo}</div>
                               </td>
                               <td className="px-8 py-5">
                                  <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${
                                      product.certification.status === 'Certified' ? 'bg-emerald-50 text-emerald-600 border-emerald-100' :
                                      product.certification.status === 'Verification Pending' ? 'bg-amber-50 text-amber-600 border-amber-100 animate-pulse' :
                                      'bg-red-50 text-red-600 border-red-100'
                                  }`}>
                                     {product.certification.status}
                                  </span>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <button 
                                    onClick={() => setSelectedProduct(product)}
                                    className="p-2 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition shadow-lg active:scale-90"
                                  >
                                     <Eye className="w-4 h-4" />
                                  </button>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
      )}

      {/* DISPUTE INVESTIGATION TAB - PRESERVED WORKFLOW */}
      {currentTab === 'complaints' && (
            <section className="space-y-6">
              {activeComplaints.length === 0 ? (
                <div className="bg-white p-20 text-center rounded-[2.5rem] border-2 border-dashed border-slate-100">
                   <ShieldCheck className="w-12 h-12 text-slate-200 mx-auto mb-4" />
                   <p className="text-slate-400 font-black uppercase text-xs tracking-widest">Network integrity is 100%. No disputes.</p>
                </div>
              ) : activeComplaints.map(c => (
                <div key={c.id} className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm hover:border-red-200 transition-all group overflow-hidden relative">
                  <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:rotate-12 transition-transform"><AlertTriangle className="w-32 h-32" /></div>
                  <div className="relative z-10">
                    <div className="flex items-center justify-between mb-6">
                      <div className="flex items-center gap-3">
                        <span className="px-3 py-1 rounded-full text-[9px] font-black uppercase border bg-red-50 text-red-600 border-red-100 animate-pulse">{c.status}</span>
                        <span className="text-[10px] font-mono font-black text-slate-400 uppercase tracking-widest">DISPUTE: {c.id}</span>
                      </div>
                      <span className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">{new Date(c.timestamp).toLocaleString()}</span>
                    </div>

                    <div className="grid md:grid-cols-3 gap-8 mb-8">
                       <div className="md:col-span-2">
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">{c.type} Reported</h4>
                          <p className="text-sm text-slate-500 font-medium leading-relaxed italic">"{c.description}"</p>
                       </div>
                       <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Reporter</div>
                          <div className="text-xs font-black text-slate-800 uppercase truncate">{c.userName}</div>
                          <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mt-3 mb-1">Target Object</div>
                          <div className="text-xs font-black text-blue-600 uppercase truncate">{c.targetName}</div>
                       </div>
                    </div>
                    
                    <div className="p-6 bg-slate-900 rounded-3xl space-y-6 text-white border border-white/5">
                       <div className="flex items-center gap-3 text-blue-400">
                          <Scale className="w-5 h-5" />
                          <h5 className="text-[10px] font-black uppercase tracking-widest">Supply-Chain Event Investigation</h5>
                       </div>

                       <div className="grid grid-cols-2 gap-6">
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-1">Identify Faulty Node ID</label>
                             <input type="text" className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold font-mono outline-none focus:border-blue-500 transition" placeholder="e.g. F-988-X" value={faultyId} onChange={e => setFaultyId(e.target.value)} />
                          </div>
                          <div className="space-y-2">
                             <label className="text-[8px] font-black text-slate-500 uppercase tracking-widest block ml-1">Governance Action</label>
                             <select className="w-full p-3 bg-white/5 border border-white/10 rounded-xl text-xs font-bold outline-none focus:border-blue-500 transition cursor-pointer" value={penaltyType} onChange={e => setPenaltyType(e.target.value as any)}>
                                <option value="ScoreReduction">Reputation Hit (-15 Score)</option>
                                <option value="Monetary">Financial Penalty (Escrow Slash)</option>
                                <option value="Suspension">Node Suspension (Temporary)</option>
                                <option value="Ban">Network Ban (Permanent)</option>
                             </select>
                          </div>
                       </div>

                       <button onClick={() => handleApplyPenalty(c)} className="w-full py-4 bg-red-600 hover:bg-red-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest flex items-center justify-center gap-2 transition-all shadow-xl active:scale-[0.98]">
                          <Hammer className="w-4 h-4" /> Enforce Governance Penalty
                       </button>
                    </div>
                  </div>
                </div>
              ))}
            </section>
      )}

      {/* NETWORK REGISTRY TAB - PRESERVED WORKFLOW */}
      {currentTab === 'queue' && (
             <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 flex items-center justify-between">
                   <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                      <Database className="w-5 h-5 text-blue-600" /> Active Network Node Registry
                   </h3>
                </div>
                <div className="overflow-x-auto">
                   <table className="w-full text-left">
                      <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                         <tr>
                            <th className="px-8 py-4">Node / Operator</th>
                            <th className="px-8 py-4">Role Tier</th>
                            <th className="px-8 py-4">Trust Score</th>
                            <th className="px-8 py-4 text-right">Status</th>
                         </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-50">
                         {systemUsers.map(sysUser => (
                            <tr key={sysUser.id} className="hover:bg-slate-50/50 transition">
                               <td className="px-8 py-5">
                                  <div className="font-black text-slate-800 text-sm uppercase">{sysUser.name}</div>
                                  <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest">{sysUser.id}</div>
                               </td>
                               <td className="px-8 py-5">
                                  <span className="px-2 py-0.5 bg-blue-50 text-blue-600 border border-blue-100 text-[8px] font-black uppercase rounded tracking-widest">{sysUser.role}</span>
                               </td>
                               <td className="px-8 py-5">
                                  <div className="flex items-center gap-2">
                                     <div className="w-12 h-1.5 bg-slate-100 rounded-full overflow-hidden shrink-0">
                                        <div className={`h-full ${sysUser.trustMetrics.trustScore > 80 ? 'bg-emerald-500' : 'bg-red-500'} transition-all`} style={{ width: `${sysUser.trustMetrics.trustScore}%` }}></div>
                                     </div>
                                     <span className="text-[10px] font-black text-slate-600 uppercase tracking-widest">{sysUser.trustMetrics.trustScore}%</span>
                                  </div>
                               </td>
                               <td className="px-8 py-5 text-right">
                                  <span className={`px-2 py-1 rounded text-[8px] font-black uppercase tracking-widest border ${sysUser.trustMetrics.trustScore < 50 ? 'bg-red-50 text-red-600 border-red-100 animate-pulse' : 'bg-emerald-50 text-emerald-600 border-emerald-100'}`}>
                                     {sysUser.trustMetrics.trustScore < 50 ? 'Under Investigation' : 'Healthy Node'}
                                  </span>
                               </td>
                            </tr>
                         ))}
                      </tbody>
                   </table>
                </div>
             </div>
      )}

      {/* GOVERNANCE LOGS TAB - PRESERVED WORKFLOW */}
      {currentTab === 'audit' && (
            <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row justify-between items-center gap-6">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <History className="w-5 h-5 text-blue-600" /> Immutable Governance Logs
                </h3>
                <div className="relative w-full md:w-64">
                   <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-300" />
                   <input 
                    type="text" 
                    placeholder="Search Audit Trail..." 
                    value={auditSearch}
                    onChange={(e) => setAuditSearch(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-white border border-slate-200 rounded-xl text-xs font-bold outline-none focus:ring-2 focus:ring-blue-500/20" 
                  />
                </div>
              </div>
              <div className="overflow-x-auto">
                 <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[9px] font-black uppercase tracking-widest">
                       <tr>
                          <th className="px-8 py-4">Timestamp & Event</th>
                          <th className="px-8 py-4">Actor</th>
                          <th className="px-8 py-4">Status Transition</th>
                          <th className="px-8 py-4 text-right">Chain Signature</th>
                       </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                       {filteredAudit.map(record => (
                          <tr key={record.id} className="hover:bg-slate-50/50 transition group">
                             <td className="px-8 py-5">
                                <div className="text-[10px] font-black text-slate-400 mb-1">{new Date(record.timestamp).toLocaleString()}</div>
                                <div className="font-black text-slate-800 text-sm uppercase">{record.actionType}</div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                   <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-400 group-hover:bg-blue-50 group-hover:text-blue-600 transition-colors">
                                      <Activity className="w-4 h-4" />
                                   </div>
                                   <div>
                                      <div className="text-[10px] font-black text-slate-800 uppercase tracking-tight">{record.actorRole}</div>
                                      <div className="text-[9px] font-mono text-slate-400">{record.actorId}</div>
                                   </div>
                                </div>
                             </td>
                             <td className="px-8 py-5">
                                <div className="flex items-center gap-2">
                                   <span className="px-2 py-0.5 bg-slate-50 text-slate-400 text-[8px] font-black rounded uppercase border border-slate-100">{record.prevStatus}</span>
                                   <Zap className="w-3 h-3 text-emerald-500" />
                                   <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 text-[8px] font-black rounded uppercase border border-emerald-100">{record.nextStatus}</span>
                                </div>
                                <div className="mt-1 text-[9px] text-slate-400 font-medium truncate max-w-[150px]">{record.details}</div>
                             </td>
                             <td className="px-8 py-5 text-right">
                                <div className="font-mono text-[8px] text-slate-300 group-hover:text-emerald-500 transition-colors uppercase break-all max-w-[120px] ml-auto">{record.blockchainHash.slice(0, 16)}...</div>
                             </td>
                          </tr>
                       ))}
                    </tbody>
                 </table>
              </div>
            </div>
      )}

      {/* SAFETY VERIFICATION MODAL - PRESERVED WORKFLOW */}
      {selectedProduct && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all">
              <div className="bg-white w-full max-w-4xl rounded-[3rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
                  <div className="bg-slate-900 p-10 text-white relative shrink-0">
                      <div className="absolute top-0 right-0 p-12 opacity-10"><Microscope className="w-32 h-32" /></div>
                      <div className="relative z-10 flex justify-between items-start">
                          <div>
                              <div className="flex items-center gap-3 mb-4">
                                  <div className="px-3 py-1 bg-emerald-600 rounded-full text-[9px] font-black uppercase tracking-widest">Lab Report Audit</div>
                                  <span className="text-slate-400 text-[10px] font-mono">UID: {selectedProduct.id}</span>
                              </div>
                              <h3 className="text-3xl font-black uppercase tracking-tight">{selectedProduct.name}</h3>
                              <p className="text-slate-400 text-sm mt-2 font-medium">Verify third-party safety parameters and digital signatures.</p>
                          </div>
                          <button onClick={() => setSelectedProduct(null)} className="p-2 bg-white/5 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6 text-slate-400 hover:text-white" /></button>
                      </div>
                  </div>

                  <div className="overflow-y-auto p-12 space-y-10 no-scrollbar flex-1 bg-slate-50/30">
                      <div className="grid md:grid-cols-2 gap-10">
                          <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                  <Landmark className="w-4 h-4" /> Lab Authenticity Manifest
                              </h4>
                              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Issuing Agency</span>
                                      <span className="text-xs font-black text-slate-800 uppercase">{selectedProduct.certification.labName}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Certificate No.</span>
                                      <span className="text-xs font-bold text-blue-600 uppercase font-mono">{selectedProduct.certification.certificateNo}</span>
                                  </div>
                                  <div className="flex justify-between items-center">
                                      <span className="text-[10px] font-black text-slate-400 uppercase">Issue / Expiry</span>
                                      <span className="text-xs font-black text-slate-800 uppercase">{selectedProduct.certification.issueDate} / {selectedProduct.certification.expiryDate}</span>
                                  </div>
                                  <div className="pt-4 border-t border-slate-50">
                                      <div className="text-[8px] font-black text-slate-300 uppercase mb-1">Blockchain Verification Hash</div>
                                      <div className="text-[8px] font-mono text-emerald-600 font-bold truncate uppercase">{selectedProduct.certification.reportHash}</div>
                                  </div>
                              </div>
                          </div>

                          <div className="space-y-6">
                              <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2 flex items-center gap-2">
                                  <FlaskConical className="w-4 h-4" /> Test Parameter Audit
                              </h4>
                              <div className="bg-white p-6 rounded-[2rem] border border-slate-100 shadow-sm space-y-4">
                                  {selectedProduct.certification.parameters.map((p: LabParameter, idx: number) => (
                                      <div key={idx} className="flex justify-between items-center py-2 border-b border-slate-50 last:border-0">
                                          <div>
                                              <div className="text-[10px] font-black text-slate-700 uppercase">{p.name}</div>
                                              <div className="text-[9px] font-bold text-slate-400 uppercase">{p.value} {p.unit} <span className="text-slate-300 mx-1">|</span> Limit: {p.limit} {p.unit}</div>
                                          </div>
                                          {p.passed ? <CheckCircle2 className="w-4 h-4 text-emerald-500" /> : <XCircle className="w-4 h-4 text-red-500" />}
                                      </div>
                                  ))}
                              </div>
                          </div>
                      </div>

                      <div className="p-8 bg-blue-50 rounded-[2.5rem] border-2 border-blue-100 flex items-start gap-5">
                          <Info className="w-6 h-6 text-blue-600 shrink-0" />
                          <div className="space-y-2">
                              <h5 className="text-[11px] font-black text-blue-800 uppercase tracking-tight">Authorizer Protocol V1.0</h5>
                              <p className="text-[10px] font-medium text-blue-700 uppercase leading-relaxed">
                                  Approving safety will anchor your node signature to this product, enabling it for retail release. Re-test triggering will notify certified partner labs to conduct an independent verification.
                              </p>
                          </div>
                      </div>
                  </div>

                  <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                      <button onClick={() => handleVerifySafety(selectedProduct.id, 'Retest')} className="flex-1 py-5 bg-white border-2 border-slate-200 text-amber-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all hover:bg-amber-50 active:scale-95 flex items-center justify-center gap-2">
                          <RefreshCcw className="w-4 h-4" /> Trigger Re-test
                      </button>
                      <button onClick={() => handleVerifySafety(selectedProduct.id, 'Flag')} className="flex-1 py-5 bg-white border-2 border-slate-200 text-red-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all hover:bg-red-50 active:scale-95 flex items-center justify-center gap-2">
                          <ShieldAlert className="w-4 h-4" /> Flag Violation
                      </button>
                      <button onClick={() => handleVerifySafety(selectedProduct.id, 'Approve')} className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl shadow-emerald-600/40 flex items-center justify-center gap-3 active:scale-95">
                          <BadgeCheck className="w-5 h-5" /> Certify Node Safety
                      </button>
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default AuthorizerDashboard;
