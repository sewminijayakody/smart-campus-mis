import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPen, FaCamera, FaSignOutAlt } from "react-icons/fa"; // Added FaSignOutAlt for logout icon
import userImage from "../assets/images/Picture3.png";
import { useUser } from "../context/UserContext";
import axios from "axios";

const LecturerProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [formData, setFormData] = useState({
    name: user?.name || "",
    email: user?.email || "",
    phone: user?.phone || "",
    address: user?.address || "",
    course: user?.course || "",
    module: user?.module || "",
  });
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (!user || user.role !== "lecturer") {
      navigate("/");
    } else {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
        course: user.course || "",
        module: user.module || "",
      });
      setPreviewImage(user.imageUrl || userImage);
      console.log("LecturerProfilePage: Initial render - user:", user, "previewImage:", previewImage);
    }
  }, [user, navigate]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(file);
        setPreviewImage(reader.result as string);
        console.log("LecturerProfilePage: Image selected - data URL:", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const token = localStorage.getItem("token");
    if (!token) {
      setError("Authentication token not found. Please log in again.");
      return;
    }

    const data = new FormData();
    data.append("name", formData.name);
    data.append("email", formData.email);
    data.append("phone", formData.phone);
    data.append("address", formData.address);
    data.append("course", formData.course);
    data.append("module", formData.module);
    if (selectedImage) {
      data.append("image", selectedImage);
    }

    try {
      const response = await axios.put(
        "http://localhost:5000/api/lecturer/profile",
        data,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = response.data.lecturer;
      setUser({ ...user!, ...updatedUser });
      if (updatedUser.imageUrl) {
        localStorage.setItem("profileImageUrl", updatedUser.imageUrl);
        setPreviewImage(updatedUser.imageUrl);
      }
      setSuccess("Profile updated successfully!");
      setTimeout(() => {
        navigate("/lecturer-dashboard", {
          state: { updatedImageUrl: updatedUser.imageUrl },
        });
      }, 1000);
    } catch (err: any) {
      console.error("Error updating profile:", err);
      setError(err.response?.data?.error || "Failed to update profile.");
    }
  };

  const handleBack = () => {
    navigate("/lecturer-dashboard");
  };

  // Logout functionality
  const handleLogout = () => {
    // Clear localStorage
    localStorage.removeItem('token');
    localStorage.removeItem('role');
    localStorage.removeItem('course');
    localStorage.removeItem('module');
    localStorage.removeItem('profileImageUrl');

    // Reset user context
    setUser(null);

    // Redirect to login page
    navigate("/", { replace: true });
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Lecturer Profile</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>
        {user ? (
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-300 flex">
            <div className="mr-6 relative flex flex-col items-center">
              <img
                src={previewImage || user.imageUrl || userImage}
                alt="Lecturer Profile"
                className="w-24 h-24 rounded-full border-2 border-blue-300 cursor-pointer"
                onClick={handleImageClick}
                style={{ position: "relative" }}
                onError={(e) => console.error("Image load error:", e)}
              />
              <button
                onClick={handleImageClick}
                className="absolute top-0 right-0 bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center hover:bg-blue-600 transition"
                style={{ zIndex: 10 }}
              >
                <FaPen className="text-xs" />
              </button>
              <input
                type="file"
                accept="image/*"
                ref={fileInputRef}
                onChange={handleImageChange}
                className="hidden"
              />
              {selectedImage && (
                <button
                  onClick={handleSubmit}
                  className="mt-2 flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
                >
                  <FaCamera className="text-sm" />
                  <span>Upload Image</span>
                </button>
              )}
              <p className="text-sm text-gray-700 mt-2">{user.name}</p>
              <p className="text-sm text-gray-500 mt-1">Lecturer</p>
              {/* Logout Button */}
              <button
                onClick={handleLogout}
                className="mt-4 flex items-center space-x-1 bg-red-500 text-white px-3 py-1 rounded-lg hover:bg-red-600 transition"
              >
                <FaSignOutAlt className="text-sm" />
                <span>Logout</span>
              </button>
            </div>

            <div className="flex-1 space-y-4">
              {error && (
                <div className="bg-red-100 text-red-700 p-4 rounded-lg mb-6">
                  {error}
                </div>
              )}
              {success && (
                <div className="bg-green-100 text-green-700 p-4 rounded-lg mb-6">
                  {success}
                </div>
              )}
              <form onSubmit={handleSubmit}>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Address</label>
                  <textarea
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Course</label>
                  <input
                    type="text"
                    name="course"
                    value={formData.course}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border rounded-lg bg-white"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Module</label>
                  <input
                    type="text"
                    name="module"
                    value={formData.module}
                    onChange={handleInputChange}
                    className="mt-1 p-2 w-full border rounded-lg bg-white"
                    required
                  />
                </div>
                <button
                  type="submit"
                  className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
                >
                  Save Changes
                </button>
              </form>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Loading profile...</p>
        )}
      </div>
    </div>
  );
};

export default LecturerProfilePage;