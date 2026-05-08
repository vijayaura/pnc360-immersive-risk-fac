import { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Form, FormControl, FormField, FormItem, FormMessage } from '@/components/ui/form';

import { Upload, X, Loader2, Save } from 'lucide-react';
import { useToast } from '@/shared/hooks/use-toast';
import {
  Environment,
  updateEnvironment,
  type UpdateEnvironmentRequest,
} from '@/features/super-admin/api/super-admin';

// Preset colors for theme picker
const PRESET_COLORS = [
  '#80a9ea', // Light Blue
  '#10B981', // Green
  '#F59E0B', // Amber
  '#EF4444', // Red
  '#8B5CF6', // Purple
  '#EC4899', // Pink
];

// Validation schema
const editEnvironmentSchema = z.object({
  name: z.string().min(2, 'Name must be at least 2 characters'),
  clientName: z.string().min(2, 'Client name must be at least 2 characters'),
  description: z.string().optional(),
  themeColor: z.string().optional(),
  status: z.enum(['active', 'inactive', 'provisioning', 'failed']).optional(),
});

type EditEnvironmentFormData = z.infer<typeof editEnvironmentSchema>;

interface EditEnvironmentDialogProps {
  environment: Environment | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function EditEnvironmentDialog({
  environment,
  open,
  onOpenChange,
  onSuccess,
}: EditEnvironmentDialogProps) {
  const { toast } = useToast();
  const [logoFile, setLogoFile] = useState<File | null>(null);
  const [logoPreview, setLogoPreview] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isLogoRemoved, setIsLogoRemoved] = useState(false);

  const form = useForm<EditEnvironmentFormData>({
    resolver: zodResolver(editEnvironmentSchema),
    defaultValues: {
      name: '',
      clientName: '',
      description: '',
      themeColor: '#80a9ea',
      status: 'active',
    },
  });

  // Reset form when environment changes
  useEffect(() => {
    if (environment && open) {
      form.reset({
        name: environment.name || '',
        clientName: environment.clientName || '',
        description: environment.description || '',
        themeColor: environment.themeColor || '#80a9ea',
        status: (environment.status as 'active' | 'inactive') || 'active',
      });

      setLogoFile(null);
      setIsLogoRemoved(false);
      if (environment.logoUrl) {
        setLogoPreview(environment.logoUrl);
      } else {
        setLogoPreview(null);
      }
    }
  }, [environment, open, form]);

  const onSubmit = async (data: EditEnvironmentFormData) => {
    if (!environment?.marketId) {
      toast({
        title: 'Error',
        description: 'Market ID is missing',
        variant: 'destructive',
      });
      return;
    }

    try {
      setIsSubmitting(true);

      const requestData: UpdateEnvironmentRequest = {
        name: data.name,
        clientName: data.clientName,
        description: data.description || undefined,
        themeColor: data.themeColor || undefined,
        status: data.status,
      };
      if (logoFile) {
        requestData.logo = logoFile;
      }
      if (!logoFile && isLogoRemoved) {
        requestData.logoUrl = null;
      }

      const response = await updateEnvironment(String(environment.marketId), requestData);

      toast({
        title: 'Environment Updated',
        description: response.message || `"${data.name}" has been updated.`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: unknown) {
      console.error('Failed to update environment:', error);
      const errorMessage =
        (error as { message?: string })?.message ||
        'Failed to update environment. Please try again.';

      toast({
        title: 'Update Failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!environment) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Edit Environment</DialogTitle>
          <DialogDescription>Update settings for "{environment.name}"</DialogDescription>
        </DialogHeader>

        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            {/* Basic Info */}
            <div className="grid gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <Label>Environment Name *</Label>
                    <FormControl>
                      <Input placeholder="e.g., UAE Market" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="clientName"
                render={({ field }) => (
                  <FormItem>
                    <Label>Client Name *</Label>
                    <FormControl>
                      <Input placeholder="e.g., UAE Insurance Authority" {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="description"
                render={({ field }) => (
                  <FormItem>
                    <Label>Description</Label>
                    <FormControl>
                      <Textarea placeholder="Brief description..." rows={2} {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            {/* Branding */}
            <div className="space-y-4 pt-2 border-t">
              <h4 className="font-medium">Branding</h4>

              <FormField
                control={form.control}
                name="themeColor"
                render={({ field }) => (
                  <FormItem>
                    <Label>Theme Color</Label>
                    <div className="flex flex-col gap-2">
                      <div className="flex flex-wrap gap-2">
                        {PRESET_COLORS.map((color) => (
                          <button
                            key={color}
                            type="button"
                            className={`w-8 h-8 rounded-md border-2 transition-all ${
                              field.value === color
                                ? 'border-primary ring-2 ring-primary/30'
                                : 'border-transparent hover:border-muted-foreground/50'
                            }`}
                            style={{ backgroundColor: color }}
                            onClick={() => field.onChange(color)}
                          />
                        ))}
                      </div>
                      <div className="flex items-center gap-2">
                        <FormControl>
                          <Input
                            type="color"
                            value={field.value || '#80a9ea'}
                            onChange={(e) => field.onChange(e.target.value)}
                            className="w-12 h-8 p-1 cursor-pointer"
                          />
                        </FormControl>
                        <Input
                          type="text"
                          placeholder="#80a9ea"
                          value={field.value || ''}
                          onChange={(e) => field.onChange(e.target.value)}
                          className="flex-1"
                        />
                      </div>
                    </div>
                    <FormMessage />
                  </FormItem>
                )}
              />

              {/* Logo Upload */}
              <div className="space-y-2">
                <Label>Logo</Label>
                {!logoPreview ? (
                  <div className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-4 hover:bg-muted/50 transition-colors">
                    <div className="text-center">
                      <Upload className="mx-auto h-8 w-8 text-muted-foreground/50" />
                      <label htmlFor="logo-upload" className="cursor-pointer">
                        <span className="text-sm font-medium text-primary hover:text-primary/80">
                          Click to upload
                        </span>
                        <input
                          id="logo-upload"
                          type="file"
                          className="sr-only"
                          accept="image/jpeg,image/png,image/gif,image/svg+xml,image/webp"
                          onChange={(e) => {
                            const file = e.target.files?.[0];
                            if (!file) return;

                            const allowedTypes = [
                              'image/jpeg',
                              'image/png',
                              'image/gif',
                              'image/svg+xml',
                              'image/webp',
                            ];
                            if (!allowedTypes.includes(file.type)) {
                              toast({
                                title: 'Invalid file type',
                                description: 'Allowed: JPEG, PNG SVG, WebP',
                                variant: 'destructive',
                              });
                              return;
                            }

                            if (file.size > 5 * 1024 * 1024) {
                              toast({
                                title: 'File too large',
                                description: 'Maximum file size is 5MB',
                                variant: 'destructive',
                              });
                              return;
                            }

                            setLogoFile(file);
                            setLogoPreview(URL.createObjectURL(file));
                            setIsLogoRemoved(false);
                          }}
                        />
                      </label>
                      <p className="text-xs text-muted-foreground mt-1">Max 5MB</p>
                    </div>
                  </div>
                ) : (
                  <div className="flex items-center gap-3 p-2 bg-muted rounded-lg border">
                    <div className="w-12 h-12 border rounded overflow-hidden bg-white flex items-center justify-center">
                      <img
                        src={logoPreview}
                        alt="Logo"
                        className="max-w-full max-h-full object-contain"
                      />
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-medium truncate">
                        {logoFile?.name || 'Current logo'}
                      </p>
                      <p className="text-xs text-muted-foreground">
                        {logoFile?.size
                          ? `${(logoFile.size / 1024).toFixed(1)} KB`
                          : 'Click X to remove and upload new'}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setLogoFile(null);
                        setLogoPreview(null);
                        setIsLogoRemoved(true);
                      }}
                    >
                      <X className="w-4 h-4" />
                    </Button>
                  </div>
                )}
              </div>
            </div>

            <DialogFooter className="pt-4">
              <Button
                type="button"
                variant="outline"
                onClick={() => onOpenChange(false)}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={isSubmitting}>
                {isSubmitting ? (
                  <>
                    <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                    Saving...
                  </>
                ) : (
                  <>
                    <Save className="w-4 h-4 mr-2" />
                    Save Changes
                  </>
                )}
              </Button>
            </DialogFooter>
          </form>
        </Form>
      </DialogContent>
    </Dialog>
  );
}
