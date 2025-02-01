import { ScrollArea } from "@/components/ui/scroll-area";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertCircle, ChevronDown, ChevronUp, Eye, EyeOff } from "lucide-react";
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
  const [collapsedSections, setCollapsedSections] = useState<string[]>([]);
  const [showVariables, setShowVariables] = useState(true);

  const containsArabic = (text: string) => {
    const arabicPattern = /[\u0600-\u06FF]/;
    return arabicPattern.test(text);
  };

  const toggleSection = (sectionId: string) => {
    setCollapsedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
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
    if (showVariables) {
      processedContent = processedContent.replace(
        /{{(.*?)}}/g,
        '<span class="template-variable bg-purple-50 text-purple-700 px-1.5 py-0.5 rounded border border-purple-200 font-mono text-sm" style="direction: ltr; unicode-bidi: embed;">{{$1}}</span>'
      );
    }

    // Process section headers with reduced margins
    processedContent = processedContent.replace(
      /<h1>(.*?)<\/h1>/g,
      (match, content) => `
        <div class="section-header mb-4">
          <h1 class="text-2xl font-bold text-gray-900 border-b pb-2 flex items-center justify-between cursor-pointer" onclick="toggleSection('${content.replace(/\s+/g, '-')}')">
            ${content}
            <span class="section-toggle">
              ${collapsedSections.includes(content.replace(/\s+/g, '-')) ? '▼' : '▲'}
            </span>
          </h1>
          <div class="section-content ${collapsedSections.includes(content.replace(/\s+/g, '-')) ? 'hidden' : ''}">
      `
    );
    
    processedContent = processedContent.replace(
      /<\/h1>/g,
      '</h1></div></div>'
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

  return (
    <div className="space-y-4">
      <DialogHeader>
        <div className="flex items-center justify-between">
          <DialogTitle className="text-xl font-semibold">
            {isArabic ? "معاينة النموذج" : "Template Preview"}
          </DialogTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => setShowVariables(!showVariables)}
            className="flex items-center gap-2"
          >
            {showVariables ? (
              <>
                <EyeOff className="h-4 w-4" />
                Hide Variables
              </>
            ) : (
              <>
                <Eye className="h-4 w-4" />
                Show Variables
              </>
            )}
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
        <div className="template-preview-container">
          <div 
            className={cn(
              "template-content px-6 py-4",
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
        </div>
      </ScrollArea>
    </div>
  );
};