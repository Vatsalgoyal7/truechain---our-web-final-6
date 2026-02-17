
import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { UserRole, User, SubscriptionTier, SubscriptionStatus, KycStatus } from '../types';
import { ShieldCheck, User as UserIcon, ArrowRight, Lock, Mail, Briefcase, FileText } from 'lucide-react';

interface AuthPageProps {
  onLogin: (u: User) => void;
}

const AuthPage: React.FC<AuthPageProps> = ({ onLogin }) => {
  const navigate = useNavigate();
  const location = useLocation();
  const [isRegistering, setIsRegistering] = useState(false);
  const [selectedRole, setSelectedRole] = useState<UserRole>(UserRole.CONSUMER);
  const [formData, setFormData] = useState({
    username: '',
    name: '',
    emailOrMobile: '',
    govId: '',
    companyName: '',
  });

  // Sync tab state with URL path
  useEffect(() => {
    if (location.pathname === '/register') {
      setIsRegistering(true);
    } else if (location.pathname === '/login') {
      setIsRegistering(false);
    }
  }, [location.pathname]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // In a prototype environment, we create the user with the explicitly selected role
    // Adding default trustMetrics to satisfy the User interface requirement
    const newUser: User = {
      id: Math.random().toString(36).substr(2, 9),
      username: formData.username || 'user1',
      role: selectedRole,
      name: isRegistering ? (formData.name || formData.username) : (formData.username || 'User'),
      emailOrMobile: formData.emailOrMobile || 'user@example.com',
      govId: formData.govId,
      companyName: formData.companyName,
      status: selectedRole === UserRole.AUTHORIZER ? 'Pending Authorization Access' : 'Verified',
      subscription: {
        tier: selectedRole === UserRole.CONSUMER ? SubscriptionTier.CONSUMER_FREE : SubscriptionTier.TRIAL,
        status: SubscriptionStatus.TRIAL,
        expiryDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
        price: 0
      },
      kycStatus: KycStatus.NOT_STARTED,
      trustMetrics: {
        trustScore: 100,
        successRate: 100,
        complaintRatio: 0,
        penaltyHistory: []
      }
    };

    onLogin(newUser);
    // Explicitly navigate to the correct dashboard based on the selected role
    navigate(`/dashboard/${newUser.role.toLowerCase()}`);
  };

  const roles = Object.values(UserRole);

  return (
    <div className="min-h-screen flex items-center justify-center bg-emerald-950 p-6">
      <div className="absolute top-0 left-0 w-full h-full opacity-10 pointer-events-none">
        <div className="grid grid-cols-8 gap-4 p-4">
          {Array.from({ length: 64 }).map((_, i) => (
            <ShieldCheck key={i} className="text-emerald-400 w-full h-auto" />
          ))}
        </div>
      </div>

      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden relative z-10">
        <div className="bg-emerald-600 p-8 text-center text-white">
          <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-4 shadow-inner">
            <ShieldCheck className="w-10 h-10" />
          </div>
          <h2 className="text-3xl font-black tracking-tight">TrueChain</h2>
          <p className="mt-2 text-emerald-100 opacity-80 font-medium">Blockchain-Backed Food Provenance</p>
        </div>

        <div className="p-8">
          <div className="flex gap-4 mb-8">
            <button 
              onClick={() => {
                setIsRegistering(false);
                navigate('/login');
              }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition ${!isRegistering ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
            >
              Login
            </button>
            <button 
              onClick={() => {
                setIsRegistering(true);
                navigate('/register');
              }}
              className={`flex-1 py-3 text-sm font-black uppercase tracking-widest border-b-2 transition ${isRegistering ? 'border-emerald-600 text-emerald-600' : 'border-transparent text-slate-400'}`}
            >
              Register
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-[10px] font-black text-slate-400 uppercase tracking-[0.2em] mb-3">Identify Your Role</label>
              <div className="grid grid-cols-3 gap-2">
                {roles.map(r => (
                  <button
                    key={r}
                    type="button"
                    onClick={() => setSelectedRole(r)}
                    className={`py-2 px-1 text-[9px] rounded-lg border transition-all font-black uppercase tracking-widest ${selectedRole === r ? 'bg-emerald-600 border-emerald-600 text-white shadow-lg shadow-emerald-600/20' : 'border-slate-100 bg-slate-50 text-slate-400 hover:border-emerald-200 hover:text-emerald-600'}`}
                  >
                    {r === UserRole.COLLECTOR ? 'Transporter' : r}
                  </button>
                ))}
              </div>
            </div>

            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
              <input 
                required
                type="text" 
                placeholder="Username" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition font-bold text-slate-700"
                onChange={e => setFormData({...formData, username: e.target.value})}
              />
            </div>

            {isRegistering && (
              <div className="space-y-4 animate-in fade-in duration-300">
                <div className="relative group">
                  <Briefcase className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
                  <input 
                    required
                    type="text" 
                    placeholder="Full Name / Authority Owner" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition font-bold text-slate-700"
                    onChange={e => setFormData({...formData, name: e.target.value})}
                  />
                </div>

                <div className="relative group">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
                  <input 
                    required
                    type="text" 
                    placeholder="Email or Mobile" 
                    className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition font-bold text-slate-700"
                    onChange={e => setFormData({...formData, emailOrMobile: e.target.value})}
                  />
                </div>

                {selectedRole !== UserRole.CONSUMER && (
                  <div className="relative group">
                    <FileText className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
                    <input 
                      required
                      type="text" 
                      placeholder={selectedRole === UserRole.COLLECTOR ? "Vehicle License No." : "Government ID / License"}
                      className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition font-bold text-slate-700"
                      onChange={e => setFormData({...formData, govId: e.target.value})}
                    />
                  </div>
                )}
              </div>
            )}

            <div className="relative group">
              <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-emerald-500 w-5 h-5 transition-colors" />
              <input 
                required
                type="password" 
                placeholder="Password" 
                className="w-full pl-12 pr-4 py-4 bg-slate-50 border border-slate-100 rounded-2xl focus:ring-4 focus:ring-emerald-500/10 focus:border-emerald-500 outline-none transition font-bold text-slate-700"
              />
            </div>

            <button 
              type="submit"
              className="w-full py-4 bg-emerald-600 hover:bg-emerald-700 text-white font-black uppercase tracking-widest text-xs rounded-2xl shadow-xl shadow-emerald-600/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
            >
              {isRegistering ? 'Initialize Chain Node' : 'Authenticated Access'}
              <ArrowRight className="w-4 h-4" />
            </button>
          </form>

          <p className="mt-8 text-center text-slate-400 text-[10px] font-bold uppercase tracking-[0.2em]">
            Strictly for <strong className="text-emerald-700">Food & Beverage</strong> provenance only.
          </p>
        </div>
      </div>
    </div>
  );
};

export default AuthPage;
