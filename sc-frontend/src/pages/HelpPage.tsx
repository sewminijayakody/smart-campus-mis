// src/pages/HelpPage.tsx
import { useState, useEffect } from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { FaArrowLeft, FaArrowAltCircleRight } from "react-icons/fa";
import { useUser } from "../context/UserContext";
import dayjs from "dayjs";

interface Inquiry {
  id: number;
  subject: string;
  message: string;
  status: "Pending" | "Resolved" | "Replied";
  submittedDate: string;
  user_id: number;
  adminReply?: string;
}

const HelpPage = () => {
  const navigate = useNavigate();
  const { user, setUser, loading } = useUser();
  const [inquiries, setInquiries] = useState<Inquiry[] | null>(null);
  const [newInquiry, setNewInquiry] = useState({ subject: "", message: "" });
  const [authFailed, setAuthFailed] = useState(false);

  useEffect(() => {
    const fetchInquiries = async () => {
      if (!user || !user.id || loading) {
        console.log("User or loading not ready yet:", user, loading);
        return;
      }

      try {
        const token = localStorage.getItem("token");
        if (!token) {
          console.error("No token found in localStorage");
          setAuthFailed(true);
          return;
        }
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
          const errorText = await response.text();
          console.error(
            `HTTP error! status: ${response.status}, response: ${errorText}`
          );
          if (response.status === 401 || response.status === 403) {
            setAuthFailed(true);
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            setUser(null);
            return;
          }
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        console.log("Fetched inquiries data:", data);
        const userInquiries = data.filter(
          (inq: Inquiry) => inq.user_id === user.id
        );
        setInquiries(userInquiries.length > 0 ? userInquiries : []);
      } catch (error: unknown) {
        if (error instanceof Error) {
          console.error("Error fetching inquiries:", error);
        } else {
          console.error("Unknown error fetching inquiries:", error);
        }
        setInquiries([]);
      }
    };
    fetchInquiries();

    // Add interval to update relative time every minute
    const interval = setInterval(() => {
      setInquiries((prev) => (prev ? [...prev] : prev)); // Trigger re-render to update time
    }, 60000); // Update every 60 seconds

    return () => clearInterval(interval); // Cleanup interval on unmount
  }, [user, setUser, loading]);

  const handleSubmitInquiry = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user?.id) {
      alert("Please log in to submit an inquiry!");
      return;
    }

    const newInquiryItem = {
      subject: newInquiry.subject,
      message: newInquiry.message,
      status: "Pending" as const,
      submittedDate: dayjs().format("YYYY-MM-DD HH:mm:ss"),
    };

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        throw new Error("No token found");
      }
      const response = await fetch(
        `${import.meta.env.VITE_API_URL}/inquiries`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify(newInquiryItem),
        }
      );
      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(
          `HTTP error! status: ${response.status}, message: ${
            errorData.error || "Unknown error"
          }`
        );
      }
      const data = await response.json();
      setInquiries((prev) => (prev ? [...prev, data] : [data]));
      setNewInquiry({ subject: "", message: "" });
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error("Error submitting inquiry:", error);
        alert(`Failed to submit inquiry: ${error.message}`);
      } else {
        console.error("Unknown error submitting inquiry:", error);
        alert("Failed to submit inquiry: An unknown error occurred");
      }
    }
  };

  const handleBack = () => {
    navigate(
      user?.role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard"
    );
    console.log(
      "Navigating to",
      user?.role === "lecturer" ? "/lecturer-dashboard" : "/student-dashboard"
    );
  };

  // Function to format the submittedDate to a relative time string using dayjs
  const formatRelativeTime = (date: string | undefined) => {
    if (!date || !dayjs(date).isValid()) return "Invalid Date";

    const now = dayjs();
    const submitted = dayjs(date);
    const diffMinutes = now.diff(submitted, "minute");
    const diffHours = now.diff(submitted, "hour");
    const diffDays = now.diff(submitted, "day");

    if (diffMinutes < 60) {
      return `${diffMinutes} minute${diffMinutes !== 1 ? "s" : ""} ago`;
    } else if (diffHours < 24) {
      return `${diffHours} hour${diffHours !== 1 ? "s" : ""} ago`;
    } else if (diffDays < 30) {
      return `${diffDays} day${diffDays !== 1 ? "s" : ""} ago`;
    } else {
      return submitted.format("D MMM YYYY, HH:mm");
    }
  };

  if (authFailed) {
    return <Navigate to="/" replace />;
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6 text-black">Loading...</div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Help & Support</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
            aria-label="Back to Student Dashboard"
          >
            <FaArrowLeft />
          </button>
        </div>
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-4">Submit an Inquiry</h2>
            <form
              onSubmit={handleSubmitInquiry}
              className="bg-[#E8E9E9] p-4 rounded-lg shadow-md border-2 border-gray-300 space-y-4"
            >
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Subject
                </label>
                <input
                  type="text"
                  value={newInquiry.subject}
                  onChange={(e) =>
                    setNewInquiry({ ...newInquiry, subject: e.target.value })
                  }
                  className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700 placeholder-gray-500"
                  placeholder="e.g., Login Issue, Dashboard Issue"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Message
                </label>
                <textarea
                  value={newInquiry.message}
                  onChange={(e) =>
                    setNewInquiry({ ...newInquiry, message: e.target.value })
                  }
                  className="mt-1 p-2 w-full border rounded-lg bg-[#D9D9D9] text-gray-700 placeholder-gray-500"
                  placeholder="Describe your inquiry..."
                  required
                />
              </div>
              <button
                type="submit"
                className="flex items-center bg-[#F97316] text-white px-4 py-2 rounded-lg hover:bg-[#EA580C] transition"
              >
                <span>Send Inquiry</span>
                <FaArrowAltCircleRight className="ml-1 text-sm" />
              </button>
            </form>
          </div>

          <div>
            <h2 className="text-xl font-semibold mb-4">Your Inquiries</h2>
            <div className="bg-[#E8E9E9] p-4 rounded-lg shadow-md border-2 border-gray-300">
              {inquiries?.length === 0 ? (
                <p className="text-sm text-gray-500">
                  No inquiries submitted yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {inquiries?.map((inquiry) => (
                    <li key={inquiry.id} className="text-sm text-gray-700">
                      <strong>{inquiry.subject}</strong> - {inquiry.status}{" "}
                      (Submitted: {formatRelativeTime(inquiry.submittedDate)})
                      {inquiry.adminReply && (
                        <p className="mt-1 text-sm text-gray-700">
                          Admin Reply: {inquiry.adminReply}
                        </p>
                      )}
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

export default HelpPage;
