import { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import { Header } from "@/components/layout/Header";
import { Footer } from "@/components/layout/Footer";
import { QuotesComparison } from "@/features/quotes/components/QuotesComparison";
import { getProposalBundle, getInsurerPricingConfig } from '@/features/quotes/api/quotes';
import { getBrokerInsurers } from '@/features/brokers/api/brokers';
import { getBrokerCompanyId } from "@/lib/auth";
import { useToast } from '@/shared/hooks/use-toast';

const Quotes = () => {
  const { toast } = useToast();
  const [searchParams] = useSearchParams();
  const [assignedInsurers, setAssignedInsurers] = useState(null);
  const [currentProposal, setCurrentProposal] = useState(null);
  const [isLoadingProposal, setIsLoadingProposal] = useState(false);
  const [insurerPricingConfigs, setInsurerPricingConfigs] = useState({});
  const [isLoadingPricingConfigs, setIsLoadingPricingConfigs] = useState(false);

  // Load assigned insurers
  useEffect(() => {
    const loadAssignedInsurers = async () => {
      try {
        const brokerId = getBrokerCompanyId();
        if (!brokerId) {
          console.error('❌ No broker ID found');
          toast({
            title: "Error",
            description: "No broker ID found. Please log in again.",
            variant: "destructive",
          });
          return;
        }
        
        const data = await getBrokerInsurers(brokerId);
        setAssignedInsurers(data);
        console.log('🏢 Loaded assigned insurers:', data);
      } catch (error) {
        console.error('❌ Error loading assigned insurers:', error);
        toast({
          title: "Error",
          description: "Failed to load assigned insurers",
          variant: "destructive",
        });
      }
    };

    loadAssignedInsurers();
  }, []);

  // Load current proposal from URL params or localStorage
  useEffect(() => {
    const loadCurrentProposal = async () => {
      try {
        // Try to get quote ID from URL params first, then localStorage
        const quoteIdFromUrl = searchParams.get('quoteId');
        const quoteIdFromStorage = localStorage.getItem('currentQuoteId');
        const quoteId = quoteIdFromUrl || quoteIdFromStorage;
        
        if (quoteId) {
          setIsLoadingProposal(true);
          const proposal = await getProposalBundle(parseInt(quoteId));
          setCurrentProposal(proposal);
          console.log('📋 Loaded current proposal:', proposal);
          console.log('📋 Proposal bundle data for validations:', proposal);
        } else {
          console.log('⚠️ No quote ID found in URL params or localStorage');
        }
      } catch (error) {
        console.error('❌ Error loading current proposal:', error);
        toast({
          title: "Error",
          description: "Failed to load current proposal",
          variant: "destructive",
        });
      } finally {
        setIsLoadingProposal(false);
      }
    };

    loadCurrentProposal();
  }, [searchParams]);

  // Load pricing configs for eligible insurers
  const loadPricingConfigs = async (eligibleInsurers: any[]) => {
    try {
      setIsLoadingPricingConfigs(true);
      const configs: any = {};
      
      for (const insurer of eligibleInsurers) {
        try {
          const config = await getInsurerPricingConfig(insurer.insurer_id, 1); // Product ID 1
          configs[insurer.insurer_id] = config;
          console.log(`💰 Loaded pricing config for insurer ${insurer.insurer_id}:`, config);
          console.log(`💰 Pricing config includes subcontractor data:`, config?.contractor_risk_factors?.subcontractor_number_based);
        } catch (error) {
          console.error(`❌ Error loading pricing config for insurer ${insurer.insurer_id}:`, error);
        }
      }
      
      setInsurerPricingConfigs(configs);
      console.log('✅ All pricing configs loaded:', configs);
    } catch (error) {
      console.error('❌ Error loading pricing configs:', error);
      toast({
        title: "Error",
        description: "Failed to load pricing configurations",
        variant: "destructive",
      });
    } finally {
      setIsLoadingPricingConfigs(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header />
      <QuotesComparison 
        assignedInsurers={assignedInsurers}
        currentProposal={currentProposal}
        isLoadingProposal={isLoadingProposal}
        insurerPricingConfigs={insurerPricingConfigs}
        isLoadingPricingConfigs={isLoadingPricingConfigs}
        onLoadPricingConfigs={loadPricingConfigs}
        productId={1}
      />
      <Footer />
    </div>
  );
};

export default Quotes;
