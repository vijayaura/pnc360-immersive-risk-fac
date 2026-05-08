import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { PaymentSection } from "@/features/proposals/components/PaymentSection";

const Payment = () => {
  return (
    <div className="min-h-screen bg-background">
      <Header />
      <PaymentSection />
      <Footer />
    </div>
  );
};

export default Payment;