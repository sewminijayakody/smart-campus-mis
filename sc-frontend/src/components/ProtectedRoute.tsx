// src/components/ProtectedRoute.tsx
import React from 'react';
import { Navigate } from 'react-router-dom';
import { jwtDecode } from 'jwt-decode';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRole?: string; // Optional: Restrict to a single specific role
  allowedRoles?: string[]; // Optional: Restrict to multiple specific roles
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRole, allowedRoles }) => {
  const token = localStorage.getItem('token');

  // If no token, redirect to login
  if (!token) {
    console.log('No token found, redirecting to /');
    return <Navigate to="/" replace />;
  }

  try {
    const decoded: any = jwtDecode(token);
    const currentTime = Date.now() / 1000;

    console.log('Decoded token:', decoded); // Log the decoded token for debugging

    // Check if token is expired
    if (decoded.exp < currentTime) {
      console.log('Token expired, redirecting to /');
      localStorage.removeItem('token');
      return <Navigate to="/" replace />;
    }

    // If allowedRole or allowedRoles is specified, check role
    if (allowedRole && decoded.role !== allowedRole) {
      console.log(`Role mismatch: Expected ${allowedRole}, got ${decoded.role}, redirecting to /`);
      return <Navigate to="/" replace />;
    }

    if (allowedRoles && !allowedRoles.includes(decoded.role)) {
      console.log(`Role not in allowed list: Expected one of ${allowedRoles}, got ${decoded.role}, redirecting to /`);
      return <Navigate to="/" replace />;
    }

    console.log(`Access granted for role ${decoded.role} at ${window.location.pathname}`);
    return <>{children}</>;
  } catch (error) {
    console.log('Invalid token, error:', error, 'redirecting to /');
    localStorage.removeItem('token');
    return <Navigate to="/" replace />;
  }
};

export default ProtectedRoute;