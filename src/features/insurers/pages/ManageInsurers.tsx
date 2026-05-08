import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { Footer } from "@/components/layout/Footer";
import { CreateInsurerDialog } from "@/features/insurers/components/CreateInsurerDialog";
import { ArrowLeft, Building2, Users, Eye, Settings } from "lucide-react";

// Mock data for insurers
const mockInsurers = [
  {
    id: "emirates-insurance",
    name: "Emirates Insurance",
    email: "contact@emiratesinsurance.ae",
    phone: "+971-4-123-4567",
    status: "active",
    quotesCount: 15,
    approvedQuotes: 8,
    totalPremium: "AED 2,350,000",
    licenseNumber: "EI-2024-001"
  },
  {
    id: "axa-gulf",
    name: "AXA Gulf",
    email: "dubai@axa-gulf.com",
    phone: "+971-4-987-6543",
    status: "active",
    quotesCount: 22,
    approvedQuotes: 12,
    totalPremium: "AED 3,150,000",
    licenseNumber: "AXA-2024-002"
  },
  {
    id: "oman-insurance",
    name: "Oman Insurance",
    email: "info@omaninsurance.com",
    phone: "+971-4-555-7890",
    status: "active",
    quotesCount: 18,
    approvedQuotes: 10,
    totalPremium: "AED 2,780,000",
    licenseNumber: "OI-2024-003"
  },
  {
    id: "dubai-insurance",
    name: "Dubai Insurance",
    email: "support@dubaiinsurance.ae",
    phone: "+971-4-333-1122",
    status: "inactive",
    quotesCount: 5,
    approvedQuotes: 2,
    totalPremium: "AED 650,000",
    licenseNumber: "DI-2024-004"
  }
];

const getStatusBadge = (status: string) => {
  switch (status) {
    case "active":
      return <Badge variant="outline" className="text-success border-success/20">Active</Badge>;
    case "inactive":
      return <Badge variant="outline" className="text-destructive border-destructive/20">Inactive</Badge>;
    default:
      return <Badge>{status}</Badge>;
  }
};

const ManageInsurers = () => {
  const { navigateBack } = useNavigationHistory();
  const navigate = useNavigate();
  const [insurers, setInsurers] = useState(mockInsurers);

  const handleInsurerCreated = (newInsurer: any) => {
    setInsurers(prev => [...prev, newInsurer]);
  };

  const toggleInsurerStatus = (insurerId: string) => {
    setInsurers(prev => 
      prev.map(insurer => 
        insurer.id === insurerId 
          ? { ...insurer, status: insurer.status === "active" ? "inactive" : "active" }
          : insurer
      )
    );
  };

  return (
    <div className="min-h-screen bg-background flex flex-col">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigateBack()}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Manage Insurers</h1>
                <p className="text-sm text-muted-foreground">View and manage insurance partners</p>
              </div>
            </div>
            <CreateInsurerDialog onInsurerCreated={handleInsurerCreated} />
          </div>
        </div>
      </div>

      <div className="flex-1">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
             <Card>
               <CardContent className="p-6">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Insurers</p>
                   <p className="text-2xl font-bold text-foreground">{insurers.length}</p>
                 </div>
               </CardContent>
             </Card>
            
             <Card>
               <CardContent className="p-6">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Active Partners</p>
                   <p className="text-2xl font-bold text-foreground">
                     {insurers.filter(i => i.status === "active").length}
                   </p>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardContent className="p-6">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Quotes</p>
                   <p className="text-2xl font-bold text-foreground">
                     {insurers.reduce((sum, insurer) => sum + insurer.quotesCount, 0)}
                   </p>
                 </div>
               </CardContent>
             </Card>

             <Card>
               <CardContent className="p-6">
                 <div>
                   <p className="text-sm font-medium text-muted-foreground">Total Premium</p>
                   <p className="text-2xl font-bold text-foreground">AED 8.93M</p>
                 </div>
               </CardContent>
             </Card>
          </div>

          {/* Insurers List */}
          <Card>
            <CardHeader>
              <CardTitle>Insurance Partners</CardTitle>
              <CardDescription>Manage your insurance partners and their configurations</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Insurer</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Quotes</TableHead>
                    <TableHead>Approved</TableHead>
                    <TableHead>Total Premium</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {insurers.map((insurer) => (
                    <TableRow key={insurer.id} className="hover:bg-muted/50">
                      <TableCell>
                        <div className="space-y-1">
                          <div className="font-medium">{insurer.name}</div>
                          <div className="text-sm text-muted-foreground">
                            License: {insurer.licenseNumber}
                          </div>
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="space-y-1">
                          <div className="text-sm">{insurer.email}</div>
                          <div className="text-sm text-muted-foreground">{insurer.phone}</div>
                        </div>
                      </TableCell>
                      <TableCell>
                        {getStatusBadge(insurer.status)}
                      </TableCell>
                      <TableCell className="font-medium">{insurer.quotesCount}</TableCell>
                      <TableCell className="font-medium text-success">{insurer.approvedQuotes}</TableCell>
                      <TableCell className="font-medium text-primary">{insurer.totalPremium}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex items-center gap-3 justify-end">
                          <div className="flex items-center gap-2">
                            <Label htmlFor={`insurer-${insurer.id}`} className="text-sm">
                              {insurer.status === "active" ? 'Active' : 'Inactive'}
                            </Label>
                            <Switch
                              id={`insurer-${insurer.id}`}
                              checked={insurer.status === "active"}
                              onCheckedChange={() => toggleInsurerStatus(insurer.id)}
                            />
                          </div>
                          <Button 
                            variant="outline"
                            size="sm"
                            onClick={() => navigate(`/broker/insurer/${insurer.id}/dashboard`)}
                          >
                            <Eye className="w-4 h-4 mr-2" />
                            View
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default ManageInsurers;