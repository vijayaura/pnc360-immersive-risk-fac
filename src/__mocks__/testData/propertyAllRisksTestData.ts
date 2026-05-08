/**
 * Shared Property All Risks (PAR) Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getPropertyAllRisksTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Property & Proposer Information",
      subtitle: "Basic property and proposer details",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Property & Proposer Information",
          subtitle: "Property details and proposer information",
          fields: [
            {
              id: "field1",
              type: "text",
              label: "Proposer Name",
              name: "proposerName",
              placeholder: "Enter proposer name",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "minLength", value: 2 }]
            },
            {
              id: "field2",
              type: "text",
              label: "Trade License No.",
              name: "tradeLicenseNo",
              placeholder: "Enter trade license number",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field3",
              type: "text",
              label: "Property Location",
              name: "propertyLocation",
              placeholder: "Enter property location address",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field4",
              type: "dropdown",
              label: "Building Usage",
              name: "buildingUsage",
              placeholder: "Select building usage",
              required: true,
              isRatingParameter: true,
              options: ["Residential", "Commercial", "Industrial"]
            },
            {
              id: "field5",
              type: "number",
              label: "Year Built",
              name: "yearBuilt",
              placeholder: "Enter year built (4 digits)",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "min", value: 1900 }, { type: "max", value: 9999 }]
            },
            {
              id: "field6",
              type: "number",
              label: "No. of Floors",
              name: "numberOfFloors",
              placeholder: "Enter number of floors",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 1 }]
            },
            {
              id: "field7",
              type: "dropdown",
              label: "Construction Type",
              name: "constructionType",
              placeholder: "Select construction type",
              required: true,
              isRatingParameter: true,
              options: ["Concrete", "Steel", "Light Steel", "Mixed"]
            },
            {
              id: "field8",
              type: "dropdown",
              label: "Occupancy Type",
              name: "occupancyType",
              placeholder: "Select occupancy type",
              required: true,
              isRatingParameter: true,
              options: ["Single", "Multi-tenant"]
            }
          ]
        }
      ],
      navigationFields: [
        {
          id: "nav1",
          type: "nextButton",
          buttonText: "Next",
          buttonAction: "next",
          buttonTargetPage: "page2"
        }
      ]
    },
    {
      id: "page2",
      title: "Sum Insured",
      subtitle: "Core pricing information",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Sum Insured (Core Pricing)",
          subtitle: "Insurance coverage amounts",
          fields: [
            {
              id: "field9",
              type: "number",
              label: "Building SI",
              name: "buildingSI",
              placeholder: "Enter building sum insured in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field10",
              type: "number",
              label: "Machinery SI",
              name: "machinerySI",
              placeholder: "Enter machinery sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field11",
              type: "number",
              label: "Furniture/Contents SI",
              name: "furnitureContentsSI",
              placeholder: "Enter furniture/contents sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field12",
              type: "number",
              label: "Stock SI",
              name: "stockSI",
              placeholder: "Enter stock sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field13",
              type: "number",
              label: "Other Contents",
              name: "otherContents",
              placeholder: "Enter other contents sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field14",
              type: "number",
              label: "Total Sum Insured",
              name: "totalSumInsured",
              placeholder: "Auto-calculated (sum of above)",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            }
          ]
        }
      ],
      navigationFields: [
        {
          id: "nav2",
          type: "backButton",
          buttonText: "Back",
          buttonAction: "back",
          buttonTargetPage: "page1"
        },
        {
          id: "nav3",
          type: "nextButton",
          buttonText: "Next",
          buttonAction: "next",
          buttonTargetPage: "page3"
        }
      ]
    },
    {
      id: "page3",
      title: "COPE Information",
      subtitle: "Construction, Occupancy, Protection, Exposure",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "COPE Info (Construction, Occupancy, Protection, Exposure)",
          subtitle: "Risk assessment factors",
          fields: [
            {
              id: "field15",
              type: "dropdown",
              label: "Fire Protection Systems",
              name: "fireProtectionSystems",
              placeholder: "Select fire protection systems",
              required: true,
              isRatingParameter: true,
              options: ["Sprinklers", "Hose Reels", "Extinguishers", "None"]
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Security Measures",
              name: "securityMeasures",
              placeholder: "Select security measures",
              required: true,
              isRatingParameter: true,
              options: ["Guard", "CCTV", "Access Control", "None"]
            },
            {
              id: "field17",
              type: "number",
              label: "Distance to Fire Station",
              name: "distanceToFireStation",
              placeholder: "Enter distance in km",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field18",
              type: "text",
              label: "Neighbouring Exposure",
              name: "neighbouringExposure",
              placeholder: "Describe neighbouring exposure risks",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field19",
              type: "dropdown",
              label: "High-Risk Industry Nearby",
              name: "highRiskIndustryNearby",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field20",
              type: "text",
              label: "High-Risk Industry Details",
              name: "highRiskIndustryDetails",
              placeholder: "Provide details if high-risk industry is nearby",
              required: false,
              isRatingParameter: true
            }
          ]
        }
      ],
      navigationFields: [
        {
          id: "nav4",
          type: "backButton",
          buttonText: "Back",
          buttonAction: "back",
          buttonTargetPage: "page2"
        },
        {
          id: "nav5",
          type: "nextButton",
          buttonText: "Next",
          buttonAction: "next",
          buttonTargetPage: "page4"
        }
      ]
    },
    {
      id: "page4",
      title: "Claims History",
      subtitle: "3-year loss history",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Claims History",
          subtitle: "3-year claims history including fire, flood, burglary. Mandatory for loading/discount determination.",
          fields: [
            {
              id: "field21",
              type: "combination",
              label: "Claims History",
              name: "claimsHistory",
              required: false,
              isRatingParameter: true,
              combinationRows: 3,
              combinationRowLabels: ["2024", "2023", "2022"],
              subFields: [
                {
                  id: "subfield1",
                  label: "Year",
                  name: "year",
                  type: "text",
                  required: true
                },
                {
                  id: "subfield2",
                  label: "Fire Claims",
                  name: "fireClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield3",
                  label: "Flood Claims",
                  name: "floodClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield4",
                  label: "Burglary Claims",
                  name: "burglaryClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield5",
                  label: "Total Claim Amount (AED)",
                  name: "totalClaimAmount",
                  type: "number",
                  required: false
                }
              ]
            }
          ]
        }
      ],
      navigationFields: [
        {
          id: "nav6",
          type: "backButton",
          buttonText: "Back",
          buttonAction: "back",
          buttonTargetPage: "page3"
        },
        {
          id: "nav7",
          type: "nextButton",
          buttonText: "Next",
          buttonAction: "next",
          buttonTargetPage: "page5"
        }
      ]
    },
    {
      id: "page5",
      title: "Coverage Required",
      subtitle: "Coverage options and extensions",
      pageType: "form",
      sections: [
        {
          id: "section5",
          title: "Coverage Required",
          subtitle: "Insurance coverage and extension options",
          fields: [
            {
              id: "field22",
              type: "dropdown",
              label: "Basis of Cover",
              name: "basisOfCover",
              placeholder: "Select basis of cover",
              required: true,
              isRatingParameter: true,
              options: ["Fire Only", "Fire & Allied Perils", "PAR"]
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: true,
              isRatingParameter: true,
              options: ["2,500", "5,000", "10,000", "25,000"]
            },
            {
              id: "field24",
              type: "multiselect",
              label: "Additional Extensions",
              name: "additionalExtensions",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Storm/Flood Extension",
                "Burglary/TFT Extension",
                "Plate Glass Extension",
                "Accidental Damage",
                "Mold/Fungus Extension",
                "Tenants Liability",
                "Debris Removal Increase"
              ]
            }
          ]
        }
      ],
      navigationFields: [
        {
          id: "nav8",
          type: "backButton",
          buttonText: "Back",
          buttonAction: "back",
          buttonTargetPage: "page4"
        },
        {
          id: "nav9",
          type: "submitButton",
          buttonText: "Submit",
          buttonAction: "submit"
        }
      ]
    }
  ];
};

