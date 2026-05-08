import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { DocumentUpload } from "@/features/proposals/components/DocumentUpload";

const Documents = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <DocumentUpload />
      <Footer />
    </div>
  );
};

export default Documents;