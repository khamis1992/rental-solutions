import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Car, Users, FileSpreadsheet, Code, AlertCircle } from "lucide-react";
import { useState } from "react";
import { FleetReportSection } from "@/components/reports/sections/FleetReportSection";
import { CustomerReportSection } from "@/components/reports/sections/CustomerReportSection";
import { OperationalReportSection } from "@/components/reports/sections/OperationalReportSection";
import { FinancialReportSection } from "@/components/reports/sections/FinancialReportSection";
import { CodeAnalysisDashboard } from "@/components/codeanalysis/CodeAnalysisDashboard";
import { ErrorAnalysisSection } from "@/components/reports/sections/ErrorAnalysisSection";

const Reports = () => {
  const [selectedReport, setSelectedReport] = useState("");

  return (
    <DashboardLayout>
      <div className="max-w-[1200px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-6">
          <h1 className="text-3xl font-bold">Reports & Analytics</h1>
          <p className="text-muted-foreground mt-1">
            Comprehensive insights into your fleet operations and business performance.
          </p>
        </div>

        <Tabs defaultValue="fleet" className="space-y-10">
          <div className="bg-background sticky top-0 z-10 pb-4">
            <TabsList className="bg-muted/50 p-1 rounded-lg flex flex-wrap gap-2">
              <TabsTrigger value="fleet" className="flex items-center gap-2 text-base font-medium">
                <Car className="h-4 w-4" />
                Fleet Reports
              </TabsTrigger>
              <TabsTrigger value="customer" className="flex items-center gap-2 text-base font-medium">
                <Users className="h-4 w-4" />
                Customer Reports
              </TabsTrigger>
              <TabsTrigger value="operational" className="flex items-center gap-2 text-base font-medium">
                <FileSpreadsheet className="h-4 w-4" />
                Operational Reports
              </TabsTrigger>
              <TabsTrigger value="financial" className="flex items-center gap-2 text-base font-medium">
                <FileSpreadsheet className="h-4 w-4" />
                Financial Reports
              </TabsTrigger>
              <TabsTrigger value="code-analysis" className="flex items-center gap-2 text-base font-medium">
                <Code className="h-4 w-4" />
                Code Analysis
              </TabsTrigger>
              <TabsTrigger value="error-analysis" className="flex items-center gap-2 text-base font-medium">
                <AlertCircle className="h-4 w-4" />
                Error Analysis
              </TabsTrigger>
            </TabsList>
          </div>

          <hr className="border-t border-muted-foreground/20" />

          <div className="mt-16">
            <TabsContent value="fleet">
              <FleetReportSection
                selectedReport={selectedReport}
                setSelectedReport={setSelectedReport}
                generateReport={() => {}}
              />
            </TabsContent>

            <TabsContent value="customer">
              <CustomerReportSection
                selectedReport={selectedReport}
                setSelectedReport={setSelectedReport}
                generateReport={() => {}}
              />
            </TabsContent>

            <TabsContent value="operational">
              <OperationalReportSection
                selectedReport={selectedReport}
                setSelectedReport={setSelectedReport}
                generateReport={() => {}}
              />
            </TabsContent>

            <TabsContent value="financial">
              <FinancialReportSection />
            </TabsContent>

            <TabsContent value="code-analysis">
              <CodeAnalysisDashboard />
            </TabsContent>

            <TabsContent value="error-analysis">
              <ErrorAnalysisSection />
            </TabsContent>
          </div>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Reports;