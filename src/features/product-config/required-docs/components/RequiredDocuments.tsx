import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Table, TableBody, TableHead, TableHeader, TableRow, TableCell } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Eye, FileText, Plus, Upload, X, Edit, Trash2 } from "lucide-react";
import { useToast } from '@/shared/hooks/use-toast';
import { getInsurerCompanyId } from "@/lib/auth";
import { saveProductRequiredDocument, getRequiredDocuments } from '@/features/insurers/api/insurers';

type RequiredDocumentsProps = {
  isLoadingRequiredDocs: boolean;
  requiredDocsError: string | null;
  requiredDocuments: any[];
  setRequiredDocuments: (docs: any[]) => void;
  newDocument: any;
  setNewDocument: (doc: any) => void;
  editingDocument: any;
  setEditingDocument: (doc: any | null) => void;
  setIsLoadingRequiredDocs: (v: boolean) => void;
  setRequiredDocsError: (msg: string | null) => void;
  getNextOrder: (items: any[]) => number;
  toggleDocumentActive: (id: number | string) => void;
  handleTemplateUpload: (e: React.ChangeEvent<HTMLInputElement>, isEdit?: boolean) => void;
  removeTemplate: (isEdit?: boolean) => void;
  handleEditDocument: () => void;
  handleDeleteDocument: (id: number | string) => void;
  product: any;
  setIsWordingUploadDialogOpen: (v: boolean) => void;
};

const RequiredDocuments: React.FC<RequiredDocumentsProps> = (props) => {
  const { toast } = useToast();
  const {
    isLoadingRequiredDocs,
    requiredDocsError,
    requiredDocuments,
    setRequiredDocuments,
    newDocument,
    setNewDocument,
    editingDocument,
    setEditingDocument,
    setIsLoadingRequiredDocs,
    setRequiredDocsError,
    getNextOrder,
    toggleDocumentActive,
    handleTemplateUpload,
    removeTemplate,
    handleEditDocument,
    handleDeleteDocument,
    product,
    setIsWordingUploadDialogOpen,
  } = props;

  return (
    <>
      {/* show shimmer in place of layout */}
      {isLoadingRequiredDocs ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border rounded-md">
              <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <>
          {requiredDocsError && (
            <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
              {requiredDocsError}
            </div>
          )}

          {/* Documents required for policy to be issued */}
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <div>
                  <CardTitle className="flex items-center gap-2">
                    <FileText className="w-5 h-5" />
                    Documents required for policy to be issued
                  </CardTitle>
                  <CardDescription>
                    Manage document types required for policy issuance
                  </CardDescription>
                </div>
                <Dialog>
                  <DialogTrigger asChild>
                    <Button className="gap-2">
                      <Plus className="w-4 h-4" />
                      Add New
                    </Button>
                  </DialogTrigger>
                  <DialogContent className="sm:max-w-[525px]">
                    <DialogHeader>
                      <DialogTitle>Add New Document Type</DialogTitle>
                      <DialogDescription>
                        Create a new document type for policy issuance
                      </DialogDescription>
                    </DialogHeader>
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <Label htmlFor="doc-label">Display Label *</Label>
                        <Input
                          id="doc-label"
                          value={newDocument.label}
                          onChange={(e) => setNewDocument({ ...newDocument, label: e.target.value })}
                          placeholder="e.g., BOQ or Cost Breakdown"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-description">Description</Label>
                        <Input
                          id="doc-description"
                          value={newDocument.description || ""}
                          onChange={(e) => setNewDocument({ ...newDocument, description: e.target.value })}
                          placeholder="e.g., Bill of quantities or detailed cost breakdown"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label htmlFor="doc-template">Template (Optional)</Label>
                        <div className="flex items-center gap-2">
                          <Input
                            id="doc-template"
                            type="file"
                            accept=".pdf,.doc,.docx"
                            onChange={(e) => handleTemplateUpload(e)}
                            className="hidden"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            onClick={() => document.getElementById('doc-template')?.click()}
                            className="w-full"
                          >
                            <Upload className="w-4 h-4 mr-2" />
                            {newDocument.template ? "Change Template" : "Upload Template"}
                          </Button>
                        </div>
                        {newDocument.template && (
                          <div className="flex items-center justify-between bg-muted p-2 rounded">
                            <div className="flex items-center gap-2">
                              <FileText className="w-4 h-4" />
                              <span className="text-sm">{newDocument.template.name}</span>
                              <span className="text-xs text-muted-foreground">({newDocument.template.size})</span>
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => removeTemplate()}
                            >
                              <X className="w-4 h-4" />
                            </Button>
                          </div>
                        )}
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="doc-required"
                          checked={newDocument.required || false}
                          onCheckedChange={(checked) => setNewDocument({ ...newDocument, required: checked })}
                        />
                        <Label htmlFor="doc-required">Required Document</Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <Checkbox
                          id="doc-active"
                          checked={newDocument.active}
                          onCheckedChange={(checked) => setNewDocument({ ...newDocument, active: checked })}
                        />
                        <Label htmlFor="doc-active">Active</Label>
                      </div>
                    </div>
                    <DialogFooter>
                      <Button onClick={async () => {
                        const insurerId = getInsurerCompanyId();
                        if (!product.id) return;
                        try {
                          setIsLoadingRequiredDocs(true);
                          setRequiredDocsError(null);
                          await saveProductRequiredDocument(product.id as string, {
                            display_label: newDocument.label,
                            description: newDocument.description || '',
                            is_required: !!newDocument.required,
                            is_active: !!newDocument.active,
                            template_file: (newDocument.template && (newDocument.template.file as File)) || null,
                          });
                          // Refresh the list using the legacy endpoint if we have the insurer ID
                          if (insurerId) {
                            const resp = await getRequiredDocuments(insurerId, product.id as string);
                            const list = Array.isArray(resp?.documents) ? resp.documents : [];
                            const mapped = list.map(d => ({
                              id: d.id,
                              label: d.display_label,
                              description: d.description || '',
                              required: !!d.is_required,
                              active: (d.status || '').toLowerCase() === 'active',
                              order: d.display_order,
                              template: d.template_file_url ? { name: d.template_file_url.split('/').pop() || 'template.pdf', size: '—', url: d.template_file_url } : null,
                            }));
                            setRequiredDocuments(mapped as any);
                          }
                          toast({ title: 'Document added', description: 'Required document created successfully.' });
                          setIsWordingUploadDialogOpen(false);
                        } catch (err: any) {
                          const status = err?.status as number | undefined;
                          const message = err?.message as string | undefined;
                          if (status === 400) setRequiredDocsError(message || 'Bad request while creating document.');
                          else if (status === 401) setRequiredDocsError('Unauthorized. Please log in again.');
                          else if (status === 403) setRequiredDocsError("You don't have access.");
                          else if (status && status >= 500) setRequiredDocsError('Server error. Please try again later.');
                          else setRequiredDocsError(message || 'Failed to create document.');
                        } finally {
                          setIsLoadingRequiredDocs(false);
                        }
                      }}>
                        Add Document Type
                      </Button>
                    </DialogFooter>
                  </DialogContent>
                </Dialog>
              </div>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Order</TableHead>
                    <TableHead>Display Label</TableHead>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-center">
                      <div className="flex justify-center">Required</div>
                    </TableHead>
                    <TableHead className="text-center">Template</TableHead>
                    <TableHead className="text-center">Status</TableHead>
                    <TableHead className="text-center">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requiredDocuments
                    .sort((a, b) => a.order - b.order)
                    .map((doc) => (
                      <TableRow key={doc.id}>
                        <TableCell className="font-medium">{doc.order}</TableCell>
                        <TableCell>{doc.label}</TableCell>
                        <TableCell className="max-w-xs truncate">{doc.description}</TableCell>
                        <TableCell className="text-center">
                          <div className="flex justify-center">
                            <Badge variant={doc.required ? "default" : "secondary"}>
                              {doc.required ? "Required" : "Optional"}
                            </Badge>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          {doc.template ? (
                            <div className="flex items-center justify-center gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                className="text-primary hover:text-primary hover:bg-primary/10"
                                onClick={() => {
                                  if (doc.template?.url) {
                                    // Open the template URL in a new tab
                                    window.open(doc.template.url, '_blank', 'noopener,noreferrer');
                                  } else {
                                    toast({
                                      title: "Template Preview",
                                      description: `Template: ${doc.template.name} (${doc.template.size})`,
                                    });
                                  }
                                }}
                              >
                                <Eye className="w-4 h-4 mr-1" />
                                Preview
                              </Button>
                              <span className="text-xs text-muted-foreground">{doc.template.name}</span>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground">No template</span>
                          )}
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge
                            variant={doc.active ? "default" : "secondary"}
                            className="cursor-pointer"
                            onClick={() => toggleDocumentActive(doc.id)}
                          >
                            {doc.active ? "Active" : "Inactive"}
                          </Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <div className="flex gap-2 justify-center">
                            <Dialog>
                              <DialogTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => setEditingDocument({ ...doc })}
                                >
                                  <Edit className="w-4 h-4" />
                                </Button>
                              </DialogTrigger>
                              <DialogContent className="sm:max-w-[525px]">
                                <DialogHeader>
                                  <DialogTitle>Edit Document Type</DialogTitle>
                                  <DialogDescription>
                                    Update the document type information
                                  </DialogDescription>
                                </DialogHeader>
                                {editingDocument && (
                                  <div className="space-y-4">
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-doc-label">Display Label *</Label>
                                      <Input
                                        id="edit-doc-label"
                                        value={editingDocument.label}
                                        onChange={(e) => setEditingDocument({ ...editingDocument, label: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-doc-description">Description</Label>
                                      <Input
                                        id="edit-doc-description"
                                        value={editingDocument.description || ""}
                                        onChange={(e) => setEditingDocument({ ...editingDocument, description: e.target.value })}
                                      />
                                    </div>
                                    <div className="space-y-2">
                                      <Label htmlFor="edit-doc-template">Template (Optional)</Label>
                                      <div className="flex items-center gap-2">
                                        <Input
                                          id="edit-doc-template"
                                          type="file"
                                          accept=".pdf,.doc,.docx"
                                          onChange={(e) => handleTemplateUpload(e, true)}
                                          className="hidden"
                                        />
                                        <Button
                                          type="button"
                                          variant="outline"
                                          onClick={() => document.getElementById('edit-doc-template')?.click()}
                                          className="w-full"
                                        >
                                          <Upload className="w-4 h-4 mr-2" />
                                          {editingDocument.template ? "Change Template" : "Upload Template"}
                                        </Button>
                                      </div>
                                      {editingDocument.template && (
                                        <div className="flex items-center justify-between bg-muted p-2 rounded">
                                          <div className="flex items-center gap-2">
                                            <FileText className="w-4 h-4" />
                                            <span className="text-sm">{editingDocument.template.name}</span>
                                            <span className="text-xs text-muted-foreground">({editingDocument.template.size})</span>
                                          </div>
                                          <Button
                                            type="button"
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => removeTemplate(true)}
                                          >
                                            <X className="w-4 h-4" />
                                          </Button>
                                        </div>
                                      )}
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="edit-doc-required"
                                        checked={editingDocument.required || false}
                                        onCheckedChange={(checked) => setEditingDocument({ ...editingDocument, required: checked })}
                                      />
                                      <Label htmlFor="edit-doc-required">Required Document</Label>
                                    </div>
                                    <div className="flex items-center space-x-2">
                                      <Checkbox
                                        id="edit-doc-active"
                                        checked={editingDocument.active}
                                        onCheckedChange={(checked) => setEditingDocument({ ...editingDocument, active: checked })}
                                      />
                                      <Label htmlFor="edit-doc-active">Active</Label>
                                    </div>
                                  </div>
                                )}
                                <DialogFooter>
                                  <Button onClick={handleEditDocument}>
                                    Save Changes
                                  </Button>
                                </DialogFooter>
                              </DialogContent>
                            </Dialog>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => handleDeleteDocument(doc.id)}
                              className="text-red-600 hover:text-red-700"
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </>
  );
};

export default RequiredDocuments;


