// src/components/StudentDashboard.tsx
import {
  FaUserCircle,
  FaUsers,
  FaCalendarAlt,
  FaBox,
  FaCloudUploadAlt,
  FaQuestionCircle,
} from "react-icons/fa";
import CourseDetails from "./CourseDetails";
import RecentNotifications from "./RecentNotifications";
import ViewAnnouncements from "./ViewAnnouncements";
import ScheduleSection from "./ScheduleSection";
import { useNavigate, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { useUser } from "../context/UserContext";
import axios from "axios";
import userImage from "../assets/images/Picture3.png";

const StudentDashboard = () => {
  const { user, setUser } = useUser();
  const studentName = user?.name || "Student";
  const navigate = useNavigate();
  const location = useLocation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const [registeredEvents, setRegisteredEvents] = useState<number[]>([]);
  const [imageUrl, setImageUrl] = useState<string | null>(
    localStorage.getItem("profileImageUrl") || user?.imageUrl || null
  );
  const [loading, setLoading] = useState(true);

  
  useEffect(() => {
    const fetchStudentData = async () => {
      const token = localStorage.getItem("token");
      if (!token) {
        navigate("/"); 
        return;
      }

      try {
        const res = await axios.get(
          "http://localhost:5000/api/student/dashboard",
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );
        const studentData = res.data.student;
        console.log("Fetched student data:", studentData); 
        setUser({
          id: studentData.id,
          role: studentData.role,
          name: studentData.name || "Student",
          course: studentData.course || "",
          startDate: studentData.startDate || "",
          endDate: studentData.endDate || "",
          email: studentData.email || "",
          phone: studentData.phone || "",
          address: studentData.address || "",
          imageUrl: studentData.imageUrl || null,
        });
        if (studentData.imageUrl) {
          setImageUrl(studentData.imageUrl);
          localStorage.setItem("profileImageUrl", studentData.imageUrl);
          console.log("Set imageUrl from backend:", studentData.imageUrl);
        }
      } catch (err) {
        console.error("Error fetching student data:", err);
        navigate("/"); 
      } finally {
        setLoading(false);
      }
    };

    fetchStudentData();
  }, [setUser, navigate]);

  useEffect(() => {
    const fetchRegisteredEvents = async () => {
      try {
        const token = localStorage.getItem("token");
        if (!token || !user?.id) {
          console.log("No token or user ID available for fetching registrations");
          return;
        }
        const response = await axios.get("http://localhost:5000/api/events/registrations", {
          headers: { Authorization: `Bearer ${token}` },
        });
        const userRegistrations = response.data;
        console.log("Fetched registered events from backend:", userRegistrations);
        setRegisteredEvents(userRegistrations);
        localStorage.setItem("registeredEvents", JSON.stringify(userRegistrations));
      } catch (error) {
        console.error("Error fetching registered events:", error);
      }
    };

    fetchRegisteredEvents();
  }, [user?.id]); 

  
  useEffect(() => {
    if (location.pathname === "/student-dashboard") {
      const state = location.state as {
        registeredEvents?: number[];
        updatedImageUrl?: string;
        selectedDate?: Date;
      };
      if (state?.selectedDate) {
        setSelectedDate(state.selectedDate);
      }
      if (state?.registeredEvents) {
        console.log("Setting registeredEvents from location state:", state.registeredEvents);
        setRegisteredEvents(state.registeredEvents);
        localStorage.setItem("registeredEvents", JSON.stringify(state.registeredEvents));
      } else {
        const savedRegistrations = localStorage.getItem("registeredEvents");
        if (savedRegistrations) {
          const parsedRegistrations = JSON.parse(savedRegistrations);
          console.log("Setting registeredEvents from localStorage:", parsedRegistrations);
          setRegisteredEvents(parsedRegistrations);
        }
      }
      if (state?.updatedImageUrl) {
        setImageUrl(state.updatedImageUrl);
        if (user) {
          setUser({
            ...user,
            imageUrl: state.updatedImageUrl,
          });
        }
        localStorage.setItem("profileImageUrl", state.updatedImageUrl);
        console.log("Set imageUrl from navigation state:", state.updatedImageUrl);
      } else {
        const storedImageUrl = localStorage.getItem("profileImageUrl");
        if (
          storedImageUrl &&
          (!user?.imageUrl || user.imageUrl !== storedImageUrl)
        ) {
          setImageUrl(storedImageUrl);
          if (user) {
            setUser({
              ...user,
              imageUrl: storedImageUrl,
            });
          }
          console.log("Set imageUrl from localStorage:", storedImageUrl);
        }
      }
    }
  }, [location, user, setUser]);

  const getGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return "Good Morning";
    if (hour < 18) return "Good Afternoon";
    return "Good Evening";
  };

  const handleScheduleClick = () => {
    navigate("/events", { state: { selectedDate, registeredEvents } });
  };

  const handleAdminUploadsClick = () => {
    navigate("/admin-uploads");
  };

  const handleResourcesClick = () => {
    navigate("/resources");
  };

  const handleHelpClick = () => {
    navigate("/help");
  };

  const handleUserProfileClick = () => {
    navigate("/user-profile");
  };

  const handleCollaborationClick = () => {
    if (!user || !user.id) {
      console.log("User data not ready, delaying navigation to /chat", { user });
      return; // Prevent navigation until user is ready
    }
    console.log("Navigating to /chat with user:", user);
    navigate("/chat");
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div className="min-h-screen flex flex-col items-start p-6 bg-white text-black relative">
      <div className="ml-12 z-10">
        <h1 className="text-4xl mb-6 mt-10">
          {getGreeting()}, {studentName}!
        </h1>
        <div className="flex space-x-3 mb-6">
          <button
            key={imageUrl || user?.imageUrl}
            onClick={handleUserProfileClick}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition relative"
          >
            {imageUrl || user?.imageUrl ? (
              <img
                src={imageUrl || user?.imageUrl || userImage}
                alt="User"
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => console.error("Profile image load error:", e)}
              />
            ) : (
              <FaUserCircle className="text-xl" />
            )}
          </button>
          <button
            onClick={handleCollaborationClick}
            className="flex items-center space-x-1 px-3 py-1 bg-[#d6e4f4] text-black rounded-full shadow-md hover:scale-105 transition"
          >
            <FaUsers className="text-sm" />
            <span className="text-xs font-medium">Collaboration</span>
          </button>
          <button
            onClick={handleScheduleClick}
            className="flex items-center space-x-1 px-3 py-1 bg-[#d6e4f4] text-black rounded-full shadow-md hover:scale-105 transition"
          >
            <FaCalendarAlt className="text-sm" />
            <span className="text-xs font-medium">Event</span>
          </button>
          <button
            onClick={handleResourcesClick}
            className="flex items-center space-x-1 px-3 py-1 bg-[#d6e4f4] text-black rounded-full shadow-md hover:scale-105 transition"
          >
            <FaBox className="text-sm" />
            <span className="text-xs font-medium">Resources</span>
          </button>
          <button
            onClick={handleAdminUploadsClick}
            className="flex items-center space-x-1 px-3 py-1 bg-[#d6e4f4] text-black rounded-full shadow-md hover:scale-105 transition"
          >
            <FaCloudUploadAlt className="text-xl" />
            <span className="text-xs font-medium">Admin Uploads</span>
          </button>
          <button
            onClick={handleHelpClick}
            className="flex items-center space-x-1 px-3 py-1 bg-[#d6e4f4] text-black rounded-full shadow-md hover:scale-105 transition"
          >
            <FaQuestionCircle className="text-sm" />
            <span className="text-xs font-medium">Help</span>
          </button>
        </div>
      </div>

      <div className="flex w-full space-x-6 mt-auto">
        <div className="flex-1">
          <CourseDetails />
          <div className="flex w-full mt-4 space-x-6">
            <div className="w-[350px]">
              <RecentNotifications />
            </div>
            <div className="flex-1">
              <ViewAnnouncements />
            </div>
          </div>
        </div>
      </div>

      <div className="absolute top-24 right-12 w-[400px] mt-0 z-0">
        <ScheduleSection
          selectedDate={selectedDate}
          setSelectedDate={setSelectedDate}
          registeredEvents={registeredEvents}
        />
      </div>
    </div>
  );
};

export default StudentDashboard;