import React, { useCallback, useState } from "react";
import { useDropzone } from "react-dropzone";
import { Card, CardContent } from "@/components/ui/card";
import { Camera } from "lucide-react";

interface ImageUploadProps {
  onImagesSelected: (files: File[]) => void;
  maxFiles?: number;
}

export const ImageUpload = ({ 
  onImagesSelected, 
  maxFiles = 5 
}: ImageUploadProps) => {
  const [previews, setPreviews] = useState<string[]>([]);

  const onDrop = useCallback((acceptedFiles: File[]) => {
    // Create preview URLs for the images
    const urls = acceptedFiles.map(file => URL.createObjectURL(file));
    setPreviews(prev => [...prev, ...urls]);
    onImagesSelected(acceptedFiles);
  }, [onImagesSelected]);

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    accept: {
      'image/*': ['.jpeg', '.jpg', '.png']
    },
    maxFiles,
  });

  return (
    <Card>
      <CardContent>
        <div
          {...getRootProps()}
          className={`
            border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
            ${isDragActive ? 'border-primary bg-primary/5' : 'border-gray-300'}
          `}
        >
          <input {...getInputProps()} />
          <Camera className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-600">
            {isDragActive
              ? "Drop the files here..."
              : "Drag 'n' drop images here, or click to select files"}
          </p>
          <p className="text-xs text-gray-500 mt-1">
            Maximum {maxFiles} files. JPEG or PNG only.
          </p>
        </div>

        {previews.length > 0 && (
          <div className="mt-4 grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
            {previews.map((preview, index) => (
              <div 
                key={index} 
                className="relative aspect-square rounded-lg overflow-hidden border border-gray-200"
              >
                <img
                  src={preview}
                  alt={`Preview ${index + 1}`}
                  className="w-full h-full object-cover"
                />
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
};