
import { FoodCategory, CertAuthority, BatchStatus, HarvestBatch, Product } from './types';
import { CATEGORY_IMAGES } from './constants';

const MOCK_MFR_ID = "mfr-root-001";
const MOCK_FARMER_ID = "farmer-root-001";

const genParams = (match: number) => [
  { name: 'Pesticide Residue', value: match > 90 ? 0.002 : 0.015, limit: 0.01, unit: 'mg/kg', passed: match > 90 },
  { name: 'Lead Content', value: match > 80 ? 0.5 : 3.0, limit: 2.5, unit: 'ppm', passed: match > 80 },
  { name: 'Moisture', value: 10, limit: 12, unit: '%', passed: true },
  { name: 'Microbial Load', value: match > 95 ? 120 : 800, limit: 1000, unit: 'cfu/g', passed: true }
];

export const SEED_BATCHES: HarvestBatch[] = [
  // FRUITS & VEG BATCHES
  { 
    id: "B-FV-01", farmerId: MOCK_FARMER_ID, farmerName: "Heirloom Orchards", cropName: "Organic Fuji Apples", category: FoodCategory.FRUITS_VEG, harvestDate: "2025-01-15", quantity: "500", currentQuantity: 500, qualityGrade: "A+", farmingMethod: "Organic", blockchainHash: "H-FV-01-HASH", status: BatchStatus.STORED, location: { lat: 34.05, lng: -118.24, address: "Northern Valley, Plot 42" }, imageUrl: CATEGORY_IMAGES['FruitSpecific'], isSeedData: true 
  },
  { 
    id: "B-FV-02", farmerId: MOCK_FARMER_ID, farmerName: "Green Leaf Farms", cropName: "Baby Spinach Bunches", category: FoodCategory.FRUITS_VEG, harvestDate: "2025-02-01", quantity: "200", currentQuantity: 200, qualityGrade: "A", farmingMethod: "Organic", blockchainHash: "H-FV-02-HASH", status: BatchStatus.STORED, location: { lat: 34.10, lng: -118.30, address: "Green Acres, Lot 12" }, imageUrl: CATEGORY_IMAGES['VegSpecific'], isSeedData: true 
  },
  { 
    id: "B-FV-03", farmerId: MOCK_FARMER_ID, farmerName: "Sunny Valley", cropName: "Vine-Ripened Tomatoes", category: FoodCategory.FRUITS_VEG, harvestDate: "2025-02-10", quantity: "1000", currentQuantity: 1000, qualityGrade: "A", farmingMethod: "Conventional", blockchainHash: "H-FV-03-HASH", status: BatchStatus.STORED, location: { lat: 34.15, lng: -118.35, address: "Sunshine Fields, Plot 5" }, imageUrl: CATEGORY_IMAGES[FoodCategory.FRUITS_VEG], isSeedData: true 
  },
  
  // DAIRY BATCHES
  { 
    id: "B-DD-01", farmerId: MOCK_FARMER_ID, farmerName: "Meadow Fresh", cropName: "Fresh Whole Milk", category: FoodCategory.DRINKS_DAIRY, harvestDate: "2025-02-18", quantity: "1000", currentQuantity: 1000, qualityGrade: "A+", farmingMethod: "Organic", blockchainHash: "H-DD-01-HASH", status: BatchStatus.STORED, location: { lat: 45.42, lng: -75.69, address: "Green Meadows, Lane 2" }, imageUrl: CATEGORY_IMAGES[FoodCategory.DRINKS_DAIRY], isSeedData: true 
  },
  { 
    id: "B-DD-02", farmerId: MOCK_FARMER_ID, farmerName: "Highland Dairy", cropName: "Cultured Milk Base", category: FoodCategory.DRINKS_DAIRY, harvestDate: "2025-02-14", quantity: "800", currentQuantity: 800, qualityGrade: "A", farmingMethod: "Conventional", blockchainHash: "H-DD-02-HASH", status: BatchStatus.STORED, location: { lat: 31.10, lng: 77.17, address: "Highland Pastures, Section C" }, imageUrl: CATEGORY_IMAGES[FoodCategory.DRINKS_DAIRY], isSeedData: true 
  },
  
  // GRAINS BATCHES
  { 
    id: "B-GP-01", farmerId: MOCK_FARMER_ID, farmerName: "Indus Valley", cropName: "Premium Basmati Rice", category: FoodCategory.GRAINS_PULSES, harvestDate: "2024-11-20", quantity: "5000", currentQuantity: 5000, qualityGrade: "A+", farmingMethod: "Conventional", blockchainHash: "H-GP-01-HASH", status: BatchStatus.STORED, location: { lat: 28.61, lng: 77.20, address: "Basmati Belt, Sector 9" }, imageUrl: CATEGORY_IMAGES[FoodCategory.GRAINS_PULSES], isSeedData: true 
  },
  { 
    id: "B-GP-02", farmerId: MOCK_FARMER_ID, farmerName: "Global Pulse Farms", cropName: "Red Lentil Crop", category: FoodCategory.GRAINS_PULSES, harvestDate: "2024-12-05", quantity: "2500", currentQuantity: 2500, qualityGrade: "A", farmingMethod: "Organic", blockchainHash: "H-GP-02-HASH", status: BatchStatus.STORED, location: { lat: 26.84, lng: 80.94, address: "Pulse Valley, Yard 11" }, imageUrl: CATEGORY_IMAGES['PulseSpecific'], isSeedData: true 
  },

  // OILS & SPICES BATCHES
  { 
    id: "B-OS-01", farmerId: MOCK_FARMER_ID, farmerName: "Forest Wilds", cropName: "Raw Wild Honey", category: FoodCategory.OILS_SPICES, harvestDate: "2025-02-01", quantity: "300", currentQuantity: 300, qualityGrade: "A+", farmingMethod: "Organic", blockchainHash: "H-OS-01-HASH", status: BatchStatus.STORED, location: { lat: 22.57, lng: 88.36, address: "Deep Forest Apiary" }, imageUrl: CATEGORY_IMAGES[FoodCategory.OILS_SPICES], isSeedData: true 
  },
];

export const SEED_PRODUCTS: Product[] = [
  // 1. FRUITS & VEGETABLES
  {
    id: "P-FV-01", manufacturerId: MOCK_MFR_ID, name: "Organic Fuji Apples", category: FoodCategory.FRUITS_VEG, batchId: "B-FV-01", mfgDate: "2025-01-20", expiryDate: "2025-03-20", qrCode: "qr-p-fv-01", currentQuantity: 100, blockchainHash: "HASH-P-FV-01", pricePerUnit: 120,
    certification: { authority: CertAuthority.FSSAI, matchPercentage: 98, status: "Certified", parameters: genParams(98), reportHash: "REP-FV-01" }, imageUrl: CATEGORY_IMAGES['FruitSpecific'], isSeedData: true
  },
  {
    id: "P-FV-02", manufacturerId: MOCK_MFR_ID, name: "Baby Spinach Bunches", category: FoodCategory.FRUITS_VEG, batchId: "B-FV-02", mfgDate: "2025-02-03", expiryDate: "2025-02-15", qrCode: "qr-p-fv-02", currentQuantity: 50, blockchainHash: "HASH-P-FV-02", pricePerUnit: 45,
    certification: { authority: CertAuthority.AGMARK, matchPercentage: 95, status: "Certified", parameters: genParams(95), reportHash: "REP-FV-02" }, imageUrl: CATEGORY_IMAGES['VegSpecific'], isSeedData: true
  },
  {
    id: "P-FV-03", manufacturerId: MOCK_MFR_ID, name: "Vine-Ripened Tomatoes", category: FoodCategory.FRUITS_VEG, batchId: "B-FV-03", mfgDate: "2025-02-11", expiryDate: "2025-02-28", qrCode: "qr-p-fv-03", currentQuantity: 200, blockchainHash: "HASH-P-FV-03", pricePerUnit: 80,
    certification: { authority: CertAuthority.FSSAI, matchPercentage: 92, status: "Certified", parameters: genParams(92), reportHash: "REP-FV-03" }, imageUrl: CATEGORY_IMAGES[FoodCategory.FRUITS_VEG], isSeedData: true
  },

  // 2. GRAINS & PULSES
  {
    id: "P-GP-01", manufacturerId: MOCK_MFR_ID, name: "Premium Basmati Rice", category: FoodCategory.GRAINS_PULSES, batchId: "B-GP-01", mfgDate: "2024-11-25", expiryDate: "2026-11-25", qrCode: "qr-p-gp-01", currentQuantity: 1000, blockchainHash: "HASH-P-GP-01", pricePerUnit: 180,
    certification: { authority: CertAuthority.AGMARK, matchPercentage: 100, status: "Certified", parameters: genParams(100), reportHash: "REP-GP-01" }, imageUrl: CATEGORY_IMAGES[FoodCategory.GRAINS_PULSES], isSeedData: true
  },
  {
    id: "P-GP-02", manufacturerId: MOCK_MFR_ID, name: "Red Split Lentils", category: FoodCategory.GRAINS_PULSES, batchId: "B-GP-02", mfgDate: "2024-12-10", expiryDate: "2025-12-10", qrCode: "qr-p-gp-02", currentQuantity: 300, blockchainHash: "HASH-P-GP-02", pricePerUnit: 90,
    certification: { authority: CertAuthority.FSSAI, matchPercentage: 94, status: "Certified", parameters: genParams(94), reportHash: "REP-GP-02" }, imageUrl: CATEGORY_IMAGES['PulseSpecific'], isSeedData: true
  },

  // 3. DRINKS & DAIRY
  {
    id: "P-DD-01", manufacturerId: MOCK_MFR_ID, name: "Fresh Whole Milk", category: FoodCategory.DRINKS_DAIRY, batchId: "B-DD-01", mfgDate: "2025-02-19", expiryDate: "2025-02-24", qrCode: "qr-p-dd-01", currentQuantity: 200, blockchainHash: "HASH-P-DD-01", pricePerUnit: 65,
    certification: { authority: CertAuthority.FSSAI, matchPercentage: 99, status: "Certified", parameters: genParams(99), reportHash: "REP-DD-01" }, imageUrl: CATEGORY_IMAGES[FoodCategory.DRINKS_DAIRY], isSeedData: true
  },
  {
    id: "P-DD-02", manufacturerId: MOCK_MFR_ID, name: "Greek Style Yogurt", category: FoodCategory.DRINKS_DAIRY, batchId: "B-DD-02", mfgDate: "2025-02-16", expiryDate: "2025-03-05", qrCode: "qr-p-dd-02", currentQuantity: 150, blockchainHash: "HASH-P-DD-02", pricePerUnit: 120,
    certification: { authority: CertAuthority.BIS, matchPercentage: 96, status: "Certified", parameters: genParams(96), reportHash: "REP-DD-02" }, imageUrl: 'https://images.unsplash.com/photo-1488477181946-6428a0291777?auto=format&fit=crop&q=80&w=600', isSeedData: true
  },

  // 4. SNACKS & SWEETS
  {
    id: "P-SS-01", manufacturerId: MOCK_MFR_ID, name: "Dark Chocolate 70%", category: FoodCategory.SNACKS_SWEETS, batchId: "B-FV-01", mfgDate: "2025-01-25", expiryDate: "2026-01-25", qrCode: "qr-p-ss-01", currentQuantity: 500, blockchainHash: "HASH-P-SS-01", pricePerUnit: 299,
    certification: { authority: CertAuthority.FSSAI, matchPercentage: 97, status: "Certified", parameters: genParams(97), reportHash: "REP-SS-01" }, imageUrl: CATEGORY_IMAGES[FoodCategory.SNACKS_SWEETS], isSeedData: true
  },

  // 5. OILS & SPICES
  {
    id: "P-OS-01", manufacturerId: MOCK_MFR_ID, name: "Organic Forest Honey", category: FoodCategory.OILS_SPICES, batchId: "B-OS-01", mfgDate: "2025-02-05", expiryDate: "2027-02-05", qrCode: "qr-p-os-01", currentQuantity: 120, blockchainHash: "HASH-P-OS-01", pricePerUnit: 550,
    certification: { authority: CertAuthority.AGMARK, matchPercentage: 100, status: "Certified", parameters: genParams(100), reportHash: "REP-OS-01" }, imageUrl: CATEGORY_IMAGES[FoodCategory.OILS_SPICES], isSeedData: true
  },

  // 6. BEVERAGES
  {
    id: "P-BV-01", manufacturerId: MOCK_MFR_ID, name: "Pure Orange Juice", category: FoodCategory.BEVERAGES, batchId: "B-FV-03", mfgDate: "2025-02-12", expiryDate: "2025-02-20", qrCode: "qr-p-bv-01", currentQuantity: 300, blockchainHash: "HASH-P-BV-01", pricePerUnit: 150,
    certification: { authority: CertAuthority.FSSAI, matchPercentage: 98, status: "Certified", parameters: genParams(98), reportHash: "REP-BV-01" }, imageUrl: CATEGORY_IMAGES[FoodCategory.BEVERAGES], isSeedData: true
  }
];
