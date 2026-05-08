/**
 * Shared Property Contents Insurance Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getPropertyContentsTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Proposer & Location Information",
      subtitle: "Basic details about the proposer and property location",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Proposer & Location Information",
          subtitle: "Details of the applicant and insured premises",
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
              label: "Insured Premises Address",
              name: "insuredPremisesAddress",
              placeholder: "Enter full address of insured premises",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field4",
              type: "dropdown",
              label: "Property Usage",
              name: "propertyUsage",
              placeholder: "Select property usage",
              required: true,
              isRatingParameter: true,
              options: ["Office", "Retail", "Warehouse", "Industrial"]
            },
            {
              id: "field5",
              type: "dropdown",
              label: "Occupancy",
              name: "occupancy",
              placeholder: "Select occupancy type",
              required: true,
              isRatingParameter: true,
              options: ["Single", "Multi-tenant"]
            },
            {
              id: "field6",
              type: "dropdown",
              label: "Security Protections",
              name: "securityProtections",
              placeholder: "Select security protection",
              required: true,
              isRatingParameter: true,
              options: ["Guard", "CCTV", "Alarm", "None"]
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
      title: "Contents Sum Insured Details",
      subtitle: "Sum insured for various contents",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Contents Sum Insured Details",
          subtitle: "Details of contents sum insured",
          fields: [
            {
              id: "field7",
              type: "number",
              label: "Furniture & Fixtures SI",
              name: "furnitureFixturesSI",
              placeholder: "Enter sum insured in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field8",
              type: "number",
              label: "Electronics & Office Equipment SI",
              name: "electronicsOfficeEquipmentSI",
              placeholder: "Enter sum insured in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field9",
              type: "number",
              label: "Machinery (Portable/Fixed) SI",
              name: "machinerySI",
              placeholder: "Enter sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field10",
              type: "number",
              label: "Stock (Finished/Raw) SI",
              name: "stockSI",
              placeholder: "Enter sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field11",
              type: "number",
              label: "Other Contents SI",
              name: "otherContentsSI",
              placeholder: "Enter sum insured in AED",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field12",
              type: "number",
              label: "Total Contents SI",
              name: "totalContentsSI",
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
      title: "COPE Details",
      subtitle: "Construction, Occupancy, Protection, and Exposure details",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "COPE Details (Contents Focused)",
          subtitle: "Construction, occupancy, protection, and exposure information",
          fields: [
            {
              id: "field13",
              type: "dropdown",
              label: "Fire Protection",
              name: "fireProtection",
              placeholder: "Select fire protection type",
              required: true,
              isRatingParameter: true,
              options: ["Sprinklers", "Hose Reels", "Extinguishers", "None"]
            },
            {
              id: "field14",
              type: "dropdown",
              label: "Security Measures",
              name: "securityMeasures",
              placeholder: "Select security measures",
              required: true,
              isRatingParameter: true,
              options: ["Guard", "CCTV", "Alarm", "None"]
            },
            {
              id: "field15",
              type: "dropdown",
              label: "Premises Construction",
              name: "premisesConstruction",
              placeholder: "Select construction type",
              required: true,
              isRatingParameter: true,
              options: ["Concrete", "Steel", "Light Steel"]
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Floor Level",
              name: "floorLevel",
              placeholder: "Select floor level",
              required: true,
              isRatingParameter: true,
              options: ["Ground", "Above 1st", "Basement"]
            },
            {
              id: "field17",
              type: "textarea",
              label: "Neighbouring Exposure",
              name: "neighbouringExposure",
              placeholder: "Describe neighbouring exposure risks",
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
      subtitle: "3-year loss record",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Claims History",
          subtitle: "3-year loss record including fire, burglary, flood. Used for experience rating.",
          fields: [
            {
              id: "field18",
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
                  label: "Fire Claims",
                  name: "fireClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield2",
                  label: "Burglary Claims",
                  name: "burglaryClaims",
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
                  label: "Total Loss Amount (AED)",
                  name: "totalLossAmount",
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
              id: "field19",
              type: "dropdown",
              label: "Basis of Cover",
              name: "basisOfCover",
              placeholder: "Select basis of cover",
              required: true,
              isRatingParameter: true,
              options: ["Named Perils", "Contents All Risks"]
            },
            {
              id: "field20",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: true,
              isRatingParameter: true,
              options: ["1,000", "2,500", "5,000", "10,000"]
            },
            {
              id: "field21",
              type: "multiselect",
              label: "Extensions Required",
              name: "extensionsRequired",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Theft Extension (Full Burglary/TFT)",
                "Accidental Damage",
                "Deterioration of Stocks",
                "Water Damage Extension",
                "Mold/Fungal Damage",
                "Debris Removal Increase",
                "Plate Glass"
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

