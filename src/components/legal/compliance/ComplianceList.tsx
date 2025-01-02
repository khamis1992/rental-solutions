import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { format } from "date-fns";
import { toast } from "sonner";
import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";

interface ComplianceListProps {
  items: any[];
  isLoading: boolean;
}

export const ComplianceList = ({ items, isLoading }: ComplianceListProps) => {
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const queryClient = useQueryClient();

  const handleStatusUpdate = async (id: string, newStatus: string) => {
    try {
      setUpdatingId(id);
      const { error } = await supabase
        .from('legal_compliance_items')
        .update({
          status: newStatus,
          completed_date: newStatus === 'completed' ? new Date().toISOString() : null
        })
        .eq('id', id);

      if (error) throw error;

      await queryClient.invalidateQueries({ queryKey: ['legal-compliance-items'] });
      toast.success('Compliance item updated successfully');
    } catch (error) {
      console.error('Error updating compliance item:', error);
      toast.error('Failed to update compliance item');
    } finally {
      setUpdatingId(null);
    }
  };

  const getStatusBadge = (status: string, dueDate: string) => {
    const isOverdue = new Date(dueDate) < new Date() && status !== 'completed';
    
    if (status === 'completed') {
      return (
        <Badge className="bg-green-500/10 text-green-500">
          <CheckCircle className="w-4 h-4 mr-1" />
          Completed
        </Badge>
      );
    }
    
    if (isOverdue) {
      return (
        <Badge variant="destructive">
          <AlertTriangle className="w-4 h-4 mr-1" />
          Overdue
        </Badge>
      );
    }
    
    return (
      <Badge variant="secondary">
        <Clock className="w-4 h-4 mr-1" />
        Pending
      </Badge>
    );
  };

  if (isLoading) {
    return (
      <div className="flex justify-center p-4">
        <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Type</TableHead>
          <TableHead>Description</TableHead>
          <TableHead>Case</TableHead>
          <TableHead>Due Date</TableHead>
          <TableHead>Status</TableHead>
          <TableHead>Actions</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {items.map((item) => (
          <TableRow key={item.id}>
            <TableCell className="font-medium">{item.type}</TableCell>
            <TableCell>{item.description}</TableCell>
            <TableCell>{item.case?.customer?.full_name || 'N/A'}</TableCell>
            <TableCell>{format(new Date(item.due_date), 'PPP')}</TableCell>
            <TableCell>{getStatusBadge(item.status, item.due_date)}</TableCell>
            <TableCell>
              {item.status !== 'completed' ? (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, 'completed')}
                  disabled={Boolean(updatingId)}
                >
                  {updatingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Mark Complete'
                  )}
                </Button>
              ) : (
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => handleStatusUpdate(item.id, 'pending')}
                  disabled={Boolean(updatingId)}
                >
                  {updatingId === item.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    'Reopen'
                  )}
                </Button>
              )}
            </TableCell>
          </TableRow>
        ))}
        {items.length === 0 && (
          <TableRow>
            <TableCell colSpan={6} className="text-center py-4 text-muted-foreground">
              No compliance items found
            </TableCell>
          </TableRow>
        )}
      </TableBody>
    </Table>
  );
};