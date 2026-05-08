import { useState } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { PhoneInput } from "@/components/ui/phone-input";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Plus, Building2, Settings } from "lucide-react";
import { useNavigate } from "react-router-dom";

const createInsurerSchema = z.object({
  name: z.string().min(2, "Name must be at least 2 characters"),
  licenseNumber: z.string().min(1, "License number is required"),
  email: z.string().email("Invalid email address"),
  phone: z.string().regex(/^\d{10}$/, "Phone number must be exactly 10 digits"),
});

type CreateInsurerForm = z.infer<typeof createInsurerSchema>;

interface CreateInsurerDialogProps {
  onInsurerCreated?: (insurer: any) => void;
}

export function CreateInsurerDialog({ onInsurerCreated }: CreateInsurerDialogProps) {
  const [open, setOpen] = useState(false);
  const [showProductConfig, setShowProductConfig] = useState(false);
  const [createdInsurer, setCreatedInsurer] = useState<any>(null);
  const navigate = useNavigate();

  const form = useForm<CreateInsurerForm>({
    resolver: zodResolver(createInsurerSchema),
    defaultValues: {
      name: "",
      licenseNumber: "",
      email: "",
      phone: "",
    },
  });

  const onSubmit = (values: CreateInsurerForm) => {
    // Generate a simple ID from the name
    const id = values.name.toLowerCase().replace(/\s+/g, '-');
    
    const newInsurer = {
      id,
      ...values,
      status: "inactive",
      quotesCount: 0,
      approvedQuotes: 0,
      totalPremium: "AED 0",
    };

    setCreatedInsurer(newInsurer);
    setShowProductConfig(true);
    onInsurerCreated?.(newInsurer);
  };

  const handleConfigureProducts = () => {
    setOpen(false);
    setShowProductConfig(false);
    form.reset();
    navigate(`/insurer/${createdInsurer.id}/product-config`);
  };

  const handleSkipConfiguration = () => {
    setOpen(false);
    setShowProductConfig(false);
    form.reset();
    setCreatedInsurer(null);
  };

  const handleClose = () => {
    setOpen(false);
    setShowProductConfig(false);
    form.reset();
    setCreatedInsurer(null);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="w-4 h-4" />
          Create Insurer
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[500px]">
        {!showProductConfig ? (
          <>
            <DialogHeader>
              <DialogTitle>Create New Insurer</DialogTitle>
              <DialogDescription>
                Add a new insurance partner to your platform.
              </DialogDescription>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Insurer Name</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., Emirates Insurance" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="licenseNumber"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>License Number</FormLabel>
                      <FormControl>
                        <Input placeholder="e.g., EI-2024-001" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="email"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Email</FormLabel>
                      <FormControl>
                        <Input placeholder="contact@insurer.com" type="email" autoComplete="off" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <FormField
                  control={form.control}
                  name="phone"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Phone Number</FormLabel>
                      <FormControl>
                        <PhoneInput placeholder="Enter phone number" {...field} />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                <DialogFooter>
                  <Button type="button" variant="outline" onClick={handleClose}>
                    Cancel
                  </Button>
                  <Button type="submit">Create Insurer</Button>
                </DialogFooter>
              </form>
            </Form>
          </>
        ) : (
          <>
            <DialogHeader>
              <DialogTitle>Insurer Created Successfully!</DialogTitle>
              <DialogDescription>
                {createdInsurer?.name} has been added to your platform.
              </DialogDescription>
            </DialogHeader>
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building2 className="w-5 h-5" />
                  Configure Products
                </CardTitle>
                <CardDescription>
                  Set up the insurance products and pricing for this insurer.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground mb-4">
                  You can configure product settings, pricing rules, and coverage options for {createdInsurer?.name}.
                </p>
                <div className="flex gap-2">
                  <Button onClick={handleConfigureProducts} className="gap-2">
                    <Settings className="w-4 h-4" />
                    Configure Now
                  </Button>
                  <Button variant="outline" onClick={handleSkipConfiguration}>
                    Skip for Now
                  </Button>
                </div>
              </CardContent>
            </Card>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}