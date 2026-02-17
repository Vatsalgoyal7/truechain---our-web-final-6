
import React, { useState, useEffect, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { User, HarvestBatch, FoodCategory, BatchStatus, BatchNote, SeasonalPlan, InventoryLog, UserRole, Wallet, GenesisManifest, DiscoverableNode, FarmerSpecificManifest, TradeOrder, OrderStatus, SupplyChainEvent, AuditRecord } from '../../types';
import { CATEGORY_IMAGES } from '../../constants';
import { generateBlockchainHash } from '../../services/blockchain';
import { getCurrentLocation } from '../../services/location';
import { generateFarmerManifestPDF } from '../../services/report';
import { 
  MapPin, ShieldCheck, CheckCircle, Activity, Leaf, Database, X, Truck, 
  Handshake, TrendingUp, Sprout, Navigation, Loader2, FileText, Camera, Upload, 
  ChevronLeft, Info, ArrowUpRight, ShoppingCart, ShieldCheck as VerifiedBadge, Star, Globe, Zap, Mail, Phone,
  LayoutDashboard, IndianRupee, PieChart, Bell, ArrowRight
} from 'lucide-react';
import ChainStatusPanel from '../ChainStatusPanel';
import NearbyNetwork from '../NearbyNetwork';
import { TrueChainDB } from '../../services/storage';

interface FarmerDashboardProps {
  user: User;
  batches: HarvestBatch[];
  setBatches: React.Dispatch<React.SetStateAction<HarvestBatch[]>>;
  onUpdateQuantity: (id: string, delta: number, reason: any) => void;
  onDeleteBatch: (id: string) => void;
  batchNotes: BatchNote[];
  onUpdateNote: (id: string, note: string) => void;
  seasonalPlans: SeasonalPlan[];
  setSeasonalPlans: React.Dispatch<React.SetStateAction<SeasonalPlan[]>>;
  inventoryLogs: InventoryLog[];
  wallet: Wallet;
  onAuditLog?: (record: Omit<AuditRecord, 'id' | 'timestamp' | 'blockchainHash'>) => Promise<void>;
}

const FarmerDashboard: React.FC<FarmerDashboardProps> = ({ 
  user, batches, setBatches, onUpdateQuantity, onDeleteBatch, 
  batchNotes, onUpdateNote, seasonalPlans, setSeasonalPlans, inventoryLogs, wallet, onAuditLog
}) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';

  const [showAddModal, setShowAddModal] = useState(false);
  const [listingStep, setListingStep] = useState(1);
  const [itemType, setItemType] = useState<'Crop' | 'DrinkDairy'>('Crop');
  const [isSyncing, setIsSyncing] = useState(false);
  const [tempImages, setTempImages] = useState<string[]>([]);
  
  const [newBatch, setNewBatch] = useState<Partial<HarvestBatch>>({
    cropName: '',
    category: FoodCategory.FRUITS_VEG,
    quantity: '100',
    qualityGrade: 'A',
    farmingMethod: 'Organic',
    pricePerUnit: 45,
    availabilityWindow: { start: new Date().toISOString().split('T')[0], end: '' }
  });

  const [advManifest, setAdvManifest] = useState<FarmerSpecificManifest>({
    identity: { village: '', district: '', state: '', mobile: user.emailOrMobile },
    land: { size: '10', soilType: 'Loamy', waterSource: 'Borewell', pollutionRisk: 'Low' },
    seedType: 'Organic',
    seedSource: 'Regional Seed Bank',
    sowingMonth: 'June',
    harvestingMonth: 'October',
    pesticideUsage: 'None',
    storageMethod: 'Ambient Storage',
    expectedShelfLife: '14 Days',
    environment: { weatherHistory: 'Stable Season', rainfallSummary: 'Normal', tempRange: '22-30°C' }
  });

  const [dairySpec, setDairySpec] = useState<NonNullable<FarmerSpecificManifest['dairy']>>({
    animalType: 'Cow', breed: 'Gir', feedType: 'Organic Fodder', yieldPerDay: '15', antibiotics: 'No', hygieneProcess: 'Standard'
  });

  const [incomingTrades, setIncomingTrades] = useState<TradeOrder[]>([]);

  useEffect(() => {
    const all = TrueChainDB.getTradeOrders();
    setIncomingTrades(all.filter(t => t.sellerId === user.id));
  }, [user.id, batches]);

  // --- Insight Calculations ---
  const activeBatchesCount = batches.filter(b => b.farmerId === user.id && b.currentQuantity > 0).length;
  const soldOutBatchesCount = batches.filter(b => b.farmerId === user.id && b.currentQuantity === 0).length;
  const pendingTradeConnections = incomingTrades.filter(t => t.status === OrderStatus.DISCOVERY_CONFIRMED || t.status === OrderStatus.PENDING_COLLECTOR).length;
  
  const totalEarned = wallet.transactionHistory
    .filter(t => t.toId === user.id && t.status === 'Confirmed')
    .reduce((acc, curr) => acc + curr.amount, 0);

  const nearbyNodes: DiscoverableNode[] = [
    { id: 'mfr-root-001', name: 'Alpha Manufacturing Hub', role: UserRole.MANUFACTURER, distance: 4.2, trustScore: 98, categories: [FoodCategory.FRUITS_VEG, FoodCategory.PACKAGED] },
    { id: 'C1', name: 'Valley Transporter', role: UserRole.COLLECTOR, distance: 1.5, trustScore: 92, categories: [FoodCategory.DRINKS_DAIRY] },
  ];

  const handleConnectSuccess = (order: TradeOrder) => {
    const all = TrueChainDB.getTradeOrders();
    TrueChainDB.saveTradeOrders([order, ...all]);
    setIncomingTrades([order, ...incomingTrades]);
    onAuditLog?.({
      actionType: 'NODE_CONNECT_SUCCESS',
      actorId: user.id, actorRole: UserRole.FARMER, targetId: order.buyerId,
      prevStatus: 'Discovery', nextStatus: 'Contract Initialized',
      details: `Established B2B connection with ${order.buyerName} for ${order.assetName}.`
    });
    alert("B2B Linkage finalized. Smart contract recorded on-chain.");
  };

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => setTempImages([reader.result as string, ...tempImages]);
      reader.readAsDataURL(file);
    }
  };

  const handleAddBatch = async () => {
    setIsSyncing(true);
    const qtyNum = parseFloat(newBatch.quantity || '0');
    const fullFarmerManifest: FarmerSpecificManifest = { ...advManifest, dairy: itemType === 'DrinkDairy' ? dairySpec : undefined };
    const genesisData = {
      farmerId: user.id,
      productType: itemType === 'Crop' ? (newBatch.category as FoodCategory) : FoodCategory.DRINKS_DAIRY,
      variety: newBatch.cropName!,
      location: newBatch.location || { lat: 0, lng: 0, address: 'Global Marketplace' },
      timestamp: new Date().toISOString(),
      farmerManifest: fullFarmerManifest
    };
    const hash = await generateBlockchainHash(genesisData);
    const batchId = (itemType === 'Crop' ? 'B-' : 'D-') + Math.random().toString(36).substr(2, 6).toUpperCase();
    const genesisManifest: GenesisManifest = { batchId, blockchainHash: hash, ...genesisData, harvestDate: new Date().toISOString().split('T')[0] };
    const batch: HarvestBatch = {
      id: batchId, farmerId: user.id, farmerName: user.name, cropName: newBatch.cropName!, category: genesisManifest.productType,
      harvestDate: new Date().toISOString().split('T')[0], quantity: newBatch.quantity!, currentQuantity: qtyNum,
      qualityGrade: newBatch.qualityGrade || 'A', farmingMethod: (newBatch.farmingMethod as 'Organic' | 'Conventional') || 'Organic',
      blockchainHash: hash, status: BatchStatus.STORED, location: newBatch.location || { lat: 0, lng: 0, address: 'Farm Gate Node' },
      itemType, pricePerUnit: newBatch.pricePerUnit, availabilityWindow: newBatch.availabilityWindow, genesisManifest,
      imageUrl: tempImages[0] || CATEGORY_IMAGES[genesisManifest.productType], additionalImages: tempImages.slice(1), isSeedData: false
    };
    const updatedBatches = [batch, ...batches];
    setBatches(updatedBatches);
    TrueChainDB.saveBatches(updatedBatches);
    onAuditLog?.({
      actionType: 'GENESIS_BATCH_CREATED', actorId: user.id, actorRole: UserRole.FARMER, targetId: batchId,
      prevStatus: 'N/A', nextStatus: BatchStatus.STORED, details: `Created new ${itemType} batch: ${batch.cropName} (${batch.quantity} units).`
    });
    setIsSyncing(false);
    setShowAddModal(false);
    setListingStep(1);
    setTempImages([]);
  };

  const handleHandover = async (orderId: string) => {
    const all = TrueChainDB.getTradeOrders();
    const trade = all.find(t => t.id === orderId);
    const updated = all.map(t => {
      if (t.id === orderId) {
         return { 
            ...t, status: OrderStatus.PICKUP_READY,
            events: [...t.events, {
               type: 'PICKUP', timestamp: new Date().toISOString(), location: user.location || { address: 'Farm Gate', lat: 0, lng: 0 },
               actorId: user.id, actorRole: user.role, notes: "Batch ready for logistics handover.",
               blockchainHash: 'SIGN-' + Math.random().toString(36).substr(2, 6)
            } as SupplyChainEvent]
         };
      }
      return t;
    });
    TrueChainDB.saveTradeOrders(updated);
    setIncomingTrades(updated.filter(t => t.sellerId === user.id));
    onAuditLog?.({
      actionType: 'LOGISTICS_HANDOVER_SIGN', actorId: user.id, actorRole: UserRole.FARMER, targetId: orderId,
      prevStatus: trade?.status || 'Assigned', nextStatus: OrderStatus.PICKUP_READY,
      details: `Signed dispatch manifest for ${trade?.assetName}. Waiting for Transporter node.`
    });
  };

  const handleLocationSync = async () => {
    const loc = await getCurrentLocation();
    setAdvManifest({ ...advManifest, identity: { ...advManifest.identity, village: loc.address.split(',')[0] } });
    setNewBatch({ ...newBatch, location: loc });
  };

  return (
    <div className="space-y-8 animate-in fade-in duration-500 pb-12">
      <ChainStatusPanel user={user} wallet={wallet} />
      
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'overview', label: 'Farm Insights', icon: LayoutDashboard },
          { id: 'batches', label: 'Genesis Registry', icon: Leaf },
          { id: 'trades', label: 'Procurement Pipeline', icon: Handshake },
          { id: 'network', label: 'Node Discovery', icon: Globe }
        ].map(tab => (
          <button 
            key={tab.id}
            onClick={() => setSearchParams({ tab: tab.id })}
            className={`pb-4 px-2 flex items-center gap-2 font-black text-xs uppercase tracking-widest transition-colors border-b-2 ${currentTab === tab.id ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
          >
            <tab.icon className="w-4 h-4" /> {tab.label}
          </button>
        ))}
      </div>

      {/* OVERVIEW TAB - DASHBOARD SUMMARY & GUIDANCE */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* Earnings Overview */}
            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><IndianRupee className="w-24 h-24 text-emerald-400" /></div>
               <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Node Financials</div>
               <div className="flex flex-col gap-1">
                 <div className="text-4xl font-black text-white tracking-tighter">₹{totalEarned.toLocaleString()}</div>
                 <div className="text-[10px] font-bold text-slate-400 uppercase">Confirmed Chain Yield</div>
               </div>
               <div className="mt-8 flex items-center gap-6">
                 <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase mb-1">In Escrow</div>
                    <div className="text-lg font-black text-amber-400">₹{wallet.pendingBalance.toLocaleString()}</div>
                 </div>
                 <div className="w-px h-8 bg-white/10"></div>
                 <div>
                    <div className="text-[8px] font-black text-slate-500 uppercase mb-1">Last Payout</div>
                    <div className="text-lg font-black text-slate-300">₹0.00</div>
                 </div>
               </div>
            </div>

            {/* Farm Status Summary */}
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-500"><PieChart className="w-24 h-24 text-emerald-600" /></div>
               <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                 <Sprout className="w-3 h-3 text-emerald-600" /> Asset Distribution
               </div>
               <div className="space-y-5">
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Active Listings</span>
                    <span className="text-xl font-black text-emerald-600">{activeBatchesCount}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Pending Sourcing</span>
                    <span className="text-xl font-black text-blue-600">{pendingTradeConnections}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-xs font-bold text-slate-500 uppercase">Sold/Exhausted</span>
                    <span className="text-xl font-black text-slate-400">{soldOutBatchesCount}</span>
                  </div>
               </div>
            </div>

            {/* Quick Actions & Guidance */}
            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm flex flex-col justify-between">
              <div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Zap className="w-3 h-3 fill-current" /> Fast-Track Operations
                </div>
                <div className="space-y-3">
                  <button onClick={() => setSearchParams({ tab: 'batches' })} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all group/btn shadow-sm">
                    <span className="text-xs font-black text-slate-800 uppercase">Manage Harvest Registry</span>
                    <ArrowRight className="w-4 h-4 text-emerald-500 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <button onClick={() => setSearchParams({ tab: 'network' })} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all group/btn shadow-sm">
                    <span className="text-xs font-black text-slate-800 uppercase">Scan for Manufacturers</span>
                    <ArrowRight className="w-4 h-4 text-emerald-500 group-hover/btn:translate-x-1 transition-transform" />
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
                    <Bell className="w-5 h-5 text-emerald-600" />
                    <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest">Next Operational Steps</h3>
                 </div>
                 <div className="p-8 space-y-6">
                    {[
                      { t: 'Update Soil Manifest', d: 'Your Alpha Plot hasn\'t updated soil telemetry in 14 days. Sync GPS to maintain high trust score.', c: 'border-blue-100 bg-blue-50/30 text-blue-700', a: 'Update Manifest' },
                      { t: 'B2B Inquiry Received', d: 'Alpha Manufacturing Hub is requesting a quote for your Fuji Apples.', c: 'border-emerald-100 bg-emerald-50/30 text-emerald-700', a: 'View Inquiry', tab: 'trades' },
                      { t: 'Cold Chain Alert', d: 'Transporter C1 is approaching. Ensure dairy batches are pre-staged for refrigerated handover.', c: 'border-amber-100 bg-amber-50/30 text-amber-700', a: 'Sign Handover', tab: 'trades' }
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
               {/* Market Demand Hints */}
               <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                  <div className="absolute top-0 right-0 p-6 opacity-5 rotate-12"><TrendingUp className="w-32 h-32" /></div>
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-3">
                     <Zap className="w-4 h-4 text-amber-400 fill-current" /> High Demand Trends
                  </h3>
                  <div className="space-y-6">
                     {[
                        { crop: 'Organic Turmeric', trend: 'High', price: '₹140/kg', delta: '+12%' },
                        { crop: 'A2 Buffalo Milk', trend: 'Critical', price: '₹85/L', delta: '+25%' },
                        { crop: 'Red Lentils', trend: 'Stable', price: '₹92/kg', delta: '+4%' }
                     ].map((item, i) => (
                        <div key={i} className="flex items-center justify-between group">
                           <div className="flex items-center gap-4">
                              <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                              <div>
                                 <div className="text-xs font-black text-slate-800 uppercase">{item.crop}</div>
                                 <div className="text-[9px] font-bold text-slate-400 uppercase tracking-tighter">Avg Local: {item.price}</div>
                              </div>
                           </div>
                           <div className="text-right">
                              <div className="text-[9px] font-black text-emerald-600 uppercase">{item.delta}</div>
                              <div className="text-[8px] font-bold text-slate-300 uppercase tracking-widest">{item.trend}</div>
                           </div>
                        </div>
                     ))}
                  </div>
                  <div className="mt-10 p-5 bg-slate-900 rounded-3xl text-white">
                     <div className="text-[9px] font-black text-emerald-400 uppercase tracking-widest mb-2 italic">Pro Tip</div>
                     <p className="text-[10px] text-slate-400 font-medium leading-relaxed">Switching your next harvest to A2 Dairy could increase your Trust Score by 15% due to higher compliance demand.</p>
                  </div>
               </section>
            </div>
          </div>
        </div>
      )}

      {/* REGISTRY TAB - PRESERVED WORKFLOW */}
      {currentTab === 'batches' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-8">
            <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
               <div className="p-8 border-b border-slate-100 bg-slate-50/30 flex items-center justify-between">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Database className="w-5 h-5 text-emerald-600" /> Genesis Batch Registry
                  </h3>
                  <button onClick={() => { setShowAddModal(true); setListingStep(1); }} className="px-6 py-3 bg-emerald-600 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest shadow-lg shadow-emerald-600/20 active:scale-95 transition-all">List New Batch</button>
               </div>
               <div className="overflow-x-auto">
                  <table className="w-full text-left">
                    <thead className="bg-slate-50 text-slate-400 text-[10px] font-black uppercase tracking-widest">
                      <tr>
                        <th className="px-8 py-5">Genesis Asset</th>
                        <th className="px-8 py-5">Inventory</th>
                        <th className="px-8 py-5 text-right">Supply Manifest</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-50">
                      {batches.filter(b => b.farmerId === user.id).map(b => (
                        <tr key={b.id} className="hover:bg-slate-50/50 transition">
                          <td className="px-8 py-6">
                            <div className="flex items-center gap-4">
                               <img src={b.imageUrl} className="w-12 h-12 rounded-xl object-cover shadow-sm" />
                               <div>
                                 <div className="font-black text-slate-800 text-sm uppercase">{b.cropName}</div>
                                 <div className="text-[9px] font-black text-slate-400 uppercase tracking-widest">ID: {b.id}</div>
                               </div>
                            </div>
                          </td>
                          <td className="px-8 py-6 font-black text-slate-600 text-xs">
                             {b.currentQuantity} / {b.quantity} <span className="text-[10px] font-medium text-slate-400 uppercase ml-1">Units</span>
                          </td>
                          <td className="px-8 py-6 text-right">
                             <button onClick={() => generateFarmerManifestPDF(b)} className="p-3 bg-slate-900 text-white rounded-xl hover:bg-emerald-600 transition shadow-sm flex items-center gap-2 ml-auto">
                                <FileText className="w-4 h-4" />
                                <span className="text-[9px] font-black uppercase tracking-widest">Download PDF</span>
                             </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
               </div>
            </section>
          </div>
          
          <div className="space-y-8">
            <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 p-8 opacity-5"><TrendingUp className="w-32 h-32" /></div>
               <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                  <Activity className="w-4 h-4 text-emerald-600" /> Production Metrics
               </h3>
               <div className="space-y-6">
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-emerald-50 transition-colors">
                     <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Node Reputation</div>
                        <div className="text-2xl font-black text-emerald-600">{user.trustMetrics.trustScore}%</div>
                     </div>
                     <Activity className="w-8 h-8 text-emerald-100" />
                  </div>
                  <div className="p-6 bg-slate-50 rounded-3xl border border-slate-100 flex justify-between items-center group hover:bg-blue-50 transition-colors">
                     <div>
                        <div className="text-[9px] font-black text-slate-400 uppercase mb-1">Immutable Batches</div>
                        <div className="text-2xl font-black text-blue-600">{batches.filter(b => b.farmerId === user.id).length}</div>
                     </div>
                     <Database className="w-8 h-8 text-blue-100" />
                  </div>
               </div>
            </section>
          </div>
        </div>
      )}

      {/* PIPELINE TAB - PRESERVED WORKFLOW */}
      {currentTab === 'trades' && (
        <div className="space-y-8">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <Handshake className="w-5 h-5 text-emerald-600" /> My Sales Manifests
                 </h3>
              </div>
              <div className="divide-y divide-slate-50">
                 {incomingTrades.map(trade => (
                    <div key={trade.id} className="p-8 flex flex-col lg:flex-row justify-between items-center gap-8 hover:bg-slate-50/50 transition">
                       <div className="flex items-center gap-5 flex-1">
                          <div className={`p-5 rounded-3xl ${trade.status === OrderStatus.COMPLETED ? 'bg-emerald-50 text-emerald-600' : 'bg-blue-50 text-blue-600'}`}>
                             <FileText className="w-6 h-6" />
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-mono text-slate-400 font-black uppercase">ORDER: {trade.id}</span>
                                {trade.isVerified && <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase rounded flex items-center gap-1"><VerifiedBadge className="w-2.5 h-2.5" /> Verified</span>}
                             </div>
                             <h4 className="font-black text-slate-800 text-lg uppercase">{trade.assetName} for {trade.buyerName}</h4>
                             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status: {trade.status === OrderStatus.PENDING_COLLECTOR ? 'Awaiting Transporter' : trade.status} • Total: ₹{trade.totalPrice.toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="shrink-0">
                          {trade.status === OrderStatus.COLLECTOR_ASSIGNED && (
                            <button onClick={() => handleHandover(trade.id)} className="px-8 py-3 bg-emerald-600 hover:bg-emerald-700 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95">Sign Pickup Manifest</button>
                          )}
                          {trade.status === OrderStatus.PENDING_COLLECTOR && (
                            <span className="px-4 py-2 bg-amber-50 text-amber-600 text-[9px] font-black uppercase border border-amber-100 rounded-xl">Awaiting Transporter Node</span>
                          )}
                          {trade.status === OrderStatus.PICKUP_READY && (
                             <span className="px-4 py-2 bg-emerald-50 text-emerald-600 text-[9px] font-black uppercase border border-emerald-100 rounded-xl">Ready for Handover</span>
                          )}
                          {trade.status === OrderStatus.DISCOVERY_CONFIRMED && (
                             <span className="px-4 py-2 bg-blue-50 text-blue-600 text-[9px] font-black uppercase border border-blue-100 rounded-xl">Discovery Linked</span>
                          )}
                       </div>
                    </div>
                 ))}
                 {incomingTrades.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase text-[10px]">No active sales manifests found on your node</div>}
              </div>
           </div>
        </div>
      )}

      {/* DISCOVERY TAB - PRESERVED WORKFLOW */}
      {currentTab === 'network' && (
        <NearbyNetwork user={user} nodes={nearbyNodes} onConnectSuccess={handleConnectSuccess} />
      )}

      {/* SMART BATCH LISTING WIZARD - RESTORED DATA ENTRY */}
      {showAddModal && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-slate-900/80 backdrop-blur-md">
           <div className="bg-white w-full max-w-4xl rounded-[3.5rem] overflow-hidden shadow-2xl animate-in zoom-in-95 duration-200 flex flex-col max-h-[90vh]">
              <div className="bg-emerald-950 p-10 text-white flex justify-between items-center shrink-0">
                 <div className="flex items-center gap-6">
                    <div className="w-14 h-14 bg-emerald-600 rounded-2xl flex items-center justify-center shadow-lg shadow-emerald-600/20">
                       <Sprout className="w-8 h-8" />
                    </div>
                    <div>
                       <h3 className="text-2xl font-black uppercase tracking-tight">Genesis Asset Intake</h3>
                       <div className="flex items-center gap-3 mt-1">
                          <span className="text-emerald-400 text-[10px] font-black uppercase tracking-widest">Step {listingStep} of 5</span>
                          <div className="flex gap-1">
                             {[1,2,3,4,5].map(s => <div key={s} className={`h-1 w-6 rounded-full ${listingStep >= s ? 'bg-emerald-500' : 'bg-white/10'}`}></div>)}
                          </div>
                       </div>
                    </div>
                 </div>
                 <button onClick={() => setShowAddModal(false)} className="p-3 hover:bg-white/10 rounded-full transition"><X className="w-6 h-6 text-slate-400 hover:text-white" /></button>
              </div>
              <div className="overflow-y-auto p-12 space-y-12 no-scrollbar">
                 {listingStep === 1 && (
                   <div className="space-y-10 animate-in fade-in slide-in-from-bottom-4">
                      <div className="text-center max-w-xl mx-auto">
                         <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Identify Asset Type</h4>
                         <p className="text-slate-400 text-sm font-medium">TrueChain supports field crops, grains, and dairy products. Choose your specialization.</p>
                      </div>
                      <div className="grid md:grid-cols-2 gap-8">
                         <button onClick={() => { setItemType('Crop'); setListingStep(2); }} className={`p-10 rounded-[3rem] border-2 transition-all flex flex-col items-center text-center gap-6 ${itemType === 'Crop' ? 'bg-emerald-50 border-emerald-500 shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-emerald-200'}`}>
                            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-sm border border-slate-100"><Leaf className="w-10 h-10" /></div>
                            <div><h5 className="text-lg font-black text-slate-800 uppercase">Field Crop / Grain</h5><p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">Fruits, Veg, Staples, Spices</p></div>
                         </button>
                         <button onClick={() => { setItemType('DrinkDairy'); setListingStep(2); }} className={`p-10 rounded-[3rem] border-2 transition-all flex flex-col items-center text-center gap-6 ${itemType === 'DrinkDairy' ? 'bg-blue-50 border-blue-500 shadow-xl' : 'bg-slate-50 border-slate-100 hover:border-blue-200'}`}>
                            <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-blue-600 shadow-sm border border-slate-100"><Info className="w-10 h-10" /></div>
                            <div><h5 className="text-lg font-black text-slate-800 uppercase">Dairy / Beverage</h5><p className="text-slate-400 text-xs mt-1 uppercase font-bold tracking-widest">Milk, Buffalo, Specialized Drinks</p></div>
                         </button>
                      </div>
                   </div>
                 )}
                 {listingStep === 2 && (
                    <div className="space-y-10 animate-in slide-in-from-right-4">
                       <div className="grid md:grid-cols-2 gap-12">
                          <div className="space-y-8">
                             <div className="flex flex-col items-center justify-center aspect-square bg-slate-50 rounded-[3rem] border-4 border-dashed border-slate-100 relative group overflow-hidden">
                                {tempImages[0] ? <img src={tempImages[0]} className="w-full h-full object-cover" /> : <div className="text-center p-8"><Camera className="w-16 h-16 text-slate-200 mx-auto mb-4 group-hover:text-emerald-400 transition" /><p className="text-[10px] font-black text-slate-400 uppercase tracking-widest">Upload Farm/Asset Photos</p></div>}
                                <input type="file" onChange={handleFileUpload} className="absolute inset-0 opacity-0 cursor-pointer" />
                             </div>
                          </div>
                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Core Particulars</h4>
                             <div className="space-y-4">
                                <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Asset Name</span><input type="text" value={newBatch.cropName} onChange={e => setNewBatch({...newBatch, cropName: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="e.g. Alphonso Mangoes" /></label>
                                <div className="grid grid-cols-2 gap-4">
                                  <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Quantity (Units)</span><input type="number" value={newBatch.quantity} onChange={e => setNewBatch({...newBatch, quantity: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></label>
                                  <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Price (₹ / Unit)</span><input type="number" value={newBatch.pricePerUnit} onChange={e => setNewBatch({...newBatch, pricePerUnit: parseFloat(e.target.value)})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></label>
                                </div>
                             </div>
                          </div>
                       </div>
                    </div>
                 )}
                 {listingStep === 3 && (
                    <div className="space-y-10 animate-in slide-in-from-right-4">
                       <div className="bg-slate-900 p-8 rounded-[3rem] text-white flex justify-between items-center relative overflow-hidden">
                          <div className="absolute top-0 right-0 p-10 opacity-5"><MapPin className="w-48 h-48" /></div>
                          <div className="relative z-10">
                             <h4 className="text-xl font-black uppercase tracking-tight italic">Land & Geography Manifest</h4>
                             <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Mandatory for immutable provenance.</p>
                          </div>
                          <button onClick={handleLocationSync} className="px-6 py-3 bg-emerald-600 text-white rounded-xl font-black uppercase text-[10px] tracking-widest flex items-center gap-2 shadow-xl hover:bg-emerald-50 hover:text-emerald-900 active:scale-95 transition-all"><Navigation className="w-4 h-4" /> Sync GPS Node</button>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                         <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Location Identity</h4>
                           <div className="space-y-4">
                             <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Village / Ward</span><input type="text" value={advManifest.identity.village} onChange={e => setAdvManifest({...advManifest, identity: {...advManifest.identity, village: e.target.value}})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></label>
                             <div className="grid grid-cols-2 gap-4">
                               <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">District</span><input type="text" value={advManifest.identity.district} onChange={e => setAdvManifest({...advManifest, identity: {...advManifest.identity, district: e.target.value}})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></label>
                               <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">State</span><input type="text" value={advManifest.identity.state} onChange={e => setAdvManifest({...advManifest, identity: {...advManifest.identity, state: e.target.value}})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></label>
                             </div>
                           </div>
                         </div>
                         <div className="space-y-6">
                           <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Land Details</h4>
                           <div className="space-y-4">
                             <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Land Size (Acres)</span><input type="number" value={advManifest.land.size} onChange={e => setAdvManifest({...advManifest, land: {...advManifest.land, size: e.target.value}})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" /></label>
                             <div className="grid grid-cols-2 gap-4">
                               <label className="block space-y-2">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Water Source</span>
                                  <select value={advManifest.land.waterSource} onChange={e => setAdvManifest({...advManifest, land: {...advManifest.land, waterSource: e.target.value as any}})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                                    <option value="Rain-fed">Rain-fed</option>
                                    <option value="Borewell">Borewell</option>
                                    <option value="Canal">Canal</option>
                                  </select>
                               </label>
                               <label className="block space-y-2">
                                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pollution Risk</span>
                                  <select value={advManifest.land.pollutionRisk} onChange={e => setAdvManifest({...advManifest, land: {...advManifest.land, pollutionRisk: e.target.value as any}})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                                    <option value="Low">Low</option>
                                    <option value="Medium">Medium</option>
                                    <option value="High">High</option>
                                  </select>
                               </label>
                             </div>
                           </div>
                         </div>
                       </div>
                    </div>
                 )}
                 {listingStep === 4 && (
                    <div className="space-y-10 animate-in slide-in-from-right-4">
                       <div className="text-center max-w-xl mx-auto">
                          <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight mb-2">Production Specifics</h4>
                          <p className="text-slate-400 text-sm font-medium">Provide verified inputs used during this production cycle.</p>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Cycle Inputs</h4>
                             <div className="space-y-4">
                                <label className="block space-y-2">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Seed Type</span>
                                   <select value={advManifest.seedType} onChange={e => setAdvManifest({...advManifest, seedType: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                                      <option value="Hybrid">Hybrid</option>
                                      <option value="Organic">Organic</option>
                                      <option value="Local">Local Heirloom</option>
                                   </select>
                                </label>
                                <label className="block space-y-2">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Pesticide Usage</span>
                                   <select value={advManifest.pesticideUsage} onChange={e => setAdvManifest({...advManifest, pesticideUsage: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold">
                                      <option value="None">None (Zero Chemical)</option>
                                      <option value="Limited">Limited / IPM</option>
                                      <option value="Organic">Bio-Organic Only</option>
                                      <option value="Heavy">Standard Conventional</option>
                                   </select>
                                </label>
                             </div>
                          </div>

                          <div className="space-y-6">
                             <h4 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b pb-2">Harvest Parameters</h4>
                             <div className="space-y-4">
                                <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Storage Protocol</span><input type="text" value={advManifest.storageMethod} onChange={e => setAdvManifest({...advManifest, storageMethod: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="e.g. Cold Storage at 4°C" /></label>
                                <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Est. Shelf Life</span><input type="text" value={advManifest.expectedShelfLife} onChange={e => setAdvManifest({...advManifest, expectedShelfLife: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold" placeholder="e.g. 14 Days" /></label>
                             </div>
                          </div>
                       </div>

                       {itemType === 'DrinkDairy' && (
                          <div className="space-y-6 pt-6 border-t border-slate-100 animate-in fade-in">
                             <h4 className="text-xs font-black text-blue-600 uppercase tracking-widest flex items-center gap-2">
                                <Info className="w-4 h-4" /> Dairy Specific Manifest
                             </h4>
                             <div className="grid md:grid-cols-3 gap-6">
                                <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Animal Breed</span><input type="text" value={dairySpec.breed} onChange={e => setDairySpec({...dairySpec, breed: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" /></label>
                                <label className="block space-y-2"><span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Feed Type</span><input type="text" value={dairySpec.feedType} onChange={e => setDairySpec({...dairySpec, feedType: e.target.value})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs" /></label>
                                <label className="block space-y-2">
                                   <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest ml-1">Antibiotics Used?</span>
                                   <select value={dairySpec.antibiotics} onChange={e => setDairySpec({...dairySpec, antibiotics: e.target.value as any})} className="w-full p-4 bg-slate-50 border border-slate-200 rounded-2xl font-bold text-xs">
                                      <option value="No">No</option>
                                      <option value="Yes">Yes</option>
                                   </select>
                                </label>
                             </div>
                          </div>
                       )}
                    </div>
                 )}
                 {listingStep === 5 && (
                    <div className="space-y-10 animate-in slide-in-from-right-4">
                       <div className="bg-emerald-50 p-10 rounded-[3rem] border border-emerald-100 flex items-start gap-8 relative overflow-hidden">
                          <div className="w-20 h-20 bg-white rounded-[2rem] flex items-center justify-center text-emerald-600 shadow-sm border border-emerald-100 shrink-0"><CheckCircle className="w-10 h-10" /></div>
                          <div className="relative z-10">
                             <h4 className="text-2xl font-black text-emerald-900 uppercase tracking-tight italic">Review & Sign Ledger</h4>
                             <p className="text-emerald-700 text-sm font-medium mt-2 leading-relaxed">Publishing will generate an immutable supply chain manifest for {newBatch.cropName}.</p>
                          </div>
                       </div>

                       <div className="grid md:grid-cols-2 gap-8">
                          <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4">
                             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Batch Summary</h5>
                             <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Name</span><span>{newBatch.cropName}</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Category</span><span>{newBatch.category}</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Quantity</span><span>{newBatch.quantity} Units</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Price</span><span>₹{newBatch.pricePerUnit} / Unit</span></div>
                             </div>
                          </div>
                          <div className="bg-slate-50 p-8 rounded-[2rem] space-y-4">
                             <h5 className="text-[10px] font-black text-slate-400 uppercase tracking-widest border-b border-slate-200 pb-2">Geography Summary</h5>
                             <div className="space-y-3">
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Region</span><span>{advManifest.identity.village}, {advManifest.identity.state}</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Land Area</span><span>{advManifest.land.size} Acres</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Water</span><span>{advManifest.land.waterSource}</span></div>
                                <div className="flex justify-between text-xs font-bold uppercase"><span className="text-slate-400">Soil</span><span>{advManifest.land.soilType}</span></div>
                             </div>
                          </div>
                       </div>

                       <div className="p-6 bg-blue-50 border border-blue-100 rounded-3xl flex items-start gap-4">
                          <ShieldCheck className="w-6 h-6 text-blue-600 shrink-0" />
                          <p className="text-[10px] text-blue-700 font-medium uppercase leading-relaxed">
                             By publishing, you digital signature will be hashed into the Genesis block. This data cannot be altered after submission.
                          </p>
                       </div>
                    </div>
                 )}
              </div>
              <div className="p-12 border-t border-slate-100 bg-slate-50/50 flex gap-4 shrink-0">
                 {listingStep > 1 && <button onClick={() => setListingStep(listingStep - 1)} className="flex-1 py-5 bg-white border border-slate-200 text-slate-600 rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3"><ChevronLeft className="w-5 h-5" /> Previous</button>}
                 {listingStep < 5 ? <button onClick={() => setListingStep(listingStep + 1)} className="flex-[2] py-5 bg-emerald-600 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95 flex items-center justify-center gap-3">Next <ArrowUpRight className="w-5 h-5" /></button> : <button onClick={handleAddBatch} disabled={isSyncing} className="flex-[2] py-5 bg-slate-900 text-white rounded-[2rem] font-black uppercase text-[10px] tracking-widest transition-all shadow-2xl flex items-center justify-center gap-3 active:scale-95">{isSyncing ? <Loader2 className="w-5 h-5 animate-spin" /> : <Database className="w-5 h-5 text-emerald-400" />} Publish Genesis Asset</button>}
              </div>
           </div>
        </div>
      )}
    </div>
  );
};

export default FarmerDashboard;
