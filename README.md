# smart-campus-mis

# nethmini contributed

# this is another contribution

# here Nethmini Please review my code 

import React, { useState, useEffect, useRef } from "react";
import { FiMoreVertical } from "react-icons/fi";

interface FileShareProps {
  onSendFile: (file: File)  void;
}

const FileShare: React.FC<FileShareProps> = ({ onSendFile }) => {
  const [isFileOptionsVisible, setIsFileOptionsVisible] = useState(false);
  const optionsRef = useRef<HTMLDivElement | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      onSendFile(selectedFile);
      setIsFileOptionsVisible(false);
      if (fileInputRef.current) {
        fileInputRef.current.value = ""; // Reset the input to allow re-uploading the same file
      }
    }
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (optionsRef.current && !optionsRef.current.contains(event.target as Node)) {
        setIsFileOptionsVisible(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  return (
    <div className="relative flex items-center space-x-2">
      {/* Three dots icon */}
      <button
        onClick={() => setIsFileOptionsVisible(!isFileOptionsVisible)}
        className="text-gray-600 hover:text-gray-800 focus:outline-none"
        aria-label="More options"
      >
        <FiMoreVertical size={24} />
      </button>

      {/* Dropdown menu for file options */}
      {isFileOptionsVisible && (
        <div
          ref={optionsRef}
          className="absolute bottom-full mb-2 left-0 bg-white shadow-lg rounded-md p-2 w-40 z-10 border border-gray-200"
        >
          <label
            htmlFor="file-upload"
            className="cursor-pointer block text-gray-600 hover:text-blue-500 transition-colors text-sm py-1 px-2 rounded hover:bg-gray-100"
            aria-label="Attach a file (all types supported)"
          >
            Attach File
          </label>
          <input
            type="file" // No 'accept' attribute to allow all file types
            onChange={handleFileUpload}
            id="file-upload"
            ref={fileInputRef}
            className="hidden"
            aria-hidden="true"
          />
        </div>
      )}
    </div>
  );
};

export default FileShare;