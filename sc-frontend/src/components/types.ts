export interface User {
  id: number; // Required id
  name: string;
  role?: string;
  avatar?: string; // Optional avatar field (aligned with Sidebar.tsx usage)
  course?: string;
  startDate?: string;
  endDate?: string;
  email?: string;
  phone?: string;
  address?: string;
  imageUrl?: string | null; // Optional imageUrl for consistency with backend
  module?:string;
}

export interface Message {
  id: string;
  userId: number;
  text?: string;
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  groupId?: number | null; 
  senderName?: string;
}