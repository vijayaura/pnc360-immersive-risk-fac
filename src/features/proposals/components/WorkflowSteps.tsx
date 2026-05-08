import { FormInput, FileText, CreditCard, Award, CheckCircle } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

const steps = [
  {
    icon: FormInput,
    title: "Enter Information",
    description: "Fill out our comprehensive CAR insurance proposal form with your project details and coverage requirements.",
    color: "text-primary",
    bgColor: "bg-primary-light",
  },
  {
    icon: FileText,
    title: "Get Multiple Quotes",
    description: "Receive competitive quotes from top-rated insurers instantly. Compare coverage options and premiums side by side.",
    color: "text-secondary",
    bgColor: "bg-secondary-light",
  },
  {
    icon: CreditCard,
    title: "Select & Upload Documents",
    description: "Choose your preferred insurer and securely upload required documents through our encrypted portal.",
    color: "text-success",
    bgColor: "bg-success-light",
  },
  {
    icon: Award,
    title: "Complete Payment",
    description: "Make secure payment online with flexible payment options. Your transaction is protected and encrypted.",
    color: "text-warning",
    bgColor: "bg-warning-light",
  },
  {
    icon: CheckCircle,
    title: "Receive Policy",
    description: "Get your policy certificate and complete policy wording documents delivered instantly to your email.",
    color: "text-primary",
    bgColor: "bg-primary-light",
  },
];

export const WorkflowSteps = () => {
  return (
    <section className="py-20 bg-muted/30">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl lg:text-4xl font-bold text-foreground mb-4">
            Simple 5-Step Process
          </h2>
        </div>
        
        <div className="relative">
          {/* Connection Line */}
          <div className="hidden lg:block absolute top-1/2 left-0 right-0 h-0.5 bg-gradient-to-r from-primary via-secondary via-success via-warning to-primary transform -translate-y-1/2 z-0" />
          
          <div className="grid md:grid-cols-2 lg:grid-cols-5 gap-8 relative z-10">
            {steps.map((step, index) => (
              <Card key={index} className="group hover:shadow-large transition-smooth transform hover:scale-105 bg-card border-border">
                <CardContent className="p-6 text-center">
                  <div className={`w-16 h-16 ${step.bgColor} rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-smooth`}>
                    <step.icon className={`w-8 h-8 ${step.color}`} />
                  </div>
                  
                  <div className="mb-2 text-sm font-semibold text-primary">
                    Step {index + 1}
                  </div>
                  
                  <h3 className="text-lg font-bold text-foreground mb-3">
                    {step.title}
                  </h3>
                  
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    {step.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};