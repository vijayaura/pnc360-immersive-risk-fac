import { useParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, Building2, User, Calendar, DollarSign, Shield, FileText, AlertTriangle, Briefcase, CheckCircle, FileCheck, Download, Edit } from "lucide-react";
import * as XLSX from 'xlsx';
import jsPDF from 'jspdf';
import { QUOTE_STATUSES, getQuoteStatusLabel, getQuoteStatusColor } from "@/lib/quote-status";
import { QuoteStatusDot } from "@/features/quotes/components/QuotesComparison/QuoteStatusDot";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";

// Mock detailed quote data showing only what's captured in the quote creation process
const getQuoteDetails = (id: string) => {
  const quotes = {
    "Q001": {
      id: "Q001",
      // Project Details
      projectName: "Al Habtoor Tower Development",
      projectType: "Commercial",
      constructionType: "Concrete",
      projectAddress: "Sheikh Zayed Road, Business Bay, Dubai, UAE",
      coordinates: "25.2048, 55.2708",
      projectValue: "AED 9,175,000",
      startDate: "2024-03-01",
      completionDate: "2024-09-15",
      constructionPeriod: "18 months",
      maintenancePeriod: "24 months",
      
      // Insured Details
      insuredName: "Al Habtoor Construction LLC",
      roleOfInsured: "Contractor",
      contactEmail: "projects@alhabtoor.ae",
      phoneNumber: "+971-4-555-0123",
      vatNumber: "100123456700003",
      countryOfIncorporation: "UAE",
      
      // Contract Structure
      mainContractor: "Al Habtoor Construction LLC",
      principalOwner: "Dubai Development Authority",
      contractType: "Turnkey",
      contractNumber: "DDA-2024-CT-001",
      engineerConsultant: "Atkins Middle East",
      subContractors: [
        {
          name: "Emirates Steel",
          contractType: "Supply",
          contractNumber: "ES-2024-001"
        },
        {
          name: "Dubai Glass",
          contractType: "Install",
          contractNumber: "DG-2024-002"
        }
      ],
      
      // Site Risks
      nearWaterBody: "No",
      floodProneZone: "No",
      withinCityCenter: "Yes",
      cityAreaType: "Urban",
      soilType: "Sandy",
      existingStructure: "No",
      blastingExcavation: "No",
      siteSecurityArrangements: "24/7 Guarded",
      
      // Cover Requirements
      sumInsuredMaterial: "AED 6,615,000",
      sumInsuredPlant: "AED 1,468,000",
      sumInsuredTemporary: "AED 367,000",
      principalExistingProperty: "AED 0",
      tplLimit: "AED 3,670,000",
      crossLiabilityCover: "Yes",
      removalDebrisLimit: "AED 458,750",
      
      // Extensions
      extensions: {
        debrisRemoval: true,
        professionalFees: false,
        offsiteStorage: false,
        transitStorage: false,
        icow: false,
        fireBrigadeCharges: false
      },
      
      // Selected CEW Items (Policy Extensions & Conditions)
      selectedCEWItems: [
        {
          id: 1,
          name: "Maintenance Extension",
          type: "extension",
          selectedOption: "18 Months",
          limit: "24 Months",
          percentage: "+15%",
          wording: "This extension provides coverage for defects arising during the maintenance period as specified in the contract. Coverage includes rectification costs, re-performance costs, and associated professional fees."
        },
        {
          id: 2,
          name: "Professional Indemnity Extension",
          type: "extension", 
          selectedOption: "AED 2M Limit",
          limit: "AED 2,000,000",
          percentage: "+8%",
          wording: "This extension provides coverage for legal liability arising from professional negligence in the performance of professional services. Coverage includes defense costs, settlements, and court-awarded damages."
        },
        {
          id: 3,
          name: "Off-site Storage Extension",
          type: "extension",
          selectedOption: "AED 500K Limit",
          limit: "AED 500,000",
          percentage: "+3%",
          wording: "Coverage for materials, goods, and equipment stored at locations away from the main construction site, including transit to and from such storage locations."
        },
        {
          id: 4,
          name: "Earthquake Exclusion Waiver",
          type: "condition",
          selectedOption: "Zone 3-4 Coverage",
          limit: "100% of Sum Insured",
          percentage: "-5%",
          wording: "Standard earthquake exclusion is waived for seismic zones 3-4, providing coverage for earthquake-related damages including ground shaking, surface rupture, and associated ground failures."
        },
        {
          id: 5,
          name: "Contractors Plant Deductible",
          type: "condition",
          selectedOption: "AED 2,500",
          limit: "AED 2,500 per claim",
          percentage: "-2%",
          wording: "Reduced deductible applicable to contractors' plant and equipment. Lower deductible provides enhanced protection for specialized construction equipment and machinery."
        },
        {
          id: 6,
          name: "Defects Liability Period",
          type: "warranty",
          selectedOption: "12 Months",
          limit: "12 Months from Completion",
          percentage: "0%",
          wording: "Contractor warrants that all works will be free from defects for the specified period. This warranty covers material and workmanship defects discovered during the liability period."
        },
        {
          id: 7,
          name: "Performance Guarantee",
          type: "warranty",
          selectedOption: "10% Contract Value",
          limit: "10% of Contract Sum",
          percentage: "+5%",
          wording: "Contractor guarantees satisfactory performance and completion of the works in accordance with contract specifications, including quality standards and delivery timelines."
        }
      ],
      
      // Claims History
      lossesInLastFiveYears: "Yes",
      claimsHistory: [
        {
          year: 2024,
          claimCount: 1,
          amount: "50000",
          description: "Minor equipment damage during construction phase"
        },
        {
          year: 2023,
          claimCount: 0,
          amount: "",
          description: ""
        },
        {
          year: 2022,
          claimCount: 0,
          amount: "",
          description: ""
        },
        {
          year: 2021,
          claimCount: 0,
          amount: "",
          description: ""
        },
        {
          year: 2020,
          claimCount: 0,
          amount: "",
          description: ""
        }
      ],
      
      // Status & Quote Info
      status: QUOTE_STATUSES.QUOTE_GENERATED,
      submittedDate: "2024-01-15",
      expiryDate: "2024-02-15"
    }
  };
  
  return quotes[id as keyof typeof quotes] || null;
};

const getStatusBadge = (status: string) => {
  return (
    <QuoteStatusDot status={status} />
  );
};

const MarketAdminBrokerQuoteDetails = () => {
  const { quoteId, brokerId } = useParams();
  const { navigateBack } = useNavigationHistory();
  const quote = getQuoteDetails(quoteId || "");

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
      ['Project Address', quote.projectAddress],
      ['Sum Insured Value', quote.projectValue],
      ['Start Date', quote.startDate],
      ['Completion Date', quote.completionDate],
      ['Construction Period', quote.constructionPeriod],
      ['Maintenance Period', quote.maintenancePeriod],
      [],
      ['Insured Details'],
      ['Role of Insured', quote.roleOfInsured],
      ['Contact Email', quote.contactEmail],
      ['Phone Number', quote.phoneNumber],
      ['VAT Number', quote.vatNumber],
      ['Country of Incorporation', quote.countryOfIncorporation],
      [],
      ['Contract Structure'],
      ['Main Contractor', quote.mainContractor],
      ['Principal/Owner', quote.principalOwner],
      ['Contract Type', quote.contractType],
      ['Contract Number', quote.contractNumber],
      ['Engineer/Consultant', quote.engineerConsultant],
      [],
      ['Sub-Contractors'],
      ...quote.subContractors.map(sub => [sub.name, sub.contractType, sub.contractNumber]),
      [],
      ['Site Risk Assessment'],
      ['Near Water Body', quote.nearWaterBody],
      ['Flood Prone Zone', quote.floodProneZone],
      ['Within City Center', quote.withinCityCenter],
      ['Area Type', quote.cityAreaType],
      ['Soil Type', quote.soilType],
      ['Existing Structure', quote.existingStructure],
      ['Blasting/Deep Excavation', quote.blastingExcavation],
      ['Site Security', quote.siteSecurityArrangements],
      [],
      ['Cover Requirements'],
      ['Contract Works', quote.sumInsuredMaterial],
      ['Plant & Equipment', quote.sumInsuredPlant],
      ['Temporary Works', quote.sumInsuredTemporary],
      ['Principal\'s Existing Property', quote.principalExistingProperty],
      ['TPL Limit', quote.tplLimit],
      ['Cross Liability Cover', quote.crossLiabilityCover],
      ['Removal of Debris Limit', quote.removalDebrisLimit],
      [],
      ['Claims History'],
      ['Losses in Last 5 Years', quote.lossesInLastFiveYears],
      ...(quote.lossesInLastFiveYears === "Yes" ? [
        ['Year', 'Count of Claims', 'Amount (AED)', 'Description'],
        ...quote.claimsHistory
          .filter(claim => claim.claimCount > 0)
          .map(claim => [claim.year, claim.claimCount, `AED ${claim.amount}`, claim.description])
      ] : [])
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
    addText(`Project Address: ${quote.projectAddress}`);
    addText(`Sum Insured Value: ${quote.projectValue}`);
    addText(`Start Date: ${quote.startDate}`);
    addText(`Completion Date: ${quote.completionDate}`);
    addText(`Construction Period: ${quote.constructionPeriod}`);
    addText(`Maintenance Period: ${quote.maintenancePeriod}`);
    yPos += 5;

    // Insured Details
    addText('INSURED DETAILS', 14, true);
    addText(`Role of Insured: ${quote.roleOfInsured}`);
    addText(`Contact Email: ${quote.contactEmail}`);
    addText(`Phone Number: ${quote.phoneNumber}`);
    addText(`VAT Number: ${quote.vatNumber}`);
    addText(`Country of Incorporation: ${quote.countryOfIncorporation}`);
    yPos += 5;

    // Contract Structure
    addText('CONTRACT STRUCTURE', 14, true);
    addText(`Main Contractor: ${quote.mainContractor}`);
    addText(`Principal/Owner: ${quote.principalOwner}`);
    addText(`Contract Type: ${quote.contractType}`);
    addText(`Contract Number: ${quote.contractNumber}`);
    addText(`Engineer/Consultant: ${quote.engineerConsultant}`);
    yPos += 5;

    // Sub-Contractors
    if (quote.subContractors.length > 0) {
      addText('SUB-CONTRACTORS', 14, true);
      quote.subContractors.forEach(sub => {
        addText(`${sub.name} - ${sub.contractType} (${sub.contractNumber})`);
      });
      yPos += 5;
    }

    // Site Risk Assessment
    addText('SITE RISK ASSESSMENT', 14, true);
    addText(`Near Water Body: ${quote.nearWaterBody}`);
    addText(`Flood Prone Zone: ${quote.floodProneZone}`);
    addText(`Within City Center: ${quote.withinCityCenter}`);
    addText(`Area Type: ${quote.cityAreaType}`);
    addText(`Soil Type: ${quote.soilType}`);
    addText(`Existing Structure: ${quote.existingStructure}`);
    addText(`Blasting/Deep Excavation: ${quote.blastingExcavation}`);
    addText(`Site Security: ${quote.siteSecurityArrangements}`);
    yPos += 5;

    // Cover Requirements
    addText('COVER REQUIREMENTS', 14, true);
    addText(`Contract Works: ${quote.sumInsuredMaterial}`);
    addText(`Plant & Equipment: ${quote.sumInsuredPlant}`);
    addText(`Temporary Works: ${quote.sumInsuredTemporary}`);
    addText(`Principal's Existing Property: ${quote.principalExistingProperty}`);
    addText(`TPL Limit: ${quote.tplLimit}`);
    addText(`Cross Liability Cover: ${quote.crossLiabilityCover}`);
    addText(`Removal of Debris Limit: ${quote.removalDebrisLimit}`);
    yPos += 5;

    // Claims History
    addText('CLAIMS HISTORY', 14, true);
    addText(`Losses in Last 5 Years: ${quote.lossesInLastFiveYears}`);
    if (quote.lossesInLastFiveYears === "Yes") {
      quote.claimsHistory
        .filter(claim => claim.claimCount > 0)
        .forEach(claim => {
          addText(`${claim.year}: ${claim.claimCount} claims, AED ${claim.amount} - ${claim.description}`);
        });
    }

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
            <Button onClick={() => navigateBack()}>
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back
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
                onClick={() => navigateBack(`/market-admin/broker/${brokerId}/details`)}
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
              {getStatusBadge(quote.status)}
              <Button variant="outline" onClick={exportToExcel}>
                <Download className="w-4 h-4 mr-2" />
                Download Quote
              </Button>
            </div>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <div className="lg:col-span-2 space-y-6">
            {/* Project Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Project Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Project Name</div>
                  <p className="font-medium">{quote.projectName}</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Project Type</div>
                    <p className="font-medium">{quote.projectType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Type</div>
                    <p className="font-medium">{quote.constructionType}</p>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Project Address</div>
                  <p className="font-medium">{quote.projectAddress}</p>
                </div>
                 <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                   <div>
                     <div className="text-sm font-medium text-muted-foreground">Sum Insured Value</div>
                     <p className="font-medium">{quote.projectValue}</p>
                   </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Start Date</div>
                    <p className="font-medium">{quote.startDate}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Completion Date</div>
                    <p className="font-medium">{quote.completionDate}</p>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Construction Period</div>
                    <p className="font-medium">{quote.constructionPeriod}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Maintenance Period</div>
                    <p className="font-medium">{quote.maintenancePeriod}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Insured Details */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="w-5 h-5" />
                  Insured Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Insured Name</div>
                    <p className="font-medium">{quote.insuredName}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Role of Insured</div>
                    <p className="font-medium">{quote.roleOfInsured}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">VAT Number</div>
                    <p className="font-medium">{quote.vatNumber}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Country of Incorporation</div>
                    <p className="font-medium">{quote.countryOfIncorporation}</p>
                  </div>
                </div>
                
                {/* Contact Information - Only show in broker portal */}
                {window.location.pathname.includes('/broker/') && (
                  <div className="border-t pt-4 mt-4">
                    <h4 className="font-medium text-sm text-muted-foreground mb-3">Contact Information</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Email</div>
                        <p className="font-medium">{quote.contactEmail}</p>
                      </div>
                      <div>
                        <div className="text-sm font-medium text-muted-foreground">Phone</div>
                        <p className="font-medium">{quote.phoneNumber}</p>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Contract Structure */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="w-5 h-5" />
                  Contract Structure
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Main Contractor</div>
                    <p className="font-medium">{quote.mainContractor}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Principal/Owner</div>
                    <p className="font-medium">{quote.principalOwner}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contract Type</div>
                    <p className="font-medium">{quote.contractType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contract Number</div>
                    <p className="font-medium">{quote.contractNumber}</p>
                  </div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Engineer/Consultant</div>
                  <p className="font-medium">{quote.engineerConsultant}</p>
                </div>
                
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Sub-Contractors</div>
                  <div className="space-y-2 mt-2">
                    {quote.subContractors.map((subcontractor, index) => (
                      <div key={index} className="p-3 border border-border rounded-lg bg-muted/30">
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-2 text-sm">
                          <div>
                            <span className="font-medium">Name:</span> {subcontractor.name}
                          </div>
                          <div>
                            <span className="font-medium">Type:</span> {subcontractor.contractType}
                          </div>
                          <div>
                            <span className="font-medium">Contract #:</span> {subcontractor.contractNumber}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Site Risks */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Site Risk Assessment
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Near Water Body</div>
                    <p className="font-medium">{quote.nearWaterBody}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Flood Prone Zone</div>
                    <p className="font-medium">{quote.floodProneZone}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Within City Center</div>
                    <p className="font-medium">{quote.withinCityCenter}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Area Type</div>
                    <p className="font-medium">{quote.cityAreaType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Soil Type</div>
                    <p className="font-medium">{quote.soilType}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Existing Structure</div>
                    <p className="font-medium">{quote.existingStructure}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Blasting/Deep Excavation</div>
                    <p className="font-medium">{quote.blastingExcavation}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Site Security Arrangements</div>
                    <p className="font-medium">{quote.siteSecurityArrangements}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Cover Requirements */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Shield className="w-5 h-5" />
                  Cover Requirements
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Contract Works</div>
                    <p className="font-medium">{quote.sumInsuredMaterial}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Plant & Equipment</div>
                    <p className="font-medium">{quote.sumInsuredPlant}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Temporary Works</div>
                    <p className="font-medium">{quote.sumInsuredTemporary}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Principal's Existing Property</div>
                    <p className="font-medium">{quote.principalExistingProperty}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">TPL Limit</div>
                    <p className="font-medium">{quote.tplLimit}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Cross Liability Cover</div>
                    <p className="font-medium">{quote.crossLiabilityCover}</p>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground">Removal of Debris Limit</div>
                    <p className="font-medium">{quote.removalDebrisLimit}</p>
                  </div>
                </div>

                <Separator />
                
                <div className="space-y-4">
                  <h4 className="font-medium text-sm text-muted-foreground">Clauses, Exclusions, and Warranties</h4>
                  
                  {/* Extensions with Wordings */}
                  {quote.selectedCEWItems.filter(item => item.type === "extension").length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-green-600">Extensions</h5>
                      <Accordion type="multiple" className="w-full">
                        {quote.selectedCEWItems.filter(item => item.type === "extension").map((item) => (
                          <AccordionItem key={item.id} value={item.id.toString()}>
                            <AccordionTrigger className="text-left">
                              <div className="flex justify-between items-center w-full pr-4">
                                <span className="text-sm font-medium">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground">{item.limit}</span>
                                  <Badge variant={item.percentage.startsWith('+') ? 'destructive' : 'secondary'} className="text-xs">
                                    {item.percentage}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2 text-sm text-muted-foreground">
                                {item.wording}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}

                  {/* Conditions with Wordings */}
                  {quote.selectedCEWItems.filter(item => item.type === "condition").length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-orange-600">Exclusions</h5>
                      <Accordion type="multiple" className="w-full">
                        {quote.selectedCEWItems.filter(item => item.type === "condition").map((item) => (
                          <AccordionItem key={item.id} value={item.id.toString()}>
                            <AccordionTrigger className="text-left">
                              <div className="flex justify-between items-center w-full pr-4">
                                <span className="text-sm font-medium">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground">{item.limit}</span>
                                  <Badge variant={item.percentage.startsWith('+') ? 'destructive' : 'secondary'} className="text-xs">
                                    {item.percentage}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2 text-sm text-muted-foreground">
                                {item.wording}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}

                  {/* Warranties with Wordings */}
                  {quote.selectedCEWItems.filter(item => item.type === "warranty").length > 0 && (
                    <div className="space-y-3">
                      <h5 className="text-sm font-medium text-blue-600">Warranties</h5>
                      <Accordion type="multiple" className="w-full">
                        {quote.selectedCEWItems.filter(item => item.type === "warranty").map((item) => (
                          <AccordionItem key={item.id} value={item.id.toString()}>
                            <AccordionTrigger className="text-left">
                              <div className="flex justify-between items-center w-full pr-4">
                                <span className="text-sm font-medium">{item.name}</span>
                                <div className="flex items-center gap-3">
                                  <span className="text-xs text-muted-foreground">{item.limit}</span>
                                  <Badge variant={item.percentage.startsWith('+') ? 'destructive' : 'secondary'} className="text-xs">
                                    {item.percentage}
                                  </Badge>
                                </div>
                              </div>
                            </AccordionTrigger>
                            <AccordionContent>
                              <div className="pt-2 text-sm text-muted-foreground">
                                {item.wording}
                              </div>
                            </AccordionContent>
                          </AccordionItem>
                        ))}
                      </Accordion>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* Claims History */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileCheck className="w-5 h-5" />
                  Claims History
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Losses in Last 5 Years</div>
                  <p className="font-medium">{quote.lossesInLastFiveYears}</p>
                </div>
                {quote.lossesInLastFiveYears === "Yes" && (
                  <div className="space-y-4">
                    <div className="bg-muted/30 p-4 rounded-lg">
                      <h4 className="font-medium text-foreground mb-4">Claims History Matrix (2020-2024)</h4>
                      <div className="overflow-x-auto">
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead className="w-20">Year</TableHead>
                              <TableHead className="w-32">Count of Claims</TableHead>
                              <TableHead className="w-40">Amount of Claims (AED)</TableHead>
                              <TableHead>Description</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {quote.claimsHistory.filter(claim => claim.claimCount > 0).map(claim => (
                              <TableRow key={claim.year}>
                                <TableCell className="font-medium">{claim.year}</TableCell>
                                <TableCell>{claim.claimCount}</TableCell>
                                <TableCell>
                                  AED {parseInt(claim.amount).toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                                </TableCell>
                                <TableCell>
                                  {claim.description}
                                </TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Sidebar */}
          <div className="space-y-6">
            {/* Quote Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Quote Summary</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quote ID:</span>
                  <span className="font-medium">{quote.id}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Submitted:</span>
                  <span className="font-medium">{quote.submittedDate}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Status:</span>
                  {getStatusBadge(quote.status)}
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Quote Expiry:</span>
                  <span className="font-medium text-red-600">{quote.expiryDate}</span>
                </div>
                <Separator />
                <div className="flex justify-between items-center">
                  <span className="text-sm text-muted-foreground">Project Value:</span>
                  <span className="font-medium">{quote.projectValue}</span>
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
                <Button variant="outline" className="w-full">
                  <FileText className="w-4 h-4 mr-2" />
                  View Documents
                </Button>
              </CardContent>
            </Card>

            {/* Communication */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button variant="outline" className="w-full">
                  Send Message
                </Button>
                <Button variant="outline" className="w-full">
                  Schedule Call
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
};

export default MarketAdminBrokerQuoteDetails;