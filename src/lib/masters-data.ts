// Shared masters data for the application
export const documentTypes = [
  { id: 1, value: "boq", label: "BOQ or Cost Breakdown", description: "Bill of quantities or detailed cost breakdown", required: true, active: true, order: 1 },
  { id: 2, value: "gantt", label: "Project Gantt Chart", description: "Detailed project timeline and milestones", required: true, active: true, order: 2 },
  { id: 3, value: "contract", label: "Contract Agreement", description: "Main construction contract and project specifications", required: true, active: true, order: 3 },
  { id: 4, value: "site-layout", label: "Site Layout Plan", description: "Architectural drawings and site layout plans", required: true, active: true, order: 4 },
  { id: 5, value: "supporting-docs", label: "Any Other Supporting Docs", description: "Additional supporting documents (optional)", required: false, active: true, order: 5 },
];

// Sub-project types data structure
export const subProjectTypes = [
  // Residential sub-types
  { id: 1, value: "housing-projects", label: "Housing Projects", projectTypeId: 1, active: true, order: 1 },
  { id: 2, value: "apartments", label: "Apartments", projectTypeId: 1, active: true, order: 2 },
  { id: 3, value: "villas", label: "Villas", projectTypeId: 1, active: true, order: 3 },
  
  // Commercial sub-types
  { id: 4, value: "office-buildings", label: "Office Buildings", projectTypeId: 2, active: true, order: 1 },
  { id: 5, value: "retail-spaces", label: "Retail Spaces", projectTypeId: 2, active: true, order: 2 },
  { id: 6, value: "hotels", label: "Hotels", projectTypeId: 2, active: true, order: 3 },
  
  // Industrial sub-types
  { id: 7, value: "factories", label: "Factories", projectTypeId: 3, active: true, order: 1 },
  { id: 8, value: "warehouses", label: "Warehouses", projectTypeId: 3, active: true, order: 2 },
  { id: 9, value: "manufacturing-facilities", label: "Manufacturing Facilities", projectTypeId: 3, active: true, order: 3 },
  
  // Infrastructure sub-types
  { id: 10, value: "roads", label: "Roads", projectTypeId: 4, active: true, order: 1 },
  { id: 11, value: "bridges", label: "Bridges", projectTypeId: 4, active: true, order: 2 },
  { id: 12, value: "utilities", label: "Utilities", projectTypeId: 4, active: true, order: 3 },
  { id: 13, value: "public-works", label: "Public Works", projectTypeId: 4, active: true, order: 4 },
  
  // Mixed-Use sub-types
  { id: 14, value: "residential-commercial", label: "Residential Commercial", projectTypeId: 5, active: true, order: 1 },
  { id: 15, value: "mixed-towers", label: "Mixed Towers", projectTypeId: 5, active: true, order: 2 },
  
  // Healthcare sub-types
  { id: 16, value: "hospitals", label: "Hospitals", projectTypeId: 6, active: true, order: 1 },
  { id: 17, value: "clinics", label: "Clinics", projectTypeId: 6, active: true, order: 2 },
  { id: 18, value: "medical-facilities", label: "Medical Facilities", projectTypeId: 6, active: true, order: 3 },
  
  // Educational sub-types
  { id: 19, value: "schools", label: "Schools", projectTypeId: 7, active: true, order: 1 },
  { id: 20, value: "universities", label: "Universities", projectTypeId: 7, active: true, order: 2 },
  { id: 21, value: "training-centers", label: "Training Centers", projectTypeId: 7, active: true, order: 3 },
  
  // Hospitality sub-types
  { id: 22, value: "hotels-hospitality", label: "Hotels", projectTypeId: 8, active: true, order: 1 },
  { id: 23, value: "resorts", label: "Resorts", projectTypeId: 8, active: true, order: 2 },
  { id: 24, value: "restaurants", label: "Restaurants", projectTypeId: 8, active: true, order: 3 },
  
  // Sports & Recreation sub-types
  { id: 25, value: "stadiums", label: "Stadiums", projectTypeId: 9, active: true, order: 1 },
  { id: 26, value: "gyms", label: "Gyms", projectTypeId: 9, active: true, order: 2 },
  { id: 27, value: "entertainment-venues", label: "Entertainment Venues", projectTypeId: 9, active: true, order: 3 },
  
  // Others sub-types
  { id: 28, value: "specialized-projects", label: "Specialized Projects", projectTypeId: 10, active: true, order: 1 },
  { id: 29, value: "unique-projects", label: "Unique Projects", projectTypeId: 10, active: true, order: 2 }
];

export const projectTypes = [
  { id: 1, value: "residential", label: "Residential", active: true, baseRate: 0.15, riskMultiplier: 1.0, order: 1 },
  { id: 2, value: "commercial", label: "Commercial", active: true, baseRate: 0.25, riskMultiplier: 1.2, order: 2 },
  { id: 3, value: "industrial", label: "Industrial", active: true, baseRate: 0.30, riskMultiplier: 1.3, order: 3 },
  { id: 4, value: "infrastructure", label: "Infrastructure", active: true, baseRate: 0.35, riskMultiplier: 1.5, order: 4 },
  { id: 5, value: "mixed-use", label: "Mixed-Use", active: true, baseRate: 0.28, riskMultiplier: 1.25, order: 5 },
  { id: 6, value: "healthcare", label: "Healthcare", active: true, baseRate: 0.32, riskMultiplier: 1.4, order: 6 },
  { id: 7, value: "educational", label: "Educational", active: true, baseRate: 0.22, riskMultiplier: 1.1, order: 7 },
  { id: 8, value: "hospitality", label: "Hospitality", active: true, baseRate: 0.27, riskMultiplier: 1.2, order: 8 },
  { id: 9, value: "sports-recreation", label: "Sports & Recreation", active: true, baseRate: 0.29, riskMultiplier: 1.3, order: 9 },
  { id: 10, value: "others", label: "Others", active: true, baseRate: 0.25, riskMultiplier: 1.2, order: 10 }
];

export const constructionTypes = [
  { id: 1, value: "concrete", label: "Concrete", description: "Reinforced concrete construction", active: true, riskFactor: 1.0, order: 1 },
  { id: 2, value: "steel", label: "Steel", description: "Steel frame construction", active: true, riskFactor: 1.1, order: 2 },
  { id: 3, value: "pre-fab", label: "Pre-fabricated", description: "Pre-fabricated modular construction", active: true, riskFactor: 0.9, order: 3 },
  { id: 4, value: "wood", label: "Wood", description: "Timber frame construction", active: true, riskFactor: 1.2, order: 4 },
  { id: 5, value: "mixed", label: "Mixed", description: "Combination of construction types", active: true, riskFactor: 1.15, order: 5 },
  { id: 6, value: "masonry", label: "Masonry", description: "Brick or stone construction", active: true, riskFactor: 1.05, order: 6 }
];

export const getActiveDocumentTypes = () => {
  return documentTypes.filter(doc => doc.active).sort((a, b) => a.order - b.order);
};

export const getActiveProjectTypes = () => {
  return projectTypes.filter(type => type.active).sort((a, b) => a.order - b.order);
};

export const getActiveConstructionTypes = () => {
  return constructionTypes.filter(type => type.active).sort((a, b) => a.order - b.order);
};

export const getActiveSubProjectTypes = () => {
  return subProjectTypes.filter(type => type.active).sort((a, b) => a.order - b.order);
};

export const getSubProjectTypesByProjectType = (projectTypeId: number) => {
  return subProjectTypes
    .filter(subType => subType.projectTypeId === projectTypeId && subType.active)
    .sort((a, b) => a.order - b.order);
};

export const getProjectTypeByValue = (value: string) => {
  return projectTypes.find(type => type.value === value);
};

export const getConstructionTypeByValue = (value: string) => {
  return constructionTypes.find(type => type.value === value);
};

export const getSubProjectTypeByValue = (value: string) => {
  return subProjectTypes.find(type => type.value === value);
};