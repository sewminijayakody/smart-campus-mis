// src/components/ViewAnnouncements.tsx
import { FaBullhorn, FaArrowRight } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import { useState, useEffect } from "react";
import io from "socket.io-client";
import axios from "axios";

// Define the Announcement interface for the frontend
interface Announcement {
  id: number;
  message: string;
  date: string;
}

// Define the backend response interface for type safety
interface BackendAnnouncement {
  id: number;
  message: string;
  sent_at: string;
  sender_name: string;
}

const socket = io("http://localhost:5000", {
  withCredentials: true,
  extraHeaders: {
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});

const ViewAnnouncements = () => {
  const navigate = useNavigate();
  const [recentAnnouncement, setRecentAnnouncement] = useState<Announcement | null>(null);

  // Fetch the most recent announcement from backend
  useEffect(() => {
    const fetchRecentAnnouncement = async () => {
      try {
        const token = localStorage.getItem("token");
        if (token) {
          const response = await axios.get<BackendAnnouncement[]>("http://localhost:5000/api/announcements", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const announcements = response.data;
          console.log("Fetched announcements for ViewAnnouncements:", announcements); // Debug log

          if (announcements.length > 0) {
            // Sort by sent_at in descending order (newest first)
            const sortedAnnouncements = announcements.sort(
              (a, b) => new Date(b.sent_at).getTime() - new Date(a.sent_at).getTime()
            );
            const latest = sortedAnnouncements[0];
            console.log("Most recent announcement:", latest); // Debug log

            setRecentAnnouncement({
              id: latest.id,
              message: latest.message,
              date: new Date(latest.sent_at).toLocaleDateString("en-US", {
                month: "short",
                day: "numeric",
                year: "numeric",
              }),
            });
          } else {
            console.log("No announcements found.");
            setRecentAnnouncement({
              id: 0,
              message: "No announcements available.",
              date: "",
            });
          }
        }
      } catch (err) {
        console.error("Error fetching recent announcement:", err);
        setRecentAnnouncement({
          id: 0,
          message: "Error loading announcement.",
          date: "",
        });
      }
    };
    fetchRecentAnnouncement();
  }, []);

  // Handle WebSocket updates
  useEffect(() => {
    socket.on("receiveAnnouncement", (data: BackendAnnouncement) => {
      console.log("Received new announcement via WebSocket:", data); // Debug log
      setRecentAnnouncement({
        id: data.id,
        message: data.message,
        date: new Date(data.sent_at).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
      });
    });

    return () => {
      socket.off("receiveAnnouncement");
    };
  }, []);

  // Display a loading state if recentAnnouncement is null
  if (!recentAnnouncement) {
    return (
      <div className="bg-white rounded-xl w-[545px] mt-5 ml-1 overflow-hidden">
        <div className="p-4 bg-[#C3E7B1]">
          <div className="flex justify-between items-center mb-3">
            <h2 className="text-lg font-bold text-gray-800">View Announcements</h2>
            <FaBullhorn className="text-xl text-gray-600" />
          </div>
          <div>Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-xl w-[545px] mt-5 ml-1 overflow-hidden">
      {/* Main Announcement Content */}
      <div className="p-4 bg-[#C3E7B1]">
        {/* Title with Bullhorn Icon */}
        <div className="flex justify-between items-center mb-3">
          <h2 className="text-lg font-bold text-gray-800">View Announcements</h2>
          <FaBullhorn className="text-xl text-gray-600" />
        </div>

        {/* Recent Announcement */}
        <div className="flex items-start">
          {/* Orange Color Point */}
          <div className="w-2 h-2 bg-[#E63D37] rounded-full mt-2 mr-3"></div>

          {/* Announcement Text */}
          <div>
            <div className="text-md font-semibold text-gray-800">
              {recentAnnouncement.message}
            </div>
            {recentAnnouncement.date && (
              <p className="text-xs text-gray-600 mt-1">📅 {recentAnnouncement.date}</p>
            )}
          </div>
        </div>
      </div>

      {/* Subtle Highlight Line */}
      <div className="border-t border-blue-300"></div>

      {/* "See More" Section */}
      <div
        className="bg-[#daffc7] p-3 flex justify-end items-center cursor-pointer hover:bg-gray-200"
        onClick={() => navigate("/announcements")}
      >
        <span className="text-blue-500 text-sm font-semibold mr-2">See More</span>
        <FaArrowRight className="text-blue-500 text-sm" />
      </div>
    </div>
  );
};

export default ViewAnnouncements;