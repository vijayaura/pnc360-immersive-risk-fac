/**
 * Insurer Create Quote - Product Selection Page
 * Step 1: Select product for the quote
 */

import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

const insuranceProducts = [
  {
    id: "PI_Arch",
    code: "PI_Arch",
    name: "Professional Liability Insurance - Architects and Engineers",
    description: "Annual policy for professional liability coverage",
    category: "LIABILITY"
  }
];

export default function InsurerCreateQuoteProductSelection() {
  const navigate = useNavigate();

  const handleProductSelect = (productCode: string) => {
    // Navigate to distributor selection with product code
    navigate(`/insurer/create-quote/distributor?product=${productCode}`);
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div>
        <h1 className="text-3xl font-bold">Create New Quote</h1>
        <p className="text-muted-foreground mt-1">Select a product to create a quote on behalf of a distributor</p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Select Product</CardTitle>
          <CardDescription>Choose the insurance product for this quote</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {insuranceProducts.map((product) => (
              <Card
                key={product.id}
                className="cursor-pointer hover:border-primary transition-colors"
                onClick={() => handleProductSelect(product.code)}
              >
                <CardContent className="p-6">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <h3 className="font-semibold text-lg mb-2">{product.name}</h3>
                      <p className="text-sm text-muted-foreground mb-4">{product.description}</p>
                      <div className="flex items-center gap-2">
                        <span className="text-xs px-2 py-1 bg-muted rounded">{product.category}</span>
                        <span className="text-xs px-2 py-1 bg-muted rounded">{product.code}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

