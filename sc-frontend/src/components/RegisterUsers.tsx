import React, { useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa"; // Import arrow icon for back button

// Define the type for courses
interface CourseModules {
  [key: string]: string[];
}

const RegisterUsers: React.FC = () => {
  const [formData, setFormData] = useState({
    name: "",
    username: "",
    password: "",
    email: "",
    role: "student",
    course: "",
    module: "",
    startDate: "",
    endDate: "",
    phone: "", // Default to empty, will enforce E.164 format
    address: "",
    image: null as File | null,
  });
  const [message, setMessage] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [phoneError, setPhoneError] = useState("");
  const navigate = useNavigate();

  const courses: CourseModules = {
    "BSc (Hons) in Data Science (TOP UP) – London Met University (UK)": [
      "Artificial Intelligence and Machine Learning",
      "Project Analysis and Practice",
      "Big Data and Visualisation",
    ],
    "British Fashion Degree": [
      "Computer Aided Design",
      "Fashion and Textile Practices",
      "Pattern Cutting and Garment Making",
    ],
    "British Hospitality Management Degree": [
      "The Contemporary Hospitality Industry",
      "Managing the Customer Experience",
      "Professional Identity and Practice",
    ],
    "British Travel & Tourism Management Degree": [
      "Managing Conference and Events",
      "The Contemporary Travel & Tourism Industry",
      "Managing the Customer Experience",
    ],
  };

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    if (name === "phone") {
      validatePhone(value);
    }

    if (name === "course" && formData.role === "lecturer") {
      setFormData((prev) => ({ ...prev, module: "" }));
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (files && files.length > 0) {
      setFormData((prev) => ({ ...prev, image: files[0] }));
    } else {
      setFormData((prev) => ({ ...prev, image: null }));
    }
  };

  const validatePhone = (phone: string) => {
    // Regular expression for E.164 format (e.g., +94XXXXXXXXX where X is 9 digits)
    const e164Pattern = /^\+94\d{9}$/;
    if (!phone) {
      setPhoneError("");
      return true;
    }
    if (!e164Pattern.test(phone)) {
      setPhoneError(
        "Phone must be in E.164 format (e.g., +94715151949 for Sri Lanka)."
      );
      return false;
    }
    setPhoneError("");
    return true;
  };

  const validatePassword = (password: string) => {
    const minLength = 8;
    const hasLetter = /[a-zA-Z]/.test(password);
    const hasNumber = /\d/.test(password);
    const hasSymbol = /[!@#$%^&*(),.?":{}|<>]/.test(password);

    if (password.length < minLength || !hasLetter || !hasNumber || !hasSymbol) {
      setPasswordError(
        "Password must be at least 8 characters long and include letters, numbers, and symbols."
      );
      return false;
    }
    setPasswordError("");
    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validatePassword(formData.password)) return;

    const isPhoneValid = validatePhone(formData.phone);
    if (!isPhoneValid) return;

    const formDataToSend = new FormData();
    Object.entries(formData).forEach(([key, value]) => {
      if (key === "image" && value) {
        formDataToSend.append("image", value);
      } else if (value !== null) {
        formDataToSend.append(key, value);
      }
    });

    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setMessage("You must be logged in to register users.");
        return;
      }
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/auth/register`,
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );
      setMessage(res.data.message);
      setFormData({
        name: "",
        username: "",
        password: "",
        email: "",
        role: "student",
        course: "",
        module: "",
        startDate: "",
        endDate: "",
        phone: "", // Reset to empty
        address: "",
        image: null,
      });
      setPasswordError("");
      setPhoneError("");
    } catch (err: any) {
      setMessage(err.response?.data?.message || "Error registering user");
    }
  };

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  const showDates = formData.role === "student";
  const showModule = formData.role === "lecturer";

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="flex justify-between items-start mb-6">
        <h1 className="ml-100 text-2xl font-bold text-gray-800">
          Register New User
        </h1>
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
        >
          <FaArrowLeft />
        </button>
      </div>
      <div className="bg-[#E8E9E9] p-6 rounded shadow-md max-w-2xl mx-auto">
        {message && (
          <p
            className={`mb-4 ${
              message.includes("successfully")
                ? "text-green-500"
                : "text-red-500"
            }`}
          >
            {message}
          </p>
        )}
        {passwordError && <p className="mb-4 text-red-500">{passwordError}</p>}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="mb-4">
            <label className="block text-gray-700">Name</label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Username</label>
            <input
              type="text"
              name="username"
              value={formData.username}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Password</label>
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Email</label>
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Role</label>
            <select
              name="role"
              value={formData.role}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="student">Student</option>
              <option value="lecturer">Lecturer</option>
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Course</label>
            <select
              name="course"
              value={formData.course}
              onChange={handleChange}
              className="w-full p-2 border rounded"
              required
            >
              <option value="">Select a course</option>
              {Object.keys(courses).map((course) => (
                <option key={course} value={course}>
                  {course}
                </option>
              ))}
            </select>
          </div>
          {showModule && (
            <div className="mb-4">
              <label className="block text-gray-700">Module</label>
              <select
                name="module"
                value={formData.module}
                onChange={handleChange}
                className="w-full p-2 border rounded"
                required
              >
                <option value="">Select a module</option>
                {formData.course &&
                  courses[formData.course].map((module: string) => (
                    <option key={module} value={module}>
                      {module}
                    </option>
                  ))}
              </select>
            </div>
          )}
          {showDates && (
            <>
              <div className="mb-4">
                <label className="block text-gray-700">Start Date</label>
                <input
                  type="date"
                  name="startDate"
                  value={formData.startDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
              <div className="mb-4">
                <label className="block text-gray-700">End Date</label>
                <input
                  type="date"
                  name="endDate"
                  value={formData.endDate}
                  onChange={handleChange}
                  className="w-full p-2 border rounded"
                />
              </div>
            </>
          )}
          <div className="mb-4">
            <label className="block text-gray-700">Phone</label>
            <input
              type="tel"
              name="phone"
              value={formData.phone}
              onChange={handleChange}
              placeholder="+94715151949"
              className="w-full p-2 border rounded"
              pattern="^\+94\d{9}$" // HTML5 pattern for E.164 format
              title="Please enter a valid phone number in E.164 format (e.g., +94715151949)"
              required
            />
            {phoneError && (
              <p className="text-red-500 text-sm mt-1">{phoneError}</p>
            )}
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Address</label>
            <textarea
              name="address"
              value={formData.address}
              onChange={handleChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-700">Image</label>
            <input
              type="file"
              accept="image/*"
              onChange={handleFileChange}
              className="w-full p-2 border rounded"
            />
          </div>
          <button
            type="submit"
            className="w-full bg-[#FF7700] text-white p-2 rounded hover:bg-blue-600"
          >
            Register User
          </button>
        </form>
      </div>
    </div>
  );
};

export default RegisterUsers;
