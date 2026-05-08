import React from "react";
import { Card, CardHeader, CardTitle, CardDescription, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Eye, Upload, FileText, X } from "lucide-react";
// Dialog imported above
import type { PolicyWording } from '@/features/insurers/api/insurers';

type Props = {
  policyWordingsError: string | null;
  isLoadingPolicyWordings: boolean;
  openUploadDialog: () => void;
  policyWordings: PolicyWording[];
  setPreviewWording: (w: PolicyWording) => void;
  setIsPreviewDialogOpen: (open: boolean) => void;
  openEditDialog: (w: any) => void;
  isWordingUploadDialogOpen: boolean;
  setIsWordingUploadDialogOpen: (open: boolean) => void;
  editingWording: any;
  wordingUploadTitle: string;
  setWordingUploadTitle: (v: string) => void;
  handleFileUpload: (e: React.ChangeEvent<HTMLInputElement>) => void;
  wordingUploadFile: File | null;
  wordingUploadActive: boolean;
  setWordingUploadActive: (v: boolean) => void;
  handleSavePolicyWording: () => Promise<void> | void;
  isUploadingWording: boolean;
  isPreviewDialogOpen: boolean;
  previewWording: PolicyWording | null;
};

export default function WordingConfigurations(props: Props) {
  const {
    policyWordingsError,
    isLoadingPolicyWordings,
    openUploadDialog,
    policyWordings,
    setPreviewWording,
    setIsPreviewDialogOpen,
    openEditDialog,
    isWordingUploadDialogOpen,
    setIsWordingUploadDialogOpen,
    editingWording,
    wordingUploadTitle,
    setWordingUploadTitle,
    handleFileUpload,
    wordingUploadFile,
    wordingUploadActive,
    setWordingUploadActive,
    handleSavePolicyWording,
    isUploadingWording,
    isPreviewDialogOpen,
    previewWording,
  } = props;

  return (
    <>
      {policyWordingsError && (
        <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
          {policyWordingsError}
        </div>
      )}

      {isLoadingPolicyWordings ? (
        <div className="space-y-4">
          {[1, 2].map((i) => (
            <div key={i} className="p-4 border rounded-md">
              <div className="w-56 h-5 bg-gray-200 rounded animate-pulse mb-3" />
              <div className="h-10 bg-gray-200 rounded animate-pulse" />
            </div>
          ))}
        </div>
      ) : (
        <Card>
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Policy Wordings</CardTitle>
                <CardDescription>Manage uploaded policy wording documents</CardDescription>
              </div>
              <div className="flex items-center gap-2">
                <Button onClick={openUploadDialog} className="gap-2">
                  <Upload className="w-4 h-4" />
                  Upload Wording
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Title</TableHead>
                  <TableHead>Upload Date</TableHead>
                  <TableHead>Size</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policyWordings.map((w) => (
                  <TableRow key={w.id}>
                    <TableCell className="font-medium">{w.document_title}</TableCell>
                    <TableCell>{w.upload_date}</TableCell>
                    <TableCell>{w.file_size_kb} KB</TableCell>
                    <TableCell>{Number(w.is_active) === 1 ? 'Active' : 'Inactive'}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex gap-2">
                        {(w as any).document_url && (
                          <Button 
                            variant="outline" 
                            size="sm" 
                            onClick={() => window.open((w as any).document_url, '_blank')}
                          >
                            <Eye className="h-4 w-4 mr-1" />
                            View
                          </Button>
                        )}
                        <Button variant="outline" size="sm" onClick={() => { setPreviewWording(w); setIsPreviewDialogOpen(true); }}>
                          Preview
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => openEditDialog(w)}>
                          Edit
                        </Button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Upload/Edit Wording Dialog */}
      <Dialog open={isWordingUploadDialogOpen} onOpenChange={setIsWordingUploadDialogOpen}>
        <DialogContent className="sm:max-w-[525px]">
          <DialogHeader>
            <DialogTitle>{editingWording ? 'Edit Policy Wording' : 'Upload Policy Wording'}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wording-title">Document Title *</Label>
              <Input
                id="wording-title"
                value={wordingUploadTitle}
                onChange={(e) => setWordingUploadTitle(e.target.value)}
                placeholder="e.g., Policy Wording v2.1"
              />
            </div>
            <div className="flex items-center gap-2">
              <Input id="wording-file" type="file" accept="application/pdf" onChange={handleFileUpload} />
              {wordingUploadFile && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <FileText className="w-4 h-4" />
                  <span>{wordingUploadFile.name}</span>
                  <Button variant="ghost" size="sm" onClick={() => handleFileUpload({ target: { files: null } } as any)}>
                    <X className="w-4 h-4" />
                  </Button>
                </div>
              )}
            </div>
            <div className="flex items-center space-x-2">
              <Checkbox
                id="wording-active"
                checked={!!wordingUploadActive}
                onCheckedChange={(checked) => setWordingUploadActive(!!checked)}
              />
              <Label htmlFor="wording-active">Active</Label>
            </div>
          </div>
          <DialogFooter>
            <Button onClick={handleSavePolicyWording} disabled={!wordingUploadTitle || (!editingWording && !wordingUploadFile)}>
              {isUploadingWording ? (
                <span className="inline-flex items-center gap-2">
                  <span className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></span>
                  Saving…
                </span>
              ) : (
                'Save Wording'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Policy Wording Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="sm:max-w-[500px]">
          <DialogHeader>
            <DialogTitle>Policy Wording Preview</DialogTitle>
          </DialogHeader>
          {previewWording && (
            <div className="space-y-3 text-sm">
              <div className="flex justify-between"><span className="text-muted-foreground">Title</span><span>{previewWording.document_title}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Upload Date</span><span>{previewWording.upload_date}</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Size</span><span>{previewWording.file_size_kb} KB</span></div>
              <div className="flex justify-between"><span className="text-muted-foreground">Status</span><span>{Number(previewWording.is_active) === 1 ? 'Active' : 'Inactive'}</span></div>
              {(previewWording as any).document_url && (
                <div className="pt-2">
                  <Button 
                    variant="default" 
                    size="sm" 
                    className="w-full"
                    onClick={() => window.open((previewWording as any).document_url, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-2" />
                    View Document
                  </Button>
                </div>
              )}
              {!(previewWording as any).document_url && (
                <div className="text-xs text-muted-foreground">Note: Document URL not available.</div>
              )}
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsPreviewDialogOpen(false)}>Close</Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}


