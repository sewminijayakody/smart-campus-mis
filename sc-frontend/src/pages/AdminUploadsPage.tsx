// src/pages/AdminUploadsPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import { useUser } from "../context/UserContext";

interface AdminUpload {
  id: number;
  title: string;
  description: string;
  fileName: string;
  url: string; // This will be the URL to the uploaded file
  color: string; // For background color (you can remove this if using random color generation)
}

const AdminUploadsPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [uploads, setUploads] = useState<AdminUpload[] | null>(null);

  // Function to generate random colors
  const generateRandomColor = () => {
    const colors = [
      "#D8F3E3", "#F2D7D9", "#FAF1C3", "#D8EAF3", "#E8E9E9", 
    ];
    return colors[Math.floor(Math.random() * colors.length)];
  };

  // Fetch data from backend
  useEffect(() => {
    const fetchUploads = async () => {
      try {
        const response = await fetch("http://localhost:5000/uploads"); // Backend endpoint
        const data = await response.json();
        setUploads(data);
      } catch (error) {
        console.error("Error fetching uploads:", error);
      }
    };

    fetchUploads();
  }, []);

  // Placeholder function for downloading files
  const handleDownload = async (fileUrl: string) => {
    try {
      const response = await fetch(fileUrl);
      if (response.ok) {
        const blob = await response.blob();
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        link.download = fileUrl.split("/").pop() || "download";
        link.click();
      } else {
        alert("Failed to download file.");
      }
    } catch (error) {
      console.error("Error downloading file:", error);
    }
  };

  const handleBack = () => {
    navigate(user?.role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Admin Uploads</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>

        {uploads ? (
          <div className="grid grid-cols-2 gap-6">
            {uploads.map((upload) => (
              <div
                key={upload.id}
                className="p-4 rounded-lg shadow-md border-2 border-blue-300 flex flex-col justify-between"
                style={{ backgroundColor: generateRandomColor(), minHeight: "200px" }} // Assign random colors
              >
                <div>
                  <h2 className="text-lg font-semibold mb-2">{upload.title}</h2>
                  <p className="text-sm text-gray-600 mb-2">{upload.description}</p>
                  <span className="text-sm text-gray-700">{upload.fileName}</span>
                </div>

                <button
                  onClick={() => handleDownload(upload.url)} // Handle file download
                  className="mt-4 self-end flex items-center space-x-1 bg-[#344966] text-white px-2 py-1 rounded-lg hover:bg-[#8babc6] transition text-sm"
                >
                  <FaDownload className="text-sm" />
                  <span>Download Files</span>
                </button>
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">Loading admin uploads...</p>
        )}
      </div>
    </div>
  );
};

export default AdminUploadsPage;