import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AccountingOverview } from "@/components/finance/accounting/AccountingOverview";
import { RecentTransactions } from "@/components/finance/RecentTransactions";
import { TaxFilingDashboard } from "@/components/finance/tax/TaxFilingDashboard";
import { TransactionImport } from "@/components/finance/transaction-import/TransactionImport";

const Finance = () => {
  return (
    <DashboardLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold" tabIndex={0}>Finance</h1>

        <Tabs defaultValue="accounting" className="space-y-6">
          <TabsList aria-label="Finance sections">
            <TabsTrigger value="accounting">Accounting</TabsTrigger>
            <TabsTrigger value="tax">Tax Management</TabsTrigger>
            <TabsTrigger value="transactions">Recent Transactions</TabsTrigger>
            <TabsTrigger value="import">Import Transactions</TabsTrigger>
          </TabsList>

          <TabsContent value="accounting" role="tabpanel">
            <AccountingOverview />
          </TabsContent>

          <TabsContent value="tax" role="tabpanel">
            <TaxFilingDashboard />
          </TabsContent>

          <TabsContent value="transactions" role="tabpanel">
            <RecentTransactions />
          </TabsContent>

          <TabsContent value="import" role="tabpanel">
            <TransactionImport />
          </TabsContent>
        </Tabs>
      </div>
    </DashboardLayout>
  );
};

export default Finance;