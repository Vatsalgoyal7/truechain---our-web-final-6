
import { Product, HarvestBatch, InventoryLog, User, Wallet, Complaint, Order, TradeOrder, UserRole, SubscriptionTier, SubscriptionStatus, KycStatus, OrderStatus, AuditRecord } from '../types';
import { SEED_BATCHES, SEED_PRODUCTS } from '../seeds';

const STORAGE_KEYS = {
  USER: 'truechain_user',
  BATCHES: 'truechain_batches',
  PRODUCTS: 'truechain_products',
  LOGS: 'truechain_inventory_logs',
  WALLETS: 'truechain_wallets',
  COMPLAINTS: 'truechain_complaints',
  ORDERS: 'truechain_orders',
  TRADE_ORDERS: 'truechain_trade_orders',
  SAVED: 'truechain_saved_items',
  NOTES: 'truechain_batch_notes',
  PLANS: 'truechain_seasonal_plans',
  VIEWS: 'truechain_viewed_items',
  PREFS: 'truechain_user_preferences',
  SCAN_LOGS: 'truechain_scan_logs',
  ALL_USERS: 'truechain_all_users',
  AUDIT_TRAIL: 'truechain_audit_trail',
  VERIFIED_MANIFESTS: 'truechain_verified_manifests'
};

export const TrueChainDB = {
  initialize() {
    if (!localStorage.getItem(STORAGE_KEYS.BATCHES)) {
      localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(SEED_BATCHES));
    }
    if (!localStorage.getItem(STORAGE_KEYS.PRODUCTS)) {
      localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(SEED_PRODUCTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.AUDIT_TRAIL)) {
      localStorage.setItem(STORAGE_KEYS.AUDIT_TRAIL, JSON.stringify([]));
    }
    if (!localStorage.getItem(STORAGE_KEYS.VERIFIED_MANIFESTS)) {
      localStorage.setItem(STORAGE_KEYS.VERIFIED_MANIFESTS, JSON.stringify({}));
    }
  },

  getBatches(): HarvestBatch[] {
    const data = localStorage.getItem(STORAGE_KEYS.BATCHES);
    return data ? JSON.parse(data) : SEED_BATCHES;
  },

  saveBatches(batches: HarvestBatch[]) {
    localStorage.setItem(STORAGE_KEYS.BATCHES, JSON.stringify(batches));
  },

  getProducts(): Product[] {
    const data = localStorage.getItem(STORAGE_KEYS.PRODUCTS);
    return data ? JSON.parse(data) : SEED_PRODUCTS;
  },

  saveProducts(products: Product[]) {
    localStorage.setItem(STORAGE_KEYS.PRODUCTS, JSON.stringify(products));
  },

  getOrders(): Order[] {
    const data = localStorage.getItem(STORAGE_KEYS.ORDERS);
    return data ? JSON.parse(data) : [];
  },

  saveOrders(orders: Order[]) {
    localStorage.setItem(STORAGE_KEYS.ORDERS, JSON.stringify(orders));
  },

  getTradeOrders(): TradeOrder[] {
    const data = localStorage.getItem(STORAGE_KEYS.TRADE_ORDERS);
    return data ? JSON.parse(data) : [];
  },

  saveTradeOrders(orders: TradeOrder[]) {
    localStorage.setItem(STORAGE_KEYS.TRADE_ORDERS, JSON.stringify(orders));
  },

  getInventoryLogs(): InventoryLog[] {
    const data = localStorage.getItem(STORAGE_KEYS.LOGS);
    return data ? JSON.parse(data) : [];
  },

  saveInventoryLogs(logs: InventoryLog[]) {
    localStorage.setItem(STORAGE_KEYS.LOGS, JSON.stringify(logs));
  },

  getWallets(): Record<string, Wallet> {
    const data = localStorage.getItem(STORAGE_KEYS.WALLETS);
    return data ? JSON.parse(data) : {};
  },

  saveWallets(wallets: Record<string, Wallet>) {
    localStorage.setItem(STORAGE_KEYS.WALLETS, JSON.stringify(wallets));
  },

  getComplaints(): Complaint[] {
    const data = localStorage.getItem(STORAGE_KEYS.COMPLAINTS);
    return data ? JSON.parse(data) : [];
  },

  saveComplaints(complaints: Complaint[]) {
    localStorage.setItem(STORAGE_KEYS.COMPLAINTS, JSON.stringify(complaints));
  },

  getUsers(): User[] {
    const data = localStorage.getItem(STORAGE_KEYS.ALL_USERS);
    return data ? JSON.parse(data) : [];
  },

  saveUsers(users: User[]) {
    localStorage.setItem(STORAGE_KEYS.ALL_USERS, JSON.stringify(users));
  },

  getAuditTrail(): AuditRecord[] {
    const data = localStorage.getItem(STORAGE_KEYS.AUDIT_TRAIL);
    return data ? JSON.parse(data) : [];
  },

  saveAuditRecord(record: AuditRecord) {
    const trail = this.getAuditTrail();
    // Append only
    trail.unshift(record);
    localStorage.setItem(STORAGE_KEYS.AUDIT_TRAIL, JSON.stringify(trail));
  },

  getVerifiedManifests(): Record<string, any> {
    const data = localStorage.getItem(STORAGE_KEYS.VERIFIED_MANIFESTS);
    return data ? JSON.parse(data) : {};
  },

  saveVerifiedManifest(batchId: string, report: any) {
    const manifests = this.getVerifiedManifests();
    manifests[batchId] = {
        ...report,
        timestamp: new Date().toISOString(),
        verified: true
    };
    localStorage.setItem(STORAGE_KEYS.VERIFIED_MANIFESTS, JSON.stringify(manifests));
  },

  updateUserTrust(userId: string, deltaScore: number) {
    const users = this.getUsers();
    const updated = users.map(u => {
      if (u.id === userId) {
        const metrics = u.trustMetrics || { trustScore: 100, successRate: 100, complaintRatio: 0, penaltyHistory: [] };
        return {
          ...u,
          trustMetrics: {
            ...metrics,
            trustScore: Math.max(0, Math.min(100, metrics.trustScore + deltaScore))
          }
        };
      }
      return u;
    });
    this.saveUsers(updated);
    
    // Also update current user if matches
    const current = JSON.parse(localStorage.getItem(STORAGE_KEYS.USER) || 'null');
    if (current && current.id === userId) {
      localStorage.setItem(STORAGE_KEYS.USER, JSON.stringify(updated.find(u => u.id === userId)));
    }
  }
};
