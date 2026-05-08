import { useParams, useNavigate } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, User, Calendar, DollarSign, Shield, FileText, AlertTriangle, Briefcase, CheckCircle, Download, Edit } from "lucide-react";
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/features/quotes/components/QuotesComparison/QuoteStatusDot";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';

// Quote details data - reusing the same structure as broker/insurer details
const getQuoteDetails = (id: string) => {
  const quotes = {
    "Q001": {
      id: "Q001",
      insuredName: "Al Habtoor Construction LLC",
      projectName: "Al Habtoor Tower Development",
      projectType: "Commercial",
      status: QUOTE_STATUSES.QUOTE_GENERATED,
      premium: "AED 57,800",
      submittedDate: "2024-01-15",
      validUntil: "2024-02-15",
      expiryDate: "2024-02-15",
      sumInsured: "AED 8,450,000",
      constructionType: "Reinforced Concrete",
      buildingHeight: "45 floors",
      buildingAge: "New Construction",
      location: "Downtown Dubai",
      occupation: "Mixed Use Development",
      insurer: "Emirates Insurance",
      broker: "Ahmed Al-Mansoori",
      coverages: [
        { name: "All Risks Property Insurance", sumInsured: "AED 8,450,000", premium: "AED 42,250", rate: "0.50%" },
        { name: "Third Party Liability", sumInsured: "AED 1,000,000", premium: "AED 5,000", rate: "0.50%" },
        { name: "Employers Liability", sumInsured: "AED 500,000", premium: "AED 2,500", rate: "0.50%" },
        { name: "Professional Indemnity", sumInsured: "AED 2,000,000", premium: "AED 8,050", rate: "0.40%" }
      ],
      cewItems: [
        { type: "Material Damage", description: "Earthquake Extension", premium: "AED 1,200", selected: true },
        { type: "Material Damage", description: "Flood Extension", premium: "AED 800", selected: true },
        { type: "Liability", description: "Cross Liability", premium: "AED 500", selected: false },
        { type: "Liability", description: "Product Liability Extension", premium: "AED 750", selected: true },
        { type: "Additional", description: "Business Interruption", premium: "AED 2,000", selected: true }
      ]
    },
    "Q002": {
      id: "Q002",
      insuredName: "Emaar Properties",
      projectName: "Downtown Residential Complex",
      projectType: "Residential",
      status: QUOTE_STATUSES.QUOTE_CONFIRMED,
      premium: "AED 42,250",
      submittedDate: "2024-01-12",
      validUntil: "2024-02-12",
      expiryDate: "2024-02-12",
      sumInsured: "AED 6,200,000",
      constructionType: "Reinforced Concrete",
      buildingHeight: "30 floors",
      buildingAge: "New Construction",
      location: "Dubai Marina",
      occupation: "Residential Towers",
      insurer: "AXA Gulf",
      broker: "Sarah Johnson",
      coverages: [
        { name: "All Risks Property Insurance", sumInsured: "AED 6,200,000", premium: "AED 31,000", rate: "0.50%" },
        { name: "Third Party Liability", sumInsured: "AED 1,000,000", premium: "AED 4,500", rate: "0.45%" },
        { name: "Employers Liability", sumInsured: "AED 500,000", premium: "AED 2,250", rate: "0.45%" },
        { name: "Professional Indemnity", sumInsured: "AED 1,000,000", premium: "AED 4,500", rate: "0.45%" }
      ],
      cewItems: [
        { type: "Material Damage", description: "Earthquake Extension", premium: "AED 1,000", selected: true },
        { type: "Material Damage", description: "Flood Extension", premium: "AED 650", selected: false },
        { type: "Liability", description: "Cross Liability", premium: "AED 400", selected: true },
        { type: "Additional", description: "Loss of Rent", premium: "AED 1,500", selected: true }
      ]
    }
    // Add more quotes as needed
  };
  
  return quotes[id as keyof typeof quotes] || null;
};

const getQuoteStatusBadge = (status: string) => {
  const color = getQuoteStatusColor(status);
  const label = getQuoteStatusLabel(status);
  
  switch (status) {
    case QUOTE_STATUSES.QUOTE_GENERATED:
      return <Badge className="bg-blue-100 text-blue-800 border-blue-200">{label}</Badge>;
    case QUOTE_STATUSES.QUOTE_CONFIRMED:
      return <Badge className="bg-green-100 text-green-800 border-green-200">{label}</Badge>;
    case QUOTE_STATUSES.SELECTED_PRODUCT:
      return <Badge className="bg-yellow-100 text-yellow-800 border-yellow-200">{label}</Badge>;
    case QUOTE_STATUSES.QUOTE_EDITED:
      return <Badge className="bg-orange-100 text-orange-800 border-orange-200">{label}</Badge>;
    case QUOTE_STATUSES.POLICY_GENERATED:
      return <Badge className="bg-purple-100 text-purple-800 border-purple-200">{label}</Badge>;
    case QUOTE_STATUSES.PAYMENT_PENDING:
      return <Badge className="bg-red-100 text-red-800 border-red-200">{label}</Badge>;
    default:
      return <Badge>{label}</Badge>;
  }
};

const MarketAdminQuoteDetails = () => {
  const { quoteId } = useParams();
  const navigate = useNavigate();
  const quote = getQuoteDetails(quoteId || "");

  // Scroll to top when component mounts
  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  const exportToExcel = () => {
    if (!quote) return;

    const exportData = [
      ['Quote Details'],
      ['Quote ID', quote.id],
      ['Insured Name', quote.insuredName],
      ['Status', getQuoteStatusLabel(quote.status)],
      ['Submitted Date', quote.submittedDate],
      [],
      ['Project Details'],
      ['Project Name', quote.projectName],
      ['Project Type', quote.projectType],
      ['Construction Type', quote.constructionType],
      ['Building Height', quote.buildingHeight],
      ['Building Age', quote.buildingAge],
      ['Location', quote.location],
      ['Occupation', quote.occupation],
      [],
      ['Financial Summary'],
      ['Total Sum Insured', quote.sumInsured],
      ['Total Premium', quote.premium],
      [],
      ['Coverage Details'],
      ['Coverage Type', 'Sum Insured', 'Premium', 'Rate'],
      ...quote.coverages.map(coverage => [
        coverage.name,
        coverage.sumInsured,
        coverage.premium,
        coverage.rate
      ])
    ];

    const worksheet = XLSX.utils.aoa_to_sheet(exportData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Quote Details');
    XLSX.writeFile(workbook, `Quote_${quote.id}_Details.xlsx`);
  };

  const downloadProposal = () => {
    if (!quote) return;

    const pdf = new jsPDF();
    let yPos = 20;
    const lineHeight = 8;
    const pageHeight = pdf.internal.pageSize.height;
    const marginBottom = 20;

    // Helper function to add text with page break if needed
    const addText = (text: string, fontSize = 12, isBold = false) => {
      if (yPos > pageHeight - marginBottom) {
        pdf.addPage();
        yPos = 20;
      }
      pdf.setFontSize(fontSize);
      pdf.setFont('helvetica', isBold ? 'bold' : 'normal');
      pdf.text(text, 20, yPos);
      yPos += lineHeight;
    };

    // Title
    addText('CONSTRUCTION INSURANCE PROPOSAL', 16, true);
    yPos += 5;

    // Quote Details
    addText('QUOTE DETAILS', 14, true);
    addText(`Quote ID: ${quote.id}`);
    addText(`Insured Name: ${quote.insuredName}`);
    addText(`Status: ${getQuoteStatusLabel(quote.status)}`);
    addText(`Submitted Date: ${quote.submittedDate}`);
    yPos += 5;

    // Project Details
    addText('PROJECT DETAILS', 14, true);
    addText(`Project Name: ${quote.projectName}`);
    addText(`Project Type: ${quote.projectType}`);
    addText(`Construction Type: ${quote.constructionType}`);
    addText(`Building Height: ${quote.buildingHeight}`);
    addText(`Building Age: ${quote.buildingAge}`);
    addText(`Location: ${quote.location}`);
    addText(`Occupation: ${quote.occupation}`);
    yPos += 5;

    // Financial Summary
    addText('FINANCIAL SUMMARY', 14, true);
    addText(`Total Sum Insured: ${quote.sumInsured}`);
    addText(`Total Premium: ${quote.premium}`);
    yPos += 5;

    // Coverage Details
    addText('COVERAGE DETAILS', 14, true);
    quote.coverages.forEach(coverage => {
      addText(`${coverage.name}:`);
      addText(`  Sum Insured: ${coverage.sumInsured}`);
      addText(`  Premium: ${coverage.premium}`);
      addText(`  Rate: ${coverage.rate}`);
      yPos += 2;
    });

    yPos += 10;

    // Signature Section
    addText('SIGNATURES', 14, true);
    yPos += 10;

    // Broker Signature
    addText('BROKER SIGNATURE:', 12, true);
    yPos += 15;
    pdf.line(20, yPos, 120, yPos); // Signature line
    yPos += 5;
    addText('Broker Name: _______________________', 10);
    addText('Date: _______________', 10);
    yPos += 15;

    // Customer Signature
    addText('CUSTOMER SIGNATURE:', 12, true);
    yPos += 15;
    pdf.line(20, yPos, 120, yPos); // Signature line
    yPos += 5;
    addText('Customer Name: _______________________', 10);
    addText('Date: _______________', 10);

    pdf.save(`Proposal_${quote.id}.pdf`);
  };

  if (!quote) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <Card className="max-w-md w-full">
          <CardContent className="p-6 text-center">
            <h2 className="text-xl font-semibold mb-2">Quote Not Found</h2>
            <p className="text-muted-foreground mb-4">The requested quote could not be found.</p>
            <Button onClick={() => navigate("/market-admin/dashboard")}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="border-b bg-card">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/market-admin/dashboard")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-xl font-semibold text-foreground">Quote Details - {quote.id}</h1>
                <p className="text-sm text-muted-foreground">{quote.insuredName}</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              {getQuoteStatusBadge(quote.status)}
              <Button onClick={exportToExcel} size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download Quote
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Main Content */}
          <div className="lg:col-span-2 space-y-6">
            {/* Quote Information */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Quote Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Quote ID</div>
                    <p className="text-sm font-semibold">{quote.id}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Status</div>
                    <div className="mt-1">
                      <QuoteStatusDot status={quote.status} />
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Submitted Date</div>
                    <p className="text-sm">{quote.submittedDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Valid Until</div>
                    <p className="text-sm">{quote.validUntil}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Quote Expiry</div>
                    <p className="text-sm font-medium text-red-600">{quote.expiryDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Broker</div>
                    <p className="text-sm text-primary font-medium">{quote.broker}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Insurer</div>
                    <p className="text-sm text-primary font-medium">{quote.insurer}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Name</div>
                    <p className="text-sm font-semibold">{quote.projectName}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Type</div>
                    <p className="text-sm">{quote.projectType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Type</div>
                    <p className="text-sm">{quote.constructionType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Building Height</div>
                    <p className="text-sm">{quote.buildingHeight}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Building Age</div>
                    <p className="text-sm">{quote.buildingAge}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Location</div>
                    <p className="text-sm">{quote.location}</p>
                  </div>
                  <div className="col-span-2">
                    <div className="text-sm font-medium text-muted-foreground">Occupation</div>
                    <p className="text-sm">{quote.occupation}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Coverage Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Coverage Details
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {quote.coverages.map((coverage, index) => (
                    <div key={index} className="border rounded-lg p-4">
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-medium">{coverage.name}</h4>
                        <Badge variant="outline">{coverage.rate}</Badge>
                      </div>
                      <div className="grid grid-cols-2 gap-4 text-sm">
                        <div>
                          <span className="text-muted-foreground">Sum Insured:</span>
                          <span className="ml-2 font-medium">{coverage.sumInsured}</span>
                        </div>
                        <div>
                          <span className="text-muted-foreground">Premium:</span>
                          <span className="ml-2 font-medium text-primary">{coverage.premium}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* CEW Items */}
            <Card>
              <CardHeader>
                <CardTitle>Construction & Engineering Works Items</CardTitle>
                <CardDescription>Additional coverage extensions and endorsements</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {quote.cewItems.map((item, index) => (
                    <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center gap-3">
                        <div className="flex items-center gap-2">
                          {item.selected ? (
                            <CheckCircle className="w-4 h-4 text-green-600" />
                          ) : (
                            <div className="w-4 h-4 border border-muted-foreground rounded-full" />
                          )}
                          <Badge variant="outline" className="text-xs">
                            {item.type}
                          </Badge>
                        </div>
                        <span className="text-sm font-medium">{item.description}</span>
                      </div>
                      <span className="text-sm font-medium text-primary">{item.premium}</span>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Financial Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="w-5 h-5" />
                  Financial Summary
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Total Sum Insured</span>
                    <span className="font-semibold">{quote.sumInsured}</span>
                  </div>
                  <div className="flex justify-between items-center py-2 border-b">
                    <span className="text-sm text-muted-foreground">Total Premium</span>
                    <span className="font-semibold text-primary">{quote.premium}</span>
                  </div>
                  <div className="flex justify-between items-center py-2">
                    <span className="text-sm text-muted-foreground">Selected CEW Items</span>
                    <span className="font-semibold">
                      {quote.cewItems.filter(item => item.selected).length}
                    </span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Timeline */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calendar className="w-5 h-5" />
                  Timeline
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-primary rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium">Quote Generated</p>
                      <p className="text-xs text-muted-foreground">{quote.submittedDate}</p>
                    </div>
                  </div>
                  <div className="flex items-start gap-3">
                    <div className="w-2 h-2 bg-muted rounded-full mt-2"></div>
                    <div>
                      <p className="text-sm font-medium text-muted-foreground">Quote Expires</p>
                      <p className="text-xs text-muted-foreground">{quote.validUntil}</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Actions */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full" onClick={downloadProposal}>
                  <FileText className="w-4 h-4 mr-2" />
                  Download Proposal
                </Button>
                <Button variant="outline" className="w-full" onClick={exportToExcel}>
                  <Download className="w-4 h-4 mr-2" />
                  Download Quote
                </Button>
                <Button variant="secondary" className="w-full">
                  Send Quote in Mail
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminQuoteDetails;