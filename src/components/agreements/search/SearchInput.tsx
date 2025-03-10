
import { Input } from "@/components/ui/input";
import { Search } from "lucide-react";
import { useState, useEffect, forwardRef } from "react";

interface SearchInputProps {
  onSearch: (query: string) => void;
  placeholder?: string;
  initialValue?: string;
  className?: string;
}

export const SearchInput = forwardRef<HTMLInputElement, SearchInputProps>(({
  onSearch,
  placeholder = "Search...",
  initialValue = "",
  className = ""
}, ref) => {
  const [searchTerm, setSearchTerm] = useState(initialValue);
  
  useEffect(() => {
    setSearchTerm(initialValue);
  }, [initialValue]);
  
  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setSearchTerm(value);
    onSearch(value);
  };
  
  return (
    <div className={`relative w-full ${className}`}>
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input 
        ref={ref} 
        type="text" 
        value={searchTerm} 
        onChange={handleInputChange} 
        placeholder={placeholder} 
        className="pl-9 w-full" 
        style={{ 
          color: 'var(--foreground)',
          fontWeight: '500',
          backgroundColor: 'var(--background)',
          border: '1px solid var(--input)'
        }}
      />
    </div>
  );
});

SearchInput.displayName = "SearchInput";
