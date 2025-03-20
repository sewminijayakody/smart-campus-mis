// src/pages/ResourcesPage.tsx
import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaArrowAltCircleRight } from "react-icons/fa";
import axios from "axios";
import { useUser } from "../context/UserContext";

interface Request {
  id: number;
  resourceType: string;
  details: string;
  status: "Pending" | "Approved" | "Rejected";
  submittedDate: string;
  adminResponse?: string; // Optional admin response
}

const ResourcesPage = () => {
  const navigate = useNavigate();
  const { user } = useUser();
  const [requests, setRequests] = useState<Request[] | null>(null);
  const [newRequest, setNewRequest] = useState({
    resourceType: "",
    details: "",
  });
  const [loading, setLoading] = useState<boolean>(true);

  // Fetch user-specific requests from backend
  useEffect(() => {
    const fetchRequests = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get(
            `${import.meta.env.VITE_API_URL}/requests/user`,
            {
              headers: { Authorization: `Bearer ${token}` },
            }
          );
          setRequests(response.data);
        }
      } catch (error) {
        console.error("Error fetching user requests:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRequests();
  }, []);

  // Handle new request submission
  const handleSubmitRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const token = localStorage.getItem("token");
      if (token) {
        const response = await axios.post(
          `${import.meta.env.VITE_API_URL}/requests`,
          {
            resourceType: newRequest.resourceType,
            details: newRequest.details,
          },
          { headers: { Authorization: `Bearer ${token}` } }
        );
        setRequests((prev) =>
          prev ? [...prev, response.data] : [response.data]
        );
        setNewRequest({ resourceType: "", details: "" });
        console.log("New request submitted:", response.data);
      }
    } catch (error) {
      console.error("Error submitting request:", error);
    }
  };

  // Format the submittedDate to local time
  const formatLocalDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "numeric",
      hour12: true,
    });
  };

  const handleBack = () => {
    navigate(
      user?.role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard"
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Resource Request</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>
        <div className="space-y-6">
          {/* Request Form Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Submit a Request</h2>
            <form
              onSubmit={handleSubmitRequest}
              className="bg-[#E8E9E9] p-4 rounded-lg shadow-md border-2 border-gray-300 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Resource Type
                </label>
                <input
                  type="text"
                  value={newRequest.resourceType}
                  onChange={(e) =>
                    setNewRequest({
                      ...newRequest,
                      resourceType: e.target.value,
                    })
                  }
                  className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700 placeholder-gray-500"
                  placeholder="e.g., Textbook, Room, Equipment"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Details
                </label>
                <textarea
                  value={newRequest.details}
                  onChange={(e) =>
                    setNewRequest({ ...newRequest, details: e.target.value })
                  }
                  className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700 placeholder-gray-500"
                  placeholder="e.g., Request: Introduction to Algorithms E-Book"
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center space-x-1 bg-[#F97316] text-white px-4 py-2 rounded-lg hover:bg-[#EA580C] transition"
              >
                <span>Send Request</span>
                <FaArrowAltCircleRight className="text-sm" />
              </button>
            </form>
          </div>

          {/* Request Status Section */}
          <div>
            <h2 className="text-xl font-semibold mb-4">Your Requests</h2>
            <div className="bg-[#E8E9E9] p-4 rounded-lg shadow-md border-2 border-gray-300">
              {loading ? (
                <p className="text-sm text-gray-500">
                  Loading your requests...
                </p>
              ) : requests?.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No requests submitted yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {requests?.map((request) => (
                    <li key={request.id} className="text-sm text-gray-700">
                      <strong>{request.resourceType}</strong>: {request.details}{" "}
                      -
                      <span
                        className={`ml-2 ${
                          request.status === "Approved"
                            ? "text-green-600"
                            : request.status === "Rejected"
                            ? "text-red-600"
                            : "text-yellow-600"
                        }`}
                      >
                        {request.status}
                      </span>
                      {request.adminResponse && (
                        <span className="ml-2"> - {request.adminResponse}</span>
                      )}
                      <br />
                      (Submitted: {formatLocalDate(request.submittedDate)})
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResourcesPage;
