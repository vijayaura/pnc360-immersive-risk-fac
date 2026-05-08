import { Link, useNavigate } from 'react-router-dom';
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Shield, Phone, Mail, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { isDemoMode } from '@/lib/demo-mode';

interface HeaderProps {
  onBackToDashboard?: () => void;
  showBackConfirmation?: boolean;
  title?: string;
  onBack?: () => void;
}

export const Header = ({ onBackToDashboard, showBackConfirmation = false, title }: HeaderProps) => {
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  return (
    <header className="bg-card border-b shadow-soft">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center space-x-3">
            <Button
              variant="ghost"
              size="sm"
              onClick={onBackToDashboard || (() => navigate('/broker/dashboard'))}
              className="mr-2"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              Back to Dashboard
            </Button>
            <h1 className="text-xl font-semibold text-foreground">{title}</h1>
            {/* <Link to="/" className="flex items-center space-x-3">
              <img
                src="/lovable-uploads/bdde1c6a-a5e3-472f-8114-0bc05f7a216d.png"
                alt="AURA Logo"
                className="h-12 w-auto"
              />
            </Link> */}
          </div>

          <div className="flex items-center space-x-4">
            {isDemoMode() && (
              <img src="/riyadh.png" alt="Riyadh Re" className="h-10 w-auto object-contain" />
            )}
            {/* <div className="hidden lg:flex items-center space-x-4 text-sm">
              <div className="flex items-center space-x-2 text-muted-foreground">
                <Mail className="w-4 h-4" />
                <span>contact@riyadhre.com</span>
              </div>
            </div> */}
          </div>
        </div>
      </div>
    </header>
  );
};
