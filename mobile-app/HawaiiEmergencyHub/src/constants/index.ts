export const COLORS = {
  primary: '#3B82F6', // Blue
  secondary: '#10B981', // Green
  danger: '#EF4444', // Red
  warning: '#F59E0B', // Amber
  info: '#06B6D4', // Cyan
  success: '#10B981', // Green
  background: '#F9FAFB',
  surface: '#FFFFFF',
  text: '#111827',
  textSecondary: '#6B7280',
  border: '#E5E7EB',
};

export const SEVERITY_COLORS = {
  minor: '#FCD34D',
  moderate: '#FB923C',
  severe: '#EF4444',
  extreme: '#7F1D1D',
  high: '#DC2626',
  critical: '#991B1B',
};

export const ALERT_CATEGORIES = {
  weather: { icon: '⛈️', color: '#3B82F6' },
  ocean: { icon: '🌊', color: '#06B6D4' },
  fire: { icon: '🔥', color: '#EF4444' },
  wildfire: { icon: '🔥', color: '#EF4444' },
  earthquake: { icon: '🏚️', color: '#A78BFA' },
  tsunami: { icon: '🌊', color: '#1E40AF' },
  volcano: { icon: '🌋', color: '#DC2626' },
  hurricane: { icon: '🌀', color: '#9333EA' },
  tropical_storm: { icon: '🌀', color: '#7C3AED' },
  flood: { icon: '💧', color: '#2563EB' },
  surf: { icon: '🏄', color: '#0891B2' },
  other: { icon: '⚠️', color: '#6B7280' },
};

export const EMERGENCY_CONTACTS = [
  { 
    name: 'Emergency', 
    phone: '911', 
    icon: '🚨',
    description: 'For immediate emergency assistance'
  },
  { 
    name: 'Hawaii Emergency Management', 
    phone: '(808) 733-4300', 
    icon: '🏛️',
    description: 'State emergency management agency'
  },
  { 
    name: 'Pacific Tsunami Warning Center', 
    phone: '(808) 689-8207', 
    icon: '🌊',
    description: 'Tsunami warnings and information'
  },
  { 
    name: 'Honolulu Police', 
    phone: '(808) 529-3111', 
    icon: '👮',
    description: 'Non-emergency police assistance'
  },
  { 
    name: 'Honolulu Fire', 
    phone: '(808) 723-7139', 
    icon: '🚒',
    description: 'Non-emergency fire department'
  },
  { 
    name: 'Queens Medical Center', 
    phone: '(808) 538-9011', 
    icon: '🏥',
    description: 'Major hospital emergency room'
  },
];

export const HAWAIIAN_ISLANDS = [
  { name: 'Oahu', center: { latitude: 21.4389, longitude: -158.0001 } },
  { name: 'Maui', center: { latitude: 20.7984, longitude: -156.3319 } },
  { name: 'Big Island', center: { latitude: 19.5429, longitude: -155.6659 } },
  { name: 'Kauai', center: { latitude: 22.0964, longitude: -159.5261 } },
  { name: 'Molokai', center: { latitude: 21.1444, longitude: -157.0226 } },
  { name: 'Lanai', center: { latitude: 20.8283, longitude: -156.9200 } },
];