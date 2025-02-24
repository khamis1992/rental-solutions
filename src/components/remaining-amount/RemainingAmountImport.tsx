import { Button } from "@/components/ui/button";
import { useRemainingAmountImport } from "./hooks/useRemainingAmountImport";
import { Upload } from "lucide-react";

export const RemainingAmountImport = () => {
  const { isUploading, handleFileUpload } = useRemainingAmountImport();

  const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      await handleFileUpload(file);
    }
  };

  return (
    <div className="flex gap-2">
      <Button disabled={isUploading} asChild className="w-[220px]">
        <label className="cursor-pointer flex items-center">
          <Upload className="mr-2 h-4 w-4" />
          {isUploading ? "Importing..." : "Import CSV"}
          <input
            type="file"
            accept=".csv"
            className="hidden"
            onChange={handleFileChange}
            disabled={isUploading}
          />
        </label>
      </Button>
    </div>
  );
};