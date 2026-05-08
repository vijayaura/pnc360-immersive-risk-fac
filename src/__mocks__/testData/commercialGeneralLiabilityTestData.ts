/**
 * Shared Commercial General Liability (CGL) Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getCommercialGeneralLiabilityTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Proposer Information",
      subtitle: "Basic details about the proposer",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Proposer Information",
          subtitle: "Details of the proposer",
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
              label: "Address",
              name: "address",
              placeholder: "Enter full address",
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
              label: "Business Activity",
              name: "businessActivity",
              placeholder: "Select business activity",
              required: true,
              isRatingParameter: true,
              options: [
                "Office/Consultancy",
                "Trading",
                "Light Manufacturing",
                "Construction",
                "Workshop",
                "Fabrication",
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
      title: "Operations & Exposure",
      subtitle: "Business operations and exposure details",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Operations & Exposure",
          subtitle: "Operations and exposure information for rating",
          fields: [
            {
              id: "field9",
              type: "number",
              label: "Annual Turnover",
              name: "annualTurnover",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field10",
              type: "dropdown",
              label: "Work Away From Premises",
              name: "workAwayFromPremises",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field11",
              type: "text",
              label: "Work Away Details",
              name: "workAwayDetails",
              placeholder: "Provide details if work is performed away from premises",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field12",
              type: "dropdown",
              label: "Use of Heat (Hot Works)",
              name: "useOfHeat",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field13",
              type: "text",
              label: "Hot Works Details",
              name: "hotWorksDetails",
              placeholder: "Provide details if hot works are used",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field14",
              type: "dropdown",
              label: "Products Exposure",
              name: "productsExposure",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field15",
              type: "text",
              label: "Type of Products",
              name: "typeOfProducts",
              placeholder: "Describe type of products if products exposure exists",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Imports/Exports",
              name: "importsExports",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field17",
              type: "textarea",
              label: "Country List",
              name: "countryList",
              placeholder: "List countries for imports/exports",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field18",
              type: "dropdown",
              label: "Subcontractors Used",
              name: "subcontractorsUsed",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field19",
              type: "number",
              label: "Percentage of Subcontracted Work",
              name: "percentageSubcontractedWork",
              placeholder: "Enter percentage (0-100)",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }, { type: "max", value: 100 }]
            },
            {
              id: "field20",
              type: "dropdown",
              label: "Hazardous Materials",
              name: "hazardousMaterials",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field21",
              type: "textarea",
              label: "Hazardous Materials List",
              name: "hazardousMaterialsList",
              placeholder: "List hazardous materials handled",
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
      title: "Claims History",
      subtitle: "3-year loss history",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Claims History",
          subtitle: "3-year loss history with settled and outstanding claims. Impacts experience loading.",
          fields: [
            {
              id: "field22",
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
                  label: "Settled Claims",
                  name: "settledClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield2",
                  label: "Outstanding Claims",
                  name: "outstandingClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield3",
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
      title: "Coverage Required",
      subtitle: "Coverage options and limits",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Coverage Required",
          subtitle: "Insurance coverage and extension options",
          fields: [
            {
              id: "field23",
              type: "dropdown",
              label: "Public Liability Limit",
              name: "publicLiabilityLimit",
              placeholder: "Select public liability limit",
              required: true,
              isRatingParameter: true,
              options: ["1M", "2M", "5M", "10M", "20M"]
            },
            {
              id: "field24",
              type: "dropdown",
              label: "Products Liability Limit",
              name: "productsLiabilityLimit",
              placeholder: "Select products liability limit",
              required: true,
              isRatingParameter: true,
              options: ["1M", "2M", "5M", "10M", "20M"]
            },
            {
              id: "field25",
              type: "dropdown",
              label: "Geographical Limit",
              name: "geographicalLimit",
              placeholder: "Select geographical limit",
              required: true,
              isRatingParameter: true,
              options: ["UAE", "GCC", "Worldwide excl. USA/Canada", "USA/Canada"]
            },
            {
              id: "field26",
              type: "multiselect",
              label: "Extensions",
              name: "extensions",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Products Liability Extension",
                "Work Away Extension",
                "USA/Canada Jurisdiction",
                "Erection/Installation Extension",
                "Defective Workmanship Extension",
                "Financial Loss Extension"
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
          type: "submitButton",
          buttonText: "Submit",
          buttonAction: "submit"
        }
      ]
    }
  ];
};

