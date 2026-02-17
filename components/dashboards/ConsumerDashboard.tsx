import React, { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { Product, FoodCategory, ViewedItem, UserPreferences, SavedItem, User, Wallet, UserRole, SubscriptionTier, SubscriptionStatus, KycStatus, Order, DiscoverableNode, HarvestBatch, AuditRecord } from '../../types';
import { Link } from 'react-router-dom';
import { 
  Search, ShieldCheck, Star, ArrowRight, Filter, AlertCircle, 
  History, Zap, Settings, ShieldAlert, Bell, Calendar, Info, 
  CheckCircle2, Scale, Trash2, Heart, ExternalLink, FileDown,
  LayoutGrid, Tag, PackageSearch, Eye, ScanLine, ShoppingBag, Plus, Minus, BarChart3, Globe, ShoppingCart, Loader2,
  // Add Store to the imports
  Building2, LayoutDashboard, Truck, Tractor, Factory, MapPin, BadgeCheck, Navigation, Store
} from 'lucide-react';
import { generateCollectionPDF } from '../../services/report';
import ChainStatusPanel from '../ChainStatusPanel';
import VerifiedMarketBrowser from '../marketplace/VerifiedMarketBrowser';
import NearbyNetwork from '../NearbyNetwork';
import CheckoutModal from '../consumer/CheckoutModal';

interface ConsumerDashboardProps {
  products: Product[];
  batches: HarvestBatch[];
  viewedItems: ViewedItem[];
  userPreferences: UserPreferences[];
  logView: (id: string) => void;
  savedItems: SavedItem[];
  wallet: Wallet;
  orders: Order[];
  onPlaceOrder: (order: Order) => void;
  onAuditLog?: (record: Omit<AuditRecord, 'id' | 'timestamp' | 'blockchainHash'>) => Promise<void>;
}

const CATEGORIES = [
  FoodCategory.DRINKS_DAIRY,
  FoodCategory.FRUITS_VEG,
  FoodCategory.SNACKS_SWEETS,
  FoodCategory.GRAINS_PULSES,
  FoodCategory.ORGANIC
];

const ConsumerDashboard: React.FC<ConsumerDashboardProps> = ({ products, batches, viewedItems, userPreferences, logView, savedItems, wallet, orders, onPlaceOrder, onAuditLog }) => {
  const [searchParams, setSearchParams] = useSearchParams();
  const currentTab = searchParams.get('tab') || 'overview';
  const [selectedCategory, setSelectedCategory] = useState<string | 'All'>('All');
  const [searchQuery, setSearchQuery] = useState('');
  const [isWholesaleView, setIsWholesaleView] = useState(false);
  const [showCheckout, setShowCheckout] = useState(false);
  
  const nearbyNodes: DiscoverableNode[] = [
    { id: 'R1', name: 'Fresh Mart Central', role: UserRole.RETAILER, distance: 0.8, trustScore: 99, categories: [FoodCategory.FRUITS_VEG, FoodCategory.BEVERAGES] },
    { id: 'R2', name: 'Organic Corner', role: UserRole.RETAILER, distance: 2.2, trustScore: 96, categories: [FoodCategory.ORGANIC, FoodCategory.SNACKS_SWEETS] },
    { id: 'R3', name: 'True Grocers', role: UserRole.RETAILER, distance: 4.5, trustScore: 94, categories: [FoodCategory.GRAINS_PULSES, FoodCategory.OILS_SPICES] },
  ];

  const [cart, setCart] = useState<Record<string, number>>({});

  const mockUser: User = {
    id: 'consumer-id',
    username: 'consumer',
    role: UserRole.CONSUMER,
    name: 'Verified Consumer',
    emailOrMobile: '',
    subscription: { tier: SubscriptionTier.CONSUMER_FREE, status: SubscriptionStatus.ACTIVE, expiryDate: '', price: 0 },
    kycStatus: KycStatus.VERIFIED,
    trustMetrics: {
      trustScore: 100,
      successRate: 100,
      complaintRatio: 0,
      penaltyHistory: []
    }
  };

  // --- Insight Calculations ---
  const personalTrustInsights = useMemo(() => {
    if (orders.length === 0) return 0;
    let totalScore = 0;
    let productCount = 0;
    orders.forEach(order => {
      order.items.forEach(item => {
        const product = products.find(p => p.id === item.productId);
        if (product) {
          totalScore += product.certification.matchPercentage;
          productCount++;
        }
      });
    });
    return productCount > 0 ? (totalScore / productCount).toFixed(1) : 0;
  }, [orders, products]);

  const activeDeliveries = orders.filter(o => o.status === 'In Transit' || o.status === 'Processing').length;
  const recentOrder = orders[0];
  const recentProduct = recentOrder ? products.find(p => p.id === recentOrder.items[0].productId) : null;
  const recentBatch = recentProduct ? batches.find(b => b.id === recentProduct.batchId) : null;

  const filteredCatalog = useMemo(() => {
    return products.filter(p => {
      const matchCat = selectedCategory === 'All' || p.category === selectedCategory;
      const matchSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
      return matchCat && matchSearch;
    });
  }, [products, selectedCategory, searchQuery]);

  const updateCart = (id: string, delta: number) => {
    setCart(prev => {
      const next = { ...prev };
      next[id] = Math.max(0, (next[id] || 0) + delta);
      if (next[id] === 0) delete next[id];
      return next;
    });
  };

  const cartTotal = Object.entries(cart).reduce((acc: number, [id, qty]) => {
    const p = products.find(prod => prod.id === id);
    const price = p?.pricePerUnit ? Number(p.pricePerUnit) : 0;
    return acc + (price * Number(qty));
  }, 0);

  // Fix: Cast Object.values to number[] to ensure cartItemsCount is a number and avoid comparison errors
  const cartItemsCount = (Object.values(cart) as number[]).reduce((a: number, b: number) => a + b, 0);

  const handleCheckoutSuccess = (order: Order) => {
    onPlaceOrder(order);
    setCart({});
    setShowCheckout(false);
    setSearchParams({ tab: 'overview' });
  };

  const checkoutPayload = Object.entries(cart).map(([id, qty]) => ({ productId: id, quantity: qty }));

  return (
    <div className="space-y-8 pb-12 animate-in fade-in duration-500">
      <ChainStatusPanel user={mockUser} wallet={wallet} />
      
      {/* Navigation Tabs */}
      <div className="flex gap-4 border-b border-slate-200">
        {[
          { id: 'overview', label: 'My Insights', icon: LayoutDashboard },
          { id: 'market', label: 'Market Browser', icon: ShoppingBag },
          { id: 'orders', label: 'My Orders', icon: History },
          { id: 'nearby', label: 'Nearby Nodes', icon: Globe },
          { id: 'saves', label: 'Verified Saves', icon: Heart }
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

      {/* OVERVIEW TAB - DASHBOARD INSIGHTS */}
      {currentTab === 'overview' && (
        <div className="space-y-8 animate-in slide-in-from-left-4 duration-500">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden group hover:border-emerald-200 transition-all">
              <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:rotate-12 transition-transform duration-500"><BadgeCheck className="w-24 h-24 text-emerald-600" /></div>
              <div className="text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-4">Average Trust Index</div>
              <div className="flex items-end gap-3">
                <div className="text-5xl font-black text-emerald-600 tracking-tighter">{personalTrustInsights}%</div>
                <div className="text-[10px] font-bold text-emerald-400 uppercase mb-2">Verified Sourcing</div>
              </div>
              <p className="text-[10px] text-slate-400 mt-6 font-medium leading-relaxed uppercase">Your recent purchases maintain a high provenance safety score.</p>
            </div>

            <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl relative overflow-hidden group">
               <div className="absolute top-0 right-0 p-6 opacity-10 group-hover:scale-110 transition-transform"><Truck className="w-24 h-24 text-emerald-400" /></div>
               <div className="text-[10px] font-black text-emerald-500 uppercase tracking-[0.2em] mb-4">Pipeline Status</div>
               <div className="text-4xl font-black text-white tracking-tighter">{activeDeliveries} <span className="text-lg font-medium text-slate-500">Active</span></div>
               <div className="mt-8 flex gap-2">
                 <button onClick={() => setSearchParams({ tab: 'orders' })} className="px-4 py-2 bg-emerald-600 text-[9px] font-black uppercase rounded-xl hover:bg-emerald-500 transition-all flex items-center gap-2">
                    Track All <Navigation className="w-3 h-3" />
                 </button>
               </div>
            </div>

            <div className="bg-emerald-50 p-8 rounded-[2.5rem] border border-emerald-100 shadow-sm flex flex-col justify-between group">
              <div>
                <div className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.2em] mb-6 flex items-center gap-2">
                  <Zap className="w-3 h-3 fill-current" /> Quick Actions
                </div>
                <div className="space-y-3">
                  <button onClick={() => setSearchParams({ tab: 'market' })} className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all group/btn shadow-sm">
                    <span className="text-xs font-black text-slate-800 uppercase">Go to Market Browser</span>
                    <ArrowRight className="w-4 h-4 text-emerald-500 group-hover/btn:translate-x-1 transition-transform" />
                  </button>
                  <Link to="/scan" className="w-full flex items-center justify-between p-4 bg-white rounded-2xl border border-emerald-100 hover:border-emerald-300 transition-all group/btn shadow-sm">
                    <span className="text-xs font-black text-slate-800 uppercase">Verify New QR Code</span>
                    <ScanLine className="w-4 h-4 text-emerald-500" />
                  </Link>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            <div className="lg:col-span-2 space-y-8">
              {/* Recent Sourcing Snapshot */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <Tractor className="w-5 h-5 text-emerald-600" /> Recent Supply Chain Snapshot
                  </h3>
                  {recentOrder && <span className="text-[9px] font-mono font-black text-slate-400 uppercase tracking-tighter">ORDER: {recentOrder.id}</span>}
                </div>
                
                {recentOrder && recentProduct ? (
                  <div className="p-8">
                    <div className="flex flex-col md:flex-row gap-8 items-center mb-12">
                      <div className="w-20 h-20 bg-slate-100 rounded-3xl overflow-hidden shadow-lg border-2 border-white shrink-0">
                        <img src={recentProduct.imageUrl} className="w-full h-full object-cover" />
                      </div>
                      <div className="text-center md:text-left flex-1">
                        <h4 className="text-xl font-black text-slate-800 uppercase tracking-tight">{recentProduct.name}</h4>
                        <div className="flex flex-wrap justify-center md:justify-start items-center gap-4 mt-2">
                           <div className="flex items-center gap-1.5 text-emerald-600">
                             <ShieldCheck className="w-4 h-4" />
                             <span className="text-[10px] font-black uppercase tracking-widest">{recentProduct.certification.matchPercentage}% Safe</span>
                           </div>
                           <span className="w-1.5 h-1.5 bg-slate-200 rounded-full"></span>
                           <div className="text-[10px] font-bold text-slate-400 uppercase">Sourced from {recentBatch?.farmerName || 'Verified Farmer'}</div>
                        </div>
                      </div>
                      <Link to={`/traceability/${recentProduct.id}`} className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[10px] font-black uppercase tracking-widest hover:bg-emerald-600 transition shadow-xl active:scale-95">View Full Journey</Link>
                    </div>

                    <div className="relative pt-8 pb-4">
                      <div className="absolute left-0 right-0 top-1/2 -translate-y-1/2 h-1 bg-slate-100 rounded-full"></div>
                      <div className="absolute left-0 top-1/2 -translate-y-1/2 h-1 bg-emerald-500 rounded-full transition-all duration-1000" style={{ width: '75%' }}></div>
                      
                      <div className="relative flex justify-between">
                         {[
                           { i: Tractor, l: 'Farm', a: true },
                           { i: Factory, l: 'Processing', a: true },
                           { i: Truck, l: 'Transit', a: true },
                           { i: Store, l: 'Retail', a: false }
                         ].map((step, idx) => (
                           <div key={idx} className="flex flex-col items-center gap-3">
                              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shadow-lg border-4 border-white transition-all duration-500 ${step.a ? 'bg-emerald-500 text-white' : 'bg-white text-slate-300'}`}>
                                <step.i className="w-4 h-4" />
                              </div>
                              <span className={`text-[8px] font-black uppercase tracking-widest ${step.a ? 'text-emerald-700' : 'text-slate-400'}`}>{step.l}</span>
                           </div>
                         ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="p-20 text-center text-slate-300 uppercase font-black text-xs tracking-[0.2em] italic">No active supply records found</div>
                )}
              </section>

              {/* Read-Only Recently Verified */}
              <section className="bg-white rounded-[2.5rem] border border-slate-200 shadow-sm overflow-hidden">
                <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex justify-between items-center">
                  <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                    <ScanLine className="w-5 h-5 text-blue-600" /> Recently Scanned History
                  </h3>
                </div>
                <div className="divide-y divide-slate-50">
                  {viewedItems.length === 0 ? (
                    <div className="p-12 text-center text-slate-400 uppercase font-bold text-[10px]">No recent verification logs</div>
                  ) : viewedItems.slice(0, 4).map((v, i) => {
                    const p = products.find(prod => prod.id === v.itemId);
                    if (!p) return null;
                    return (
                      <div key={i} className="p-6 flex items-center justify-between hover:bg-slate-50 transition group">
                        <div className="flex items-center gap-4 overflow-hidden">
                          <img src={p.imageUrl} className="w-10 h-10 rounded-xl object-cover grayscale-[0.5] group-hover:grayscale-0 transition-all" />
                          <div>
                            <h4 className="font-black text-slate-800 text-sm uppercase truncate">{p.name}</h4>
                            <div className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">Verified on {new Date(v.timestamp).toLocaleDateString()}</div>
                          </div>
                        </div>
                        <Link to={`/traceability/${p.id}`} className="p-3 rounded-xl bg-slate-100 text-slate-400 hover:bg-emerald-50 hover:text-emerald-600 transition-all">
                           <Eye className="w-4 h-4" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>

            <div className="space-y-8">
              {/* Notifications / Alerts Feed */}
              <section className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm relative overflow-hidden">
                 <div className="absolute top-0 right-0 p-6 opacity-5"><Bell className="w-32 h-32" /></div>
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-8 flex items-center gap-2">
                    <AlertCircle className="w-4 h-4 text-emerald-600" /> Network Alerts
                 </h3>
                 <div className="space-y-6">
                    {[
                      { t: 'Safety Certified', d: 'Alphonso Mangoes Batch #98 has cleared additional safety testing.', c: 'bg-emerald-50 text-emerald-700', i: ShieldCheck },
                      { t: 'In Transit', d: 'Your order for Organic Milk is now arriving at local hub R1.', c: 'bg-blue-50 text-blue-700', i: Truck },
                      { t: 'Verified Access', d: 'KYC Node successfully synced to global chain.', c: 'bg-purple-50 text-purple-700', i: MapPin }
                    ].map((n, i) => (
                      <div key={i} className={`p-4 rounded-2xl border border-white shadow-sm ${n.c} animate-in fade-in slide-in-from-right-4`} style={{ animationDelay: `${i * 100}ms` }}>
                        <div className="flex items-start gap-3">
                           <n.i className="w-4 h-4 shrink-0 mt-0.5" />
                           <div>
                              <div className="text-[10px] font-black uppercase tracking-widest">{n.t}</div>
                              <p className="text-[10px] mt-1 font-medium leading-relaxed uppercase opacity-80">{n.d}</p>
                           </div>
                        </div>
                      </div>
                    ))}
                 </div>
              </section>

              <div className="bg-slate-900 p-8 rounded-[2.5rem] text-white shadow-xl shadow-slate-900/20">
                 <h4 className="font-black text-sm uppercase tracking-[0.2em] mb-4 flex items-center gap-3"><Zap className="w-5 h-5 text-emerald-400 fill-current" /> Trust Metrics</h4>
                 <p className="text-[10px] text-slate-400 font-medium leading-relaxed uppercase">Your personal consumption audit matches international safety standards. Continue buying verified to maintain your score.</p>
                 <div className="mt-8 pt-8 border-t border-white/5">
                    <div className="flex justify-between items-center mb-2">
                       <span className="text-[9px] font-black uppercase text-slate-500">Consumption Integrity</span>
                       <span className="text-[10px] font-black text-emerald-400">EXCELLENT</span>
                    </div>
                    <div className="h-1.5 w-full bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-emerald-500 w-[94%]"></div>
                    </div>
                 </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MARKET BROWSER TAB - EXACTLY AS CURRENT */}
      {currentTab === 'market' && (
        <div className="space-y-8">
          {/* Market Header - Keep exactly as requested */}
          <div className="relative min-h-[220px] rounded-[3rem] overflow-hidden bg-emerald-950 flex items-center px-8 md:px-16 text-white shadow-2xl py-10">
            <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
            <div className="max-w-xl relative z-10 w-full text-left">
              <h2 className="text-2xl md:text-5xl font-black mb-6 leading-tight tracking-tight uppercase">
                Quick <span className="text-emerald-500">Provenance</span> Buying
              </h2>
              <div className="relative group max-w-md">
                <Search className="absolute left-5 top-1/2 -translate-y-1/2 text-emerald-700 group-focus-within:text-emerald-500 transition-colors" />
                <input 
                  type="text" 
                  placeholder="Search farm-fresh products..." 
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-14 pr-6 py-4 bg-white text-slate-800 rounded-2xl outline-none shadow-2xl text-sm font-medium placeholder:text-slate-300 focus:ring-4 focus:ring-emerald-500/20"
                />
              </div>
            </div>
          </div>

          <div className="bg-white border border-slate-200 rounded-[2.5rem] p-5 shadow-sm flex flex-col md:flex-row gap-6">
            <div className="flex items-center gap-4 overflow-x-auto no-scrollbar scroll-smooth flex-1">
              <button onClick={() => setSelectedCategory('All')} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2 ${selectedCategory === 'All' ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>All</button>
              {CATEGORIES.map(cat => (
                <button key={cat} onClick={() => setSelectedCategory(cat)} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest transition-all whitespace-nowrap border-2 ${selectedCategory === cat ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg' : 'bg-slate-50 border-slate-100 text-slate-400'}`}>{cat}</button>
              ))}
            </div>
            <button onClick={() => setIsWholesaleView(!isWholesaleView)} className={`px-6 py-3 rounded-xl font-black uppercase text-[10px] tracking-widest border-2 flex items-center gap-3 ${isWholesaleView ? 'bg-slate-900 border-slate-900 text-white shadow-xl' : 'bg-amber-50 border-amber-100 text-amber-600'}`}>
              <Building2 className="w-4 h-4" /> B2B Sourcing
            </button>
          </div>

          {isWholesaleView ? <VerifiedMarketBrowser /> : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {filteredCatalog.map(p => (
                <div key={p.id} className="group bg-white rounded-[2rem] overflow-hidden shadow-sm hover:shadow-2xl transition-all duration-500 border border-slate-100 flex flex-col relative">
                  <div className="aspect-square bg-slate-100 relative overflow-hidden">
                    <img src={p.imageUrl} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700" />
                    <div className="absolute top-4 left-4 bg-white/90 backdrop-blur px-2 py-1 rounded-lg shadow-lg border border-white/20 flex items-center gap-1.5">
                       <ShieldCheck className="w-3 h-3 text-emerald-600" />
                       <span className="text-[9px] font-black text-slate-800">{p.certification.matchPercentage}% Score</span>
                    </div>
                    <Link to={`/traceability/${p.id}`} className="absolute bottom-4 right-4 p-2 bg-emerald-600 text-white rounded-xl shadow-xl hover:bg-emerald-500 transition active:scale-95">
                      <ScanLine className="w-4 h-4" />
                    </Link>
                  </div>
                  <div className="p-6 flex-1 flex flex-col">
                    <Link to={`/product/${p.id}`} className="font-black text-slate-800 text-sm group-hover:text-emerald-700 transition line-clamp-1 uppercase">{p.name}</Link>
                    <div className="text-[10px] text-slate-400 font-bold mt-1 uppercase mb-6 tracking-widest">{p.category}</div>
                    <div className="mt-auto flex items-center justify-between">
                       <div className="text-sm font-black text-slate-900">₹{p.pricePerUnit}</div>
                       {cart[p.id] ? (
                         <div className="flex items-center gap-3 bg-emerald-600 text-white rounded-xl px-3 py-1.5 shadow-lg">
                           <button onClick={() => updateCart(p.id, -1)}><Minus className="w-3 h-3" /></button>
                           <span className="text-xs font-black">{cart[p.id]}</span>
                           <button onClick={() => updateCart(p.id, 1)}><Plus className="w-3 h-3" /></button>
                         </div>
                       ) : (
                         <button onClick={() => updateCart(p.id, 1)} className="px-4 py-2 bg-slate-900 text-white rounded-xl font-black uppercase text-[10px] tracking-widest hover:bg-emerald-600 transition shadow-xl shadow-slate-900/10">Add</button>
                       )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ORDERS TAB */}
      {currentTab === 'orders' && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
           <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
              <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
                 <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-2">
                    <History className="w-5 h-5 text-emerald-600" /> Procurement History
                 </h3>
              </div>
              <div className="divide-y divide-slate-50">
                 {orders.map(order => (
                    <div key={order.id} className="p-8 flex flex-col lg:flex-row justify-between items-center gap-8 hover:bg-slate-50/50 transition">
                       <div className="flex items-center gap-5 flex-1">
                          <div className="p-5 rounded-3xl bg-emerald-50 text-emerald-600">
                             <CheckCircle2 className="w-6 h-6" />
                          </div>
                          <div>
                             <div className="flex items-center gap-3 mb-1">
                                <span className="text-[10px] font-mono text-slate-400 font-black uppercase">ORDER: {order.id}</span>
                                <span className="px-2 py-0.5 bg-emerald-100 text-emerald-600 text-[8px] font-black uppercase rounded flex items-center gap-1">Verified</span>
                             </div>
                             <h4 className="font-black text-slate-800 text-lg uppercase">{order.items.length} Items Purchased</h4>
                             <p className="text-[10px] text-slate-500 font-bold uppercase mt-1">Status: {order.status} • Total: ₹{order.totalAmount.toLocaleString()}</p>
                          </div>
                       </div>
                       <div className="shrink-0 flex items-center gap-4">
                          <Link to={`/traceability/${order.items[0].productId}`} className="px-6 py-3 bg-slate-900 text-white rounded-xl font-black uppercase text-[9px] tracking-widest hover:bg-emerald-600 transition shadow-lg active:scale-95">Trace Provenance</Link>
                       </div>
                    </div>
                 ))}
                 {orders.length === 0 && <div className="py-24 text-center text-slate-300 font-black uppercase text-[10px]">No purchase records found on your node</div>}
              </div>
           </div>
        </div>
      )}

      {currentTab === 'nearby' && (
        <NearbyNetwork user={mockUser} nodes={nearbyNodes} onAuditLog={onAuditLog} />
      )}

      {/* VERIFIED SAVES TAB */}
      {currentTab === 'saves' && (
        <div className="space-y-8 animate-in slide-in-from-right-4 duration-500">
          <div className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden shadow-sm">
            <div className="p-8 border-b border-slate-100 bg-slate-50/50 flex items-center justify-between">
              <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest flex items-center gap-3">
                <Heart className="w-5 h-5 text-red-500 fill-current" /> My Verified Collection
              </h3>
              <button 
                onClick={() => generateCollectionPDF(mockUser.name, savedItems.map(si => products.find(p => p.id === si.product_id) || batches.find(b => b.id === si.product_id)).filter(Boolean) as any)}
                className="px-6 py-3 bg-slate-900 text-white rounded-2xl text-[9px] font-black uppercase tracking-widest flex items-center gap-2 hover:bg-emerald-600 transition-all shadow-lg active:scale-95"
              >
                <FileDown className="w-4 h-4" /> Download Report
              </button>
            </div>
            
            <div className="p-8">
              {savedItems.filter(si => si.user_id === mockUser.id).length === 0 ? (
                <div className="py-20 text-center text-slate-300 font-black uppercase text-xs">No saved records found</div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {savedItems.filter(si => si.user_id === mockUser.id).map((si, i) => {
                    const detail = products.find(p => p.id === si.product_id) || batches.find(b => b.id === si.product_id);
                    if (!detail) return null;
                    const isProd = 'certification' in detail;
                    return (
                      <div key={i} className="bg-slate-50 p-6 rounded-3xl border border-slate-100 flex items-center gap-5 hover:border-emerald-200 transition-all group">
                        <div className="w-16 h-16 rounded-2xl overflow-hidden shadow-sm shrink-0">
                          <img src={detail.imageUrl} className="w-full h-full object-cover" />
                        </div>
                        <div className="flex-1 overflow-hidden">
                           <h4 className="font-black text-slate-800 text-sm uppercase truncate">{isProd ? (detail as Product).name : (detail as HarvestBatch).cropName}</h4>
                           <div className="flex items-center gap-2 mt-1">
                              <span className={`px-2 py-0.5 rounded text-[8px] font-black uppercase tracking-widest ${isProd ? 'bg-purple-100 text-purple-700' : 'bg-emerald-100 text-emerald-700'}`}>{isProd ? 'SKU' : 'BATCH'}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase">{detail.category}</span>
                           </div>
                        </div>
                        <Link to={`/traceability/${detail.id}`} className="p-3 bg-white text-slate-400 hover:text-emerald-600 rounded-xl shadow-sm border border-slate-200 group-hover:border-emerald-200 transition-all">
                           <ArrowRight className="w-4 h-4" />
                        </Link>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Floating Cart & Checkout Trigger */}
      {cartItemsCount > 0 && (
        <div className="fixed bottom-28 left-1/2 -translate-x-1/2 z-[100] w-full max-w-sm px-4">
          <div className="bg-emerald-950 text-white p-6 rounded-3xl shadow-2xl flex items-center justify-between gap-6 border border-emerald-500/20 animate-in slide-in-from-bottom-10 duration-500">
            <div className="flex items-center gap-4">
              <div className="relative">
                <ShoppingCart className="w-6 h-6 text-emerald-400" />
                <span className="absolute -top-2 -right-2 bg-emerald-500 text-white text-[10px] font-black w-5 h-5 flex items-center justify-center rounded-full border-2 border-emerald-950">{cartItemsCount}</span>
              </div>
              <div>
                <div className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Basket Total</div>
                <div className="text-xl font-black">₹{cartTotal.toLocaleString()}</div>
              </div>
            </div>
            <button 
              onClick={() => setShowCheckout(true)}
              className="bg-emerald-600 hover:bg-emerald-500 text-emerald-950 px-6 py-3 rounded-2xl font-black uppercase text-[10px] tracking-widest shadow-xl transition-all active:scale-95 flex items-center gap-2"
            >
              Checkout <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}

      {showCheckout && (
        <CheckoutModal 
          user={mockUser} 
          items={checkoutPayload} 
          products={products}
          batches={batches}
          onClose={() => setShowCheckout(false)}
          onPaymentSuccess={handleCheckoutSuccess}
        />
      )}
    </div>
  );
};

export default ConsumerDashboard;