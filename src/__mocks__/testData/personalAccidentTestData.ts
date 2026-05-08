/**
 * Shared Personal Accident (PA) Insurance Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getPersonalAccidentTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Proposer & Insured Details",
      subtitle: "Basic details about the proposer and insured",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Proposer & Insured Details",
          subtitle: "Details of the proposer and insured person",
          fields: [
            {
              id: "field1",
              type: "text",
              label: "Insured Name",
              name: "insuredName",
              placeholder: "Enter insured name",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "minLength", value: 2 }]
            },
            {
              id: "field2",
              type: "date",
              label: "Date of Birth",
              name: "dateOfBirth",
              placeholder: "Select date of birth",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field3",
              type: "dropdown",
              label: "Gender",
              name: "gender",
              placeholder: "Select gender",
              required: false,
              isRatingParameter: false,
              options: ["Male", "Female"]
            },
            {
              id: "field4",
              type: "text",
              label: "Nationality",
              name: "nationality",
              placeholder: "Enter nationality",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field5",
              type: "text",
              label: "Occupation",
              name: "occupation",
              placeholder: "Enter occupation",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field6",
              type: "textarea",
              label: "Nature of Duties",
              name: "natureOfDuties",
              placeholder: "Describe nature of duties",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field7",
              type: "text",
              label: "Employer Name",
              name: "employerName",
              placeholder: "Enter employer name",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field8",
              type: "text",
              label: "Contact Email",
              name: "contactEmail",
              placeholder: "Enter email address",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "email" }]
            },
            {
              id: "field9",
              type: "text",
              label: "Mobile Number",
              name: "mobileNumber",
              placeholder: "Enter mobile number (971 format)",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "pattern", value: "^971" }]
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
      title: "Benefit Structure",
      subtitle: "Insurance benefits and coverage options",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Benefit Structure",
          subtitle: "Select benefit structure and coverage options",
          fields: [
            {
              id: "field10",
              type: "dropdown",
              label: "Capital Benefit (Accidental Death)",
              name: "capitalBenefit",
              placeholder: "Select capital benefit amount",
              required: true,
              isRatingParameter: true,
              options: ["50K", "100K", "250K", "500K", "1M"]
            },
            {
              id: "field11",
              type: "dropdown",
              label: "Permanent Disability",
              name: "permanentDisability",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field12",
              type: "dropdown",
              label: "Permanent Disability Percentage",
              name: "permanentDisabilityPercentage",
              placeholder: "Select percentage of capital sum",
              required: false,
              isRatingParameter: true,
              options: ["50%", "75%", "100%"]
            },
            {
              id: "field13",
              type: "dropdown",
              label: "Temporary Total Disability (TTD) Weekly Benefit",
              name: "ttdWeeklyBenefit",
              placeholder: "Select weekly benefit amount",
              required: false,
              isRatingParameter: true,
              options: ["250", "500", "750", "1000"]
            },
            {
              id: "field14",
              type: "dropdown",
              label: "Medical Expenses Limit",
              name: "medicalExpensesLimit",
              placeholder: "Select medical expenses limit",
              required: false,
              isRatingParameter: true,
              options: ["5K", "10K", "25K", "50K"]
            },
            {
              id: "field15",
              type: "dropdown",
              label: "Repatriation Benefit",
              name: "repatriationBenefit",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Family Extension Required",
              name: "familyExtensionRequired",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field17",
              type: "dropdown",
              label: "Geographical Scope",
              name: "geographicalScope",
              placeholder: "Select geographical scope",
              required: true,
              isRatingParameter: true,
              options: ["UAE Only", "Worldwide"]
            },
            {
              id: "field18",
              type: "dropdown",
              label: "24-Hour Cover",
              name: "twentyFourHourCover",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field19",
              type: "dropdown",
              label: "Occupational Only Cover",
              name: "occupationalOnlyCover",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
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
      title: "Exposure & Hazard Questions",
      subtitle: "Exposure and hazard assessment",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Exposure & Hazard Questions",
          subtitle: "Exposure and hazard information for rating",
          fields: [
            {
              id: "field20",
              type: "dropdown",
              label: "Engages in Manual Work",
              name: "engagesInManualWork",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field21",
              type: "dropdown",
              label: "Handles Machinery or Tools",
              name: "handlesMachineryOrTools",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field22",
              type: "dropdown",
              label: "Travelling for Work",
              name: "travellingForWork",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Adventure Sports Activities",
              name: "adventureSportsActivities",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field24",
              type: "textarea",
              label: "Adventure Sports Details",
              name: "adventureSportsDetails",
              placeholder: "Provide details of adventure sports activities if yes",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field25",
              type: "dropdown",
              label: "Existing Disability",
              name: "existingDisability",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field26",
              type: "textarea",
              label: "Existing Disability Details",
              name: "existingDisabilityDetails",
              placeholder: "Provide details of existing disability if yes",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field27",
              type: "dropdown",
              label: "Previous PA Claims (3 Years)",
              name: "previousPAClaims",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field28",
              type: "textarea",
              label: "Previous PA Claims Details",
              name: "previousPAClaimsDetails",
              placeholder: "Provide details of previous PA claims if yes",
              required: false,
              isRatingParameter: false
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
      title: "Policy Options",
      subtitle: "Policy customization options",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Policy Options",
          subtitle: "Policy plan and extension options",
          fields: [
            {
              id: "field29",
              type: "dropdown",
              label: "Plan Type",
              name: "planType",
              placeholder: "Select plan type",
              required: true,
              isRatingParameter: true,
              options: ["Bronze", "Silver", "Gold", "Platinum"]
            },
            {
              id: "field30",
              type: "dropdown",
              label: "Add Spouse",
              name: "addSpouse",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field31",
              type: "dropdown",
              label: "Add Children",
              name: "addChildren",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field32",
              type: "number",
              label: "Number of Children",
              name: "numberOfChildren",
              placeholder: "Enter number of children",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field33",
              type: "dropdown",
              label: "Deductible for Medical Expenses",
              name: "deductibleForMedicalExpenses",
              placeholder: "Select deductible amount",
              required: false,
              isRatingParameter: true,
              options: ["0", "100", "250", "500"]
            },
            {
              id: "field34",
              type: "multiselect",
              label: "Extensions Required",
              name: "extensionsRequired",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Adventure Sports Extension",
                "Motorcycling Extension",
                "Worldwide Cover",
                "Winter Sports",
                "Family Extension (Spouse/Children)",
                "Double Indemnity for AD",
                "Terrorism Cover"
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

