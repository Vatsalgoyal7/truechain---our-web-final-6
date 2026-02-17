
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams, Link } from 'react-router-dom';
import { User, UserRole, HarvestBatch, Product, FoodCategory, CertAuthority, LabParameter, BatchStatus, SubscriptionStatus, Wallet, ProcessingManifest, DiscoverableNode, SubscriptionTier, TradeOrder, OrderStatus, SmartContract, SupplyChainEvent, AuditRecord } from '../../types';
import { ALLOWED_FOOD_CATEGORIES, CERT_AUTHORITIES, MOCK_LAB_LIMITS, CATEGORY_IMAGES } from '../../constants';
import { generateBlockchainHash } from '../../services/blockchain';
import { analyzeLabReports, generateProductContent } from '../../services/gemini';
import { getCurrentLocation } from '../../services/location';
import { 
  Scan, Microscope, ClipboardCheck, ArrowUpRight, CheckCircle2, AlertCircle, 
  Loader2, ShieldCheck, FileText, TrendingUp, History, Download, 
  Eye, Layers, Activity, AlertTriangle, Clock, Search, Info, Trash2, 
  Package, Tractor, Store, Calendar, ExternalLink, Sparkles, Navigation, Zap, Factory, Globe, FlaskConical, Filter, MessageSquare, Handshake, ChevronRight, X,
  MapPin, CloudSun, ShoppingCart, ShieldCheck as VerifiedBadge, Sprout, ChevronLeft, LayoutDashboard, IndianRupee, PieChart, Bell, ArrowRight, Gauge, Construction
} from 'lucide-react';
import InventoryControls from '../inventory/InventoryControls';
import ChainStatusPanel from '../ChainStatusPanel';
import NearbyNetwork from '../NearbyNetwork';
import { TrueChainDB } from '../../services/storage';

interface ManufacturerDashboardProps {
  user: User;
  batches: HarvestBatch[];
  products: Product[];
  setProducts: React.Dispatch<React.SetStateAction<Product[]>>;
  onUpdateQuantity: (id: string, delta: number, reason: any) => void;
  onDeleteProduct: (id: string) => void;
  wallet: Wallet;
  onAuditLog?: (record: Omit<AuditRecord, 'id' | 'timestamp' | 'blockchainHash'>) => Promise<void>;
}

const ManufacturerDashboard: React.FC<ManufacturerDashboardProps> = ({ user, batches, products, setProducts, onUpdateQuantity, onDeleteProduct, wallet, onAuditLog }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [step, setStep] = useState(1);
  const [selectedBatch, setSelectedBatch] = useState<HarvestBatch | null>(null);
  const [viewingFarmer, setViewingFarmer] = useState<HarvestBatch | null>(null);
  const [labParams, setLabParams] = useState<LabParameter[]>([]);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [mfgLocation, setMfgLocation] = useState('Verifying location...');
  const [processingSteps, setProcessingSteps] = useState<string[]>([]);
  
  const [myTrades, setMyTrades] = useState<TradeOrder[]>([]);

  useEffect(() => {
    const all = TrueChainDB.getTradeOrders();
    setMyTrades(all.filter(t => t.sellerId === user.id || t.buyerId === user.id));
  }, [user.id]);

  const isSubscriptionActive = user.subscription.status === SubscriptionStatus.ACTIVE || user.subscription.status === SubscriptionStatus.TRIAL;

  // --- Insight Calculations ---
  const myProducts = useMemo(() => products.filter(p => p.manufacturerId === user.id), [products, user.id]);
  const activeSKUsCount = myProducts.length;
  const certifiedProductsCount = myProducts.filter(p => p.certification.status === 'Certified').length;
  const procurementCosts = useMemo(() => 
    myTrades.filter(t => t.buyerId === user.id && t.status === OrderStatus.COMPLETED).reduce((acc, t) => acc + t.totalPrice, 0)
  , [myTrades, user.id]);
  
  const estimatedRevenue = useMemo(() => 
    myProducts.reduce((acc, p) => acc + (p.currentQuantity * (p.pricePerUnit || 0)), 0)
  , [myProducts]);

  const pendingSourcingCount = myTrades.filter(t => t.buyerId === user.id && t.status !== OrderStatus.COMPLETED).length;

  // Plan Based Sourcing logic
  const sourcingLimit = useMemo(() => {
    switch(user.subscription.tier) {
      case SubscriptionTier.BASIC: return 15;
      case SubscriptionTier.STANDARD: return 50;
      case SubscriptionTier.PRO: return 100;
      case SubscriptionTier.ENTERPRISE: return 999;
      default: return 5;
    }
  }, [user.subscription.tier]);

  const hasAdvancedFilters = user.subscription.tier === SubscriptionTier.PRO || user.subscription.tier === SubscriptionTier.ENTERPRISE;

  const handleConnectSuccess = (order: TradeOrder) => {
    const all = TrueChainDB.getTradeOrders();
    TrueChainDB.saveTradeOrders([order, ...all]);
    setMyTrades([order, ...myTrades]);

    onAuditLog?.({
      actionType: 'NODE_CONNECT_SUCCESS',
      actorId: user.id,
      actorRole: UserRole.MANUFACTURER,
      targetId: order.sellerId,
      prevStatus: 'Discovery',
      nextStatus: 'Contract Initialized',
      details: `Established B2B sourcing connection with ${order.sellerName} for ${order.assetName}.`
    });

    alert("Node Linkage Finalized. Sourcing order anchored to blockchain ledger.");
  };

  const handlePurchaseFromFarmer = async (batch: HarvestBatch) => {
     const orderId = 'ORD-P-' + Math.random().toString(36).substr(2, 6).toUpperCase();
     const contract: SmartContract = {
        contractId: 'CNTR-' + orderId,
        terms: `Purchase of ${batch.quantity} Units of ${batch.cropName}. Delivery within 48hrs.`,
        complianceRef: 'FSSAI-MFR-2024-PROC',
        penaltyClauses: '15% fee for quality mismatch.',
        sellerId: batch.farmerId,
        buyerId: user.id,
        sellerSignature: 'SIGNED-BY-FARMER-' + batch.farmerId,
        buyerSignature: 'SIGNED-BY-BUYER-' + user.id,
        timestamp: new Date().toISOString(),
        validUntil: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()
     };

     const newOrder: TradeOrder = {
        id: orderId,
        sellerId: batch.farmerId,
        sellerName: batch.farmerName,
        buyerId: user.id,
        buyerName: user.name,
        assetId: batch.id,
        assetType: 'Batch',
        assetName: batch.cropName,
        quantity: parseInt(batch.quantity),
        unitPrice: batch.pricePerUnit || 45,
        totalPrice: parseInt(batch.quantity) * (batch.pricePerUnit || 45),
        status: OrderStatus.PENDING_COLLECTOR,
        contract,
        events: [{
          type: 'ORDER_CREATED',
          timestamp: new Date().toISOString(),
          location: { address: 'TrueChain Smart Hub', lat: 0, lng: 0 },
          actorId: user.id,
          actorRole: user.role,
          blockchainHash: 'INIT-HASH-' + orderId
        }],
        isVerified: true,
        category: batch.category,
        blockchainHash: 'BLOCK-TX-' + Math.random().toString(36).substr(2, 10).toUpperCase()
     };

     // Enhancement: Automatic Manifest-to-Farmer-Profile Linkage
     const manifestAnalysisReport = {
        verifierNodeId: user.id,
        verifierName: user.name,
        score: batch.qualityGrade === 'A+' ? 99 : 95,
        verdict: "Batch provenance verified through digital ledger audit. Soil and harvest telemetry match regional agricultural standards.",
        reportHash: 'MANIFEST-AUDIT-' + Math.random().toString(36).substr(2, 8).toUpperCase()
     };

     // Permanently link the report to the Batch ID and Farmer Profile
     TrueChainDB.saveVerifiedManifest(batch.id, manifestAnalysisReport);

     const trades = TrueChainDB.getTradeOrders();
     TrueChainDB.saveTradeOrders([newOrder, ...trades]);
     setMyTrades([newOrder, ...myTrades]);

     onAuditLog?.({
       actionType: 'MANIFEST_VERIFICATION_LINK',
       actorId: user.id,
       actorRole: UserRole.MANUFACTURER,
       targetId: batch.id,
       prevStatus: 'Raw Manifest',
       nextStatus: 'Verified Genesis Manifest',
       details: `Linked verified manifest report (${manifestAnalysisReport.score}%) to batch ${batch.id}. Anchored to Farmer Profile ${batch.farmerId}.`
     });

     onAuditLog?.({
       actionType: 'DIRECT_PROCUREMENT_INIT',
       actorId: user.id,
       actorRole: UserRole.MANUFACTURER,
       targetId: batch.id,
       prevStatus: 'Genesis Batch',
       nextStatus: OrderStatus.PENDING_COLLECTOR,
       details: `Initiated procurement for ${batch.cropName} from ${batch.farmerName}.`
     });

     setViewingFarmer(null);
  };

  const handleConfirmReceipt = async (order: TradeOrder) => {
    const trades = TrueChainDB.getTradeOrders();
    const updated = trades.map(t => {
      if (t.id === order.id) {
         return {
            ...t, 
            status: OrderStatus.COMPLETED,
            events: [...t.events, {
               type: 'BUYER_CONFIRMED',
               timestamp: new Date().toISOString(),
               location: { address: user.location?.address || 'Facility Node', lat: 0, lng: 0 },
               actorId: user.id,
               actorRole: user.role,
               blockchainHash: 'FINAL-HASH-' + Math.random().toString(36).substr(2, 6)
            } as SupplyChainEvent]
         };
      }
      return t;
    });
    TrueChainDB.saveTradeOrders(updated);
    setMyTrades(updated.filter(t => t.sellerId === user.id || t.buyerId === user.id));
    TrueChainDB.updateUserTrust(user.id, 2); 

    onAuditLog?.({
      actionType: 'PROCUREMENT_RECEIPT_CONFIRM',
      actorId: user.id,
      actorRole: UserRole.MANUFACTURER,
      targetId: order.id,
      prevStatus: order.status,
      nextStatus: OrderStatus.COMPLETED,
      details: `Confirmed safe receipt of ${order.assetName}. Payload anchored to node.`
    });

    alert("Asset successfully linked to your node. Manifest finalized.");
  };

  const finalizeCertification = async () => {
    if (!isSubscriptionActive) return;
    setIsAnalyzing(true);
    const productId = 'P' + Math.random().toString(36).substr(2, 6).toUpperCase();
    const manifestData: Omit<ProcessingManifest, 'blockchainHash'> = {
       productId,
       manufacturerId: user.id,
       inputBatchId: selectedBatch!.id,
       processingSteps,
       qualityChecks: labParams.filter(p => p.passed).map(p => p.name),
       certifications: [CertAuthority.FSSAI],
       timestamp: new Date().toISOString()
    };
    const manifestHash = await generateBlockchainHash(manifestData);
    const prod: Product = {
      id: productId,
      manufacturerId: user.id,
      name: products[0]?.name || "New SKU",
      category: selectedBatch!.category,
      batchId: selectedBatch!.id,
      mfgDate: new Date().toISOString().split('T')[0],
      expiryDate: new Date(Date.now() + 180 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
      qrCode: 'qr-placeholder',
      currentQuantity: 100,
      blockchainHash: await generateBlockchainHash(manifestData),
      pricePerUnit: 120,
      certification: {
        authority: CertAuthority.FSSAI,
        matchPercentage: 98,
        status: 'Certified',
        parameters: labParams,
        reportHash: manifestHash
      },
      processingManifest: { ...manifestData, blockchainHash: manifestHash },
      imageUrl: CATEGORY_IMAGES[selectedBatch!.category] || CATEGORY_IMAGES[FoodCategory.PACKAGED],
      isSeedData: false
    };
    const nextProducts = [prod, ...products];
    setProducts(nextProducts);
    TrueChainDB.saveProducts(nextProducts);

    onAuditLog?.({
      actionType: 'PRODUCT_CERTIFICATION_FINAL',
      actorId: user.id,
      actorRole: UserRole.MANUFACTURER,
      targetId: productId,
      prevStatus: 'Input Batch',
      nextStatus: 'Certified SKU',
      details: `Certified ${prod.name} with score ${prod.certification.matchPercentage}%. Linked to batch ${prod.batchId}.`
    });

    setIsAnalyzing(false);
    setStep(3);
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <ChainStatusPanel user={user} wallet={wallet} />

      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Facility Insights', icon: LayoutDashboard },
          { id: 'workflow', label: 'Processing Line', icon: Factory },
          { id: 'sourcing', label: 'Farmer Hub', icon: Tractor },
          { id: 'trades', label: 'Procurement', icon: Handshake },
          { id: 'archive', label: 'Audit Trail', icon: History }
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

      {/* OVERVIEW TAB - DASHBOARD SUMMARY & GUIDANCE */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Facility Economics */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><IndianRupee className="w-24 h-24 text-blue-400" /></div>
               <div className="text-[10px] font-black text-blue-500 uppercase tracking-[0.2em] mb-4">Node Financials</div>
               <div className="flex flex-col gap-1">
                 <div className="text-4xl font-black text-white tracking-tighter">₹{estimatedRevenue.toLocaleString()}</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Est. Inventory Value</div>
               </div>
               <div className="mt-8 flex items-center gap-6">
                 <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Procurement Cost</div>
                    <div className="text-lg font-black text-red-400">₹{procurementCosts.toLocaleString()}</div>
                 </div>
                 <div className="w-px h-8 bg-white/10"></div>
                 <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Escrowed Funds</div>
                    <div className="text-lg font-black text-emerald-400">₹{wallet.pendingBalance.toLocaleString()}</div>
                 </div>
               </div>
            </div>

            {/* Capacity & Production Summary */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-500"><PieChart className="w-24 h-24 text-purple-600" /></div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Construction className="w-3 h-3 text-purple-600" /> Plant Utilization
               </div>
               <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Facility Load</span>
                    <span className="text-xl font-black text-purple-600">64% <span className="text-[10px] font-medium text-slate-400 uppercase tracking-tighter">Active</span></span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Certified SKUs</span>
                    <span className="text-xl font-black text-emerald-600">{certifiedProductsCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Idle Capacity</span>
                    <span className="text-xl font-black text-slate-400">36%</span>
                  </div>
               </div>
            </div>

            {/* Quick Actions & Guidance */}
            <div className="bg-blue-50 p-8 rounded-[2.5rem] border border-blue-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black text-blue-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Zap className="w-3 h-3 fill-current" /> Workflow Shortcuts
                </div>
                <div className="space-y-3">
                  <button onClick={() => setSearchParams({ tab: 'workflow' })} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 transition-all group/btn shadow-sm">
                    <span className="text-xs font-black text-slate-800 uppercase">Manage Production SKUs</span>
                    <ArrowRight className="w-4 h-4 text-blue-500 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => setSearchParams({ tab: 'sourcing' })} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-blue-100 hover:border-blue-300 transition-all group/btn shadow-sm">
                    <span className="text-xs font-black text-slate-800 uppercase">Procure Raw Material</span>
                    <ArrowRight className="w-4 h-4 text-blue-500 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Guidance & Notifications */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                 <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center gap-3">
                    <Bell className="w-5 h-5 text-blue-600" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Next Facility Actions</h3>
                 </div>
                 <div className="p-8 space-y-6">
                    {[
                      { t: 'Pending Certification', d: 'Batch P-SS-01 requires a final Authorizer signature for retail release.', c: 'border-purple-100 bg-purple-50/30 text-purple-700', a: 'Check Audit', tab: 'archive' },
                      { t: 'Logistics Link Required', d: 'A2 Milk Batch from Meadow Fresh is arriving in 2 hours. Link Transporter Node.', c: 'border-blue-100 bg-blue-50/30 text-blue-700', a: 'Manage Trades', tab: 'trades' },
                      { t: 'Market Demand Alert', d: 'Regional demand for Organic Soy Milk is up by 40%. Consider shifting production.', c: 'border-emerald-100 bg-emerald-50/30 text-emerald-700', a: 'Analyze Trends' }
                    ].map((step, i) => (
                      <div key={i} className={`p-6 rounded-[2rem] border ${step.c} flex flex-col md:flex-row justify-between items-start md:items-center gap-6 animate-in fade-in slide-in-from-bottom-2`} style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex-1">
                           <div className="text-[10px] font-black uppercase tracking-widest mb-1">{step.t}</div>
                           <p className="text-sm font-medium leading-relaxed opacity-80">{step.d}</p>
                        </div>
                        <button 
                          onClick={() => step.tab && setSearchParams({ tab: step.tab })}
                          className="px-6 py-3 bg-white/50 backdrop-blur border border-current rounded-xl text-[9px] font-black uppercase tracking-widest hover:bg-white transition-all shrink-0 active:scale-95"
                        >
                           {step.a}
                        </button>
                      </div>
                    ))}
                 </div>
              </section>
            </div>

            <div className="space-y-8">
               {/* Upstream Readiness */}
               <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><Globe className="w-32 h-32 text-blue-600" /></div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                     <VerifiedBadge className="w-4 h-4 text-blue-500" /> Upstream Status
                  </h3>
                  <div className="space-y-6">
                     {[
                        { label: 'Farmer Verified', status: 'Optimal', c: 'text-emerald-600', val: '100%' },
                        { label: 'Raw Inventory', status: 'Stable', c: 'text-blue-600', val: 'Low Risk' },
                        { label: 'Transit Links', status: 'Awaiting', c: 'text-amber-600', val: pendingSourcingCount },
                        { label: 'Compliance Index', status: 'High', c: 'text-emerald-600', val: 'A+' }
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                           <div>
                              <div className="text-xs font-black text-slate-800 uppercase">{item.label}</div>
                              <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">{item.status}</div>
                           </div>
                           <div className="text-right">
                              <div className={`text-[11px] font-black ${item.c} uppercase`}>{item.val}</div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="mt-10 p-5 bg-slate-900 rounded-3xl text-white">
                     <div className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-2 italic">Strategy Insight</div>
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed">By sourcing from Farmer Node Hillside Organics, your next SKU will achieve a 99% Provenance Score automatically.</p>
                  </div>
               </section>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRY TAB (Workflow) - PRESERVED WORKFLOW */}
      {currentTab === 'workflow' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                  <Factory className="w-5 h-5 text-purple-600" /> Processing Manifests
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-[0.2em]">
                    <tr>
                      <th className="px-8 py-5">Product SKU</th>
                      <th className="px-8 py-5">Input Source</th>
                      <th className="px-8 py-5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50">
                    {products.filter(p => p.manufacturerId === user.id).map(p => (
                      <tr key={p.id} className="hover:bg-slate-50/50 transition">
                        <td className="px-8 py-6">
                           <div className="font-black text-slate-800 text-sm uppercase">{p.name}</div>
                           <div className="text-[9px] font-mono text-slate-400 uppercase tracking-widest">UID: {p.id}</div>
                        </td>
                        <td className="px-8 py-6">
                           <div className="text-xs font-bold text-slate-600 uppercase tracking-tight">Batch: {p.batchId}</div>
                        </td>
                        <td className="px-8 py-6 text-right">
                           <Link to={`/traceability/${p.id}`} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-purple-600 transition inline-block"><ClipboardCheck className="w-4 h-4" /></Link>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </section>
          </div>
          <div className="space-y-8">
             <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                <div className="absolute top-0 right-0 p-6 opacity-5"><Zap className="w-32 h-32" /></div>
                <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8">Facility Analytics</h3>
                <div className="space-y-6">
                   <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                      <div className="text-[9px] font-black text-slate-400 uppercase">Trust Index</div>
                      <div className="text-xl font-black text-emerald-600">{user.trustMetrics.trustScore}%</div>
                   </div>
                   <div className="p-4 bg-slate-50 rounded-2xl flex justify-between items-center">
                      <div className="text-[9px] font-black text-slate-400 uppercase">Active SKUs</div>
                      <div className="text-xl font-black text-purple-600">{products.filter(p => p.manufacturerId === user.id).length}</div>
                   </div>
                </div>
             </div>
          </div>
        </div>
      )}

      {/* SOURCING TAB - PRESERVED WORKFLOW */}
      {currentTab === 'sourcing' && (
        <div className="space-y-8 animate-in slide-in-from-right-4">
           <div className="bg-white p-8 rounded-[3rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
              <div className="flex items-center gap-5">
                 <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
                    <Tractor className="w-8 h-8" />
                 </div>
                 <div>
                    <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Verified Farmer Discovery</h2>
                    <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Showing {Math.min(batches.length, sourcingLimit)} farmers for {user.subscription.tier} tier.</p>
                 </div>
              </div>
              {hasAdvancedFilters && (
                <div className="flex items-center gap-3 bg-slate-50 p-2 rounded-2xl border border-slate-100">
                   <div className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">Soil Index</div>
                   <div className="px-4 py-2 bg-white rounded-xl text-[9px] font-black uppercase tracking-widest shadow-sm">Weather Verified</div>
                   <Filter className="w-4 h-4 text-slate-400 mx-2" />
                </div>
              )}
           </div>

           <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {batches.slice(0, sourcingLimit).map(batch => (
                 <div key={batch.id} className="group bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-2xl transition-all duration-500 flex flex-col relative">
                    <div className="aspect-video bg-slate-100 relative">
                       <img src={batch.imageUrl} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700" />
                       <div className="absolute top-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-xl shadow-lg border border-white/20 flex items-center gap-2">
                          <VerifiedBadge className="w-3 h-3 text-emerald-600" />
                          <span className="text-[10px] font-black text-slate-800 uppercase tracking-tighter">Verified Node</span>
                       </div>
                    </div>
                    <div className="p-8 space-y-4 flex-1">
                       <div>
                          <div className="flex justify-between items-start mb-1">
                             <h4 className="font-black text-slate-800 text-lg uppercase tracking-tight">{batch.farmerName}</h4>
                             <div className="flex items-center gap-1 text-emerald-600">
                                <TrendingUp className="w-3 h-3" />
                                <span className="text-[10px] font-black uppercase">{batch.qualityGrade} Quality</span>
                             </div>
                          </div>
                          <p className="text-[10px] text-slate-400 font-bold uppercase tracking-widest line-clamp-1">{batch.location.address}</p>
                       </div>
                       
                       <div className="grid grid-cols-2 gap-4">
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Harvest Window</div>
                             <div className="text-[10px] font-black text-slate-800 uppercase truncate">{batch.harvestDate}</div>
                          </div>
                          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
                             <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">Listed Price</div>
                             <div className="text-[10px] font-black text-emerald-600 uppercase">₹{batch.pricePerUnit || 45}/U</div>
                          </div>
                       </div>

                       <button 
                        onClick={() => setViewingFarmer(batch)}
                        className="w-full py-4 bg-slate-900 text-white rounded-[1.5rem] font-black uppercase text-[10px] tracking-[0.2em] group-hover:bg-emerald-600 transition-all flex items-center justify-center gap-2 active:scale-95"
                       >
                          Analyze Manifest <Eye className="w-4 h-4" />
                       </button>
                    </div>
                 </div>
              ))}
           </div>
        </div>
      )}

      {/* TRADES TAB - PRESERVED WORKFLOW */}
      {currentTab === 'trades' && (
        <div className="space-y-8 animate-in slide-in-from-right-4">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-blue-600" /> Procurement Pipeline
                 </h3>
              </div>
              <div className="divide-y divide-slate-50">
                 {myTrades.map(trade => (
                    <div key={trade.id} className="p-8 flex flex-col lg:flex-row justify-between items-center gap-8">
                       <div className="flex items-center gap-6">
                          <div className="w-16 h-16 bg-blue-50 text-blue-600 rounded-2xl flex items-center justify-center shadow-inner"><Package className="w-8 h-8" /></div>
                          <div>
                             <div className="text-[10px] font-mono text-slate-400 font-bold uppercase tracking-widest mb-1">Contract ID: {trade.id}</div>
                             <h4 className="font-black text-slate-800 text-lg uppercase">{trade.assetName}</h4>
                             <p className="text-[10px] text-slate-500 font-bold uppercase">Source: {trade.sellerName} • {trade.quantity} Units @ ₹{trade.unitPrice}</p>
                          </div>
                       </div>
                       <div className="flex items-center gap-4">
                          {trade.status === OrderStatus.DELIVERED ? (
                             <button onClick={() => handleConfirmReceipt(trade)} className="px-8 py-3 bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95">Confirm Receipt & Anchor</button>
                          ) : (
                             <span className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-100 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center gap-2">
                                <Clock className="w-4 h-4" /> {trade.status === OrderStatus.PENDING_COLLECTOR ? 'Awaiting Transporter' : trade.status}
                             </span>
                          )}
                       </div>
                    </div>
                 ))}
                 {myTrades.length === 0 && <div className="py-20 text-center text-slate-300 font-black uppercase text-[10px]">No active procurement records</div>}
              </div>
           </div>
        </div>
      )}

      {/* ARCHIVE/AUDIT TAB - PRESERVED WORKFLOW */}
      {currentTab === 'archive' && (
        <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm animate-in fade-in">
           <div className="p-8 border-b border-slate-100 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                 <History className="w-5 h-5 text-blue-600" /> Facility Compliance History
              </h3>
           </div>
           <div className="p-20 text-center text-slate-300 font-black uppercase text-[10px] tracking-[0.2em] italic">Full historical audit logs accessible via blockchain explorer</div>
        </div>
      )}

      {/* MODALS - PRESERVED */}
      {viewingFarmer && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md transition-all duration-300">
           <div className="bg-white w-full max-w-4xl rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-emerald-950 p-10 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-6">
                    <Tractor className="w-12 h-12 text-emerald-400" />
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight">{viewingFarmer.farmerName} Manifest</h3>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-emerald-400/60 text-[10px] font-black uppercase tracking-widest">Village: {viewingFarmer.genesisManifest?.farmerManifest?.identity.village || 'N/A'}</span>
                          <span className="px-2 py-0.5 bg-emerald-600/30 text-emerald-400 border border-emerald-400/20 text-[8px] font-black uppercase rounded">Authentic Blockchain Record</span>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setViewingFarmer(null)} className="text-slate-400 hover:text-white transition p-2 bg-white/5 rounded-full"><X className="w-6 h-6" /></button>
              </div>

              <div className="overflow-y-auto p-12 space-y-12 no-scrollbar">
                 <div className="grid md:grid-cols-2 gap-10">
                    <div className="space-y-6">
                       <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-3">
                          <MapPin className="w-5 h-5 text-red-500" /> Land & Geography Manifest
                       </h4>
                       <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                          <div className="flex justify-between text-xs font-black uppercase"><span className="text-slate-400">Total Land</span><span>{viewingFarmer.genesisManifest?.farmerManifest?.land.size || '12'} Acres</span></div>
                          <div className="flex justify-between text-xs font-black uppercase"><span className="text-slate-400">Soil Quality</span><span>{viewingFarmer.genesisManifest?.farmerManifest?.land.soilType || 'Loamy'}</span></div>
                          <div className="flex justify-between text-xs font-black uppercase"><span className="text-slate-400">Water Source</span><span>{viewingFarmer.genesisManifest?.farmerManifest?.land.waterSource || 'Borewell'}</span></div>
                          <div className="flex justify-between text-xs font-black uppercase"><span className="text-emerald-600">{viewingFarmer.genesisManifest?.farmerManifest?.land.pollutionRisk || 'Low'} Risk Verified</span></div>
                       </div>
                    </div>
                    <div className="space-y-6">
                       <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-3">
                          <CloudSun className="w-5 h-5 text-blue-500" /> Climate Telemetry
                       </h4>
                       <div className="bg-slate-50 p-6 rounded-[2rem] border border-slate-100 space-y-4">
                          <div className="flex justify-between text-xs font-black uppercase"><span className="text-slate-400">Rainfall</span><span>{viewingFarmer.genesisManifest?.farmerManifest?.environment.rainfallSummary || '420mm'}</span></div>
                          <div className="flex justify-between text-xs font-black uppercase"><span className="text-slate-400">Temp Cycle</span><span>{viewingFarmer.genesisManifest?.farmerManifest?.environment.tempRange || '22-30°C'}</span></div>
                          <div className="flex justify-between text-xs font-black uppercase"><span className="text-blue-600">Stable Season Certified</span></div>
                       </div>
                    </div>
                 </div>

                 <div className="space-y-6">
                    <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest flex items-center gap-3">
                       <Sprout className="w-5 h-5 text-emerald-600" /> Production Specifics
                    </h4>
                    <div className="grid grid-cols-3 gap-6">
                       {[
                         { l: 'Seed Type', v: viewingFarmer.genesisManifest?.farmerManifest?.seedType || 'Organic' },
                         { l: 'Pesticide Usage', v: viewingFarmer.genesisManifest?.farmerManifest?.pesticideUsage || 'None' },
                         { l: 'Cycle', v: `${viewingFarmer.genesisManifest?.farmerManifest?.sowingMonth || 'June'} - ${viewingFarmer.genesisManifest?.farmerManifest?.harvestingMonth || 'Oct'}` },
                         { l: 'Quantity Available', v: `${viewingFarmer.quantity} Units` },
                         { l: 'Expected Price', v: `₹${viewingFarmer.pricePerUnit || 45}` },
                         { l: 'Shelf Life', v: viewingFarmer.genesisManifest?.farmerManifest?.expectedShelfLife || '14 Days' }
                       ].map((item, idx) => (
                         <div key={idx} className="p-4 border border-slate-100 rounded-2xl bg-white shadow-sm">
                            <div className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">{item.l}</div>
                            <div className="text-[10px] font-black text-slate-800 uppercase">{item.v}</div>
                         </div>
                       ))}
                    </div>
                 </div>

                 <div className="p-8 bg-emerald-50 rounded-[2.5rem] border-2 border-emerald-100">
                    <h4 className="font-black text-emerald-800 text-xs uppercase mb-4 tracking-widest flex items-center gap-3">
                       <Handshake className="w-5 h-5" /> Smart Procurement Logic
                    </h4>
                    <p className="text-[11px] font-medium text-emerald-700 uppercase leading-relaxed">
                       Requesting connection will share your manufacturing profile with the farmer. On acceptance, a verified smart contract will be generated for payment escrow and Transporter node assignment.
                    </p>
                 </div>
              </div>

              <div className="p-10 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                 <button onClick={() => setViewingFarmer(null)} className="flex-1 py-5 bg-white border-2 border-slate-200 text-slate-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all">Cancel Discovery</button>
                 <button onClick={() => handlePurchaseFromFarmer(viewingFarmer)} className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-2xl shadow-emerald-600/40 flex items-center justify-center gap-3 active:scale-95">
                    <Handshake className="w-5 h-5" /> Initialize Direct Procurement
                 </button>
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default ManufacturerDashboard;
