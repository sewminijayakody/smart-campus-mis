import React, { useState } from 'react';
import axios from 'axios';
import { useNavigate } from 'react-router-dom';
import { useUser } from '../context/UserContext'; // Import useUser
import characterImage from '../assets/images/Picture4.png';

const Login: React.FC = () => {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const navigate = useNavigate();
  const { setUser } = useUser(); // Get setUser from context

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isLoading) return;
    setIsLoading(true);
    setError('');

    try {
      const trimmedUsername = username.trim();
      const res = await axios.post('http://localhost:5000/api/auth/login', {
        username: trimmedUsername,
        password,
      });
      const { token, role, course, module } = res.data;

      // Store token and role in localStorage
      localStorage.setItem('token', token);
      localStorage.setItem('role', role);
      localStorage.setItem('course', course || '');
      localStorage.setItem('module', module || '');

      // Fetch full user data using the token
      const userRes = await axios.get('http://localhost:5000/api/user', {
        headers: { Authorization: `Bearer ${token}` },
      });
      const userData = userRes.data.user;
      console.log("Fetched user data after login:", userData);

      // Set user in context
      setUser(userData);

      // Navigate based on role
      if (role === 'admin') navigate('/admin-dashboard', { replace: true });
      else if (role === 'student') navigate('/student-dashboard', { replace: true });
      else if (role === 'lecturer') navigate('/lecturer-dashboard', { replace: true });
    } catch (err: any) {
      console.error('Login error:', err.response?.data || err.message);
      setError(err.response?.data?.message || 'Invalid credentials');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#F5F7FA] relative">
      <div className="flex bg-white shadow-lg rounded-lg overflow-hidden w-2/3 max-w-4xl">
        {/* Left Side with Text and Form */}
        <div className="w-1/2 p-8 flex flex-col justify-center">
          <h2 className="text-4xl font-extrabold mb-6 bg-gradient-to-r from-blue-500 via-blue-600 to-blue-700 text-transparent bg-clip-text drop-shadow-lg">
            Welcome To UCMS
          </h2>
          {error && <p className="text-red-500 mb-4 text-center">{error}</p>}
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <div>
              <label className="block text-gray-700 text-sm font-medium mb-1">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border border-gray-300 rounded-lg bg-gray-100 focus:outline-none focus:ring-2 focus:ring-orange-500"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-orange-500 text-white p-2 rounded-lg hover:bg-orange-600 transition duration-300"
              disabled={isLoading}
            >
              {isLoading ? 'Logging in...' : 'Continue'}
            </button>
          </form>
        </div>
        {/* Right Side with Image */}
        <div className="w-1/2 bg-gray-100 flex items-center justify-center p-4">
          <img src={characterImage} alt="Students collaborating" className="object-contain w-full h-auto" />
        </div>
      </div>
    </div>
  );
};

export default Login;