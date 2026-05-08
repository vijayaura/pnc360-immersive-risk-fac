import { useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { Footer } from "@/components/layout/Footer";
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/features/quotes/components/QuotesComparison/QuoteStatusDot";
import { ArrowLeft, Building2, Calendar, DollarSign, Settings2, Eye, Shield, FileText, Download, Send } from "lucide-react";
import { TableSearchFilter, FilterConfig } from "@/components/shared/TableSearchFilter";
import { useTableSearch } from '@/shared/hooks/useTableSearch';
import * as XLSX from 'xlsx';

// Mock data for specific insurer quotes - expanded to 10+ entries
const mockInsurerData = {
  "emirates-insurance": {
    name: "Emirates Insurance",
    email: "contact@emiratesinsurance.ae",
    phone: "+971-4-123-4567",
    quotes: [
      {
        id: "Q001",
        customerName: "John Smith",
        companyName: "Smith Construction LLC",
        projectType: "Commercial Building",
        projectValue: "AED 9,175,000",
        submittedDate: "2024-01-15",
        status: QUOTE_STATUSES.QUOTE_GENERATED,
        premium: "AED 57,800",
        coverage: "General Liability + Property"
      },
      {
        id: "Q005",
        customerName: "Ahmed Al Mansouri",
        companyName: "Al Mansouri Contracting",
        projectType: "Residential Villa",
        projectValue: "AED 4,500,000",
        submittedDate: "2024-01-14",
        status: QUOTE_STATUSES.QUOTE_CONFIRMED,
        premium: "AED 32,400",
        coverage: "Full Coverage Package"
      },
      {
        id: "Q013",
        customerName: "Khalid Rahman",
        companyName: "Rahman Engineering",
        projectType: "Office Tower",
        projectValue: "AED 18,200,000",
        submittedDate: "2024-01-13",
        status: QUOTE_STATUSES.POLICY_GENERATED,
        premium: "AED 127,400",
        coverage: "Comprehensive Coverage"
      },
      {
        id: "Q014",
        customerName: "Sofia Martinez",
        companyName: "Martinez Construction",
        projectType: "Shopping Center",
        projectValue: "AED 11,800,000",
        submittedDate: "2024-01-12",
        status: QUOTE_STATUSES.QUOTE_GENERATED,
        premium: "AED 82,600",
        coverage: "General Liability + Property"
      },
      {
        id: "Q015",
        customerName: "Robert Johnson",
        companyName: "Johnson Infrastructure",
        projectType: "Hospital Complex",
        projectValue: "AED 25,300,000",
        submittedDate: "2024-01-11",
        status: QUOTE_STATUSES.PAYMENT_PENDING,
        premium: "AED 177,100",
        coverage: "Full Coverage Package"
      },
      {
        id: "Q016",
        customerName: "Aisha Al Mahmoud",
        companyName: "Al Mahmoud Builders",
        projectType: "School Campus",
        projectValue: "AED 8,700,000",
        submittedDate: "2024-01-10",
        status: QUOTE_STATUSES.QUOTE_CONFIRMED,
        premium: "AED 60,900",
        coverage: "Educational Facility Coverage"
      }
    ]
  },
  "axa-gulf": {
    name: "AXA Gulf",
    email: "dubai@axa-gulf.com",
    phone: "+971-4-987-6543",
    quotes: [
      {
        id: "Q002",
        customerName: "Sarah Johnson",
        companyName: "Johnson Builders Inc",
        projectType: "Residential Complex",
        projectValue: "AED 6,606,000",
        submittedDate: "2024-01-14",
        status: QUOTE_STATUSES.QUOTE_GENERATED,
        premium: "AED 45,528",
        coverage: "General Liability"
      },
      {
        id: "Q017",
        customerName: "Hassan Abdullah",
        companyName: "Abdullah Development",
        projectType: "Mixed Use Tower",
        projectValue: "AED 32,400,000",
        submittedDate: "2024-01-13",
        status: QUOTE_STATUSES.QUOTE_CONFIRMED,
        premium: "AED 226,800",
        coverage: "Premium Coverage Package"
      },
      {
        id: "Q018",
        customerName: "Elena Petrov",
        companyName: "Petrov Construction",
        projectType: "Industrial Facility",
        projectValue: "AED 14,900,000",
        submittedDate: "2024-01-12",
        status: QUOTE_STATUSES.SELECTED_PRODUCT,
        premium: "AED 104,300",
        coverage: "Industrial Coverage"
      },
      {
        id: "Q019",
        customerName: "Mohammed Al Rashid",
        companyName: "Al Rashid Contracting",
        projectType: "Warehouse Complex",
        projectValue: "AED 7,200,000",
        submittedDate: "2024-01-11",
        status: QUOTE_STATUSES.POLICY_GENERATED,
        premium: "AED 50,400",
        coverage: "Property + Equipment"
      },
      {
        id: "Q020",
        customerName: "Carlos Rodriguez",
        companyName: "Rodriguez Group",
        projectType: "Resort Development",
        projectValue: "AED 28,600,000",
        submittedDate: "2024-01-10",
        status: QUOTE_STATUSES.PAYMENT_PENDING,
        premium: "AED 200,200",
        coverage: "Hospitality Coverage"
      }
    ]
  },
  "oman-insurance": {
    name: "Oman Insurance",
    email: "info@omaninsurance.com",
    phone: "+971-4-555-7890",
    quotes: [
      {
        id: "Q003",
        customerName: "Mike Wilson",
        companyName: "Wilson Infrastructure",
        projectType: "Bridge Construction",
        projectValue: "AED 19,092,000",
        submittedDate: "2024-01-13",
        status: QUOTE_STATUSES.POLICY_GENERATED,
        premium: "AED 106,106",
        coverage: "Full Coverage Package"
      },
      {
        id: "Q021",
        customerName: "Fatima Al Zahra",
        companyName: "Al Zahra Engineering",
        projectType: "Metro Station",
        projectValue: "AED 16,800,000",
        submittedDate: "2024-01-12",
        status: QUOTE_STATUSES.QUOTE_GENERATED,
        premium: "AED 117,600",
        coverage: "Transportation Infrastructure"
      },
      {
        id: "Q022",
        customerName: "Antonio Silva",
        companyName: "Silva Construction",
        projectType: "Stadium Complex",
        projectValue: "AED 42,500,000",
        submittedDate: "2024-01-11",
        status: QUOTE_STATUSES.QUOTE_CONFIRMED,
        premium: "AED 297,500",
        coverage: "Sports Facility Coverage"
      },
      {
        id: "Q023",
        customerName: "Nadia Hassan",
        companyName: "Hassan Development",
        projectType: "Airport Terminal",
        projectValue: "AED 38,200,000",
        submittedDate: "2024-01-10",
        status: QUOTE_STATUSES.SELECTED_PRODUCT,
        premium: "AED 267,400",
        coverage: "Aviation Infrastructure"
      },
      {
        id: "Q024",
        customerName: "James Thompson",
        companyName: "Thompson Builders",
        projectType: "Power Plant",
        projectValue: "AED 65,300,000",
        submittedDate: "2024-01-09",
        status: QUOTE_STATUSES.POLICY_GENERATED,
        premium: "AED 457,100",
        coverage: "Energy Infrastructure"
      },
      {
        id: "Q025",
        customerName: "Layla Al Mansoori",
        companyName: "Al Mansoori Group",
        projectType: "University Campus",
        projectValue: "AED 21,700,000",
        submittedDate: "2024-01-08",
        status: QUOTE_STATUSES.PAYMENT_PENDING,
        premium: "AED 151,900",
        coverage: "Educational Complex"
      }
    ]
  }
};

// Mock policies data for each insurer - expanded to 10+ entries
const mockInsurerPolicies = {
  "emirates-insurance": [
    {
      id: "P001",
      policyNumber: "POL-2024-001",
      customerName: "John Smith",
      companyName: "Smith Construction LLC",
      projectType: "Commercial Building",
      premium: "AED 57,800",
      startDate: "2024-02-01",
      endDate: "2025-02-01",
      status: "active",
      sumInsured: "AED 9,175,000"
    },
    {
      id: "P005",
      policyNumber: "POL-2024-005",
      customerName: "Ahmed Al Mansouri",
      companyName: "Al Mansouri Contracting",
      projectType: "Residential Villa",
      premium: "AED 32,400",
      startDate: "2024-01-25",
      endDate: "2025-01-25",
      status: "active",
      sumInsured: "AED 4,500,000"
    },
    {
      id: "P013",
      policyNumber: "POL-2024-013",
      customerName: "Khalid Rahman",
      companyName: "Rahman Engineering",
      projectType: "Office Tower",
      premium: "AED 127,400",
      startDate: "2024-01-20",
      endDate: "2025-01-20",
      status: "active",
      sumInsured: "AED 18,200,000"
    },
    {
      id: "P016",
      policyNumber: "POL-2024-016",
      customerName: "Aisha Al Mahmoud",
      companyName: "Al Mahmoud Builders",
      projectType: "School Campus",
      premium: "AED 60,900",
      startDate: "2024-01-15",
      endDate: "2025-01-15",
      status: "active",
      sumInsured: "AED 8,700,000"
    }
  ],
  "axa-gulf": [
    {
      id: "P002",
      policyNumber: "POL-2024-002",
      customerName: "Sarah Johnson",
      companyName: "Johnson Builders Inc",
      projectType: "Residential Complex",
      premium: "AED 45,528",
      startDate: "2024-01-28",
      endDate: "2025-01-28",
      status: "active",
      sumInsured: "AED 6,606,000"
    },
    {
      id: "P017",
      policyNumber: "POL-2024-017",
      customerName: "Hassan Abdullah",
      companyName: "Abdullah Development",
      projectType: "Mixed Use Tower",
      premium: "AED 226,800",
      startDate: "2024-01-22",
      endDate: "2025-01-22",
      status: "active",
      sumInsured: "AED 32,400,000"
    },
    {
      id: "P019",
      policyNumber: "POL-2024-019",
      customerName: "Mohammed Al Rashid",
      companyName: "Al Rashid Contracting",
      projectType: "Warehouse Complex",
      premium: "AED 50,400",
      startDate: "2024-01-18",
      endDate: "2025-01-18",
      status: "active",
      sumInsured: "AED 7,200,000"
    },
    {
      id: "P020",
      policyNumber: "POL-2024-020",
      customerName: "Carlos Rodriguez",
      companyName: "Rodriguez Group",
      projectType: "Resort Development",
      premium: "AED 200,200",
      startDate: "2024-01-12",
      endDate: "2025-01-12",
      status: "active",
      sumInsured: "AED 28,600,000"
    }
  ],
  "oman-insurance": [
    {
      id: "P003",
      policyNumber: "POL-2024-003",
      customerName: "Mike Wilson",
      companyName: "Wilson Infrastructure",
      projectType: "Bridge Construction",
      premium: "AED 106,106",
      startDate: "2024-01-20",
      endDate: "2025-01-20",
      status: "active",
      sumInsured: "AED 19,092,000"
    },
    {
      id: "P022",
      policyNumber: "POL-2024-022",
      customerName: "Antonio Silva",
      companyName: "Silva Construction",
      projectType: "Stadium Complex",
      premium: "AED 297,500",
      startDate: "2024-01-16",
      endDate: "2025-01-16",
      status: "active",
      sumInsured: "AED 42,500,000"
    },
    {
      id: "P024",
      policyNumber: "POL-2024-024",
      customerName: "James Thompson",
      companyName: "Thompson Builders",
      projectType: "Power Plant",
      premium: "AED 457,100",
      startDate: "2024-01-14",
      endDate: "2025-01-14",
      status: "active",
      sumInsured: "AED 65,300,000"
    },
    {
      id: "P025",
      policyNumber: "POL-2024-025",
      customerName: "Layla Al Mansoori",
      companyName: "Al Mansoori Group",
      projectType: "University Campus",
      premium: "AED 151,900",
      startDate: "2024-01-10",
      endDate: "2025-01-10",
      status: "active",
      sumInsured: "AED 21,700,000"
    }
  ]
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "pending":
      return <Badge variant="outline" className="text-orange-600 border-orange-200">Pending Review</Badge>;
    case "quoted":
      return <Badge variant="secondary">Quote Sent</Badge>;
    case "approved":
      return <Badge variant="outline" className="text-green-600 border-green-200">Approved</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const InsurerDetailDashboard = () => {
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const { insurerId } = useParams();
  const insurerData = mockInsurerData[insurerId as keyof typeof mockInsurerData];
  const [quotes] = useState(insurerData?.quotes || []);
  const [policies] = useState(mockInsurerPolicies[insurerId as keyof typeof mockInsurerPolicies] || []);
  const [activeTab, setActiveTab] = useState("quotes");
  const [currentQuotePage, setCurrentQuotePage] = useState(1);
  const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
  const itemsPerPage = 5;

  // Configure filters for quotes
  const quoteFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'quote_generated', label: 'Quote Generated' },
        { value: 'quote_confirmed', label: 'Quote Confirmed' },
        { value: 'selected_product', label: 'Selected Product' },
        { value: 'policy_generated', label: 'Policy Generated' },
        { value: 'payment_pending', label: 'Payment Pending' }
      ]
    },
    {
      key: 'projectType',
      label: 'Project Type',
      type: 'multiselect',
      options: [
        { value: 'Commercial Building', label: 'Commercial Building' },
        { value: 'Residential Villa', label: 'Residential Villa' },
        { value: 'Office Tower', label: 'Office Tower' },
        { value: 'Shopping Center', label: 'Shopping Center' },
        { value: 'Hospital Complex', label: 'Hospital Complex' },
        { value: 'School Campus', label: 'School Campus' },
        { value: 'Residential Complex', label: 'Residential Complex' },
        { value: 'Mixed Use Tower', label: 'Mixed Use Tower' },
        { value: 'Industrial Facility', label: 'Industrial Facility' },
        { value: 'Warehouse Complex', label: 'Warehouse Complex' },
        { value: 'Resort Development', label: 'Resort Development' }
      ]
    },
    {
      key: 'submittedDate',
      label: 'Submitted Date',
      type: 'date'
    }
  ];

  // Configure filters for policies
  const policyFilters: FilterConfig[] = [
    {
      key: 'status',
      label: 'Status',
      type: 'select',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'expired', label: 'Expired' },
        { value: 'cancelled', label: 'Cancelled' }
      ]
    },
    {
      key: 'projectType',
      label: 'Project Type',
      type: 'multiselect',
      options: [
        { value: 'Commercial Building', label: 'Commercial Building' },
        { value: 'Residential Villa', label: 'Residential Villa' },
        { value: 'Office Tower', label: 'Office Tower' },
        { value: 'Shopping Center', label: 'Shopping Center' },
        { value: 'Hospital Complex', label: 'Hospital Complex' },
        { value: 'School Campus', label: 'School Campus' },
        { value: 'Residential Complex', label: 'Residential Complex' },
        { value: 'Mixed Use Tower', label: 'Mixed Use Tower' },
        { value: 'Industrial Facility', label: 'Industrial Facility' },
        { value: 'Warehouse Complex', label: 'Warehouse Complex' },
        { value: 'Resort Development', label: 'Resort Development' }
      ]
    },
    {
      key: 'startDate',
      label: 'Start Date',
      type: 'date'
    }
  ];

  // Use table search hooks for quotes
  const {
    searchTerm: quoteSearchTerm,
    setSearchTerm: setQuoteSearchTerm,
    filters: quoteFiltersState,
    filteredData: filteredQuotes,
    updateFilter: updateQuoteFilter,
    clearFilters: clearQuoteFilters
  } = useTableSearch({
    data: quotes,
    searchableFields: ['id', 'customerName', 'companyName', 'projectType'],
    initialFilters: {}
  });

  // Use table search hooks for policies
  const {
    searchTerm: policySearchTerm,
    setSearchTerm: setPolicySearchTerm,
    filters: policyFiltersState,
    filteredData: filteredPolicies,
    updateFilter: updatePolicyFilter,
    clearFilters: clearPolicyFilters
  } = useTableSearch({
    data: policies,
    searchableFields: ['policyNumber', 'customerName', 'companyName', 'projectType'],
    initialFilters: {}
  });

  // Pagination logic for quotes
  const totalQuotePages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startQuoteIndex = (currentQuotePage - 1) * itemsPerPage;
  const endQuoteIndex = startQuoteIndex + itemsPerPage;
  const currentQuotes = filteredQuotes.slice(startQuoteIndex, endQuoteIndex);

  // Pagination logic for policies
  const totalPolicyPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startPolicyIndex = (currentPolicyPage - 1) * itemsPerPage;
  const endPolicyIndex = startPolicyIndex + itemsPerPage;
  const currentPolicies = filteredPolicies.slice(startPolicyIndex, endPolicyIndex);

  const exportQuotesToExcel = () => {
    const exportData = quotes.map(quote => ({
      'Quote ID': quote.id,
      'Customer Name': quote.customerName,
      'Company Name': quote.companyName,
      'Project Type': quote.projectType,
      'Project Value': quote.projectValue,
      'Premium': quote.premium,
      'Coverage': quote.coverage,
      'Status': getQuoteStatusLabel(quote.status),
      'Submitted Date': quote.submittedDate
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Quotes');
    XLSX.writeFile(wb, `${insurerData?.name.replace(/\s+/g, '_')}_quotes.xlsx`);
  };

  const exportPoliciesToExcel = () => {
    const exportData = policies.map(policy => ({
      'Policy Number': policy.policyNumber,
      'Customer Name': policy.customerName,
      'Company Name': policy.companyName,
      'Project Type': policy.projectType,
      'Sum Insured': policy.sumInsured,
      'Premium': policy.premium,
      'Start Date': policy.startDate,
      'End Date': policy.endDate,
      'Status': policy.status.charAt(0).toUpperCase() + policy.status.slice(1)
    }));

    const ws = XLSX.utils.json_to_sheet(exportData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Policies');
    XLSX.writeFile(wb, `${insurerData?.name.replace(/\s+/g, '_')}_policies.xlsx`);
  };

  if (!insurerData) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Insurer Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested insurer could not be found.</p>
            <Button onClick={() => navigate('/market-admin/insurer-management')}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="w-full px-4">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => navigate('/market-admin/insurer-management')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
            </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">{insurerData.name} Dashboard</h1>
                <p className="text-sm text-muted-foreground">{insurerData.email}</p>
              </div>
            </div>
            <Button
              onClick={() => navigate(`/market-admin/insurer/${insurerId}/product-config`)}
              className="mr-4"
            >
              <Settings2 className="w-4 h-4 mr-2" />
              Product Configuration
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="w-full px-4 py-8">
          <div className="mb-8">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
               <Card>
                 <CardContent className="p-6">
                   <div>
                     <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                     <p className="text-2xl font-bold text-foreground">{quotes.length}</p>
                   </div>
                 </CardContent>
               </Card>
              
               <Card>
                 <CardContent className="p-6">
                   <div>
                     <p className="text-sm font-medium text-muted-foreground">Total Policies</p>
                     <p className="text-2xl font-bold text-foreground">{policies.length}</p>
                   </div>
                 </CardContent>
               </Card>

               <Card>
                 <CardContent className="p-6">
                   <div>
                     <p className="text-sm font-medium text-muted-foreground">Total Premium</p>
                     <p className="text-2xl font-bold text-foreground">
                       AED {quotes.reduce((sum, q) => sum + parseFloat(q.premium.replace(/[^0-9]/g, '')), 0).toLocaleString()}
                     </p>
                   </div>
                 </CardContent>
               </Card>
            </div>
          </div>

          {/* Tabs for Quotes and Policies */}
          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full grid-cols-3 mb-6">
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quote Requests
              </TabsTrigger>
              <TabsTrigger value="referrals" className="flex items-center gap-2">
                <Send className="w-4 h-4" />
                Referrals
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Issued Policies
              </TabsTrigger>
            </TabsList>

            <TabsContent value="quotes">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Quote Requests</h2>
                  <p className="text-muted-foreground">Manage quotes for {insurerData.name}</p>
                </div>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={exportQuotesToExcel}
                  className="gap-2"
                >
                  <Download className="w-4 h-4" />
                  Export Excel
                </Button>
              </div>
              
              <Card>
            <CardContent>
              <TableSearchFilter
                searchTerm={quoteSearchTerm}
                onSearchChange={setQuoteSearchTerm}
                filters={quoteFilters}
                activeFilters={quoteFiltersState}
                onFilterChange={updateQuoteFilter}
                onClearFilters={clearQuoteFilters}
              />
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="border-b bg-muted/50">
                    <tr>
                      <th className="text-left p-4 font-medium text-foreground">Customer</th>
                      <th className="text-left p-4 font-medium text-foreground">Project</th>
                      <th className="text-left p-4 font-medium text-foreground">Value</th>
                      <th className="text-left p-4 font-medium text-foreground">Coverage</th>
                      <th className="text-left p-4 font-medium text-foreground">Premium</th>
                      <th className="text-left p-4 font-medium text-foreground">Status</th>
                      <th className="text-left p-4 font-medium text-foreground">Date</th>
                      <th className="text-left p-4 font-medium text-foreground">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {currentQuotes.map((quote) => (
                      <tr key={quote.id} className="border-b hover:bg-muted/30 transition-colors">
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{quote.customerName}</p>
                            <p className="text-sm text-muted-foreground">{quote.companyName}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <div>
                            <p className="font-medium text-foreground">{quote.projectType}</p>
                            <p className="text-sm text-muted-foreground">ID: {quote.id}</p>
                          </div>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.projectValue}</p>
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{quote.coverage}</p>
                        </td>
                        <td className="p-4">
                          <p className="font-medium text-foreground">{quote.premium}</p>
                        </td>
                        <td className="p-4">
                          <QuoteStatusDot status={quote.status} />
                        </td>
                        <td className="p-4">
                          <p className="text-sm text-foreground">{quote.submittedDate}</p>
                        </td>
                        <td className="p-4">
                          <Button
                            size="sm"
                            variant="outline"
                            onClick={() => {
                              const currentPath = window.location.pathname;
                              if (currentPath.includes('/market-admin/')) {
                                navigate(`/market-admin/insurer/${insurerId}/quote/${quote.id}`);
                              } else {
                                navigate(`/insurer/quote/${quote.id}`);
                              }
                            }}
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                   </table>
                 </div>
               </CardContent>
               
               {/* Pagination for Quotes */}
               <div className="px-6 py-4 border-t">
                 <Pagination>
                   <PaginationContent>
                     <PaginationItem>
                       <PaginationPrevious 
                         href="#"
                         onClick={(e) => {
                           e.preventDefault();
                           if (currentQuotePage > 1) setCurrentQuotePage(currentQuotePage - 1);
                         }}
                         className={currentQuotePage === 1 ? "pointer-events-none opacity-50" : ""}
                       />
                     </PaginationItem>
                     {[...Array(totalQuotePages)].map((_, i) => (
                       <PaginationItem key={i + 1}>
                         <PaginationLink
                           href="#"
                           isActive={currentQuotePage === i + 1}
                           onClick={(e) => {
                             e.preventDefault();
                             setCurrentQuotePage(i + 1);
                           }}
                         >
                           {i + 1}
                         </PaginationLink>
                       </PaginationItem>
                     ))}
                     <PaginationItem>
                       <PaginationNext 
                         href="#"
                         onClick={(e) => {
                           e.preventDefault();
                           if (currentQuotePage < totalQuotePages) setCurrentQuotePage(currentQuotePage + 1);
                         }}
                         className={currentQuotePage === totalQuotePages ? "pointer-events-none opacity-50" : ""}
                       />
                     </PaginationItem>
                   </PaginationContent>
                 </Pagination>
               </div>
             </Card>
             </TabsContent>
            
            <TabsContent value="referrals">
              <div className="mb-6 flex justify-between items-center">
                <div>
                  <h2 className="text-2xl font-bold text-foreground mb-2">Referrals</h2>
                  <p className="text-muted-foreground">Manage and track referral requests</p>
                </div>
              </div>
              
              <Card>
                <CardContent className="py-12">
                  <div className="text-center text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No referrals available</p>
                    <p className="text-sm mt-2">Referrals will appear here when available</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

              <TabsContent value="policies">
                <Card>
                  <CardHeader>
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          <Shield className="w-5 h-5" />
                          Issued Policies
                        </CardTitle>
                        <CardDescription>
                          Manage active policies for {insurerData.name}
                        </CardDescription>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={exportPoliciesToExcel}
                        className="gap-2"
                      >
                        <Download className="w-4 h-4" />
                        Export Excel
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <TableSearchFilter
                      searchTerm={policySearchTerm}
                      onSearchChange={setPolicySearchTerm}
                      filters={policyFilters}
                      activeFilters={policyFiltersState}
                      onFilterChange={updatePolicyFilter}
                      onClearFilters={clearPolicyFilters}
                    />
                    <div className="overflow-x-auto">
                      <table className="w-full">
                        <thead className="border-b bg-muted/50">
                          <tr>
                            <th className="text-left p-4 font-medium text-foreground">Policy Number</th>
                            <th className="text-left p-4 font-medium text-foreground">Customer</th>
                            <th className="text-left p-4 font-medium text-foreground">Project</th>
                            <th className="text-left p-4 font-medium text-foreground">Sum Insured</th>
                            <th className="text-left p-4 font-medium text-foreground">Premium</th>
                            <th className="text-left p-4 font-medium text-foreground">Start Date</th>
                            <th className="text-left p-4 font-medium text-foreground">End Date</th>
                            <th className="text-left p-4 font-medium text-foreground">Status</th>
                            <th className="text-left p-4 font-medium text-foreground">Action</th>
                          </tr>
                        </thead>
                         <tbody>
                           {currentPolicies.map((policy) => (
                             <tr key={policy.id} className="border-b hover:bg-muted/30 transition-colors">
                               <td className="p-4">
                                 <p className="font-medium text-foreground">{policy.policyNumber}</p>
                               </td>
                               <td className="p-4">
                                 <div>
                                   <p className="font-medium text-foreground">{policy.customerName}</p>
                                   <p className="text-sm text-muted-foreground">{policy.companyName}</p>
                                 </div>
                               </td>
                               <td className="p-4">
                                 <p className="font-medium text-foreground">{policy.projectType}</p>
                               </td>
                               <td className="p-4">
                                 <p className="font-medium text-foreground">{policy.sumInsured}</p>
                               </td>
                               <td className="p-4">
                                 <p className="font-medium text-foreground">{policy.premium}</p>
                               </td>
                               <td className="p-4">
                                 <p className="text-sm text-foreground">{policy.startDate}</p>
                               </td>
                               <td className="p-4">
                                 <p className="text-sm text-foreground">{policy.endDate}</p>
                               </td>
                               <td className="p-4">
                                 <Badge variant="outline" className="text-success border-success/20">
                                   {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                                 </Badge>
                               </td>
                               <td className="p-4">
                                  <Button
                                    size="sm"
                                    variant="outline"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/market-admin/insurer/${insurerId}/policy/${policy.id}`);
                                    }}
                                  >
                                    <Eye className="w-4 h-4 mr-1" />
                                    View Policy
                                  </Button>
                               </td>
                             </tr>
                           ))}
                         </tbody>
                       </table>
                     </div>
                     
                     {/* Pagination for Policies */}
                     <div className="px-6 py-4 border-t">
                       <Pagination>
                         <PaginationContent>
                           <PaginationItem>
                             <PaginationPrevious 
                               href="#"
                               onClick={(e) => {
                                 e.preventDefault();
                                 if (currentPolicyPage > 1) setCurrentPolicyPage(currentPolicyPage - 1);
                               }}
                               className={currentPolicyPage === 1 ? "pointer-events-none opacity-50" : ""}
                             />
                           </PaginationItem>
                           {[...Array(totalPolicyPages)].map((_, i) => (
                             <PaginationItem key={i + 1}>
                               <PaginationLink
                                 href="#"
                                 isActive={currentPolicyPage === i + 1}
                                 onClick={(e) => {
                                   e.preventDefault();
                                   setCurrentPolicyPage(i + 1);
                                 }}
                               >
                                 {i + 1}
                               </PaginationLink>
                             </PaginationItem>
                           ))}
                           <PaginationItem>
                             <PaginationNext 
                               href="#"
                               onClick={(e) => {
                                 e.preventDefault();
                                 if (currentPolicyPage < totalPolicyPages) setCurrentPolicyPage(currentPolicyPage + 1);
                               }}
                               className={currentPolicyPage === totalPolicyPages ? "pointer-events-none opacity-50" : ""}
                             />
                           </PaginationItem>
                         </PaginationContent>
                       </Pagination>
                     </div>
                   </CardContent>
               </Card>
             </TabsContent>
          </Tabs>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default InsurerDetailDashboard;