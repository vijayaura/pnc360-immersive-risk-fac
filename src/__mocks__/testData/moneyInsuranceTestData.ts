/**
 * Shared Money Insurance Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getMoneyInsuranceTestData = (): Page[] => {
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
              options: ["Retail", "Wholesale", "Banking", "Financial Services", "Jewelry", "Cash Transport", "Other"]
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
      title: "Money Exposure Details",
      subtitle: "Core rating information",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Money Exposure Details (Core Rating)",
          subtitle: "Cash handling and exposure information",
          fields: [
            {
              id: "field9",
              type: "number",
              label: "Cash in Transit - Max Amount per Trip",
              name: "citMaxAmountPerTrip",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field10",
              type: "number",
              label: "Cash in Transit - Estimated Annual Carry",
              name: "citEstimatedAnnualCarry",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field11",
              type: "number",
              label: "Cash in Safe - Maximum Overnight Amount",
              name: "cashInSafeMaxOvernight",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field12",
              type: "number",
              label: "Cash in Counter - Maximum Day Amount",
              name: "cashInCounterMaxDay",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field13",
              type: "dropdown",
              label: "Type of Safe",
              name: "typeOfSafe",
              placeholder: "Select safe type",
              required: false,
              isRatingParameter: true,
              options: ["S1", "S2", "TL15", "TL30", "None"]
            },
            {
              id: "field14",
              type: "number",
              label: "No. of Staff Handling Cash",
              name: "staffHandlingCash",
              placeholder: "Enter number of staff",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field15",
              type: "dropdown",
              label: "Armored Vehicle Used?",
              name: "armoredVehicleUsed",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Cash Collection Frequency",
              name: "cashCollectionFrequency",
              placeholder: "Select frequency",
              required: false,
              isRatingParameter: true,
              options: ["Daily", "Weekly", "Other"]
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
      title: "Security Protections",
      subtitle: "COPE (Construction, Occupancy, Protection, Exposure)",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Security Protections (COPE)",
          subtitle: "Security measures and protections",
          fields: [
            {
              id: "field17",
              type: "dropdown",
              label: "Alarm System",
              name: "alarmSystem",
              placeholder: "Select alarm system type",
              required: false,
              isRatingParameter: true,
              options: ["Monitored", "Local Alarm", "None"]
            },
            {
              id: "field18",
              type: "dropdown",
              label: "CCTV Coverage",
              name: "cctvCoverage",
              placeholder: "Select CCTV coverage",
              required: false,
              isRatingParameter: true,
              options: ["Full", "Partial", "None"]
            },
            {
              id: "field19",
              type: "dropdown",
              label: "Security Guards",
              name: "securityGuards",
              placeholder: "Select security guard coverage",
              required: false,
              isRatingParameter: true,
              options: ["24/7", "Daytime", "None"]
            },
            {
              id: "field20",
              type: "dropdown",
              label: "Dual Custody for Cash Movement",
              name: "dualCustodyCashMovement",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field21",
              type: "text",
              label: "Cash Handling Procedures",
              name: "cashHandlingProcedures",
              placeholder: "Describe cash handling procedures",
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
          subtitle: "3-year loss history (theft, robbery, employee dishonesty). Used for experience rating.",
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
                  id: "subfield2",
                  label: "Claim Count",
                  name: "claimCount",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield3",
                  label: "Amount (AED)",
                  name: "amount",
                  type: "number",
                  required: false
                },
                {
                  id: "subfield4",
                  label: "Description",
                  name: "description",
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
      subtitle: "Sum insured and deductible details",
      pageType: "form",
      sections: [
        {
          id: "section5",
          title: "Coverage Required",
          subtitle: "Insurance coverage and sum insured details",
          fields: [
            {
              id: "field23",
              type: "number",
              label: "Cash in Transit Sum Insured",
              name: "citSumInsured",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field24",
              type: "number",
              label: "Cash in Safe Sum Insured",
              name: "cashInSafeSumInsured",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field25",
              type: "number",
              label: "Cash in Premises (Day) SI",
              name: "cashInPremisesDaySI",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field26",
              type: "number",
              label: "Cash in ATM SI",
              name: "cashInATMSI",
              placeholder: "Enter amount in AED",
              required: false,
              isRatingParameter: true
            },
            {
              id: "field27",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: false,
              isRatingParameter: true,
              options: ["1,000", "2,500", "5,000", "10,000"]
            },
            {
              id: "field28",
              type: "multiselect",
              label: "Additional Extensions",
              name: "additionalExtensions",
              placeholder: "Select additional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "ATM Coverage",
                "Increased Limit for CIT",
                "Terrorism/Political Violence Extension",
                "Riot & Strike Damage",
                "Employee Dishonesty (add-on)"
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

