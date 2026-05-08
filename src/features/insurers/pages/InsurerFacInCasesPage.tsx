import FacInCasesTab from '@/features/insurers/components/InsurerDashboard/FacInCasesTab';

export default function InsurerFacInCasesPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-muted/30 to-background p-6 cityscape-bg">
      <div className="mx-auto w-full max-w-none space-y-6 px-2">
        <div>
          <h1 className="text-2xl font-bold text-foreground">Fac-In cases</h1>
          <p className="text-sm text-muted-foreground">
            Facultative inbound placement records — same workspace as reinsurer broker referrals.
          </p>
        </div>
        <FacInCasesTab />
      </div>
    </div>
  );
}
