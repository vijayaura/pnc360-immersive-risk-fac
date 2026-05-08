// Location hierarchy data for Country -> Region -> Zone

export interface Country {
  id: number;
  value: string;
  label: string;
  active: boolean;
}

export interface Region {
  id: number;
  value: string;
  label: string;
  countryId: number;
  active: boolean;
}

export interface Zone {
  id: number;
  value: string;
  label: string;
  regionId: number;
  active: boolean;
}

export const countries: Country[] = [
  { id: 1, value: "uae", label: "United Arab Emirates", active: true },
  { id: 2, value: "saudi", label: "Saudi Arabia", active: true },
  { id: 3, value: "qatar", label: "Qatar", active: true },
  { id: 4, value: "kuwait", label: "Kuwait", active: true },
  { id: 5, value: "bahrain", label: "Bahrain", active: true },
  { id: 6, value: "oman", label: "Oman", active: true },
];

export const regions: Region[] = [
  // UAE Regions
  { id: 1, value: "dubai", label: "Dubai", countryId: 1, active: true },
  { id: 2, value: "abu-dhabi", label: "Abu Dhabi", countryId: 1, active: true },
  { id: 3, value: "sharjah", label: "Sharjah", countryId: 1, active: true },
  { id: 4, value: "ajman", label: "Ajman", countryId: 1, active: true },
  { id: 5, value: "fujairah", label: "Fujairah", countryId: 1, active: true },
  { id: 6, value: "ras-al-khaimah", label: "Ras Al Khaimah", countryId: 1, active: true },
  { id: 7, value: "umm-al-quwain", label: "Umm Al Quwain", countryId: 1, active: true },
  
  // Saudi Arabia Regions
  { id: 8, value: "riyadh", label: "Riyadh", countryId: 2, active: true },
  { id: 9, value: "jeddah", label: "Jeddah", countryId: 2, active: true },
  { id: 10, value: "dammam", label: "Dammam", countryId: 2, active: true },
  { id: 11, value: "mecca", label: "Mecca", countryId: 2, active: true },
  
  // Qatar Regions
  { id: 12, value: "doha", label: "Doha", countryId: 3, active: true },
  { id: 13, value: "al-rayyan", label: "Al Rayyan", countryId: 3, active: true },
  
  // Kuwait Regions
  { id: 14, value: "kuwait-city", label: "Kuwait City", countryId: 4, active: true },
  { id: 15, value: "hawalli", label: "Hawalli", countryId: 4, active: true },
  
  // Bahrain Regions
  { id: 16, value: "manama", label: "Manama", countryId: 5, active: true },
  { id: 17, value: "muharraq", label: "Muharraq", countryId: 5, active: true },
  
  // Oman Regions
  { id: 18, value: "muscat", label: "Muscat", countryId: 6, active: true },
  { id: 19, value: "salalah", label: "Salalah", countryId: 6, active: true },
];

export const zones: Zone[] = [
  // Dubai Zones
  { id: 1, value: "dubai-marina", label: "Dubai Marina", regionId: 1, active: true },
  { id: 2, value: "downtown", label: "Downtown Dubai", regionId: 1, active: true },
  { id: 3, value: "business-bay", label: "Business Bay", regionId: 1, active: true },
  { id: 4, value: "jumeirah", label: "Jumeirah", regionId: 1, active: true },
  { id: 5, value: "deira", label: "Deira", regionId: 1, active: true },
  
  // Abu Dhabi Zones
  { id: 6, value: "abu-dhabi-city", label: "Abu Dhabi City", regionId: 2, active: true },
  { id: 7, value: "yas-island", label: "Yas Island", regionId: 2, active: true },
  { id: 8, value: "saadiyat", label: "Saadiyat Island", regionId: 2, active: true },
  { id: 9, value: "al-reem", label: "Al Reem Island", regionId: 2, active: true },
  
  // Sharjah Zones
  { id: 10, value: "sharjah-city", label: "Sharjah City", regionId: 3, active: true },
  { id: 11, value: "al-nahda", label: "Al Nahda", regionId: 3, active: true },
  
  // Ajman Zones
  { id: 12, value: "ajman-city", label: "Ajman City", regionId: 4, active: true },
  { id: 13, value: "al-nuaimiya", label: "Al Nuaimiya", regionId: 4, active: true },
  
  // Riyadh Zones
  { id: 14, value: "riyadh-center", label: "Riyadh Center", regionId: 8, active: true },
  { id: 15, value: "king-fahd", label: "King Fahd District", regionId: 8, active: true },
  { id: 16, value: "olaya", label: "Olaya", regionId: 8, active: true },
  
  // Jeddah Zones
  { id: 17, value: "jeddah-center", label: "Jeddah Center", regionId: 9, active: true },
  { id: 18, value: "corniche", label: "Corniche", regionId: 9, active: true },
  
  // Doha Zones
  { id: 19, value: "west-bay", label: "West Bay", regionId: 12, active: true },
  { id: 20, value: "pearl-qatar", label: "The Pearl Qatar", regionId: 12, active: true },
  { id: 21, value: "lusail", label: "Lusail", regionId: 12, active: true },
  
  // Kuwait City Zones
  { id: 22, value: "kuwait-center", label: "Kuwait Center", regionId: 14, active: true },
  { id: 23, value: "salmiya", label: "Salmiya", regionId: 14, active: true },
  
  // Manama Zones
  { id: 24, value: "manama-center", label: "Manama Center", regionId: 16, active: true },
  { id: 25, value: "seef", label: "Seef", regionId: 16, active: true },
  
  // Muscat Zones
  { id: 26, value: "muscat-center", label: "Muscat Center", regionId: 18, active: true },
  { id: 27, value: "qurum", label: "Qurum", regionId: 18, active: true },
];

// Utility functions
export const getActiveCountries = (): Country[] => {
  return countries.filter(country => country.active);
};

export const getRegionsByCountry = (countryId: number): Region[] => {
  return regions.filter(region => region.countryId === countryId && region.active);
};

export const getZonesByRegion = (regionId: number): Zone[] => {
  return zones.filter(zone => zone.regionId === regionId && zone.active);
};

export const getCountryByValue = (value: string): Country | undefined => {
  return countries.find(country => country.value === value);
};

export const getRegionByValue = (value: string): Region | undefined => {
  return regions.find(region => region.value === value);
};

export const getZoneByValue = (value: string): Zone | undefined => {
  return zones.find(zone => zone.value === value);
};