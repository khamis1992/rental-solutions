import { useQuery } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Shield, AlertCircle, TrendingUp, TrendingDown } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

interface RiskMetrics {
  model: string;
  make: string;
  year: number;
  current_avg_rent: number;
  default_rate: number;
  payment_reliability_score: number;
  price_elasticity_score: number;
  risk_adjusted_markup: number;
  risk_adjusted_price: number;
}

export const RiskAssessmentTab = () => {
  const { data: riskMetrics, isLoading } = useQuery({
    queryKey: ["risk-metrics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('risk_adjusted_pricing_view')
        .select('*')
        .order('default_rate', { ascending: false });
      
      if (error) throw error;
      return data as RiskMetrics[];
    }
  });

  if (isLoading) {
    return <div>Loading risk metrics...</div>;
  }

  const highRiskModels = riskMetrics?.filter(m => m.default_rate > 15) || [];

  return (
    <div className="space-y-6">
      {highRiskModels.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>High Risk Alert</AlertTitle>
          <AlertDescription>
            {highRiskModels.length} vehicle models have default rates above 15%
          </AlertDescription>
        </Alert>
      )}

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Shield className="h-5 w-5" />
            Risk Assessment Metrics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Vehicle Model</TableHead>
                <TableHead>Default Rate</TableHead>
                <TableHead>Payment Reliability</TableHead>
                <TableHead>Price Elasticity</TableHead>
                <TableHead>Risk-Adjusted Price (QAR)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {riskMetrics?.map((metric) => (
                <TableRow key={`${metric.make}-${metric.model}-${metric.year}`}>
                  <TableCell className="font-medium">
                    {metric.make} {metric.model} {metric.year}
                  </TableCell>
                  <TableCell className={metric.default_rate > 15 ? 'text-red-500' : 'text-green-500'}>
                    {metric.default_rate.toFixed(1)}%
                  </TableCell>
                  <TableCell className={metric.payment_reliability_score < 70 ? 'text-red-500' : 'text-green-500'}>
                    {metric.payment_reliability_score.toFixed(1)}%
                  </TableCell>
                  <TableCell className="flex items-center gap-2">
                    {metric.price_elasticity_score.toFixed(1)}
                    {metric.price_elasticity_score > 75 ? (
                      <TrendingUp className="h-4 w-4 text-green-500" />
                    ) : (
                      <TrendingDown className="h-4 w-4 text-red-500" />
                    )}
                  </TableCell>
                  <TableCell>
                    {formatCurrency(metric.risk_adjusted_price)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
};