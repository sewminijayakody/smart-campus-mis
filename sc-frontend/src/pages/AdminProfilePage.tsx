// src/pages/AdminProfilePage.tsx
import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft, FaPen, FaCamera } from "react-icons/fa";
import userImage from "../assets/images/Picture9.png";
import { useUser } from "../context/UserContext";
import axios from "axios";

const AdminProfilePage = () => {
  const navigate = useNavigate();
  const { user, setUser } = useUser();
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    phone: "",
    address: "",
  });
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    if (user) {
      setFormData({
        name: user.name || "",
        email: user.email || "",
        phone: user.phone || "",
        address: user.address || "",
      });
      setPreviewImage(user.imageUrl || userImage);
      console.log("AdminProfilePage: Initial render - user:", user, "previewImage:", previewImage);
    }
  }, [user]);

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
        console.log("AdminProfilePage: Image selected - data URL:", reader.result);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleImageClick = () => {
    fileInputRef.current?.click();
  };

  const handleUpdateProfile = async () => {
    const token = localStorage.getItem("token");
    if (!token) {
      alert("You must be logged in to update your profile.");
      return;
    }

    try {
      const formDataToSend = new FormData();
      formDataToSend.append("name", formData.name);
      formDataToSend.append("email", formData.email);
      formDataToSend.append("phone", formData.phone);
      formDataToSend.append("address", formData.address);
      if (selectedImage) {
        formDataToSend.append("image", selectedImage);
      }

      const res = await axios.put(
        "http://localhost:5000/api/admin/profile",
        formDataToSend,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const updatedUser = res.data.admin;
      setUser({ ...user!, ...updatedUser }); // Update UserContext with the new data
      if (updatedUser.imageUrl) {
        localStorage.setItem("profileImageUrl", updatedUser.imageUrl); // Optional: Store in localStorage for persistence
        setPreviewImage(updatedUser.imageUrl);
      }
      console.log("AdminProfilePage: Profile updated - user:", updatedUser);
      navigate("/admin-dashboard", { state: { updatedImageUrl: updatedUser.imageUrl } });
      alert("Profile updated successfully!");
    } catch (error) {
      console.error("Profile update error:", error);
      alert("Failed to update profile. Please try again.");
    }
  };

  const handleBack = () => {
    navigate("/admin-dashboard");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-6 text-black">
      <div className="max-w-7xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-semibold">Admin Profile</h1>
          <button
            onClick={handleBack}
            className="flex items-center justify-center w-10 h-10 bg-[#FF7700] text-white rounded-full shadow-md hover:scale-105 transition"
          >
            <FaArrowLeft />
          </button>
        </div>
        {user ? (
          <div className="bg-white p-6 rounded-lg shadow-md border-2 border-blue-300 flex">
            <div className="mr-6 relative">
              <img
                src={previewImage || user.imageUrl || userImage}
                alt="Admin Profile"
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
                  onClick={handleUpdateProfile}
                  className="mt-2 flex items-center space-x-1 bg-blue-500 text-white px-3 py-1 rounded-lg hover:bg-blue-600 transition"
                >
                  <FaCamera className="text-sm" />
                  <span>Upload Image</span>
                </button>
              )}
              <p className="text-sm text-gray-700 mt-2">{user.name}</p>
              <p className="text-sm text-gray-500 mt-1">Admin</p>
            </div>

            <div className="flex-1 space-y-4">
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
                <input
                  type="text"
                  name="address"
                  value={formData.address}
                  onChange={handleInputChange}
                  className="mt-1 p-2 w-full border rounded-lg bg-white"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700">Designation</label>
                <input
                  type="text"
                  value="Admin"
                  readOnly
                  className="mt-1 p-2 w-full border rounded-lg bg-gray-100"
                />
              </div>
              <button
                onClick={handleUpdateProfile}
                className="mt-4 bg-blue-500 text-white px-6 py-2 rounded-lg hover:bg-blue-600 transition"
              >
                Update Profile
              </button>
            </div>
          </div>
        ) : (
          <p className="text-center text-gray-500">Loading profile...</p>
        )}
      </div>
    </div>
  );
};

export default AdminProfilePage;