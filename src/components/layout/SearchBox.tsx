import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useIsMobile } from "@/hooks/use-mobile";
import { cn } from "@/lib/utils";

export const SearchBox = () => {
  const isMobile = useIsMobile();

  return (
    <div className={cn(
      "relative",
      isMobile ? "w-full" : "w-[200px] md:w-[300px]"
    )}>
      <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground pointer-events-none" />
      <Input
        type="search"
        placeholder="Search..."
        className="pl-8 pr-4 h-10 md:h-9 w-full"
      />
    </div>
  );
};