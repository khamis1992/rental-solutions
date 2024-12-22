import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { PerformanceInsights } from "@/components/performance/PerformanceInsights";
import { Car, Users, Brain, FileSpreadsheet, Code } from "lucide-react";
import { useState } from "react";
import { FleetReportSection } from "@/components/reports/sections/FleetReportSection";
import { CustomerReportSection } from "@/components/reports/sections/CustomerReportSection";
import { OperationalReportSection } from "@/components/reports/sections/OperationalReportSection";
import { FinancialReportSection } from "@/components/reports/sections/FinancialReportSection";
import { CodeAnalysisDashboard } from "@/components/codeanalysis/CodeAnalysisDashboard";

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState("");

  return (
    <DashboardLayout>
      <div className="mb-6">
        <h1 className="text-3xl font-bold">Reports & Analytics</h1>
        <p className="text-muted-foreground mt-1">
          Comprehensive insights into your fleet operations and business performance.
        </p>
      </div>

      <Tabs defaultValue="fleet" className="space-y-6">
        <TabsList className="bg-muted/50 p-1 rounded-lg flex flex-wrap gap-2">
          <TabsTrigger value="fleet" className="flex items-center gap-2">
            <Car className="h-4 w-4" />
            Fleet Reports
          </TabsTrigger>
          <TabsTrigger value="customer" className="flex items-center gap-2">
            <Users className="h-4 w-4" />
            Customer Reports
          </TabsTrigger>
          <TabsTrigger value="operational" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Operational Reports
          </TabsTrigger>
          <TabsTrigger value="financial" className="flex items-center gap-2">
            <FileSpreadsheet className="h-4 w-4" />
            Financial Reports
          </TabsTrigger>
          <TabsTrigger value="performance" className="flex items-center gap-2">
            <Brain className="h-4 w-4" />
            Performance Insights
          </TabsTrigger>
          <TabsTrigger value="code-analysis" className="flex items-center gap-2">
            <Code className="h-4 w-4" />
            Code Analysis
          </TabsTrigger>
        </TabsList>

        <TabsContent value="fleet">
          <FleetReportSection
            selectedReport={selectedReport}
            setSelectedReport={setSelectedReport}
          />
        </TabsContent>

        <TabsContent value="customer">
          <CustomerReportSection
            selectedReport={selectedReport}
            setSelectedReport={setSelectedReport}
          />
        </TabsContent>

        <TabsContent value="operational">
          <OperationalReportSection
            selectedReport={selectedReport}
            setSelectedReport={setSelectedReport}
          />
        </TabsContent>

        <TabsContent value="financial">
          <FinancialReportSection />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceInsights />
        </TabsContent>

        <TabsContent value="code-analysis">
          <CodeAnalysisDashboard />
        </TabsContent>
      </Tabs>
    </DashboardLayout>
  );
};

export default Reports;