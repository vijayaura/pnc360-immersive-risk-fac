import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Checkbox } from '@/components/ui/checkbox';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Image, Upload, X } from 'lucide-react';

type QuoteConfig = {
  header: {
    companyName: string;
    companyAddress: string;
    contactInfo: string;
    headerColor: string;
    headerTextColor: string;
    logoPosition: string;
  };
  details: {
    quotePrefix: string;
  };
  signature: {
    showSignatureBlock: boolean;
    authorizedSignatory: string;
    signatoryTitle: string;
    signatureText: string;
  };
  stamp: {
    showStampBlock: boolean;
    stampLabel: string;
  };
  footer: {
    showFooter: boolean;
    showDisclaimer: boolean;
    showRegulatoryInfo: boolean;
    generalDisclaimer: string;
    regulatoryText: string;
    footerBgColor: string;
    footerTextColor: string;
  };
};

type QuoteFormatTabProps = {
  quoteFormatError?: string | null;
  isLoadingQuoteFormat: boolean;
  templates?: Array<{ id: string; name: string }>;
  quoteConfig: QuoteConfig;
  updateQuoteConfig: (section: string, field: string, value: unknown) => void;
  uploadedLogoUrl?: string | null;
  setQuoteLogoFile: (file: File | null) => void;
  quoteLogoFile: File | null;
  setSignatureFile: (file: File | null) => void;
  signatureFile: File | null;
  uploadedSignatureUrl?: string | null;
  setStampFile: (file: File | null) => void;
  stampFile: File | null;
  uploadedStampUrl?: string | null;
  setUploadedLogoUrl?: (url: string | null) => void;
  setUploadedSignatureUrl?: (url: string | null) => void;
  setUploadedStampUrl?: (url: string | null) => void;
};

export default function QuoteFormatTab({
  quoteFormatError,
  isLoadingQuoteFormat,
  templates,
  quoteConfig,
  updateQuoteConfig,
  uploadedLogoUrl,
  setQuoteLogoFile,
  quoteLogoFile,
  setSignatureFile,
  signatureFile,
  uploadedSignatureUrl,
  setStampFile,
  stampFile,
  uploadedStampUrl,
  setUploadedLogoUrl,
  setUploadedSignatureUrl,
  setUploadedStampUrl,
}: QuoteFormatTabProps) {
  const getFileName = (url: string | null | undefined, file: File | null) => {
    if (file) return file.name;
    if (!url) return '';
    try {
      const decoded = decodeURIComponent(url);
      const name = decoded.split('/').pop() || 'Uploaded image';
      // If it looks like a long UUID-prefixed file, we could truncate, but split/pop is usually enough
      return name;
    } catch {
      return url.split('/').pop() || 'Uploaded image';
    }
  };

  return (
    <div className="space-y-4">
      {quoteFormatError && (
        <div className="text-sm rounded-md border border-destructive/20 bg-destructive/10 text-destructive px-3 py-2">
          {quoteFormatError}
        </div>
      )}
      {isLoadingQuoteFormat && (
        <div className="space-y-4">
          <div className="p-3 border rounded-md space-y-3">
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
              <div className="h-8 bg-gray-200 rounded animate-pulse" />
            </div>
          </div>
          <div className="p-3 border rounded-md space-y-3">
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-3 border rounded-md space-y-3">
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-24 bg-gray-200 rounded animate-pulse" />
          </div>
          <div className="p-3 border rounded-md space-y-3">
            <div className="w-48 h-4 bg-gray-200 rounded animate-pulse" />
            <div className="h-20 bg-gray-200 rounded animate-pulse" />
          </div>
        </div>
      )}

      {!isLoadingQuoteFormat &&
        ((templates ?? []).length === 0 ? (
          <div className="flex items-center justify-center min-h-[240px]">
            <div className="text-2xl font-semibold text-center">Document not configured</div>
          </div>
        ) : (
          <>
            <Card>
              <CardHeader className="pb-3">
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Image className="w-4 h-4" />
                      Header Configuration
                    </CardTitle>
                    <CardDescription className="text-sm">
                      Configure quote header with logo and company information
                    </CardDescription>
                  </div>
                  <div />
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="company-name" className="text-sm">
                      Company Name
                    </Label>
                    <Input
                      id="company-name"
                      name="company_name"
                      autoComplete="organization"
                      value={quoteConfig.header.companyName}
                      onChange={(e) => updateQuoteConfig('header', 'companyName', e.target.value)}
                      className="h-8"
                    />
                  </div>

                  <div className="space-y-1">
                    <Label htmlFor="logo-upload" className="text-sm">
                      Company Logo
                    </Label>
                    <div className="flex gap-2">
                      <Input
                        id="logo-upload"
                        name="logo"
                        type="file"
                        accept="image/jpeg,image/jpg,image/png,image/webp"
                        onChange={(e) => {
                          const file = e.target.files?.[0] || null;
                          if (file) {
                            setQuoteLogoFile(file);
                          }
                        }}
                        className="hidden"
                        disabled={false}
                      />
                      <Button
                        variant="outline"
                        size="sm"
                        className="h-8 px-2"
                        disabled={false}
                        onClick={() => document.getElementById('logo-upload')?.click()}
                      >
                        <Upload className="w-3 h-3" />
                      </Button>
                      <div className="text-xs text-muted-foreground flex items-center gap-1.5 h-8">
                        {quoteLogoFile || uploadedLogoUrl ? (
                          <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded border border-input max-w-[200px]">
                            <span
                              className="truncate text-xs font-medium text-foreground"
                              title={getFileName(uploadedLogoUrl, quoteLogoFile)}
                            >
                              {getFileName(uploadedLogoUrl, quoteLogoFile)}
                            </span>
                            <button
                              type="button"
                              onClick={() => {
                                setQuoteLogoFile(null);
                                setUploadedLogoUrl?.(null);
                              }}
                              className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <span className="italic">No image selected</span>
                        )}
                      </div>
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="company-address" className="text-sm">
                      Company Address
                    </Label>
                    <Textarea
                      id="company-address"
                      name="company_address"
                      autoComplete="street-address"
                      value={quoteConfig.header.companyAddress}
                      onChange={(e) =>
                        updateQuoteConfig('header', 'companyAddress', e.target.value)
                      }
                      className="min-h-[60px]"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="contact-info" className="text-sm">
                      Contact Information
                    </Label>
                    <Textarea
                      id="contact-info"
                      name="contact_info"
                      autoComplete="on"
                      value={quoteConfig.header.contactInfo}
                      onChange={(e) => updateQuoteConfig('header', 'contactInfo', e.target.value)}
                      className="min-h-[60px]"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="header-color" className="text-sm">
                      Header Background Color
                    </Label>
                    <Input
                      id="header-color"
                      name="header_bg_color"
                      type="color"
                      value={quoteConfig.header.headerColor}
                      onChange={(e) => updateQuoteConfig('header', 'headerColor', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="header-text-color" className="text-sm">
                      Header Text Color
                    </Label>
                    <Input
                      id="header-text-color"
                      name="header_text_color"
                      type="color"
                      value={quoteConfig.header.headerTextColor}
                      onChange={(e) =>
                        updateQuoteConfig('header', 'headerTextColor', e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="logo-position" className="text-sm">
                      Logo Position
                    </Label>
                    <Select
                      name="logo_position"
                      value={quoteConfig.header.logoPosition}
                      onValueChange={(value) => updateQuoteConfig('header', 'logoPosition', value)}
                    >
                      <SelectTrigger id="logo-position" aria-label="Logo Position" className="h-8">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="left">Left</SelectItem>
                        <SelectItem value="center">Center</SelectItem>
                        <SelectItem value="right">Right</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Signature Block Configuration</CardTitle>
                <CardDescription className="text-sm">
                  Configure signature areas and authorization
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="signature-upload" className="text-sm">
                    Signature Image
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="signature-upload"
                      name="signature"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setSignatureFile(file);
                      }}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => document.getElementById('signature-upload')?.click()}
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 h-8">
                      {signatureFile || uploadedSignatureUrl ? (
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded border border-input max-w-[200px]">
                          <span
                            className="truncate text-xs font-medium text-foreground"
                            title={getFileName(uploadedSignatureUrl, signatureFile)}
                          >
                            {getFileName(uploadedSignatureUrl, signatureFile)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setSignatureFile(null);
                              setUploadedSignatureUrl?.(null);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="italic">No image selected</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-signature-block"
                    checked={quoteConfig.signature.showSignatureBlock}
                    onCheckedChange={(checked) =>
                      updateQuoteConfig('signature', 'showSignatureBlock', checked)
                    }
                  />
                  <Label htmlFor="show-signature-block" className="text-sm">
                    Show Signature Block
                  </Label>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="authorized-signatory" className="text-sm">
                      Authorized Signatory Name
                    </Label>
                    <Input
                      id="authorized-signatory"
                      value={quoteConfig.signature.authorizedSignatory}
                      onChange={(e) =>
                        updateQuoteConfig('signature', 'authorizedSignatory', e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="signatory-title" className="text-sm">
                      Signatory Title
                    </Label>
                    <Input
                      id="signatory-title"
                      value={quoteConfig.signature.signatoryTitle}
                      onChange={(e) =>
                        updateQuoteConfig('signature', 'signatoryTitle', e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Stamp Block Configuration</CardTitle>
                <CardDescription className="text-sm">
                  Configure company stamp visibility and label
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="space-y-1">
                  <Label htmlFor="stamp-upload" className="text-sm">
                    Stamp Image
                  </Label>
                  <div className="flex gap-2">
                    <Input
                      id="stamp-upload"
                      name="stamp"
                      type="file"
                      accept="image/jpeg,image/jpg,image/png,image/webp"
                      onChange={(e) => {
                        const file = e.target.files?.[0] || null;
                        setStampFile(file);
                      }}
                      className="hidden"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="h-8 px-2"
                      onClick={() => document.getElementById('stamp-upload')?.click()}
                    >
                      <Upload className="w-3 h-3" />
                    </Button>
                    <div className="text-xs text-muted-foreground flex items-center gap-1.5 h-8">
                      {stampFile || uploadedStampUrl ? (
                        <div className="flex items-center gap-1.5 bg-muted/50 px-2 py-0.5 rounded border border-input max-w-[200px]">
                          <span
                            className="truncate text-xs font-medium text-foreground"
                            title={getFileName(uploadedStampUrl, stampFile)}
                          >
                            {getFileName(uploadedStampUrl, stampFile)}
                          </span>
                          <button
                            type="button"
                            onClick={() => {
                              setStampFile(null);
                              setUploadedStampUrl?.(null);
                            }}
                            className="text-muted-foreground hover:text-destructive transition-colors shrink-0"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ) : (
                        <span className="italic">No image selected</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  <Checkbox
                    id="show-stamp-block"
                    checked={quoteConfig.stamp.showStampBlock}
                    onCheckedChange={(checked) =>
                      updateQuoteConfig('stamp', 'showStampBlock', checked)
                    }
                  />
                  <Label htmlFor="show-stamp-block" className="text-sm">
                    Show Stamp Block
                  </Label>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="stamp-label" className="text-sm">
                    Stamp Label
                  </Label>
                  <Input
                    id="stamp-label"
                    value={quoteConfig.stamp.stampLabel}
                    onChange={(e) => updateQuoteConfig('stamp', 'stampLabel', e.target.value)}
                    className="h-8"
                  />
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Footer & Disclaimers Configuration</CardTitle>
                <CardDescription className="text-sm">
                  Configure footer information and legal disclaimers
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-footer"
                      checked={quoteConfig.footer.showFooter}
                      onCheckedChange={(checked) =>
                        updateQuoteConfig('footer', 'showFooter', checked)
                      }
                    />
                    <Label htmlFor="show-footer" className="text-sm">
                      Show Footer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-disclaimer"
                      checked={quoteConfig.footer.showDisclaimer}
                      onCheckedChange={(checked) =>
                        updateQuoteConfig('footer', 'showDisclaimer', checked)
                      }
                    />
                    <Label htmlFor="show-disclaimer" className="text-sm">
                      Show General Disclaimer
                    </Label>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="show-regulatory-info"
                      checked={quoteConfig.footer.showRegulatoryInfo}
                      onCheckedChange={(checked) =>
                        updateQuoteConfig('footer', 'showRegulatoryInfo', checked)
                      }
                    />
                    <Label htmlFor="show-regulatory-info" className="text-sm">
                      Show Regulatory Information
                    </Label>
                  </div>
                </div>
                <div className="space-y-1">
                  <Label htmlFor="general-disclaimer" className="text-sm">
                    General Disclaimer Text
                  </Label>
                  <Textarea
                    id="general-disclaimer"
                    value={quoteConfig.footer.generalDisclaimer}
                    onChange={(e) =>
                      updateQuoteConfig('footer', 'generalDisclaimer', e.target.value)
                    }
                    className="min-h-[60px]"
                  />
                </div>
                <div className="space-y-1">
                  <Label htmlFor="regulatory-text" className="text-sm">
                    Regulatory Information
                  </Label>
                  <Textarea
                    id="regulatory-text"
                    value={quoteConfig.footer.regulatoryText}
                    onChange={(e) => updateQuoteConfig('footer', 'regulatoryText', e.target.value)}
                    className="min-h-[60px]"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <Label htmlFor="footer-bg-color" className="text-sm">
                      Footer Background Color
                    </Label>
                    <Input
                      id="footer-bg-color"
                      type="color"
                      value={quoteConfig.footer.footerBgColor}
                      onChange={(e) => updateQuoteConfig('footer', 'footerBgColor', e.target.value)}
                      className="h-8"
                    />
                  </div>
                  <div className="space-y-1">
                    <Label htmlFor="footer-text-color" className="text-sm">
                      Footer Text Color
                    </Label>
                    <Input
                      id="footer-text-color"
                      type="color"
                      value={quoteConfig.footer.footerTextColor}
                      onChange={(e) =>
                        updateQuoteConfig('footer', 'footerTextColor', e.target.value)
                      }
                      className="h-8"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </>
        ))}
    </div>
  );
}
