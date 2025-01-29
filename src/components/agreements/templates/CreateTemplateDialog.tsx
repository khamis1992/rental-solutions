import React, { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { 
  AlignLeft, 
  AlignCenter, 
  AlignRight, 
  AlignJustify,
  Bold,
  Italic,
  Underline,
  Save,
  Table as TableIcon,
  Plus,
  Trash2
} from "lucide-react";
import { toast } from "sonner";
import { Template, TextStyle, Table, TableRow, TableCell } from "@/types/agreement.types";
import { TemplatePreview } from "./TemplatePreview";

interface CreateTemplateDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  selectedTemplate?: Template;
}

interface TextStyle {
  bold: boolean;
  italic: boolean;
  underline: boolean;
  fontSize: number;
  alignment: 'left' | 'center' | 'right' | 'justify';
}

export const CreateTemplateDialog = ({
  open,
  onOpenChange,
  selectedTemplate,
}: CreateTemplateDialogProps) => {
  const queryClient = useQueryClient();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [textStyle, setTextStyle] = useState<TextStyle>({
    bold: false,
    italic: false,
    underline: false,
    fontSize: 14,
    alignment: 'left'
  });

  const [formData, setFormData] = useState<Partial<Template>>(
    selectedTemplate || {
      name: "",
      description: "",
      content: "",
      language: "english",
      agreement_type: "short_term",
      template_structure: { 
        textStyle: {
          bold: false,
          italic: false,
          underline: false,
          fontSize: 14,
          alignment: 'left'
        },
        tables: []
      },
      is_active: true,
    }
  );

  const [selectedTable, setSelectedTable] = useState<number | null>(null);
  const [selectedCell, setSelectedCell] = useState<{ row: number; col: number } | null>(null);

  const handleAddTable = () => {
    const newTable: Table = {
      rows: [
        { cells: [{ content: "" }, { content: "" }] },
        { cells: [{ content: "" }, { content: "" }] }
      ],
      style: {
        width: "100%",
        borderCollapse: "collapse"
      }
    };

    setFormData(prev => ({
      ...prev,
      template_structure: {
        ...prev.template_structure,
        tables: [...(prev.template_structure?.tables || []), newTable]
      }
    }));
  };

  const handleAddRow = (tableIndex: number) => {
    const tables = formData.template_structure?.tables || [];
    const table = tables[tableIndex];
    if (!table) return;

    const newRow: TableRow = {
      cells: table.rows[0].cells.map(() => ({ content: "" }))
    };

    const updatedTables = [...tables];
    updatedTables[tableIndex] = {
      ...table,
      rows: [...table.rows, newRow]
    };

    setFormData(prev => ({
      ...prev,
      template_structure: {
        ...prev.template_structure,
        tables: updatedTables
      }
    }));
  };

  const handleCellChange = (
    tableIndex: number,
    rowIndex: number,
    cellIndex: number,
    content: string
  ) => {
    const tables = formData.template_structure?.tables || [];
    const updatedTables = [...tables];
    
    if (!updatedTables[tableIndex]?.rows[rowIndex]?.cells[cellIndex]) return;
    
    updatedTables[tableIndex].rows[rowIndex].cells[cellIndex].content = content;

    setFormData(prev => ({
      ...prev,
      template_structure: {
        ...prev.template_structure,
        tables: updatedTables
      }
    }));
  };

  const handleDeleteTable = (tableIndex: number) => {
    setFormData(prev => ({
      ...prev,
      template_structure: {
        ...prev.template_structure,
        tables: (prev.template_structure?.tables || []).filter((_, i) => i !== tableIndex)
      }
    }));
    setSelectedTable(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      const templateData = {
        ...formData,
        template_structure: {
          ...formData.template_structure,
          textStyle
        }
      };

      if (selectedTemplate) {
        const { error } = await supabase
          .from("agreement_templates")
          .update(templateData)
          .eq("id", selectedTemplate.id);

        if (error) throw error;
        toast.success("Template updated successfully");
      } else {
        const { error } = await supabase
          .from("agreement_templates")
          .insert([templateData]);

        if (error) throw error;
        toast.success("Template created successfully");
      }

      await queryClient.invalidateQueries({ queryKey: ["agreement-templates"] });
      onOpenChange(false);
    } catch (error: any) {
      toast.error("Failed to save template: " + error.message);
    } finally {
      setIsSubmitting(false);
    }
  };

  const applyStyle = (style: keyof TextStyle, value: any) => {
    setTextStyle(prev => ({ ...prev, [style]: value }));
    // Apply style to selected text if any
    const textarea = document.querySelector('textarea') as HTMLTextAreaElement;
    if (textarea.selectionStart !== textarea.selectionEnd) {
      const start = textarea.selectionStart;
      const end = textarea.selectionEnd;
      const selectedText = formData.content?.substring(start, end) || '';
      const newContent = 
        (formData.content?.substring(0, start) || '') +
        `<span style="${getStyleString(style, value)}">${selectedText}</span>` +
        (formData.content?.substring(end) || '');
      setFormData({ ...formData, content: newContent });
    }
  };

  const getStyleString = (style: keyof TextStyle, value: any): string => {
    switch (style) {
      case 'bold': return 'font-weight: bold;';
      case 'italic': return 'font-style: italic;';
      case 'underline': return 'text-decoration: underline;';
      case 'fontSize': return `font-size: ${value}px;`;
      case 'alignment': return `text-align: ${value};`;
      default: return '';
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>
            {selectedTemplate ? "Edit Template" : "Create New Template"}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="name">Template Name</Label>
              <Input
                id="name"
                value={formData.name}
                onChange={(e) =>
                  setFormData({ ...formData, name: e.target.value })
                }
                required
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="language">Language</Label>
              <Select
                value={formData.language}
                onValueChange={(value) =>
                  setFormData({ ...formData, language: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select language" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="english">English</SelectItem>
                  <SelectItem value="arabic">Arabic</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="description">Description</Label>
            <Input
              id="description"
              value={formData.description}
              onChange={(e) =>
                setFormData({ ...formData, description: e.target.value })
              }
            />
          </div>

          <div className="space-y-2">
            <div className="flex justify-between items-center mb-2">
              <Label htmlFor="content">Template Content</Label>
              <div className="flex gap-2">
                {/* ... keep existing styling buttons */}
                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    type="button"
                    variant={textStyle.alignment === 'left' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => applyStyle('alignment', 'left')}
                    className="w-8 h-8 p-0"
                  >
                    <AlignLeft className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={textStyle.alignment === 'center' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => applyStyle('alignment', 'center')}
                    className="w-8 h-8 p-0"
                  >
                    <AlignCenter className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={textStyle.alignment === 'right' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => applyStyle('alignment', 'right')}
                    className="w-8 h-8 p-0"
                  >
                    <AlignRight className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={textStyle.alignment === 'justify' ? "default" : "ghost"}
                    size="sm"
                    onClick={() => applyStyle('alignment', 'justify')}
                    className="w-8 h-8 p-0"
                  >
                    <AlignJustify className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-1 border rounded-md p-1">
                  <Button
                    type="button"
                    variant={textStyle.bold ? "default" : "ghost"}
                    size="sm"
                    onClick={() => applyStyle('bold', !textStyle.bold)}
                    className="w-8 h-8 p-0"
                  >
                    <Bold className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={textStyle.italic ? "default" : "ghost"}
                    size="sm"
                    onClick={() => applyStyle('italic', !textStyle.italic)}
                    className="w-8 h-8 p-0"
                  >
                    <Italic className="h-4 w-4" />
                  </Button>
                  <Button
                    type="button"
                    variant={textStyle.underline ? "default" : "ghost"}
                    size="sm"
                    onClick={() => applyStyle('underline', !textStyle.underline)}
                    className="w-8 h-8 p-0"
                  >
                    <Underline className="h-4 w-4" />
                  </Button>
                </div>

                <div className="flex gap-1 border rounded-md p-1">
                  <Input
                    type="number"
                    min="8"
                    max="24"
                    value={textStyle.fontSize}
                    onChange={(e) => applyStyle('fontSize', e.target.value)}
                    className="w-16 h-8"
                  />
                </div>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={handleAddTable}
                  className="flex items-center gap-1"
                >
                  <TableIcon className="h-4 w-4" />
                  Add Table
                </Button>
              </div>
            </div>

            {showPreview ? (
              <TemplatePreview 
                content={formData.content || ""} 
                textStyle={textStyle}
                tables={formData.template_structure?.tables}
                missingVariables={[]}
              />
            ) : (
              <div className="space-y-4">
                <Textarea
                  id="content"
                  value={formData.content}
                  onChange={(e) =>
                    setFormData({ ...formData, content: e.target.value })
                  }
                  required
                  className={`min-h-[200px] font-serif text-base leading-relaxed p-6 ${
                    formData.language === 'arabic' ? 'font-arabic text-right' : ''
                  }`}
                  style={{
                    direction: formData.language === 'arabic' ? 'rtl' : 'ltr',
                    textAlign: textStyle.alignment,
                  }}
                />

                {formData.template_structure?.tables?.map((table, tableIndex) => (
                  <div key={tableIndex} className="border rounded-lg p-4">
                    <div className="flex justify-between items-center mb-2">
                      <h4 className="font-medium">Table {tableIndex + 1}</h4>
                      <div className="flex gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => handleAddRow(tableIndex)}
                        >
                          <Plus className="h-4 w-4 mr-1" />
                          Add Row
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          size="sm"
                          onClick={() => handleDeleteTable(tableIndex)}
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </div>

                    <table className="w-full border-collapse">
                      <tbody>
                        {table.rows.map((row, rowIndex) => (
                          <tr key={rowIndex}>
                            {row.cells.map((cell, cellIndex) => (
                              <td key={cellIndex} className="border p-1">
                                <Input
                                  value={cell.content}
                                  onChange={(e) =>
                                    handleCellChange(
                                      tableIndex,
                                      rowIndex,
                                      cellIndex,
                                      e.target.value
                                    )
                                  }
                                  className="w-full"
                                />
                              </td>
                            ))}
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              Cancel
            </Button>
            <Button 
              type="submit"
              disabled={isSubmitting}
              className="relative"
            >
              {isSubmitting ? (
                <>
                  <span className="opacity-0">Save Template</span>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <div className="h-5 w-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  </div>
                </>
              ) : (
                <>
                  <Save className="w-4 h-4 mr-2" />
                  Save Template
                </>
              )}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};
