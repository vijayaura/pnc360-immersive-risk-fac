import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Footer } from "@/components/layout/Footer";
import { Phone, Search, Eye, Building, Shield, Briefcase, Home, Plane, Heart, DollarSign, FileCheck, Package, Users, Calendar, Mail, Edit2, Save, LogOut } from "lucide-react";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from '@/shared/hooks/use-toast';

// Product mapping with icons
const productIcons: Record<string, React.ReactNode> = {
  'CAR': <Building className="w-5 h-5" />,
  'PI': <Briefcase className="w-5 h-5" />,
  'PI_ANNUAL': <Briefcase className="w-5 h-5" />,
  'MONEY': <DollarSign className="w-5 h-5" />,
  'WC': <Shield className="w-5 h-5" />,
  'FIDELITY': <FileCheck className="w-5 h-5" />,
  'PROP_CONTENTS': <Home className="w-5 h-5" />,
  'PAR': <Package className="w-5 h-5" />,
  'OFFICE_MULTICOVER': <Building className="w-5 h-5" />,
  'GTPL': <Shield className="w-5 h-5" />,
  'CGL': <Shield className="w-5 h-5" />,
  'EL': <Users className="w-5 h-5" />,
  'CAR_ANNUAL': <Building className="w-5 h-5" />,
  'PA': <Heart className="w-5 h-5" />,
  'TRAVEL': <Plane className="w-5 h-5" />,
  'HOME': <Home className="w-5 h-5" />,
};

const productNames: Record<string, string> = {
  'CAR': 'Contractors All Risk Insurance',
  'PI': 'Professional Indemnity Insurance - Single Project',
  'PI_ANNUAL': 'Professional Liability Insurance - Architects and Engineers',
  'MONEY': 'Money Insurance',
  'WC': 'Workmen\'s Compensation (WC)',
  'FIDELITY': 'Fidelity Guarantee Insurance',
  'PROP_CONTENTS': 'Property Contents Insurance',
  'PAR': 'Property All Risks (PAR)',
  'OFFICE_MULTICOVER': 'Office Multicover',
  'GTPL': 'General Third Party Liability (GTPL)',
  'CGL': 'Commercial General Liability (CGL)',
  'EL': 'Employer\'s Liability (EL)',
  'CAR_ANNUAL': 'Contractors All Risks (CAR) - Annual Policy',
  'PA': 'Personal Accident (PA)',
  'TRAVEL': 'Travel Insurance',
  'HOME': 'Home Insurance',
};

// All products from product factory
const allProductCodes = Object.keys(productNames);

// Generate dummy test data for each product
const generateDummyLeads = (): Lead[] => {
  const dummyLeads: Lead[] = [];
  const brokers = ['Gulf Insurance Brokers', 'Emirates Risk Advisors', 'Marsh Middle East', 'AON Risk Solutions', 'Willis Towers Watson', 'JLT Risk Solutions'];
  const sources = ['Broker', 'Sales Agent', 'Agency', 'Direct', 'Online (B2C)', 'Referral'];
  const clientNames = [
    'Ahmed Al-Mansoori', 'Sarah Johnson', 'Mohammed Hassan', 'Fatima Al Zahra', 'Ali Ahmad',
    'Noor Abdullah', 'Omar Al Rashid', 'Layla Hassan', 'Khalid Al Marri', 'Sara Al Maktoum',
    'Youssef Al Fahim', 'Mariam Al Suwaidi', 'Hassan Al Nuaimi', 'Aisha Al Shamsi', 'Tariq Al Zaabi'
  ];
  const emails = [
    'ahmed@example.com', 'sarah@example.com', 'mohammed@example.com', 'fatima@example.com', 'ali@example.com',
    'noor@example.com', 'omar@example.com', 'layla@example.com', 'khalid@example.com', 'sara@example.com'
  ];
  const phones = ['971501234567', '971502345678', '971503456789', '971504567890', '971505678901'];
  const dispositionStatuses = ['New', 'Contacted', 'Follow Up', 'Qualified', 'Not Interested', 'Converted', 'Lost'];

  allProductCodes.forEach((productCode, productIndex) => {
    // Generate 2-4 leads per product
    const numLeads = 2 + (productIndex % 3);
    for (let i = 0; i < numLeads; i++) {
      const leadIndex = productIndex * 4 + i;
      const daysAgo = leadIndex % 30; // Spread over last 30 days
      const createdAt = new Date();
      createdAt.setDate(createdAt.getDate() - daysAgo);
      
      dummyLeads.push({
        id: `lead-${productCode}-${i + 1}`,
        quoteId: `Q-${productCode}-${String(i + 1).padStart(3, '0')}`,
        clientName: clientNames[leadIndex % clientNames.length],
        productCode: productCode,
        productName: productNames[productCode],
        brokerName: brokers[leadIndex % brokers.length],
        source: sources[leadIndex % sources.length],
        status: 'pending',
        dispositionStatus: dispositionStatuses[leadIndex % dispositionStatuses.length],
        createdAt: createdAt.toISOString(),
        email: emails[leadIndex % emails.length],
        phone: phones[leadIndex % phones.length],
      });
    }
  });

  return dummyLeads;
};

interface Lead {
  id: string;
  quoteId: string;
  clientName: string;
  productCode: string;
  productName: string;
  brokerName: string;
  source: string; // Source of the lead
  status: string;
  dispositionStatus: string;
  dispositionComments?: string;
  createdAt: string;
  premium?: string;
  sumInsured?: string;
  email?: string;
  phone?: string;
  address?: string;
}

const CallCenterPortal = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [leads, setLeads] = useState<Lead[]>([]);
  const [filteredLeads, setFilteredLeads] = useState<Lead[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedProduct, setSelectedProduct] = useState<string>("all");
  const [selectedSource, setSelectedSource] = useState<string>("all");
  const [selectedBroker, setSelectedBroker] = useState<string>("all");
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedLead, setSelectedLead] = useState<Lead | null>(null);
  const [editDispositionStatus, setEditDispositionStatus] = useState<string>("");
  const [editComments, setEditComments] = useState<string>("");


  // Load dummy test data
  useEffect(() => {
    setIsLoading(true);
    // Simulate API call delay
    setTimeout(() => {
      const dummyLeads = generateDummyLeads();
      setLeads(dummyLeads);
      setFilteredLeads(dummyLeads);
      setIsLoading(false);
    }, 500);
  }, []);

  // Filter leads
  useEffect(() => {
    let filtered = [...leads];

    // Filter by search term
    if (searchTerm) {
      const term = searchTerm.toLowerCase();
      filtered = filtered.filter(
        (lead) =>
          lead.clientName.toLowerCase().includes(term) ||
          lead.quoteId.toLowerCase().includes(term) ||
          lead.productName.toLowerCase().includes(term) ||
          lead.brokerName.toLowerCase().includes(term) ||
          lead.email?.toLowerCase().includes(term) ||
          lead.phone?.includes(term)
      );
    }

    // Filter by product
    if (selectedProduct !== "all") {
      filtered = filtered.filter((lead) => lead.productCode === selectedProduct);
    }

    // Filter by source
    if (selectedSource !== "all") {
      filtered = filtered.filter((lead) => lead.source === selectedSource);
    }

    // Filter by broker
    if (selectedBroker !== "all") {
      filtered = filtered.filter((lead) => lead.brokerName === selectedBroker);
    }

    setFilteredLeads(filtered);
  }, [searchTerm, selectedProduct, selectedSource, selectedBroker, leads]);

  const formatDate = (dateString: string) => {
    if (!dateString) return 'N/A';
    try {
      return formatDateDDMMYYYY(dateString);
    } catch {
      return dateString;
    }
  };

  const handleEditDisposition = (lead: Lead) => {
    setSelectedLead(lead);
    setEditDispositionStatus(lead.dispositionStatus);
    setEditComments(lead.dispositionComments || "");
    setEditDialogOpen(true);
  };

  const handleSaveDisposition = () => {
    if (!selectedLead) return;

    // Update the lead in the leads array
    const updatedLeads = leads.map(lead => 
      lead.id === selectedLead.id 
        ? { ...lead, dispositionStatus: editDispositionStatus, dispositionComments: editComments }
        : lead
    );

    setLeads(updatedLeads);
    
    // Update filtered leads if needed
    setFilteredLeads(prev => prev.map(lead => 
      lead.id === selectedLead.id 
        ? { ...lead, dispositionStatus: editDispositionStatus, dispositionComments: editComments }
        : lead
    ));

    toast({
      title: "Disposition Updated",
      description: `Disposition status updated to ${editDispositionStatus} for ${selectedLead.clientName}`,
    });

    setEditDialogOpen(false);
    setSelectedLead(null);
    setEditDispositionStatus("");
    setEditComments("");
  };

  const dispositionStatusOptions = ['New', 'Contacted', 'Follow Up', 'Qualified', 'Not Interested', 'Converted', 'Lost'];

  const uniqueProducts = Array.from(new Set(leads.map((lead) => lead.productCode))).filter(Boolean);
  const uniqueSources = Array.from(new Set(leads.map((lead) => lead.source))).filter(Boolean).sort();
  const uniqueBrokers = Array.from(new Set(leads.map((lead) => lead.brokerName))).filter(Boolean).sort();

  const handleLogout = () => {
    toast({
      title: "Logged Out",
      description: "You have been successfully logged out.",
    });
    navigate("/call-center/login");
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      {/* Custom Header with Logo and Logout */}
      <header className="bg-card border-b shadow-soft">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-3">
              <img src="/riyadh.png" alt="Riyadh Re" className="h-10 w-auto" />
              <h1 className="text-xl font-semibold text-foreground">Call Center Portal</h1>
            </div>
            <div className="flex items-center space-x-4">
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="gap-2"
              >
                <LogOut className="w-4 h-4" />
                Logout
              </Button>
            </div>
          </div>
        </div>
      </header>
      
      <div className="container mx-auto px-4 py-8 max-w-7xl flex-1">
        <div className="mb-8">
          <p className="text-muted-foreground">View and manage all leads organized by product</p>
        </div>

        {/* Filters */}
        <Card className="mb-6">
          <CardHeader>
            <CardTitle>Filters</CardTitle>
            <CardDescription>Filter leads by product, source, broker, or search term</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-muted-foreground w-4 h-4" />
                <Input
                  placeholder="Search by client, quote ID, product..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10"
                />
              </div>
              <Select value={selectedProduct} onValueChange={setSelectedProduct}>
                <SelectTrigger>
                  <SelectValue placeholder="All Products" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Products</SelectItem>
                  {uniqueProducts.map((code) => (
                    <SelectItem key={code} value={code}>
                      {productNames[code] || code}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedSource} onValueChange={setSelectedSource}>
                <SelectTrigger>
                  <SelectValue placeholder="All Sources" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Sources</SelectItem>
                  {uniqueSources.map((source) => (
                    <SelectItem key={source} value={source}>
                      {source}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedBroker} onValueChange={setSelectedBroker}>
                <SelectTrigger>
                  <SelectValue placeholder="All Brokers" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Brokers</SelectItem>
                  {uniqueBrokers.map((broker) => (
                    <SelectItem key={broker} value={broker}>
                      {broker}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Summary Stats */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Leads</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{filteredLeads.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Products</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{uniqueProducts.length}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Pending</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredLeads.filter((l) => l.status.toLowerCase().includes('pending') || l.status.toLowerCase().includes('generated')).length}
              </div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Confirmed</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {filteredLeads.filter((l) => l.status.toLowerCase().includes('confirmed') || l.status.toLowerCase().includes('approved')).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Leads Table */}
        {isLoading ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">Loading leads...</p>
            </CardContent>
          </Card>
        ) : filteredLeads.length === 0 ? (
          <Card>
            <CardContent className="py-8 text-center">
              <p className="text-muted-foreground">No leads found</p>
            </CardContent>
          </Card>
        ) : (
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Package className="w-6 h-6" />
                  <div>
                    <CardTitle>Leads</CardTitle>
                    <CardDescription>
                      {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''} found
                    </CardDescription>
                  </div>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Client Name</TableHead>
                      <TableHead>Product</TableHead>
                      <TableHead>Source</TableHead>
                      <TableHead>Broker</TableHead>
                      <TableHead>Contact</TableHead>
                      <TableHead>Disposition Status</TableHead>
                      <TableHead>Created Date</TableHead>
                      <TableHead>Actions</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {filteredLeads.map((lead) => (
                      <TableRow key={lead.id}>
                        <TableCell className="font-medium">{lead.clientName}</TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            {productIcons[lead.productCode] || <Package className="w-4 h-4" />}
                            <span className="text-sm">{productNames[lead.productCode] || lead.productCode}</span>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline">{lead.source}</Badge>
                        </TableCell>
                        <TableCell>{lead.brokerName}</TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {lead.email && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Mail className="w-3 h-3" />
                                {lead.email}
                              </div>
                            )}
                            {lead.phone && (
                              <div className="flex items-center gap-1 text-sm text-muted-foreground">
                                <Phone className="w-3 h-3" />
                                {lead.phone}
                              </div>
                            )}
                            {!lead.email && !lead.phone && <span className="text-sm text-muted-foreground">N/A</span>}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <Badge 
                              variant="outline" 
                              className="cursor-pointer hover:bg-accent transition-colors"
                              onClick={() => handleEditDisposition(lead)}
                            >
                              {lead.dispositionStatus}
                              <Edit2 className="w-3 h-3 ml-1" />
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1 text-sm">
                            <Calendar className="w-3 h-3 text-muted-foreground" />
                            {formatDate(lead.createdAt)}
                          </div>
                        </TableCell>
                        <TableCell>
                          <Button
                            variant="ghost"
                            size="sm"
                            disabled
                            className="cursor-not-allowed opacity-50"
                          >
                            <Eye className="w-4 h-4 mr-1" />
                            View
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* Edit Disposition Dialog */}
      <Dialog open={editDialogOpen} onOpenChange={setEditDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Update Disposition Status</DialogTitle>
            <DialogDescription>
              Update the disposition status and add comments for {selectedLead?.clientName}
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="disposition-status">Disposition Status</Label>
              <Select value={editDispositionStatus} onValueChange={setEditDispositionStatus}>
                <SelectTrigger id="disposition-status">
                  <SelectValue placeholder="Select disposition status" />
                </SelectTrigger>
                <SelectContent>
                  {dispositionStatusOptions.map((status) => (
                    <SelectItem key={status} value={status}>
                      {status}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="comments">Comments</Label>
              <Textarea
                id="comments"
                placeholder="Add comments about this disposition..."
                value={editComments}
                onChange={(e) => setEditComments(e.target.value)}
                rows={4}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setEditDialogOpen(false)}>
              Cancel
            </Button>
            <Button onClick={handleSaveDisposition}>
              <Save className="w-4 h-4 mr-2" />
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default CallCenterPortal;

