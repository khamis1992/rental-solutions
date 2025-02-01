import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, Printer } from "lucide-react";
import { DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { cn } from "@/lib/utils";
import { TextStyle, Table } from "@/types/agreement.types";
import { useState } from "react";
import { Button } from "@/components/ui/button";

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
  const [pageCount, setPageCount] = useState(1);

  const containsArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  const handlePrint = () => {
    const printWindow = window.open('', '_blank');
    if (!printWindow) return;

    const printContent = `
      <!DOCTYPE html>
      <html>
        <head>
          <title>Print Agreement Template</title>
          <style>
            @page {
              size: A4;
              margin: 20mm;
            }
            body {
              font-family: Arial, sans-serif;
              margin: 0;
              padding: 0;
            }
            .a4-page {
              width: 210mm;
              min-height: 297mm;
              padding: 20mm;
              margin: 0 auto;
              box-sizing: border-box;
              position: relative;
            }
            .page-number {
              position: absolute;
              bottom: 10mm;
              width: 100%;
              text-align: center;
              font-size: 12px;
              color: #666;
            }
            .template-variable {
              background-color: #f3e8ff;
              color: #6b21a8;
              padding: 2px 6px;
              border-radius: 4px;
              border: 1px solid #e9d5ff;
              font-family: monospace;
              font-size: 0.875em;
            }
            .agreement-table {
              width: 100%;
              border-collapse: collapse;
              margin: 1em 0;
            }
            .agreement-table td, .agreement-table th {
              border: 1px solid #ddd;
              padding: 8px;
            }
            @media print {
              body { margin: 0; }
              .a4-page { box-shadow: none; }
            }
          </style>
        </head>
        <body>
          <div class="a4-page">
            ${processContent(content)}
            <div class="page-number">Page 1 of ${pageCount}</div>
          </div>
        </body>
      </html>
    `;

    printWindow.document.write(printContent);
    printWindow.document.close();
    printWindow.focus();
    setTimeout(() => {
      printWindow.print();
      printWindow.close();
    }, 250);
  };

  const processContent = (text: string) => {
    const isArabic = containsArabic(text);
    const dirAttribute = isArabic ? 'rtl' : 'ltr';

    let processedContent = text;
    
    // Center all bold text
    processedContent = processedContent.replace(
      /<strong>(.*?)<\/strong>/g,
      '<strong class="block text-center">$1</strong>'
    );

    // Process template variables
    processedContent = processedContent.replace(
      /{{(.*?)}}/g,
      '<span class="template-variable">{{$1}}</span>'
    );

    // Process section headers
    processedContent = processedContent.replace(
      /<h1>(.*?)<\/h1>/g,
      '<h1 class="text-2xl font-bold text-gray-900 border-b pb-2 mb-4">$1</h1>'
    );
    
    // Reduce spacing for h2 headers
    processedContent = processedContent.replace(
      /<h2>/g,
      '<h2 class="text-xl font-semibold mb-3 text-gray-800">'
    );

    // Optimize paragraph spacing
    processedContent = processedContent.replace(
      /<p>/g,
      `<p dir="${dirAttribute}" class="mb-3 leading-relaxed" style="text-align: ${isArabic ? 'right' : 'left'}">`
    );

    // Optimize list spacing
    processedContent = processedContent.replace(
      /<ul>/g,
      '<ul class="list-disc list-inside mb-3 space-y-1">'
    );

    processedContent = processedContent.replace(
      /<ol>/g,
      '<ol class="list-decimal list-inside mb-3 space-y-1">'
    );

    return processedContent;
  };

  const isArabic = containsArabic(content);
  const processedContent = processContent(content);

  // Calculate page count based on content height
  const calculatePageCount = (containerRef: HTMLDivElement | null) => {
    if (containerRef) {
      const contentHeight = containerRef.scrollHeight;
      const pageHeight = 297; // A4 height in mm
      const calculatedPages = Math.ceil(contentHeight / pageHeight);
      setPageCount(calculatedPages);
    }
  };

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex justify-between items-center">
          <DialogTitle className="text-xl font-semibold">
            {isArabic ? "معاينة النموذج" : "Template Preview"}
          </DialogTitle>
          <Button 
            onClick={handlePrint}
            variant="outline"
            size="sm"
            className="flex items-center gap-2"
          >
            <Printer className="h-4 w-4" />
            {isArabic ? "طباعة" : "Print"}
          </Button>
        </div>
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
        <div className="a4-preview-container">
          <div 
            className={cn(
              "a4-page",
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
            ref={calculatePageCount}
            dangerouslySetInnerHTML={{ __html: processedContent }}
          />
          <div className="page-number">
            Page 1 of {pageCount}
          </div>
        </div>

        {tables.map((table, tableIndex) => (
          <table 
            key={tableIndex}
            className="w-full my-4 border-collapse bg-white"
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
                      className="border border-gray-200 p-2 text-sm"
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