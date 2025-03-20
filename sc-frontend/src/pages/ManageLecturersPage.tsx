// src/pages/ManageLecturersPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import axios, { AxiosError } from "axios";
import { FaArrowLeft, FaSpinner } from "react-icons/fa";

interface Lecturer {
  id: number;
  name: string;
  email: string;
  phone: string;
  address: string;
  course: string;
  module: string;
}

const ManageLecturersPage: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [lecturers, setLecturers] = useState<Lecturer[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (location.state && location.state.success) {
      setSuccess(location.state.success);
      window.history.replaceState({}, document.title);
    }

    const fetchLecturers = async () => {
      try {
        const token = localStorage.getItem("token");
        console.log("Token for lecturers fetch:", token);
        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/lecturers`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Fetched lecturers:", response.data);
          setLecturers(response.data);
        } else {
          console.error("No token found for fetching lecturers");
          setError("Authentication failed. Please log in again.");
        }
      } catch (error) {
        console.error("Error fetching lecturers:", error);
        setError("Failed to load lecturers. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchLecturers();
  }, [location]);

  const handleBack = () => navigate("/admin-dashboard");

  const handleDelete = async (id: number) => {
    if (window.confirm("Are you sure you want to delete this lecturer?")) {
      try {
        const token = localStorage.getItem("token");
        console.log("Stored token:", token);
        console.log("Token for delete:", token);
        console.log("Deleting lecturer with ID:", id);
        if (token) {
          const response = await axios.delete(
            `${import.meta.env.VITE_API_URL}/lecturers/${id}`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          console.log("Delete response:", response.data);
          setLecturers([]);
          const fetchLecturers = async () => {
            const fetchResponse = await axios.get(
              `${import.meta.env.VITE_API_URL}/lecturers`,
              {
                headers: { Authorization: `Bearer ${token}` },
              }
            );
            console.log("Refetched lecturers:", fetchResponse.data);
            setLecturers(fetchResponse.data);
          };
          await fetchLecturers();
          console.log(`Successfully deleted lecturer with ID: ${id}`);
        } else {
          console.error("No token found for delete operation");
          setError("Authentication failed. Please log in again.");
        }
      } catch (error) {
        console.error("Error deleting lecturer:", error);
        if (error instanceof AxiosError) {
          if (error.response) {
            console.error("Response data:", error.response.data);
            console.error("Status code:", error.response.status);
            console.error("Response headers:", error.response.headers);
            setError(
              `Delete failed: ${
                error.response.data.error || error.response.statusText
              }`
            );
          } else if (error.request) {
            console.error(
              "No response received. Request details:",
              error.request
            );
            setError("No response from server. Check your connection.");
          } else {
            console.error("Error setting up request:", error.message);
            setError("An unexpected error occurred.");
          }
        } else {
          console.error("Unexpected error:", error);
          setError("An unexpected error occurred.");
        }
      }
    }
  };

  const handleUpdate = (id: number) => {
    console.log(`Navigate to update page for lecturer ID: ${id}`);
    navigate(`/update-lecturer/${id}`);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-100 via-gray-200 to-gray-300 p-6 text-gray-800">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900">Manage Lecturers</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-12 h-12 bg-[#FF7700] text-white rounded-full shadow-lg hover:bg-orange-600 transition-transform transform hover:scale-110"
            aria-label="Back to Admin Dashboard"
          >
            <FaArrowLeft className="text-xl" />
          </button>
        </div>
        {success && (
          <div className="mb-4 p-4 bg-green-100 text-green-700 rounded-lg shadow-md">
            {success}
          </div>
        )}
        {error && (
          <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-lg shadow-md">
            {error}
          </div>
        )}
        <div className="bg-white rounded-xl shadow-2xl p-6">
          {loading ? (
            <div className="flex justify-center items-center py-10">
              <FaSpinner className="animate-spin text-4xl text-[#FF7700]" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-gradient-to-r from-[#FF7700] to-orange-500 text-white">
                    <th className="p-4 font-semibold">Name</th>
                    <th className="p-4 font-semibold">Email</th>
                    <th className="p-4 font-semibold">Phone</th>
                    <th className="p-4 font-semibold">Address</th>
                    <th className="p-4 font-semibold">Course</th>
                    <th className="p-4 font-semibold">Module</th>
                    <th className="p-4 font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {lecturers.map((lecturer) => (
                    <tr
                      key={lecturer.id}
                      className="border-b hover:bg-gray-50 transition-colors"
                    >
                      <td className="p-4">{lecturer.name}</td>
                      <td className="p-4">{lecturer.email}</td>
                      <td className="p-4">{lecturer.phone}</td>
                      <td className="p-4">{lecturer.address}</td>
                      <td className="p-4">{lecturer.course}</td>
                      <td className="p-4">{lecturer.module}</td>
                      <td className="p-4 flex space-x-2">
                        <button
                          onClick={() => handleUpdate(lecturer.id)}
                          className="bg-blue-500 text-white px-3 py-1.5 rounded-lg hover:bg-blue-600 transition-colors"
                        >
                          Update
                        </button>
                        <button
                          onClick={() => handleDelete(lecturer.id)}
                          className="bg-red-500 text-white px-3 py-1.5 rounded-lg hover:bg-red-600 transition-colors"
                        >
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              {lecturers.length === 0 && (
                <p className="text-center text-gray-500 py-6">
                  No lecturers registered.
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ManageLecturersPage;
