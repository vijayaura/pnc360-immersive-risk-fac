import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useNavigationHistory } from '@/shared/hooks/use-navigation-history';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Footer } from "@/components/layout/Footer";
import { Plus, Building2, Shield, ArrowLeft, Users, FileText } from "lucide-react";
import { QUOTE_STATUSES } from "@/lib/quote-status";
import { useQuery } from "@tanstack/react-query";
import { getAdminDashboardStatistics } from "@/features/market-admin/api/admin";
import { listBrokersViaManagement } from "@/features/brokers/api/brokers";

import { MyQuotesTab } from "../components/BrokerAdminDashboard/MyQuotesTab";
import { AllBrokerQuotesTab } from "../components/BrokerAdminDashboard/AllBrokerQuotesTab";
import { BrokerManagementTab } from "../components/BrokerAdminDashboard/BrokerManagementTab";

const BrokerAdminDashboard = () => {
  const navigate = useNavigate();
  const { navigateBack } = useNavigationHistory();
  const [activeTab, setActiveTab] = useState("myquotes");

  const { data: statsData } = useQuery({
    queryKey: ['admin-dashboard-stats'],
    queryFn: () => getAdminDashboardStatistics({}),
  });

  const { data: brokersData } = useQuery({
    queryKey: ['admin-all-brokers'],
    queryFn: () => listBrokersViaManagement('default', { limit: 1 }),
  });

  const totalQuotes = statsData?.data?.totalQuotes ?? 0;
  const approvedQuotesCount = statsData?.data?.totalPolicies ?? 0;
  const activeBrokersCount = brokersData?.meta?.total ?? 0;

  return (
    <div className="min-h-screen bg-gradient-to-br from-background to-secondary/20 flex flex-col cityscape-bg">
      <div className="flex-1 p-6">
        <div className="w-full px-4">
          {/* Header */}
          <div className="flex justify-between items-center mb-8">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => navigate("/")}
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Back
              </Button>
              <div>
                <h1 className="text-4xl font-bold text-foreground mb-2">
                  Market Admin Portal
                </h1>
                <p className="text-lg text-muted-foreground">
                  Manage brokers and oversee all contractor insurance operations
                </p>
              </div>
            </div>
            <div className="flex gap-3">
              <Button
                variant="outline"
                size="lg"
                className="gap-2"
                onClick={() => navigate("/market-admin/insurer-management")}
              >
                <Building2 className="w-5 h-5" />
                Manage Insurers
              </Button>
              <Button
                size="lg"
                className="gap-2"
                onClick={() => navigate("/broker/product-selection")}
              >
                <Plus className="w-5 h-5" />
                Create New Quote
              </Button>
            </div>
          </div>

          {/* Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Total Quotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{totalQuotes}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Active Brokers
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{activeBrokersCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Approved Quotes
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-foreground">{approvedQuotesCount}</div>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="pb-2">
                <CardTitle className="text-sm font-medium text-muted-foreground">
                  Operational Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-full bg-green-500 animate-pulse" />
                  <span className="text-xl font-semibold text-foreground">Live</span>
                </div>
              </CardContent>
            </Card>
          </div>

          <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
            <TabsList className="grid w-full max-w-md grid-cols-3 mb-8">
              <TabsTrigger value="myquotes" className="gap-2">
                <Shield className="w-4 h-4" />
                My Quotes
              </TabsTrigger>
              <TabsTrigger value="allquotes" className="gap-2">
                <FileText className="w-4 h-4" />
                All Quotes
              </TabsTrigger>
              <TabsTrigger value="brokers" className="gap-2">
                <Users className="w-4 h-4" />
                Brokers
              </TabsTrigger>
            </TabsList>

            <TabsContent value="myquotes">
              <MyQuotesTab />
            </TabsContent>
            <TabsContent value="allquotes">
              <AllBrokerQuotesTab />
            </TabsContent>
            <TabsContent value="brokers">
              <BrokerManagementTab />
            </TabsContent>
          </Tabs>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default BrokerAdminDashboard;