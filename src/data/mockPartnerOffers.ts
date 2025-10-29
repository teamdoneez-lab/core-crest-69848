export interface PartnerOffer {
  id: string;
  logo: string;
  name: string;
  title: string;
  description: string;
  tags: string[];
  badge?: string;
  category: 'featured' | 'software' | 'business' | 'perks';
  ctaText: string;
  ctaLink: string;
}

export const MOCK_PARTNER_OFFERS: PartnerOffer[] = [
  // Featured Offers
  {
    id: '1',
    logo: '🚗',
    name: 'AutoLeap',
    title: '20% Off Shop Management Software',
    description: 'Modern shop management software with workflow automation and customer messaging tools.',
    tags: ['Management', 'CRM'],
    badge: 'Pro Member Perk',
    category: 'featured',
    ctaText: 'Get Offer',
    ctaLink: '#'
  },
  {
    id: '2',
    logo: '📅',
    name: 'Shopmonkey',
    title: '3 Months Free Trial',
    description: 'All-in-one shop management platform with scheduling, invoicing, and inventory management.',
    tags: ['Management', 'Scheduling'],
    badge: 'Exclusive Offer',
    category: 'featured',
    ctaText: 'Get Deal',
    ctaLink: '#'
  },
  {
    id: '3',
    logo: '💳',
    name: 'QuickBooks',
    title: '50% Off for 3 Months',
    description: 'Professional accounting software designed for small businesses and service professionals.',
    tags: ['Accounting', 'Finance'],
    badge: 'Pro Member Perk',
    category: 'featured',
    ctaText: 'View Offer',
    ctaLink: '#'
  },
  {
    id: '4',
    logo: '📊',
    name: 'Tekmetric',
    title: 'Free Setup + Training',
    description: 'Cloud-based shop management system with powerful reporting and customer communication.',
    tags: ['Management', 'Analytics'],
    badge: 'Exclusive Offer',
    category: 'featured',
    ctaText: 'Get Offer',
    ctaLink: '#'
  },

  // Software Tools
  {
    id: '5',
    logo: '🔧',
    name: 'Workshop Software',
    title: 'Premium Plan Discount',
    description: 'Complete workshop management solution with job cards, invoicing, and customer database.',
    tags: ['Management', 'Invoicing'],
    category: 'software',
    ctaText: 'Visit Partner',
    ctaLink: '#'
  },
  {
    id: '6',
    logo: '📱',
    name: 'ServiceM8',
    title: '30-Day Free Trial',
    description: 'Job management software with real-time GPS tracking and mobile-first design.',
    tags: ['Management', 'Mobile'],
    category: 'software',
    ctaText: 'Visit Partner',
    ctaLink: '#'
  },
  {
    id: '7',
    logo: '💬',
    name: 'Podium',
    title: 'Special Pro Pricing',
    description: 'Customer messaging platform with text marketing, reviews, and payment collection.',
    tags: ['Communication', 'Marketing'],
    category: 'software',
    ctaText: 'Visit Partner',
    ctaLink: '#'
  },
  {
    id: '8',
    logo: '📧',
    name: 'Mailchimp',
    title: 'Free Plan + Pro Features',
    description: 'Email marketing platform to engage customers with newsletters and automated campaigns.',
    tags: ['Marketing', 'Communication'],
    category: 'software',
    ctaText: 'Visit Partner',
    ctaLink: '#'
  },

  // Business Services
  {
    id: '9',
    logo: '💰',
    name: 'Fundbox',
    title: 'Fast Business Credit Lines',
    description: 'Access flexible credit lines up to $150K with transparent terms and fast approval.',
    tags: ['Financing', 'Credit'],
    category: 'business',
    ctaText: 'Learn More',
    ctaLink: '#'
  },
  {
    id: '10',
    logo: '🛡️',
    name: 'NEXT Insurance',
    title: 'Pro Member Discount',
    description: 'Affordable business insurance tailored for auto repair professionals.',
    tags: ['Insurance', 'Protection'],
    category: 'business',
    ctaText: 'Learn More',
    ctaLink: '#'
  },
  {
    id: '11',
    logo: '📈',
    name: 'Broadly',
    title: 'Grow Your Online Presence',
    description: 'Reputation management and local SEO services to attract more customers.',
    tags: ['Marketing', 'SEO'],
    category: 'business',
    ctaText: 'Learn More',
    ctaLink: '#'
  },
  {
    id: '12',
    logo: '🎓',
    name: 'ASE Training',
    title: 'Certification Discounts',
    description: 'Professional certifications and training programs for automotive technicians.',
    tags: ['Training', 'Certification'],
    category: 'business',
    ctaText: 'Learn More',
    ctaLink: '#'
  },

  // Pro Member Perks
  {
    id: '13',
    logo: '⚡',
    name: 'NAPA AutoCare',
    title: 'Preferred Partner Benefits',
    description: 'Join the NAPA AutoCare network for marketing support and warranty programs.',
    tags: ['Network', 'Benefits'],
    badge: 'Limited Time',
    category: 'perks',
    ctaText: 'Claim Offer',
    ctaLink: '#'
  },
  {
    id: '14',
    logo: '🎯',
    name: 'Google Ads',
    title: '$500 Ad Credit',
    description: 'Get started with Google Ads and reach customers searching for auto repair services.',
    tags: ['Advertising', 'Marketing'],
    badge: 'Limited Time',
    category: 'perks',
    ctaText: 'Claim Offer',
    ctaLink: '#'
  },
  {
    id: '15',
    logo: '🌟',
    name: 'Yelp for Business',
    title: 'Premium Listing Discount',
    description: 'Stand out on Yelp with enhanced profile features and customer insights.',
    tags: ['Marketing', 'Reviews'],
    badge: 'Limited Time',
    category: 'perks',
    ctaText: 'Claim Offer',
    ctaLink: '#'
  }
];
