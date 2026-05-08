import jsPDF from 'jspdf';
import { ProposalBundleResponse } from '@/features/quotes/api/quotes';
import { QuoteFormatResponse } from '@/features/insurers/api/insurers';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';

interface QuoteData {
  id: number;
  planName: string;
  insurerName: string;
  annualPremium: number;
  coverageAmount: number;
  deductible: string;
  /** Numeric deductible amount (used in backward-compat wrapper) */
  deductibleAmount?: number;
  tplDeductibleAmount?: number;
  professionalIndemnityDeductibleAmount?: number;
  basePremium?: number;
  tplAdjustmentAmount?: number;
  cewAdjustmentAmount?: number;
  subtotal?: number;
  brokerCommission?: number;
  totalAnnualPremium?: number;
  rating: number;
  keyCoverage: string[];
  benefits: string[];
  validationResult?: any;
  pricingConfig?: any;
}

interface CEWData {
  selectedItems: any[];
  mandatoryAdjustments: { percentage: number; fixed: number };
  optionalAdjustments: { percentage: number; fixed: number };
  tplAdjustment: number;
}

interface ProposalData {
  project: any;
  quote: QuoteData;
  cewData?: CEWData;
  premiumSummary: {
    basePremium: number;
    tplAdjustment: number;
    mandatoryAdjustments: number;
    optionalAdjustments: number;
    totalBeforeCommission: number;
    brokerCommission: number;
    totalAnnualPremium: number;
  };
  // Keep a reference to the original API bundle for rich field mapping
  raw?: any;
  // Allow extra passthrough fields from the backward-compat wrapper
  [key: string]: any;
}


// Wrapper function for backward compatibility with ProposalBundleResponse
export const generateQuotePDF = async (proposalBundle: ProposalBundleResponse, quoteFormat?: QuoteFormatResponse): Promise<void> => {
  // Convert ProposalBundleResponse to ProposalData format
  const proposalData: ProposalData = {
    project: {
      project_id: proposalBundle.project.project_id,
      project_name: proposalBundle.project.project_name,
      client_name: proposalBundle.project.client_name,
      address: proposalBundle.project.address,
      region: proposalBundle.project.region,
      country: proposalBundle.project.country
    },
    insured: proposalBundle.insured,
    contract_structure: proposalBundle.contract_structure,
    cover_requirements: proposalBundle.cover_requirements,
    quote: {
      // Required QuoteData fields — filled with defaults for backward compat
      id: 0,
      planName: proposalBundle.plans[0]?.insurer_name || '',
      insurerName: '',
      annualPremium: proposalBundle.plans[0]?.premium_amount || 0,
      deductible: String(proposalBundle.plans[0]?.extensions?.selected_plan?.deductible || ''),
      rating: 0,
      keyCoverage: [],
      benefits: [],
      // Extended optional fields
      coverageAmount: parseFloat(proposalBundle.project.sum_insured),
      deductibleAmount: proposalBundle.plans[0]?.extensions?.selected_plan?.deductible || 0,
      tplDeductibleAmount: 0, // Not available in old format
      professionalIndemnityDeductibleAmount: 0, // Not available in old format
      basePremium: proposalBundle.plans[0]?.extensions?.selected_plan?.base_premium || 0,
      tplAdjustmentAmount: 0, // Not available in old format
      cewAdjustmentAmount: 0, // Not available in old format
      subtotal: proposalBundle.plans[0]?.premium_amount || 0,
      brokerCommission: 0, // Not available in old format
      totalAnnualPremium: proposalBundle.plans[0]?.premium_amount || 0
    },
    cewData: {
      selectedItems: [], // Not available in old format
      mandatoryAdjustments: { percentage: 0, fixed: 0 }, // Not available in old format
      optionalAdjustments: { percentage: 0, fixed: 0 }, // Not available in old format
      tplAdjustment: 0 // Not available in old format
    },
    premiumSummary: {
      basePremium: proposalBundle.plans[0]?.extensions?.selected_plan?.base_premium || 0,
      tplAdjustment: 0,
      mandatoryAdjustments: 0,
      optionalAdjustments: 0,
      totalBeforeCommission: proposalBundle.plans[0]?.premium_amount || 0,
      brokerCommission: 0,
      totalAnnualPremium: proposalBundle.plans[0]?.premium_amount || 0
    },
    raw: proposalBundle
  };
  
  generateInsuranceProposalPDF(proposalData, quoteFormat);
};

export const generateInsuranceProposalPDF = (proposalData: ProposalData, quoteFormat?: QuoteFormatResponse): void => {
  const doc = new jsPDF('p', 'mm', 'a4');
  const pageWidth = doc.internal.pageSize.getWidth();
  const pageHeight = doc.internal.pageSize.getHeight();
  const margin = 15;
  const contentWidth = pageWidth - (margin * 2);
  let yPosition = margin;

  // Helper function to convert hex color to RGB
  const hexToRgb = (hex: string): [number, number, number] => {
    const result = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex);
    return result ? [
      parseInt(result[1], 16),
      parseInt(result[2], 16),
      parseInt(result[3], 16)
    ] : [0, 0, 0];
  };

  let isFirstPage = true; // Track if we're on the first page
  
  // Add header with quote format data
  const addHeader = () => {
    if (!quoteFormat || !isFirstPage) return; // Only add header on first page

    const headerHeight = 35; // increased to avoid clipping
    const headerBgColor = hexToRgb(quoteFormat.header_bg_color || '#004080');
    const headerTextColor = hexToRgb(quoteFormat.header_text_color || '#FFFFFF');

    // Header background
    doc.setFillColor(...headerBgColor);
    doc.rect(0, 0, pageWidth, headerHeight, 'F');

    // Company logo (if available and positioned correctly)
    if (quoteFormat.logo_path && quoteFormat.logo_position === 'RIGHT') {
      // Note: jsPDF doesn't directly support loading images from URLs
      // For now, we'll add a placeholder for the logo
      doc.setTextColor(...headerTextColor);
      doc.setFontSize(8);
      doc.text('[LOGO]', pageWidth - 25, 15);
    }

    // Company name and info
    doc.setTextColor(...headerTextColor);
    doc.setFontSize(12);
    doc.setFont(undefined, 'bold');
    doc.text(quoteFormat.company_name || 'Insurance Company', 15, 10);

    // Company address
    doc.setFontSize(8);
    doc.setFont(undefined, 'normal');
    const addressLines = doc.splitTextToSize(quoteFormat.company_address || '', 80);
    doc.text(addressLines, 15, 16);

    // Contact info
    if (quoteFormat.contact_info) {
      const contactInfo = [
        `Email: ${quoteFormat.contact_info.email || ''}`,
        `Phone: ${quoteFormat.contact_info.phone || ''}`,
        `Website: ${quoteFormat.contact_info.website || ''}`
      ].filter(info => info.length > 6); // Filter out empty entries

      doc.text(contactInfo, 15, 22);
    }

    // push content start further down to prevent clipping
    yPosition = headerHeight + 12;
  };

  // Add footer with quote format data
  const addFooter = (pageNumber: number, totalPages: number) => {
    if (!quoteFormat || !quoteFormat.show_footer) return;

    const footerHeight = 20;
    const footerY = pageHeight - footerHeight;
    const footerBgColor = hexToRgb(quoteFormat.footer_bg_color || '#F2F2F2');
    const footerTextColor = hexToRgb(quoteFormat.footer_text_color || '#333333');

    // Footer background
    doc.setFillColor(...footerBgColor);
    doc.rect(0, footerY, pageWidth, footerHeight, 'F');

    // Footer content
    doc.setTextColor(...footerTextColor);
    doc.setFontSize(7);

    let footerContent = [];

    // General disclaimer
    if (quoteFormat.show_general_disclaimer && quoteFormat.general_disclaimer_text) {
      footerContent.push(quoteFormat.general_disclaimer_text);
    }

    // Regulatory info
    if (quoteFormat.show_regulatory_info && quoteFormat.regulatory_info_text) {
      footerContent.push(quoteFormat.regulatory_info_text);
    }

    // Add footer content
    if (footerContent.length > 0) {
      doc.text(footerContent, 15, footerY + 5);
    }

    // Page number
    doc.text(`Page ${pageNumber} of ${totalPages}`, pageWidth - 25, footerY + 5);
  };

  // Add header to first page
  addHeader();

  // Helper function to check if we need a new page and add one if necessary
  const checkPageBreak = (requiredHeight: number = 20) => {
    if (yPosition + requiredHeight > pageHeight - margin - (quoteFormat?.show_footer ? 25 : 0)) {
      doc.addPage();
      // draw header on new page
      addHeader();
      // ensure content starts below header
      yPosition = margin + (quoteFormat ? 42 : 0);
    }
  };

  // Helper function to add text with word wrapping
  const addText = (text: string, x: number, y: number, maxWidth?: number, fontSize: number = 10, fontStyle: string = 'normal', align: string = 'left') => {
    const lines = doc.splitTextToSize(text, maxWidth || contentWidth);
    doc.setTextColor(0, 0, 0);
    doc.setFontSize(fontSize);
    doc.setFont(undefined, fontStyle);
    doc.text(lines, x, y, { align: align as any });
    return y + (lines.length * (fontSize * 0.35));
  };

  // Helper function to add a line
  const addLine = (y: number, color: number[] = [0, 0, 0]) => {
    doc.setDrawColor(...(color as [number, number, number]));
    doc.line(margin, y, pageWidth - margin, y);
    return y + 2;
  };

  // Helper function to format currency
  const formatCurrency = (amount: number): string => {
    return `AED ${amount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
  };

  // Helper function to create a table with borders
  const createTable = (data: Array<{label: string, value: string, bold?: boolean, boldValues?: string[]}>, startY: number, title?: string) => {
    let currentY = startY;
    
    if (title) {
      // Table title
      doc.setFillColor(240, 240, 240);
      doc.rect(margin, currentY, contentWidth, 10, 'F');
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, currentY, contentWidth, 10);
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(10);
    doc.setFont(undefined, 'bold');
      doc.text(title, margin + 3, currentY + 7);
      currentY += 10;
    }
    
    // Table rows
    data.forEach((item, index) => {
      const baseRowHeight = 8;
      
      // Ensure label and value are strings
      const labelText = String(item.label || '');
      const valueText = String(item.value ?? '');
      
      // Split long text into multiple lines - reduced padding
      const labelLines = doc.splitTextToSize(labelText, contentWidth * 0.3 - 4);
      const valueLines = doc.splitTextToSize(valueText, contentWidth * 0.65 - 4);
      
      // Calculate the height needed for this row - reduced line height and padding
      const maxLines = Math.max(labelLines.length, valueLines.length);
      const actualRowHeight = Math.max(baseRowHeight, maxLines * 3.0 + 1);
      
      // Check for page break before drawing the row
      const footerSpace = quoteFormat?.show_footer ? 25 : 10;
      if (currentY + actualRowHeight > pageHeight - margin - footerSpace) {
        // Add new page
        doc.addPage();
        isFirstPage = false; // Mark that we're no longer on the first page
        // Don't draw header on subsequent pages
        // ensure table resumes from top margin
        currentY = margin;
      }
      
      // Row background
      if (index % 2 === 0) {
        doc.setFillColor(250, 250, 250);
        doc.rect(margin, currentY, contentWidth, actualRowHeight, 'F');
      }
      
      // Row borders
      doc.setDrawColor(0, 0, 0);
      doc.rect(margin, currentY, contentWidth, actualRowHeight);
      doc.line(margin + contentWidth * 0.3, currentY, margin + contentWidth * 0.3, currentY + actualRowHeight);
      
      // Text - reduced padding and better alignment
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(8);
      doc.setFont(undefined, 'normal');
      
      // Calculate starting Y position for text (top-aligned with padding)
      const textStartY = currentY + 3;
      const lineHeight = 3.5; // Increased line height to prevent overlap
      
      // Draw label text - top-aligned, multi-line
      let labelY = textStartY;
      labelLines.forEach((line: string) => {
        doc.text(line, margin + 1, labelY);
        labelY += lineHeight;
      });
      
      // Draw value text (with selective bold formatting for specific values)
      if (item.boldValues && item.boldValues.length > 0) {
        // For selective bold with wrapped text, process line by line
        let valueY = textStartY;
        
        for (let lineIdx = 0; lineIdx < valueLines.length; lineIdx++) {
          const line = valueLines[lineIdx];
          let currentX = margin + contentWidth * 0.3 + 1;
          let remainingText = line;
          
          // Check each bold value in this line
          for (const boldValue of item.boldValues) {
            const boldValueStr = String(boldValue);
            const boldIndex = remainingText.indexOf(boldValueStr);
            if (boldIndex !== -1) {
              // Draw text before bold value in normal font
              if (boldIndex > 0) {
                const beforeText = remainingText.substring(0, boldIndex);
                doc.setFont(undefined, 'normal');
                doc.text(beforeText, currentX, valueY);
                currentX += doc.getTextWidth(beforeText);
              }
              
              // Draw bold value in lighter bold font
              doc.setFont(undefined, 'bold');
              doc.text(boldValueStr, currentX, valueY);
              currentX += doc.getTextWidth(boldValueStr);
              
              // Remove processed text from remaining
              remainingText = remainingText.substring(boldIndex + boldValueStr.length);
            }
          }
          
          // Draw remaining text in normal font
          if (remainingText.length > 0) {
            doc.setFont(undefined, 'normal');
            doc.text(remainingText, currentX, valueY);
          }
          
          valueY += lineHeight; // Move to next line
        }
      } else if (item.bold) {
        // Full bold formatting (legacy) - top-aligned, multi-line
        doc.setFont(undefined, 'bold');
        let valueY = textStartY;
        valueLines.forEach((line: string) => {
          doc.text(line, margin + contentWidth * 0.3 + 1, valueY);
          valueY += lineHeight;
        });
      } else {
        // Normal text - top-aligned, multi-line
        let valueY = textStartY;
        valueLines.forEach((line: string) => {
          doc.text(line, margin + contentWidth * 0.3 + 1, valueY);
          valueY += lineHeight;
        });
      }
      
      // Reset font to normal for next iteration
      doc.setFont(undefined, 'normal');
      
      currentY += actualRowHeight;
    });
    
    return currentY;
  };

  // Main Title - Updated Table Structure (centered)
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(14);
  doc.setFont(undefined, 'bold');
  const title = 'CONTRACTORS ALL RISKS INSURANCE QUOTATION';
  doc.text(title, pageWidth / 2, yPosition, { align: 'center' as any });
  yPosition += 10;

  // Combined Single Table Structure
  const rb = (proposalData.raw || {}) as any;
  const quoteRef = rb?.quote_meta?.quote_reference_number || rb?.quote_meta?.quote_id || '';
  const quoteDate = rb?.quote_meta?.created_at ? formatDateDDMMYYYY(rb.quote_meta.created_at) : formatDateDDMMYYYY(new Date());
  
  const combinedTableData = [
    { 
      label: 'QUOTATION REFERENCE', 
      value: `${quoteRef} dated ${quoteDate}`,
      boldValues: [quoteRef, quoteDate] // Array of values to make bold
    },
    { 
      label: 'Proposer', 
      value: (() => {
        const principalOwner = rb?.contract_structure?.details?.principal_owner || '________________';
        const mainContractor = rb?.contract_structure?.details?.main_contractor || '________________';
        const subContractors = rb?.contract_structure?.sub_contractors || [];
        
        let proposerText = `M/s ${principalOwner} as Principal &/or M/s. ${mainContractor} as Contractor`;
        
        if (subContractors.length > 0) {
          proposerText += '\n\nSub-contractors:';
          subContractors.forEach((sc: any, index: number) => {
            proposerText += `\n${index + 1}. ${sc.name || 'N/A'}`;
          });
        }
        
        proposerText += '\n\nFor their respective rights and interests';
        return proposerText;
      })(),
      boldValues: [rb?.contract_structure?.details?.principal_owner || '', rb?.contract_structure?.details?.main_contractor || '', ...(rb?.contract_structure?.sub_contractors || []).map((sc: any) => sc.name).filter(Boolean)].filter(Boolean)
    },
    { 
      label: 'Scope of Work', 
      value: (() => {
        const formatValue = (val: string) => {
          if (!val) return '';
          return val.replace(/_/g, ' ').replace(/-/g, ' ')
            .split(' ')
            .map(word => word.charAt(0).toUpperCase() + word.slice(1).toLowerCase())
            .join(' ');
        };
        
        const contractType = formatValue(rb?.contract_structure?.details?.contract_type || '');
        const projectType = formatValue(rb?.project?.project_type || '');
        const subProjectType = formatValue(rb?.project?.sub_project_type || '');
        const constructionType = formatValue(rb?.project?.construction_type || '');
        
        const parts = [contractType, projectType, subProjectType, constructionType].filter(Boolean);
        return parts.join(', ') || 'N/A';
      })()
    },
    { label: 'Period of insurance', value: 'Not exceeding 12 Months' },
    { 
      label: 'Maintenance Period', 
      value: (() => {
        const months = rb?.project?.maintenance_period_months || 12;
        return `${months} Month${months !== 1 ? 's' : ''} from the date of handing over the project`;
      })()
    },
    { 
      label: 'Site of erection', 
      value: rb?.project?.address || 'N/A'
    },
    { 
      label: 'Interest covered', 
      value: 'Section I Material Damage\nAny unforeseen and sudden physical loss and/or damage to the insured items as mentioned below from any cause other than those specifically excluded as per Standard Munich Re Wordings\n\nSection II Third Party Liability\nThe Company will indemnify The Participant against such sums which The Participant shall become legally liable to pay as damage consequent upon\n• accidental bodily injury to or illness of third parties (whether fatal or not),\n• accidental loss of or damage to property belonging to third parties\nOccurring in direct connection with the construction or erection of the items Covered under Section 1 and happening on or in the immediate vicinity of the contract site during the period of cover' 
    },
    { 
      label: 'Sum Insured', 
      value: (() => {
        const formatCurrency = (value: string | number) => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return isNaN(num) ? '0' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        
        // Get values from cover_requirements
        const projectValue = formatCurrency(rb?.cover_requirements?.project_value || 0);
        const contractWorks = formatCurrency(rb?.cover_requirements?.contract_works || 0);
        const plantEquipment = formatCurrency(rb?.cover_requirements?.plant_and_equipment || 0);
        const temporaryWorks = formatCurrency(rb?.cover_requirements?.temporary_works || 0);
        const otherMaterials = formatCurrency(rb?.cover_requirements?.other_materials || 0);
        const principalsProperty = formatCurrency(rb?.cover_requirements?.principals_property || 0);
        
        // Calculate total
        const total = formatCurrency(
          (parseFloat(projectValue.replace(/,/g, '')) || 0) + 
          (parseFloat(contractWorks.replace(/,/g, '')) || 0) + 
          (parseFloat(plantEquipment.replace(/,/g, '')) || 0) + 
          (parseFloat(temporaryWorks.replace(/,/g, '')) || 0) + 
          (parseFloat(otherMaterials.replace(/,/g, '')) || 0) + 
          (parseFloat(principalsProperty.replace(/,/g, '')) || 0)
        );
        
        return `AED ${total}\n\nDescription:\nProject Value: ${projectValue}\nContract Works: ${contractWorks}\nPlant & Equipment: ${plantEquipment}\nTemporary Works: ${temporaryWorks}\nOther Materials: ${otherMaterials}\nPrincipal's Property: ${principalsProperty}\n\nSection I`;
      })()
    },
    { 
      label: '', 
      value: (() => {
        const tplLimit = rb?.cover_requirements?.tpl_limit?.label || '--------/-';
        // Check if tplLimit already contains "AED" to avoid duplication
        const limitText = tplLimit.toUpperCase().includes('AED') ? tplLimit : `AED ${tplLimit}`;
        return `Section II\nLimit of liability ${limitText} any one accident or series of accidents arising out of one event and in the aggregate`;
      })()
    },
    { 
      label: 'Deductible', 
      value: (() => {
        const formatCurrency = (value: string | number) => {
          const num = typeof value === 'string' ? parseFloat(value) : value;
          return isNaN(num) ? '0' : num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
        };
        
        const majorPerils = formatCurrency(rb?.cover_requirements?.deductible_major_perils || 5000);
        const otherCause = formatCurrency(rb?.cover_requirements?.deductible_other_cause || 3500);
        const tplProperty = formatCurrency(rb?.cover_requirements?.deductible_tpl_property || 7500);
        const underground = formatCurrency(rb?.cover_requirements?.deductible_underground || 10000);
        
        return `Section I:\nAED ${majorPerils}/- each and every loss in respect of major perils / Act of God perils\nAED ${otherCause}/- each and every loss in respect of loss or damage from any other cause\n\nSection II:\nAED ${tplProperty}/- each and every loss for Third Party Property damage\nUnderground Property / Vibration/Weakening of Support - AED ${underground}/- each and every loss`;
      })()
    },
    { 
      label: 'Premium', 
      value: `AED ${proposalData.premiumSummary.totalAnnualPremium.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/- including policy fees`
    }
  ];

  // Add remaining sections to the combined table
  combinedTableData.push(
    { 
      label: 'Cover', 
      value: (() => {
        // Add selected extensions
        const selectedExtensions = rb?.cover_requirements?.selected_extensions || [];
        
        if (selectedExtensions.length > 0) {
          let coverText = 'As per standard Contractors All Risks - Munich Re wordings';
          selectedExtensions.forEach((ext: any) => {
            const label = ext.label || '';
            const code = ext.code || '';
            coverText += `\n• ${label}${code ? ` (${code})` : ''}`;
          });
          return coverText;
        }
        
        return 'No specific cover extensions applicable';
      })()
    },
    { 
      label: 'Exclusions', 
      value: (() => {
        // Add exclusions from selected_extensions if any
        const selectedExtensions = rb?.cover_requirements?.selected_extensions || [];
        const exclusions = selectedExtensions.filter((ext: any) => ext.type === 'exclusion' || ext.category === 'exclusion');
        
        if (exclusions.length > 0) {
          let exclusionsText = '(only indicative in nature and not exhaustive. Full list of exclusions available in the Policy document)';
          exclusions.forEach((excl: any) => {
            const label = excl.label || '';
            exclusionsText += `\n• ${label}`;
          });
          return exclusionsText;
        }
        
        return 'No specific exclusions applicable';
      })()
    },
    { 
      label: 'Subjectivity', 
      value: (() => {
        // Check if insured had losses in last 5 years
        const hadLosses = rb?.insured?.details?.had_losses_last_5yrs === 1;
        const claims = rb?.insured?.claims || [];
        const hasClaims = hadLosses && claims.length > 0;
        
        if (hasClaims) {
          const totalCount = claims.reduce((sum: number, claim: any) => sum + (claim.count_of_claims || 0), 0);
          const totalAmount = claims.reduce((sum: number, claim: any) => sum + (parseFloat(claim.amount_of_claims) || 0), 0);
          const formattedAmount = totalAmount.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
          
          return `${totalCount} claim${totalCount !== 1 ? 's' : ''} reported with total value of AED ${formattedAmount} at the time of binding the cover`;
        }
        
        return 'No Known or reported claims at the time of binding the cover';
      })()
    },
    { 
      label: 'Validity', 
      value: (() => {
        // Get validity days from quote format, default to 30
        // validity_days is a runtime field not present in the static type; access safely
        const validityDays = (quoteFormat as any)?.validity_days || 30;
        return `${validityDays} days from the Date of Issuance of the Quote`;
      })()
    },
    { 
      label: 'Warranties', 
      value: (() => {
        // Get warranties from selected_extensions if any
        const selectedExtensions = rb?.cover_requirements?.selected_extensions || [];
        const warranties = selectedExtensions.filter((ext: any) => ext.type === 'warranty' || ext.category === 'warranty');
        
        if (warranties.length > 0) {
          let warrantiesText = '';
          warranties.forEach((warranty: any, index: number) => {
            const label = warranty.label || '';
            warrantiesText += `${index > 0 ? '\n' : ''}• ${label}`;
          });
          return warrantiesText;
        }
        
        return 'No specific warranties applicable';
      })()
    }
  );

  yPosition = createTable(combinedTableData, yPosition);

  // Footer for all pages
  const totalPages = doc.getNumberOfPages();
  for (let i = 1; i <= totalPages; i++) {
    doc.setPage(i);
    
    if (quoteFormat?.show_footer) {
      addFooter(i, totalPages);
    } else {
      // Default footer if no quote format
  const footerY = pageHeight - 10;
  doc.setFontSize(6);
  doc.setTextColor(128, 128, 128);
  doc.text('Generated on ' + new Date().toLocaleString(), margin, footerY);
      doc.text('Page ' + i + ' of ' + totalPages, pageWidth - margin - 15, footerY);
    }
  }

  // Save the PDF
  const fileName = `Contractors_All_Risks_Quote_${proposalData.project.project_id || 'CAR'}_${new Date().toISOString().split('T')[0]}.pdf`;
  doc.save(fileName);
};
