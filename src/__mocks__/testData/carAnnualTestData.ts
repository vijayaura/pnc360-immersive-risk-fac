/**
 * Shared Contractors All Risks (CAR) Annual Policy Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getCARAnnualTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Proposer & Company Information",
      subtitle: "Basic details about the proposer and company",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Proposer & Company Information",
          subtitle: "Details of the proposer and company",
          fields: [
            {
              id: "field1",
              type: "text",
              label: "Company Name",
              name: "companyName",
              placeholder: "Enter company name",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "minLength", value: 2 }]
            },
            {
              id: "field2",
              type: "text",
              label: "Trade License Number",
              name: "tradeLicenseNumber",
              placeholder: "Enter trade license number",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field3",
              type: "text",
              label: "Registered Address",
              name: "registeredAddress",
              placeholder: "Enter registered address",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field4",
              type: "text",
              label: "Contact Person",
              name: "contactPerson",
              placeholder: "Enter contact person name",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field5",
              type: "text",
              label: "Email",
              name: "email",
              placeholder: "Enter email address",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "email" }]
            },
            {
              id: "field6",
              type: "text",
              label: "Mobile Number",
              name: "mobileNumber",
              placeholder: "Enter mobile number (971 format)",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "pattern", value: "^971" }]
            },
            {
              id: "field7",
              type: "dropdown",
              label: "Nature of Contracting Work",
              name: "natureOfContractingWork",
              placeholder: "Select nature of contracting work",
              required: true,
              isRatingParameter: true,
              options: [
                "Building",
                "Civil",
                "MEP",
                "Interior",
                "Road",
                "Other"
              ]
            },
            {
              id: "field8",
              type: "number",
              label: "Years in Operation",
              name: "yearsInOperation",
              placeholder: "Enter years in operation",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field9",
              type: "number",
              label: "Annual Payroll",
              name: "annualPayroll",
              placeholder: "Enter annual payroll in AED",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
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
      title: "Annual Contracting Exposure",
      subtitle: "Core rating component",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Annual Contracting Exposure (Core Rating)",
          subtitle: "Annual contracting exposure details for rating",
          fields: [
            {
              id: "field10",
              type: "number",
              label: "Total Annual Contract Value",
              name: "totalAnnualContractValue",
              placeholder: "Enter total annual contract value in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field11",
              type: "number",
              label: "Largest Single Contract Value",
              name: "largestSingleContractValue",
              placeholder: "Enter largest single contract value in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field12",
              type: "number",
              label: "No. of Projects per Year",
              name: "numberOfProjectsPerYear",
              placeholder: "Enter number of projects per year",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "min", value: 1 }]
            },
            {
              id: "field13",
              type: "combination",
              label: "Work Type Split (%)",
              name: "workTypeSplit",
              required: true,
              isRatingParameter: true,
              combinationRows: 6,
              combinationRowLabels: ["Building", "Civil", "MEP", "Interior", "Road", "Other"],
              subFields: [
                {
                  id: "subfield1",
                  label: "Work Type",
                  name: "workType",
                  type: "dropdown",
                  required: true,
                  options: ["Building", "Civil", "MEP", "Interior", "Road", "Other"]
                },
                {
                  id: "subfield2",
                  label: "Percentage (%)",
                  name: "percentage",
                  type: "number",
                  required: true,
                  validations: [{ type: "min", value: 0 }, { type: "max", value: 100 }]
                }
              ]
            },
            {
              id: "field14",
              type: "dropdown",
              label: "Work at Height",
              name: "workAtHeight",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field15",
              type: "text",
              label: "Work at Height Details",
              name: "workAtHeightDetails",
              placeholder: "Provide details if work at height is performed (e.g., height in meters)",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Work Near Water",
              name: "workNearWater",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field17",
              type: "textarea",
              label: "Work Near Water Details",
              name: "workNearWaterDetails",
              placeholder: "Provide details if work is performed near water",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field18",
              type: "dropdown",
              label: "Demolition Work",
              name: "demolitionWork",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field19",
              type: "textarea",
              label: "Demolition Work Details",
              name: "demolitionWorkDetails",
              placeholder: "Provide details if demolition work is performed",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field20",
              type: "dropdown",
              label: "Use of Heavy Machinery",
              name: "useOfHeavyMachinery",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field21",
              type: "textarea",
              label: "Heavy Machinery Details",
              name: "heavyMachineryDetails",
              placeholder: "Provide details of heavy machinery used",
              required: false,
              isRatingParameter: false
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
      title: "Site COPE & Risk Controls",
      subtitle: "Site characteristics and risk controls",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Site COPE & Risk Controls",
          subtitle: "Site construction, occupancy, protection, and exposure details",
          fields: [
            {
              id: "field22",
              type: "dropdown",
              label: "Site Security",
              name: "siteSecurity",
              placeholder: "Select site security measures",
              required: true,
              isRatingParameter: true,
              options: ["Guard", "CCTV", "Fencing", "None"]
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Fire Protection at Site",
              name: "fireProtectionAtSite",
              placeholder: "Select fire protection measures",
              required: true,
              isRatingParameter: true,
              options: ["Extinguishers", "Hydrants", "None"]
            },
            {
              id: "field24",
              type: "dropdown",
              label: "Storage of Hazardous Materials",
              name: "storageOfHazardousMaterials",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field25",
              type: "textarea",
              label: "Hazardous Materials Details",
              name: "hazardousMaterialsDetails",
              placeholder: "Provide details of hazardous materials stored",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field26",
              type: "dropdown",
              label: "Temporary Buildings on Site",
              name: "temporaryBuildingsOnSite",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field27",
              type: "dropdown",
              label: "Storm/Flood Exposure",
              name: "stormFloodExposure",
              placeholder: "Select storm/flood exposure level",
              required: true,
              isRatingParameter: true,
              options: ["Low", "Medium", "High"]
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
      subtitle: "5-year claims history",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Claims History",
          subtitle: "Provide 5-year CAR/EAR/Property claims including cause of loss, project type, paid & outstanding. Used for experience rating.",
          fields: [
            {
              id: "field28",
              type: "combination",
              label: "Past 5 Years Claims History",
              name: "claimsHistory",
              required: true,
              isRatingParameter: true,
              combinationRows: 5,
              combinationRowLabels: ["2024", "2023", "2022", "2021", "2020"],
              subFields: [
                {
                  id: "subfield3",
                  label: "Cause of Loss",
                  name: "causeOfLoss",
                  type: "text",
                  required: false
                },
                {
                  id: "subfield4",
                  label: "Project Type",
                  name: "projectType",
                  type: "text",
                  required: false
                },
                {
                  id: "subfield5",
                  label: "Paid Amount (AED)",
                  name: "paidAmount",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield6",
                  label: "Outstanding Amount (AED)",
                  name: "outstandingAmount",
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
      subtitle: "Coverage options and limits",
      pageType: "form",
      sections: [
        {
          id: "section5",
          title: "Coverage Required",
          subtitle: "Insurance coverage and extension options",
          fields: [
            {
              id: "field29",
              type: "number",
              label: "Material Damage Annual Limit",
              name: "materialDamageAnnualLimit",
              placeholder: "Enter material damage annual limit in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field30",
              type: "dropdown",
              label: "Third-Party Liability Limit",
              name: "thirdPartyLiabilityLimit",
              placeholder: "Select third-party liability limit",
              required: true,
              isRatingParameter: true,
              options: ["1M", "2M", "5M", "10M", "20M"]
            },
            {
              id: "field31",
              type: "number",
              label: "Debris Removal Limit",
              name: "debrisRemovalLimit",
              placeholder: "Enter debris removal limit in AED",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field32",
              type: "number",
              label: "Professional Fees Limit",
              name: "professionalFeesLimit",
              placeholder: "Enter professional fees limit in AED",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field33",
              type: "dropdown",
              label: "Maintenance Period Required?",
              name: "maintenancePeriodRequired",
              placeholder: "Select maintenance period",
              required: true,
              isRatingParameter: true,
              options: ["3 months", "6 months", "12 months"]
            },
            {
              id: "field34",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: true,
              isRatingParameter: true,
              options: ["5K", "10K", "25K", "50K", "100K"]
            },
            {
              id: "field35",
              type: "multiselect",
              label: "Extensions Required",
              name: "extensionsRequired",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Removal of Debris",
                "Professional Fees",
                "Surrounding Property",
                "Off-site Storage",
                "Testing & Commissioning",
                "Cross Liability",
                "Strike / Riot / Civil Commotion",
                "Natural Catastrophe Extension"
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

