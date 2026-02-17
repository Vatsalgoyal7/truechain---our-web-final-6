
import React, { useState, useEffect, useCallback } from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import { 
  UserRole, User, HarvestBatch, Product, InventoryLog, SavedItem, BatchNote, SeasonalPlan, ViewedItem, UserPreferences, ScanLog, ChainTransaction, Wallet, TransactionType, BatchStatus, Complaint, Order, TradeOrder, TrustMetrics, AuditRecord
} from './types';
import AuthPage from './components/Auth';
import Layout from './components/Layout';
import Home from './components/Home';
import FarmerDashboard from './components/dashboards/FarmerDashboard';
import ManufacturerDashboard from './components/dashboards/ManufacturerDashboard';
import CollectorDashboard from './components/dashboards/CollectorDashboard';
import DistributorDashboard from './components/dashboards/DistributorDashboard';
import RetailerDashboard from './components/dashboards/RetailerDashboard';
import ConsumerDashboard from './components/dashboards/ConsumerDashboard';
import AuthorizerDashboard from './components/dashboards/AuthorizerDashboard';
import ProductDetail from './components/consumer/ProductDetail';
import Profile from './components/Profile';
import QRScanner from './components/QRScanner';
import TraceabilityView from './components/TraceabilityView';
import HelpSystem from './components/HelpSystem';
import { generateBlockchainHash } from './services/blockchain';
import { TrueChainDB } from './services/storage';

const App: React.FC = () => {
  const [user, setUser] = useState<User | null>(null);
  const [batches, setBatches] = useState<HarvestBatch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [inventoryLogs, setInventoryLogs] = useState<InventoryLog[]>([]);
  const [savedItems, setSavedItems] = useState<SavedItem[]>([]);
  const [scanLogs, setScanLogs] = useState<ScanLog[]>([]);
  const [wallets, setWallets] = useState<Record<string, Wallet>>({});
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [tradeOrders, setTradeOrders] = useState<TradeOrder[]>([]);
  const [auditRecords, setAuditRecords] = useState<AuditRecord[]>([]);
  
  const [batchNotes, setBatchNotes] = useState<BatchNote[]>([]);
  const [seasonalPlans, setSeasonalPlans] = useState<SeasonalPlan[]>([]);
  const [viewedItems, setViewedItems] = useState<ViewedItem[]>([]);
  const [userPreferences, setUserPreferences] = useState<UserPreferences[]>([]);

  useEffect(() => {
    TrueChainDB.initialize();

    const savedUser = localStorage.getItem('truechain_user');
    if (savedUser) setUser(JSON.parse(savedUser));

    setBatches(TrueChainDB.getBatches());
    setProducts(TrueChainDB.getProducts());
    setComplaints(TrueChainDB.getComplaints());
    setOrders(TrueChainDB.getOrders());
    setTradeOrders(TrueChainDB.getTradeOrders());
    setWallets(TrueChainDB.getWallets());
    setInventoryLogs(TrueChainDB.getInventoryLogs());
    setAuditRecords(TrueChainDB.getAuditTrail());

    const savedSavedItems = localStorage.getItem('truechain_saved_items');
    if (savedSavedItems) setSavedItems(JSON.parse(savedSavedItems));
  }, []);

  useEffect(() => { TrueChainDB.saveBatches(batches); }, [batches]);
  useEffect(() => { TrueChainDB.saveProducts(products); }, [products]);
  useEffect(() => { TrueChainDB.saveTradeOrders(tradeOrders); }, [tradeOrders]);
  useEffect(() => { TrueChainDB.saveWallets(wallets); }, [wallets]);
  useEffect(() => { TrueChainDB.saveComplaints(complaints); }, [complaints]);
  useEffect(() => { TrueChainDB.saveOrders(orders); }, [orders]);

  const addAuditRecord = useCallback(async (record: Omit<AuditRecord, 'id' | 'timestamp' | 'blockchainHash'>) => {
    const hash = await generateBlockchainHash(record);
    const newRecord: AuditRecord = {
      ...record,
      id: 'AUD-' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      timestamp: new Date().toISOString(),
      blockchainHash: hash
    };
    TrueChainDB.saveAuditRecord(newRecord);
    setAuditRecords(prev => [newRecord, ...prev]);
  }, []);

  const handleLogin = (u: User) => {
    if (!u.trustMetrics) {
      u.trustMetrics = { trustScore: 100, successRate: 100, complaintRatio: 0, penaltyHistory: [] };
    }
    setUser(u);
    localStorage.setItem('truechain_user', JSON.stringify(u));
    if (!wallets[u.id]) {
      setWallets(prev => ({ ...prev, [u.id]: { balance: 5000, pendingBalance: 0, transactionHistory: [] } }));
    }
  };

  const handleLogout = () => {
    setUser(null);
    localStorage.removeItem('truechain_user');
  };

  const handlePlaceOrder = (newOrder: Order) => {
    setOrders(prev => [newOrder, ...prev]);
    
    // Decrement inventory for each item
    newOrder.items.forEach(item => {
        updateProductQuantity(item.productId, -item.quantity, 'sale');
    });

    addAuditRecord({
      actionType: 'CONSUMER_PURCHASE',
      actorId: user?.id || 'ANONYMOUS',
      actorRole: UserRole.CONSUMER,
      targetId: newOrder.id,
      prevStatus: 'Shopping Cart',
      nextStatus: 'Processing',
      details: `Completed payment of ₹${newOrder.totalAmount} for ${newOrder.items.length} items.`
    });
  };

  const addComplaint = async (complaintData: Partial<Complaint>) => {
    const hash = await generateBlockchainHash(complaintData);
    const newComplaint: Complaint = {
      id: 'COMP' + Math.random().toString(36).substr(2, 6).toUpperCase(),
      userId: user?.id,
      userName: user?.name || 'Anonymous',
      targetId: complaintData.targetId!,
      targetName: complaintData.targetName!,
      type: complaintData.type!,
      description: complaintData.description!,
      timestamp: new Date().toISOString(),
      status: 'Open',
      blockchainHash: hash,
    };
    setComplaints(prev => [newComplaint, ...prev]);

    addAuditRecord({
      actionType: 'REPORT_DISCREPANCY',
      actorId: user?.id || 'ANONYMOUS',
      actorRole: user?.role || UserRole.CONSUMER,
      targetId: newComplaint.id,
      prevStatus: 'N/A',
      nextStatus: 'Open',
      details: `Filed discrepancy report of type ${newComplaint.type} against ${newComplaint.targetName}.`
    });
  };

  const resolveComplaint = (id: string, comment: string) => {
    setComplaints(prev => prev.map(c => c.id === id ? { ...c, status: 'Resolved', authorizerComment: comment } : c));
    addAuditRecord({
      actionType: 'RESOLVE_DISPUTE',
      actorId: user?.id || 'AUTHORIZER',
      actorRole: UserRole.AUTHORIZER,
      targetId: id,
      prevStatus: 'Open',
      nextStatus: 'Resolved',
      details: `Authorized resolution: ${comment}`
    });
  };

  const logView = (id: string) => {
    if (!user) return;
    setViewedItems(prev => [{userId: user.id, itemId: id, timestamp: new Date().toISOString()}, ...prev].slice(0, 50));
  };

  const updateBatchQuantity = async (batchId: string, delta: number, reason: InventoryLog['changeReason'] = 'adjustment') => {
    const batchIndex = batches.findIndex(b => b.id === batchId);
    if (batchIndex === -1) return;
    const batch = batches[batchIndex];
    const current = batch.currentQuantity;
    const next = Math.max(0, current + delta);
    
    const updated = [...batches];
    updated[batchIndex] = { ...updated[batchIndex], currentQuantity: next };
    setBatches(updated);

    addAuditRecord({
      actionType: 'BATCH_INVENTORY_ADJUST',
      actorId: user?.id || 'SYSTEM',
      actorRole: user?.role || UserRole.FARMER,
      targetId: batchId,
      prevStatus: `${current} Units`,
      nextStatus: `${next} Units`,
      details: `Inventory update via ${reason}.`
    });
  };

  const updateProductQuantity = async (productId: string, delta: number, reason: InventoryLog['changeReason'] = 'adjustment') => {
    const prodIndex = products.findIndex(p => p.id === productId);
    if (prodIndex === -1) return;
    const product = products[prodIndex];
    const current = product.currentQuantity;
    const next = Math.max(0, current + delta);
    const updated = [...products];
    updated[prodIndex] = { ...updated[prodIndex], currentQuantity: next };
    setProducts(updated);

    addAuditRecord({
      actionType: 'PRODUCT_INVENTORY_ADJUST',
      actorId: user?.id || 'SYSTEM',
      actorRole: user?.role || UserRole.RETAILER,
      targetId: productId,
      prevStatus: `${current} Units`,
      nextStatus: `${next} Units`,
      details: `Inventory update via ${reason}.`
    });
  };

  const currentWallet = user ? wallets[user.id] || { balance: 0, pendingBalance: 0, transactionHistory: [] } : { balance: 0, pendingBalance: 0, transactionHistory: [] };

  return (
    <>
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/auth" element={user ? <Navigate to={`/dashboard/${user.role.toLowerCase()}`} /> : <AuthPage onLogin={handleLogin} />} />
      <Route path="/login" element={user ? <Navigate to={`/dashboard/${user.role.toLowerCase()}`} /> : <AuthPage onLogin={handleLogin} />} />
      <Route path="/register" element={user ? <Navigate to={`/dashboard/${user.role.toLowerCase()}`} /> : <AuthPage onLogin={handleLogin} />} />
      
      <Route element={user ? <Layout user={user} onLogout={handleLogout} /> : <Navigate to="/login" />}>
        <Route path="dashboard" element={<Navigate to={`/dashboard/${user?.role?.toLowerCase()}`} replace />} />
        <Route path="dashboard/farmer" element={<FarmerDashboard user={user!} batches={batches} setBatches={setBatches} onUpdateQuantity={updateBatchQuantity} onDeleteBatch={(id) => setBatches(prev => prev.filter(b => b.id !== id))} batchNotes={batchNotes} onUpdateNote={(id, note) => setBatchNotes(prev => [...prev.filter(n => n.batchId !== id), { batchId: id, note, updatedAt: new Date().toISOString() }])} seasonalPlans={seasonalPlans} setSeasonalPlans={setSeasonalPlans} inventoryLogs={inventoryLogs} wallet={currentWallet} onAuditLog={addAuditRecord} />} />
        <Route path="dashboard/manufacturer" element={<ManufacturerDashboard user={user!} batches={batches} products={products} setProducts={setProducts} onUpdateQuantity={updateProductQuantity} onDeleteProduct={(id) => setProducts(p => p.filter(x => x.id !== id))} wallet={currentWallet} onAuditLog={addAuditRecord} />} />
        <Route path="dashboard/collector" element={<CollectorDashboard user={user!} wallet={currentWallet} onAuditLog={addAuditRecord} />} />
        <Route path="dashboard/distributor" element={<DistributorDashboard user={user!} products={products} onUpdateQuantity={updateProductQuantity} onDeleteProduct={(id) => setProducts(p => p.filter(x => x.id !== id))} wallet={currentWallet} />} />
        <Route path="dashboard/retailer" element={<RetailerDashboard user={user!} products={products} onUpdateQuantity={updateProductQuantity} onDeleteProduct={(id) => setProducts(p => p.filter(x => x.id !== id))} savedItems={savedItems} wallet={currentWallet} />} />
        <Route path="dashboard/consumer" element={<ConsumerDashboard products={products} batches={batches} viewedItems={viewedItems} userPreferences={userPreferences} logView={logView} savedItems={savedItems} wallet={currentWallet} onPlaceOrder={handlePlaceOrder} orders={orders} onAuditLog={addAuditRecord} />} />
        <Route path="dashboard/authorizer" element={<AuthorizerDashboard user={user!} complaints={complaints} onResolveComplaint={resolveComplaint} auditRecords={auditRecords} />} />

        <Route path="product/:id" element={<ProductDetail products={products} batches={batches} onUpdateQuantity={updateProductQuantity} user={user} savedItems={savedItems} toggleSaveItem={(id, type) => setSavedItems(prev => prev.some(s => s.product_id === id) ? prev.filter(s => s.product_id !== id) : [...prev, {saved_id: Math.random().toString(36).substr(2, 9), user_id: user?.id || '', product_id: id, saved_at: new Date().toISOString(), type}])} logView={logView} onPurchaseComplete={handlePlaceOrder} />} />
        <Route path="traceability/:id" element={<TraceabilityView products={products} batches={batches} user={user} toggleSaveItem={() => {}} savedItems={savedItems} logView={logView} /> } />
        <Route path="profile" element={<Profile user={user!} savedItems={savedItems} products={products} batches={batches} toggleSaveItem={() => {}} userPreferences={userPreferences} updatePrefs={() => {}} onUpdateUser={(u) => setUser(u)} />} />
        <Route path="scan" element={<QRScanner products={products} batches={batches} logView={logView} user={user} logScannerUsage={() => {}} />} />
      </Route>
    </Routes>
    <HelpSystem onSubmitComplaint={addComplaint} complaints={complaints} />
    </>
  );
};

export default App;
