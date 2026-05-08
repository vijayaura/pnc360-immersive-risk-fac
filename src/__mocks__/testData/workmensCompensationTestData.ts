/**
 * Shared Workmen's Compensation (WC) Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getWorkmensCompensationTestData = (): Page[] => {
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
          subtitle: "Details of the applicant",
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
              label: "Business Address",
              name: "businessAddress",
              placeholder: "Enter full business address",
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
              label: "Business Activity / Occupation",
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
      title: "Workforce & Payroll",
      subtitle: "Core rating information",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Workforce & Payroll (Core Rating Section)",
          subtitle: "Workforce details and payroll information",
          fields: [
            {
              id: "field9",
              type: "number",
              label: "Total Number of Workmen",
              name: "totalNumberOfWorkmen",
              placeholder: "Enter total number of workmen",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }]
            },
            {
              id: "field10",
              type: "combination",
              label: "Nationality Breakdown",
              name: "nationalityBreakdown",
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
                  label: "Number of Workmen",
                  name: "numberOfWorkmen",
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
              combinationRows: 6,
              combinationRowLabels: ["Admin", "Light Manual", "Heavy Manual", "Driver", "Technician", "Construction"],
              subFields: [
                {
                  id: "subfield3",
                  label: "Category Name",
                  name: "categoryName",
                  type: "dropdown",
                  required: true,
                  options: ["Admin", "Light Manual", "Heavy Manual", "Driver", "Technician", "Construction"]
                },
                {
                  id: "subfield4",
                  label: "No. of Workmen",
                  name: "numberOfWorkmen",
                  type: "number",
                  required: true
                },
                {
                  id: "subfield5",
                  label: "Payroll (AED)",
                  name: "payroll",
                  type: "number",
                  required: true
                }
              ]
            },
            {
              id: "field12",
              type: "number",
              label: "Estimated Basic Salary (Annual)",
              name: "estimatedBasicSalary",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field13",
              type: "number",
              label: "Estimated Allowances (Annual)",
              name: "estimatedAllowances",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field14",
              type: "number",
              label: "Estimated Overtime",
              name: "estimatedOvertime",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field15",
              type: "number",
              label: "Total Estimated Annual Payroll",
              name: "totalEstimatedAnnualPayroll",
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
      title: "Work Conditions & Risks",
      subtitle: "Workplace conditions and risk factors",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Work Conditions & Risks",
          subtitle: "Workplace conditions and risk assessment",
          fields: [
            {
              id: "field16",
              type: "dropdown",
              label: "Use of Machinery",
              name: "useOfMachinery",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field17",
              type: "text",
              label: "Machinery Details",
              name: "machineryDetails",
              placeholder: "Provide details if machinery is used",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field18",
              type: "dropdown",
              label: "Use of Dangerous Substances",
              name: "useOfDangerousSubstances",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field19",
              type: "text",
              label: "Dangerous Substances Details",
              name: "dangerousSubstancesDetails",
              placeholder: "Provide details if dangerous substances are used",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field20",
              type: "dropdown",
              label: "Use of Contractors/Subcontractors",
              name: "useOfContractors",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field21",
              type: "number",
              label: "Percentage of Subcontracted Work",
              name: "percentageSubcontractedWork",
              placeholder: "Enter percentage (0-100)",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }, { type: "max", value: 100 }]
            },
            {
              id: "field22",
              type: "text",
              label: "Project / Worksite Locations",
              name: "worksiteLocations",
              placeholder: "Enter project and worksite locations",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Transporting Workmen in Vehicles",
              name: "transportingWorkmen",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field24",
              type: "text",
              label: "Transportation Details",
              name: "transportationDetails",
              placeholder: "Provide details if workmen are transported",
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
          subtitle: "3-year WC claims history including fatal, permanent disability, temporary disability, outstanding claims, and total compensation paid. Used for experience rating.",
          fields: [
            {
              id: "field25",
              type: "combination",
              label: "Claims History",
              name: "claimsHistory",
              required: false,
              isRatingParameter: true,
              combinationRows: 3,
              combinationRowLabels: ["2024", "2023", "2022"],
              subFields: [
                {
                  id: "subfield6",
                  label: "Year",
                  name: "year",
                  type: "text",
                  required: true
                },
                {
                  id: "subfield7",
                  label: "Fatal Claims",
                  name: "fatalClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield8",
                  label: "Permanent Disability",
                  name: "permanentDisability",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield9",
                  label: "Temporary Disability",
                  name: "temporaryDisability",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield10",
                  label: "Outstanding Claims",
                  name: "outstandingClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield11",
                  label: "Total Compensation Paid (AED)",
                  name: "totalCompensationPaid",
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
              id: "field26",
              type: "dropdown",
              label: "Include Subcontractors?",
              name: "includeSubcontractors",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field27",
              type: "dropdown",
              label: "Include Non-Law Employees?",
              name: "includeNonLawEmployees",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field28",
              type: "dropdown",
              label: "Geographical Limit",
              name: "geographicalLimit",
              placeholder: "Select geographical limit",
              required: true,
              isRatingParameter: false,
              options: ["UAE only"]
            },
            {
              id: "field29",
              type: "multiselect",
              label: "Extensions",
              name: "extensions",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Subcontractor Liability Inclusion",
                "Transportation of Workers Clause",
                "Non-Law Staff Inclusion",
                "Riot/Strike/Commotion Extension",
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
