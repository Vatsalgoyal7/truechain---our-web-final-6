
import React, { useState, useMemo } from 'react';
import { User, SavedItem, Product, HarvestBatch, UserPreferences, UserRole, SubscriptionTier, SubscriptionStatus, KycStatus } from '../types';
import { Link, useNavigate } from 'react-router-dom';
import { 
  User as UserIcon, Settings, Heart, ArrowRight, ShieldCheck, 
  Trash2, Package, Tractor, Store, Calendar, ExternalLink,
  BarChart3, Truck, ShieldAlert, CheckCircle2, MapPin, Gauge, 
  History, Activity, ClipboardCheck, CreditCard, Zap, Check, AlertCircle, FileText, Camera, BadgeCheck, Microscope
} from 'lucide-react';
import KYCVerification from './KYCVerification';
import { TrueChainDB } from '../services/storage';

interface ProfileProps {
  user: User;
  savedItems: SavedItem[];
  products: Product[];
  batches: HarvestBatch[];
  toggleSaveItem: (id: string, type: 'product' | 'batch') => void;
  userPreferences: UserPreferences[];
  updatePrefs: (userId: string, prefs: Partial<UserPreferences>) => void;
  onUpdateUser?: (u: User) => void;
}

const Profile: React.FC<ProfileProps> = ({ 
  user, 
  savedItems, 
  products, 
  batches, 
  toggleSaveItem,
  userPreferences,
  updatePrefs,
  onUpdateUser
}) => {
  const navigate = useNavigate();
  const [showKycFlow, setShowKycFlow] = useState(false);
  const userSavedItems = savedItems.filter(si => si.user_id === user.id);
  const currentPrefs = userPreferences.find(p => p.userId === user.id) || { userId: user.id, preferredAuthorities: [], organicOnly: false };

  const getSavedDetails = (si: SavedItem) => {
    if (si.type === 'product') return products.find(p => p.id === si.product_id);
    return batches.find(b => b.id === si.product_id);
  };

  const handleUpgrade = (tier: SubscriptionTier, price: number) => {
    if (!onUpdateUser) return;
    
    const updatedUser: User = {
      ...user,
      subscription: {
        tier,
        status: SubscriptionStatus.ACTIVE,
        expiryDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price
      }
    };
    onUpdateUser(updatedUser);
  };

  const handleKycComplete = (data: { idImage: string; faceImage: string }) => {
    if (!onUpdateUser) return;
    
    const updatedUser: User = {
      ...user,
      kycStatus: KycStatus.COMPLETED,
      status: 'Verified', // Activate authorizer role status
      kycIdImage: data.idImage,
      kycFaceImage: data.faceImage,
      kycSubmittedAt: new Date().toISOString()
    };
    
    onUpdateUser(updatedUser);
    setShowKycFlow(false);
    
    // Role-based immediate redirect after successful one-time KYC
    if (user.role === UserRole.AUTHORIZER) {
      navigate('/dashboard/authorizer');
    }
  };

  const verifiedManifests = useMemo(() => TrueChainDB.getVerifiedManifests(), []);
  const myVerifiedBatches = useMemo(() => {
    if (user.role !== UserRole.FARMER) return [];
    return batches.filter(b => b.farmerId === user.id && verifiedManifests[b.id]);
  }, [batches, user.id, user.role, verifiedManifests]);

  const RoleSummary = () => {
    switch (user.role) {
      case UserRole.FARMER:
        const userBatches = batches.filter(b => b.farmerId === user.id);
        const totalYield = userBatches.reduce((acc, b) => acc + parseFloat(b.quantity), 0);
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Total Yield</div>
              <div className="text-xl font-black text-emerald-900">{totalYield.toFixed(0)} <span className="text-[10px]">Units</span></div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Active Ledger</div>
              <div className="text-xl font-black text-blue-900">{userBatches.length} <span className="text-[10px]">Batches</span></div>
            </div>
          </div>
        );
      case UserRole.MANUFACTURER:
        const userProducts = products.filter(p => p.manufacturerId === user.id);
        const certRate = userProducts.length > 0 ? (userProducts.filter(p => p.certification.status === 'Certified').length / userProducts.length) * 100 : 0;
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-purple-50 p-4 rounded-2xl border border-purple-100">
              <div className="text-[10px] font-black text-purple-600 uppercase tracking-widest mb-1">Cert. Score</div>
              <div className="text-xl font-black text-purple-900">{certRate.toFixed(0)}%</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Inventory</div>
              <div className="text-xl font-black text-emerald-900">{userProducts.length} <span className="text-[10px]">SKUs</span></div>
            </div>
          </div>
        );
      case UserRole.COLLECTOR:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Completed Trips</div>
              <div className="text-xl font-black text-blue-900">42</div>
            </div>
            <div className="bg-amber-50 p-4 rounded-2xl border border-amber-100">
              <div className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-1">Avg. Integrity</div>
              <div className="text-xl font-black text-amber-900">100%</div>
            </div>
          </div>
        );
      case UserRole.RETAILER:
        const retailerProducts = products.filter(p => p.currentQuantity > 0);
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-pink-50 p-4 rounded-2xl border border-pink-100">
              <div className="text-[10px] font-black text-pink-600 uppercase tracking-widest mb-1">Active Shelf</div>
              <div className="text-xl font-black text-pink-900">{retailerProducts.length}</div>
            </div>
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Trust Status</div>
              <div className="text-xl font-black text-emerald-900">Verified</div>
            </div>
          </div>
        );
      default:
        return (
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-emerald-50 p-4 rounded-2xl border border-emerald-100">
              <div className="text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">Items Tracked</div>
              <div className="text-xl font-black text-emerald-900">{userSavedItems.length}</div>
            </div>
            <div className="bg-blue-50 p-4 rounded-2xl border border-blue-100">
              <div className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-1">Safety Index</div>
              <div className="text-xl font-black text-blue-900">High</div>
            </div>
          </div>
        );
    }
  };

  const isSupplySide = [UserRole.FARMER, UserRole.MANUFACTURER, UserRole.DISTRIBUTOR, UserRole.RETAILER, UserRole.COLLECTOR, UserRole.AUTHORIZER].includes(user.role);
  const requiresKyc = user.role !== UserRole.CONSUMER;
  const displayRole = user.role === UserRole.COLLECTOR ? 'Transporter' : user.role;

  return (
    <div className="max-w-4xl mx-auto py-8 space-y-8 px-4">
      <div className="bg-white rounded-[2.5rem] shadow-sm border border-slate-200 overflow-hidden">
        <div className="h-32 bg-emerald-600 relative overflow-hidden">
          <div className="absolute inset-0 opacity-10 flex flex-wrap gap-4 p-4 pointer-events-none">
            {Array.from({ length: 20 }).map((_, i) => <ShieldCheck key={i} className="w-8 h-8" />)}
          </div>
        </div>
        <div className="px-6 md:px-12 pb-12">
          <div className="relative -mt-16 mb-8 flex justify-between items-end">
            <div className="w-32 h-32 rounded-[2.5rem] bg-slate-900 border-8 border-white flex items-center justify-center text-emerald-400 shadow-xl overflow-hidden relative">
              {user.kycFaceImage ? (
                <img src={user.kycFaceImage} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <UserIcon className="w-16 h-16" />
              )}
              {user.subscription.status === SubscriptionStatus.ACTIVE && (
                <div className="absolute top-2 right-2 bg-amber-400 rounded-full p-1.5 shadow-lg border-2 border-slate-900">
                  <Zap className="w-4 h-4 text-slate-900 fill-current" />
                </div>
              )}
            </div>
            <div className="mb-4">
               <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full border font-black text-[10px] uppercase tracking-widest ${user.kycStatus === KycStatus.VERIFIED || user.kycStatus === KycStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600 border-emerald-100' : 'bg-amber-50 text-amber-600 border-amber-100'}`}>
                 {(user.kycStatus === KycStatus.VERIFIED || user.kycStatus === KycStatus.COMPLETED) ? <CheckCircle2 className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />} 
                 KYC {user.kycStatus}
               </span>
            </div>
          </div>
          <div className="flex flex-col md:flex-row md:items-end justify-between gap-6">
            <div>
              <h1 className="text-3xl font-black text-slate-800 tracking-tight uppercase">{user.name}</h1>
              <div className="flex items-center gap-3 mt-2">
                <span className="px-3 py-1 bg-slate-100 text-slate-600 text-[10px] font-black uppercase rounded-lg tracking-widest">{displayRole}</span>
                <span className="text-slate-400 text-xs font-mono">Blockchain Node: {user.id}</span>
              </div>
            </div>
            <div className="flex gap-3">
              <button className="px-6 py-3 bg-slate-800 text-white rounded-2xl font-black uppercase tracking-widest text-xs hover:bg-slate-900 transition flex items-center gap-2">
                <Settings className="w-4 h-4" />
                Security
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="grid md:grid-cols-3 gap-8">
        <div className="md:col-span-1 space-y-8">
          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2">
              <Activity className="w-4 h-4 text-emerald-600" /> Performance Pulse
            </h3>
            <RoleSummary />
            <div className="pt-4 border-t border-slate-100">
               <div className="bg-slate-50 p-4 rounded-2xl space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Provenance Badge</span>
                    <ShieldCheck className="w-4 h-4 text-emerald-500" />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black text-slate-400 uppercase">Account Integrity</span>
                    <span className="text-[10px] font-black text-emerald-600 uppercase tracking-widest">Signed</span>
                  </div>
               </div>
            </div>
          </div>

          {requiresKyc && (
            <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2">
                 <ShieldCheck className="w-4 h-4 text-blue-600" /> Identity Assets
              </h3>
              <div className="space-y-4">
                 {user.kycStatus === KycStatus.NOT_STARTED || user.kycStatus === KycStatus.REJECTED ? (
                    <div className="space-y-4">
                      <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic">Your account requires one-time identity verification to participate in the supply chain.</p>
                      <button 
                        onClick={() => setShowKycFlow(true)}
                        className="w-full py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-xl font-black uppercase text-[10px] tracking-widest transition"
                      >
                        Start Verification
                      </button>
                    </div>
                 ) : (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <FileText className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-600 uppercase">Gov ID Scan</span>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <div className="flex items-center justify-between p-3 bg-slate-50 rounded-xl">
                        <div className="flex items-center gap-2">
                          <Camera className="w-4 h-4 text-slate-400" />
                          <span className="text-[10px] font-black text-slate-600 uppercase">Face Match</span>
                        </div>
                        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                      <p className="text-[8px] text-slate-400 font-bold text-center uppercase mt-2">Submitted {user.kycSubmittedAt ? new Date(user.kycSubmittedAt).toLocaleDateString() : 'N/A'}</p>
                    </div>
                 )}
              </div>
            </div>
          )}

          <div className="bg-white p-8 rounded-[2rem] border border-slate-200 shadow-sm space-y-6">
            <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest border-b border-slate-100 pb-4 flex items-center gap-2">
               <CreditCard className="w-4 h-4 text-blue-600" /> Subscription
            </h3>
            <div className="space-y-4">
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500">Current Plan</span>
                 <span className="text-[10px] font-black text-slate-800 uppercase tracking-widest">{user.subscription.tier}</span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500">Status</span>
                 <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${user.subscription.status === SubscriptionStatus.EXPIRED ? 'bg-red-50 text-red-600' : 'bg-emerald-50 text-emerald-600'}`}>
                   {user.subscription.status}
                 </span>
               </div>
               <div className="flex justify-between items-center">
                 <span className="text-xs font-bold text-slate-500">Renewal</span>
                 <span className="text-[10px] font-black text-slate-800 uppercase">{user.subscription.expiryDate}</span>
               </div>
            </div>
          </div>
        </div>

        <div className="md:col-span-2 space-y-8">
          {/* Enhancement: Verified / Procured Batches for Farmers */}
          {user.role === UserRole.FARMER && (
             <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm animate-in slide-in-from-right-4 duration-500">
                <div className="flex items-center justify-between mb-8">
                    <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
                        <BadgeCheck className="w-5 h-5 text-emerald-600" />
                        Verified / Procured Batches
                    </h3>
                    <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{myVerifiedBatches.length} Verified</span>
                </div>
                
                <div className="space-y-6">
                    {myVerifiedBatches.length === 0 ? (
                        <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                            <Microscope className="w-10 h-10 text-slate-300 mx-auto mb-3" />
                            <p className="text-[10px] font-black text-slate-400 uppercase">No manufacturers have audited your manifests yet</p>
                        </div>
                    ) : myVerifiedBatches.map(batch => {
                        const report = verifiedManifests[batch.id];
                        return (
                            <div key={batch.id} className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 flex flex-col md:flex-row justify-between gap-6 group hover:border-emerald-200 transition-all">
                                <div className="flex-1 space-y-3">
                                    <div className="flex items-center gap-3">
                                        <div className="w-10 h-10 bg-white rounded-xl flex items-center justify-center text-emerald-600 shadow-sm">
                                            <Tractor className="w-5 h-5" />
                                        </div>
                                        <div>
                                            <h4 className="font-black text-slate-800 text-sm uppercase">{batch.cropName}</h4>
                                            <div className="text-[8px] font-mono text-slate-400 uppercase tracking-widest">Batch: {batch.id}</div>
                                        </div>
                                    </div>
                                    <div className="p-4 bg-white rounded-2xl border border-slate-50 space-y-2">
                                        <div className="flex items-center gap-2 text-blue-600">
                                            <Microscope className="w-3.5 h-3.5" />
                                            <span className="text-[10px] font-black uppercase tracking-widest">Audit verdict from {report.verifierName}</span>
                                        </div>
                                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed italic line-clamp-2">"{report.verdict}"</p>
                                    </div>
                                </div>
                                <div className="shrink-0 flex flex-col items-center md:items-end justify-between">
                                    <div className="text-right">
                                        <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Trust Score</div>
                                        <div className="text-2xl font-black text-emerald-600">{report.score}%</div>
                                    </div>
                                    <div className="flex items-center gap-1.5 text-emerald-500 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-100">
                                        <ShieldCheck className="w-3 h-3" />
                                        <span className="text-[8px] font-black uppercase">Verified Node</span>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
             </section>
          )}

          {/* Subscription Upgrade Section */}
          <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
                <Zap className="w-5 h-5 text-amber-500" />
                Network Participation Plans
              </h3>
              {user.subscription.status === SubscriptionStatus.EXPIRED && (
                <div className="flex items-center gap-2 text-red-500">
                  <AlertCircle className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-widest">Renewal Required</span>
                </div>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {isSupplySide ? (
                <>
                  {[
                    { tier: SubscriptionTier.BASIC, price: 299, desc: 'Limited connections & listings' },
                    { tier: SubscriptionTier.STANDARD, price: 599, desc: 'Moderate connections & full features' },
                    { tier: SubscriptionTier.PRO, price: 999, desc: 'High limits & priority handling' },
                    { tier: SubscriptionTier.ENTERPRISE, price: 1299, desc: 'Unlimited everything & highest priority' },
                  ].map((plan) => (
                    <div key={plan.tier} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between ${user.subscription.tier === plan.tier ? 'bg-emerald-50 border-emerald-500 shadow-inner' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{plan.tier}</h4>
                          {user.subscription.tier === plan.tier && <Check className="w-4 h-4 text-emerald-600" />}
                        </div>
                        <div className="text-2xl font-black text-slate-900 mb-2">₹{plan.price}</div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6">{plan.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleUpgrade(plan.tier, plan.price)}
                        disabled={user.subscription.tier === plan.tier && user.subscription.status === SubscriptionStatus.ACTIVE}
                        className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${user.subscription.tier === plan.tier ? 'bg-emerald-600 text-white shadow-lg' : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-600 hover:text-white hover:border-emerald-600'}`}
                      >
                        {user.subscription.tier === plan.tier ? 'Plan Active' : 'Select Plan'}
                      </button>
                    </div>
                  ))}
                </>
              ) : user.role === UserRole.CONSUMER ? (
                <>
                  {[
                    { tier: SubscriptionTier.CONSUMER_FREE, price: 0, desc: '7 Day Free Trial of Provenance Data' },
                    { tier: SubscriptionTier.CONSUMER_MONTHLY, price: 19, desc: 'Full monthly access to safety logs' },
                    { tier: SubscriptionTier.CONSUMER_YEARLY, price: 199, desc: 'Annual premium transparency pass' },
                  ].map((plan) => (
                    <div key={plan.tier} className={`p-6 rounded-[2rem] border-2 transition-all flex flex-col justify-between ${user.subscription.tier === plan.tier ? 'bg-emerald-50 border-emerald-500 shadow-inner' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'}`}>
                      <div>
                        <div className="flex justify-between items-start mb-2">
                          <h4 className="font-black text-slate-800 text-sm uppercase tracking-tight">{plan.tier}</h4>
                        </div>
                        <div className="text-2xl font-black text-slate-900 mb-2">₹{plan.price}</div>
                        <p className="text-[10px] text-slate-500 font-medium leading-relaxed mb-6">{plan.desc}</p>
                      </div>
                      <button 
                        onClick={() => handleUpgrade(plan.tier, plan.price)}
                        className={`w-full py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all ${user.subscription.tier === plan.tier ? 'bg-emerald-600 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:bg-emerald-600 hover:text-white'}`}
                      >
                        {user.subscription.tier === plan.tier ? 'Current Plan' : 'Select Plan'}
                      </button>
                    </div>
                  ))}
                </>
              ) : (
                <div className="col-span-full py-12 text-center bg-slate-50 rounded-3xl text-slate-400 font-black uppercase tracking-widest text-xs">
                  Regulatory node - Managed access
                </div>
              )}
            </div>
          </section>

          <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm">
            <div className="flex items-center justify-between mb-8">
              <h3 className="font-black text-slate-800 flex items-center gap-3 uppercase text-xs tracking-widest">
                <History className="w-5 h-5 text-emerald-600" />
                Activity Manifest
              </h3>
              <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest">{userSavedItems.length} Saved</span>
            </div>

            <div className="space-y-4">
              {userSavedItems.length === 0 ? (
                <div className="text-center py-20 bg-slate-50 rounded-[2rem] border-2 border-dashed border-slate-200">
                  <div className="w-12 h-12 bg-white rounded-2xl flex items-center justify-center text-slate-200 mx-auto mb-4 shadow-sm">
                    <Package className="w-6 h-6" />
                  </div>
                  <p className="text-slate-400 font-black uppercase text-[10px] tracking-widest">No provenance records tracked.</p>
                  <Link to="/scan" className="text-emerald-600 font-black text-[10px] uppercase tracking-widest mt-4 inline-block hover:underline">Start Verifying</Link>
                </div>
              ) : userSavedItems.map(si => {
                const details = getSavedDetails(si);
                if (!details) return null;
                const isProduct = si.type === 'product';

                return (
                  <div key={si.saved_id} className="group bg-slate-50 p-5 rounded-3xl border border-slate-100 hover:border-emerald-200 transition flex items-center justify-between gap-4">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 shadow-sm bg-white`}>
                        {isProduct ? <Package className="w-6 h-6 text-purple-600" /> : <Tractor className="w-6 h-6 text-emerald-600" />}
                      </div>
                      <div className="overflow-hidden">
                        <div className="flex items-center gap-2">
                          <h4 className="font-black text-slate-800 text-sm truncate max-w-[150px]">{(details as Product).name || (details as HarvestBatch).cropName}</h4>
                          <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isProduct ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>
                            {si.type}
                          </span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      </div>

      {showKycFlow && (
        <KYCVerification 
          user={user} 
          onComplete={handleKycComplete} 
          onCancel={() => setShowKycFlow(false)} 
        />
      )}
    </div>
  );
};

export default Profile;
