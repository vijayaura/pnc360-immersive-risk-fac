import React, { useState, useCallback, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { formatDateDDMMYYYY } from '@/shared/utils/date-format';
import { Button } from '@/components/ui/button';
import { ArrowLeft, Save, FileText, Eye, Loader2 } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import { DocumentPreview } from '../document-builder/components/DocumentPreview';
import { DocumentElementsSidebar } from '../document-builder/components/DocumentElementsSidebar';
import { DocumentSectionEditor } from '../document-builder/components/DocumentSectionEditor';
import { EditElementDialog } from '../document-builder/components/EditElementDialog';
import { getProduct, Product } from '@/features/product-config/api/products';
import {
  getDocumentTemplates,
  saveDocumentTemplates,
  getMacros,
  Macro,
} from '@/features/product-config/document-builder/api/document-configurator';
import { DocumentElement, DocumentTemplate, SectionSelectionType } from '../types';
import { mapBackendTemplate, elementToBlock } from '../utils/documentMapping';
import { macroToRatingParameter } from '../utils/macroMapping';

// Default templates used when backend returns none
const DEFAULT_TEMPLATES: DocumentTemplate[] = [
  {
    id: 'template1',
    type: 'quote',
    name: 'Quote Document',
    description: 'Standard quote document template',
    header: [
      {
        id: 'header-logo',
        type: 'logo',
        content: '',
        style: { width: 200, height: 80, alignment: 'left' },
      },
      {
        id: 'header-company',
        type: 'heading',
        content: 'Insurer One Company',
        isBold: true,
        style: { fontSize: 24, alignment: 'right', width: 400 },
      },
      {
        id: 'header-address',
        type: 'paragraph',
        content: 'P.O. Box 20767, Dubai, UAE\nTel: +971 4 123 4567\nEmail: info@insurerone.com',
        style: { fontSize: 12, alignment: 'right', width: 400 },
      },
    ],
    body: [
      {
        id: 'body-title',
        type: 'heading',
        content: 'QUOTE DOCUMENT',
        isBold: true,
        style: { fontSize: 28, alignment: 'center', width: 600 },
      },
      {
        id: 'body-divider1',
        type: 'divider',
        dividerStyle: 'solid',
        textColor: '#000000',
        style: { width: 600 },
      },
      {
        id: 'body-terms',
        type: 'heading',
        content: 'Terms & Conditions',
        isBold: true,
        style: { fontSize: 18, alignment: 'left', width: 600 },
      },
      {
        id: 'body-terms-text',
        type: 'paragraph',
        content:
          'This quotation is valid for 30 days from the date of issue. The premium is subject to underwriting approval and may be adjusted based on final risk assessment.',
        style: { fontSize: 12, alignment: 'left', width: 600 },
      },
    ],
    footer: [
      {
        id: 'footer-divider',
        type: 'divider',
        dividerStyle: 'solid',
        textColor: '#000000',
        style: { width: 600 },
      },
      {
        id: 'footer-signature',
        type: 'signature',
        content: 'Authorized Signatory',
        style: { width: 300, height: 80 },
      },
      {
        id: 'footer-text',
        type: 'paragraph',
        content: 'This is a computer-generated quote document. Terms and conditions apply.',
        style: { fontSize: 10, alignment: 'center', width: 600 },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template2',
    type: 'policy',
    name: 'Policy Document',
    description: 'Standard policy document template',
    header: [
      {
        id: 'policy-header-logo',
        type: 'logo',
        content: '',
        style: { width: 200, height: 80, alignment: 'left' },
      },
      {
        id: 'policy-header-company',
        type: 'heading',
        content: 'Insurer One Company',
        isBold: true,
        style: { fontSize: 24, alignment: 'right', width: 400 },
      },
      {
        id: 'policy-header-address',
        type: 'paragraph',
        content: 'P.O. Box 20767, Dubai, UAE\nTel: +971 4 123 4567\nEmail: info@insurerone.com',
        style: { fontSize: 12, alignment: 'right', width: 400 },
      },
    ],
    body: [
      {
        id: 'policy-body-title',
        type: 'heading',
        content: 'POLICY DOCUMENT',
        isBold: true,
        style: { fontSize: 28, alignment: 'center', width: 600 },
      },
      {
        id: 'policy-body-divider1',
        type: 'divider',
        dividerStyle: 'solid',
        textColor: '#000000',
        style: { width: 600 },
      },
      {
        id: 'policy-terms',
        type: 'heading',
        content: 'Terms & Conditions',
        isBold: true,
        style: { fontSize: 18, alignment: 'left', width: 600 },
      },
      {
        id: 'policy-terms-text',
        type: 'paragraph',
        content:
          'This policy is subject to terms and conditions as stated herein. Please refer to the policy wording for full details of coverage, exclusions, and conditions.',
        style: { fontSize: 12, alignment: 'left', width: 600 },
      },
    ],
    footer: [
      {
        id: 'policy-footer-divider',
        type: 'divider',
        dividerStyle: 'solid',
        textColor: '#000000',
        style: { width: 600 },
      },
      {
        id: 'policy-footer-signature',
        type: 'signature',
        content: 'Authorized Signatory',
        style: { width: 300, height: 80 },
      },
      {
        id: 'policy-footer-text',
        type: 'paragraph',
        content: 'This policy is subject to terms and conditions as stated herein.',
        style: { fontSize: 10, alignment: 'center', width: 600 },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
  {
    id: 'template3',
    type: 'endorsement',
    name: 'Endorsement Document',
    description: 'Endorsement wording',
    header: [
      {
        id: 'endorsement-header-logo',
        type: 'logo',
        content: '',
        style: { width: 200, height: 80, alignment: 'left' },
      },
      {
        id: 'endorsement-header-company',
        type: 'heading',
        content: 'Insurer One Company',
        isBold: true,
        style: { fontSize: 24, alignment: 'right', width: 400 },
      },
      {
        id: 'endorsement-header-address',
        type: 'paragraph',
        content: 'P.O. Box 20767, Dubai, UAE\nTel: +971 4 123 4567\nEmail: info@insurerone.com',
        style: { fontSize: 12, alignment: 'right', width: 400 },
      },
    ],
    body: [
      {
        id: 'endorsement-body-title',
        type: 'heading',
        content: 'Endorsement Letter',
        isBold: true,
        style: { fontSize: 28, alignment: 'center', width: 600 },
      },
      {
        id: 'endorsement-body-divider1',
        type: 'divider',
        dividerStyle: 'solid',
        textColor: '#000000',
        style: { width: 600 },
      },
      {
        id: 'endorsement-body-declaration',
        type: 'paragraph',
        content:
          'It is hereby declared and agreed that with effect from ________, the above policy is amended as follows:',
        style: { fontSize: 12, alignment: 'left', width: 600 },
      },
      {
        id: 'endorsement-terms',
        type: 'heading',
        content: 'Terms & Conditions',
        isBold: true,
        style: { fontSize: 18, alignment: 'left', width: 600 },
      },
      {
        id: 'endorsement-terms-text',
        type: 'paragraph',
        content:
          'This policy is subject to terms and conditions as stated herein. Please refer to the policy wording for full details of coverage, exclusions, and conditions.',
        style: { fontSize: 12, alignment: 'left', width: 600 },
      },
    ],
    footer: [
      {
        id: 'endorsement-footer-divider',
        type: 'divider',
        dividerStyle: 'solid',
        textColor: '#000000',
        style: { width: 600 },
      },
      {
        id: 'endorsement-footer-signature',
        type: 'signature',
        content: 'Authorized Signatory',
        style: { width: 300, height: 80 },
      },
      {
        id: 'endorsement-footer-text',
        type: 'paragraph',
        content: 'This policy is subject to terms and conditions as stated herein.',
        style: { fontSize: 10, alignment: 'center', width: 600 },
      },
    ],
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];

const DocumentConfigurator = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  const productId = searchParams.get('productId');
  const [product, setProduct] = useState<Product | null>(null);
  const [macros, setMacros] = useState<Macro[]>([]);
  const [templates, setTemplates] = useState<DocumentTemplate[]>(DEFAULT_TEMPLATES);
  const [selectedTemplate, setSelectedTemplate] = useState<DocumentTemplate | null>(null);
  const [selectedSection, setSelectedSection] = useState<'preview' | 'header' | 'body' | 'footer'>(
    'preview',
  );
  const [isElementDialogOpen, setIsElementDialogOpen] = useState(false);
  const [editingElement, setEditingElement] = useState<DocumentElement | null>(null);
  const [isSavingTemplates, setIsSavingTemplates] = useState(false);
  const [resizingElementId, setResizingElementId] = useState<string | null>(null);
  const [resizeStartX, setResizeStartX] = useState(0);
  const [resizeStartWidth, setResizeStartWidth] = useState(0);
  const [resizeSide, setResizeSide] = useState<'left' | 'right' | null>(null);

  // Derived from macros for any component that needs RatingParameter[]
  const ratingParameters = React.useMemo(() => macros.map(macroToRatingParameter), [macros]);

  // Fetch product details and macros
  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const [prod, macroList] = await Promise.all([getProduct(productId), getMacros(productId)]);
        setProduct(prod);
        setMacros(macroList || []);
      } catch (err) {
        toast({
          title: 'Error',
          description: 'Failed to load product or macros',
          variant: 'destructive',
        });
      }
    })();
  }, [productId, toast]);

  // Fetch templates after macros are ready
  useEffect(() => {
    if (!productId) return;
    (async () => {
      try {
        const backendTemplates = await getDocumentTemplates(productId);
        if (!backendTemplates?.length) {
          setSelectedTemplate((prev) => prev ?? templates[0]);
          return;
        }
        const mapped = backendTemplates.map(mapBackendTemplate);
        const hasPolicy = mapped.some((t) => t.type === 'policy');
        const hasEndorsement = mapped.some((t) => t.type === 'endorsement');
        if (!hasPolicy) mapped.push(DEFAULT_TEMPLATES[1]); // default policy
        if (!hasEndorsement) mapped.push(DEFAULT_TEMPLATES[2]); // default endorsement
        setTemplates(mapped);
        setSelectedTemplate(mapped[0] || null);
      } catch (err) {
        /* keep defaults */
      }
    })();
  }, [productId]);

  // Helpers moved to shared utils (imported above)

  // Handlers
  const handleAddElementDirectly = (element: DocumentElement) => {
    if (!selectedTemplate) return;
    if (selectedSection === 'preview') return;
    const section = selectedTemplate[selectedSection];
    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: [...section, element],
    };
    setSelectedTemplate(updatedTemplate);
    setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    setEditingElement(element);
    setIsElementDialogOpen(true);
  };

  const handleAddElement = (
    type:
      | 'logo'
      | 'text'
      | 'table'
      | 'heading'
      | 'paragraph'
      | 'keyValue'
      | 'divider'
      | 'spacer'
      | 'shape'
      | 'image'
      | 'signature'
      | 'stamp',
  ) => {
    if (!selectedTemplate) {
      toast({
        title: 'No Template Selected',
        description: 'Please select a template first.',
        variant: 'destructive',
      });
      return;
    }
    if (selectedSection === 'preview') {
      toast({
        title: 'Cannot Add Element',
        description: 'Please select Header, Body, or Footer section to add elements.',
        variant: 'destructive',
      });
      return;
    }
    if ((type === 'signature' || type === 'stamp') && selectedSection !== 'footer') {
      toast({
        title: type === 'signature' ? 'Signature Not Allowed Here' : 'Stamp Not Allowed Here',
        description:
          type === 'signature'
            ? 'Signature can only be added to the Footer section.'
            : 'Stamp can only be added to the Footer section.',
        variant: 'destructive',
      });
      return;
    }
    const section = selectedTemplate[selectedSection];
    if (type === 'signature' || type === 'stamp') {
      const exists = selectedTemplate.footer?.some((el) => el.type === type) || false;
      if (exists) {
        toast({
          title: type === 'signature' ? 'Only One Signature Allowed' : 'Only One Stamp Allowed',
          description:
            type === 'signature'
              ? 'There is already a signature in the Footer.'
              : 'There is already a stamp in the Footer.',
          variant: 'destructive',
        });
        return;
      }
    }
    const newElement: DocumentElement = {
      id: `element-${Date.now()}`,
      type,
      content:
        type === 'text'
          ? 'Enter text here'
          : type === 'heading'
            ? 'Heading'
            : type === 'paragraph'
              ? 'Paragraph text'
              : type === 'signature'
                ? 'Signature'
                : type === 'stamp'
                  ? 'Stamp'
                  : '',
      keyText: type === 'keyValue' ? 'Label' : undefined,
      layout: type === 'keyValue' ? 'horizontal' : undefined,
      dividerStyle: type === 'divider' ? 'solid' : undefined,
      shapeType: type === 'shape' ? 'rectangle' : undefined,
      tableData:
        type === 'table'
          ? { headers: ['Column 1', 'Column 2'], rows: [['Row 1', 'Value 1']] }
          : undefined,
      columnSpan: 12,
      style: {
        fontSize:
          type === 'heading' ? 20 : type === 'text' || type === 'paragraph' ? 14 : undefined,
        alignment: 'left',
        height: type === 'shape' ? 100 : type === 'signature' || type === 'stamp' ? 80 : undefined,
      },
    };
    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: [...section, newElement],
    };
    setSelectedTemplate(updatedTemplate);
    setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    setEditingElement(newElement);
    setIsElementDialogOpen(true);
  };

  const handleEditElement = (element: DocumentElement) => {
    setEditingElement(element);
    setIsElementDialogOpen(true);
  };

  const handleSaveElement = () => {
    if (!editingElement || !selectedTemplate) return;
    if (selectedSection === 'preview') return;
    const section = selectedTemplate[selectedSection];
    const elementExists = section.find((el) => el.id === editingElement.id);
    const updatedSection = elementExists
      ? section.map((el) => (el.id === editingElement.id ? editingElement : el))
      : [...section, editingElement];
    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: updatedSection,
    };
    setSelectedTemplate(updatedTemplate);
    setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
    setIsElementDialogOpen(false);
    setEditingElement(null);
    toast({
      title: 'Element Saved',
      description: 'Element has been saved successfully.',
    });
  };

  const handleDeleteElement = (elementId: string) => {
    if (!selectedTemplate) return;
    if (selectedSection === 'preview') return;
    const section = selectedTemplate[selectedSection];
    const updatedSection = section.filter((el) => el.id !== elementId);
    const updatedTemplate = {
      ...selectedTemplate,
      [selectedSection]: updatedSection,
    };
    setSelectedTemplate(updatedTemplate);
    setTemplates((prev) => prev.map((t) => (t.id === updatedTemplate.id ? updatedTemplate : t)));
  };

  // Resize handlers
  const handleResizeStart = (
    e: React.MouseEvent,
    elementId: string,
    currentWidth: number,
    side: 'left' | 'right',
  ) => {
    e.preventDefault();
    e.stopPropagation();
    setResizingElementId(elementId);
    setResizeSide(side);
    setResizeStartX(e.clientX);
    setResizeStartWidth(currentWidth || 300);
  };

  const handleResizeMove = useCallback(
    (e: MouseEvent) => {
      if (
        !resizingElementId ||
        !selectedTemplate ||
        !selectedSection ||
        selectedSection === 'preview' ||
        !resizeSide
      )
        return;
      const deltaX = resizeSide === 'right' ? e.clientX - resizeStartX : resizeStartX - e.clientX;
      const newWidth = Math.max(100, Math.min(800, resizeStartWidth + deltaX));
      setSelectedTemplate((prev) => {
        if (!prev) return prev;
        const section = prev[selectedSection];
        const updatedSection = section.map((el) =>
          el.id === resizingElementId ? { ...el, style: { ...el.style, width: newWidth } } : el,
        );
        return { ...prev, [selectedSection]: updatedSection };
      });
      setTemplates((prev) =>
        prev.map((t) =>
          t.id === selectedTemplate.id
            ? {
                ...t,
                [selectedSection]: t[selectedSection].map((el) =>
                  el.id === resizingElementId
                    ? { ...el, style: { ...el.style, width: newWidth } }
                    : el,
                ),
              }
            : t,
        ),
      );
    },
    [
      resizingElementId,
      resizeStartX,
      resizeStartWidth,
      selectedTemplate,
      selectedSection,
      resizeSide,
    ],
  );

  const handleResizeEnd = useCallback(() => {
    setResizingElementId(null);
    setResizeSide(null);
  }, []);

  useEffect(() => {
    if (!resizingElementId) return;
    document.addEventListener('mousemove', handleResizeMove);
    document.addEventListener('mouseup', handleResizeEnd);
    return () => {
      document.removeEventListener('mousemove', handleResizeMove);
      document.removeEventListener('mouseup', handleResizeEnd);
    };
  }, [resizingElementId, handleResizeMove, handleResizeEnd]);

  // Save templates
  const handleSaveTemplates = async () => {
    if (!productId || isSavingTemplates) return;
    setIsSavingTemplates(true);
    try {
      const payload = templates.map((t) => ({
        type:
          t.type ||
          (t.name.toLowerCase().includes('endorsement')
            ? 'endorsement'
            : t.name.toLowerCase().includes('policy')
              ? 'policy'
              : 'quote'),
        name: t.name,
        description: t.description,
        header: (t.header || []).map(elementToBlock),
        body: (t.body || []).map(elementToBlock),
        footer: (t.footer || []).map(elementToBlock),
      }));
      await saveDocumentTemplates(productId, payload);
      toast({
        title: 'Saved',
        description: 'Document templates have been saved.',
      });
    } catch (err) {
      toast({
        title: 'Error',
        description: 'Failed to save document templates',
        variant: 'destructive',
      });
    } finally {
      setIsSavingTemplates(false);
    }
  };

  // Render
  return (
    <div className="flex flex-col h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-background px-6 py-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="icon" onClick={() => navigate(-1)}>
            <ArrowLeft className="w-5 h-5" />
          </Button>
          <div>
            <h1 className="text-2xl font-bold text-foreground">Document Design</h1>
            <p className="text-sm text-muted-foreground">
              {product?.name || 'Product'} {product?.version ? `v${product.version}` : ''}
            </p>
          </div>
        </div>
        <Button onClick={handleSaveTemplates} disabled={isSavingTemplates} className="gap-2">
          {isSavingTemplates ? (
            <>
              <Loader2 className="h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save className="w-4 h-4" />
              Save Templates
            </>
          )}
        </Button>
      </div>

      <div className="flex-1 overflow-hidden flex">
        {/* Left Sidebar - Templates List */}
        <div className="w-80 border-r bg-primary/5 p-2 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h2 className="text-sm font-semibold">Document Templates</h2>
          </div>
          <div className="space-y-1">
            {templates.map((template) => (
              <div
                key={template.id}
                className={`p-2 border rounded cursor-pointer transition-colors ${
                  selectedTemplate?.id === template.id
                    ? 'border-primary bg-primary/5'
                    : 'hover:bg-primary/5'
                }`}
                onClick={() => setSelectedTemplate(template)}
              >
                <div className="flex items-start justify-between gap-2">
                  <div className="flex-1 min-w-0">
                    <h3 className="text-xs font-medium truncate">{template.name}</h3>
                    {template.description && (
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">
                        {template.description}
                      </p>
                    )}
                    <div className="text-[10px] text-muted-foreground mt-0.5">
                      {formatDateDDMMYYYY(template.updatedAt)}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Main Content */}
        {selectedTemplate ? (
          <div className="flex-1 flex flex-col">
            {/* Section Tabs */}
            <div className="border-b px-6 py-2 flex items-center justify-between">
              <div className="flex gap-2">
                {['preview', 'header', 'body', 'footer'].map((s) => (
                  <Button
                    key={s}
                    variant={selectedSection === s ? 'default' : 'ghost'}
                    size="sm"
                    onClick={() => setSelectedSection(s as SectionSelectionType)}
                  >
                    {s === 'preview' && <Eye className="w-4 h-4 mr-2" />}
                    {s.charAt(0).toUpperCase() + s.slice(1)}
                  </Button>
                ))}
              </div>
            </div>

            {selectedSection === 'preview' && (
              <DocumentPreview template={selectedTemplate} parameters={ratingParameters} />
            )}
            {selectedSection !== 'preview' && (
              <div className="flex-1 flex overflow-hidden">
                <DocumentElementsSidebar
                  onAddElement={handleAddElement}
                  selectedSection={selectedSection}
                />
                <DocumentSectionEditor
                  sectionName={selectedSection}
                  elements={selectedTemplate[selectedSection as 'header' | 'body' | 'footer']}
                  ratingParameters={ratingParameters}
                  onEditElement={handleEditElement}
                  onDeleteElement={handleDeleteElement}
                  onResizeStart={handleResizeStart}
                  onAddElementDirectly={() =>
                    handleAddElementDirectly({
                      id: `element-${Date.now()}`,
                      type: 'paragraph',
                      content: 'Click to edit',
                      style: { fontSize: 14, alignment: 'left' },
                    })
                  }
                />
              </div>
            )}
          </div>
        ) : (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <FileText className="w-16 h-16 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Template Selected</h3>
              <p className="text-muted-foreground mb-4">Select a template from the left sidebar</p>
            </div>
          </div>
        )}
      </div>

      {/* Edit Dialog */}
      <EditElementDialog
        open={isElementDialogOpen}
        onOpenChange={setIsElementDialogOpen}
        element={editingElement}
        onUpdateElement={setEditingElement}
        onSave={handleSaveElement}
        ratingParameters={ratingParameters}
        productId={productId}
        currency={product?.currency || null}
      />
    </div>
  );
};

export default DocumentConfigurator;
