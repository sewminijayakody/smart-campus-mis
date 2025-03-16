// src/pages/CoursePage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaDownload } from "react-icons/fa";
import axios from "axios";
import { useUser } from "../context/UserContext";

interface File {
  id: number;
  name: string;
  url: string;
}

interface Module {
  id: number;
  name: string;
  files: File[];
  color: string;
}

interface Course {
  id: number;
  name: string;
  modules: Module[];
}

const CoursePage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [course, setCourse] = useState<Course | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchCoursework = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user?.course) {
          console.error("No token or course found");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/coursework", {
          headers: { Authorization: `Bearer ${token}` },
          params: { course: user.course },
        });
        const data = response.data;
        // Map backend data to Course structure (assuming backend returns modules with files)
        const formattedCourse: Course = {
          id: 1,
          name: "Coursework",
          modules: data.modules || [], // Adjust based on actual backend response
        };
        setCourse(formattedCourse);
      } catch (error) {
        console.error("Error fetching coursework:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchCoursework();
  }, [user?.course]);

  const handleDownloadFiles = (fileUrl: string) => {
    console.log(`Downloading file: ${fileUrl}`);
    window.location.href = fileUrl; // Basic download implementation
  };

  const handleBack = () => {
    navigate("/student-dashboard");
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

export default CoursePage;