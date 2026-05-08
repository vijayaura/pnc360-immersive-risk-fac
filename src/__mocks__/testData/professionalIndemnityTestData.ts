/**
 * Shared Professional Indemnity (PI) Single Project Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getProfessionalIndemnityTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Proposer & Project Information",
      subtitle: "Basic details about the proposer and project",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Proposer & Project Information",
          subtitle: "Details of the proposer and project",
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
              label: "Trade License No.",
              name: "tradeLicenseNo",
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
              label: "Email Address",
              name: "emailAddress",
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
              label: "Nature of Services Provided",
              name: "natureOfServices",
              placeholder: "Select nature of services",
              required: true,
              isRatingParameter: true,
              options: [
                "Consultants",
                "HR",
                "Training",
                "Architects",
                "Engineers",
                "IT",
                "Designers",
                "Audit",
                "Legal",
                "Medical",
                "Financial Advisory",
                "Other"
              ]
            },
            {
              id: "field8",
              type: "number",
              label: "Years of Professional Experience",
              name: "yearsOfProfessionalExperience",
              placeholder: "Enter years of experience",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field9",
              type: "number",
              label: "Number of Professionals Assigned",
              name: "numberOfProfessionalsAssigned",
              placeholder: "Enter number of professionals",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }]
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
      title: "Project Details",
      subtitle: "Core rating component",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Project Details (Core Rating Component)",
          subtitle: "Project information for rating",
          fields: [
            {
              id: "field10",
              type: "text",
              label: "Project Name",
              name: "projectName",
              placeholder: "Enter project name",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field11",
              type: "text",
              label: "Project Owner / Client",
              name: "projectOwner",
              placeholder: "Enter project owner/client name",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field12",
              type: "text",
              label: "Project Location",
              name: "projectLocation",
              placeholder: "Enter project location",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field13",
              type: "textarea",
              label: "Project Description",
              name: "projectDescription",
              placeholder: "Enter detailed project description",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field14",
              type: "dropdown",
              label: "Project Type",
              name: "projectType",
              placeholder: "Select project type",
              required: true,
              isRatingParameter: true,
              options: [
                "Construction",
                "Design",
                "Engineering",
                "Consulting",
                "IT"
              ]
            },
            {
              id: "field15",
              type: "number",
              label: "Total Project Value (Contract Value)",
              name: "totalProjectValue",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field16",
              type: "number",
              label: "Professional Fees (Contracted Fee)",
              name: "professionalFees",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field17",
              type: "number",
              label: "Project Duration (Months)",
              name: "projectDuration",
              placeholder: "Enter duration in months (1-120)",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }, { type: "max", value: 120 }]
            },
            {
              id: "field18",
              type: "date",
              label: "Start Date",
              name: "startDate",
              placeholder: "Select start date",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field19",
              type: "date",
              label: "Completion Date",
              name: "completionDate",
              placeholder: "Select completion date",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field20",
              type: "date",
              label: "Retroactive Date",
              name: "retroactiveDate",
              placeholder: "Select retroactive date (optional)",
              required: false,
              isRatingParameter: true
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
      title: "Professional Practice & Risk Controls",
      subtitle: "Risk assessment and controls",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Professional Practice & Risk Controls",
          subtitle: "Professional practice and risk management information",
          fields: [
            {
              id: "field21",
              type: "dropdown",
              label: "Use of Subcontractors",
              name: "useOfSubcontractors",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field22",
              type: "text",
              label: "Subcontractors Details",
              name: "subcontractorsDetails",
              placeholder: "Provide details if subcontractors are used",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Use of Engagement Letters / Contracts",
              name: "useOfEngagementLetters",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field24",
              type: "dropdown",
              label: "QA/QC Procedures Followed",
              name: "qaQcProcedures",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field25",
              type: "text",
              label: "QA/QC Procedures Details",
              name: "qaQcProceduresDetails",
              placeholder: "Provide details of QA/QC procedures",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field26",
              type: "dropdown",
              label: "Professional Certifications Required?",
              name: "professionalCertificationsRequired",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field27",
              type: "dropdown",
              label: "Design Responsibility?",
              name: "designResponsibility",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field28",
              type: "number",
              label: "Period of Repose / Post-Completion Liability (Years)",
              name: "periodOfRepose",
              placeholder: "Enter period in years",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
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
          subtitle: "3 years PI claims history including employee involved, amount, and recovery details. Used for experience rating.",
          fields: [
            {
              id: "field29",
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
                  label: "Number of Claims",
                  name: "numberOfClaims",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield2",
                  label: "Total Claim Amount (AED)",
                  name: "totalClaimAmount",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield3",
                  label: "Recovery Amount (AED)",
                  name: "recoveryAmount",
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
              id: "field30",
              type: "number",
              label: "Sum Insured per Employee",
              name: "sumInsuredPerEmployee",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field31",
              type: "number",
              label: "Sum Insured per Event",
              name: "sumInsuredPerEvent",
              placeholder: "Enter amount in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field32",
              type: "number",
              label: "Aggregate Limit",
              name: "aggregateLimit",
              placeholder: "Enter aggregate limit in AED (optional)",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field33",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: true,
              isRatingParameter: true,
              options: ["2,500", "5,000", "10,000"]
            },
            {
              id: "field34",
              type: "multiselect",
              label: "Policy Extensions",
              name: "policyExtensions",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Loss of Documents",
                "Dishonesty of Employees",
                "Defamation",
                "Intellectual Property",
                "Consultants/Subcontractors Clause",
                "Run-off (Tail) Extension",
                "Jurisdiction Extension (GCC/Worldwide excl. US/Canada)"
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

