/**
 * Shared Home Insurance Test Data
 * Used by both Product Factory and Broker Portal
 */

import type { Page } from '@/features/product-config/proposal-form/api/proposalFormDesign';

export const getHomeInsuranceTestData = (): Page[] => {
  return [
    {
      id: "page1",
      title: "Proposer & Property Information",
      subtitle: "Basic details about the proposer and property",
      pageType: "form",
      sections: [
        {
          id: "section1",
          title: "Proposer & Property Information",
          subtitle: "Details of the proposer and property",
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
              type: "text",
              label: "Emirates ID / Passport",
              name: "emiratesIdPassport",
              placeholder: "Enter Emirates ID or Passport number",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field3",
              type: "text",
              label: "Contact Number",
              name: "contactNumber",
              placeholder: "Enter contact number (971 format)",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "pattern", value: "^971" }]
            },
            {
              id: "field4",
              type: "text",
              label: "Email Address",
              name: "emailAddress",
              placeholder: "Enter email address",
              required: true,
              isRatingParameter: false,
              validations: [{ type: "email" }]
            },
            {
              id: "field5",
              type: "dropdown",
              label: "Property Type",
              name: "propertyType",
              placeholder: "Select property type",
              required: true,
              isRatingParameter: true,
              options: ["Apartment", "Villa", "Townhouse"]
            },
            {
              id: "field6",
              type: "text",
              label: "Location",
              name: "location",
              placeholder: "Enter property location",
              required: true,
              isRatingParameter: true
            },
            {
              id: "field7",
              type: "dropdown",
              label: "Occupancy Type",
              name: "occupancyType",
              placeholder: "Select occupancy type",
              required: true,
              isRatingParameter: true,
              options: ["Owner-Occupied", "Tenant", "Rented Out"]
            },
            {
              id: "field8",
              type: "number",
              label: "No. of Occupants",
              name: "numberOfOccupants",
              placeholder: "Enter number of occupants",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 1 }]
            },
            {
              id: "field9",
              type: "number",
              label: "Year of Construction",
              name: "yearOfConstruction",
              placeholder: "Enter year of construction (YYYY)",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 1900 }, { type: "max", value: 2100 }]
            },
            {
              id: "field10",
              type: "dropdown",
              label: "Security Measures",
              name: "securityMeasures",
              placeholder: "Select security measures",
              required: true,
              isRatingParameter: true,
              options: ["CCTV", "Alarm", "Guard", "None"]
            },
            {
              id: "field11",
              type: "dropdown",
              label: "Fire Protection",
              name: "fireProtection",
              placeholder: "Select fire protection measures",
              required: true,
              isRatingParameter: true,
              options: ["Detectors", "Extinguishers", "Sprinklers", "None"]
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
      title: "Sum Insured Breakdown",
      subtitle: "Sum insured details for different sections",
      pageType: "form",
      sections: [
        {
          id: "section2",
          title: "Sum Insured Breakdown",
          subtitle: "Sum insured amounts for different coverage sections",
          fields: [
            {
              id: "field12",
              type: "number",
              label: "Building SI (If Owner Occupied)",
              name: "buildingSI",
              placeholder: "Enter building sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field13",
              type: "number",
              label: "Contents SI",
              name: "contentsSI",
              placeholder: "Enter contents sum insured in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field14",
              type: "number",
              label: "Personal Belongings SI",
              name: "personalBelongingsSI",
              placeholder: "Enter personal belongings sum insured in AED",
              required: true,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field15",
              type: "number",
              label: "Jewellery at Home SI",
              name: "jewelleryAtHomeSI",
              placeholder: "Enter jewellery at home sum insured in AED",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field16",
              type: "number",
              label: "Jewellery Outside SI",
              name: "jewelleryOutsideSI",
              placeholder: "Enter jewellery outside sum insured in AED",
              required: false,
              isRatingParameter: false,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field17",
              type: "number",
              label: "Art & Collectibles SI",
              name: "artCollectiblesSI",
              placeholder: "Enter art & collectibles sum insured in AED",
              required: false,
              isRatingParameter: true,
              validations: [{ type: "min", value: 0 }]
            },
            {
              id: "field18",
              type: "number",
              label: "Total SI",
              name: "totalSI",
              placeholder: "Auto-calculated total sum insured",
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
      title: "Exposure & Risk Questions",
      subtitle: "Exposure and risk assessment",
      pageType: "form",
      sections: [
        {
          id: "section3",
          title: "Exposure & Risk Questions",
          subtitle: "Exposure and risk information for rating",
          fields: [
            {
              id: "field19",
              type: "dropdown",
              label: "Claims in Last 3 Years",
              name: "claimsInLast3Years",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field20",
              type: "textarea",
              label: "Claims Details",
              name: "claimsDetails",
              placeholder: "Provide details of claims if yes",
              required: false,
              isRatingParameter: false
            },
            {
              id: "field21",
              type: "dropdown",
              label: "Water Leakage History",
              name: "waterLeakageHistory",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field22",
              type: "dropdown",
              label: "Neighbouring Construction",
              name: "neighbouringConstruction",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field23",
              type: "dropdown",
              label: "Pets at Home",
              name: "petsAtHome",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field24",
              type: "dropdown",
              label: "Short-Term Rental (e.g. Airbnb)",
              name: "shortTermRental",
              placeholder: "Select yes or no",
              required: true,
              isRatingParameter: true,
              options: ["Yes", "No"]
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
              id: "field25",
              type: "dropdown",
              label: "Contents Cover Type",
              name: "contentsCoverType",
              placeholder: "Select contents cover type",
              required: true,
              isRatingParameter: true,
              options: ["Named Perils", "All Risks"]
            },
            {
              id: "field26",
              type: "dropdown",
              label: "Accidental Damage",
              name: "accidentalDamage",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field27",
              type: "dropdown",
              label: "Tenant Liability",
              name: "tenantLiability",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field28",
              type: "dropdown",
              label: "Owners Liability",
              name: "ownersLiability",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: true,
              options: ["Yes", "No"]
            },
            {
              id: "field29",
              type: "dropdown",
              label: "Personal Liability Limit",
              name: "personalLiabilityLimit",
              placeholder: "Select personal liability limit",
              required: false,
              isRatingParameter: false,
              options: ["500K", "1M", "2M"]
            },
            {
              id: "field30",
              type: "dropdown",
              label: "Home Assistance Cover",
              name: "homeAssistanceCover",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field31",
              type: "dropdown",
              label: "Worldwide Personal Belongings",
              name: "worldwidePersonalBelongings",
              placeholder: "Select yes or no",
              required: false,
              isRatingParameter: false,
              options: ["Yes", "No"]
            },
            {
              id: "field32",
              type: "dropdown",
              label: "Deductible",
              name: "deductible",
              placeholder: "Select deductible amount",
              required: true,
              isRatingParameter: true,
              options: ["250", "500", "1,000", "2,500"]
            },
            {
              id: "field33",
              type: "multiselect",
              label: "Extensions Required",
              name: "extensionsRequired",
              placeholder: "Select optional extensions",
              required: false,
              isRatingParameter: true,
              options: [
                "Accidental Damage Extension",
                "Tenant Liability",
                "Owners Liability",
                "Personal Belongings Worldwide",
                "Jewellery Worldwide",
                "Terrorism Cover",
                "Domestic Helper Liability"
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

