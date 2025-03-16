import React, { useState } from "react";
import { useNavigate } from "react-router-dom"; // Import useNavigate for navigation
import { FaArrowLeft } from "react-icons/fa"; // Import the back arrow icon

const AdminFileUploadPage = () => {
  // State for file, title, description, and upload status
  const [file, setFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [uploading, setUploading] = useState(false);

  // Handle file selection
  const handleFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFile = event.target.files?.[0] ?? null;
    setFile(selectedFile);
  };

  // Handle file upload to backend
  const handleFileUpload = async () => {
    if (!file || !title || !description) {
      alert("Please fill in all fields and select a file!");
      return;
    }

    setUploading(true);

    const formData = new FormData();
    formData.append("file", file);
    formData.append("title", title);
    formData.append("description", description);
    formData.append("color", "#FFFFFF"); // Default color (can be customized)

    const token = localStorage.getItem("token");
    if (!token) {
      alert("Authentication token not found. Please log in again.");
      setUploading(false);
      return;
    }

    try {
      const response = await fetch("http://localhost:5000/upload", {
        method: "POST",
        body: formData,
        headers: {
          Authorization: `Bearer ${token}`, // Added authentication header
        },
      });

      const result = await response.json();

      if (response.ok) {
        alert("File uploaded successfully!");
        resetForm();
      } else {
        console.error("Upload failed:", result);
        alert("Failed to upload file: " + (result.error || "Unknown error"));
      }
    } catch (error) {
      console.error("Error uploading file:", error);
      alert("An error occurred during the file upload.");
    } finally {
      setUploading(false);
    }
  };

  // Reset form fields
  const resetForm = () => {
    setFile(null);
    setTitle("");
    setDescription("");
  };

  // Navigation hook
  const navigate = useNavigate();

  // Handle back button click
  const handleBack = () => {
    navigate("/admin-dashboard"); // Navigate back to Admin Dashboard
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
           {/* Empty div to push title to center visually */}
          <h1 className="text-3xl font-semibold">Admin File Upload</h1>
          <button
            onClick={handleBack}
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600"
          >
            <FaArrowLeft />
          </button>
        </div>

        {/* Title Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium">Title</label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            className="p-2 border rounded w-full"
            placeholder="Enter file title"
          />
        </div>

        {/* Description Input */}
        <div className="mb-4">
          <label className="block text-sm font-medium">Description</label>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="p-2 border rounded w-full"
            placeholder="Enter file description"
          />
        </div>

        {/* File Input */}
        <div className="mb-4">
          <input type="file" onChange={handleFileChange} className="p-2 border rounded" />
        </div>

        {/* Display selected file name */}
        {file && (
          <div className="mb-4">
            <p>Selected file: {file.name}</p>
          </div>
        )}

        {/* Upload Button */}
        <button
          onClick={handleFileUpload}
          className="bg-[#344966] text-white px-4 py-2 rounded-lg hover:bg-[#8babc6] transition"
          disabled={uploading}
        >
          {uploading ? "Uploading..." : "Upload File"}
        </button>
      </div>
    </div>
  );
};

export default AdminFileUploadPage;