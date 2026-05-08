/**
 * Shared Professional Indemnity (PI) Annual Policy Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getProfessionalIndemnityAnnualTestData = (): Page[] => {
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
              label: "Company Name",
              name: "companyName",
              placeholder: "Enter company name",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "minLength", value: 2 }],
              defaultValue: "ABC Architects & Engineers LLC" // Test data
            },
            {
              id: "field2",
              type: "text",
              label: "Trade License No.",
              name: "tradeLicenseNo",
              placeholder: "Enter trade license number",
              required: false,
              isRatingParameter: false,
              defaultValue: "TL-123456" // Test data
            },
            {
              id: "field3",
              type: "text",
              label: "Registered Address",
              name: "registeredAddress",
              placeholder: "Enter registered address",
              required: true,
              isRatingParameter: false,
              defaultValue: "Business Bay, Dubai, UAE" // Test data
            },
            {
              id: "field4",
              type: "text",
              label: "Cedent Name",
              name: "contactPerson",
              placeholder: "Enter cedent name",
              required: true,
              isRatingParameter: false,
              defaultValue: "John Smith" // Test data
            },
            {
              id: "field5",
              type: "text",
              label: "Email",
              name: "email",
              placeholder: "Enter email address",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "email" }],
              defaultValue: "contact@abcarchitects.com" // Test data
            },
            {
              id: "field5_5",
              type: "dropdown",
              label: "Operating Country",
              name: "operatingCountry",
              placeholder: "Select operating country",
              required: true,
              isRatingParameter: false,
              options: ["Saudi Arabia", "UAE", "Kuwait", "Oman", "Bahrain", "Qatar"],
              defaultValue: "UAE" // Test data
            },
            {
              id: "field5_6",
              type: "dropdown",
              label: "Preferred Currency",
              name: "preferredCurrency",
              placeholder: "Select preferred currency",
              required: true,
              isRatingParameter: false,
              options: ["AED", "SAR", "KWD", "OMR", "BHD", "QAR", "USD"],
              defaultValue: "AED" // Test data
            },
            {
              id: "field8",
              type: "number",
              label: "Years of Experience",
              name: "yearsOfExperience",
              placeholder: "Enter years of experience",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }],
              defaultValue: 15 // Test data
            },
            {
              id: "field9",
              type: "number",
              label: "Number of Professionals",
              name: "numberOfProfessionals",
              placeholder: "Enter number of professionals",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }],
              defaultValue: 3 // Test data
            },
            {
              id: "field10",
              type: "repeatable",
              label: "Qualifications & Certifications",
              name: "qualificationsCertifications",
              required: false,
              isRatingParameter: false,
              allowAddRemove: false,
              dynamicRowsBasedOn: "numberOfProfessionals",
              defaultValue: [
                { partnerOfficerName: "John Smith", universityAttended: "University of Dubai", degree: "B.Arch", year: "2010", provinceLicensedIn: "Dubai" },
                { partnerOfficerName: "Sarah Johnson", universityAttended: "American University of Sharjah", degree: "M.Arch", year: "2012", provinceLicensedIn: "Dubai" },
                { partnerOfficerName: "Ahmed Al-Mansoori", universityAttended: "Khalifa University", degree: "BEng", year: "2015", provinceLicensedIn: "Abu Dhabi" }
              ], // Test data: 3 professionals with complete details
              subFields: [
                {
                  id: "subfield1",
                  label: "Partner/Officer Name",
                  name: "partnerOfficerName",
                  type: "text",
                  required: true,
                  placeholder: "Enter name"
                },
                {
                  id: "subfield2",
                  label: "University Attended",
                  name: "universityAttended",
                  type: "text",
                  required: false,
                  placeholder: "Enter university name"
                },
                {
                  id: "subfield3",
                  label: "Degree",
                  name: "degree",
                  type: "dropdown",
                  required: false,
                  placeholder: "Select degree",
                  options: ["BSc", "BEng", "MEng", "MSc", "B.Arch", "M.Arch", "PhD"]
                },
                {
                  id: "subfield4",
                  label: "Year",
                  name: "year",
                  type: "text",
                  required: false,
                  placeholder: "Enter year"
                },
                {
                  id: "subfield5",
                  label: "Province Licensed In",
                  name: "provinceLicensedIn",
                  type: "text",
                  required: false,
                  placeholder: "Enter province"
                },
                {
                  id: "subfield6",
                  label: "Upload Resume",
                  name: "resume",
                  type: "file",
                  required: false
                }
              ]
            },
            {
              id: "field11",
              type: "dropdown",
              label: "Does the applicant currently carry professional or errors & omissions liability insurance?",
              name: "hasCurrentInsurance",
              placeholder: "Select Yes or No",
              required: true,
              isRatingParameter: false,
              options: ["Yes", "No"],
              defaultValue: "No" // Test data
            },
            {
              id: "field12",
              type: "text",
              label: "Insurer Name",
              name: "currentInsurerName",
              placeholder: "Enter insurer name",
              required: false,
              isRatingParameter: false,
              conditionalLogic: {
                field: "hasCurrentInsurance",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field13",
              type: "dropdown",
              label: "Coverage Type",
              name: "currentCoverageType",
              placeholder: "Select coverage type",
              required: false,
              isRatingParameter: false,
              options: ["Occurrence", "Claims-made"],
              conditionalLogic: {
                field: "hasCurrentInsurance",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field14",
              type: "date",
              label: "Retroactive Date",
              name: "currentRetroactiveDate",
              placeholder: "Select retroactive date",
              required: false,
              isRatingParameter: false,
              conditionalLogic: {
                field: "hasCurrentInsurance",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field15",
              type: "number",
              label: "Current Policy Limit",
              name: "currentPolicyLimit",
              placeholder: "Enter policy limit",
              required: false,
              isRatingParameter: false,
              conditionalLogic: {
                field: "hasCurrentInsurance",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field16",
              type: "number",
              label: "Current Deductible",
              name: "currentDeductible",
              placeholder: "Enter deductible amount",
              required: false,
              isRatingParameter: false,
              conditionalLogic: {
                field: "hasCurrentInsurance",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field17",
              type: "dropdown",
              label: "Are renewal terms being offered?",
              name: "renewalTermsOffered",
              placeholder: "Select Yes or No",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"],
              conditionalLogic: {
                field: "hasCurrentInsurance",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field18",
              type: "text",
              label: "If No, state reason",
              name: "renewalTermsReason",
              placeholder: "Enter reason if renewal terms are not being offered",
              required: false,
              isRatingParameter: false,
              conditionalLogic: {
                field: "renewalTermsOffered",
                condition: "equals",
                value: "No"
              }
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
      title: "Turnover & Activity Split",
      subtitle: "Core rating component",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Turnover & Activity Split (Core Rating)",
          subtitle: "Financial turnover and activity breakdown for rating",
          fields: [
            {
              id: "field11",
              type: "number",
              label: "Last 12 Months Turnover",
              name: "last12MonthsTurnover",
              placeholder: "Enter amount",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }],
              currencyField: "preferredCurrency",
              defaultValue: 5000000 // Test data: 50,00,000
            },
            {
              id: "field12",
              type: "number",
              label: "Estimated Coming 12 Months Turnover",
              name: "estimatedComing12MonthsTurnover",
              placeholder: "Enter amount",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }],
              currencyField: "preferredCurrency",
              defaultValue: 5000000 // Test data: 50,00,000
            },
            {
              id: "field13_arch",
              type: "repeatable",
              label: "Architecture Activity Split",
              name: "architectureActivitySplit",
              required: false,
              isRatingParameter: true,
              allowAddRemove: true,
              addButtonText: "Add Architecture Activity",
              removeButtonText: "Remove",
              validateTotal: true,
              totalValidationField: "last12MonthsTurnover",
              totalValidationFieldEstimated: "estimatedComing12MonthsTurnover",
              totalValidationSubField: "activityLast12MonthsTurnover",
              totalValidationSubFieldEstimated: "activityEstimatedComing12MonthsTurnover",
              defaultValue: [
                {
                  activityType: "Interior Design",
                  activityLast12MonthsTurnover: 5000000, // 100% of turnover for test
                  activityEstimatedComing12MonthsTurnover: 5000000
                }
              ], // Test data: Interior Design with 100% turnover (exceeds 50% for rebate)
              subFields: [
                {
                  id: "subfield1_arch",
                  label: "Activity Type",
                  name: "activityType",
                  type: "dropdown",
                  required: true,
                  options: [
                    "Work Not Resulting in Construction",
                    "Interior Design",
                    "Landscape Architecture",
                    "Private Homes",
                    "Apartments / Condominiums / Townhouses",
                    "Commercial & Office Complexes",
                    "Industrial Buildings",
                    "Institutional Buildings",
                    "Recreational Projects",
                    "Project Management Services",
                    "Other"
                  ]
                },
                {
                  id: "subfield1_arch_other",
                  label: "Other Activity Description",
                  name: "otherActivityDescription",
                  type: "text",
                  required: false,
                  placeholder: "Please describe the activity",
                  conditionalLogic: {
                    field: "activityType",
                    condition: "equals",
                    value: "Other"
                  },
                  conditionalRequired: {
                    field: "activityType",
                    condition: "equals",
                    value: "Other"
                  },
                  triggerReferral: true
                },
                {
                  id: "subfield2_arch",
                  label: "Last 12 Months Turnover",
                  name: "activityLast12MonthsTurnover",
                  type: "number",
                  required: true,
                  placeholder: "Enter amount",
                  currencyField: "preferredCurrency"
                },
                {
                  id: "subfield3_arch",
                  label: "Estimated Coming 12 Months Turnover",
                  name: "activityEstimatedComing12MonthsTurnover",
                  type: "number",
                  required: true,
                  placeholder: "Enter amount",
                  currencyField: "preferredCurrency"
                },
                {
                  id: "subfield4_arch",
                  label: "Last 12 Months %",
                  name: "last12MonthsPercentage",
                  type: "number",
                  required: false,
                  placeholder: "Auto-calculated",
                  readOnly: true,
                  autoCalculate: true
                },
                {
                  id: "subfield5_arch",
                  label: "Estimated Coming 12 Months %",
                  name: "estimatedComing12MonthsPercentage",
                  type: "number",
                  required: false,
                  placeholder: "Auto-calculated",
                  readOnly: true,
                  autoCalculate: true
                }
              ]
            },
            {
              id: "field13_eng",
              type: "repeatable",
              label: "Engineering Activity Split",
              name: "engineeringActivitySplit",
              required: false,
              isRatingParameter: true,
              allowAddRemove: true,
              addButtonText: "Add Engineering Activity",
              removeButtonText: "Remove",
              validateTotal: true,
              totalValidationField: "last12MonthsTurnover",
              totalValidationFieldEstimated: "estimatedComing12MonthsTurnover",
              totalValidationSubField: "activityLast12MonthsTurnover",
              totalValidationSubFieldEstimated: "activityEstimatedComing12MonthsTurnover",
              subFields: [
                {
                  id: "subfield1_eng",
                  label: "Activity Type",
                  name: "activityType",
                  type: "dropdown",
                  required: true,
                  options: [
                    "Feasibility Studies / Work Not Resulting in Construction",
                    "Expert Witness Work",
                    "Structural Engineering",
                    "Building Inspection",
                    "Sewage & Water Services",
                    "Roads & Highways",
                    "Oil & Gas Pipelines",
                    "Bridges / Tunnels / Dams",
                    "Marine / Docks / Harbour Engineering",
                    "Geotechnical Engineering",
                    "Mechanical Engineering",
                    "Electrical Engineering",
                    "HVAC Engineering",
                    "Acoustical Engineering",
                    "Corrosion Engineering",
                    "Environmental Engineering",
                    "Hydrology / Geology",
                    "Project / Construction Management",
                    "Surveying",
                    "Land Use Planning",
                    "Laboratory / Material Testing",
                    "Chemical Engineering",
                    "Process Engineering",
                    "Quantity Surveying",
                    "Drafting",
                    "Other"
                  ]
                },
                {
                  id: "subfield1_eng_other",
                  label: "Other Activity Description",
                  name: "otherActivityDescription",
                  type: "text",
                  required: false,
                  placeholder: "Please describe the activity",
                  conditionalLogic: {
                    field: "activityType",
                    condition: "equals",
                    value: "Other"
                  },
                  conditionalRequired: {
                    field: "activityType",
                    condition: "equals",
                    value: "Other"
                  },
                  triggerReferral: true
                },
                {
                  id: "subfield2_eng",
                  label: "Last 12 Months Turnover",
                  name: "activityLast12MonthsTurnover",
                  type: "number",
                  required: true,
                  placeholder: "Enter amount",
                  currencyField: "preferredCurrency"
                },
                {
                  id: "subfield3_eng",
                  label: "Estimated Coming 12 Months Turnover",
                  name: "activityEstimatedComing12MonthsTurnover",
                  type: "number",
                  required: true,
                  placeholder: "Enter amount",
                  currencyField: "preferredCurrency"
                },
                {
                  id: "subfield4_eng",
                  label: "Last 12 Months %",
                  name: "last12MonthsPercentage",
                  type: "number",
                  required: false,
                  placeholder: "Auto-calculated",
                  readOnly: true,
                  autoCalculate: true
                },
                {
                  id: "subfield5_eng",
                  label: "Estimated Coming 12 Months %",
                  name: "estimatedComing12MonthsPercentage",
                  type: "number",
                  required: false,
                  placeholder: "Auto-calculated",
                  readOnly: true,
                  autoCalculate: true
                }
              ]
            },
            {
              id: "field14",
              type: "repeatable",
              label: "Region of Exposure %",
              name: "regionOfExposure",
              required: true,
              isRatingParameter: true,
              allowAddRemove: false,
              validateTotal: true,
              totalValidationPercentage: 100,
              defaultValue: [
                { region: "Local Country", percentage: 100 },
                { region: "GCC (excluding applicant's country)", percentage: 0 },
                { region: "Asia", percentage: 0 },
                { region: "Africa", percentage: 0 },
                { region: "Europe", percentage: 0 },
                { region: "North America", percentage: 0 },
                { region: "South America", percentage: 0 },
                { region: "Australia / Oceania", percentage: 0 }
              ],
              subFields: [
                {
                  id: "subfield_region",
                  label: "Region",
                  name: "region",
                  type: "text",
                  required: true,
                  readOnly: true
                },
                {
                  id: "subfield_percentage",
                  label: "Percentage (%)",
                  name: "percentage",
                  type: "number",
                  required: true,
                  placeholder: "Enter percentage"
                }
              ]
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
      title: "Risk & Professional Practice Details",
      subtitle: "Risk assessment and practice information",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Risk & Professional Practice Details",
          subtitle: "Professional practice and risk management information",
          fields: [
            {
              id: "field16",
              type: "dropdown",
              label: "Does the firm outsource work?",
              name: "firmOutsourcesWork",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"],
              defaultValue: "No" // Test data
            },
            {
              id: "field17",
              type: "text",
              label: "Outsourcing Details",
              name: "outsourcingDetails",
              placeholder: "Provide details if work is outsourced",
              required: false,
              isRatingParameter: false,
              conditionalLogic: {
                field: "firmOutsourcesWork",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field18",
              type: "dropdown",
              label: "Does the firm handle client funds?",
              name: "firmHandlesClientFunds",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"],
              defaultValue: "No" // Test data
            },
            {
              id: "field19",
              type: "dropdown",
              label: "Is contractual liability assumed?",
              name: "contractualLiabilityAssumed",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"],
              defaultValue: "No" // Test data
            },
            {
              id: "field20",
              type: "dropdown",
              label: "QA/QC Procedure",
              name: "qaQcProcedure",
              placeholder: "Select Yes or No",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"],
              defaultValue: "Yes" // Test data
            },
            {
              id: "field20_upload",
              type: "file",
              label: "Upload supporting document",
              name: "qaQcProcedureDocument",
              required: false,
              isRatingParameter: false,
              conditionalLogic: {
                field: "qaQcProcedure",
                condition: "equals",
                value: "Yes"
              }
            },
            {
              id: "field21",
              type: "dropdown",
              label: "Does firm use engagement letters?",
              name: "firmUsesEngagementLetters",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"],
              defaultValue: "Yes" // Test data
            },
            {
              id: "field22",
              type: "repeatable",
              label: "Top 5 Clients / Projects",
              name: "top5ClientsProjects",
              required: false,
              isRatingParameter: false,
              allowAddRemove: false,
              defaultValue: [
                { clientName: "Emaar Properties", fee: 1000000, totalConstructionValue: 50000000, applicantPortionPercentage: 2 },
                { clientName: "Dubai Properties", fee: 800000, totalConstructionValue: 40000000, applicantPortionPercentage: 2.5 },
                { clientName: "Nakheel", fee: 1200000, totalConstructionValue: 60000000, applicantPortionPercentage: 2 },
                { clientName: "Aldar Properties", fee: 900000, totalConstructionValue: 45000000, applicantPortionPercentage: 2.2 },
                { clientName: "Meraas", fee: 750000, totalConstructionValue: 35000000, applicantPortionPercentage: 2.14 }
              ], // Test data: 5 clients with complete details
              subFields: [
                {
                  id: "subfield_client_name",
                  label: "Client Name",
                  name: "clientName",
                  type: "text",
                  required: false,
                  placeholder: "Enter client name"
                },
                {
                  id: "subfield_fee",
                  label: "Fee",
                  name: "fee",
                  type: "number",
                  required: false,
                  placeholder: "Enter fee amount",
                  currencyField: "preferredCurrency"
                },
                {
                  id: "subfield_total_construction_value",
                  label: "Total Construction Value",
                  name: "totalConstructionValue",
                  type: "number",
                  required: false,
                  placeholder: "Enter total construction value",
                  currencyField: "preferredCurrency"
                },
                {
                  id: "subfield_applicant_portion",
                  label: "Value of Applicant's Portion (%)",
                  name: "applicantPortionPercentage",
                  type: "number",
                  required: false,
                  placeholder: "Enter percentage contribution"
                }
              ]
            },
            {
              id: "field23",
              type: "repeatable",
              label: "Fees Paid to Sub-consultants",
              name: "feesPaidToSubConsultants",
              required: false,
              isRatingParameter: true,
              allowAddRemove: true,
              addButtonText: "Add Sub-consultant",
              removeButtonText: "Remove",
              defaultValue: [
                { subConsultantType: "Engineering Services", subConsultantAmount: 200000, subConsultantPercentage: 4 },
                { subConsultantType: "Surveying Services", subConsultantAmount: 150000, subConsultantPercentage: 3 }
              ], // Test data: 2 sub-consultants
              subFields: [
                {
                  id: "subfield_subconsultant_type",
                  label: "Type",
                  name: "subConsultantType",
                  type: "dropdown",
                  required: true,
                  placeholder: "Select type",
                  options: [
                    "Architectural Services",
                    "Engineering Services",
                    "Surveying Services",
                    "Project Management",
                    "Other"
                  ],
                  triggerReferral: true
                },
                {
                  id: "subfield_subconsultant_other",
                  label: "Other Type Description",
                  name: "otherSubConsultantType",
                  type: "text",
                  required: true,
                  placeholder: "Please describe the type",
                  conditionalLogic: {
                    field: "subConsultantType",
                    condition: "equals",
                    value: "Other"
                  },
                  triggerReferral: true
                },
                {
                  id: "subfield_subconsultant_amount",
                  label: "Amount",
                  name: "subConsultantAmount",
                  type: "number",
                  required: true,
                  placeholder: "Enter amount",
                  currencyField: "preferredCurrency"
                },
                {
                  id: "subfield_subconsultant_percentage",
                  label: "Percentage (%)",
                  name: "subConsultantPercentage",
                  type: "number",
                  required: true,
                  placeholder: "Enter percentage"
                }
              ]
            },
            {
              id: "field24",
              type: "dropdown",
              label: "Do you require Evidence of Professional Liability Insurance for Sub-consultants?",
              name: "requireSubConsultantInsurance",
              placeholder: "Select Yes or No",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"],
              defaultValue: "Yes" // Test data
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
      subtitle: "Claim-by-claim history",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Claims History",
          subtitle: "Provide details for each claim individually. Add as many claims as needed.",
          fields: [
            {
              id: "field22",
              type: "dropdown",
              label: "Do you have any claims?",
              name: "hasClaims",
              required: true,
              isRatingParameter: false,
              options: ["Yes", "No"],
              placeholder: "Select Yes or No",
              defaultValue: "No" // Test data: no claims for claims-free rebate
            },
            {
              id: "field23",
              type: "repeatable",
              label: "Claims History",
              name: "claimsHistory",
              required: false,
              isRatingParameter: true,
              allowAddRemove: true,
              addButtonText: "Add Row",
              removeButtonText: "Remove",
              conditionalLogic: {
                field: "hasClaims",
                condition: "equals",
                value: "Yes"
              },
              subFields: [
                {
                  id: "subfield1",
                  label: "Date of Loss",
                  name: "dateOfLoss",
                  type: "date",
                  required: true,
                  placeholder: "Select date of loss"
                },
                {
                  id: "subfield2",
                  label: "Settled Amount",
                  name: "settledAmount",
                  type: "number",
                  required: false,
                  placeholder: "0"
                },
                {
                  id: "subfield3",
                  label: "Outstanding Amount",
                  name: "outstandingAmount",
                  type: "number",
                  required: false,
                  placeholder: "0"
                },
                {
                  id: "subfield4",
                  label: "Total Claim Amount",
                  name: "totalClaimAmount",
                  type: "number",
                  required: false,
                  placeholder: "Auto-calculated",
                  readOnly: true,
                  autoCalculate: "settledAmount + outstandingAmount"
                },
                {
                  id: "subfield5",
                  label: "Comments",
                  name: "comments",
                  type: "textarea",
                  required: false,
                  placeholder: "Enter any additional comments about this claim",
                  highlightOnContent: true
                },
                {
                  id: "subfield6",
                  label: "Upload Document",
                  name: "claimDocument",
                  type: "file",
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
      title: "Coverage & Limits",
      subtitle: "Coverage options and limits",
      pageType: "form",
      sections: [
        {
          id: "section5",
          title: "Coverage & Limits",
          subtitle: "Insurance coverage amounts and limits",
          fields: [
            {
              id: "field23_5",
              type: "dropdown",
              label: "Coverage Basis",
              name: "coverageBasis",
              placeholder: "Select coverage basis",
              required: true,
              isRatingParameter: true,
              options: ["Occurrence", "Claims-made", "Accident Year"],
              defaultValue: "Occurrence" // Test data
            },
            {
              id: "field24",
              type: "dropdown",
              label: "Limit of Indemnity (Any One Claim)",
              name: "limitOfIndemnity",
              placeholder: "Select limit of indemnity",
              required: true,
              isRatingParameter: true,
              options: ["0.5 m", "1 m", "1.5 m", "2 m", "2.5 m", "4 m", "5 m", "7.5 m", "10 m", "20 m", "30 m", "40 m", "50 m"],
              defaultValue: "5 m" // Test data: matches image
            },
            {
              id: "field25",
              type: "dropdown",
              label: "Aggregate Limit",
              name: "aggregateLimit",
              placeholder: "Select aggregate limit",
              required: true,
              isRatingParameter: true,
              options: ["Same as AOA", "Double aggregate limit", "Triple aggregate limit"],
              defaultValue: "Same as AOA" // Test data: matches image
            },
            {
              id: "field26",
              type: "date",
              label: "Retroactive Date Required",
              name: "retroactiveDateRequired",
              placeholder: "Select retroactive date (required when Claims-made is selected)",
              required: false,
              isRatingParameter: true,
              conditionalRequired: {
                field: "coverageBasis",
                condition: "equals",
                value: "Claims-made"
              }
            },
            {
              id: "field27",
              type: "multiselect",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: true,
              isRatingParameter: true,
              options: ["AED 10,000", "AED 20,000", "AED 30,000", "AED 40,000", "AED 50,000", "AED 75,000", "AED 100,000"],
              singleSelect: true,
              defaultValue: ["AED 10,000"] // Test data: matches pricing configurator
            },
            {
              id: "field28",
              type: "multiselect",
              label: "Extensions Required",
              name: "extensionsRequired",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Loss of documents",
                "Libel and slander",
                "Dishonesty of employees",
                "Standard TPL",
                "Exclusion of design liability",
                "Exclusion of supervision liability"
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
          type: "nextButton",
          buttonText: "Next",
          buttonAction: "next",
          buttonTargetPage: "page6"
        }
      ]
    },
    {
      id: "page6",
      title: "Quotes",
      subtitle: "Review your insurance quote",
      pageType: "quotes",
      sections: [],
      navigationFields: [
        {
          id: "nav10",
          type: "backButton",
          buttonText: "Back",
          buttonAction: "back",
          buttonTargetPage: "page5"
        },
        {
          id: "nav11",
          type: "submitButton",
          buttonText: "Submit",
          buttonAction: "submit"
        }
      ]
    }
  ];
};

