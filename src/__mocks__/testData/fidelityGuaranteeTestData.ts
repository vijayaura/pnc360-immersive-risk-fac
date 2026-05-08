/**
 * Shared Fidelity Guarantee Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getFidelityGuaranteeTestData = (): Page[] => {
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
              label: "Nature of Business",
              name: "natureOfBusiness",
              placeholder: "Select nature of business",
              required: true,
              isRatingParameter: true,
              options: [
                "Retail",
                "Banking/Finance",
                "Treasury",
                "Cash Handling",
                "Procurement",
                "Sales",
                "Administration",
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
      title: "Employee Information",
      subtitle: "Employee risk assessment and details",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Employee Information & Risk Assessment",
          subtitle: "Employee details and risk classification",
          fields: [
            {
              id: "field9",
              type: "number",
              label: "Total Number of Employees",
              name: "totalNumberOfEmployees",
              placeholder: "Enter total number of employees",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }]
            },
            {
              id: "field10",
              type: "combination",
              label: "Employee Risk Classification",
              name: "employeeRiskClassification",
              required: true,
              isRatingParameter: true,
              combinationRows: 3,
              combinationRowLabels: ["Low Risk", "Medium Risk", "High Risk"],
              subFields: [
                {
                  id: "subfield1",
                  label: "Risk Category",
                  name: "riskCategory",
                  type: "text",
                  required: true
                },
                {
                  id: "subfield2",
                  label: "Number of Employees",
                  name: "numberOfEmployees",
                  type: "number",
                  required: true
                },
                {
                  id: "subfield3",
                  label: "Job Roles",
                  name: "jobRoles",
                  type: "text",
                  required: true
                }
              ]
            },
            {
              id: "field11",
              type: "checkbox",
              label: "Cash Handling",
              name: "cashHandling",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field12",
              type: "text",
              label: "Cash Handling Details",
              name: "cashHandlingDetails",
              placeholder: "Describe cash handling activities",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field13",
              type: "checkbox",
              label: "Access to Financial Systems",
              name: "accessToFinancialSystems",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field14",
              type: "text",
              label: "Financial Systems Access Details",
              name: "financialSystemsAccessDetails",
              placeholder: "Describe financial systems access",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field15",
              type: "checkbox",
              label: "Segregation of Duties",
              name: "segregationOfDuties",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field16",
              type: "checkbox",
              label: "Strong Internal Controls",
              name: "strongInternalControls",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field17",
              type: "number",
              label: "Employee Turnover Rate (%)",
              name: "employeeTurnoverRate",
              placeholder: "Enter annual employee turnover rate",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }, { type: "max", value: 100 }]
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
      title: "Coverage Details",
      subtitle: "Sum insured and coverage limits",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Coverage Details",
          subtitle: "Insurance coverage amounts and limits",
          fields: [
            {
              id: "field18",
              type: "number",
              label: "Sum Insured per Employee",
              name: "sumInsuredPerEmployee",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field19",
              type: "number",
              label: "Sum Insured per Event",
              name: "sumInsuredPerEvent",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field20",
              type: "number",
              label: "Aggregate Limit",
              name: "aggregateLimit",
              placeholder: "Enter aggregate limit in AED (optional)",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field21",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: true,
              isRatingParameter: true,
              options: ["2,500", "5,000", "10,000"]
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
      subtitle: "3-year dishonesty/theft claims history",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Claims History",
          subtitle: "3 years dishonesty/theft claims, including employee involved, amount, and recovery details. Used for experience rating.",
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
                  id: "subfield4",
                  label: "Year",
                  name: "year",
                  type: "text",
                  required: true
                },
                {
                  id: "subfield5",
                  label: "Employee Involved",
                  name: "employeeInvolved",
                  type: "text",
                  required: false
                },
                {
                  id: "subfield6",
                  label: "Claim Amount (AED)",
                  name: "claimAmount",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield7",
                  label: "Recovery Amount (AED)",
                  name: "recoveryAmount",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield8",
                  label: "Recovery Details",
                  name: "recoveryDetails",
                  type: "text",
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
      subtitle: "Policy extensions and endorsements",
      pageType: "form",
      sections: [
        {
          id: "section5",
          title: "Coverage Required",
          subtitle: "Insurance coverage options and policy extensions",
          fields: [
            {
              id: "field23",
              type: "multiselect",
              label: "Policy Extensions",
              name: "policyExtensions",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Blanket Fidelity (all employees)",
                "Third Party Funds Extension",
                "Retroactive Cover",
                "Computer Fraud Extension"
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

