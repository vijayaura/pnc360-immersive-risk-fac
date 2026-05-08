import { Link } from "react-router-dom";
import { formatCurrency } from '@/shared/utils/lib-utils';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { 
  CheckCircle, 
  Download, 
  Mail, 
  FileText, 
  Shield, 
  Calendar,
  Phone,
  Clock,
  Award,
  ExternalLink
} from "lucide-react";

export const PolicyDelivery = () => {
  const policyDetails = {
    policyNumber: "CAR-2024-SSL-001234",
    insurer: "SecureShield Insurance",
    effectiveDate: "March 15, 2024",
    expiryDate: "March 15, 2025",
    coverageLimit: formatCurrency(2000000),
    premium: formatCurrency(24850)
  };

  return (
    <section className="py-20 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Success Header */}
        <div className="text-center mb-12">
          <div className="w-20 h-20 bg-success rounded-full flex items-center justify-center mx-auto mb-6 animate-scale-in">
            <CheckCircle className="w-10 h-10 text-success-foreground" />
          </div>
          <h1 className="text-4xl lg:text-5xl font-bold text-foreground mb-4">
            Policy Issued Successfully!
          </h1>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
            Your CAR insurance policy has been issued and is now active. 
            All policy documents have been sent to your email address.
          </p>
        </div>

        {/* Policy Summary Card */}
        <Card className="mb-8 border-success/30 bg-success-light/30 shadow-large">
          <CardHeader>
            <CardTitle className="flex items-center space-x-3">
              <Shield className="w-6 h-6 text-success" />
              <span>Policy Summary</span>
              <Badge className="bg-success text-success-foreground ml-auto">
                Active
              </Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Policy Number</Label>
                <p className="text-lg font-semibold text-foreground">{policyDetails.policyNumber}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Insurer</Label>
                <p className="text-lg font-semibold text-foreground">{policyDetails.insurer}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Coverage Limit</Label>
                <p className="text-lg font-semibold text-foreground">{policyDetails.coverageLimit}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Effective Date</Label>
                <p className="text-lg font-semibold text-foreground">{policyDetails.effectiveDate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Expiry Date</Label>
                <p className="text-lg font-semibold text-foreground">{policyDetails.expiryDate}</p>
              </div>
              <div>
                <Label className="text-sm font-medium text-muted-foreground">Annual Premium</Label>
                <p className="text-lg font-semibold text-foreground">{policyDetails.premium}</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Documents Section */}
        <Card className="mb-8 border-border shadow-medium">
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              <FileText className="w-5 h-5" />
              <span>Policy Documents</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-primary-light rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <p className="font-medium">Policy Certificate</p>
                  <p className="text-sm text-muted-foreground">Primary policy document (PDF, 2.1 MB)</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-secondary-light rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-secondary" />
                </div>
                <div>
                  <p className="font-medium">Policy Wording</p>
                  <p className="text-sm text-muted-foreground">Complete terms & conditions (PDF, 5.8 MB)</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>

            <div className="flex items-center justify-between p-4 border border-border rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-10 h-10 bg-success-light rounded-lg flex items-center justify-center">
                  <FileText className="w-5 h-5 text-success" />
                </div>
                <div>
                  <p className="font-medium">Claims Procedure Guide</p>
                  <p className="text-sm text-muted-foreground">Step-by-step claims process (PDF, 1.2 MB)</p>
                </div>
              </div>
              <Button variant="outline" size="sm">
                <Download className="w-4 h-4 mr-2" />
                Download
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Action Buttons */}
        <div className="text-center space-y-6">
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Button variant="hero" size="lg">
              <Download className="w-5 h-5 mr-2" />
              Download All Documents
            </Button>
            <Button variant="outline" size="lg">
              <Mail className="w-5 h-5 mr-2" />
              Email Documents
            </Button>
            <Button variant="outline" size="lg" asChild>
              <Link to="/">Submit</Link>
            </Button>
          </div>

          <div className="bg-primary-light p-6 rounded-lg max-w-2xl mx-auto">
            <div className="flex items-center justify-center space-x-3 mb-3">
              <Award className="w-6 h-6 text-primary" />
              <h3 className="text-lg font-semibold text-primary">Thank You for Choosing Us!</h3>
            </div>
            <p className="text-primary/80 text-sm">
              Your project is now protected with comprehensive CAR insurance. 
              Our team is here to support you throughout your construction journey.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

// Helper component for labels
const Label = ({ className, children, ...props }: { className?: string; children: React.ReactNode; [key: string]: any }) => (
  <div className={className} {...props}>{children}</div>
);