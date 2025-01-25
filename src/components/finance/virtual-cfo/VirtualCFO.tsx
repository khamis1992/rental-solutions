import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ExpenseAnalysis } from "./ExpenseAnalysis";
import { BudgetingAssistance } from "./BudgetingAssistance";
import { CashFlowMonitoring } from "./CashFlowMonitoring";
import { ScenarioAnalysis } from "./ScenarioAnalysis";
import { FinancialGoals } from "./FinancialGoals";
import { Card, CardContent } from "@/components/ui/card";

export const VirtualCFO = () => {
  return (
    <div className="space-y-6">
      <Card>
        <CardContent className="pt-6">
          <Tabs defaultValue="expense-analysis" className="space-y-4">
            <TabsList className="w-full justify-start bg-background border-b rounded-none p-0 h-auto">
              <div className="flex overflow-x-auto no-scrollbar">
                <TabsTrigger 
                  value="expense-analysis" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Expense Analysis
                </TabsTrigger>
                <TabsTrigger 
                  value="budgeting" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Budgeting
                </TabsTrigger>
                <TabsTrigger 
                  value="cash-flow" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Cash Flow
                </TabsTrigger>
                <TabsTrigger 
                  value="scenarios" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Scenarios
                </TabsTrigger>
                <TabsTrigger 
                  value="goals" 
                  className="flex items-center gap-2 px-4 py-3 data-[state=active]:bg-transparent data-[state=active]:border-b-2 data-[state=active]:border-primary rounded-none"
                >
                  Financial Goals
                </TabsTrigger>
              </div>
            </TabsList>

            <TabsContent value="expense-analysis" className="space-y-4">
              <ExpenseAnalysis />
            </TabsContent>

            <TabsContent value="budgeting" className="space-y-4">
              <BudgetingAssistance />
            </TabsContent>

            <TabsContent value="cash-flow" className="space-y-4">
              <CashFlowMonitoring />
            </TabsContent>

            <TabsContent value="scenarios" className="space-y-4">
              <ScenarioAnalysis />
            </TabsContent>

            <TabsContent value="goals" className="space-y-4">
              <FinancialGoals />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};