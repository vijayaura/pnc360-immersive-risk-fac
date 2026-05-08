/**
 * Office Multicover Insurance Test Data
 * Based on Full Digital Proposal Form, Rating Formula & CEW Specification
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getOfficeMulticoverTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Proposer & Business Information",
      subtitle: "Basic company and business details",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Proposer & Business Information",
          subtitle: "Company and business details",
          fields: [
            {
              id: "field1",
              type: "text",
              label: "Company Name",
              name: "companyName",
              placeholder: "Enter company name",
              required: true,
              isRatingParameter: false
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
              label: "Office Address",
              name: "officeAddress",
              placeholder: "Enter office address",
              required: true,
              isRatingParameter: true // [PRICING] location risk
            },
            {
              id: "field4",
              type: "dropdown",
              label: "Type of Business",
              name: "typeOfBusiness",
              placeholder: "Select type of business",
              required: true,
              isRatingParameter: true, // [PRICING]
              options: ["Office", "IT", "Consultancy", "Real Estate", "Service"]
            },
            {
              id: "field5",
              type: "number",
              label: "Years in Operation",
              name: "yearsInOperation",
              placeholder: "Enter years in operation",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field6",
              type: "number",
              label: "Number of Employees",
              name: "numberOfEmployees",
              placeholder: "Enter number of employees",
              required: true,
              isRatingParameter: true // [PRICING]
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
      title: "Sum Insured Details",
      subtitle: "Coverage amounts for different categories",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Sum Insured Details",
          subtitle: "Enter sum insured amounts in AED",
          fields: [
            {
              id: "field7",
              type: "number",
              label: "Office Contents SI",
              name: "officeContentsSI",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true // [PRICING]
            },
            {
              id: "field8",
              type: "number",
              label: "Electronics & IT Equipment SI",
              name: "electronicsITEquipmentSI",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true // [PRICING]
            },
            {
              id: "field9",
              type: "number",
              label: "Furniture & Fixtures SI",
              name: "furnitureFixturesSI",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true // optional [PRICING]
            },
            {
              id: "field10",
              type: "number",
              label: "Documents & Records SI",
              name: "documentsRecordsSI",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: false // optional
            },
            {
              id: "field11",
              type: "number",
              label: "Portable Equipment SI",
              name: "portableEquipmentSI",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true // [PRICING] high theft
            },
            {
              id: "field12",
              type: "number",
              label: "Total Sum Insured",
              name: "totalSumInsured",
              placeholder: "Auto-calculated",
              required: false,
              isRatingParameter: true, // [PRICING] - auto-calc sum
              validations: [{ type: "readonly" }]
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
      title: "Office COPE",
      subtitle: "Construction, Occupancy, Protection, Exposure details",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Office COPE (Construction, Occupancy, Protection, Exposure)",
          subtitle: "Physical characteristics and protective measures",
          fields: [
            {
              id: "field13",
              type: "dropdown",
              label: "Building Construction",
              name: "buildingConstruction",
              placeholder: "Select construction type",
              required: true,
              isRatingParameter: true, // [PRICING]
              options: ["Concrete", "Steel", "Other"]
            },
            {
              id: "field14",
              type: "dropdown",
              label: "Fire Safety Systems",
              name: "fireSafetySystems",
              placeholder: "Select fire safety system",
              required: true,
              isRatingParameter: true, // [PRICING]
              options: ["Detectors", "Extinguishers", "Sprinklers", "None"]
            },
            {
              id: "field15",
              type: "dropdown",
              label: "Security Measures",
              name: "securityMeasures",
              placeholder: "Select security measures",
              required: true,
              isRatingParameter: true, // [PRICING]
              options: ["CCTV", "Guard", "Access Control", "None"]
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Floor Level",
              name: "floorLevel",
              placeholder: "Select floor level",
              required: true,
              isRatingParameter: true, // [PRICING flood risk]
              options: ["Ground", "Above 1st", "Basement"]
            },
            {
              id: "field17",
              type: "textarea",
              label: "Neighbouring Exposure",
              name: "neighbouringExposure",
              placeholder: "Describe neighbouring exposure",
              required: false,
              isRatingParameter: true // [PRICING]
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
      subtitle: "3-year claims history",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Claims History",
          subtitle: "3-year claims history including fire, theft, accidental damage, water leakage",
          fields: [
            {
              id: "field18",
              type: "combination",
              label: "Claims History",
              name: "claimsHistory",
              required: false,
              isRatingParameter: true, // [PRICING] - for experience loading
              subFields: [
                {
                  id: "subfield1",
                  type: "text",
                  label: "Claim Type",
                  name: "claimType",
                  placeholder: "e.g., Fire, Theft, Accidental Damage, Water Leakage"
                },
                {
                  id: "subfield2",
                  type: "date",
                  label: "Date",
                  name: "claimDate",
                  placeholder: "Select date"
                },
                {
                  id: "subfield3",
                  type: "number",
                  label: "Amount (AED)",
                  name: "claimAmount",
                  placeholder: "Enter claim amount"
                },
                {
                  id: "subfield4",
                  type: "textarea",
                  label: "Description",
                  name: "claimDescription",
                  placeholder: "Enter claim description"
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
      subtitle: "Select coverage options and limits",
      pageType: "form",
      sections: [
        {
          id: "section5",
          title: "Coverage Required",
          subtitle: "Select your coverage options",
          fields: [
            {
              id: "field19",
              type: "dropdown",
              label: "Contents Cover Type",
              name: "contentsCoverType",
              placeholder: "Select cover type",
              required: true,
              isRatingParameter: true, // [PRICING]
              options: ["Named Perils", "All Risks"]
            },
            {
              id: "field20",
              type: "checkbox",
              label: "Electronic Equipment Cover",
              name: "electronicEquipmentCover",
              required: false,
              isRatingParameter: true // [PRICING]
            },
            {
              id: "field21",
              type: "checkbox",
              label: "Portable Equipment Cover",
              name: "portableEquipmentCover",
              required: false,
              isRatingParameter: true // [PRICING high]
            },
            {
              id: "field22",
              type: "checkbox",
              label: "Money Cover Required",
              name: "moneyCoverRequired",
              required: false,
              isRatingParameter: true // [PRICING]
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Public Liability Limit",
              name: "publicLiabilityLimit",
              placeholder: "Select limit",
              required: false,
              isRatingParameter: true, // Optional [PRICING]
              options: ["1M", "2M", "5M"]
            },
            {
              id: "field24",
              type: "checkbox",
              label: "Fidelity Cover Required",
              name: "fidelityCoverRequired",
              required: false,
              isRatingParameter: true // [PRICING]
            },
            {
              id: "field25",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible",
              required: true,
              isRatingParameter: true, // [PRICING]
              options: ["500", "1,000", "2,500", "5,000"]
            },
            {
              id: "field26",
              type: "multiselect",
              label: "Extensions Required",
              name: "extensionsRequired",
              placeholder: "Select extensions (see CEW)",
              required: false,
              isRatingParameter: true, // Optional loadings
              options: [
                "Theft Extension",
                "Accidental Damage Extension",
                "Breakdown of Electronics",
                "Terrorism Extension",
                "Glass Cover",
                "Fidelity Guarantee",
                "Money Cover (Day/Night)"
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
