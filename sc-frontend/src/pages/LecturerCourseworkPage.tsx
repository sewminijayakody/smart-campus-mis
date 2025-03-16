// src/pages/LecturerCourseworkPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload, FaUpload } from "react-icons/fa";
import axios from "axios";
import { useUser } from "../context/UserContext";

// Renamed to avoid conflict with browser's File type
interface CourseworkFile {
  id: number;
  name: string;
  url: string;
}

interface Module {
  id: number;
  name: string;
  files: CourseworkFile[];
  color: string;
}

interface Course {
  id: number;
  name: string;
  modules: Module[];
}

const LecturerCourseworkPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);
  // Use browser's File type for file uploads
  const [uploadFile, setUploadFile] = useState<globalThis.File | null>(null);
  const [uploadMessage, setUploadMessage] = useState<string>("");

  useEffect(() => {
    const fetchCoursework = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user?.module) {
          console.error("No token or module found");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/coursework", {
          headers: { Authorization: `Bearer ${token}` },
          params: { module: user.module },
        });
        const data = response.data;
        const formattedCourse: Course = {
          id: 1,
          name: "Coursework",
          modules: data.modules || [],
        };
        setCourse(formattedCourse);
      } catch (error) {
        console.error("Error fetching coursework:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursework();
  }, [user?.module]);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setUploadFile(e.target.files[0]); // This is now correctly typed as globalThis.File
    }
  };

  const handleUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!uploadFile || !user?.module || !user?.course) {
      setUploadMessage("Please select a file and ensure module/course are assigned.");
      return;
    }

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setUploadMessage("Authentication failed. Please log in.");
        return;
      }

      setLoading(true);
      const formData = new FormData();
      formData.append("file", uploadFile); // This now works since uploadFile is a globalThis.File (extends Blob)
      formData.append("module", user.module);
      formData.append("course", user.course);

      // Removed unused 'response' variable
      await axios.post("http://localhost:5000/api/coursework/upload", formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "multipart/form-data",
        },
      });

      // Refresh coursework after upload
      const fetchResponse = await axios.get("http://localhost:5000/api/coursework", {
        headers: { Authorization: `Bearer ${token}` },
        params: { module: user.module },
      });
      const data = fetchResponse.data;
      const formattedCourse: Course = {
        id: 1,
        name: "Coursework",
        modules: data.modules || [],
      };
      setCourse(formattedCourse);
      setUploadMessage("File uploaded successfully!");
      setUploadFile(null);
    } catch (error) {
      console.error("Error uploading file:", error);
      setUploadMessage("Failed to upload file. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleDownloadFiles = (fileUrl: string) => {
    console.log(`Downloading file: ${fileUrl}`);
    window.location.href = fileUrl;
  };

  const handleBack = () => {
    navigate("/lecturer-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6 mt-8 -ml-10">
          <h1 className="text-3xl font-semibold">Coursework</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>

        <div className="bg-[#E8E9E9] p-6 rounded-lg shadow-md border-2 border-gray-300 mb-6">
          <form onSubmit={handleUpload} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">Upload Coursework File</label>
              <input
                type="file"
                onChange={handleFileChange}
                className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-[#FF7700] text-white py-2 rounded-lg shadow-md hover:bg-orange-600 transition flex items-center justify-center space-x-2"
              disabled={loading}
            >
              <FaUpload />
              <span>{loading ? "Uploading..." : "Upload File"}</span>
            </button>
          </form>
          {uploadMessage && (
            <p className={`mt-4 text-center ${uploadMessage.includes("successfully") ? "text-green-600" : "text-red-600"}`}>
              {uploadMessage}
            </p>
          )}
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading course data...</p>
        ) : course ? (
          <div className="grid grid-cols-3 gap-6">
            {course.modules.map((module) => (
              <div
                key={module.id}
                className="p-4 rounded-lg shadow-md"
                style={{ backgroundColor: module.color || "#D8F3E3" }}
              >
                <h2 className="text-xl font-semibold mb-4">{module.name}</h2>
                {module.files.map((file) => (
                  <div
                    key={file.id}
                    className="bg-white p-2 rounded-lg shadow-md border-2 border-blue-300 mb-2 flex justify-between items-center"
                  >
                    <span className="text-sm text-gray-600">{file.name}</span>
                    <button
                      onClick={() => handleDownloadFiles(file.url)}
                      className="ml-2 text-gray-500 hover:text-gray-700 text-xs flex items-center space-x-1"
                    >
                      <FaDownload className="text-xs" />
                      <span>Download Files</span>
                    </button>
                  </div>
                ))}
              </div>
            ))}
          </div>
        ) : (
          <p className="text-center text-gray-500">No course data available.</p>
        )}
      </div>
    </div>
  );
};

export default LecturerCourseworkPage;