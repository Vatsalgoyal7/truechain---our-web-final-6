
export enum UserRole {
  CONSUMER = 'CONSUMER',
  FARMER = 'FARMER',
  MANUFACTURER = 'MANUFACTURER',
  DISTRIBUTOR = 'DISTRIBUTOR',
  RETAILER = 'RETAILER',
  COLLECTOR = 'COLLECTOR',
  AUTHORIZER = 'AUTHORIZER',
}

export enum OrderStatus {
  DRAFT = 'Draft',
  DISCOVERY_CONFIRMED = 'Discovery Confirmed',
  PENDING_BUYER = 'Awaiting Buyer',
  PENDING_COLLECTOR = 'Awaiting Logistics',
  COLLECTOR_ASSIGNED = 'Collector Assigned',
  PICKUP_READY = 'Ready for Pickup',
  IN_TRANSIT = 'In Transit',
  DELIVERED = 'Delivered',
  COMPLETED = 'Completed & Verified',
  DISPUTED = 'Disputed',
  CANCELLED = 'Cancelled'
}

export interface TrustMetrics {
  trustScore: number; // 0-100
  successRate: number; // percentage
  complaintRatio: number;
  penaltyHistory: string[];
}

export interface SmartContract {
  contractId: string;
  terms: string;
  complianceRef: string; // Government standard code (e.g., FSSAI-2024-LOG)
  penaltyClauses: string;
  sellerId: string;
  buyerId: string;
  sellerSignature: string;
  buyerSignature: string;
  timestamp: string;
  validUntil: string;
}

export interface TradeOrder {
  id: string;
  sellerId: string;
  sellerName: string;
  buyerId: string;
  buyerName: string;
  collectorId?: string;
  collectorName?: string;
  assetId: string; // HarvestBatch ID or Product ID
  assetType: 'Batch' | 'SKU';
  assetName: string;
  quantity: number;
  unitPrice: number;
  totalPrice: number;
  status: OrderStatus;
  contract: SmartContract;
  events: SupplyChainEvent[];
  isVerified: boolean;
  category: FoodCategory;
  blockchainHash: string;
}

export interface SupplyChainEvent {
  type: 'ORDER_CREATED' | 'COLLECTOR_JOINED' | 'PICKUP' | 'TRANSIT_UPDATE' | 'DELIVERY' | 'INSPECTION' | 'BUYER_CONFIRMED';
  timestamp: string;
  location: { address: string; lat: number; lng: number };
  actorId: string;
  actorRole: UserRole;
  notes?: string;
  blockchainHash: string;
}

export interface AuditRecord {
  id: string;
  actionType: string;
  actorId: string;
  actorRole: UserRole;
  targetId: string;
  timestamp: string;
  prevStatus: string;
  nextStatus: string;
  details: string;
  blockchainHash: string;
}

export enum KycStatus {
  NOT_STARTED = 'Not Started',
  SUBMITTED = 'Submitted',
  COMPLETED = 'completed',
  VERIFIED = 'Verified',
  REJECTED = 'Rejected'
}

export enum SubscriptionTier {
  TRIAL = 'Trial',
  BASIC = 'Basic',
  STANDARD = 'Standard',
  PRO = 'Pro',
  ENTERPRISE = 'Enterprise',
  CONSUMER_FREE = 'Free Trial',
  CONSUMER_MONTHLY = 'Monthly',
  CONSUMER_YEARLY = 'Yearly'
}

export enum SubscriptionStatus {
  ACTIVE = 'Active',
  EXPIRED = 'Expired',
  TRIAL = 'Trial'
}

export interface SubscriptionInfo {
  tier: SubscriptionTier;
  status: SubscriptionStatus;
  expiryDate: string;
  price: number;
}

export enum FoodCategory {
  FRUITS_VEG = 'Fruits & Vegetables',
  GRAINS_PULSES = 'Grains & Pulses',
  DRINKS_DAIRY = 'Drinks & Dairy',
  SNACKS_SWEETS = 'Snacks & Sweets',
  COFFEE_STAPLES = 'Coffee & Staples',
  OILS_SPICES = 'Oils & Spices',
  ORGANIC = 'Organic Food Products',
  PACKAGED = 'Packaged Foods',
  BEVERAGES = 'Beverages',
  INFANT_FOOD = 'Infant Food Products'
}

export enum CertAuthority {
  FSSAI = 'FSSAI',
  AGMARK = 'AGMARK',
  BIS = 'BIS',
  JAIVIK_BHARAT = 'Jaivik Bharat'
}

export enum BatchStatus {
  STORED = 'Stored',
  SOLD = 'Sold',
  IN_TRANSIT = 'In Transit',
  PROCESSED = 'Processed',
  RETAIL = 'Available at Retail'
}

export interface User {
  id: string;
  username: string;
  role: UserRole;
  name: string;
  emailOrMobile: string;
  govId?: string;
  companyName?: string;
  vehicleNo?: string;
  vehicleType?: 'Tractor' | 'Truck' | 'Refrigerated Van' | 'Bike' | 'Van' | 'Electric Cargo' | 'Cold Storage Truck';
  handlingCapability?: string[]; // e.g. ["Cold Storage", "Fragile", "Dairy Certified"]
  status?: 'Verified' | 'Rejected' | 'Under Review' | 'Pending Authorization Access';
  subscription: SubscriptionInfo;
  kycStatus: KycStatus;
  kycIdImage?: string;
  kycFaceImage?: string;
  kycSubmittedAt?: string;
  location?: { lat: number; lng: number; address: string };
  trustMetrics: TrustMetrics;
}

export interface LandDetails {
  size: string; // in acres
  soilType: string;
  waterSource: 'Rain-fed' | 'Borewell' | 'Canal';
  pollutionRisk: 'Low' | 'Medium' | 'High';
}

export interface EnvironmentalData {
  weatherHistory: string; // Summary
  rainfallSummary: string;
  tempRange: string;
}

export interface FarmerSpecificManifest {
  identity: {
    village: string;
    district: string;
    state: string;
    mobile: string;
  };
  land: LandDetails;
  seedType: 'Hybrid' | 'Organic' | 'Local';
  seedSource: string;
  sowingMonth: string;
  harvestingMonth: string;
  pesticideUsage: 'None' | 'Limited' | 'Organic' | 'Heavy';
  storageMethod: string;
  expectedShelfLife: string;
  dairy?: {
    animalType: 'Cow' | 'Buffalo';
    breed: string;
    feedType: string;
    yieldPerDay: string;
    antibiotics: 'Yes' | 'No';
    hygieneProcess: string;
  };
  environment: EnvironmentalData;
}

export interface GenesisManifest {
  batchId: string;
  farmerId: string;
  productType: FoodCategory;
  variety: string;
  harvestDate: string;
  location: { lat: number; lng: number; address: string };
  dairyDetails?: {
    animalType: 'Cow' | 'Buffalo';
    breed: string;
    feedType: string;
    milkingDate: string;
  };
  blockchainHash: string;
  timestamp: string;
  farmerManifest?: FarmerSpecificManifest;
}

export interface ProcessingManifest {
  productId: string;
  manufacturerId: string;
  inputBatchId: string;
  processingSteps: string[];
  qualityChecks: string[];
  certifications: CertAuthority[];
  blockchainHash: string;
  timestamp: string;
}

export interface LogisticsManifest {
  id: string;
  handlerId: string;
  targetId: string;
  storageType: 'Cold' | 'Dry' | 'Ambient';
  transportConditions: string;
  dispatchTime: string;
  deliveryTime?: string;
  quantityShipped: number;
  quantityReceived?: number;
  blockchainHash: string;
}

export interface AggregationManifest {
  id: string;
  collectorId: string;
  sourceBatches: string[];
  outputBatchId: string;
  aggregationType: 'Merge' | 'Split' | 'Categorize';
  blockchainHash: string;
  timestamp: string;
}

export interface DiscoverableNode {
  id: string;
  name: string;
  role: UserRole;
  distance: number;
  trustScore: number;
  categories: FoodCategory[];
  farmerManifest?: FarmerSpecificManifest;
}

export interface HarvestBatch {
  id: string;
  farmerId: string;
  farmerName: string;
  cropName: string;
  category: FoodCategory;
  harvestDate: string;
  quantity: string; 
  currentQuantity: number; 
  qualityGrade: string;
  farmingMethod: 'Organic' | 'Conventional';
  blockchainHash: string;
  status: BatchStatus;
  soilReportUrl?: string;
  pesticideReportUrl?: string;
  location: { lat: number; lng: number; address: string };
  imageUrl?: string;
  additionalImages?: string[];
  season?: 'Kharif' | 'Rabi' | 'Zaid';
  pricePerUnit?: number;
  itemType?: 'Crop' | 'DrinkDairy';
  processingType?: string;
  storageRequirement?: string;
  productionDate?: string;
  expiryDate?: string;
  genesisManifest?: GenesisManifest;
  isSeedData?: boolean;
  availabilityWindow?: { start: string; end: string };
}

export interface LabParameter {
  name: string;
  value: number;
  limit: number;
  unit: string;
  passed: boolean;
}

export interface Product {
  id: string;
  manufacturerId: string;
  name: string;
  category: FoodCategory;
  batchId: string; 
  mfgDate: string;
  expiryDate: string;
  qrCode: string;
  currentQuantity: number; 
  blockchainHash: string;
  certification: {
    authority: CertAuthority;
    matchPercentage: number;
    status: 'Certified' | 'Conditionally Approved' | 'Not Certified' | 'Flagged' | 'Re-test Triggered' | 'Verification Pending';
    parameters: LabParameter[];
    reportHash: string;
    certificateNo?: string;
    labName?: string;
    issueDate?: string;
    expiryDate?: string;
    verifiedBy?: string;
    verifiedAt?: string;
  };
  imageUrl?: string;
  pricePerUnit?: number;
  processingManifest?: ProcessingManifest;
  isSeedData?: boolean;
}

export interface InventoryLog {
  id: string;
  targetId: string; 
  prevQuantity: number;
  newQuantity: number;
  changeReason: 'add' | 'transfer' | 'sale' | 'recall' | 'expiry' | 'adjustment';
  userId: string;
  userRole: UserRole;
  timestamp: string;
  blockchainHash: string;
}

export interface SavedItem {
  saved_id: string;
  user_id: string;
  product_id: string;
  saved_at: string;
  type: 'product' | 'batch';
}

export interface BatchNote {
  batchId: string;
  note: string;
  updatedAt: string;
}

export interface SeasonalPlan {
  id: string;
  cropName: string;
  season: 'Kharif' | 'Rabi' | 'Zaid';
  expectedDate: string;
}

export interface UserPreferences {
  userId: string;
  preferredAuthorities: CertAuthority[];
  organicOnly: boolean;
}

export interface ViewedItem {
  userId: string;
  itemId: string;
  timestamp: string;
}

export interface VerificationLog {
  id: string;
  targetUserId: string;
  targetUserName: string;
  action: 'Approved' | 'Rejected' | 'Re-verify';
  remark: string;
  timestamp: string;
  authorizerId: string;
}

export interface ScanLog {
  id: string;
  userId: string;
  role: UserRole;
  scanType: 'Product' | 'KYC';
  targetId: string;
  timestamp: string;
}

export enum TransactionType {
  PURCHASE = 'Purchase',
  TRANSPORT = 'Transport Service',
  CERTIFICATION = 'Certification Fee',
  RETAIL_SALE = 'Retail Sale'
}

export interface ChainTransaction {
  id: string;
  fromId: string;
  toId: string;
  type: TransactionType;
  amount: number;
  itemId: string;
  timestamp: string;
  blockchainHash: string;
  status: 'Pending' | 'Confirmed' | 'Disputed';
}

export interface Wallet {
  balance: number;
  pendingBalance: number;
  transactionHistory: ChainTransaction[];
}

export interface Complaint {
  id: string;
  userId?: string;
  userName?: string;
  targetId: string; 
  targetName: string;
  orderId?: string; // Link to a trade order
  type: 'Counterfeit' | 'Bad Quality' | 'Incorrect Provenance' | 'Tampered QR' | 'Damage in Transit' | 'Temperature Failure' | 'Quantity Mismatch' | 'Late Delivery';
  description: string;
  proofUrl?: string;
  timestamp: string;
  status: 'Open' | 'Investigating' | 'Resolved' | 'Closed';
  faultyPartyId?: string;
  penaltyType?: 'Monetary' | 'ScoreReduction' | 'Suspension' | 'Ban';
  authorizerComment?: string;
  blockchainHash: string;
}

export interface Order {
  id: string;
  userId: string;
  items: {
    productId: string;
    productName: string;
    quantity: number;
    price: number;
  }[];
  totalAmount: number;
  timestamp: string;
  status: 'Delivered' | 'In Transit' | 'Processing';
  blockchainHash: string;
}
