import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import {
  ArrowLeft,
  Save,
  Plus,
  Trash2,
  Edit,
  Eye,
  GripVertical,
  FileText,
  Type,
  Hash,
  Calendar,
  CheckSquare,
  Upload,
  List,
  ChevronDown,
  ChevronRight,
  MapPin,
  CalendarDays,
  MousePointer2,
  ArrowRight,
  ArrowLeft as ArrowLeftIcon,
  Send,
  Circle,
  Maximize2,
  Minimize2,
  Download,
  CheckCircle2,
} from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  SelectScrollUpButton,
  SelectScrollDownButton,
} from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { getDateFieldDefaultValue } from '@/features/product-config/proposal-form/utils/dateDefaults';
import { LocationPreviewField } from '@/features/product-config/proposal-form/components/LocationPreviewField';


type FieldType =
  | 'text'
  | 'number'
  | 'dropdown'
  | 'date'
  | 'textarea'
  | 'checkbox'
  | 'file'
  | 'multiselect'
  | 'location'
  | 'combination'
  | 'chooseButton'
  | 'nextButton'
  | 'backButton'
  | 'submitButton'
  | 'button';

interface FieldValidation {
  type: string;
  value?: string | number;
  message?: string;
}

interface SubField {
  id: string;
  label: string;
  name: string;
  type: 'text' | 'number' | 'date' | 'time' | 'location' | 'dropdown' | 'checkbox';
  placeholder?: string;
  required?: boolean;
  options?: string[]; // For dropdown
  optionsUrl?: string; // For dropdown
  mapProvider?: string;
  mapApiUrl?: string;
  mapApiKey?: string;
}

interface CombinationRow {
  id: string;
  values: Record<string, string | number>; // key is subField.name, value is the input value
}

interface Field {
  id: string;
  type: FieldType;
  label: string;
  name: string;
  placeholder?: string;
  defaultValue?: string | number | boolean | string[]; // Default value for the field
  required?: boolean;
  isRatingParameter?: boolean;
  isMasterData?: boolean;
  validations?: FieldValidation[];
  conditionalLogic?: {
    field: string;
    condition: string;
    value: string;
  };
  options?: string[]; // For dropdown/multiselect (static options)
  optionsUrl?: string; // URL to fetch options from
  dependentOn?: string; // Field name this dropdown depends on
  dependentOptions?: Record<string, string[]>; // Key-value mapping: parentValue -> [childOptions]
  dependentOptionsUrl?: string; // URL to fetch dependent options mapping from
  masterDataTable?: string; // For master data fields
  subFields?: SubField[]; // For combination field type - array of sub-fields
  combinationRows?: number; // Number of rows to display for combination field
  combinationRowLabels?: string[]; // Optional labels for each row (e.g., ["2025", "2024", "2023"])
  // Button-specific properties
  buttonText?: string; // Text to display on button
  buttonAction?: 'submit' | 'next' | 'back' | 'custom' | 'api'; // Action type for button
  buttonApiUrl?: string; // API URL for submitting/navigating
  buttonVariant?: 'default' | 'outline' | 'destructive' | 'secondary' | 'ghost' | 'link'; // Button style variant
  buttonTargetPage?: string; // Target page ID for next/back navigation
}

interface Section {
  id: string;
  title?: string;
  subtitle?: string;
  fields: Field[];
}

type PageType = 'form'; // Administration forms only support form pages

interface Page {
  id: string;
  title: string;
  subtitle?: string;
  pageType: PageType; // Always "form" for administration forms
  sections: Section[]; // Required for form pages
  navigationFields?: Field[]; // Optional Next/Back buttons for the page
}

// Test data removed - Administration forms start with empty structure
// const getCARTestData = (): Page[] => {
//   return [
//     {
//       id: "page1",
//       title: "Company Information",
//       subtitle: "Basic details about the insured company",
//       pageType: "form" as PageType,
//       sections: [
//         {
//           id: "section1",
//           title: "Company Details",
//           subtitle: "Legal and registration information",
//           fields: [
//             {
//               id: "field1",
//               type: "text",
//               label: "Company Name",
//               name: "companyName",
//               placeholder: "Enter company name",
//               required: true,
//               validations: [{ type: "minLength", value: 3 }],
//             },
//             {
//               id: "field2",
//               type: "text",
//               label: "Registration Number",
//               name: "registrationNumber",
//               placeholder: "Enter registration number",
//               required: true,
//             },
//             {
//               id: "field3",
//               type: "text",
//               label: "Business Address",
//               name: "businessAddress",
//               placeholder: "Enter full business address",
//               required: true,
//             },
//             {
//               id: "field4",
//               type: "dropdown",
//               label: "Country",
//               name: "country",
//               placeholder: "Select country",
//               required: true,
//               options: ["UAE", "Saudi Arabia", "Kuwait", "Oman", "Qatar", "Bahrain"],
//             },
//             {
//               id: "field5",
//               type: "text",
//               label: "City",
//               name: "city",
//               placeholder: "Enter city",
//               required: true,
//               dependentOn: "country",
//               dependentOptions: {
//                 UAE: ["Dubai", "Abu Dhabi", "Sharjah", "Ajman"],
//                 "Saudi Arabia": ["Riyadh", "Jeddah", "Dammam", "Mecca"],
//                 Kuwait: ["Kuwait City", "Al Ahmadi", "Hawalli"],
//                 Oman: ["Muscat", "Salalah", "Sohar"],
//                 Qatar: ["Doha", "Al Rayyan", "Al Wakrah"],
//                 Bahrain: ["Manama", "Riffa", "Muharraq"],
//               },
//             },
//             {
//               id: "field6",
//               type: "text",
//               label: "Phone Number",
//               name: "phoneNumber",
//               placeholder: "+971 XX XXX XXXX",
//               required: true,
//               validations: [{ type: "phone" }],
//             },
//             {
//               id: "field7",
//               type: "text",
//               label: "Email Address",
//               name: "emailAddress",
//               placeholder: "company@example.com",
//               required: true,
//               validations: [{ type: "email" }],
//             },
//             {
//               id: "field8",
//               type: "number",
//               label: "Years in Business",
//               name: "yearsInBusiness",
//               placeholder: "Enter number of years",
//               required: true,
//               validations: [{ type: "min", value: 1 }, { type: "integer" }],
//             },
//             {
//               id: "field9",
//               type: "dropdown",
//               label: "Type of Business",
//               name: "businessType",
//               placeholder: "Select business type",
//               required: true,
//               options: [
//                 "Construction",
//                 "Civil Engineering",
//                 "MEP Contracting",
//                 "Specialized Trade",
//                 "General Contractor",
//                 "Developer",
//               ],
//             },
//           ],
//         },
//       ],
//       // Add Next button at the end of page 1
//       navigationFields: [
//         {
//           id: "nav1",
//           type: "nextButton",
//           label: "Next",
//           name: "nextToPage2",
//           buttonText: "Next",
//           buttonVariant: "default",
//           buttonTargetPage: "page2",
//           buttonApiUrl: "https://api.example.com/proposals/save-page",
//         },
//       ],
//     },
//     {
//       id: "page2",
//       title: "Project Information",
//       subtitle: "Details about the construction project",
//       sections: [
//         {
//           id: "section2",
//           title: "Project Details",
//           subtitle: "Basic project information",
//           fields: [
//             {
//               id: "field10",
//               type: "text",
//               label: "Project Name",
//               name: "projectName",
//               placeholder: "Enter project name",
//               required: true,
//             },
//             {
//               id: "field11",
//               type: "dropdown",
//               label: "Project Type",
//               name: "projectType",
//               placeholder: "Select project type",
//               required: true,
//               options: [
//                 "Residential",
//                 "Commercial",
//                 "Industrial",
//                 "Infrastructure",
//                 "Mixed Use",
//                 "Hospitality",
//               ],
//             },
//             {
//               id: "field12",
//               type: "number",
//               label: "Project Value (AED)",
//               name: "projectValue",
//               placeholder: "Enter project value",
//               required: true,
//               validations: [{ type: "min", value: 100000 }],
//             },
//             {
//               id: "field13",
//               type: "dropdown",
//               label: "Construction Type",
//               name: "constructionType",
//               placeholder: "Select construction type",
//               required: true,
//               options: ["New Construction", "Renovation", "Extension", "Demolition", "Mixed"],
//             },
//             {
//               id: "field14",
//               type: "date",
//               label: "Project Start Date",
//               name: "projectStartDate",
//               required: true,
//               validations: [{ type: "minDateToday" }],
//             },
//             {
//               id: "field15",
//               type: "date",
//               label: "Expected Completion Date",
//               name: "projectCompletionDate",
//               required: true,
//               validations: [{ type: "minDate" }],
//               conditionalLogic: {
//                 field: "projectStartDate",
//                 condition: "greater_than",
//                 value: "",
//               },
//             },
//             {
//               id: "field16",
//               type: "location",
//               label: "Project Location",
//               name: "projectLocation",
//               placeholder: "Click to select location on map",
//               required: true,
//             },
//           ],
//         },
//         {
//           id: "section3",
//           title: "Project Description",
//           subtitle: "Detailed description of the project",
//           fields: [
//             {
//               id: "field17",
//               type: "text",
//               label: "Project Description",
//               name: "projectDescription",
//               placeholder: "Describe the project in detail",
//               required: true,
//               validations: [
//                 { type: "minLength", value: 50 },
//                 { type: "maxLength", value: 1000 },
//               ],
//             },
//             {
//               id: "field18",
//               type: "file",
//               label: "Project Plans/Drawings",
//               name: "projectPlans",
//               placeholder: "Upload project plans",
//               validations: [
//                 { type: "maxFileSize", value: 10 },
//                 { type: "allowedTypes", value: "pdf,jpg,jpeg,png" },
//                 { type: "maxFiles", value: 5 },
//               ],
//             },
//           ],
//         },
//       ],
//       // Add Back and Next buttons for page 2
//       navigationFields: [
//         {
//           id: "nav2-back",
//           type: "backButton",
//           label: "Back",
//           name: "backToPage1",
//           buttonText: "Back",
//           buttonVariant: "outline",
//           buttonTargetPage: "page1",
//         },
//         {
//           id: "nav2-next",
//           type: "nextButton",
//           label: "Next",
//           name: "nextToPage3",
//           buttonText: "Next",
//           buttonVariant: "default",
//           buttonTargetPage: "page3",
//           buttonApiUrl: "https://api.example.com/proposals/save-page",
//         },
//       ],
//     },
//     {
//       id: "page3",
//       title: "Contract Structure",
//       subtitle: "Contract and stakeholder information",
//       sections: [
//         {
//           id: "section4",
//           title: "Contract Details",
//           subtitle: "Contract information",
//           fields: [
//             {
//               id: "field19",
//               type: "dropdown",
//               label: "Contract Type",
//               name: "contractType",
//               placeholder: "Select contract type",
//               required: true,
//               options: [
//                 "Lump Sum",
//                 "Cost Plus",
//                 "Unit Price",
//                 "Time and Material",
//                 "Design & Build",
//                 "EPC",
//               ],
//             },
//             {
//               id: "field20",
//               type: "number",
//               label: "Contract Value (AED)",
//               name: "contractValue",
//               placeholder: "Enter contract value",
//               required: true,
//             },
//             {
//               id: "field21",
//               type: "text",
//               label: "Main Contractor Name",
//               name: "mainContractor",
//               placeholder: "Enter main contractor name",
//               required: true,
//             },
//             {
//               id: "field22",
//               type: "text",
//               label: "Client/Owner Name",
//               name: "clientName",
//               placeholder: "Enter client/owner name",
//               required: true,
//             },
//             {
//               id: "field23",
//               type: "text",
//               label: "Consultant/Architect Name",
//               name: "consultantName",
//               placeholder: "Enter consultant/architect name",
//             },
//           ],
//         },
//         {
//           id: "section5",
//           title: "Subcontractors",
//           subtitle: "Information about subcontractors",
//           fields: [
//             {
//               id: "field24",
//               type: "multiselect",
//               label: "Subcontractor Types",
//               name: "subcontractorTypes",
//               placeholder: "Select subcontractor types",
//               options: [
//                 "Electrical",
//                 "Plumbing",
//                 "HVAC",
//                 "Structural Steel",
//                 "Concrete",
//                 "Roofing",
//                 "Finishing",
//                 "Landscaping",
//               ],
//               validations: [{ type: "minSelections", value: 1 }],
//             },
//             {
//               id: "field25",
//               type: "number",
//               label: "Number of Subcontractors",
//               name: "numberOfSubcontractors",
//               placeholder: "Enter number of subcontractors",
//               validations: [{ type: "min", value: 0 }, { type: "integer" }],
//             },
//           ],
//         },
//       ],
//       navigationFields: [
//         {
//           id: "nav3-back",
//           type: "backButton",
//           label: "Back",
//           name: "backToPage2",
//           buttonText: "Back",
//           buttonVariant: "outline",
//           buttonTargetPage: "page2",
//         },
//         {
//           id: "nav3-next",
//           type: "nextButton",
//           label: "Next",
//           name: "nextToPage4",
//           buttonText: "Next",
//           buttonVariant: "default",
//           buttonTargetPage: "page4",
//           buttonApiUrl: "https://api.example.com/proposals/save-page",
//         },
//       ],
//     },
//     {
//       id: "page4",
//       title: "Coverage Requirements",
//       subtitle: "Insurance coverage details",
//       sections: [
//         {
//           id: "section6",
//           title: "Coverage Details",
//           subtitle: "Required coverage information",
//           fields: [
//             {
//               id: "field26",
//               type: "number",
//               label: "Sum Insured Required (AED)",
//               name: "sumInsured",
//               placeholder: "Enter sum insured amount",
//               required: true,
//               validations: [{ type: "min", value: 100000 }],
//             },
//             {
//               id: "field27",
//               type: "number",
//               label: "Deductible Preference (AED)",
//               name: "deductible",
//               placeholder: "Enter deductible amount",
//               validations: [{ type: "min", value: 0 }],
//             },
//             {
//               id: "field28",
//               type: "date",
//               label: "Coverage Start Date",
//               name: "coverageStartDate",
//               required: true,
//               validations: [{ type: "minDateToday" }],
//             },
//             {
//               id: "field29",
//               type: "date",
//               label: "Coverage End Date",
//               name: "coverageEndDate",
//               required: true,
//               validations: [{ type: "minDate" }],
//             },
//             {
//               id: "field30",
//               type: "multiselect",
//               label: "Additional Coverage Options",
//               name: "additionalCoverage",
//               placeholder: "Select additional coverage",
//               options: [
//                 "Third Party Liability",
//                 "Employer's Liability",
//                 "Tools & Equipment",
//                 "Advance Loss of Profits",
//                 "Professional Indemnity",
//                 "Marine Cargo",
//               ],
//             },
//           ],
//         },
//       ],
//       navigationFields: [
//         {
//           id: "nav4-back",
//           type: "backButton",
//           label: "Back",
//           name: "backToPage3",
//           buttonText: "Back",
//           buttonVariant: "outline",
//           buttonTargetPage: "page3",
//         },
//         {
//           id: "nav4-next",
//           type: "nextButton",
//           label: "Next",
//           name: "nextToPage5",
//           buttonText: "Next",
//           buttonVariant: "default",
//           buttonTargetPage: "page5",
//           buttonApiUrl: "https://api.example.com/proposals/save-page",
//         },
//       ],
//     },
//     {
//       id: "page5",
//       title: "Site & Risk Details",
//       subtitle: "Site location and risk assessment",
//       sections: [
//         {
//           id: "section7",
//           title: "Site Information",
//           subtitle: "Site location and characteristics",
//           fields: [
//             {
//               id: "field31",
//               type: "location",
//               label: "Site Address",
//               name: "siteAddress",
//               placeholder: "Click to select site location",
//               required: true,
//             },
//             {
//               id: "field32",
//               type: "dropdown",
//               label: "Site Security",
//               name: "siteSecurity",
//               placeholder: "Select security level",
//               required: true,
//               options: ["24/7 Guarded", "Guarded During Hours", "Fenced Only", "Open Site"],
//             },
//             {
//               id: "field33",
//               type: "checkbox",
//               label: "Site has CCTV",
//               name: "hasCCTV",
//               required: false,
//             },
//             {
//               id: "field34",
//               type: "checkbox",
//               label: "Site has fire safety equipment",
//               name: "hasFireSafety",
//               required: false,
//             },
//             {
//               id: "field35",
//               type: "dropdown",
//               label: "Site Accessibility",
//               name: "siteAccessibility",
//               placeholder: "Select accessibility",
//               options: ["Easy Access", "Moderate Access", "Difficult Access", "Remote Location"],
//             },
//           ],
//         },
//         {
//           id: "section8",
//           title: "Risk Factors",
//           subtitle: "Additional risk information",
//           fields: [
//             {
//               id: "field36",
//               type: "dropdown",
//               label: "Previous Loss History",
//               name: "previousLossHistory",
//               placeholder: "Select loss history",
//               required: true,
//               options: [
//                 "No Previous Losses",
//                 "Minor Losses (1-2)",
//                 "Moderate Losses (3-5)",
//                 "Multiple Losses",
//               ],
//             },
//             {
//               id: "field37",
//               type: "text",
//               label: "Risk Factors Description",
//               name: "riskFactors",
//               placeholder: "Describe any specific risk factors",
//               validations: [{ type: "maxLength", value: 500 }],
//             },
//           ],
//         },
//       ],
//       navigationFields: [
//         {
//           id: "nav5-back",
//           type: "backButton",
//           label: "Back",
//           name: "backToPage4",
//           buttonText: "Back",
//           buttonVariant: "outline",
//           buttonTargetPage: "page4",
//         },
//         {
//           id: "nav5-next",
//           type: "nextButton",
//           label: "Next",
//           name: "nextToPage6",
//           buttonText: "Next",
//           buttonVariant: "default",
//           buttonTargetPage: "page6",
//           buttonApiUrl: "https://api.example.com/proposals/save-page",
//         },
//       ],
//     },
//     {
//       id: "page6",
//       title: "Claims History",
//       subtitle: "Historical claims information",
//       sections: [
//         {
//           id: "section9",
//           title: "Claims History",
//           subtitle: "Previous claims for the last 5 years",
//           fields: [
//             {
//               id: "field38",
//               type: "combination",
//               label: "Claims History",
//               name: "claimsHistory",
//               required: false,
//               combinationRows: 5,
//               combinationRowLabels: ["2025", "2024", "2023", "2022", "2021"],
//               subFields: [
//                 {
//                   id: "sub1",
//                   label: "Year",
//                   name: "year",
//                   type: "text",
//                   placeholder: "Year",
//                   required: true,
//                 },
//                 {
//                   id: "sub2",
//                   label: "Claims Value (AED)",
//                   name: "claimsValue",
//                   type: "number",
//                   placeholder: "Enter claims value",
//                   required: false,
//                 },
//                 {
//                   id: "sub3",
//                   label: "Description",
//                   name: "description",
//                   type: "text",
//                   placeholder: "Brief description of claim",
//                   required: false,
//                 },
//               ],
//             },
//           ],
//         },
//       ],
//       navigationFields: [
//         {
//           id: "nav6-back",
//           type: "backButton",
//           label: "Back",
//           name: "backToPage5",
//           buttonText: "Back",
//           buttonVariant: "outline",
//           buttonTargetPage: "page5",
//         },
//         {
//           id: "nav6-next",
//           type: "nextButton",
//           label: "Next",
//           name: "nextToPage7",
//           buttonText: "Next",
//           buttonVariant: "default",
//           buttonTargetPage: "page7",
//           buttonApiUrl: "https://api.example.com/proposals/save-page",
//         },
//       ],
//     },
//     {
//       id: "page7",
//       title: "Additional Information",
//       subtitle: "Any additional details or documents",
//       sections: [
//         {
//           id: "section10",
//           title: "Additional Details",
//           subtitle: "Supplementary information",
//           fields: [
//             {
//               id: "field39",
//               type: "text",
//               label: "Additional Information",
//               name: "additionalInformation",
//               placeholder: "Enter any additional relevant information",
//               validations: [{ type: "maxLength", value: 2000 }],
//             },
//             {
//               id: "field40",
//               type: "file",
//               label: "Supporting Documents",
//               name: "supportingDocuments",
//               placeholder: "Upload supporting documents",
//               validations: [
//                 { type: "maxFileSize", value: 10 },
//                 { type: "allowedTypes", value: "pdf,doc,docx,jpg,jpeg,png" },
//                 { type: "maxFiles", value: 10 },
//               ],
//             },
//           ],
//         },
//       ],
//       navigationFields: [
//         {
//           id: "nav7-back",
//           type: "backButton",
//           label: "Back",
//           name: "backToPage6",
//           buttonText: "Back",
//           buttonVariant: "outline",
//           buttonTargetPage: "page6",
//         },
//         {
//           id: "nav7-next",
//           type: "nextButton",
//           label: "Next",
//           name: "nextToPage8",
//           buttonText: "Next",
//           buttonVariant: "default",
//           buttonTargetPage: "page8",
//           buttonApiUrl: "https://api.example.com/proposals/save-page",
//         },
//       ],
//     },
//     {
//       id: "page8",
//       title: "Review & Submit",
//       subtitle: "Review your proposal and submit",
//       sections: [
//         {
//           id: "section11",
//           title: "Review",
//           subtitle: "Review all information before submitting",
//           fields: [
//             {
//               id: "field41",
//               type: "checkbox",
//               label: "I confirm that all information provided is accurate",
//               name: "confirmationAccuracy",
//               required: true,
//             },
//             {
//               id: "field42",
//               type: "checkbox",
//               label: "I agree to the terms and conditions",
//               name: "termsAndConditions",
//               required: true,
//             },
//             {
//               id: "field43",
//               type: "submitButton",
//               label: "Submit Proposal",
//               name: "submitProposal",
//               buttonText: "Submit Proposal",
//               buttonVariant: "default",
//               buttonApiUrl: "https://api.example.com/proposals/submit",
//             },
//           ],
//         },
//       ],
//       navigationFields: [
//         {
//           id: "nav8-back",
//           type: "backButton",
//           label: "Back",
//           name: "backToPage7",
//           buttonText: "Back",
//           buttonVariant: "outline",
//           buttonTargetPage: "page7",
//         },
//       ],
//     },
//   ];
// };

const AdministrationFormDesign = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productName = searchParams.get('productName') || 'Product';
  const productVersion = searchParams.get('productVersion') || '';
  const designType = searchParams.get('designType') || '';

  // Get design type label
  const getDesignTypeLabel = () => {
    switch (designType) {
      case 'reInsurerOnboardingDesign':
        return 'Onboard Re-Insurer';
      case 'insurerOnboardingDesign':
        return 'Onboard Insurer';
      case 'brokerOnboardingDesign':
        return 'Onboard Broker';
      case 'userOnboardingDesign':
        return 'Onboard User';
      default:
        return 'Onboard';
    }
  };

  // Load default empty structure for administration forms - only one page allowed
  const getInitialPages = (): Page[] => {
    return [
      {
        id: 'page1',
        title: getDesignTypeLabel(),
        pageType: 'form',
        sections: [],
      },
    ];
  };

  const [pages, setPages] = useState<Page[]>(getInitialPages());

  const [selectedPageId, setSelectedPageId] = useState<string>(pages[0]?.id || 'page1');
  const [selectedSectionId, setSelectedSectionId] = useState<string | null>(null);
  const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null);
  const [isFieldDialogOpen, setIsFieldDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<string>('');
  const [isConfiguringField, setIsConfiguringField] = useState(false);
  const [draggedFieldId, setDraggedFieldId] = useState<string | null>(null);
  const [fieldConfig, setFieldConfig] = useState<Partial<Field | any>>({
    type: 'text',
    label: '',
    name: '',
    required: false,
    isRatingParameter: false,
    isMasterData: false,
    validations: [],
  });

  const [optionsInput, setOptionsInput] = useState<string>('');
  const [dependentOptionsInput, setDependentOptionsInput] = useState<string>('');

  const [expandedPages, setExpandedPages] = useState<Set<string>>(new Set(pages.map((p) => p.id)));
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set());
  const [isFullscreenPreview, setIsFullscreenPreview] = useState(false);
  const [currentPreviewPage, setCurrentPreviewPage] = useState<string>(pages[0]?.id || 'page1');
  const [isAddPageDialogOpen, setIsAddPageDialogOpen] = useState(false);
  const [newPageConfig, setNewPageConfig] = useState<{
    title: string;
  }>({
    title: '',
  });
  const [draggedFieldType, setDraggedFieldType] = useState<string | null>(null);
  const [dragOverSectionId, setDragOverSectionId] = useState<string | null>(null);

  const [deleteDialog, setDeleteDialog] = useState<{
    isOpen: boolean;
    type: 'page' | 'section' | 'field';
    pageId: string;
    sectionId?: string;
    fieldId?: string;
    title: string;
  }>({
    isOpen: false,
    type: 'field',
    pageId: '',
    title: '',
  });

  useEffect(() => {
    setExpandedPages((prev) => {
      const currentPageIds = new Set(
        pages.map((page) => page.id).filter((pageId): pageId is string => Boolean(pageId)),
      );
      const nextExpanded = new Set<string>();

      prev.forEach((pageId) => {
        if (currentPageIds.has(pageId)) {
          nextExpanded.add(pageId);
        }
      });

      currentPageIds.forEach((pageId) => {
        if (!prev.has(pageId)) {
          nextExpanded.add(pageId);
        }
      });

      return nextExpanded;
    });
  }, [pages]);

  // Add custom CSS for scrollable dropdown
  React.useEffect(() => {
    const style = document.createElement('style');
    style.textContent = `
      .field-type-dropdown-content {
        max-height: 300px !important;
      }
      .field-type-dropdown-viewport {
        max-height: 300px !important;
        overflow-y: auto !important;
        padding: 4px !important;
        scrollbar-width: thin !important;
        scrollbar-color: hsl(var(--primary) / 0.6) hsl(var(--muted)) !important;
      }
      .field-type-dropdown-viewport::-webkit-scrollbar {
        width: 6px !important;
        height: 6px !important;
      }
      .field-type-dropdown-viewport::-webkit-scrollbar-track {
        background: hsl(var(--muted)) !important;
        border-radius: 3px !important;
      }
      .field-type-dropdown-viewport::-webkit-scrollbar-thumb {
        background: hsl(var(--primary) / 0.6) !important;
        border-radius: 3px !important;
        border: none !important;
      }
      .field-type-dropdown-viewport::-webkit-scrollbar-thumb:hover {
        background: hsl(var(--primary) / 0.8) !important;
      }
      .field-type-dropdown-viewport::-webkit-scrollbar-corner {
        background: transparent !important;
      }
      /* Remove all scroll arrows - browser scrollbar */
      .field-type-dropdown-viewport::-webkit-scrollbar-button {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      .field-type-dropdown-viewport::-webkit-scrollbar-button:start:decrement,
      .field-type-dropdown-viewport::-webkit-scrollbar-button:end:increment {
        display: none !important;
        width: 0 !important;
        height: 0 !important;
      }
      /* Hide Radix UI scroll buttons */
      .field-type-dropdown-content [data-radix-scroll-area-scrollbar] {
        display: none !important;
      }
      .field-type-dropdown-content button[data-radix-scroll-area-scrollbar-button] {
        display: none !important;
      }
      /* Hide any scroll buttons by class or attribute */
      .field-type-dropdown-content .scroll-button,
      .field-type-dropdown-content [role="button"][aria-label*="scroll"] {
        display: none !important;
      }
      /* Target Radix Select scroll buttons specifically */
      [data-radix-select-content] button {
        display: none !important;
      }
      [data-radix-select-viewport] + button {
        display: none !important;
      }
    `;
    document.head.appendChild(style);
    
    return () => {
      if (document.head.contains(style)) {
        document.head.removeChild(style);
      }
    };
  }, []);


  // Update current preview page when pages change
  useEffect(() => {
    if (pages.length > 0 && !pages.find((p) => p.id === currentPreviewPage)) {
      setCurrentPreviewPage(pages[0].id);
    }
  }, [pages, currentPreviewPage]);

  // No quotes/CEWs selection needed for administration forms

  const fieldTypes: { value: FieldType; label: string; icon: React.ReactNode }[] = [
    { value: 'text', label: 'Text', icon: <Type className="w-4 h-4" /> },
    { value: 'textarea', label: 'Textarea', icon: <FileText className="w-4 h-4" /> },
    { value: 'number', label: 'Number', icon: <Hash className="w-4 h-4" /> },
    { value: 'dropdown', label: 'Dropdown', icon: <ChevronDown className="w-4 h-4" /> },
    { value: 'date', label: 'Date', icon: <Calendar className="w-4 h-4" /> },
    { value: 'checkbox', label: 'Checkbox', icon: <CheckSquare className="w-4 h-4" /> },
    { value: 'file', label: 'File Upload', icon: <Upload className="w-4 h-4" /> },
    { value: 'multiselect', label: 'Multi-Select', icon: <List className="w-4 h-4" /> },
    { value: 'location', label: 'Location Coordinates', icon: <MapPin className="w-4 h-4" /> },
    { value: 'combination', label: 'Combination Fields', icon: <List className="w-4 h-4" /> },
    { value: 'chooseButton', label: 'Choose Button (Radio)', icon: <Circle className="w-4 h-4" /> },
    { value: 'nextButton', label: 'Next Button', icon: <ArrowRight className="w-4 h-4" /> },
    { value: 'backButton', label: 'Back Button', icon: <ArrowLeftIcon className="w-4 h-4" /> },
    { value: 'submitButton', label: 'Submit Button', icon: <Send className="w-4 h-4" /> },
    { value: 'button', label: 'Custom Button', icon: <MousePointer2 className="w-4 h-4" /> },
  ];

  const addPage = () => {
    setIsAddPageDialogOpen(true);
    setNewPageConfig({
      title: '',
    });
  };

  const handleCreatePage = () => {
    if (!newPageConfig.title.trim()) {
      toast({
        title: 'Page Title Required',
        description: 'Please enter a page title.',
        variant: 'destructive',
      });
      return;
    }

    const newPage: Page = {
      id: `page${Date.now()}`,
      title: newPageConfig.title,
      pageType: 'form',
      sections: [],
    };

    setPages([...pages, newPage]);
    setSelectedPageId(newPage.id);
    setExpandedPages(new Set([...expandedPages, newPage.id]));
    setIsAddPageDialogOpen(false);
    setNewPageConfig({
      title: '',
    });

    toast({
      title: 'Page Added',
      description: `Form page "${newPageConfig.title}" has been added.`,
    });
  };

  const addSection = (pageId: string) => {
    const page = pages.find((p) => p.id === pageId);
    if (!page) {
      toast({
        title: 'Page Not Found',
        description: 'The selected page could not be found.',
        variant: 'destructive',
      });
      return;
    }

    const newSection: Section = {
      id: `section${Date.now()}`,
      title: 'New Section',
      fields: [],
    };
    setPages(
      pages.map((page) =>
        page.id === pageId ? { ...page, sections: [...(page.sections || []), newSection] } : page,
      ),
    );
    setSelectedSectionId(newSection.id);
    setExpandedSections(new Set([...expandedSections, newSection.id]));
  };

  const generateFieldName = (label: string): string => {
    if (!label) return '';
    // Convert label to snake_case: "Company Name" -> "company_name"
    return label
      .trim()
      .toLowerCase()
      .replace(/[\s\-]+/g, '_')
      .replace(/[^a-z0-9_]/g, '')
      .replace(/_+/g, '_')
      .replace(/^_+|_+$/g, '');
  };

  const [subFieldsConfig, setSubFieldsConfig] = useState<SubField[]>([]);
  const [combinationRowsCount, setCombinationRowsCount] = useState<number>(1);
  const [combinationRowLabels, setCombinationRowLabels] = useState<string[]>([]);
  const isSubField = (sf: unknown): sf is SubField => {
    if (!sf || typeof sf !== 'object') return false;
    const obj = sf as SubField;
    return (
      typeof obj.label === 'string' &&
      typeof obj.name === 'string' &&
      typeof obj.type === 'string' &&
      ['text', 'number', 'date', 'dropdown', 'textarea'].includes(obj.type)
    );
  };
  const toValidSubFields = (arr: unknown): SubField[] =>
    Array.isArray(arr) ? arr.filter(isSubField) : [];

  const startAddingField = (sectionId: string) => {
    setSelectedSectionId(sectionId);
    setIsConfiguringField(true);
    setFieldConfig({
      type: 'text',
      label: '',
      name: '',
      required: false,
      isRatingParameter: false,
      isMasterData: false,
      buttonText: '',
      buttonVariant: 'default',
    });
    setOptionsInput('');
    setDependentOptionsInput('');
    setSubFieldsConfig([]);
    setCombinationRowsCount(1);
    setCombinationRowLabels([]);
    setSelectedFieldId(null);
    setIsFieldDialogOpen(true);
  };

  const startEditingField = (pageId: string, sectionId: string, field: Field) => {
    setSelectedPageId(pageId);
    setSelectedSectionId(sectionId);
    setSelectedFieldId(field.id);
    setIsConfiguringField(false);
    setFieldConfig({
      type: field.type,
      label: field.label,
      name: field.name,
      placeholder: field.placeholder,
      defaultValue: field.defaultValue,
      required: field.required || false,
      isRatingParameter: field.isRatingParameter || false,
      isMasterData: field.isMasterData || false,
      validations: field.validations,
      conditionalLogic: field.conditionalLogic,
      options: field.options,
      optionsUrl: field.optionsUrl,
      dependentOn: field.dependentOn,
      dependentOptions: field.dependentOptions,
      dependentOptionsUrl: field.dependentOptionsUrl,
      masterDataTable: field.masterDataTable,
      subFields: field.subFields,
      buttonText: field.buttonText,
      buttonAction: field.buttonAction,
      buttonApiUrl: field.buttonApiUrl,
      buttonVariant: field.buttonVariant,
      buttonTargetPage: field.buttonTargetPage,
    });
    setOptionsInput(field.options?.join(', ') || '');
    setDependentOptionsInput(
      field.dependentOptions
        ? Object.entries(field.dependentOptions)
            .map(([parent, children]) => `${parent} = ${children.join(', ')}`)
            .join('\n')
        : '',
    );
    setSubFieldsConfig(field.subFields || []);
    setCombinationRowsCount(field.combinationRows || 1);
    setCombinationRowLabels(field.combinationRowLabels || []);
    setIsFieldDialogOpen(true);
  };

  const saveField = () => {
    if (!fieldConfig.label) {
      toast({
        title: 'Validation Error',
        description: 'Please fill in Field Label.',
        variant: 'destructive',
      });
      return;
    }

    // Validate combination field has at least one sub-field
    if (fieldConfig.type === 'combination' && subFieldsConfig.length === 0) {
      toast({
        title: 'Validation Error',
        description: 'Combination field must have at least one sub-field.',
        variant: 'destructive',
      });
      return;
    }

    // Validate combination field has at least one row
    if (fieldConfig.type === 'combination' && combinationRowsCount < 1) {
      toast({
        title: 'Validation Error',
        description: 'Combination field must have at least one row.',
        variant: 'destructive',
      });
      return;
    }

    // Validate all sub-fields have labels
    if (fieldConfig.type === 'combination') {
      const invalidSubFields = subFieldsConfig.filter((sf) => !sf.label);
      if (invalidSubFields.length > 0) {
        toast({
          title: 'Validation Error',
          description: 'All sub-fields must have a label.',
          variant: 'destructive',
        });
        return;
      }
    }

    // Validate API URL for Next and Submit buttons
    if (
      (fieldConfig.type === 'nextButton' || fieldConfig.type === 'submitButton') &&
      !fieldConfig.buttonApiUrl
    ) {
      toast({
        title: 'Validation Error',
        description: 'API URL is required for Next and Submit buttons to save form data.',
        variant: 'destructive',
      });
      return;
    }

    // Ensure field name is auto-generated
    const fieldName = fieldConfig.name || generateFieldName(fieldConfig.label);
    if (!fieldName) {
      toast({
        title: 'Validation Error',
        description: 'Could not generate field name. Please enter a valid label.',
        variant: 'destructive',
      });
      return;
    }

    const fieldData: Field = {
      id: selectedFieldId || `field${Date.now()}`,
      type: fieldConfig.type as FieldType,
      label: fieldConfig.label,
      name: fieldName,
      placeholder: fieldConfig.placeholder,
      defaultValue: fieldConfig.defaultValue,
      required: fieldConfig.required || false,
      isRatingParameter: fieldConfig.isRatingParameter || false,
      isMasterData: fieldConfig.isMasterData || false,
      validations: fieldConfig.validations,
      conditionalLogic: fieldConfig.conditionalLogic,
      options: fieldConfig.options,
      optionsUrl: fieldConfig.optionsUrl,
      dependentOn: fieldConfig.dependentOn,
      dependentOptions: fieldConfig.dependentOptions,
      dependentOptionsUrl: fieldConfig.dependentOptionsUrl,
      masterDataTable: fieldConfig.masterDataTable,
      subFields: fieldConfig.type === 'combination' ? subFieldsConfig : undefined,
      combinationRows: fieldConfig.type === 'combination' ? combinationRowsCount : undefined,
      combinationRowLabels:
        fieldConfig.type === 'combination' && combinationRowLabels.length > 0
          ? combinationRowLabels
          : undefined,
      buttonText: fieldConfig.buttonText,
      buttonAction: fieldConfig.buttonAction,
      buttonApiUrl: fieldConfig.buttonApiUrl,
      buttonVariant: fieldConfig.buttonVariant,
      buttonTargetPage: fieldConfig.buttonTargetPage,
    };

    if (selectedFieldId && !isConfiguringField) {
      // Editing existing field
      setPages(
        pages.map((page) => ({
          ...page,
          sections: page.sections.map((section) => ({
            ...section,
            fields: section.fields.map((field) =>
              field.id === selectedFieldId ? fieldData : field,
            ),
          })),
        })),
      );
      toast({
        title: 'Field Updated',
        description: `${fieldConfig.label} has been updated.`,
      });
    } else {
      // Adding new field
      setPages(
        pages.map((page) => ({
          ...page,
          sections: page.sections.map((section) =>
            section.id === selectedSectionId
              ? { ...section, fields: [...section.fields, fieldData] }
              : section,
          ),
        })),
      );
      toast({
        title: 'Field Added',
        description: `${fieldConfig.label} has been added to the form.`,
      });
    }

    setIsFieldDialogOpen(false);
    setIsConfiguringField(false);
    setFieldConfig({});
    setOptionsInput('');
    setDependentOptionsInput('');
    setSubFieldsConfig([]);
    setCombinationRowsCount(1);
    setCombinationRowLabels([]);
    setSelectedFieldId(null);
  };

  const updatePageTitle = (pageId: string, title: string) => {
    setPages(pages.map((page) => (page.id === pageId ? { ...page, title } : page)));
  };

  const updatePageSubtitle = (pageId: string, subtitle: string) => {
    setPages(pages.map((page) => (page.id === pageId ? { ...page, subtitle } : page)));
  };

  const updateSectionTitle = (pageId: string, sectionId: string, title: string) => {
    setPages(
      pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.id === sectionId ? { ...section, title } : section,
              ),
            }
          : page,
      ),
    );
  };

  const updateSectionSubtitle = (pageId: string, sectionId: string, subtitle: string) => {
    setPages(
      pages.map((page) =>
        page.id === pageId
          ? {
              ...page,
              sections: page.sections.map((section) =>
                section.id === sectionId ? { ...section, subtitle } : section,
              ),
            }
          : page,
      ),
    );
  };

  const deletePage = (pageId: string) => {
    // Prevent deletion if it's the only page
    if (pages.length <= 1) {
      toast({
        title: 'Cannot Delete Page',
        description: 'Administration forms must have at least one page.',
        variant: 'destructive',
      });
      return;
    }

    const page = pages.find((p) => p.id === pageId);
    setDeleteDialog({
      isOpen: true,
      type: 'page',
      pageId,
      title: page?.title || 'this page',
    });
  };

  const deleteSection = (pageId: string, sectionId: string) => {
    const page = pages.find((p) => p.id === pageId);
    const section = page?.sections.find((s) => s.id === sectionId);
    setDeleteDialog({
      isOpen: true,
      type: 'section',
      pageId,
      sectionId,
      title: section?.title || 'this section',
    });
  };

  const deleteField = (pageId: string, sectionId: string, fieldId: string) => {
    const page = pages.find((p) => p.id === pageId);
    const section = page?.sections.find((s) => s.id === sectionId);
    const field = section?.fields.find((f) => f.id === fieldId);

    setDeleteDialog({
      isOpen: true,
      type: 'field',
      pageId,
      sectionId,
      fieldId,
      title: field?.label || 'this field',
    });
  };

  const confirmDelete = () => {
    const { type, pageId, sectionId, fieldId } = deleteDialog;

    if (type === 'page') {
      const newPages = pages.filter((page) => page.id !== pageId);
      setPages(newPages);
      if (selectedPageId === pageId) {
        setSelectedPageId(newPages[0]?.id || '');
      }
    } else if (type === 'section') {
      setPages(
        pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                sections: page.sections.filter((section) => section.id !== sectionId),
              }
            : page,
        ),
      );
    } else if (type === 'field') {
      setPages(
        pages.map((page) =>
          page.id === pageId
            ? {
                ...page,
                sections: page.sections.map((section) =>
                  section.id === sectionId
                    ? {
                        ...section,
                        fields: section.fields.filter((field) => field.id !== fieldId),
                      }
                    : section,
                ),
              }
            : page,
        ),
      );
    }

    setDeleteDialog((prev) => ({ ...prev, isOpen: false }));

    toast({
      title: `${type.charAt(0).toUpperCase() + type.slice(1)} Deleted`,
      description: `"${deleteDialog.title}" has been deleted.`,
    });
  };


  const handleDragStart = (fieldId: string) => {
    setDraggedFieldId(fieldId);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    e.currentTarget.classList.add('opacity-50');
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.currentTarget.classList.remove('opacity-50');
  };

  const handleDrop = (
    e: React.DragEvent,
    targetFieldId: string,
    pageId: string,
    sectionId: string,
  ) => {
    e.preventDefault();
    e.currentTarget.classList.remove('opacity-50');

    if (!draggedFieldId || draggedFieldId === targetFieldId) {
      setDraggedFieldId(null);
      return;
    }

    // Find the dragged field and target field
    const draggedField = pages
      .flatMap((page) => page.sections.flatMap((section) => section.fields))
      .find((f) => f.id === draggedFieldId);

    const targetField = pages
      .flatMap((page) => page.sections.flatMap((section) => section.fields))
      .find((f) => f.id === targetFieldId);

    if (!draggedField || !targetField) {
      setDraggedFieldId(null);
      return;
    }

    // Check if dragged field is a parent of target field or any field after it
    const section = pages.find((p) => p.id === pageId)?.sections.find((s) => s.id === sectionId);

    if (!section) {
      setDraggedFieldId(null);
      return;
    }

    const targetIndex = section.fields.findIndex((f) => f.id === targetFieldId);
    const draggedIndex = section.fields.findIndex((f) => f.id === draggedFieldId);

    // Check if dragged field is a parent of any field that would be after it in the new position
    if (targetIndex > draggedIndex) {
      // Moving down - check if dragged field is parent of any field between current position and target position (inclusive)
      const fieldsBetween = section.fields.slice(draggedIndex + 1, targetIndex + 1);
      const isParentOfChild = fieldsBetween.some((f) => f.dependentOn === draggedField.name);

      if (isParentOfChild) {
        toast({
          title: 'Cannot Move Field',
          description: 'A parent field cannot be moved below its dependent child fields.',
          variant: 'destructive',
        });
        setDraggedFieldId(null);
        return;
      }
    }

    setPages(
      pages.map((page) => {
        if (page.id !== pageId) return page;

        return {
          ...page,
          sections: page.sections.map((section) => {
            if (section.id !== sectionId) return section;

            const fields = [...section.fields];
            const draggedIdx = fields.findIndex((f) => f.id === draggedFieldId);
            const targetIdx = fields.findIndex((f) => f.id === targetFieldId);

            if (draggedIdx === -1 || targetIdx === -1) return section;

            const [draggedFieldItem] = fields.splice(draggedIdx, 1);
            fields.splice(targetIdx, 0, draggedFieldItem);

            return {
              ...section,
              fields,
            };
          }),
        };
      }),
    );

    setDraggedFieldId(null);
  };

  const handleDragEnd = () => {
    setDraggedFieldId(null);
    // Remove any remaining opacity classes
    document.querySelectorAll('.opacity-50').forEach((el) => {
      el.classList.remove('opacity-50');
    });
  };

  const togglePageExpansion = (pageId: string) => {
    const newExpanded = new Set(expandedPages);
    if (newExpanded.has(pageId)) {
      newExpanded.delete(pageId);
    } else {
      newExpanded.add(pageId);
    }
    setExpandedPages(newExpanded);
  };

  const toggleSectionExpansion = (sectionId: string) => {
    const newExpanded = new Set(expandedSections);
    if (newExpanded.has(sectionId)) {
      newExpanded.delete(sectionId);
    } else {
      newExpanded.add(sectionId);
    }
    setExpandedSections(newExpanded);
  };

  const selectedPage = pages.find((p) => p.id === selectedPageId);

  // Estimate field height for dynamic page wrapping
  const estimateFieldHeight = (field: Field): number => {
    const baseHeight = 60; // Base height for label + input
    const spacing = 16; // Space between fields

    switch (field.type) {
      case 'text':
      case 'number':
      case 'date':
      case 'dropdown':
      case 'location':
        return baseHeight + spacing;
      case 'checkbox':
        return 40 + spacing;
      case 'file':
        return 80 + spacing;
      case 'multiselect':
        return baseHeight + spacing;
      case 'combination':
        // Estimate based on rows and sub-fields
        const rows = field.combinationRows || 1;
        const subFieldsCount = field.subFields?.length || 1;
        return rows * 60 + subFieldsCount * 20 + 100 + spacing; // Header + rows + spacing
      case 'chooseButton':
      case 'nextButton':
      case 'backButton':
      case 'submitButton':
      case 'button':
        return 50 + spacing;
      default:
        return baseHeight + spacing;
    }
  };

  // Group all fields into pages based on estimated height (for fullscreen view)
  const getWrappedPages = (): Array<{
    pageIndex: number;
    fields: Array<{ page: Page; section: Section; field: Field }>;
  }> => {
    const maxPageHeight = 800; // Approximate viewport height minus padding
    const wrappedPages: Array<{
      pageIndex: number;
      fields: Array<{ page: Page; section: Section; field: Field }>;
    }> = [];
    let currentPageIndex = 0;
    let currentPageHeight = 0;
    let currentPageFields: Array<{ page: Page; section: Section; field: Field }> = [];

    pages.forEach((page) => {
      // Add page header height (approximately)
      const pageHeaderHeight = 100;
      if (currentPageHeight + pageHeaderHeight > maxPageHeight && currentPageFields.length > 0) {
        wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
        currentPageIndex++;
        currentPageHeight = 0;
        currentPageFields = [];
      }
      currentPageHeight += pageHeaderHeight;

      page.sections.forEach((section) => {
        // Add section header height (approximately)
        const sectionHeaderHeight = section.title ? 60 : 0;
        if (
          currentPageHeight + sectionHeaderHeight > maxPageHeight &&
          currentPageFields.length > 0
        ) {
          wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
          currentPageIndex++;
          currentPageHeight = sectionHeaderHeight;
          currentPageFields = [];
        } else {
          currentPageHeight += sectionHeaderHeight;
        }

        section.fields.forEach((field) => {
          const fieldHeight = estimateFieldHeight(field);

          if (currentPageHeight + fieldHeight > maxPageHeight && currentPageFields.length > 0) {
            wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
            currentPageIndex++;
            currentPageHeight = fieldHeight;
            currentPageFields = [{ page, section, field }];
          } else {
            currentPageHeight += fieldHeight;
            currentPageFields.push({ page, section, field });
          }
        });
      });
    });

    // Add the last page if it has fields
    if (currentPageFields.length > 0) {
      wrappedPages.push({ pageIndex: currentPageIndex, fields: currentPageFields });
    }

    return wrappedPages;
  };

  // Determine if a field should span full width (2 columns)
  const shouldFieldSpanFullWidth = (field: Field): boolean => {
    return [
      'file',
      'location',
      'combination',
      'chooseButton',
      'nextButton',
      'backButton',
      'submitButton',
      'button',
    ].includes(field.type);
  };

  // Helper function to get next page
  const getNextPage = (currentPageId: string) => {
    const currentIndex = pages.findIndex((p) => p.id === currentPageId);
    if (currentIndex >= 0 && currentIndex < pages.length - 1) {
      return pages[currentIndex + 1].id;
    }
    return null;
  };

  const renderFieldPreview = (field: Field) => {
    switch (field.type) {
      case 'text':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              placeholder={field.placeholder}
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
            />
          </div>
        );
      case 'textarea':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Textarea
              placeholder={field.placeholder}
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
              className="min-h-[100px]"
            />
          </div>
        );
      case 'number':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="number"
              placeholder={field.placeholder}
              defaultValue={
                typeof field.defaultValue === 'number' ? String(field.defaultValue) : undefined
              }
            />
          </div>
        );
      case 'dropdown':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
            >
              <SelectTrigger>
                <SelectValue
                  placeholder={
                    field.dependentOn
                      ? `Select ${field.label.toLowerCase()} (depends on ${field.dependentOn})`
                      : field.placeholder || 'Select...'
                  }
                />
              </SelectTrigger>
              {field.dependentOptions && (
                <SelectContent>
                  {/* In preview, show all possible options grouped by parent */}
                  {Object.entries(field.dependentOptions).map(([parent, children]) => (
                    <React.Fragment key={parent}>
                      {children.map((child, idx) => (
                        <SelectItem key={`${parent}-${idx}`} value={child}>
                          {child}
                        </SelectItem>
                      ))}
                    </React.Fragment>
                  ))}
                </SelectContent>
              )}
              {!field.dependentOptions && field.options && field.options.length > 0 && (
                <SelectContent>
                  {field.options.map((option, idx) => {
                    const val = typeof option === 'string' ? option : (option as any).value || (option as any).label || '';
                    const label = typeof option === 'string' ? option : (option as any).label || (option as any).value || '';
                    return (
                      <SelectItem key={idx} value={val}>
                        {label}
                      </SelectItem>
                    );
                  })}
                </SelectContent>
              )}
              {!field.dependentOptions && field.optionsUrl && (
                <SelectContent>
                  <SelectItem value="loading" disabled>
                    Loading options from URL...
                  </SelectItem>
                </SelectContent>
              )}
            </Select>
            {field.dependentOn && (
              <p className="text-xs text-muted-foreground">
                Options depend on: {field.dependentOn}
              </p>
            )}
            {field.optionsUrl && !field.dependentOn && (
              <p className="text-xs text-muted-foreground">
                Options loaded from: {field.optionsUrl}
              </p>
            )}
          </div>
        );
      case 'date':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Input
              type="date"
              defaultValue={typeof field.defaultValue === 'string' ? field.defaultValue : undefined}
            />
          </div>
        );
      case 'checkbox':
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.id}
              checked={field.defaultValue === true}
              onCheckedChange={() => {}} // Preview only
            />
            <Label htmlFor={field.id}>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
          </div>
        );
      case 'file':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Button variant="outline" className="w-full">
              <Upload className="w-4 h-4 mr-2" />
              Upload File
            </Button>
          </div>
        );
      case 'multiselect':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <Select>
              <SelectTrigger>
                <SelectValue placeholder={field.placeholder || 'Select options...'} />
              </SelectTrigger>
              {field.options && field.options.length > 0 && (
                <SelectContent>
                  {field.options.map((option, idx) => (
                    <SelectItem key={idx} value={option}>
                      {option}
                    </SelectItem>
                  ))}
                </SelectContent>
              )}
            </Select>
            {Array.isArray(field.defaultValue) && field.defaultValue.length > 0 && (
              <div className="flex flex-wrap gap-2 mt-2">
                {field.defaultValue.map((val, idx) => (
                  <Badge key={idx} variant="secondary">
                    {val}
                  </Badge>
                ))}
              </div>
            )}
          </div>
        );
      case 'location':
        return <LocationPreviewField field={field as any} />;
      case 'combination':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            {field.subFields && field.subFields.length > 0 ? (
              <div className="border rounded-lg p-4 space-y-4 bg-muted/30 overflow-auto max-h-[400px]">
                {/* Table Header */}
                <div
                  className="grid gap-2"
                  style={{
                    gridTemplateColumns: `${
                      field.combinationRowLabels && field.combinationRowLabels.length > 0
                        ? '100px '
                        : ''
                    }repeat(${field.subFields.length}, minmax(0, 1fr)) 80px`,
                  }}
                >
                  {field.combinationRowLabels && field.combinationRowLabels.length > 0 && (
                    <div className="text-xs font-semibold text-muted-foreground">Year</div>
                  )}
                  {field.subFields.map((subField) => (
                    <Label key={subField.id} className="text-xs font-semibold">
                      {subField.label}{' '}
                      {subField.required && <span className="text-destructive">*</span>}
                    </Label>
                  ))}
                  <div className="text-xs font-semibold text-muted-foreground text-center">
                    Actions
                  </div>
                </div>

                {/* Rows (Preview shows configured number of rows) */}
                {Array.from({ length: field.combinationRows || 1 }, (_, rowNum) => (
                  <div
                    key={rowNum}
                    className="grid gap-2 items-center"
                    style={{
                      gridTemplateColumns: `${
                        field.combinationRowLabels && field.combinationRowLabels.length > 0
                          ? '100px '
                          : ''
                      }repeat(${field.subFields.length}, minmax(0, 1fr)) 80px`,
                    }}
                  >
                    {field.combinationRowLabels && field.combinationRowLabels.length > 0 && (
                      <div className="text-sm font-medium text-muted-foreground">
                        {field.combinationRowLabels[rowNum] || `${rowNum + 1}`}
                      </div>
                    )}
                    {field.subFields.map((subField) => (
                      <div key={subField.id}>
                        {subField.type === 'text' && (
                          <Input
                            type="text"
                            placeholder={
                              subField.placeholder || `Enter ${subField.label.toLowerCase()}`
                            }
                            className="text-sm"
                          />
                        )}
                        {subField.type === 'number' && (
                          <Input
                            type="number"
                            placeholder={
                              subField.placeholder || `Enter ${subField.label.toLowerCase()}`
                            }
                            className="text-sm"
                          />
                        )}
                        {subField.type === 'date' && <Input type="date" className="text-sm" />}
                        {subField.type === 'dropdown' && (
                          <Select>
                            <SelectTrigger className="text-sm">
                              <SelectValue
                                placeholder={
                                  subField.placeholder || `Select ${subField.label.toLowerCase()}`
                                }
                              />
                            </SelectTrigger>
                            {subField.options && subField.options.length > 0 && (
                              <SelectContent>
                                {subField.options.map((option, optIdx) => (
                                  <SelectItem key={optIdx} value={option}>
                                    {option}
                                  </SelectItem>
                                ))}
                              </SelectContent>
                            )}
                          </Select>
                        )}
                      </div>
                    ))}
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                ))}

                {/* Add Row Button */}
                <Button variant="outline" className="w-full gap-2">
                  <Plus className="w-4 h-4" />
                  Add Row
                </Button>
              </div>
            ) : (
              <div className="border rounded-lg p-4 bg-muted/30">
                <p className="text-sm text-muted-foreground text-center">
                  No sub-fields configured. Click edit to add sub-fields.
                </p>
              </div>
            )}
            <p className="text-xs text-muted-foreground">
              Add multiple rows. Each row will be submitted as an object in an array.
            </p>
          </div>
        );
      case 'chooseButton':
        return (
          <div className="space-y-2">
            <Label>
              {field.label} {field.required && <span className="text-destructive">*</span>}
            </Label>
            <div className="flex flex-wrap gap-2">
              {field.options && field.options.length > 0 ? (
                field.options.map((option, idx) => (
                  <Button key={idx} variant={field.buttonVariant || 'outline'} className="gap-2">
                    <Circle className="w-4 h-4" />
                    {option}
                  </Button>
                ))
              ) : (
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Circle className="w-4 h-4" />
                    Option 1
                  </Button>
                  <Button variant="outline" className="gap-2">
                    <Circle className="w-4 h-4" />
                    Option 2
                  </Button>
                </div>
              )}
            </div>
            <p className="text-xs text-muted-foreground">
              Radio-style button selection. Only one option can be selected.
            </p>
          </div>
        );
      case 'nextButton':
        return (
          <div className="space-y-2">
            <Button
              variant={field.buttonVariant || 'default'}
              className="w-full gap-2"
              onClick={() => {
                // In real implementation, would call the API here
                if (field.buttonApiUrl) {
                  console.log('Saving page data to:', field.buttonApiUrl);
                }
                // Navigate to target page or next page
                if (field.buttonTargetPage) {
                  const targetPage = pages.find((p) => p.id === field.buttonTargetPage);
                  if (targetPage) {
                    setCurrentPreviewPage(field.buttonTargetPage);
                  }
                } else {
                  // Navigate to next page by default
                  const nextPageId = getNextPage(currentPreviewPage);
                  if (nextPageId) {
                    setCurrentPreviewPage(nextPageId);
                  }
                }
              }}
            >
              {field.buttonText || 'Next'}
              <ArrowRight className="w-4 h-4" />
            </Button>
            {field.buttonApiUrl && (
              <p className="text-xs text-muted-foreground">API: {field.buttonApiUrl}</p>
            )}
          </div>
        );
      case 'backButton':
        return (
          <div className="space-y-2">
            <Button
              variant={field.buttonVariant || 'outline'}
              className="w-full gap-2"
              onClick={() => {
                if (field.buttonTargetPage) {
                  const targetPage = pages.find((p) => p.id === field.buttonTargetPage);
                  if (targetPage) {
                    setCurrentPreviewPage(field.buttonTargetPage);
                  }
                }
              }}
            >
              <ArrowLeftIcon className="w-4 h-4" />
              {field.buttonText || 'Back'}
            </Button>
            {field.buttonTargetPage && (
              <p className="text-xs text-muted-foreground">
                Navigates to: {field.buttonTargetPage}
              </p>
            )}
          </div>
        );
      case 'submitButton':
        return (
          <div className="space-y-2">
            <Button
              variant={field.buttonVariant || 'default'}
              className="w-full gap-2"
              onClick={() => {
                // In real implementation, would call the API here
                if (field.buttonApiUrl) {
                  console.log('Submitting form data to:', field.buttonApiUrl);
                }
                // Navigate to target page or next page
                if (field.buttonTargetPage) {
                  const targetPage = pages.find((p) => p.id === field.buttonTargetPage);
                  if (targetPage) {
                    setCurrentPreviewPage(field.buttonTargetPage);
                  }
                } else {
                  // Navigate to next page by default
                  const nextPageId = getNextPage(currentPreviewPage);
                  if (nextPageId) {
                    setCurrentPreviewPage(nextPageId);
                  }
                }
              }}
            >
              <Send className="w-4 h-4" />
              {field.buttonText || 'Submit'}
            </Button>
            {field.buttonApiUrl && (
              <p className="text-xs text-muted-foreground">Submit API: {field.buttonApiUrl}</p>
            )}
          </div>
        );
      case 'button':
        return (
          <div className="space-y-2">
            <Button variant={field.buttonVariant || 'default'} className="w-full gap-2">
              {field.buttonText || field.label || 'Button'}
            </Button>
            {field.buttonApiUrl && (
              <p className="text-xs text-muted-foreground">Action API: {field.buttonApiUrl}</p>
            )}
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">{getDesignTypeLabel()}</h1>
            <p className="text-sm text-muted-foreground">
              {productName}
              {productVersion ? ` - Version ${productVersion}` : ''}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Select value={selectedTemplate} onValueChange={setSelectedTemplate}>
            <SelectTrigger className="w-[200px]">
              <SelectValue placeholder="Select Template" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="blank">Blank Template</SelectItem>
              <SelectItem value="car">Contractors All Risk</SelectItem>
              <SelectItem value="pi">Professional Indemnity</SelectItem>
              <SelectItem value="do">Directors & Officers</SelectItem>
              <SelectItem value="marine">Marine Cargo</SelectItem>
              <SelectItem value="property">Property Insurance</SelectItem>
              <SelectItem value="liability">General Liability</SelectItem>
            </SelectContent>
          </Select>
          <Button
            onClick={() => {
              toast({
                title: 'Form Saved',
                description: 'Proposal form design has been saved successfully.',
              });
            }}
            className="gap-2"
          >
            <Save className="w-4 h-4" />
            Save Form
          </Button>
        </div>
      </div>

      {/* Main Content - Three Panels */}
      <div className="flex flex-1 overflow-hidden">
        {/* Left Panel - Component Selection */}
        <div className="w-64 border-r bg-muted/30 overflow-y-auto">
          <div className="p-4">
            <h3 className="font-semibold mb-4">Components</h3>
            <div className="space-y-2">
              {/* Add Page button removed - Administration forms only support one page */}
              {selectedPage &&
                (selectedPage.pageType === 'form' || selectedPage.pageType === 'quotesList') && (
                  <Button
                    variant="outline"
                    className="w-full justify-start gap-2"
                    onClick={() => {
                      if (!selectedPage.sections || !selectedPage.sections.length) {
                        addSection(selectedPageId);
                      } else {
                        const lastSection = selectedPage.sections[selectedPage.sections.length - 1];
                        addSection(selectedPageId);
                      }
                    }}
                  >
                    <Plus className="w-4 h-4" />
                    Add Section
                  </Button>
                )}
            </div>

            <Separator className="my-4" />

            <div className="space-y-2">
              <h4 className="text-sm font-medium text-muted-foreground mb-2">Field Types</h4>
              <p className="text-xs text-muted-foreground mb-2">Drag and drop into sections</p>
              {(() => {
                // For quotes list pages, only show button types
                const availableFieldTypes = fieldTypes;

                return availableFieldTypes.map((ft) => (
                  <Button
                    key={ft.value}
                    variant="outline"
                    className="w-full justify-start gap-2 cursor-grab active:cursor-grabbing"
                    draggable
                    onDragStart={(e) => {
                      setDraggedFieldType(ft.value);
                      e.dataTransfer.effectAllowed = 'move';
                      e.dataTransfer.setData('fieldType', ft.value);
                    }}
                    onDragEnd={() => {
                      setDraggedFieldType(null);
                      setDragOverSectionId(null);
                    }}
                    onClick={() => {
                      if (!selectedSectionId) {
                        toast({
                          title: 'Select Section',
                          description: 'Please select a section first.',
                          variant: 'destructive',
                        });
                        return;
                      }
                      setFieldConfig({
                        ...fieldConfig,
                        type: ft.value,
                        defaultValue: ft.value === fieldConfig.type ? fieldConfig.defaultValue : '',
                      });
                      setIsFieldDialogOpen(true);
                    }}
                  >
                    {ft.icon}
                    {ft.label}
                  </Button>
                ));
              })()}
            </div>
          </div>
        </div>

        {/* Middle Panel - Form Structure */}
        <div className="flex-1 border-r overflow-y-auto bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:20px_20px]">
          <div className="p-6">
            <div className="space-y-4">
              {pages.map((page) => (
                <Card
                  key={page.id}
                  className={selectedPageId === page.id ? 'ring-2 ring-primary' : ''}
                >
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex items-center gap-2 flex-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-6 w-6"
                          onClick={() => togglePageExpansion(page.id)}
                        >
                          {expandedPages.has(page.id) ? (
                            <ChevronDown className="w-4 h-4" />
                          ) : (
                            <ChevronRight className="w-4 h-4" />
                          )}
                        </Button>
                        <div className="flex-1">
                          <Input
                            value={page.title}
                            onChange={(e) => updatePageTitle(page.id, e.target.value)}
                            className="font-semibold border-none p-0 h-auto"
                            placeholder="Page Title"
                          />
                          <Input
                            value={page.subtitle || ''}
                            onChange={(e) => updatePageSubtitle(page.id, e.target.value)}
                            className="text-sm text-muted-foreground border-none p-0 h-auto mt-1"
                            placeholder="Page Subtitle (optional)"
                          />
                        </div>
                      </div>
                      <div className="flex items-center gap-1">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8"
                          onClick={() => setSelectedPageId(page.id)}
                        >
                          <Edit className="w-4 h-4" />
                        </Button>
                        {/* Hide delete button if it's the only page */}
                        {pages.length > 1 && (
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive"
                            onClick={() => deletePage(page.id)}
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  {expandedPages.has(page.id) && (
                    <CardContent className="space-y-4">
                      {page.sections &&
                        page.sections.map((section) => (
                          <Card key={section.id} className="bg-muted/30">
                            <CardHeader className="pb-3">
                              <div className="flex items-start justify-between gap-2">
                                <div className="flex items-center gap-2 flex-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6"
                                    onClick={() => toggleSectionExpansion(section.id)}
                                  >
                                    {expandedSections.has(section.id) ? (
                                      <ChevronDown className="w-4 h-4" />
                                    ) : (
                                      <ChevronRight className="w-4 h-4" />
                                    )}
                                  </Button>
                                  <div className="flex-1">
                                    <Input
                                      value={section.title || ''}
                                      onChange={(e) =>
                                        updateSectionTitle(page.id, section.id, e.target.value)
                                      }
                                      className="font-medium border-none p-0 h-auto"
                                      placeholder="Section Title"
                                    />
                                    <Input
                                      value={section.subtitle || ''}
                                      onChange={(e) =>
                                        updateSectionSubtitle(page.id, section.id, e.target.value)
                                      }
                                      className="text-sm text-muted-foreground border-none p-0 h-auto mt-1"
                                      placeholder="Section Subtitle (optional)"
                                    />
                                  </div>
                                </div>
                                <div className="flex items-center gap-1">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8"
                                    onClick={() => {
                                      setSelectedSectionId(section.id);
                                      startAddingField(section.id);
                                    }}
                                  >
                                    <Plus className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-8 w-8 text-destructive"
                                    onClick={() => deleteSection(page.id, section.id)}
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </div>
                            </CardHeader>
                            {expandedSections.has(section.id) && (
                              <CardContent
                                className={`space-y-2 ${
                                  dragOverSectionId === section.id
                                    ? 'bg-primary/5 border-2 border-primary border-dashed rounded'
                                    : ''
                                }`}
                                onDragOver={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Only highlight if dragging a field type, not an existing field
                                  if (draggedFieldType && !draggedFieldId) {
                                    e.dataTransfer.dropEffect = 'move';
                                    setDragOverSectionId(section.id);
                                  }
                                }}
                                onDragLeave={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  // Only clear if we're leaving the section area, not entering a child
                                  if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                    setDragOverSectionId(null);
                                  }
                                }}
                                onDrop={(e) => {
                                  e.preventDefault();
                                  e.stopPropagation();
                                  setDragOverSectionId(null);

                                  // Only handle drop if it's a field type being dragged, not an existing field
                                  if (draggedFieldType && !draggedFieldId) {
                                    setSelectedSectionId(section.id);
                                    setSelectedPageId(page.id);
                                    setFieldConfig({
                                      type: draggedFieldType as FieldType,
                                      label: '',
                                      name: '',
                                      required: false,
                                      isRatingParameter: false,
                                      isMasterData: false,
                                      buttonText: '',
                                      buttonVariant: 'default',
                                    });
                                    setOptionsInput('');
                                    setDependentOptionsInput('');
                                    setSubFieldsConfig([]);
                                    setCombinationRowsCount(1);
                                    setCombinationRowLabels([]);
                                    setSelectedFieldId(null);
                                    setIsConfiguringField(true);
                                    setIsFieldDialogOpen(true);
                                    setDraggedFieldType(null);
                                  }
                                }}
                              >
                                {section.fields.map((field, fieldIndex) => (
                                  <div
                                    key={field.id}
                                    draggable
                                    onDragStart={(e) => {
                                      handleDragStart(field.id);
                                      e.dataTransfer.effectAllowed = 'move';
                                      e.dataTransfer.setData('fieldId', field.id);
                                    }}
                                    onDragOver={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Only handle if it's a field being dragged, not a field type
                                      if (draggedFieldId) {
                                        handleDragOver(e);
                                      }
                                    }}
                                    onDragLeave={(e) => {
                                      if (draggedFieldId) {
                                        handleDragLeave(e);
                                      }
                                    }}
                                    onDrop={(e) => {
                                      e.preventDefault();
                                      e.stopPropagation();
                                      // Only handle if it's a field being dragged, not a field type
                                      if (draggedFieldId) {
                                        handleDrop(e, field.id, page.id, section.id);
                                      }
                                    }}
                                    onDragEnd={(e) => {
                                      handleDragEnd();
                                    }}
                                    className={`flex items-center gap-2 p-2 rounded border bg-background cursor-move hover:bg-muted/50 transition-colors ${
                                      draggedFieldId === field.id ? 'opacity-50' : ''
                                    }`}
                                  >
                                    <GripVertical className="w-4 h-4 text-muted-foreground cursor-grab active:cursor-grabbing" />
                                    <div className="flex-1">
                                      <div className="flex items-center gap-2">
                                        <span className="text-sm font-medium">{field.label}</span>
                                        <Badge variant="outline" className="text-xs">
                                          {field.type}
                                        </Badge>
                                        {field.isRatingParameter && (
                                          <Badge variant="default" className="text-xs">
                                            Rating
                                          </Badge>
                                        )}
                                        {field.isMasterData && (
                                          <Badge variant="secondary" className="text-xs">
                                            Master Data
                                          </Badge>
                                        )}
                                      </div>
                                    </div>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        startEditingField(page.id, section.id, field);
                                      }}
                                    >
                                      <Edit className="w-4 h-4" />
                                    </Button>
                                    <Button
                                      variant="ghost"
                                      size="icon"
                                      className="h-8 w-8 text-destructive"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        deleteField(page.id, section.id, field.id);
                                      }}
                                    >
                                      <Trash2 className="w-4 h-4" />
                                    </Button>
                                  </div>
                                ))}
                                {section.fields.length === 0 && (
                                  <p className="text-sm text-muted-foreground text-center py-4">
                                    No fields yet. Click + to add a field.
                                  </p>
                                )}
                              </CardContent>
                            )}
                          </Card>
                        ))}
                      {(!page.sections || page.sections.length === 0) && (
                        <Button
                          variant="outline"
                          className="w-full"
                          onClick={() => addSection(page.id)}
                        >
                          <Plus className="w-4 h-4 mr-2" />
                          Add Section
                        </Button>
                      )}
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          </div>
        </div>

        {/* Right Panel - Preview */}
        <div className="w-96 border-l bg-muted/10 flex flex-col">
          <div className="p-6 flex-1 overflow-y-auto">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <Eye className="w-5 h-5" />
                <h3 className="font-semibold">Form Preview</h3>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreenPreview(true)}
                className="h-8 w-8"
                title="Open in fullscreen"
              >
                <Maximize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Horizontal Page Navigation */}
            <div className="mb-4 border-b overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {pages.map((page, index) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPreviewPage(page.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      currentPreviewPage === page.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            </div>

            {/* Current Page Preview */}
            <div className="space-y-6">
              {pages
                .filter((page) => page.id === currentPreviewPage)
                .map((page) => (
                  <Card key={page.id}>
                    <CardHeader>
                      <CardTitle>{page.title}</CardTitle>
                      {page.subtitle && <CardDescription>{page.subtitle}</CardDescription>}
                    </CardHeader>
                    <CardContent className="space-y-6">
                      {page.sections && page.sections.length > 0 ? (
                        page.sections.map((section) => (
                          <div key={section.id} className="space-y-4">
                            {section.title && (
                              <div>
                                <h4 className="font-semibold">{section.title}</h4>
                                {section.subtitle && (
                                  <p className="text-sm text-muted-foreground">
                                    {section.subtitle}
                                  </p>
                                )}
                              </div>
                            )}
                            <div className="grid grid-cols-2 gap-4">
                              {section.fields.map((field) => (
                                <div
                                  key={field.id}
                                  className={shouldFieldSpanFullWidth(field) ? 'col-span-2' : ''}
                                >
                                  {renderFieldPreview(field)}
                                </div>
                              ))}
                            </div>
                          </div>
                        ))
                      ) : (
                        <p className="text-sm text-muted-foreground text-center py-4">
                          No sections yet. Click + to add a section.
                        </p>
                      )}

                      {/* Navigation Buttons */}
                      {page.navigationFields && page.navigationFields.length > 0 && (
                        <div className="flex items-center justify-between gap-2 pt-4 border-t">
                          {page.navigationFields.map((navField) => {
                            if (navField.type === 'backButton') {
                              return (
                                <Button
                                  key={navField.id}
                                  variant={navField.buttonVariant || 'outline'}
                                  onClick={() => {
                                    if (navField.buttonTargetPage) {
                                      setCurrentPreviewPage(navField.buttonTargetPage);
                                    }
                                  }}
                                  className="gap-2"
                                >
                                  <ArrowLeftIcon className="w-4 h-4" />
                                  {navField.buttonText || 'Back'}
                                </Button>
                              );
                            } else if (navField.type === 'nextButton') {
                              return (
                                <Button
                                  key={navField.id}
                                  variant={navField.buttonVariant || 'default'}
                                  onClick={() => {
                                    // In real implementation, would call the API here
                                    if (navField.buttonApiUrl) {
                                      console.log('Saving page data to:', navField.buttonApiUrl);
                                    }
                                    // Navigate to target page or next page
                                    if (navField.buttonTargetPage) {
                                      setCurrentPreviewPage(navField.buttonTargetPage);
                                    } else {
                                      // Navigate to next page by default
                                      const nextPageId = getNextPage(currentPreviewPage);
                                      if (nextPageId) {
                                        setCurrentPreviewPage(nextPageId);
                                      }
                                    }
                                  }}
                                  className="gap-2 ml-auto"
                                >
                                  {navField.buttonText || 'Next'}
                                  <ArrowRight className="w-4 h-4" />
                                </Button>
                              );
                            } else if (navField.type === 'submitButton') {
                              return (
                                <Button
                                  key={navField.id}
                                  variant={navField.buttonVariant || 'default'}
                                  onClick={() => {
                                    // In real implementation, would call the API here
                                    if (navField.buttonApiUrl) {
                                      console.log(
                                        'Submitting form data to:',
                                        navField.buttonApiUrl,
                                      );
                                    }
                                    // Navigate to target page or next page
                                    if (navField.buttonTargetPage) {
                                      setCurrentPreviewPage(navField.buttonTargetPage);
                                    } else {
                                      // Navigate to next page by default
                                      const nextPageId = getNextPage(currentPreviewPage);
                                      if (nextPageId) {
                                        setCurrentPreviewPage(nextPageId);
                                      }
                                    }
                                  }}
                                  className="gap-2 ml-auto"
                                >
                                  <Send className="w-4 h-4" />
                                  {navField.buttonText || 'Submit'}
                                </Button>
                              );
                            }
                            return null;
                          })}
                        </div>
                      )}
                    </CardContent>
                  </Card>
                ))}
            </div>
          </div>
        </div>
      </div>

      {/* Fullscreen Preview Dialog */}
      <Dialog open={isFullscreenPreview} onOpenChange={setIsFullscreenPreview}>
        <DialogContent className="max-w-6xl max-h-[95vh] overflow-hidden p-0 flex flex-col">
          <DialogHeader className="sticky top-0 bg-background z-10 border-b px-6 py-4">
            <div className="flex items-center justify-between mb-4">
              <div>
                <DialogTitle className="text-2xl">Form Preview - Fullscreen</DialogTitle>
                <DialogDescription>
                  {productName} {productVersion && `v${productVersion}`}
                </DialogDescription>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => setIsFullscreenPreview(false)}
                className="h-8 w-8"
              >
                <Minimize2 className="w-4 h-4" />
              </Button>
            </div>

            {/* Horizontal Page Navigation */}
            <div className="border-b overflow-x-auto">
              <div className="flex gap-1 min-w-max">
                {pages.map((page) => (
                  <button
                    key={page.id}
                    onClick={() => setCurrentPreviewPage(page.id)}
                    className={`px-4 py-2 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                      currentPreviewPage === page.id
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground hover:border-muted-foreground'
                    }`}
                  >
                    {page.title}
                  </button>
                ))}
              </div>
            </div>
          </DialogHeader>
          <div className="p-6 space-y-8 overflow-y-auto flex-1">
            {pages
              .filter((page) => page.id === currentPreviewPage)
              .map((page) => (
                <Card key={page.id} className="mb-6">
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1">
                        <CardTitle>{page.title}</CardTitle>
                        {page.subtitle && <CardDescription>{page.subtitle}</CardDescription>}
                      </div>
                      <div className="flex items-center gap-2 min-w-0">
                        <div className="text-xs text-muted-foreground bg-muted px-2 py-1 rounded truncate max-w-md">
                          <span className="font-medium">URL: </span>
                          <span className="font-mono">{`${
                            window.location.origin
                          }/onboard/${designType.replace('Design', '').toLowerCase()}/${
                            page.id
                          }`}</span>
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-6">
                    {page.sections && page.sections.length > 0 ? (
                      page.sections.map((section) => (
                        <div key={section.id} className="space-y-4">
                          {section.title && (
                            <div>
                              <h4 className="font-semibold">{section.title}</h4>
                              {section.subtitle && (
                                <p className="text-sm text-muted-foreground">{section.subtitle}</p>
                              )}
                            </div>
                          )}
                          <div className="grid grid-cols-2 gap-4">
                            {section.fields.map((field) => (
                              <div
                                key={field.id}
                                className={shouldFieldSpanFullWidth(field) ? 'col-span-2' : ''}
                              >
                                {renderFieldPreview(field)}
                              </div>
                            ))}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-sm text-muted-foreground text-center py-4">
                        No sections yet. Click + to add a section.
                      </p>
                    )}

                    {/* Navigation Buttons */}
                    {page.navigationFields && page.navigationFields.length > 0 && (
                      <div className="flex items-center justify-between gap-2 pt-4 border-t">
                        {page.navigationFields.map((navField) => {
                          if (navField.type === 'backButton') {
                            return (
                              <Button
                                key={navField.id}
                                variant={navField.buttonVariant || 'outline'}
                                onClick={() => {
                                  if (navField.buttonTargetPage) {
                                    setCurrentPreviewPage(navField.buttonTargetPage);
                                  }
                                }}
                                className="gap-2"
                              >
                                <ArrowLeftIcon className="w-4 h-4" />
                                {navField.buttonText || 'Back'}
                              </Button>
                            );
                          } else if (navField.type === 'nextButton') {
                            return (
                              <Button
                                key={navField.id}
                                variant={navField.buttonVariant || 'default'}
                                onClick={() => {
                                  // In real implementation, would call the API here
                                  if (navField.buttonApiUrl) {
                                    console.log('Saving page data to:', navField.buttonApiUrl);
                                  }
                                  // Navigate to target page or next page
                                  if (navField.buttonTargetPage) {
                                    setCurrentPreviewPage(navField.buttonTargetPage);
                                  } else {
                                    // Navigate to next page by default
                                    const nextPageId = getNextPage(currentPreviewPage);
                                    if (nextPageId) {
                                      setCurrentPreviewPage(nextPageId);
                                    }
                                  }
                                }}
                                className="gap-2 ml-auto"
                              >
                                {navField.buttonText || 'Next'}
                                <ArrowRight className="w-4 h-4" />
                              </Button>
                            );
                          } else if (navField.type === 'submitButton') {
                            return (
                              <Button
                                key={navField.id}
                                variant={navField.buttonVariant || 'default'}
                                onClick={() => {
                                  // In real implementation, would call the API here
                                  if (navField.buttonApiUrl) {
                                    console.log('Submitting form data to:', navField.buttonApiUrl);
                                  }
                                  // Navigate to target page or next page
                                  if (navField.buttonTargetPage) {
                                    setCurrentPreviewPage(navField.buttonTargetPage);
                                  } else {
                                    // Navigate to next page by default
                                    const nextPageId = getNextPage(currentPreviewPage);
                                    if (nextPageId) {
                                      setCurrentPreviewPage(nextPageId);
                                    }
                                  }
                                }}
                                className="gap-2 ml-auto"
                              >
                                <Send className="w-4 h-4" />
                                {navField.buttonText || 'Submit'}
                              </Button>
                            );
                          }
                          return null;
                        })}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Page Dialog */}
      <Dialog open={isAddPageDialogOpen} onOpenChange={setIsAddPageDialogOpen}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Add New Page</DialogTitle>
            <DialogDescription>
              Select the type of page you want to add to the proposal form
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Page Title *</Label>
              <Input
                value={newPageConfig.title}
                onChange={(e) => setNewPageConfig({ ...newPageConfig, title: e.target.value })}
                placeholder="e.g., Company Information"
              />
            </div>
            <p className="text-xs text-muted-foreground">
              Administration forms support form pages only. You can add sections and fields to
              create your onboarding form.
            </p>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsAddPageDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleCreatePage}>Create Page</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Field Configuration Dialog */}
      <Dialog open={isFieldDialogOpen} onOpenChange={setIsFieldDialogOpen}>
        <DialogContent
          className={
            fieldConfig.type === 'combination'
              ? 'max-w-5xl max-h-[90vh] overflow-y-auto'
              : 'max-w-2xl max-h-[90vh] overflow-y-auto'
          }
        >
          <DialogHeader>
            <DialogTitle>{isConfiguringField ? 'Configure Field' : 'Edit Field'}</DialogTitle>
            <DialogDescription>
              {isConfiguringField
                ? 'Configure the field properties and settings'
                : 'Update the field properties and settings'}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Field Type</Label>
              <Select
                value={fieldConfig.type}
                onValueChange={(value) => {
                  const newType = value as FieldType;
                  // Clear rating parameter if changing to file, location, or button types
                  const buttonTypes = [
                    'chooseButton',
                    'nextButton',
                    'backButton',
                    'submitButton',
                    'button',
                  ];
                  if (
                    (newType === 'file' ||
                      newType === 'location' ||
                      buttonTypes.includes(newType)) &&
                    fieldConfig.isRatingParameter
                  ) {
                    setFieldConfig({
                      ...fieldConfig,
                      type: newType,
                      defaultValue: newType === fieldConfig.type ? fieldConfig.defaultValue : '',
                      isRatingParameter: false,
                    });
                  } else {
                    setFieldConfig({
                      ...fieldConfig,
                      type: newType,
                      defaultValue: newType === fieldConfig.type ? fieldConfig.defaultValue : '',
                    });
                  }
                  // Set default button text based on type
                  if (newType === 'nextButton') {
                    setFieldConfig({
                      ...fieldConfig,
                      type: newType,
                      buttonText: 'Next',
                      buttonVariant: 'default',
                    });
                  } else if (newType === 'backButton') {
                    setFieldConfig({
                      ...fieldConfig,
                      type: newType,
                      buttonText: 'Back',
                      buttonVariant: 'outline',
                    });
                  } else if (newType === 'submitButton') {
                    setFieldConfig({
                      ...fieldConfig,
                      type: newType,
                      buttonText: 'Submit',
                      buttonVariant: 'default',
                    });
                  }
                  // Clear master data if changing to combination type
                  if (newType === 'combination' && fieldConfig.isMasterData) {
                    setFieldConfig({ ...fieldConfig, isMasterData: false });
                  }
                  // Clear subFields and row config if not combination type
                  if (newType !== 'combination') {
                    setSubFieldsConfig([]);
                    setCombinationRowsCount(1);
                    setCombinationRowLabels([]);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent 
                  className="field-type-dropdown-content"
                  viewportClassName="field-type-dropdown-viewport"
                  hideScrollButtons={true}
                >
                  {fieldTypes.map((ft) => (
                    <SelectItem key={ft.value} value={ft.value}>
                      {ft.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Field Label *</Label>
              <Input
                value={fieldConfig.label || ''}
                onChange={(e) => {
                  const label = e.target.value;
                  const autoName = generateFieldName(label);
                  setFieldConfig({
                    ...fieldConfig,
                    label,
                    name: autoName,
                    // Update master data table name if master data is enabled
                    masterDataTable:
                      fieldConfig.isMasterData && autoName
                        ? `${autoName}_master`
                        : fieldConfig.masterDataTable,
                  });
                }}
                placeholder="e.g., Company Name"
              />
              <p className="text-xs text-muted-foreground">
                Field name will be auto-generated from the label
              </p>
            </div>
            <div className="space-y-2">
              <Label>Placeholder</Label>
              <Input
                value={fieldConfig.placeholder || ''}
                onChange={(e) => setFieldConfig({ ...fieldConfig, placeholder: e.target.value })}
                placeholder="Enter placeholder text"
              />
            </div>

            {/* Default Value - Show for applicable field types */}
            {fieldConfig.type !== 'file' &&
              fieldConfig.type !== 'combination' &&
              fieldConfig.type !== 'chooseButton' &&
              fieldConfig.type !== 'nextButton' &&
              fieldConfig.type !== 'backButton' &&
              fieldConfig.type !== 'submitButton' &&
              fieldConfig.type !== 'button' && (
                <div className="space-y-2">
                  <Label>Default Value</Label>
                  {fieldConfig.type === 'checkbox' ? (
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        checked={fieldConfig.defaultValue === true}
                        onChange={(e) =>
                          setFieldConfig({
                            ...fieldConfig,
                            defaultValue: e.target.checked ? true : undefined,
                          })
                        }
                        className="h-4 w-4 rounded border-gray-300"
                      />
                      <Label className="text-sm font-normal">Checked by default</Label>
                    </div>
                  ) : fieldConfig.type === 'dropdown' ? (
                    <Select
                      value={
                        typeof fieldConfig.defaultValue === 'string' ? fieldConfig.defaultValue : ''
                      }
                      onValueChange={(value) =>
                        setFieldConfig({ ...fieldConfig, defaultValue: value || undefined })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select default value (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No default value</SelectItem>
                        {(fieldConfig.options || []).map((option) => (
                          <SelectItem key={option} value={option}>
                            {option}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  ) : fieldConfig.type === 'multiselect' ? (
                    <div className="space-y-2">
                      <Select
                        value=""
                        onValueChange={(value) => {
                          if (value) {
                            const currentDefaults = Array.isArray(fieldConfig.defaultValue)
                              ? fieldConfig.defaultValue
                              : [];
                            if (!currentDefaults.includes(value)) {
                              setFieldConfig({
                                ...fieldConfig,
                                defaultValue: [...currentDefaults, value],
                              });
                            }
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue placeholder="Select default values (optional)" />
                        </SelectTrigger>
                        <SelectContent>
                          {(fieldConfig.options || []).map((option) => (
                            <SelectItem key={option} value={option}>
                              {option}
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                      {Array.isArray(fieldConfig.defaultValue) &&
                        fieldConfig.defaultValue.length > 0 && (
                          <div className="flex flex-wrap gap-2">
                            {fieldConfig.defaultValue.map((val, idx) => (
                              <Badge
                                key={idx}
                                variant="secondary"
                                className="flex items-center gap-1"
                              >
                                {val}
                                <button
                                  onClick={() => {
                                    const newDefaults = [...(fieldConfig.defaultValue as string[])];
                                    newDefaults.splice(idx, 1);
                                    setFieldConfig({
                                      ...fieldConfig,
                                      defaultValue:
                                        newDefaults.length > 0 ? newDefaults : undefined,
                                    });
                                  }}
                                  className="ml-1 hover:text-destructive"
                                >
                                  ×
                                </button>
                              </Badge>
                            ))}
                          </div>
                        )}
                    </div>
                  ) : fieldConfig.type === 'date' ? (
                    <Input
                      type="date"
                      value={
                        typeof fieldConfig.defaultValue === 'string' ? fieldConfig.defaultValue : ''
                      }
                      onChange={(e) =>
                        setFieldConfig({
                          ...fieldConfig,
                          defaultValue: e.target.value || undefined,
                        })
                      }
                    />
                  ) : fieldConfig.type === 'number' ? (
                    <Input
                      type="number"
                      step="any"
                      value={
                        typeof fieldConfig.defaultValue === 'number'
                          ? String(fieldConfig.defaultValue)
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        if (val === '' || val === '-') {
                          setFieldConfig({ ...fieldConfig, defaultValue: undefined });
                        } else {
                          const numVal = Number(val);
                          if (!isNaN(numVal)) {
                            setFieldConfig({ ...fieldConfig, defaultValue: numVal });
                          }
                        }
                      }}
                      placeholder="Enter default number"
                    />
                  ) : (
                    <Input
                      value={
                        typeof fieldConfig.defaultValue === 'string' ? fieldConfig.defaultValue : ''
                      }
                      onChange={(e) =>
                        setFieldConfig({
                          ...fieldConfig,
                          defaultValue: e.target.value || undefined,
                        })
                      }
                      placeholder="Enter default value"
                    />
                  )}
                  <p className="text-xs text-muted-foreground">
                    Value that will be pre-filled when the form loads
                  </p>
                </div>
              )}

            {/* Button-specific configuration - Show early for visibility */}
            {(fieldConfig.type === 'chooseButton' ||
              fieldConfig.type === 'nextButton' ||
              fieldConfig.type === 'backButton' ||
              fieldConfig.type === 'submitButton' ||
              fieldConfig.type === 'button') && (
              <div className="space-y-4 border-t pt-4">
                <h3 className="text-sm font-semibold">Button Configuration</h3>
                <div className="space-y-2">
                  <Label>Button Text *</Label>
                  <Input
                    value={fieldConfig.buttonText || ''}
                    onChange={(e) => setFieldConfig({ ...fieldConfig, buttonText: e.target.value })}
                    placeholder={
                      fieldConfig.type === 'nextButton'
                        ? 'Next'
                        : fieldConfig.type === 'backButton'
                          ? 'Back'
                          : fieldConfig.type === 'submitButton'
                            ? 'Submit'
                            : 'Button Text'
                    }
                  />
                </div>
                <div className="space-y-2">
                  <Label>Button Variant</Label>
                  <Select
                    value={fieldConfig.buttonVariant || 'default'}
                    onValueChange={(value) =>
                      setFieldConfig({ ...fieldConfig, buttonVariant: value as any })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="default">Default</SelectItem>
                      <SelectItem value="outline">Outline</SelectItem>
                      <SelectItem value="secondary">Secondary</SelectItem>
                      <SelectItem value="destructive">Destructive</SelectItem>
                      <SelectItem value="ghost">Ghost</SelectItem>
                      <SelectItem value="link">Link</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                {(fieldConfig.type === 'nextButton' ||
                  fieldConfig.type === 'submitButton' ||
                  fieldConfig.type === 'button') && (
                  <div className="space-y-2">
                    <Label>API URL (for saving form data) *</Label>
                    <Input
                      type="url"
                      value={fieldConfig.buttonApiUrl || ''}
                      onChange={(e) =>
                        setFieldConfig({ ...fieldConfig, buttonApiUrl: e.target.value })
                      }
                      placeholder="https://api.example.com/submit"
                      required={
                        fieldConfig.type === 'nextButton' || fieldConfig.type === 'submitButton'
                      }
                    />
                    <p className="text-xs text-muted-foreground">
                      {fieldConfig.type === 'nextButton' || fieldConfig.type === 'submitButton'
                        ? 'Required: API endpoint that will save form data to backend when button is clicked'
                        : 'API endpoint that will receive the form values when button is clicked'}
                    </p>
                  </div>
                )}
                {(fieldConfig.type === 'nextButton' || fieldConfig.type === 'backButton') && (
                  <div className="space-y-2">
                    <Label>Target Page</Label>
                    <Select
                      value={fieldConfig.buttonTargetPage || ''}
                      onValueChange={(value) =>
                        setFieldConfig({ ...fieldConfig, buttonTargetPage: value })
                      }
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select target page" />
                      </SelectTrigger>
                      <SelectContent>
                        {pages.map((page) => (
                          <SelectItem key={page.id} value={page.id}>
                            {page.title}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                    <p className="text-xs text-muted-foreground">
                      Page to navigate to when button is clicked
                    </p>
                  </div>
                )}
              </div>
            )}

            {fieldConfig.type === 'combination' && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label>Number of Rows *</Label>
                    <Input
                      type="number"
                      min="1"
                      value={combinationRowsCount}
                      onChange={(e) => {
                        const count = parseInt(e.target.value) || 1;
                        setCombinationRowsCount(count);
                        // Update row labels array to match new count
                        if (count > combinationRowLabels.length) {
                          setCombinationRowLabels([
                            ...combinationRowLabels,
                            ...Array(count - combinationRowLabels.length).fill(''),
                          ]);
                        } else {
                          setCombinationRowLabels(combinationRowLabels.slice(0, count));
                        }
                      }}
                      placeholder="e.g., 5"
                    />
                    <p className="text-xs text-muted-foreground">
                      How many rows should be displayed for this combination field
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label>Row Labels (Optional)</Label>
                    <Input
                      value={combinationRowLabels.join(', ')}
                      onChange={(e) => {
                        const labels = e.target.value
                          .split(',')
                          .map((l) => l.trim())
                          .filter((l) => l);
                        setCombinationRowLabels(labels);
                        // Update row count if labels are provided
                        if (labels.length > combinationRowsCount) {
                          setCombinationRowsCount(labels.length);
                        }
                      }}
                      placeholder="e.g., 2025, 2024, 2023, 2022, 2021"
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated labels for each row (e.g., years)
                    </p>
                  </div>
                </div>
                <div className="flex items-center justify-between">
                  <Label>Sub-Fields Configuration</Label>
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      const newSubField: SubField = {
                        id: `subfield${Date.now()}`,
                        label: '',
                        name: '',
                        type: 'text',
                      };
                      setSubFieldsConfig((prev) => [...prev, newSubField]);
                    }}
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Add Sub-Field
                  </Button>
                </div>
                {subFieldsConfig.length === 0 ? (
                  <p className="text-sm text-muted-foreground text-center py-4 border rounded">
                    No sub-fields added yet. Click "Add Sub-Field" to create a combination field.
                  </p>
                ) : (
                  <div className="border rounded-lg">
                    <div className="">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-[200px]">Label *</TableHead>
                            <TableHead className="w-[150px]">Type *</TableHead>
                            <TableHead className="w-[200px]">Placeholder</TableHead>
                            <TableHead className="w-[200px]">Options (if dropdown)</TableHead>
                            <TableHead className="w-[100px] text-center">Required</TableHead>
                            <TableHead className="w-[100px] text-center">Actions</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subFieldsConfig.map((subField, idx) => (
                            <TableRow key={subField.id}>
                              <TableCell>
                                <Input
                                  value={subField.label}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSubFieldsConfig((prev) => {
                                      const updated = [...prev];
                                      updated[idx] = {
                                        ...updated[idx],
                                        label: value,
                                        name: generateFieldName(value),
                                      };
                                      return updated;
                                    });
                                  }}
                                  placeholder="e.g., Year"
                                  className="h-8"
                                />
                                {subField.name && (
                                  <p className="text-xs text-muted-foreground mt-1">
                                    <code className="bg-muted px-1 rounded">{subField.name}</code>
                                  </p>
                                )}
                              </TableCell>
                              <TableCell>
                                <Select
                                  value={subField.type}
                                  onValueChange={(value) => {
                                    setSubFieldsConfig((prev) => {
                                      const updated = [...prev];
                                      updated[idx] = {
                                        ...updated[idx],
                                        type: value as SubField['type'],
                                      };
                                      return updated;
                                    });
                                  }}
                                >
                                  <SelectTrigger className="h-8">
                                    <SelectValue />
                                  </SelectTrigger>
                                  <SelectContent>
                                    <SelectItem value="text">Text</SelectItem>
                                    <SelectItem value="number">Number</SelectItem>
                                    <SelectItem value="date">Date</SelectItem>
                                    <SelectItem value="time">Time</SelectItem>
                                    <SelectItem value="dropdown">Dropdown</SelectItem>
                                    <SelectItem value="checkbox">Checkbox</SelectItem>
                                    <SelectItem value="location">Location</SelectItem>
                                  </SelectContent>
                                </Select>
                              </TableCell>
                              <TableCell>
                                <Input
                                  value={subField.placeholder || ''}
                                  onChange={(e) => {
                                    const value = e.target.value;
                                    setSubFieldsConfig((prev) => {
                                      const updated = [...prev];
                                      updated[idx] = {
                                        ...updated[idx],
                                        placeholder: value,
                                      };
                                      return updated;
                                    });
                                  }}
                                  placeholder="Enter placeholder"
                                  className="h-8"
                                />
                              </TableCell>
                              <TableCell>
                                {subField.type === 'dropdown' ? (
                                  <Input
                                    value={subField.options?.join(', ') || ''}
                                    onChange={(e) => {
                                      const value = e.target.value;
                                      const parsedOptions = value
                                        .split(',')
                                        .map((o) => o.trim())
                                        .filter((o) => o);
                                      setSubFieldsConfig((prev) => {
                                        const updated = [...prev];
                                        updated[idx] = {
                                          ...updated[idx],
                                          options:
                                            parsedOptions.length > 0 ? parsedOptions : undefined,
                                        };
                                        return updated;
                                      });
                                    }}
                                    placeholder="Option 1, Option 2"
                                    className="h-8"
                                  />
                                ) : subField.type === 'location' ? (
                                  <div className="space-y-1">
                                    <Select
                                      value={subField.mapProvider || 'google'}
                                      onValueChange={(value) => {
                                        setSubFieldsConfig((prev) => {
                                          const updated = [...prev];
                                          updated[idx] = {
                                            ...updated[idx],
                                            mapProvider: value,
                                            mapApiUrl:
                                              value === 'default'
                                                ? 'https://nominatim.openstreetmap.org'
                                                : value === 'google'
                                                  ? 'https://maps.googleapis.com/maps/api/js'
                                                  : '',
                                          };
                                          return updated;
                                        });
                                      }}
                                    >
                                      <SelectTrigger className="h-8 text-xs">
                                        <SelectValue placeholder="Provider" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        <SelectItem value="default">Default</SelectItem>
                                        <SelectItem value="google">Google</SelectItem>
                                      </SelectContent>
                                    </Select>
                                  </div>
                                ) : (
                                  <span className="text-xs text-muted-foreground">N/A</span>
                                )}
                              </TableCell>
                              <TableCell className="text-center">
                                <Switch
                                  checked={subField.required || false}
                                  onCheckedChange={(checked) => {
                                    setSubFieldsConfig((prev) => {
                                      const updated = [...prev];
                                      updated[idx] = {
                                        ...updated[idx],
                                        required: checked,
                                      };
                                      return updated;
                                    });
                                  }}
                                />
                              </TableCell>
                              <TableCell className="text-center">
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="icon"
                                  className="h-8 w-8 text-destructive"
                                  onClick={() => {
                                    setSubFieldsConfig((prev) => prev.filter((_, i) => i !== idx));
                                  }}
                                >
                                  <Trash2 className="w-4 h-4" />
                                </Button>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>
                  </div>
                )}
                <p className="text-xs text-muted-foreground">
                  Sub-fields will be combined into an array of objects when submitted. Example: [
                  {"{year: 2025, claimsValue: 3200000, description: '...'}"}]
                </p>
              </div>
            )}

            {(fieldConfig.type === 'dropdown' || fieldConfig.type === 'multiselect') && (
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label>Dependent Dropdown</Label>
                  <Select
                    value={fieldConfig.dependentOn || undefined}
                    onValueChange={(value) => {
                      if (value) {
                        // Find the parent field and mark it as required
                        const parentField = pages
                          .flatMap((page) => page.sections.flatMap((section) => section.fields))
                          .find((field) => field.name === value);

                        if (parentField) {
                          // Update the parent field to be required
                          setPages(
                            pages.map((page) => ({
                              ...page,
                              sections: page.sections.map((section) => ({
                                ...section,
                                fields: section.fields.map((field) =>
                                  field.id === parentField.id
                                    ? { ...field, required: true }
                                    : field,
                                ),
                              })),
                            })),
                          );
                        }

                        setFieldConfig({
                          ...fieldConfig,
                          dependentOn: value,
                          // Clear static options if setting up dependency
                          options: undefined,
                        });

                        toast({
                          title: 'Parent Field Marked Required',
                          description: `The parent field "${
                            parentField?.label || value
                          }" has been automatically marked as required.`,
                        });
                      } else {
                        setFieldConfig({
                          ...fieldConfig,
                          dependentOn: undefined,
                          dependentOptions: undefined,
                        });
                      }
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select parent field (optional)" />
                    </SelectTrigger>
                    <SelectContent>
                      {pages.flatMap((page) =>
                        page.sections.flatMap((section) =>
                          section.fields
                            .filter(
                              (field) =>
                                // Only show dropdown/select fields that aren't the current field
                                (field.type === 'dropdown' ||
                                  field.type === 'multiselect' ||
                                  field.type === 'text') &&
                                field.name !== fieldConfig.name &&
                                field.id !== selectedFieldId,
                            )
                            .map((field) => (
                              <SelectItem key={field.id} value={field.name}>
                                {field.label} ({field.name})
                              </SelectItem>
                            )),
                        ),
                      )}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground">
                    Select a parent field to create a dependent dropdown (e.g., Region depends on
                    Country)
                  </p>
                </div>

                {fieldConfig.dependentOn ? (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <Label>Dependent Options Source</Label>
                      <Select
                        value={fieldConfig.dependentOptionsUrl !== undefined ? 'url' : 'input'}
                        onValueChange={(value) => {
                          if (value === 'url') {
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptions: undefined,
                              dependentOptionsUrl: '',
                            });
                          } else {
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptionsUrl: undefined,
                              dependentOptions: {},
                            });
                          }
                        }}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="input">Manual Input</SelectItem>
                          <SelectItem value="url">Fetch from URL</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {fieldConfig.dependentOptionsUrl !== undefined ? (
                      <div className="space-y-2">
                        <Label>Dependent Options URL</Label>
                        <Input
                          type="url"
                          value={fieldConfig.dependentOptionsUrl || ''}
                          onChange={(e) =>
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptionsUrl: e.target.value,
                            })
                          }
                          placeholder="https://api.example.com/regions?country={parentValue}"
                        />
                        <p className="text-xs text-muted-foreground">
                          URL endpoint that returns dependent options. Use {'{parentValue}'} as
                          placeholder for parent field value. Expected format:{' '}
                          {`{ "USA": ["Option 1", "Option 2"], "Canada": ["Option 3"] }`}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-2">
                        <Label>Dependent Options Mapping</Label>
                        <p className="text-xs text-muted-foreground mb-2">
                          Format: Parent Value = Child Option 1, Child Option 2, Child Option 3
                        </p>
                        <Textarea
                          value={
                            dependentOptionsInput ||
                            (fieldConfig.dependentOptions
                              ? Object.entries(fieldConfig.dependentOptions)
                                  .map(
                                    ([parent, children]: [string, string[]]) =>
                                      `${parent} = ${children.join(', ')}`,
                                  )
                                  .join('\n')
                              : '')
                          }
                          onChange={(e) => {
                            const value = e.target.value;
                            setDependentOptionsInput(value);
                            // Parse options but keep the raw input for display
                            const lines = value.split('\n').filter((l) => l.trim());
                            const mapping: Record<string, string[]> = {};
                            lines.forEach((line) => {
                              const [parent, childrenStr] = line.split('=').map((s) => s.trim());
                              if (parent && childrenStr) {
                                // Keep all values including numbers as strings
                                mapping[parent] = childrenStr
                                  .split(',')
                                  .map((c) => c.trim())
                                  .filter((c) => c !== '');
                              }
                            });
                            setFieldConfig({
                              ...fieldConfig,
                              dependentOptions:
                                Object.keys(mapping).length > 0 ? mapping : undefined,
                            });
                          }}
                          placeholder="USA = North, South, East, West&#10;Canada = Ontario, Quebec, British Columbia&#10;UK = England, Scotland, Wales&#10;123 = Option 1, Option 2, 456"
                          rows={6}
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter one mapping per line. Example: "USA = North, South, East, West"
                        </p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {fieldConfig.type === 'chooseButton' && (
                      <div className="space-y-2">
                        <Label>Button Options (comma-separated) *</Label>
                        <Input
                          value={optionsInput || fieldConfig.options?.join(', ') || ''}
                          onChange={(e) => {
                            const value = e.target.value;
                            setOptionsInput(value);
                            const parsedOptions = value
                              .split(',')
                              .map((o) => o.trim())
                              .filter((o) => o);
                            setFieldConfig({
                              ...fieldConfig,
                              options: parsedOptions.length > 0 ? parsedOptions : undefined,
                            });
                          }}
                          placeholder="Option 1, Option 2, Option 3"
                        />
                        <p className="text-xs text-muted-foreground">
                          Enter options separated by commas. Each will appear as a button.
                        </p>
                      </div>
                    )}
                    {fieldConfig.type !== 'chooseButton' && (
                      <>
                        <div className="space-y-2">
                          <Label>Options Source</Label>
                          <Select
                            value={fieldConfig.optionsUrl !== undefined ? 'url' : 'static'}
                            onValueChange={(value) => {
                              if (value === 'url') {
                                setFieldConfig({
                                  ...fieldConfig,
                                  options: undefined,
                                  optionsUrl: '',
                                });
                              } else {
                                setFieldConfig({
                                  ...fieldConfig,
                                  optionsUrl: undefined,
                                  options: [],
                                });
                              }
                            }}
                          >
                            <SelectTrigger>
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="static">Comma-separated Input</SelectItem>
                              <SelectItem value="url">Fetch from URL</SelectItem>
                            </SelectContent>
                          </Select>
                        </div>

                        {fieldConfig.optionsUrl !== undefined ? (
                          <div className="space-y-2">
                            <Label>Options URL</Label>
                            <Input
                              type="url"
                              value={fieldConfig.optionsUrl || ''}
                              onChange={(e) =>
                                setFieldConfig({
                                  ...fieldConfig,
                                  optionsUrl: e.target.value,
                                })
                              }
                              placeholder="https://api.example.com/countries"
                            />
                            <p className="text-xs text-muted-foreground">
                              URL endpoint that returns JSON array of options. Expected format:
                              ["Option 1", "Option 2", ...]
                            </p>
                          </div>
                        ) : (
                          <div className="space-y-2">
                            <Label>Options (comma-separated)</Label>
                            <Input
                              value={optionsInput || fieldConfig.options?.join(', ') || ''}
                              onChange={(e) => {
                                const value = e.target.value;
                                setOptionsInput(value);
                                // Parse options but keep the raw input for display
                                const parsedOptions = value
                                  .split(',')
                                  .map((o) => o.trim())
                                  .filter((o) => o);
                                setFieldConfig({
                                  ...fieldConfig,
                                  options: parsedOptions.length > 0 ? parsedOptions : undefined,
                                });
                              }}
                              placeholder="Option 1, Option 2, Option 3"
                            />
                            <p className="text-xs text-muted-foreground">
                              Enter options separated by commas
                            </p>
                          </div>
                        )}
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            <Separator />

            <div className="space-y-4">
              <Label>Validations</Label>
              {fieldConfig.type === 'text' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Max Characters</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 100"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxLength')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'maxLength')!.value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'maxLength');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'maxLength',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({ type: 'maxLength', value: parseInt(val, 10) });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Min Characters</Label>
                      <Input
                        type="number"
                        min="1"
                        placeholder="e.g., 3"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minLength')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'minLength')!.value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'minLength');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'minLength',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({ type: 'minLength', value: parseInt(val, 10) });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Format</Label>
                    <Select
                      value={
                        fieldConfig.validations?.find((v) =>
                          ['email', 'url', 'phone'].includes(v.type),
                        )?.type || undefined
                      }
                      onValueChange={(value) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) =>
                          ['email', 'url', 'phone'].includes(v.type),
                        );
                        if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        if (value) {
                          validations.push({ type: value });
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select format (optional)" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="email">Email</SelectItem>
                        <SelectItem value="url">URL</SelectItem>
                        <SelectItem value="phone">Phone Number</SelectItem>
                      </SelectContent>
                    </Select>
                    {fieldConfig.validations?.find((v) =>
                      ['email', 'url', 'phone'].includes(v.type),
                    ) && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        className="h-6 text-xs"
                        onClick={() => {
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) =>
                            ['email', 'url', 'phone'].includes(v.type),
                          );
                          if (existing >= 0) {
                            validations.splice(existing, 1);
                            setFieldConfig({ ...fieldConfig, validations });
                          }
                        }}
                      >
                        Clear format
                      </Button>
                    )}
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Pattern (Regex)</Label>
                    <Input
                      placeholder="e.g., ^[A-Z0-9]+$"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'pattern')?.value || ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'pattern');
                        if (val) {
                          if (existing >= 0) {
                            validations[existing] = { type: 'pattern', value: val };
                          } else {
                            validations.push({ type: 'pattern', value: val });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                </div>
              )}

              {fieldConfig.type === 'number' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Value</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 0"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'min')?.value != null
                            ? String(fieldConfig.validations.find((v) => v.type === 'min')!.value)
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'min');
                          // Allow empty string or negative sign for clearing/typing
                          if (val === '' || val === '-') {
                            if (existing >= 0) {
                              validations.splice(existing, 1);
                            }
                            setFieldConfig({ ...fieldConfig, validations });
                            return;
                          }
                          // Check if it's a valid number (including 0, negative numbers, and decimals)
                          const numVal = Number(val);
                          if (!isNaN(numVal) && val !== '') {
                            // Valid number including 0
                            if (existing >= 0) {
                              validations[existing] = { type: 'min', value: numVal };
                            } else {
                              validations.push({ type: 'min', value: numVal });
                            }
                            setFieldConfig({ ...fieldConfig, validations });
                          }
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Value</Label>
                      <Input
                        type="number"
                        step="any"
                        placeholder="e.g., 100"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'max')?.value != null
                            ? String(fieldConfig.validations.find((v) => v.type === 'max')!.value)
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'max');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = { type: 'max', value: parseFloat(val) };
                            } else {
                              validations.push({ type: 'max', value: parseFloat(val) });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Integer Only</Label>
                      <p className="text-xs text-muted-foreground">No decimal values</p>
                    </div>
                    <Switch
                      checked={fieldConfig.validations?.some((v) => v.type === 'integer') || false}
                      onCheckedChange={(checked) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'integer');
                        if (checked && existing < 0) {
                          validations.push({ type: 'integer' });
                        } else if (!checked && existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Decimal Places</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 2"
                      min="0"
                      max="10"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'decimalPlaces')?.value !=
                        null
                          ? String(
                              fieldConfig.validations.find((v) => v.type === 'decimalPlaces')!
                                .value,
                            )
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'decimalPlaces');
                        if (val && val !== '' && !isNaN(Number(val))) {
                          if (existing >= 0) {
                            validations[existing] = {
                              type: 'decimalPlaces',
                              value: parseInt(val, 10),
                            };
                          } else {
                            validations.push({ type: 'decimalPlaces', value: parseInt(val, 10) });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                </div>
              )}

              {fieldConfig.type === 'date' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Must be today or later</Label>
                      <p className="text-xs text-muted-foreground">Date cannot be in the past</p>
                    </div>
                    <Switch
                      checked={
                        fieldConfig.validations?.some((v) => v.type === 'minDateToday') || false
                      }
                      onCheckedChange={(checked) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'minDateToday');
                        if (checked && existing < 0) {
                          validations.push({ type: 'minDateToday' });
                        } else if (!checked && existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="space-y-0.5">
                      <Label className="text-sm">Must be today or earlier</Label>
                      <p className="text-xs text-muted-foreground">Date cannot be in the future</p>
                    </div>
                    <Switch
                      checked={
                        fieldConfig.validations?.some((v) => v.type === 'maxDateToday') || false
                      }
                      onCheckedChange={(checked) => {
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'maxDateToday');
                        if (checked && existing < 0) {
                          validations.push({ type: 'maxDateToday' });
                        } else if (!checked && existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Days from Today</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 30"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minDaysFromToday')
                            ?.value != null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'minDaysFromToday')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex(
                            (v) => v.type === 'minDaysFromToday',
                          );
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'minDaysFromToday',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'minDaysFromToday',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Minimum days from today</p>
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Days from Today</Label>
                      <Input
                        type="number"
                        min="0"
                        placeholder="e.g., 365"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxDaysFromToday')
                            ?.value != null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'maxDaysFromToday')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex(
                            (v) => v.type === 'maxDaysFromToday',
                          );
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'maxDaysFromToday',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({
                                type: 'maxDaysFromToday',
                                value: parseInt(val, 10),
                              });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                      <p className="text-xs text-muted-foreground">Maximum days from today</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Date</Label>
                      <Input
                        type="date"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minDate')?.value || ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'minDate');
                          if (val) {
                            if (existing >= 0) {
                              validations[existing] = { type: 'minDate', value: val };
                            } else {
                              validations.push({ type: 'minDate', value: val });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Date</Label>
                      <Input
                        type="date"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxDate')?.value || ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'maxDate');
                          if (val) {
                            if (existing >= 0) {
                              validations[existing] = { type: 'maxDate', value: val };
                            } else {
                              validations.push({ type: 'maxDate', value: val });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {fieldConfig.type === 'file' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2">
                    <Label className="text-sm">Max File Size (MB)</Label>
                    <Input
                      type="number"
                      min="0"
                      step="0.1"
                      placeholder="e.g., 10"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'maxFileSize')?.value !=
                        null
                          ? String(
                              fieldConfig.validations.find((v) => v.type === 'maxFileSize')!.value,
                            )
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'maxFileSize');
                        if (val && val !== '' && !isNaN(Number(val))) {
                          if (existing >= 0) {
                            validations[existing] = { type: 'maxFileSize', value: parseFloat(val) };
                          } else {
                            validations.push({ type: 'maxFileSize', value: parseFloat(val) });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Allowed File Types</Label>
                    <Input
                      placeholder="e.g., pdf,doc,docx"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'allowedTypes')?.value || ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'allowedTypes');
                        if (val) {
                          if (existing >= 0) {
                            validations[existing] = { type: 'allowedTypes', value: val };
                          } else {
                            validations.push({ type: 'allowedTypes', value: val });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated file extensions (e.g., pdf,doc,docx)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label className="text-sm">Max Number of Files</Label>
                    <Input
                      type="number"
                      placeholder="e.g., 5"
                      min="1"
                      value={
                        fieldConfig.validations?.find((v) => v.type === 'maxFiles')?.value != null
                          ? String(
                              fieldConfig.validations.find((v) => v.type === 'maxFiles')!.value,
                            )
                          : ''
                      }
                      onChange={(e) => {
                        const val = e.target.value;
                        const validations = fieldConfig.validations || [];
                        const existing = validations.findIndex((v) => v.type === 'maxFiles');
                        if (val && val !== '' && !isNaN(Number(val))) {
                          if (existing >= 0) {
                            validations[existing] = { type: 'maxFiles', value: parseInt(val, 10) };
                          } else {
                            validations.push({ type: 'maxFiles', value: parseInt(val, 10) });
                          }
                        } else if (existing >= 0) {
                          validations.splice(existing, 1);
                        }
                        setFieldConfig({ ...fieldConfig, validations });
                      }}
                    />
                  </div>
                </div>
              )}

              {fieldConfig.type === 'multiselect' && (
                <div className="space-y-3 p-4 border rounded-lg bg-muted/30">
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label className="text-sm">Min Selections</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 1"
                        min="0"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'minSelections')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'minSelections')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'minSelections');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'minSelections',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({ type: 'minSelections', value: parseInt(val, 10) });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="text-sm">Max Selections</Label>
                      <Input
                        type="number"
                        placeholder="e.g., 5"
                        min="1"
                        value={
                          fieldConfig.validations?.find((v) => v.type === 'maxSelections')?.value !=
                          null
                            ? String(
                                fieldConfig.validations.find((v) => v.type === 'maxSelections')!
                                  .value,
                              )
                            : ''
                        }
                        onChange={(e) => {
                          const val = e.target.value;
                          const validations = fieldConfig.validations || [];
                          const existing = validations.findIndex((v) => v.type === 'maxSelections');
                          if (val && val !== '' && !isNaN(Number(val))) {
                            if (existing >= 0) {
                              validations[existing] = {
                                type: 'maxSelections',
                                value: parseInt(val, 10),
                              };
                            } else {
                              validations.push({ type: 'maxSelections', value: parseInt(val, 10) });
                            }
                          } else if (existing >= 0) {
                            validations.splice(existing, 1);
                          }
                          setFieldConfig({ ...fieldConfig, validations });
                        }}
                      />
                    </div>
                  </div>
                </div>
              )}

              {(fieldConfig.type === 'dropdown' || fieldConfig.type === 'checkbox') && (
                <div className="p-4 border rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">
                    {fieldConfig.type === 'dropdown'
                      ? 'Dropdown fields are validated by ensuring selection from the provided options.'
                      : 'Checkbox validation is handled by the Required field toggle above.'}
                  </p>
                </div>
              )}
            </div>

            <div className="space-y-2">
              <Label>Conditional Logic</Label>
              <div className="grid grid-cols-3 gap-2">
                <Select
                  value={fieldConfig.conditionalLogic?.field || undefined}
                  onValueChange={(value) =>
                    setFieldConfig({
                      ...fieldConfig,
                      conditionalLogic: {
                        ...fieldConfig.conditionalLogic,
                        field: value,
                        condition: fieldConfig.conditionalLogic?.condition || 'equals',
                        value: fieldConfig.conditionalLogic?.value || '',
                      } as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select field" />
                  </SelectTrigger>
                  <SelectContent>
                    {pages.flatMap((page) =>
                      (page.sections || []).flatMap((section) =>
                        (section.fields || [])
                          .filter(
                            (field) =>
                              // Exclude current field being configured (by name) or by id if editing
                              field.name !== fieldConfig.name && field.id !== selectedFieldId,
                          )
                          .map((field) => (
                            <SelectItem key={field.id} value={field.name}>
                              {field.label} ({field.name})
                            </SelectItem>
                          )),
                      ),
                    )}
                    {pages.flatMap((page) =>
                      (page.sections || []).flatMap((section) => section.fields || []),
                    ).length === 0 && (
                      <div className="px-2 py-6 text-center text-sm text-muted-foreground">
                        No fields available. Add fields first.
                      </div>
                    )}
                  </SelectContent>
                </Select>
                <Select
                  value={fieldConfig.conditionalLogic?.condition || 'equals'}
                  onValueChange={(value) =>
                    setFieldConfig({
                      ...fieldConfig,
                      conditionalLogic: {
                        ...fieldConfig.conditionalLogic,
                        condition: value,
                        field: fieldConfig.conditionalLogic?.field || '',
                        value: fieldConfig.conditionalLogic?.value || '',
                      } as any,
                    })
                  }
                >
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="equals">Equals</SelectItem>
                    <SelectItem value="not_equals">Not Equals</SelectItem>
                    <SelectItem value="contains">Contains</SelectItem>
                    <SelectItem value="greater_than">Greater Than</SelectItem>
                    <SelectItem value="less_than">Less Than</SelectItem>
                  </SelectContent>
                </Select>
                <Input
                  placeholder="Value"
                  value={fieldConfig.conditionalLogic?.value || ''}
                  onChange={(e) =>
                    setFieldConfig({
                      ...fieldConfig,
                      conditionalLogic: {
                        ...fieldConfig.conditionalLogic,
                        value: e.target.value,
                        field: fieldConfig.conditionalLogic?.field || '',
                        condition: fieldConfig.conditionalLogic?.condition || 'equals',
                      } as any,
                    })
                  }
                />
              </div>
              <div className="flex items-center justify-between">
                <p className="text-xs text-muted-foreground">
                  Example: If "Industry" equals "Construction", show this field
                </p>
                {fieldConfig.conditionalLogic?.field && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="h-6 text-xs"
                    onClick={() => {
                      setFieldConfig({
                        ...fieldConfig,
                        conditionalLogic: undefined,
                      });
                    }}
                  >
                    Clear
                  </Button>
                )}
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsFieldDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={saveField}>{isConfiguringField ? 'Add Field' : 'Update Field'}</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={deleteDialog.isOpen}
        onOpenChange={(open) => setDeleteDialog({ ...deleteDialog, isOpen: open })}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              Delete {deleteDialog.type.charAt(0).toUpperCase() + deleteDialog.type.slice(1)}
            </AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{deleteDialog.title}"? This action cannot be undone
              and will remove all nested content within this {deleteDialog.type}.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};


export default AdministrationFormDesign;
