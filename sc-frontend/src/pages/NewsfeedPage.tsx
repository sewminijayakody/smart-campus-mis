// src/pages/NewsfeedPage.tsx
import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import axios from "axios";

const NewsfeedPage = () => {
  const navigate = useNavigate();
  const [option, setOption] = useState<"notification" | "announcement" | null>(null);
  const [message, setMessage] = useState("");
  const [recipientId, setRecipientId] = useState<number | null>(null);
  const [users, setUsers] = useState<{ id: number; name: string; role: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [deliveryFeedback, setDeliveryFeedback] = useState<string[]>([]); // New state for delivery feedback

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get("http://localhost:5000/api/users", {
            headers: { Authorization: `Bearer ${token}` },
          });
          setUsers(response.data.users);
        }
      } catch (err) {
        console.error("Error fetching users:", err);
      }
    };
    fetchUsers();
  }, []);

  const handleBack = () => navigate("/admin-dashboard");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setDeliveryFeedback([]); // Reset feedback

    try {
      const token = localStorage.getItem("token");
      if (token) {
        if (option === "notification") {
          const response = await axios.post(
            "http://localhost:5000/api/notifications",
            {
              message,
              recipientId: recipientId || null,
              type: "Administrator",
            },
            { headers: { Authorization: `Bearer ${token}` } }
          );
          // Process delivery feedback
          const feedback = response.data.deliveryResults.map((result: any, index: number) => {
            const emailStatus = result.emailResult.emailSent !== false ? 'Email sent successfully' : `Email failed: ${result.emailResult.emailError}`;
            const smsStatus = result.smsResult.smsSent !== false ? 'SMS sent successfully' : `SMS failed: ${result.smsResult.smsError}`;
            return `Recipient ${index + 1}: ${emailStatus}, ${smsStatus}`;
          });
          setDeliveryFeedback(feedback);
        } else if (option === "announcement") {
          await axios.post(
            "http://localhost:5000/api/announcements",
            { message },
            { headers: { Authorization: `Bearer ${token}` } }
          );
        }
        setMessage("");
        setRecipientId(null);
        setOption(null);
        alert(`${option === "notification" ? "Notification" : "Announcement"} sent successfully!`);
      }
    } catch (err) {
      console.error(`Error sending ${option}:`, err);
      setError(`Failed to send ${option}. Please try again.`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-2xl mx-auto bg-white p-6 rounded-lg shadow-md">
        <div className="flex items-center mb-6">
          <button
            onClick={handleBack}
            className="bg-orange-500 text-white p-2 rounded-full hover:bg-orange-600"
          >
            <FaArrowLeft />
          </button>
          <h2 className="text-2xl font-semibold ml-4">Newsfeed Management</h2>
        </div>

        {/* Dropdown Selection */}
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Select Option:
          </label>
          <select
            value={option || ""}
            onChange={(e) =>
              setOption(e.target.value as "notification" | "announcement" | null)
            }
            className="w-full p-2 border rounded-lg bg-gray-100"
          >
            <option value="" disabled>Select an option</option>
            <option value="notification">Send Notification</option>
            <option value="announcement">Send Announcement</option>
          </select>
        </div>

        {option && (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Message:
              </label>
              <textarea
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="w-full p-2 border rounded-lg"
                rows={4}
                required
              />
            </div>

            {option === "notification" && (
              <div>
                <label className="block text-sm font-medium text-gray-700">
                  Send To:
                </label>
                <select
                  value={recipientId || ""}
                  onChange={(e) => setRecipientId(e.target.value ? parseInt(e.target.value) : null)}
                  className="w-full p-2 border rounded-lg bg-gray-100"
                >
                  <option value="">All Users</option>
                  {users.map((user) => (
                    <option key={user.id} value={user.id}>
                      {user.name} ({user.role})
                    </option>
                  ))}
                </select>
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-500 text-white p-2 rounded-lg hover:bg-blue-600 disabled:bg-blue-300"
            >
              {loading ? "Sending..." : option === "notification" ? "Send Notification" : "Send Announcement"}
            </button>
            {error && <p className="text-red-500 text-sm">{error}</p>}
            {deliveryFeedback.length > 0 && (
              <div className="mt-4">
                <h3 className="text-sm font-medium text-gray-700">Delivery Feedback:</h3>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {deliveryFeedback.map((feedback, index) => (
                    <li key={index}>{feedback}</li>
                  ))}
                </ul>
              </div>
            )}
          </form>
        )}
      </div>
    </div>
  );
};

export default NewsfeedPage;