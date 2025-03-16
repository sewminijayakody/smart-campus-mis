import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import axios from "axios";

// Define types
interface User {
  id: number;
  name: string;
  course: string;
  startDate: string;
  endDate: string;
  email?: string;
  phone?: string;
  mobile?: string;
  address?: string;
  imageUrl?: string | null;
  role?: string;
  module?: string;
}

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  loading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export const UserProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initializeUser = async () => {
      const token = localStorage.getItem("token");
      if (token && !user) { // Only fetch if user isn’t already set
        try {
          const res = await axios.get("http://localhost:5000/api/user", {
            headers: { Authorization: `Bearer ${token}` },
          });
          const userData = res.data.user;
          console.log("UserContext initialized with user:", userData);
          setUser(userData);
          // Sync role with localStorage if not set
          if (!localStorage.getItem("role") && userData.role) {
            localStorage.setItem("role", userData.role);
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          if (axios.isAxiosError(error) && error.response?.status === 401) {
            localStorage.removeItem("token");
            localStorage.removeItem("role");
            localStorage.removeItem("course");
            localStorage.removeItem("module");
            setUser(null);
          }
        }
      }
      setLoading(false);
    };
    initializeUser();
  }, []); // Runs on mount only, login updates via setUser

  return (
    <UserContext.Provider value={{ user, setUser, loading }}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
};

export default UserContext;