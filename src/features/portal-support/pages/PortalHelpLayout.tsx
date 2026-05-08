import { useMemo } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import { Footer } from '@/components/layout/Footer';

export function PortalHelpLayout({
  onBack,
  children,
}: {
  onBack: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex min-h-screen flex-col bg-background">
      <main className="min-h-0 flex-1 overflow-hidden">{children}</main>
      <Footer />
    </div>
  );
}
