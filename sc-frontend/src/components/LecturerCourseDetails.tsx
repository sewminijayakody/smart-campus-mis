// src/components/LecturerCourseDetails.tsx
import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import courseImage from "../assets/images/Picture5.png";

const LecturerCourseDetails = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const handleViewCoursework = () => {
    navigate("/lecturer-coursework"); // Navigate to CoursePage
  };

  const handleScheduleClasses = () => {
    navigate("/schedule-classes"); // Navigate to a page for scheduling classes (adjust route as needed)
  };

  return (
    <div className="bg-gray-100 rounded-lg shadow-md p-4 w-[880px] h-[280px] flex justify-between items-start ml-13 mt-12 relative">
      {/* Left Side Content */}
      <div className="flex flex-col relative z-10" style={{ maxWidth: 'calc(100% - 130px)' }}>
        {/* Course Title (Positioned Over Image) */}
        <h2 className="text-3xl font-semibold text-gray-800 mb-0 relative z-20 break-words">
          {user?.course || "Loading Course..."}
        </h2>

        {/* Module Name (Directly Under Course Title) */}
        <p className="text-lg text-gray-600 mt-2 relative z-20 break-words">
          Module: {user?.module || "Loading Module..."}
        </p>

        {/* Buttons (Horizontally Aligned) */}
        <div className="flex gap-4 mt-28">
          <button
            onClick={handleViewCoursework}
            className="bg-orange-500 text-white px-3 py-1 text-sm rounded-lg w-38 h-7"
          >
            View Coursework
          </button>
          <button
            onClick={handleScheduleClasses}
            className="bg-blue-500 text-white px-3 py-1 text-sm rounded-lg w-38 h-7"
          >
            Schedule Classes
          </button>
        </div>
      </div>

      {/* Right Side Image */}
      <img
        src={courseImage}
        alt="Course"
        className="w-90 h-84 mt-[-28px] -mr-6 absolute right-0 top-0 transform translate-x-6 translate-y-[-10px] rounded-lg"
      />
    </div>
  );
};

export default LecturerCourseDetails;