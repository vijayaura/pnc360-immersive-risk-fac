import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { ArrowLeft, Edit, Trash2, Settings, FileText, Shield, Send } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Pagination, PaginationContent, PaginationItem, PaginationLink, PaginationNext, PaginationPrevious } from "@/components/ui/pagination";
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/features/quotes/components/QuotesComparison/QuoteStatusDot";
import { TableSearchFilter, FilterConfig } from "@/components/shared/TableSearchFilter";
import { useTableSearch } from '@/shared/hooks/useTableSearch';
import { useConfirmDialog } from '@/shared/hooks/useConfirmDialog';

// Mock data - this would come from API in real app
const mockBrokers = [
  {
    id: "B001",
    name: "Ahmed Al-Mansoori",
    email: "ahmed.almansoori@brokers.ae",
    status: "active",
    quotesCount: 15,
    activePolicies: 8,
    joinDate: "2023-03-15",
    totalGWP: "AED 2,450,000",
    totalCommission: "AED 73,500", // 3% of GWP
    phone: "+971 50 123 4567",
    company: "Al-Mansoori Insurance Brokers",
    licenseNumber: "UAE-BRK-2023-001",
    insurerCommissions: [
      { insurer: "Emirates Insurance", minCommission: "10", maxCommission: "15" },
      { insurer: "AXA Gulf", minCommission: "12", maxCommission: "18" },
      { insurer: "Oman Insurance", minCommission: "8", maxCommission: "12" }
    ]
  },
  {
    id: "B002",
    name: "Sarah Johnson",
    email: "sarah.johnson@brokers.ae",
    status: "active",
    quotesCount: 12,
    activePolicies: 6,
    joinDate: "2023-06-20",
    totalGWP: "AED 1,850,000",
    totalCommission: "AED 64,750", // 3.5% of GWP
    phone: "+971 55 987 6543",
    company: "Johnson Risk Management",
    licenseNumber: "UAE-BRK-2023-002",
    insurerCommissions: [
      { insurer: "Takaful Emarat", minCommission: "9", maxCommission: "14" },
      { insurer: "National General Insurance", minCommission: "6", maxCommission: "10" },
      { insurer: "Emirates Insurance", minCommission: "11", maxCommission: "16" }
    ]
  },
  {
    id: "B003",
    name: "Mohammed Hassan",
    email: "mohammed.hassan@brokers.ae",
    status: "active",
    quotesCount: 8,
    activePolicies: 3,
    joinDate: "2023-09-10",
    totalGWP: "AED 1,200,000",
    totalCommission: "AED 30,000", // 2.5% of GWP
    phone: "+971 52 456 7890",
    company: "Hassan Insurance Services",
    licenseNumber: "UAE-BRK-2023-003",
    insurerCommissions: [
      { insurer: "AXA Gulf", minCommission: "11", maxCommission: "16" },
      { insurer: "Oman Insurance", minCommission: "7", maxCommission: "11" }
    ]
  }
];

const availableInsurers = [
  "Emirates Insurance",
  "AXA Gulf", 
  "Oman Insurance",
  "Takaful Emarat",
  "National General Insurance",
  "Dubai Insurance",
  "RAK Insurance",
  "Insurer One"
];

// Mock quotes data - expanded for pagination
const mockQuotes = [
  {
    id: "Q001",
    clientName: "Al Habtoor Construction LLC",
    projectName: "Al Habtoor Tower Development",
    projectType: "Commercial",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 57,800",
    createdDate: "2024-01-15",
    validUntil: "2024-02-15",
    sumInsured: "AED 8,450,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q002", 
    clientName: "Emaar Properties",
    projectName: "Downtown Residential Complex",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 42,250",
    createdDate: "2024-01-12",
    validUntil: "2024-02-12",
    sumInsured: "AED 6,200,000",
    broker: "Sarah Johnson"
  },
  {
    id: "Q003",
    clientName: "DAMAC Properties",
    projectName: "Marina Shopping Mall Renovation",
    projectType: "Commercial",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 91,200",
    createdDate: "2024-01-10",
    validUntil: "2024-02-10",
    sumInsured: "AED 14,800,000",
    broker: "Mohammed Hassan"
  },
  {
    id: "Q004",
    clientName: "Nakheel Properties",
    projectName: "Palm Jumeirah Villa Complex",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 73,500",
    createdDate: "2024-01-08",
    validUntil: "2024-02-08",
    sumInsured: "AED 11,200,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q005",
    clientName: "Dubai Municipality",
    projectName: "Public Infrastructure Project",
    projectType: "Infrastructure",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 124,600",
    createdDate: "2024-01-05",
    validUntil: "2024-02-05",
    sumInsured: "AED 18,700,000",
    broker: "Sarah Johnson"
  },
  {
    id: "Q006",
    clientName: "Meraas Holding",
    projectName: "Bluewaters Island Resort",
    projectType: "Hospitality",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 186,400",
    createdDate: "2024-01-20",
    validUntil: "2024-02-20",
    sumInsured: "AED 28,500,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q007",
    clientName: "Dubai Holding",
    projectName: "Business Bay Office Complex",
    projectType: "Commercial",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 95,700",
    createdDate: "2024-01-18",
    validUntil: "2024-02-18",
    sumInsured: "AED 15,200,000",
    broker: "Sarah Johnson"
  },
  {
    id: "Q008",
    clientName: "Sobha Realty",
    projectName: "Sobha Hartland Towers",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 67,300",
    createdDate: "2024-01-25",
    validUntil: "2024-02-25",
    sumInsured: "AED 9,800,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q009",
    clientName: "Majid Al Futtaim",
    projectName: "City Centre Expansion",
    projectType: "Retail",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 143,900",
    createdDate: "2024-01-22",
    validUntil: "2024-02-22",
    sumInsured: "AED 21,800,000",
    broker: "Mohammed Hassan"
  },
  {
    id: "Q010",
    clientName: "Aldar Properties",
    projectName: "Yas Island Development",
    projectType: "Mixed Use",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 205,600",
    createdDate: "2024-01-28",
    validUntil: "2024-02-28",
    sumInsured: "AED 32,400,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q011",
    clientName: "RAK Properties",
    projectName: "Al Hamra Village Phase 3",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 78,900",
    createdDate: "2024-02-01",
    validUntil: "2024-03-01",
    sumInsured: "AED 12,100,000",
    broker: "Sarah Johnson"
  },
  {
    id: "Q012",
    clientName: "Eagle Hills",
    projectName: "Sharjah Waterfront City",
    projectType: "Waterfront",
    status: QUOTE_STATUSES.QUOTE_EDITED,
    premium: "AED 167,200",
    createdDate: "2024-02-03",
    validUntil: "2024-03-03",
    sumInsured: "AED 25,600,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q013",
    clientName: "Select Group",
    projectName: "One Palm Residences",
    projectType: "Residential",
    status: QUOTE_STATUSES.QUOTE_CONFIRMED,
    premium: "AED 94,700",
    createdDate: "2024-02-05",
    validUntil: "2024-03-05",
    sumInsured: "AED 14,200,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "Q014",
    clientName: "Omniyat",
    projectName: "One at Palm Jumeirah",
    projectType: "Luxury Residential",
    status: QUOTE_STATUSES.SELECTED_PRODUCT,
    premium: "AED 167,400",
    createdDate: "2024-02-07",
    validUntil: "2024-03-07",
    sumInsured: "AED 25,100,000",
    broker: "Mohammed Hassan"
  },
  {
    id: "Q015",
    clientName: "Wasl Properties",
    projectName: "City Walk Phase 2",
    projectType: "Mixed Use",
    status: QUOTE_STATUSES.QUOTE_GENERATED,
    premium: "AED 178,900",
    createdDate: "2024-02-10",
    validUntil: "2024-03-10",
    sumInsured: "AED 26,800,000",
    broker: "Ahmed Al-Mansoori"
  }
];

// Mock policies data - expanded for pagination
const mockPolicies = [
  {
    id: "P001",
    policyNumber: "POL-2024-001",
    clientName: "Al Habtoor Construction LLC",
    projectName: "Marina Bay Complex",
    projectType: "Commercial",
    premium: "AED 45,200",
    
    startDate: "2024-01-01",
    endDate: "2025-01-01",
    status: "active",
    sumInsured: "AED 6,800,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P002",
    policyNumber: "POL-2024-002",
    clientName: "Emaar Properties",
    projectName: "Creek Harbour Towers",
    projectType: "Residential",
    premium: "AED 89,500",
    
    startDate: "2024-01-15",
    endDate: "2025-01-15",
    status: "active",
    sumInsured: "AED 13,200,000",
    broker: "Sarah Johnson"
  },
  {
    id: "P003",
    policyNumber: "POL-2024-003",
    clientName: "DAMAC Properties",
    projectName: "DAMAC Hills Shopping Center",
    projectType: "Retail",
    premium: "AED 76,800",
    
    startDate: "2024-02-01",
    endDate: "2025-02-01",
    status: "active",
    sumInsured: "AED 11,400,000",
    broker: "Mohammed Hassan"
  },
  {
    id: "P004",
    policyNumber: "POL-2024-004",
    clientName: "Nakheel Properties",
    projectName: "The Pointe Apartments",
    projectType: "Residential",
    premium: "AED 112,300",
    
    startDate: "2024-01-20",
    endDate: "2025-01-20",
    status: "active",
    sumInsured: "AED 16,800,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P005",
    policyNumber: "POL-2024-005",
    clientName: "Meraas Holding",
    projectName: "La Mer Beachfront",
    projectType: "Hospitality",
    premium: "AED 134,700",
    
    startDate: "2024-02-10",
    endDate: "2025-02-10",
    status: "active",
    sumInsured: "AED 20,200,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P006",
    policyNumber: "POL-2024-006",
    clientName: "Dubai Holding",
    projectName: "DIFC Gate Building",
    projectType: "Commercial",
    premium: "AED 98,400",
    
    startDate: "2024-01-25",
    endDate: "2025-01-25",
    status: "active",
    sumInsured: "AED 14,700,000",
    broker: "Sarah Johnson"
  },
  {
    id: "P007",
    policyNumber: "POL-2024-007",
    clientName: "Sobha Realty",
    projectName: "Sobha Creek Vistas",
    projectType: "Residential",
    premium: "AED 67,900",
    
    startDate: "2024-02-05",
    endDate: "2025-02-05",
    status: "active",
    sumInsured: "AED 10,200,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P008",
    policyNumber: "POL-2024-008",
    clientName: "Majid Al Futtaim",
    projectName: "Mall of the Emirates Extension",
    projectType: "Retail",
    premium: "AED 189,600",
    
    startDate: "2024-01-30",
    endDate: "2025-01-30",
    status: "active",
    sumInsured: "AED 28,400,000",
    broker: "Mohammed Hassan"
  },
  {
    id: "P009",
    policyNumber: "POL-2024-009",
    clientName: "Aldar Properties",
    projectName: "Al Raha Beach Hotel",
    projectType: "Hospitality",
    premium: "AED 156,200",
    
    startDate: "2024-02-12",
    endDate: "2025-02-12",
    status: "active",
    sumInsured: "AED 23,400,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P010",
    policyNumber: "POL-2024-010",
    clientName: "RAK Properties",
    projectName: "Mina Al Arab Marina",
    projectType: "Waterfront",
    premium: "AED 123,800",
    
    startDate: "2024-02-08",
    endDate: "2025-02-08",
    status: "active",
    sumInsured: "AED 18,600,000",
    broker: "Sarah Johnson"
  },
  {
    id: "P011",
    policyNumber: "POL-2024-011",
    clientName: "Eagle Hills",
    projectName: "Maryam Island Resort",
    projectType: "Hospitality",
    premium: "AED 145,300",
    
    startDate: "2024-01-28",
    endDate: "2025-01-28",
    status: "active",
    sumInsured: "AED 21,800,000",
    broker: "Ahmed Al-Mansoori"
  },
  {
    id: "P012",
    policyNumber: "POL-2024-012",
    clientName: "Select Group",
    projectName: "One Palm Residences Policies",
    projectType: "Residential",
    premium: "AED 94,700",
    
    startDate: "2024-02-15",
    endDate: "2025-02-15",
    status: "active",
    sumInsured: "AED 14,200,000",
    broker: "Ahmed Al-Mansoori"
  }
];

const getUserStatusColor = (status: string) => {
  switch (status) {
    case 'active': return 'bg-success text-success-foreground';
    default: return 'bg-secondary text-secondary-foreground';
  }
};

const BrokerDetailsView = () => {
  const { brokerId } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { showConfirmDialog, ConfirmDialog } = useConfirmDialog();
  
  // Find broker by ID
  const broker = mockBrokers.find(b => b.id === brokerId);
  
  const [isAddInsurerDialogOpen, setIsAddInsurerDialogOpen] = useState(false);
  const [isEditInsurerDialogOpen, setIsEditInsurerDialogOpen] = useState(false);
  const [isStatusChangeDialogOpen, setIsStatusChangeDialogOpen] = useState(false);
  const [isConfigureDialogOpen, setIsConfigureDialogOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("quotes");
  const [currentQuotePage, setCurrentQuotePage] = useState(1);
  const [currentPolicyPage, setCurrentPolicyPage] = useState(1);
  const [pendingStatusChange, setPendingStatusChange] = useState<string>("");
  const [editingCommission, setEditingCommission] = useState<any>(null);
  const [editingCommissionIndex, setEditingCommissionIndex] = useState<number>(-1);
  const [newInsurerCommission, setNewInsurerCommission] = useState({
    insurer: "",
    minCommission: "",
    maxCommission: ""
  });
  const [editInsurerCommission, setEditInsurerCommission] = useState({
    insurer: "",
    minCommission: "",
    maxCommission: ""
  });
  
  const itemsPerPage = 5;
  
  // In a real app, this would be managed by state management (Redux, Zustand, etc.)
  const [brokerStatus, setBrokerStatus] = useState(broker?.status || "active");

  // Filter data for the current broker
  const brokerQuotes = mockQuotes.filter(q => q.broker === broker?.name);
  const brokerPolicies = mockPolicies.filter(p => p.broker === broker?.name);

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
        { value: 'quote_edited', label: 'Quote Edited' }
      ]
    },
    {
      key: 'projectType',
      label: 'Project Type',
      type: 'multiselect',
      options: [
        { value: 'Commercial', label: 'Commercial' },
        { value: 'Residential', label: 'Residential' },
        { value: 'Infrastructure', label: 'Infrastructure' },
        { value: 'Hospitality', label: 'Hospitality' },
        { value: 'Retail', label: 'Retail' },
        { value: 'Mixed Use', label: 'Mixed Use' },
        { value: 'Waterfront', label: 'Waterfront' },
        { value: 'Luxury Residential', label: 'Luxury Residential' }
      ]
    },
    {
      key: 'createdDate',
      label: 'Created Date',
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
        { value: 'Commercial', label: 'Commercial' },
        { value: 'Residential', label: 'Residential' },
        { value: 'Retail', label: 'Retail' },
        { value: 'Hospitality', label: 'Hospitality' },
        { value: 'Waterfront', label: 'Waterfront' }
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
    data: brokerQuotes,
    searchableFields: ['id', 'clientName', 'projectName', 'projectType'],
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
    data: brokerPolicies,
    searchableFields: ['policyNumber', 'clientName', 'projectName', 'projectType'],
    initialFilters: {}
  });

  // Pagination for quotes
  const totalQuotePages = Math.ceil(filteredQuotes.length / itemsPerPage);
  const startQuoteIndex = (currentQuotePage - 1) * itemsPerPage;
  const endQuoteIndex = startQuoteIndex + itemsPerPage;
  const currentQuotes = filteredQuotes.slice(startQuoteIndex, endQuoteIndex);

  // Pagination for policies
  const totalPolicyPages = Math.ceil(filteredPolicies.length / itemsPerPage);
  const startPolicyIndex = (currentPolicyPage - 1) * itemsPerPage;
  const endPolicyIndex = startPolicyIndex + itemsPerPage;
  const currentPolicies = filteredPolicies.slice(startPolicyIndex, endPolicyIndex);

  if (!broker) {
    return (
      <div className="h-full bg-gradient-to-br from-background to-secondary/20 flex items-center justify-center">
        <Card className="max-w-md">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Broker Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested broker could not be found.</p>
            <Button onClick={() => navigate('/market-admin/broker-management')}>
              Back
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const handleAddInsurerCommission = () => {
    if (newInsurerCommission.insurer && newInsurerCommission.minCommission && newInsurerCommission.maxCommission) {
      // In real app, this would make an API call
      console.log("Adding insurer commission:", newInsurerCommission);
      toast({
        title: "Commission Added",
        description: `Successfully added commission rates for ${newInsurerCommission.insurer}`,
      });
      setNewInsurerCommission({ insurer: "", minCommission: "", maxCommission: "" });
      setIsAddInsurerDialogOpen(false);
    }
  };

  const handleEditCommission = (commission: any, index: number) => {
    setEditingCommission(commission);
    setEditingCommissionIndex(index);
    setEditInsurerCommission({
      insurer: commission.insurer,
      minCommission: commission.minCommission,
      maxCommission: commission.maxCommission
    });
    setIsEditInsurerDialogOpen(true);
  };

  const handleUpdateInsurerCommission = () => {
    if (editInsurerCommission.minCommission && editInsurerCommission.maxCommission) {
      // In real app, this would make an API call to update the commission
      console.log("Updating insurer commission:", editInsurerCommission, "at index:", editingCommissionIndex);
      toast({
        title: "Commission Updated",
        description: `Successfully updated commission rates for ${editInsurerCommission.insurer}`,
      });
      setEditInsurerCommission({ insurer: "", minCommission: "", maxCommission: "" });
      setEditingCommission(null);
      setEditingCommissionIndex(-1);
      setIsEditInsurerDialogOpen(false);
    }
  };

  const handleDeleteCommission = (commission: any, index: number) => {
    showConfirmDialog(
      {
        title: "Delete Commission",
        description: `Are you sure you want to delete the commission rates for ${commission.insurer}? This action cannot be undone.`,
        confirmText: "Delete",
        variant: "destructive"
      },
      () => {
        // In real app, this would make an API call to delete the commission
        console.log("Deleting insurer commission:", commission, "at index:", index);
        toast({
          title: "Commission Deleted",
          description: `Successfully deleted commission rates for ${commission.insurer}`,
        });
      }
    );
  };

  const handleStatusToggle = (checked: boolean) => {
    const newStatus = checked ? "active" : "inactive";
    setPendingStatusChange(newStatus);
    setIsStatusChangeDialogOpen(true);
  };

  const confirmStatusChange = () => {
    // In real app, this would make an API call to update broker status
    console.log("Changing broker status to:", pendingStatusChange);
    setBrokerStatus(pendingStatusChange);
    toast({
      title: "Status Updated",
      description: `Broker status has been changed to ${pendingStatusChange}`,
    });
    setIsStatusChangeDialogOpen(false);
    setPendingStatusChange("");
  };

  const availableInsurersForUser = availableInsurers.filter(
    insurer => !broker.insurerCommissions?.some((comm: any) => comm.insurer === insurer)
  );

  return (
    <div className="h-full bg-gradient-to-br from-background to-secondary/20 flex flex-col overflow-hidden">
      <div className="flex-1 p-6 overflow-auto">
        <div className="max-w-full space-y-6">
          {/* Header */}
          <div className="flex items-center justify-between gap-4 mb-8">
            <div className="flex items-center gap-4">
              <Button 
                variant="outline" 
                size="sm"
                onClick={() => navigate('/market-admin/broker-management')}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  {broker.name}
                </h1>
                <p className="text-lg text-muted-foreground">
                  Broker Details & Commission Management
                </p>
              </div>
            </div>
            <Button 
              variant="outline"
              onClick={() => navigate(`/market-admin/broker/${broker.id}/configure`)}
            >
              <Settings className="w-4 h-4 mr-2" />
              Configure
            </Button>
          </div>

          {/* Statistics Cards at Top */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{broker.quotesCount}</div>
                <div className="text-sm text-muted-foreground">Total Quotes</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{broker.activePolicies}</div>
                <div className="text-sm text-muted-foreground">Total Policies</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="p-4">
                <div className="text-2xl font-bold">{broker.totalGWP}</div>
                <div className="text-sm text-muted-foreground">Total GWP</div>
              </CardContent>
            </Card>
          </div>

          {/* Quotes and Policies Tabs */}
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="quotes" className="flex items-center gap-2">
                <FileText className="w-4 h-4" />
                Quotes
              </TabsTrigger>
              <TabsTrigger value="policies" className="flex items-center gap-2">
                <Shield className="w-4 h-4" />
                Policies
              </TabsTrigger>
            </TabsList>
            
            <TabsContent value="quotes" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Quotes Created by {broker.name}
                  </CardTitle>
                  <CardDescription>
                    Manage and track all contractor insurance quotes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <TableSearchFilter
                    searchTerm={quoteSearchTerm}
                    onSearchChange={setQuoteSearchTerm}
                    filters={quoteFilters}
                    activeFilters={quoteFiltersState}
                    onFilterChange={updateQuoteFilter}
                    onClearFilters={clearQuoteFilters}
                  />
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Quote ID</TableHead>
                        <TableHead>Client Name</TableHead>
                        <TableHead>Project Name</TableHead>
                        <TableHead>Project Type</TableHead>
                        <TableHead>Sum Insured</TableHead>
                        <TableHead>Premium</TableHead>
                        <TableHead>Quote Status</TableHead>
                        <TableHead>Created</TableHead>
                        <TableHead>Quote Validity</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {currentQuotes.map((quote) => (
                        <TableRow 
                          key={quote.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/market-admin/broker/${brokerId}/quote/${quote.id}`)}
                        >
                          <TableCell className="font-medium">{quote.id}</TableCell>
                          <TableCell>{quote.clientName}</TableCell>
                          <TableCell>{quote.projectName}</TableCell>
                          <TableCell>{quote.projectType}</TableCell>
                          <TableCell className="font-medium">{quote.sumInsured}</TableCell>
                          <TableCell className="font-medium text-primary">{quote.premium}</TableCell>
                          <TableCell>
                            <QuoteStatusDot status={quote.status} />
                          </TableCell>
                          <TableCell className="text-sm text-muted-foreground">{quote.createdDate}</TableCell>
                          <TableCell className="text-sm text-muted-foreground">{quote.validUntil}</TableCell>
                          <TableCell className="text-right">
                             <Button
                               variant="outline"
                               size="sm"
                               onClick={(e) => {
                                 e.stopPropagation();
                                 navigate(`/market-admin/broker/${brokerId}/quote/${quote.id}`);
                               }}
                             >
                              View Details
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
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
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="referrals" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Send className="w-5 h-5" />
                    Referrals for {broker.name}
                  </CardTitle>
                  <CardDescription>
                    Manage and track referral requests
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="text-center py-12 text-muted-foreground">
                    <Send className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p className="text-lg font-medium">No referrals available</p>
                    <p className="text-sm mt-2">Referrals will appear here when available</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
            
            <TabsContent value="policies" className="space-y-4">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="w-5 h-5" />
                    Active Policies by {broker.name}
                  </CardTitle>
                  <CardDescription>
                    Manage your issued insurance policies
                  </CardDescription>
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
                  <Table>
                     <TableHeader>
                       <TableRow>
                          <TableHead>Policy Number</TableHead>
                          <TableHead>Client Name</TableHead>
                          <TableHead>Project Name</TableHead>
                          <TableHead>Sum Insured</TableHead>
                          <TableHead>Premium</TableHead>
                          <TableHead>Start Date</TableHead>
                          <TableHead>End Date</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead className="text-right">Actions</TableHead>
                       </TableRow>
                     </TableHeader>
                    <TableBody>
                      {currentPolicies.map((policy) => (
                        <TableRow 
                          key={policy.id}
                          className="cursor-pointer hover:bg-muted/50"
                          onClick={() => navigate(`/market-admin/broker/${brokerId}/policy/${policy.id}`)}
                        >
                            <TableCell className="font-medium">{policy.policyNumber}</TableCell>
                            <TableCell>{policy.clientName}</TableCell>
                            <TableCell>{policy.projectName}</TableCell>
                            <TableCell className="font-medium">{policy.sumInsured}</TableCell>
                            <TableCell className="font-medium text-primary">{policy.premium}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{policy.startDate}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">{policy.endDate}</TableCell>
                           <TableCell>
                             <Badge variant="outline" className="text-success border-success/20">
                               {policy.status.charAt(0).toUpperCase() + policy.status.slice(1)}
                             </Badge>
                           </TableCell>
                          <TableCell className="text-right">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                navigate(`/market-admin/broker/${brokerId}/policy/${policy.id}`);
                              }}
                            >
                              View Policy
                            </Button>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  
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

          {/* Add Insurer Commission Dialog */}
          <Dialog open={isAddInsurerDialogOpen} onOpenChange={setIsAddInsurerDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Insurer Commission</DialogTitle>
                <DialogDescription>
                  Set commission rates for a new insurer
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Insurer</Label>
                  <Select 
                    value={newInsurerCommission.insurer} 
                    onValueChange={(value) => 
                      setNewInsurerCommission({...newInsurerCommission, insurer: value})
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select an insurer" />
                    </SelectTrigger>
                    <SelectContent>
                      {availableInsurersForUser.map((insurer) => (
                        <SelectItem key={insurer} value={insurer}>
                          {insurer}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Min Commission (%)</Label>
                    <Input
                      type="number"
                      value={newInsurerCommission.minCommission}
                      onChange={(e) => 
                        setNewInsurerCommission({...newInsurerCommission, minCommission: e.target.value})
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Max Commission (%)</Label>
                    <Input
                      type="number"
                      value={newInsurerCommission.maxCommission}
                      onChange={(e) => 
                        setNewInsurerCommission({...newInsurerCommission, maxCommission: e.target.value})
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsAddInsurerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleAddInsurerCommission}>Add Commission</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Edit Insurer Commission Dialog */}
          <Dialog open={isEditInsurerDialogOpen} onOpenChange={setIsEditInsurerDialogOpen}>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Edit Insurer Commission</DialogTitle>
                <DialogDescription>
                  Update commission rates for {editingCommission?.insurer}
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <Label>Insurer</Label>
                  <Input
                    value={editInsurerCommission.insurer}
                    readOnly
                    className="bg-muted"
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Min Commission (%)</Label>
                    <Input
                      type="number"
                      value={editInsurerCommission.minCommission}
                      onChange={(e) => 
                        setEditInsurerCommission({...editInsurerCommission, minCommission: e.target.value})
                      }
                      placeholder="0"
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Max Commission (%)</Label>
                    <Input
                      type="number"
                      value={editInsurerCommission.maxCommission}
                      onChange={(e) => 
                        setEditInsurerCommission({...editInsurerCommission, maxCommission: e.target.value})
                      }
                      placeholder="0"
                    />
                  </div>
                </div>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="outline" onClick={() => setIsEditInsurerDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleUpdateInsurerCommission}>Update Commission</Button>
              </div>
            </DialogContent>
          </Dialog>

          {/* Status Change Confirmation Dialog */}
          <AlertDialog open={isStatusChangeDialogOpen} onOpenChange={setIsStatusChangeDialogOpen}>
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Change Broker Status</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to change {broker.name}'s status to {pendingStatusChange}? 
                  {pendingStatusChange === "inactive" && " This will restrict their access to the system."}
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel onClick={() => setPendingStatusChange("")}>Cancel</AlertDialogCancel>
                <AlertDialogAction onClick={confirmStatusChange}>
                  Change Status
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>
        </div>
      </div>
      <ConfirmDialog />
    </div>
  );
};

export default BrokerDetailsView;