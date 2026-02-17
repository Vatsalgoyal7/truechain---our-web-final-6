
import React from 'react';
import { Link } from 'react-router-dom';
import { 
  ShieldCheck, Tractor, Factory, Truck, Store, 
  ScanLine, CheckCircle2, ArrowRight, Mail, Phone, Lock, Box 
} from 'lucide-react';

const Home: React.FC = () => {
  return (
    <div className="min-h-screen bg-slate-50 flex flex-col w-full overflow-x-hidden">
      {/* Responsive Navigation */}
      <nav className="h-16 md:h-20 bg-white border-b border-slate-200 sticky top-0 z-50 px-4 sm:px-6 md:px-12 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-6 h-6 md:w-8 md:h-8 text-emerald-600" />
          <span className="text-lg md:text-xl font-black text-slate-800 tracking-tight uppercase">TrueChain</span>
        </div>
        <div className="flex items-center gap-3 md:gap-6">
          <Link to="/login" className="text-[10px] md:text-xs font-black uppercase tracking-widest text-slate-500 hover:text-emerald-600 transition">Login</Link>
          <Link to="/register" className="bg-emerald-600 text-white px-4 py-2 md:px-6 md:py-2.5 rounded-xl text-[9px] md:text-[10px] font-black uppercase tracking-widest shadow-lg shadow-emerald-600/20 hover:bg-emerald-700 transition">Register</Link>
        </div>
      </nav>

      {/* Hero Section - Fully Responsive */}
      <section className="relative bg-emerald-950 pt-16 pb-20 md:pt-24 md:pb-32 px-4 sm:px-6 md:px-12 overflow-hidden">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-20"></div>
        <div className="absolute top-0 right-0 w-full md:w-1/2 h-full opacity-5 pointer-events-none flex justify-end">
          <ShieldCheck className="w-64 h-64 md:w-full md:h-full -mr-16 -mt-16 md:-mr-20 md:-mt-20" />
        </div>
        
        <div className="max-w-6xl mx-auto relative z-10 text-center md:text-left">
          <div className="max-w-3xl mx-auto md:mx-0">
            <span className="inline-flex items-center gap-2 px-3 py-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 rounded-full text-[9px] md:text-[10px] font-black uppercase tracking-widest mb-6">
              <Lock className="w-3 h-3" /> Blockchain-Backed Security
            </span>
            <h1 className="text-3xl sm:text-4xl md:text-6xl lg:text-7xl font-black text-white leading-tight mb-6 md:mb-8 uppercase tracking-tighter">
              TrueChain – <br className="hidden sm:block" />
              Blockchain-Backed <br className="hidden sm:block" />
              <span className="text-emerald-500">Food Provenance</span>
            </h1>
            <p className="text-emerald-100/70 text-base md:text-xl font-medium mb-8 md:mb-10 max-w-xl mx-auto md:mx-0 leading-relaxed">
              Transparent, tamper-proof traceability for eatable and drinkable food products.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center md:justify-start">
              <Link to="/login" className="w-full sm:w-auto bg-emerald-600 hover:bg-emerald-700 text-white px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition flex items-center justify-center gap-3 shadow-2xl shadow-emerald-600/40">
                Login <ArrowRight className="w-5 h-5" />
              </Link>
              <Link to="/register" className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 md:px-10 md:py-5 rounded-2xl font-black text-xs uppercase tracking-[0.2em] transition flex items-center justify-center shadow-xl">
                Register
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* About Section - Responsive Grid */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-white">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-12 md:gap-16 items-center">
          <div className="text-center md:text-left">
            <h2 className="text-[10px] font-black text-emerald-600 uppercase tracking-[0.3em] mb-4">Our Mission</h2>
            <h3 className="text-2xl sm:text-3xl md:text-4xl font-black text-slate-800 leading-tight mb-6 uppercase tracking-tight">
              Blockchain-Backed Food Traceability
            </h3>
            <div className="space-y-4 md:space-y-6 text-slate-500 font-medium text-sm md:text-base leading-relaxed">
              <p>
                TrueChain provides a role-based supply chain transparency platform that ensures every participant—from farmers to consumers—can verify the source and safety of their food. By utilizing decentralized ledger technology, we provide immutable proof of origin.
              </p>
              <p>
                Our platform focuses on <strong>Certification Verification</strong> and <strong>Consumer Trust & Safety</strong>. We enable real-time tracking of food and beverages to prevent fraud and ensure quality compliance across global networks.
              </p>
              <div className="bg-slate-50 p-4 md:p-6 rounded-2xl border-l-4 border-emerald-600 text-[12px] md:text-sm italic text-slate-600 text-left">
                <strong>Note:</strong> TrueChain is engineered exclusively for food and beverage products intended for human consumption. We do not support non-food items.
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-3 md:gap-4">
            <div className="space-y-3 md:space-y-4">
              <div className="bg-emerald-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-emerald-100 flex flex-col items-center text-center">
                <ShieldCheck className="w-8 h-8 md:w-10 md:h-10 text-emerald-600 mb-3 md:mb-4" />
                <h4 className="font-black text-slate-800 text-[9px] md:text-[10px] uppercase tracking-widest">Tamper Proof</h4>
              </div>
              <div className="bg-slate-900 p-6 md:p-8 rounded-2xl md:rounded-3xl text-white flex flex-col items-center text-center">
                <Lock className="w-8 h-8 md:w-10 md:h-10 text-emerald-400 mb-3 md:mb-4" />
                <h4 className="font-black uppercase text-[9px] md:text-[10px] tracking-widest">Secure Ledger</h4>
              </div>
            </div>
            <div className="pt-6 md:pt-8 space-y-3 md:space-y-4">
              <div className="bg-blue-50 p-6 md:p-8 rounded-2xl md:rounded-3xl border border-blue-100 flex flex-col items-center text-center">
                <CheckCircle2 className="w-8 h-8 md:w-10 md:h-10 text-blue-600 mb-3 md:mb-4" />
                <h4 className="font-black text-slate-800 text-[9px] md:text-[10px] uppercase tracking-widest">Verified</h4>
              </div>
              <div className="bg-emerald-600 p-6 md:p-8 rounded-2xl md:rounded-3xl text-white shadow-xl flex flex-col items-center text-center">
                <ScanLine className="w-8 h-8 md:w-10 md:h-10 text-white mb-3 md:mb-4" />
                <h4 className="font-black uppercase text-[9px] md:text-[10px] tracking-widest">Consumer Trust</h4>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* How it Works Section - Laptop Horizontal / Mobile Vertical */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-slate-50 border-y border-slate-200">
        <div className="max-w-6xl mx-auto">
          <div className="text-center max-w-2xl mx-auto mb-12 md:mb-16">
            <h2 className="text-[10px] font-black text-slate-400 uppercase tracking-[0.3em] mb-4">Process</h2>
            <h3 className="text-2xl sm:text-3xl font-black text-slate-800 uppercase tracking-tight">How it Works</h3>
          </div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8">
            {[
              { icon: Tractor, role: 'Farmer', step: 'Harvest', desc: 'Crop registration with origin data and initial quality logs.' },
              { icon: Factory, role: 'Manufacturer', step: 'Processing & Certification', desc: 'Safe handling and compliance certification from authorized bodies.' },
              { icon: Truck, role: 'Collector', step: 'Transport', desc: 'Secure shipment tracking with environmental monitoring.' },
              { icon: Box, role: 'Distributor', step: 'Storage & Dispatch', desc: 'Strategic storage and assignment to the retail supply network.' },
              { icon: Store, role: 'Retailer', step: 'Sales', desc: 'Inventory verification and public facing shelf integrity checks.' },
              { icon: ScanLine, role: 'Consumer', step: 'QR Verification', desc: 'Scan any item to view the complete blockchain audit trail.' },
            ].map((item, i) => (
              <div key={i} className="bg-white p-6 md:p-8 rounded-2xl md:rounded-3xl border border-slate-200 shadow-sm hover:border-emerald-500 transition-all group">
                <div className="w-10 h-10 md:w-12 md:h-12 bg-slate-50 rounded-xl md:rounded-2xl flex items-center justify-center text-slate-400 group-hover:bg-emerald-600 group-hover:text-white transition-colors mb-5 md:mb-6 shadow-inner">
                  <item.icon className="w-5 h-5 md:w-6 md:h-6" />
                </div>
                <div className="text-[9px] md:text-[10px] font-black text-emerald-600 uppercase tracking-widest mb-1">{item.role}</div>
                <h4 className="text-base md:text-lg font-black text-slate-800 uppercase tracking-tight mb-2 md:mb-3">{item.step}</h4>
                <p className="text-slate-500 text-xs font-medium leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Access Platform Section - Responsive CTA */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-white">
        <div className="max-w-4xl mx-auto bg-slate-900 rounded-[2rem] md:rounded-[3rem] p-8 sm:p-12 md:p-20 text-center relative overflow-hidden shadow-2xl">
          <div className="absolute top-0 right-0 p-8 opacity-5"><ShieldCheck className="w-32 h-32 md:w-48 md:h-48" /></div>
          <div className="relative z-10">
            <h3 className="text-2xl sm:text-3xl md:text-5xl font-black text-white mb-4 md:mb-6 uppercase tracking-tighter leading-tight">Access Platform</h3>
            <p className="text-slate-400 text-sm md:text-lg mb-8 md:mb-12 max-w-xl mx-auto font-medium leading-relaxed">Log in or register to join the most transparent food network in the world.</p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link to="/login" className="w-full sm:w-auto bg-emerald-600 text-white px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-emerald-700 transition shadow-xl shadow-emerald-600/20">Login</Link>
              <Link to="/register" className="w-full sm:w-auto bg-white text-slate-900 px-8 py-4 md:px-12 md:py-5 rounded-2xl font-black text-xs uppercase tracking-widest hover:bg-slate-100 transition shadow-xl shadow-white/5">Register</Link>
            </div>
          </div>
        </div>
      </section>

      {/* Contact Section - Responsive Layout */}
      <section className="py-16 md:py-24 px-4 sm:px-6 md:px-12 bg-slate-50">
        <div className="max-w-6xl mx-auto text-center">
          <h3 className="text-xs font-black text-slate-400 uppercase tracking-[0.3em] mb-10 md:mb-12">Contact Information</h3>
          <div className="flex flex-col md:flex-row items-center justify-center gap-8 md:gap-16">
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                <Mail className="w-5 h-5" />
              </div>
              <div className="text-[10px] md:text-sm font-black text-slate-800 uppercase tracking-widest">Email</div>
              <div className="text-slate-500 text-sm font-medium mt-1">support@truechain.io</div>
            </div>
            <div className="flex flex-col items-center">
              <div className="w-10 h-10 md:w-12 md:h-12 bg-white rounded-xl md:rounded-2xl flex items-center justify-center text-emerald-600 mb-4 shadow-sm">
                <Phone className="w-5 h-5" />
              </div>
              <div className="text-[10px] md:text-sm font-black text-slate-800 uppercase tracking-widest">Phone</div>
              <div className="text-slate-500 text-sm font-medium mt-1">+91-XXXXXXXXXX</div>
            </div>
          </div>
        </div>
      </section>

      {/* Responsive Footer */}
      <footer className="bg-emerald-950 py-10 md:py-12 px-4 sm:px-6 md:px-12 border-t border-white/5 mt-auto">
        <div className="max-w-6xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6 md:gap-8">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 md:w-6 md:h-6 text-emerald-400" />
            <span className="text-base md:text-lg font-black text-white tracking-tight uppercase">TrueChain</span>
          </div>
          <p className="text-emerald-400/50 text-[8px] md:text-[10px] font-black uppercase tracking-widest text-center">
            &copy; {new Date().getFullYear()} TrueChain &bull; Food & Beverage provenance only
          </p>
          <div className="flex gap-4 md:gap-6">
            <span className="text-emerald-400/30 text-[8px] md:text-[9px] font-black uppercase tracking-widest">Secure Node</span>
            <span className="text-emerald-400/30 text-[8px] md:text-[9px] font-black uppercase tracking-widest">Provenance V1.0</span>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Home;
