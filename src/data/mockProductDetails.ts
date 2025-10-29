import { Product } from '@/contexts/CartContext';

export interface ProductDetail extends Product {
  handle: string;
  brand: string;
  sku: string;
  longDescription: string;
  images: string[];
  specifications: Array<{ label: string; value: string }>;
  fitment: Array<{ make: string; model: string; years: string }>;
  crossReference: string[];
}

export const MOCK_PRODUCT_DETAILS: Record<string, ProductDetail> = {
  'brake-pads-ceramic': {
    id: 'brake-pads-ceramic',
    handle: 'brake-pads-ceramic',
    name: 'Premium Ceramic Brake Pads',
    brand: 'AutoPro',
    sku: 'BP-CER-1001',
    price: 89.99,
    category: 'Brake Pads',
    image: 'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
    images: [
      'https://images.unsplash.com/photo-1486262715619-67b85e0b08d3?w=800',
      'https://images.unsplash.com/photo-1449130015084-2dc7c9e50a3a?w=800',
      'https://images.unsplash.com/photo-1492144534655-ae79c964c9d7?w=800',
    ],
    description: 'High-performance ceramic brake pads for superior stopping power',
    longDescription: `Our Premium Ceramic Brake Pads deliver exceptional stopping power with minimal dust and noise. Engineered with advanced ceramic compound technology, these brake pads provide consistent performance in all weather conditions. The low-metallic formula reduces brake dust by up to 90% compared to traditional semi-metallic pads, keeping your wheels cleaner longer.

Features:
• Superior heat dissipation for fade-free braking
• Ultra-quiet operation with noise-dampening shims
• Extended pad life (up to 70,000 miles)
• OEM-quality fitment and performance
• Environmentally friendly low-copper formula`,
    inStock: true,
    specifications: [
      { label: 'Material', value: 'Ceramic Composite' },
      { label: 'Operating Temperature', value: '-40°F to 750°F' },
      { label: 'Friction Rating', value: 'FF (High Performance)' },
      { label: 'Noise Level', value: 'Ultra-Quiet' },
      { label: 'Dust Level', value: 'Very Low' },
      { label: 'Warranty', value: '3 Years / 36,000 Miles' },
    ],
    fitment: [
      { make: 'Toyota', model: 'Camry', years: '2018-2024' },
      { make: 'Toyota', model: 'RAV4', years: '2019-2024' },
      { make: 'Honda', model: 'Accord', years: '2018-2023' },
      { make: 'Honda', model: 'CR-V', years: '2017-2024' },
    ],
    crossReference: ['D1234', 'BP-1001', 'CERAM-1234', 'OE-45022-TBR-A00'],
  },
  'oil-filter-synthetic': {
    id: 'oil-filter-synthetic',
    handle: 'oil-filter-synthetic',
    name: 'Synthetic Oil Filter - Extended Life',
    brand: 'FilterMax',
    sku: 'OF-SYN-2001',
    price: 24.99,
    category: 'Oil Filters',
    image: 'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800',
    images: [
      'https://images.unsplash.com/photo-1625047509168-a7026f36de04?w=800',
      'https://images.unsplash.com/photo-1605732562742-3023a888e56e?w=800',
    ],
    description: 'Premium synthetic media oil filter for extended service intervals',
    longDescription: `The FilterMax Synthetic Oil Filter is engineered for maximum engine protection with extended service intervals up to 15,000 miles. Advanced synthetic filter media captures 99% of harmful contaminants while maintaining optimal oil flow. Perfect for modern synthetic oils and turbocharged engines.

Features:
• 99% filtration efficiency for particles 20 microns and larger
• Synthetic fiber media for superior dirt-holding capacity
• Heavy-duty canister construction
• Silicone anti-drainback valve prevents dry starts
• Compatible with conventional, synthetic, and high-mileage oils`,
    inStock: true,
    specifications: [
      { label: 'Filter Media', value: 'Synthetic Fiber' },
      { label: 'Micron Rating', value: '20 microns' },
      { label: 'Efficiency', value: '99%' },
      { label: 'Service Life', value: 'Up to 15,000 miles' },
      { label: 'Thread Size', value: '3/4-16' },
      { label: 'Gasket Type', value: 'Nitrile Rubber' },
    ],
    fitment: [
      { make: 'Toyota', model: 'Camry', years: '2012-2024' },
      { make: 'Honda', model: 'Civic', years: '2016-2024' },
      { make: 'Ford', model: 'F-150', years: '2015-2024' },
      { make: 'Chevrolet', model: 'Silverado', years: '2014-2024' },
    ],
    crossReference: ['PH3593A', 'M1-110A', 'WIX-51515', 'FRAM-XG3593A'],
  },
};
