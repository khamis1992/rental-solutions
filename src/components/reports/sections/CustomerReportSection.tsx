import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { FileText } from "lucide-react";
import { CustomerAnalytics } from "@/components/reports/CustomerAnalytics";

interface CustomerReportSectionProps {
  selectedReport: string;
  setSelectedReport: (value: string) => void;
  generateReport: () => void;
}

export const CustomerReportSection = ({
  selectedReport,
  setSelectedReport,
  generateReport
}: CustomerReportSectionProps) => {
  return (
    <div className="space-y-8">
      {/* Analytics Summary Cards - Top */}
      <div className="grid gap-6 md:grid-cols-2">
        <CustomerAnalytics />
      </div>

      {/* Reports Selection Card - Middle */}
      <Card className="bg-white shadow-lg">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-xl">
            <FileText className="h-6 w-6" />
            Customer Reports
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-6">
          <Select onValueChange={value => setSelectedReport(value)}>
            <SelectTrigger className="w-full">
              <SelectValue placeholder="Select report type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="customer-rental">Rental History</SelectItem>
              <SelectItem value="customer-payment">Payment History</SelectItem>
              <SelectItem value="customer-violations">Traffic Violations</SelectItem>
            </SelectContent>
          </Select>
          <Button 
            className="w-full bg-primary hover:bg-primary/90" 
            onClick={generateReport}
          >
            Generate Report
          </Button>
        </CardContent>
      </Card>
    </div>
  );
};