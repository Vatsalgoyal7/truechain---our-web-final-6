
import { FoodCategory, CertAuthority } from './types';

export const ALLOWED_FOOD_CATEGORIES = Object.values(FoodCategory);
export const CERT_AUTHORITIES = Object.values(CertAuthority);

export const APP_NAME = "TrueChain";
export const APP_THEME_COLOR = "emerald";

export const MOCK_LAB_LIMITS: Record<string, { limit: number; unit: string }> = {
  'Pesticide Residue': { limit: 0.01, unit: 'mg/kg' },
  'Lead Content': { limit: 2.5, unit: 'ppm' },
  'Aflatoxin': { limit: 10, unit: 'ppb' },
  'Coliform Count': { limit: 10, unit: 'cfu/g' },
  'Moisture': { limit: 12, unit: '%' }
};

export const CATEGORY_IMAGES: Record<string, string> = {
  [FoodCategory.DRINKS_DAIRY]: 'https://images.unsplash.com/photo-1550583724-1255818c0533?auto=format&fit=crop&q=80&w=800',
  [FoodCategory.FRUITS_VEG]: 'https://images.unsplash.com/photo-1592924357228-91a4daadcfea?auto=format&fit=crop&q=80&w=800',
  [FoodCategory.GRAINS_PULSES]: 'https://images.unsplash.com/photo-1586201375761-83865001e31c?auto=format&fit=crop&q=80&w=800',
  [FoodCategory.SNACKS_SWEETS]: 'https://images.unsplash.com/photo-1511381939415-e44015466834?auto=format&fit=crop&q=80&w=800',
  [FoodCategory.OILS_SPICES]: 'https://images.unsplash.com/photo-1587049352846-4a222e784d38?auto=format&fit=crop&q=80&w=800',
  [FoodCategory.ORGANIC]: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  [FoodCategory.PACKAGED]: 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&q=80&w=800',
  [FoodCategory.BEVERAGES]: 'https://images.unsplash.com/photo-1613478223719-2ab802602423?auto=format&fit=crop&q=80&w=800',
  'FruitSpecific': 'https://images.unsplash.com/photo-1560806887-1e4cd0b6cbd6?auto=format&fit=crop&q=80&w=800',
  'VegSpecific': 'https://images.unsplash.com/photo-1576045057995-568f588f82fb?auto=format&fit=crop&q=80&w=800',
  'PulseSpecific': 'https://images.unsplash.com/photo-1515942400420-2b98fed1f515?auto=format&fit=crop&q=80&w=800',
};
