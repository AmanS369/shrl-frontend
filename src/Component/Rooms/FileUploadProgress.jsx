import { X, Upload } from "lucide-react";

const FileUploadProgress = ({ fileName, progress, onCancel }) => {
  return (
    <div className="fixed bottom-20 right-4 bg-white shadow-lg rounded-lg p-4 w-80 border">
      <div className="flex justify-between items-center mb-2">
        <div className="flex items-center gap-2">
          <Upload
            size={16}
            className={`${progress < 100 ? "animate-bounce" : ""}`}
          />
          <span className="text-sm font-medium truncate">{fileName}</span>
        </div>
        <button
          onClick={onCancel}
          className="text-gray-500 hover:text-gray-700"
        >
          <X size={16} />
        </button>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2.5">
        <div
          className="bg-blue-500 h-2.5 rounded-full transition-all duration-300 relative"
          style={{ width: `${progress}%` }}
        >
          <div className="absolute inset-0 bg-white/30 rounded-full animate-pulse"></div>
        </div>
      </div>
      <span className="text-xs text-gray-500 mt-2 flex justify-between">
        <span>{progress}% uploaded</span>
        <span>{fileName.split(".").pop().toUpperCase()}</span>
      </span>
    </div>
  );
};

export default FileUploadProgress;
