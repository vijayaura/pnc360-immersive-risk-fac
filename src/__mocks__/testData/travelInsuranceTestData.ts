/**
 * Shared Travel Insurance Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getTravelInsuranceTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Traveller Information",
      subtitle: "Basic details about the traveller(s)",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Traveller Information",
          subtitle: "Details of the primary traveller and travelling party",
          fields: [
            {
              id: "field1",
              type: "text",
              label: "Primary Traveller Name",
              name: "primaryTravellerName",
              placeholder: "Enter primary traveller name",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "minLength", value: 2 }]
            },
            {
              id: "field2",
              type: "text",
              label: "Email Address",
              name: "emailAddress",
              placeholder: "Enter email address",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "email" }]
            },
            {
              id: "field3",
              type: "text",
              label: "Mobile Number",
              name: "mobileNumber",
              placeholder: "Enter mobile number (971 format)",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "pattern", value: "^971" }]
            },
            {
              id: "field4",
              type: "date",
              label: "Date of Birth",
              name: "dateOfBirth",
              placeholder: "Select date of birth",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field5",
              type: "text",
              label: "Nationality",
              name: "nationality",
              placeholder: "Enter nationality",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field6",
              type: "dropdown",
              label: "UAE Residency Status",
              name: "uaeResidencyStatus",
              placeholder: "Select residency status",
              required: true,
              isRatingParameter: true,
              options: ["Resident", "Visitor"]
            },
            {
              id: "field7",
              type: "number",
              label: "Number of Travellers",
              name: "numberOfTravellers",
              placeholder: "Enter number of travellers (1-10)",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }, { type: "max", value: 10 }]
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
      title: "Trip Details",
      subtitle: "Trip information and destination",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Trip Details",
          subtitle: "Trip details for rating",
          fields: [
            {
              id: "field8",
              type: "dropdown",
              label: "Trip Type",
              name: "tripType",
              placeholder: "Select trip type",
              required: true,
              isRatingParameter: true,
              options: ["Single", "Annual Multi-trip"]
            },
            {
              id: "field9",
              type: "dropdown",
              label: "Destination Region",
              name: "destinationRegion",
              placeholder: "Select destination region",
              required: true,
              isRatingParameter: true,
              options: ["Worldwide", "Europe", "Schengen", "GCC", "Asia"]
            },
            {
              id: "field10",
              type: "date",
              label: "Departure Date",
              name: "departureDate",
              placeholder: "Select departure date",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field11",
              type: "date",
              label: "Return Date",
              name: "returnDate",
              placeholder: "Select return date",
              required: true,
              isRatingParameter: false
            },
            {
              id: "field12",
              type: "number",
              label: "Trip Duration (Days)",
              name: "tripDuration",
              placeholder: "Auto-calculated trip duration in days",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1 }]
            },
            {
              id: "field13",
              type: "dropdown",
              label: "Purpose of Travel",
              name: "purposeOfTravel",
              placeholder: "Select purpose of travel",
              required: true,
              isRatingParameter: true,
              options: ["Leisure", "Business", "Adventure"]
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
      title: "Medical & Risk Questions",
      subtitle: "Medical and risk assessment",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Medical & Risk Questions",
          subtitle: "Medical and risk information for rating",
          fields: [
            {
              id: "field14",
              type: "dropdown",
              label: "Pre-existing Medical Conditions",
              name: "preExistingMedicalConditions",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field15",
              type: "textarea",
              label: "Pre-existing Medical Conditions Details",
              name: "preExistingMedicalConditionsDetails",
              placeholder: "Provide details of pre-existing medical conditions if yes",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field16",
              type: "dropdown",
              label: "Adventure Activities",
              name: "adventureActivities",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field17",
              type: "textarea",
              label: "Adventure Activities Details",
              name: "adventureActivitiesDetails",
              placeholder: "Provide details of adventure activities if yes",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field18",
              type: "dropdown",
              label: "Travel to Sanctioned Countries",
              name: "travelToSanctionedCountries",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field19",
              type: "dropdown",
              label: "Previous Travel Claims (3 years)",
              name: "previousTravelClaims",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field20",
              type: "textarea",
              label: "Previous Travel Claims Details",
              name: "previousTravelClaimsDetails",
              placeholder: "Provide details of previous travel claims if yes",
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
      title: "Coverage Selection",
      subtitle: "Coverage options and limits",
      pageType: "form",
      sections: [
        {
          id: "section4",
          title: "Coverage Selection",
          subtitle: "Insurance coverage and extension options",
          fields: [
            {
              id: "field21",
              type: "dropdown",
              label: "Plan Type",
              name: "planType",
              placeholder: "Select plan type",
              required: true,
              isRatingParameter: true,
              options: ["Basic", "Standard", "Premium"]
            },
            {
              id: "field22",
              type: "dropdown",
              label: "Medical Cover Limit",
              name: "medicalCoverLimit",
              placeholder: "Select medical cover limit",
              required: true,
              isRatingParameter: true,
              options: ["100K", "250K", "500K", "1M"]
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Baggage Cover",
              name: "baggageCover",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field24",
              type: "dropdown",
              label: "Trip Cancellation",
              name: "tripCancellation",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field25",
              type: "dropdown",
              label: "Adventure Sports Extension",
              name: "adventureSportsExtension",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field26",
              type: "dropdown",
              label: "Pre-existing Condition Extension",
              name: "preExistingConditionExtension",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field27",
              type: "dropdown",
              label: "Geographical Upgrade",
              name: "geographicalUpgrade",
              placeholder: "Select geographical upgrade",
              required: false,
              isRatingParameter: true,
              options: ["Worldwide incl. USA/Canada", "Worldwide excl. USA/Canada"]
            },
            {
              id: "field28",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: false,
              isRatingParameter: true,
              options: ["0", "100", "250", "500"]
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

