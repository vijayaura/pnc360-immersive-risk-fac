/**
 * Insurer Create Quote - Distributor Selection Page
 * Step 2: Select distributor/broker for the quote
 */

import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useToast } from '@/shared/hooks/use-toast';
import { Skeleton } from "@/components/ui/skeleton";
import { Building2, Search, CheckCircle2, ArrowLeft } from "lucide-react";
import type { Broker } from '@/features/brokers/api/brokers';

const insuranceProducts = [
  {
    id: "PI_Arch",
    code: "PI_Arch",
    name: "Professional Liability Insurance - Architects and Engineers",
    description: "Annual policy for professional liability coverage",
    category: "LIABILITY"
  }
];

export default function InsurerCreateQuoteDistributorSelection() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();
  const productCode = searchParams.get("product");
  const [selectedDistributor, setSelectedDistributor] = useState<Broker | null>(null);
  const [brokers, setBrokers] = useState<Broker[]>([]);
  const [isLoadingBrokers, setIsLoadingBrokers] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const selectedProduct = insuranceProducts.find(p => p.code === productCode);

  // Redirect if no product selected
  useEffect(() => {
    if (!productCode || !selectedProduct) {
      navigate("/insurer/create-quote");
    }
  }, [productCode, selectedProduct, navigate]);

  // Load brokers list on mount
  useEffect(() => {
    const loadBrokers = async () => {
      setIsLoadingBrokers(true);
      try {
        // Use hardcoded distributor list
        const distributorBrokers: Broker[] = [
          { id: 1, name: "Aon Reinsurance Solutions", email: "info@aonre.com", status: "active", licenseNumber: "BRK-001" },
          { id: 2, name: "Guy Carpenter & Company", email: "contact@guycarpenter.com", status: "active", licenseNumber: "BRK-002" },
          { id: 3, name: "Marsh McLennan / Marsh Re", email: "info@marsh.com", status: "active", licenseNumber: "BRK-003" },
          { id: 4, name: "Gallagher Re", email: "info@gallagherre.com", status: "active", licenseNumber: "BRK-004" },
          { id: 5, name: "Howden Re", email: "contact@howdenre.com", status: "active", licenseNumber: "BRK-005" },
          { id: 6, name: "Lockton Re", email: "info@locktonre.com", status: "active", licenseNumber: "BRK-006" },
          { id: 7, name: "BMS Re / BMS Group", email: "contact@bmsgroup.com", status: "active", licenseNumber: "BRK-007" },
          { id: 8, name: "Chedid Re", email: "info@chedidre.com", status: "active", licenseNumber: "BRK-008" },
          { id: 9, name: "SHIELDS Reinsurance Brokers", email: "contact@shieldsre.com", status: "active", licenseNumber: "BRK-009" },
          { id: 10, name: "United Insurance Brokers (UIB)", email: "info@uib.com", status: "active", licenseNumber: "BRK-010" }
        ];
        setBrokers(distributorBrokers);
      } catch (error: any) {
        console.error("Failed to load brokers:", error);
        toast({
          title: "Error",
          description: error.message || "Failed to load distributors",
          variant: "destructive"
        });
      } finally {
        setIsLoadingBrokers(false);
      }
    };

    loadBrokers();
  }, [toast]);

  const filteredBrokers = brokers.filter(broker =>
    broker.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    broker.email?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDistributorSelect = (broker: Broker) => {
    setSelectedDistributor(broker);
    // Auto-navigate to proposal form when distributor is selected
    navigate(`/insurer/create-quote/proposal?product=${productCode}&distributor=${broker.id}&distributorName=${encodeURIComponent(broker.name)}`);
  };

  if (!selectedProduct) {
    return null;
  }

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Create New Quote</h1>
          <p className="text-muted-foreground mt-1">Select a distributor for {selectedProduct.name}</p>
        </div>
        <Button variant="outline" onClick={() => navigate("/insurer/create-quote")}>
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back
        </Button>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Distributor</CardTitle>
          <CardDescription>Choose the distributor/broker for this quote (Top 10)</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search distributors..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            {isLoadingBrokers ? (
              <div className="space-y-3">
                {Array.from({ length: 5 }).map((_, i) => (
                  <Skeleton key={i} className="h-20 w-full" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {filteredBrokers.map((broker) => (
                  <Card
                    key={broker.id}
                    className={`cursor-pointer hover:border-primary transition-colors ${
                      selectedDistributor?.id === broker.id ? "border-primary border-2" : ""
                    }`}
                    onClick={() => handleDistributorSelect(broker)}
                  >
                    <CardContent className="p-4">
                      <div className="flex items-start justify-between">
                        <div className="flex items-start gap-3 flex-1">
                          <Building2 className="w-5 h-5 text-muted-foreground mt-1" />
                          <div className="flex-1">
                            <h3 className="font-semibold mb-1">{broker.name}</h3>
                            {broker.email && (
                              <p className="text-sm text-muted-foreground mb-1">{broker.email}</p>
                            )}
                            {broker.licenseNumber && (
                              <p className="text-xs text-muted-foreground">License: {broker.licenseNumber}</p>
                            )}
                          </div>
                        </div>
                        {selectedDistributor?.id === broker.id && (
                          <CheckCircle2 className="w-6 h-6 text-primary" />
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}

            {!isLoadingBrokers && filteredBrokers.length === 0 && (
              <div className="text-center py-8 text-muted-foreground">
                No distributors found matching your search.
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

