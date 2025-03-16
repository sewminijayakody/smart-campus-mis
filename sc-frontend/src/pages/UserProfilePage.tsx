import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPen, FaCamera, FaSignOutAlt } from "react-icons/fa"; // Added FaSignOutAlt for logout icon
import userImage from "../assets/images/Picture3.png";
import { useUser } from "../context/UserContext";
import axios from 'axios';

const UserProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setPreviewImage(user.imageUrl || userImage);
      console.log("UserProfilePage: Initial render - user:", user, "previewImage:", previewImage);
    }
  }, [user]);

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setSelectedImage(file);
        setPreviewImage(reader.result as string);
        console.log("UserProfilePage: Image selected - data URL:", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpdateProfileImage = async () => {
    if (!selectedImage) {
      alert('Please select an image to upload.');
      return;
    }

    const formData = new FormData();
    formData.append('image', selectedImage);

    try {
      const token = localStorage.getItem('token');
      if (!token) {
        alert('You must be logged in to update your profile image.');
        return;
      }

      const res = await axios.post('http://localhost:5000/api/auth/update-image', formData, {
        headers: {
          Authorization: `Bearer ${token}`,
          'Content-Type': 'multipart/form-data',
        },
      });

      const newImageUrl = res.data.imageUrl;
      if (user) {
        setUser({ ...user, imageUrl: newImageUrl });
        setPreviewImage(newImageUrl);
        localStorage.setItem('profileImageUrl', newImageUrl);
        console.log("UserProfilePage: Image updated - new imageUrl:", newImageUrl, "user:", { ...user, imageUrl: newImageUrl });
        navigate("/student-dashboard", { state: { updatedImageUrl: newImageUrl } });
        alert("Profile image updated successfully!");
      }
    } catch (error) {
      console.error('Image upload error:', error);
      alert('Failed to update profile image. Please try again.');
    }
  };

  const handleBack = () => {
    navigate("/student-dashboard");
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
          <h1 className="text-3xl font-semibold">User Profile</h1>
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
                alt="User Profile"
                className="w-24 h-24 rounded-full border-2 border-blue-300 cursor-pointer"
                onClick={handleImageClick}
                style={{ position: "relative" }}
                onError={(e) => console.error('Image load error:', e)}
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
                  onClick={handleUpdateProfileImage}
                  className="mt-2 flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
                >
                  <FaCamera className="text-sm" />
                  <span>Upload Image</span>
                </button>
              )}
              <p className="text-sm text-gray-700 mt-2">{user.name}</p>
              <p className="text-sm text-gray-500 mt-1">Student</p>
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
              <div>
                <label className="block text-sm font-medium text-gray-700">Email</label>
                <input
                  type="text"
                  value={user.email || ""}
                  readOnly
                  className="mt-1 p-2 w-full border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Phone</label>
                <input
                  type="text"
                  value={user.phone || ""}
                  readOnly
                  className="mt-1 p-2 w-full border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Address</label>
                <input
                  type="text"
                  value={user.address || ""}
                  readOnly
                  className="mt-1 p-2 w-full border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Start Date</label>
                <input
                  type="text"
                  value={user.startDate}
                  readOnly
                  className="mt-1 p-2 w-full border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">End Date</label>
                <input
                  type="text"
                  value={user.endDate}
                  readOnly
                  className="mt-1 p-2 w-full border rounded-lg bg-gray-100"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Course</label>
                <input
                  type="text"
                  value={user.course}
                  readOnly
                  className="mt-1 p-2 w-full border rounded-lg bg-gray-100"
                />
              </div>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Loading profile...</p>
        )}
      </div>
    </div>
  );
};

export default UserProfilePage;