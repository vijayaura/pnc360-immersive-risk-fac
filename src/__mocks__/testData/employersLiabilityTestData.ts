/**
 * Shared Employer's Liability (EL) Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getEmployersLiabilityTestData = (): Page[] => {
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
              required: false,
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
                "Construction",
                "Manufacturing",
                "Retail",
                "Hospitality",
                "Healthcare",
                "Transportation",
                "Office/Administrative",
                "Other"
              ]
            },
            {
              id: "field8",
              type: "date",
              label: "Date of Establishment",
              name: "dateOfEstablishment",
              placeholder: "Select date of establishment",
              required: false,
              isRatingParameter: false
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
      title: "Workforce & Payroll",
      subtitle: "Core rating component",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Workforce & Payroll (Core Rating Section)",
          subtitle: "Workforce details and payroll information for rating",
          fields: [
            {
              id: "field9",
              type: "number",
              label: "Total No. of Employees",
              name: "totalNumberOfEmployees",
              placeholder: "Enter total number of employees",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }]
            },
            {
              id: "field10",
              type: "combination",
              label: "Nationalities Breakdown",
              name: "nationalitiesBreakdown",
              required: true,
              isRatingParameter: true,
              combinationRows: 5,
              combinationRowLabels: ["Nationality 1", "Nationality 2", "Nationality 3", "Nationality 4", "Nationality 5"],
              subFields: [
                {
                  id: "subfield1",
                  label: "Nationality",
                  name: "nationality",
                  type: "text",
                  required: true
                },
                {
                  id: "subfield2",
                  label: "Number of Employees",
                  name: "numberOfEmployees",
                  type: "number",
                  required: true
                }
              ]
            },
            {
              id: "field11",
              type: "combination",
              label: "Job Categories",
              name: "jobCategories",
              required: true,
              isRatingParameter: true,
              combinationRows: 7,
              combinationRowLabels: ["Admin/Clerical", "Sales", "Light Manual", "Heavy Manual", "Drivers", "Technicians", "Construction Workers"],
              subFields: [
                {
                  id: "subfield3",
                  label: "Category Name",
                  name: "categoryName",
                  type: "dropdown",
                  required: true,
                  options: ["Admin/Clerical", "Sales", "Light Manual", "Heavy Manual", "Drivers", "Technicians", "Construction Workers"]
                },
                {
                  id: "subfield4",
                  label: "No. of Employees",
                  name: "numberOfEmployees",
                  type: "number",
                  required: true
                },
                {
                  id: "subfield5",
                  label: "Annual Payroll (AED)",
                  name: "annualPayroll",
                  type: "number",
                  required: true
                }
              ]
            },
            {
              id: "field12",
              type: "number",
              label: "Estimated Annual Payroll (Basic Salary)",
              name: "estimatedAnnualPayrollBasicSalary",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field13",
              type: "number",
              label: "Estimated Annual Allowances",
              name: "estimatedAnnualAllowances",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field14",
              type: "number",
              label: "Overtime Estimate",
              name: "overtimeEstimate",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field15",
              type: "number",
              label: "Total Annual Payroll",
              name: "totalAnnualPayroll",
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
      title: "Work Nature & Operations",
      subtitle: "Work nature and operational details",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Work Nature & Operations",
          subtitle: "Work nature and operational information for rating",
          fields: [
            {
              id: "field16",
              type: "dropdown",
              label: "Work Away From Premises",
              name: "workAwayFromPremises",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field17",
              type: "dropdown",
              label: "Use of Machinery",
              name: "useOfMachinery",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field18",
              type: "textarea",
              label: "Machinery List",
              name: "machineryList",
              placeholder: "List machinery used",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field19",
              type: "dropdown",
              label: "Use of Hazardous Materials",
              name: "useOfHazardousMaterials",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field20",
              type: "textarea",
              label: "Hazardous Materials Details",
              name: "hazardousMaterialsDetails",
              placeholder: "Provide details of hazardous materials used",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field21",
              type: "dropdown",
              label: "Subcontractors Used",
              name: "subcontractorsUsed",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field22",
              type: "number",
              label: "Percentage of Subcontracted Work",
              name: "percentageSubcontractedWork",
              placeholder: "Enter percentage (0-100)",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }, { type: "max", value: 100 }]
            },
            {
              id: "field23",
              type: "textarea",
              label: "Locations of Work",
              name: "locationsOfWork",
              placeholder: "Enter locations where work is performed",
              required: true,
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
          subtitle: "Past 3 years claims history. Used for experience loading.",
          fields: [
            {
              id: "field24",
              type: "combination",
              label: "Past 3 Years Claims Table",
              name: "claimsHistory",
              required: true,
              isRatingParameter: true,
              combinationRows: 3,
              combinationRowLabels: ["2024", "2023", "2022"],
              subFields: [
                {
                  id: "subfield6",
                  label: "Number of Claims",
                  name: "numberOfClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield7",
                  label: "Total Claim Amount (AED)",
                  name: "totalClaimAmount",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield8",
                  label: "Total Premium Paid (AED)",
                  name: "totalPremiumPaid",
                  type: "number",
                  required: false
                }
              ]
            },
            {
              id: "field25",
              type: "number",
              label: "Claims Outstanding",
              name: "claimsOutstanding",
              placeholder: "Enter number of outstanding claims",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field26",
              type: "dropdown",
              label: "Has Insurance Been Declined/Cancelled?",
              name: "insuranceDeclinedCancelled",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field27",
              type: "textarea",
              label: "Decline/Cancellation Details",
              name: "declineCancellationDetails",
              placeholder: "Provide details if insurance was declined or cancelled",
              required: false,
              isRatingParameter: false
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
              id: "field28",
              type: "dropdown",
              label: "Limit of Indemnity",
              name: "limitOfIndemnity",
              placeholder: "Select limit of indemnity",
              required: true,
              isRatingParameter: true,
              options: ["1M", "2M", "5M", "10M"]
            },
            {
              id: "field29",
              type: "dropdown",
              label: "Geo Coverage",
              name: "geoCoverage",
              placeholder: "Select geographical coverage",
              required: true,
              isRatingParameter: true,
              options: ["UAE only", "GCC"]
            },
            {
              id: "field30",
              type: "multiselect",
              label: "Extensions",
              name: "extensions",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Subcontractors Coverage Clause",
                "Work Away Extension",
                "Employee Transportation Clause",
                "Terrorism Extension"
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

