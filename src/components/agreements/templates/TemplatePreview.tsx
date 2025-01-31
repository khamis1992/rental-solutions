import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TextStyle, Table } from "@/types/agreement.types";

interface TemplatePreviewProps {
  content: string;
  missingVariables?: string[];
  textStyle?: TextStyle;
  tables?: Table[];
}

export const TemplatePreview = ({ 
  content, 
  missingVariables = [],
  textStyle = {
    bold: false,
    italic: false,
    underline: false,
    fontSize: 14,
    alignment: 'left'
  },
  tables = []
}: TemplatePreviewProps) => {
  const containsArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  const processContent = (text: string) => {
    const isArabic = containsArabic(text);
    const dirAttribute = isArabic ? 'rtl' : 'ltr';

    // Process template variables with enhanced styling
    let processedContent = text.replace(
      /{{(.*?)}}/g,
      '<span class="template-variable bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-mono text-sm" style="direction: ltr; unicode-bidi: embed;">{{$1}}</span>'
    );

    // Add section styling
    processedContent = processedContent.replace(
      /<h1>/g,
      '<h1 class="text-2xl font-bold mb-6 mt-8 text-gray-900 border-b pb-2">'
    );
    
    processedContent = processedContent.replace(
      /<h2>/g,
      '<h2 class="text-xl font-semibold mb-4 mt-6 text-gray-800">'
    );

    // Style paragraphs with proper spacing and line height
    processedContent = processedContent.replace(
      /<p>/g,
      `<p dir="${dirAttribute}" class="mb-4 leading-relaxed" style="text-align: ${isArabic ? 'right' : 'left'}">`
    );

    // Style lists
    processedContent = processedContent.replace(
      /<ul>/g,
      '<ul class="list-disc list-inside mb-4 space-y-2">'
    );

    processedContent = processedContent.replace(
      /<ol>/g,
      '<ol class="list-decimal list-inside mb-4 space-y-2">'
    );

    return processedContent;
  };

  const isArabic = containsArabic(content);
  const processedContent = processContent(content);

  return (
    <div className="space-y-6">
      <DialogHeader>
        <DialogTitle className="text-xl font-semibold">
          {isArabic ? "معاينة النموذج" : "Template Preview"}
        </DialogTitle>
      </DialogHeader>
      
      {missingVariables.length > 0 && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            {isArabic ? 
              "المتغيرات التالية مفقودة: " + missingVariables.join("، ") :
              "The following variables are missing: " + missingVariables.join(", ")
            }
          </AlertDescription>
        </Alert>
      )}
      
      <ScrollArea className="h-[600px] w-full rounded-md border bg-white shadow-sm">
        <div 
          className={cn(
            "p-12 mx-auto max-w-[800px]",
            isArabic ? "font-arabic" : "font-serif",
            "leading-relaxed text-gray-700",
            {
              'font-bold': textStyle.bold,
              'italic': textStyle.italic,
              'underline': textStyle.underline,
              'text-left': !isArabic && textStyle.alignment === 'left',
              'text-center': textStyle.alignment === 'center',
              'text-right': isArabic || textStyle.alignment === 'right',
              'text-justify': textStyle.alignment === 'justify'
            }
          )}
          style={{
            direction: isArabic ? 'rtl' : 'ltr',
            fontSize: `${textStyle.fontSize}px`
          }}
          dangerouslySetInnerHTML={{ __html: processedContent }}
        />

        {tables.map((table, tableIndex) => (
          <table 
            key={tableIndex}
            className="w-full my-6 border-collapse bg-white"
            dir={isArabic ? "rtl" : "ltr"}
            style={{
              width: '100%',
              borderCollapse: 'collapse',
              borderSpacing: '0',
              direction: isArabic ? 'rtl' : 'ltr'
            }}
          >
            <tbody>
              {table.rows.map((row, rowIndex) => (
                <tr key={rowIndex} className={rowIndex % 2 === 0 ? 'bg-gray-50' : ''}>
                  {row.cells.map((cell, cellIndex) => (
                    <td 
                      key={cellIndex}
                      className="border border-gray-200 p-3 text-sm"
                      style={{
                        ...(cell.style && {
                          fontWeight: cell.style.bold ? 'bold' : 'normal',
                          fontStyle: cell.style.italic ? 'italic' : 'normal',
                          textDecoration: cell.style.underline ? 'underline' : 'none',
                          fontSize: `${cell.style.fontSize}px`,
                          textAlign: isArabic ? 'right' : cell.style.alignment
                        })
                      }}
                    >
                      {cell.content}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        ))}
      </ScrollArea>
    </div>
  );
};