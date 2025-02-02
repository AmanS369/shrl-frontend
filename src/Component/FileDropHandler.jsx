import React, { useCallback } from "react";
import { useDropzone } from "react-dropzone";
import { Upload } from "lucide-react";

const FileDropHandler = ({
  onFileUpload,
  maxFiles = 20,
  maxSize = 15 * 1024 * 1024, // 15MB
  disabled = false,
  children,
}) => {
  const onDrop = useCallback(
    async (acceptedFiles) => {
      for (const file of acceptedFiles) {
        if (file.size > maxSize) {
          alert(
            `File ${file.name} is too large (max ${maxSize / (1024 * 1024)}MB)`,
          );
          continue;
        }

        try {
          await onFileUpload(file);
        } catch (error) {
          console.error("Error uploading file:", error);
          alert(`Failed to upload ${file.name}. Please try again.`);
        }
      }
    },
    [onFileUpload, maxSize],
  );

  const { getRootProps, getInputProps, isDragActive } = useDropzone({
    onDrop,
    noClick: true,
    noKeyboard: true,
    maxSize,
    maxFiles,
    disabled,
  });

  return (
    <div {...getRootProps()} className="relative flex-1 overflow-hidden">
      <input {...getInputProps()} />
      {children}

      {isDragActive && (
        <div className="absolute inset-0 bg-blue-50 bg-opacity-90 flex items-center justify-center z-50">
          <div className="text-center p-8 rounded-lg border-2 border-dashed border-blue-400">
            <Upload className="w-12 h-12 text-blue-500 mx-auto mb-4" />
            <p className="text-lg font-medium text-blue-700">
              Drop files here to upload
            </p>
            <p className="text-sm text-blue-600 mt-2">
              Maximum file size: {maxSize / (1024 * 1024)}MB
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

export default FileDropHandler;
