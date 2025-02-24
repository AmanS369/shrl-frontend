import React, { useState, useEffect, useRef } from "react";
import { X, FileText, Search, Download, Trash2 } from "lucide-react";

const Modal = ({ isOpen, onClose, children }) => {
  const modalRef = useRef();

  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape") onClose();
    };

    const handleClickOutside = (e) => {
      if (modalRef.current && !modalRef.current.contains(e.target)) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener("keydown", handleEscape);
      document.addEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "hidden";
    }

    return () => {
      document.removeEventListener("keydown", handleEscape);
      document.removeEventListener("mousedown", handleClickOutside);
      document.body.style.overflow = "unset";
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div
        ref={modalRef}
        className="bg-white rounded-lg w-full max-w-lg shadow-xl"
      >
        {children}
      </div>
    </div>
  );
};

const SharedFiles = ({ files, onDelete }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [filteredFiles, setFilteredFiles] = useState(files);

  useEffect(() => {
    setFilteredFiles(
      files.filter((file) =>
        file.fileName.toLowerCase().includes(searchTerm.toLowerCase()),
      ),
    );
  }, [searchTerm, files]);

  const handleDownload = (file) => {
    window.open(file.fileUrl, "_blank");
  };

  return (
    <div>
      <button
        onClick={() => setIsModalOpen(true)}
        className="flex items-center gap-2 p-2 hover:bg-gray-100 rounded-lg"
      >
        <FileText size={20} />
        <span className="text-sm font-medium">{files.length} Files</span>
      </button>

      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <div className="p-4">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold">Shared Files</h2>
            <button
              onClick={() => setIsModalOpen(false)}
              className="p-1 hover:bg-gray-100 rounded-full"
            >
              <X size={20} />
            </button>
          </div>

          <div className="relative mb-4">
            <Search className="absolute left-3 top-3 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search files..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          <div className="max-h-[400px] overflow-y-auto">
            {filteredFiles.length === 0 ? (
              <div className="text-center py-8 text-gray-500">
                No files found
              </div>
            ) : (
              <div className="space-y-2">
                {filteredFiles.map((file, index) => (
                  <div
                    key={index}
                    className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg group"
                  >
                    <div
                      className="flex items-center gap-3 cursor-pointer hover:text-blue-500"
                      onClick={() => handleDownload(file)}
                    >
                      <FileText size={20} className="text-blue-500" />
                      <span className="text-sm font-medium truncate max-w-[200px]">
                        {file.fileName}
                      </span>
                    </div>
                    <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        onClick={() => handleDownload(file)}
                        className="p-1 hover:bg-blue-100 rounded-full text-blue-500"
                        title="Open in new tab"
                      >
                        <Download size={16} />
                      </button>
                      <button
                        onClick={() => onDelete(file)}
                        className="p-1 hover:bg-red-100 rounded-full text-red-500"
                      >
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </Modal>
    </div>
  );
};

export default SharedFiles;
