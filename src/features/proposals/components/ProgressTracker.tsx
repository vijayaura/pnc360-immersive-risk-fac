import { useLocation } from "react-router-dom";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle, Circle } from "lucide-react";

const steps = [
  { id: 1, title: "Project Details", path: "/proposal" },
  { id: 2, title: "Compare Quotes", path: "/quotes" },
  { id: 3, title: "Upload Documents", path: "/documents" },
  { id: 4, title: "Payment", path: "/payment" },
  { id: 5, title: "Policy Issued", path: "/success" }
];

export const ProgressTracker = () => {
  const location = useLocation();
  
  const getCurrentStep = () => {
    switch (location.pathname) {
      case "/proposal": return 1;
      case "/quotes": return 2;
      case "/documents": return 3;
      case "/payment": return 4;
      case "/success": return 5;
      default: return 0;
    }
  };

  const currentStep = getCurrentStep();

  if (location.pathname === "/" || location.pathname === "/home") {
    return null;
  }

  return (
    <div className="bg-muted/50 border-b">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <Card className="bg-card border-border">
          <CardContent className="p-4">
            {/* Mobile View */}
            <div className="block sm:hidden">
              <div className="flex items-center justify-between mb-3">
                <span className="text-sm font-medium text-foreground">Step {currentStep} of {steps.length}</span>
                <span className="text-xs text-muted-foreground">{Math.round((currentStep / steps.length) * 100)}% complete</span>
              </div>
              <div className="w-full bg-muted rounded-full h-2 mb-2">
                <div 
                  className="bg-primary h-2 rounded-full transition-all duration-300"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                />
              </div>
              <p className="text-sm font-medium text-primary">
                {steps.find(step => step.id === currentStep)?.title}
              </p>
            </div>

            {/* Desktop View */}
            <div className="hidden sm:flex items-center justify-between">
              {steps.map((step, index) => (
                <div key={step.id} className="flex items-center">
                  <div className="flex items-center space-x-3">
                    <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 transition-smooth ${
                      currentStep >= step.id
                        ? 'bg-primary border-primary text-primary-foreground'
                        : currentStep === step.id - 1
                          ? 'bg-primary-light border-primary text-primary'
                          : 'bg-background border-muted-foreground text-muted-foreground'
                    }`}>
                      {currentStep > step.id ? (
                        <CheckCircle className="w-6 h-6" />
                      ) : (
                        <span className="text-sm font-medium">{step.id}</span>
                      )}
                    </div>
                    <div>
                      <p className={`text-sm font-medium transition-smooth ${
                        currentStep >= step.id ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {step.title}
                      </p>
                    </div>
                  </div>
                  
                  {index < steps.length - 1 && (
                    <div className={`h-0.5 w-16 lg:w-24 mx-4 transition-smooth ${
                      currentStep > step.id ? 'bg-primary' : 'bg-muted-foreground/30'
                    }`} />
                  )}
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};