
import React from 'react';
import { LayoutGrid, List } from "lucide-react";
import { Button } from "@/components/ui/button";

interface ViewSwitcherProps {
  view: 'grid' | 'table';
  onChange: (view: 'grid' | 'table') => void;
}

export const ViewSwitcher = ({ view, onChange }: ViewSwitcherProps) => {
  return (
    <div className="flex space-x-2 mb-4">
      <Button
        variant={view === 'grid' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('grid')}
        className="flex items-center gap-2"
      >
        <LayoutGrid className="h-4 w-4" />
        <span>Grid View</span>
      </Button>
      <Button
        variant={view === 'table' ? 'default' : 'outline'}
        size="sm"
        onClick={() => onChange('table')}
        className="flex items-center gap-2"
      >
        <List className="h-4 w-4" />
        <span>List View</span>
      </Button>
    </div>
  );
};
