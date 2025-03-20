// src/pages/RequestsPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaCheckCircle, FaTimesCircle } from "react-icons/fa";
import axios from "axios";

interface Request {
  id: number;
  user_id: number;
  resourceType: string;
  details: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedDate: string;
  adminResponse?: string; // Optional admin response
  userName?: string; // Optional user name for display
}

const RequestsPage: React.FC = () => {
  const navigate = useNavigate();
  const [requests, setRequests] = useState<Request[]>([]);
  const [filterStatus, setFilterStatus] = useState<string>("All");
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/requests`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          const enrichedRequests = await Promise.all(
            response.data.map(async (req: Request) => {
              const userResponse = await axios.get(
                `${import.meta.env.VITE_API_URL}/user/${req.user_id}`,
                {
                  headers: { Authorization: `Bearer ${token}` },
                }
              );
              return { ...req, userName: userResponse.data.name };
            })
          );
          setRequests(enrichedRequests);
        }
      } catch (error) {
        console.error("Error fetching requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  const handleStatusChange = async (
    requestId: number,
    newStatus: "Approved" | "Rejected",
    response?: string
  ) => {
    try {
      const token = localStorage.getItem("token");
      if (token) {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/requests/${requestId}/status`,
          { status: newStatus, adminResponse: response },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRequests((prev) =>
          prev.map((req) =>
            req.id === requestId
              ? { ...req, status: newStatus, adminResponse: response }
              : req
          )
        );
      }
    } catch (error) {
      console.error("Error updating request status:", error);
    }
  };

  const filteredRequests = requests.filter((req) => {
    if (filterStatus === "All") return true;
    return req.status === filterStatus;
  });

  // Function to format the submittedDate to a readable string
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      hour12: true, // Use 12-hour format with AM/PM
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Resource Requests</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>
        <div className="mb-4">
          <label className="mr-2 text-sm font-medium text-gray-700">
            Filter by Status:
          </label>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="p-2 border rounded-lg bg-[#D9D9D9] text-gray-700"
          >
            <option value="All">All</option>
            <option value="Pending">Pending</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>
        </div>
        {loading ? (
          <p className="text-center text-gray-500">Loading requests...</p>
        ) : filteredRequests.length === 0 ? (
          <p className="text-center text-gray-500">No requests found.</p>
        ) : (
          <div className="bg-[#E8E9E9] p-4 rounded-lg shadow-md border-2 border-gray-300">
            <ul className="space-y-4">
              {filteredRequests.map((request) => (
                <li
                  key={request.id}
                  className="p-4 bg-white rounded-lg shadow-sm border border-gray-200"
                >
                  <div className="flex justify-between items-start">
                    <div>
                      <p className="text-sm text-gray-700">
                        <strong>User:</strong> {request.userName || "Unknown"}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Type:</strong> {request.resourceType}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Details:</strong> {request.details}
                      </p>
                      <p className="text-sm text-gray-700">
                        <strong>Status:</strong>{" "}
                        <span
                          className={
                            request.status === "Approved"
                              ? "text-green-600"
                              : request.status === "Rejected"
                              ? "text-red-600"
                              : "text-yellow-600"
                          }
                        >
                          {request.status}
                        </span>
                      </p>
                      {request.adminResponse && (
                        <p className="text-sm text-gray-700">
                          <strong>Admin Response:</strong>{" "}
                          {request.adminResponse}
                        </p>
                      )}
                      <p className="text-sm text-gray-500">
                        Submitted: {formatDate(request.submittedDate)}
                      </p>
                    </div>
                    {request.status === "Pending" && (
                      <div className="space-x-2">
                        <button
                          onClick={() =>
                            handleStatusChange(
                              request.id,
                              "Approved",
                              "Request approved"
                            )
                          }
                          className="text-green-600 hover:text-green-800"
                        >
                          <FaCheckCircle size={20} />
                        </button>
                        <button
                          onClick={() =>
                            handleStatusChange(
                              request.id,
                              "Rejected",
                              "Request rejected"
                            )
                          }
                          className="text-red-600 hover:text-red-800"
                        >
                          <FaTimesCircle size={20} />
                        </button>
                      </div>
                    )}
                  </div>
                </li>
              ))}
            </ul>
          </div>
        )}
      </div>
    </div>
  );
};

export default RequestsPage;
