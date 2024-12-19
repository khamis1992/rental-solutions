import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";

export const SearchBox = () => {
  return (
    <div className="relative w-[400px]">
      <Search className="absolute left-2 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search..."
        className="pl-8 w-full bg-background"
      />
    </div>
  );
};