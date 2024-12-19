import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { CodeQualityMetrics } from "./CodeQualityMetrics";
import { SecurityVulnerabilities } from "./SecurityVulnerabilities";
import { PerformanceInsights } from "./PerformanceInsights";
import { RecommendationsList } from "./RecommendationsList";

export const CodeAnalysisDashboard = () => {
  const [selectedTab, setSelectedTab] = useState("quality");

  const { data: analysisData, isLoading } = useQuery({
    queryKey: ["code-analysis"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("analytics_insights")
        .select("*")
        .eq("category", "code_analysis")
        .order("created_at", { ascending: false });

      if (error) {
        console.error("Error fetching analysis data:", error);
        throw error;
      }

      return data || [];
    }
  });

  if (isLoading) {
    return <div>Loading analysis data...</div>;
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">Code Analysis Dashboard</h1>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Code Quality Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisData?.[0]?.data_points?.quality_score || "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Security Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisData?.[0]?.data_points?.security_score || "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Performance Score</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisData?.[0]?.data_points?.performance_score || "N/A"}
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium">Issues Found</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {analysisData?.[0]?.data_points?.total_issues || "0"}
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="quality" className="w-full" onValueChange={setSelectedTab}>
        <TabsList>
          <TabsTrigger value="quality">Code Quality</TabsTrigger>
          <TabsTrigger value="security">Security</TabsTrigger>
          <TabsTrigger value="performance">Performance</TabsTrigger>
          <TabsTrigger value="recommendations">Recommendations</TabsTrigger>
        </TabsList>

        <TabsContent value="quality">
          <CodeQualityMetrics data={analysisData} />
        </TabsContent>

        <TabsContent value="security">
          <SecurityVulnerabilities data={analysisData} />
        </TabsContent>

        <TabsContent value="performance">
          <PerformanceInsights data={analysisData} />
        </TabsContent>

        <TabsContent value="recommendations">
          <RecommendationsList data={analysisData} />
        </TabsContent>
      </Tabs>
    </div>
  );
};