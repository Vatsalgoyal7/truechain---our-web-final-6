import React, { useState, useMemo } from 'react';
import { ShieldCheck, MapPin, Star, MessageSquare, Building2, Package, ArrowRight, Filter, Search, CheckCircle2, TrendingUp, Zap, Globe, Clock } from 'lucide-react';
import { Product, HarvestBatch, FoodCategory } from '../../types';
import InquiryModal from './InquiryModal';

interface B2BSeller {
  id: string;
  name: string;
  location: string;
  tier: 'Enterprise' | 'Pro' | 'Verified';
  trustScore: number;
  responseTime: string;
  categories: FoodCategory[];
  nodeId: string;
  products: Partial<Product>[];
}

const SELLERS: B2BSeller[] = [
  {
    id: 'S1',
    name: 'Heirloom Organic Sourcing',
    location: 'Northern Valley, Plot 42',
    tier: 'Enterprise',
    trustScore: 98,
    responseTime: '2 hrs',
    categories: [FoodCategory.FRUITS_VEG, FoodCategory.ORGANIC],
    nodeId: 'NODE-F-001',
    products: [
      { id: 'P1', name: 'Bulk Fuji Apples', currentQuantity: 5000, pricePerUnit: 85 },
      { id: 'P2', name: 'Organic Spinach (Dehydrated)', currentQuantity: 1200, pricePerUnit: 140 }
    ]
  },
  {
    id: 'S2',
    name: 'Alpha Manufacturing Hub',
    location: 'Central Processing Unit, Zone 4',
    tier: 'Pro',
    trustScore: 95,
    responseTime: '4 hrs',
    categories: [FoodCategory.PACKAGED, FoodCategory.SNACKS_SWEETS],
    nodeId: 'NODE-M-882',
    products: [
      { id: 'P3', name: 'Dark Chocolate Couverture', currentQuantity: 2500, pricePerUnit: 210 },
      { id: 'P4', name: 'Roasted Almond Clusters', currentQuantity: 800, pricePerUnit: 350 }
    ]
  },
  {
    id: 'S3',
    name: 'Indus Valley Rice Corp',
    location: 'Basmati Belt, Sector 9',
    tier: 'Verified',
    trustScore: 100,
    responseTime: '1 hr',
    categories: [FoodCategory.GRAINS_PULSES],
    nodeId: 'NODE-F-909',
    products: [
      { id: 'P5', name: 'Premium Basmati (Wholesale)', currentQuantity: 15000, pricePerUnit: 110 }
    ]
  }
];

const VerifiedMarketBrowser: React.FC = () => {
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedSeller, setSelectedSeller] = useState<B2BSeller | null>(null);
  const [showInquiry, setShowInquiry] = useState(false);

  const filteredSellers = useMemo(() => {
    return SELLERS.filter(s => 
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.categories.some(c => c.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [searchQuery]);

  return (
    <div className="space-y-8 animate-in fade-in duration-700">
      {/* Marketplace Header */}
      <div className="bg-white p-8 rounded-[2.5rem] border border-slate-200 shadow-sm flex flex-col md:flex-row justify-between items-center gap-6">
        <div className="flex items-center gap-5">
          <div className="w-16 h-16 bg-emerald-100 rounded-2xl flex items-center justify-center text-emerald-600 shadow-inner">
            <Building2 className="w-8 h-8" />
          </div>
          <div>
            <h2 className="text-2xl font-black text-slate-800 uppercase tracking-tight">Verified B2B Marketplace</h2>
            <p className="text-slate-400 text-xs font-bold uppercase tracking-widest mt-1">Sourcing trusted suppliers via TrueChain Network</p>
          </div>
        </div>
        <div className="relative w-full md:w-96 group">
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-300 group-focus-within:text-emerald-500 transition-colors" />
          <input 
            type="text" 
            placeholder="Search suppliers or bulk products..." 
            className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 font-bold transition-all"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      <div className="grid lg:grid-cols-4 gap-8">
        {/* Filters Sidebar */}
        <div className="space-y-6">
          <div className="bg-white p-6 rounded-[2rem] border border-slate-200 shadow-sm">
            <h3 className="text-xs font-black text-slate-800 uppercase tracking-widest mb-6 flex items-center gap-2">
              <Filter className="w-4 h-4 text-emerald-600" /> Procurement Filters
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Supplier Tier</label>
                <div className="space-y-2">
                  {['Enterprise', 'Pro', 'Standard Verified'].map(tier => (
                    <label key={tier} className="flex items-center gap-2 cursor-pointer group">
                      <div className="w-4 h-4 rounded border border-slate-200 flex items-center justify-center group-hover:border-emerald-500 transition">
                        <div className="w-2 h-2 rounded-sm bg-emerald-500 scale-0 group-hover:scale-100 transition"></div>
                      </div>
                      <span className="text-xs font-bold text-slate-600 group-hover:text-slate-900">{tier}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="pt-4 border-t border-slate-100">
                <label className="text-[9px] font-black text-slate-400 uppercase mb-2 block tracking-widest">Global Locations</label>
                <select className="w-full bg-slate-50 p-3 rounded-xl border border-slate-100 text-xs font-bold outline-none">
                  <option>All Regions</option>
                  <option>Northern Valley</option>
                  <option>Central Hub</option>
                  <option>South Coast</option>
                </select>
              </div>
            </div>
          </div>

          <div className="bg-emerald-900 p-6 rounded-[2rem] text-white space-y-4 shadow-xl relative overflow-hidden">
            <div className="absolute top-0 right-0 p-4 opacity-10"><TrendingUp className="w-16 h-16" /></div>
            <h4 className="font-black text-sm uppercase tracking-widest">Buyer Protection</h4>
            <p className="text-[10px] text-emerald-100/60 leading-relaxed font-medium uppercase">All wholesale transactions are secured by TrueChain Escrow and smart contracts.</p>
          </div>
        </div>

        {/* Supplier List */}
        <div className="lg:col-span-3 space-y-6">
          {filteredSellers.map(seller => (
            <div key={seller.id} className="bg-white rounded-[2.5rem] border border-slate-200 overflow-hidden hover:shadow-xl transition-all duration-500 group">
              <div className="p-8 flex flex-col md:flex-row justify-between gap-8">
                <div className="flex-1 space-y-4">
                  <div className="flex flex-wrap items-center gap-3">
                    <h3 className="text-2xl font-black text-slate-800 uppercase tracking-tight group-hover:text-emerald-700 transition">{seller.name}</h3>
                    <span className={`px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest border shadow-sm flex items-center gap-1.5 ${
                      seller.tier === 'Enterprise' ? 'bg-purple-50 text-purple-600 border-purple-100' : 
                      seller.tier === 'Pro' ? 'bg-blue-50 text-blue-600 border-blue-100' : 
                      'bg-emerald-50 text-emerald-600 border-emerald-100'
                    }`}>
                      <ShieldCheck className="w-3 h-3" /> {seller.tier} Supplier
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-6 text-slate-400">
                    <div className="flex items-center gap-2">
                      <MapPin className="w-4 h-4 text-red-500" />
                      <span className="text-xs font-bold">{seller.location}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Globe className="w-4 h-4 text-blue-400" />
                      <span className="text-xs font-mono font-bold uppercase">{seller.nodeId}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Clock className="w-4 h-4 text-amber-500" />
                      <span className="text-xs font-bold">{seller.responseTime} Response</span>
                    </div>
                  </div>

                  <div className="pt-4 flex items-center gap-4">
                    <div className="flex-1 max-w-xs">
                      <div className="flex justify-between text-[9px] font-black text-slate-400 uppercase tracking-widest mb-2">
                        <span>Trust Integrity</span>
                        <span>{seller.trustScore}%</span>
                      </div>
                      <div className="h-2 w-full bg-slate-100 rounded-full overflow-hidden">
                        <div className="h-full bg-emerald-500 transition-all duration-1000 group-hover:w-full" style={{ width: `${seller.trustScore}%` }}></div>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col justify-center gap-3 shrink-0">
                  <button 
                    onClick={() => { setSelectedSeller(seller); setShowInquiry(true); }}
                    className="px-8 py-4 bg-slate-900 hover:bg-emerald-600 text-white rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all shadow-xl active:scale-95"
                  >
                    Contact Supplier
                  </button>
                  <button className="px-8 py-4 bg-white border-2 border-slate-100 text-slate-600 hover:border-emerald-200 hover:bg-emerald-50 rounded-2xl font-black uppercase text-[10px] tracking-widest transition-all">
                    Get Best Price
                  </button>
                </div>
              </div>

              {/* Top Products Gallery */}
              <div className="bg-slate-50/50 p-6 border-t border-slate-100 overflow-x-auto no-scrollbar">
                <div className="flex gap-4">
                  {seller.products.map(prod => (
                    <div key={prod.id} className="min-w-[200px] bg-white p-4 rounded-[1.5rem] border border-slate-100 shadow-sm hover:border-emerald-400 transition cursor-default">
                      <div className="flex items-center gap-3 mb-3">
                        <div className="w-8 h-8 bg-slate-50 rounded-lg flex items-center justify-center text-slate-400">
                          <Package className="w-4 h-4" />
                        </div>
                        <span className="text-[10px] font-black text-slate-400 uppercase tracking-tighter">Verified SKU</span>
                      </div>
                      <h4 className="font-black text-slate-800 text-xs mb-1 truncate">{prod.name}</h4>
                      <div className="text-[10px] font-bold text-emerald-600 mb-3">Est. ₹{prod.pricePerUnit}/unit</div>
                      <div className="flex items-center justify-between">
                         <span className="text-[8px] font-black text-slate-400 uppercase">MOQ: 100 Units</span>
                         <CheckCircle2 className="w-4 h-4 text-emerald-500" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {showInquiry && selectedSeller && (
        <InquiryModal 
          sellerName={selectedSeller.name} 
          onClose={() => setShowInquiry(false)} 
        />
      )}
    </div>
  );
};

export default VerifiedMarketBrowser;