import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaReply } from "react-icons/fa";
import dayjs from "dayjs";

interface Inquiry {
  id: number;
  subject: string;
  message: string;
  status: "Pending" | "Resolved" | "Replied";
  submittedDate: string;
  adminReply?: string;
  user_id: number;
}

interface User {
  id: number;
  name: string;
}

const AdminInquiryPage = () => {
  const navigate = useNavigate();
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedInquiry, setSelectedInquiry] = useState<Inquiry | null>(null);
  const [response, setResponse] = useState<string>("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchInquiries = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const response = await fetch(
          `${import.meta.env.VITE_API_URL}/inquiries`,
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched inquiries:", data);
        setInquiries(data);
      } catch (error) {
        console.error("Error fetching inquiries:", error);
        setInquiries([]); // Fallback to empty array
      } finally {
        setLoading(false);
      }
    };

    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token) throw new Error("No token found");
        const response = await fetch(`${import.meta.env.VITE_API_URL}/users`, {
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
        });
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched users:", data);
        setUsers(data.users || []);
      } catch (error) {
        console.error("Error fetching users:", error);
        setUsers([]);
      }
    };

    fetchInquiries();
    fetchUsers();
  }, []);

  const handleSelectInquiry = (inquiry: Inquiry) => {
    setSelectedInquiry(inquiry);
    setResponse(inquiry.adminReply || "");
  };

  const handleSubmitResponse = async () => {
    if (!selectedInquiry) return;

    const responseData = {
      response,
    };

    try {
      const token = localStorage.getItem("token");
      const res = await fetch(
        `${import.meta.env.VITE_API_URL}/inquiries/${
          selectedInquiry.id
        }/respond`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`, // Add token here too
          },
          body: JSON.stringify(responseData),
        }
      );

      if (res.ok) {
        setInquiries(
          (prevInquiries) =>
            prevInquiries?.map((inquiry) =>
              inquiry.id === selectedInquiry.id
                ? { ...inquiry, status: "Replied", adminReply: response }
                : inquiry
            ) || []
        );
        setSelectedInquiry(null);
        setResponse("");
        alert("Response submitted successfully!");
      }
    } catch (error) {
      console.error("Error submitting response:", error);
    }
  };

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  const getUserName = (userId: number | undefined | null) => {
    if (!userId) return "Unknown User";
    const user = users.find((u) => u.id === userId);
    return user ? user.name : `User ${userId}`;
  };

  const formatDate = (date: string | undefined) => {
    if (!date || !dayjs(date).isValid()) return "Invalid Date";
    return dayjs(date).format("DD/MM/YYYY");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-black">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Admin - Inquiries</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>

        <div className="space-y-6">
          <h2 className="text-xl font-semibold mb-4">Pending Inquiries</h2>
          <div className="bg-[#E8E9E9] p-4 rounded-lg shadow-md border-2 border-gray-300">
            {inquiries?.length === 0 ? (
              <p className="text-sm text-gray-500">No pending inquiries.</p>
            ) : (
              <ul className="space-y-4">
                {inquiries?.map((inquiry) => (
                  <li
                    key={inquiry.id}
                    className={`p-4 border-2 rounded-md ${
                      inquiry.status === "Pending"
                        ? "border-yellow-400"
                        : "border-green-400"
                    }`}
                    onClick={() => handleSelectInquiry(inquiry)}
                  >
                    <h3 className="font-semibold">{inquiry.subject}</h3>
                    <p>{inquiry.status}</p>
                    <p className="text-sm text-gray-500">
                      Submitted: {formatDate(inquiry.submittedDate)} by{" "}
                      {getUserName(inquiry.user_id)}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>

          {selectedInquiry && (
            <div className="mt-8 bg-white p-6 rounded-lg shadow-md border-2 border-gray-300">
              <h3 className="text-xl font-semibold mb-4">Inquiry Details</h3>
              <div>
                <p>
                  <strong>Subject:</strong> {selectedInquiry.subject}
                </p>
                <p className="mt-2">
                  <strong>Message:</strong> {selectedInquiry.message}
                </p>
                <p className="mt-2">
                  <strong>Submitted by:</strong>{" "}
                  {getUserName(selectedInquiry.user_id)}
                </p>
                <div className="mt-4">
                  <label className="block text-sm font-medium text-gray-700">
                    Admin Response
                  </label>
                  <textarea
                    value={response}
                    onChange={(e) => setResponse(e.target.value)}
                    className="mt-2 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700 placeholder-gray-500"
                    placeholder="Write your response..."
                  />
                </div>
                <button
                  onClick={handleSubmitResponse}
                  className="mt-4 bg-[#FF7700] text-white px-6 py-2 rounded-lg hover:bg-[#EA580C] transition"
                >
                  <FaReply className="inline mr-2" />
                  Respond
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminInquiryPage;
