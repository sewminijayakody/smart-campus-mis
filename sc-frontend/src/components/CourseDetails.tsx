import { useUser } from "../context/UserContext";
import { useNavigate } from "react-router-dom";
import courseImage from "../assets/images/course-image.png";

const CourseDetails = () => {
  const { user } = useUser();
  const navigate = useNavigate();

  const handleViewCoursework = () => {
    navigate("/course"); // Navigate to CoursePage
  };

  const handleClasses = () => {
    navigate("/schedule"); // Navigate to a page for scheduling classes (adjust route as needed)
  };


  return (
    <div className="bg-gray-100 rounded-lg shadow-md p-4 w-[880px] h-[280px] flex justify-between items-start ml-13 mt-12 relative">
      {/* Left Side Content */}
      <div className="flex flex-col relative z-10" style={{ maxWidth: 'calc(100% - 130px)' }}>
        {/* Course Title (Positioned Over Image) */}
        <h2 className="text-3xl font-semibold text-gray-800 mb-0 relative z-20 break-words">
          {user?.course || "Loading Course..."}
        </h2>

        {/* Start & End Dates (Directly Under Title, No Extra Gap) */}
        <div className="flex gap-3 mt-4">
          <span className="bg-[#344966] text-white px-4 py-1 rounded-lg text-sm">
            Start Date - {user?.startDate || "N/A"}
          </span>
          <span className="bg-[#B4CDED] text-black px-4 py-1 rounded-lg text-sm">
            End Date - {user?.endDate || "N/A"}
          </span>
        </div>

        <div className="flex gap-4 mt-28">
        <button
          onClick={handleViewCoursework}
          className="bg-orange-500 text-white px-3 py-1 text-sm rounded-lg w-38 h-7"
        >
          View Coursework
        </button>
        <button
            onClick={handleClasses}
            className="bg-blue-500 text-white px-3 py-1 text-sm rounded-lg w-38 h-7"
          >
            Classes
          </button>

          </div>
      </div>

      {/* Right Side Image */}
      <img
        src={courseImage}
        alt="Course"
        className="w-102 h-84 mt-[-36px] -mr-12 absolute right-0 top-0 transform translate-x-6 translate-y-[-10px] rounded-lg"
      />
    </div>
  );
};

export default CourseDetails;