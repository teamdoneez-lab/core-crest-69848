// Mock vehicle data for fitment filter
export interface VehicleYear {
  id: string;
  year: number;
}

export interface VehicleMake {
  id: string;
  name: string;
}

export interface VehicleModel {
  id: string;
  name: string;
}

export interface VehicleEngine {
  id: string;
  name: string;
}

export interface Vehicle {
  id: string;
  year: number;
  make: string;
  model: string;
  engine?: string;
}

export const MOCK_YEARS: VehicleYear[] = [
  { id: '2024', year: 2024 },
  { id: '2023', year: 2023 },
  { id: '2022', year: 2022 },
  { id: '2021', year: 2021 },
  { id: '2020', year: 2020 },
  { id: '2019', year: 2019 },
  { id: '2018', year: 2018 },
  { id: '2017', year: 2017 },
  { id: '2016', year: 2016 },
  { id: '2015', year: 2015 },
];

export const MOCK_MAKES: Record<string, VehicleMake[]> = {
  '2024': [
    { id: 'toyota', name: 'Toyota' },
    { id: 'honda', name: 'Honda' },
    { id: 'ford', name: 'Ford' },
    { id: 'chevrolet', name: 'Chevrolet' },
  ],
  '2023': [
    { id: 'toyota', name: 'Toyota' },
    { id: 'honda', name: 'Honda' },
    { id: 'ford', name: 'Ford' },
    { id: 'chevrolet', name: 'Chevrolet' },
  ],
  // Add more years as needed
};

export const MOCK_MODELS: Record<string, VehicleModel[]> = {
  'toyota': [
    { id: 'camry', name: 'Camry' },
    { id: 'corolla', name: 'Corolla' },
    { id: 'rav4', name: 'RAV4' },
    { id: 'tacoma', name: 'Tacoma' },
  ],
  'honda': [
    { id: 'civic', name: 'Civic' },
    { id: 'accord', name: 'Accord' },
    { id: 'crv', name: 'CR-V' },
    { id: 'pilot', name: 'Pilot' },
  ],
  'ford': [
    { id: 'f150', name: 'F-150' },
    { id: 'mustang', name: 'Mustang' },
    { id: 'explorer', name: 'Explorer' },
    { id: 'escape', name: 'Escape' },
  ],
  'chevrolet': [
    { id: 'silverado', name: 'Silverado' },
    { id: 'malibu', name: 'Malibu' },
    { id: 'equinox', name: 'Equinox' },
    { id: 'tahoe', name: 'Tahoe' },
  ],
};

export const MOCK_ENGINES: Record<string, VehicleEngine[]> = {
  'camry': [
    { id: '2.5l-4cyl', name: '2.5L 4-Cylinder' },
    { id: '3.5l-v6', name: '3.5L V6' },
  ],
  'f150': [
    { id: '3.3l-v6', name: '3.3L V6' },
    { id: '2.7l-ecoboost', name: '2.7L EcoBoost V6' },
    { id: '5.0l-v8', name: '5.0L V8' },
  ],
  // Add more as needed
};
