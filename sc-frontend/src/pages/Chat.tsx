import { useState, useEffect } from "react";
import Sidebar from "../components/Sidebar";
import ChatWindow from "../components/ChatWindow";
import { User, Message } from "../components/types";
import { useUser } from "../context/UserContext";
import { io, Socket } from "socket.io-client";
import axios from "axios";

const Chat = () => {
  const { user } = useUser();
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [selectedGroup, setSelectedGroup] = useState<{
    id: number;
    room_id: string;
    name: string;
    isGroup: boolean;
  } | null>(null);
  const [groups, setGroups] = useState<
    { id: number; room_id: string; name: string; isGroup: boolean }[]
  >([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [socket, setSocket] = useState<Socket | null>(null);
  const [loading, setLoading] = useState(true);
  const [retryCount, setRetryCount] = useState(0);
  const maxRetries = 5;

  useEffect(() => {
    const fetchUsers = async () => {
      const token = localStorage.getItem("token");
      console.log("Fetching users with token:", token);
      console.log("Current user:", user);
      if (!token || !user || !user.id) {
        console.log("User or token unavailable, skipping fetch", {
          user,
          token,
        });
        return;
      }

      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/users/`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        setUsers(res.data.users);
        console.log("Fetched users:", res.data.users);
      } catch (error) {
        console.error("Error fetching users:", error);
      }
    };

    const fetchGroups = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/groups`, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const formattedGroups = res.data.groups.map((group: any) => ({
          id: group.id,
          room_id: group.room_id,
          name: group.name,
          isGroup: true,
        }));
        setGroups(formattedGroups);
        console.log("Fetched groups:", formattedGroups);
      } catch (error) {
        console.error("Error fetching groups:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUsers();
    fetchGroups();
  }, [user]);

  useEffect(() => {
    if (!user || !user.id) return;

    const token = localStorage.getItem("token");
    console.log("Initializing socket with token:", token, "and user:", user);

    if (!token) {
      if (retryCount < maxRetries) {
        console.log(
          `Waiting for token before socket initialization (Retry ${
            retryCount + 1
          }/${maxRetries})`
        );
        setTimeout(() => {
          setRetryCount(retryCount + 1);
        }, 1000);
      } else {
        console.log("Max retries reached, socket initialization failed");
      }
      return;
    }

    if (socket) {
      socket.disconnect();
    }

    const newSocket = io("http://localhost:5000", {
      auth: { token: `Bearer ${token}` },
      transports: ["websocket", "polling"],
      withCredentials: true,
    });

    setSocket(newSocket);

    newSocket.on("connect", () => {
      console.log("Client socket connected with ID:", newSocket.id);
      newSocket.emit("join", {
        userId: user.id,
        role: user.role,
        name: user.name,
      });
    });

    newSocket.on("userJoined", (data) => {
      console.log("User joined:", data);
    });

    newSocket.on("receiveMessage", (serverMessage: any) => {
      console.log(
        "Received message event from server on socket:",
        newSocket.id,
        serverMessage
      );
      const message: Message = {
        id: serverMessage.id,
        userId: serverMessage.senderId,
        text: serverMessage.message,
        fileUrl: serverMessage.fileUrl,
        fileName: serverMessage.fileName,
        timestamp: serverMessage.timestamp,
        groupId: serverMessage.groupId || null,
        senderName: serverMessage.senderName, // Added senderName
      };
      if (
        user &&
        message.userId !== user.id &&
        !messages.find((m) => m.id === message.id)
      ) {
        setMessages((prevMessages) => [...prevMessages, message]);
      }
    });

    newSocket.on("joinRoom", (data) => {
      const { room } = data;
      console.log(
        `Server requested to join room ${room} on socket ${newSocket.id}`
      );
    });

    newSocket.on("connect_error", (err) => {
      console.log("Socket connect error:", err.message, "with details:", err);
    });

    newSocket.on("disconnect", () => {
      console.log("Client socket disconnected for ID:", newSocket.id);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [user, retryCount]);

  useEffect(() => {
    if ((!selectedUser && !selectedGroup) || !user || !user.id) return;

    const fetchMessages = async () => {
      const token = localStorage.getItem("token");
      try {
        const res = await axios.get(
          `${import.meta.env.VITE_API_URL}/messages/${
            selectedUser ? selectedUser.id : selectedGroup!.room_id
          }`,
          { headers: { Authorization: `Bearer ${token}` } }
        );
        const apiMessages: any[] = res.data.messages;
        const mappedMessages = apiMessages.map((msg: any) => ({
          id: msg.id,
          userId: msg.sender_id,
          text: msg.message,
          fileUrl: msg.file_url,
          fileName: msg.file_name || "unnamed file",
          timestamp: msg.timestamp,
          groupId: msg.group_id || null,
          senderName: msg.sender_name, // Added senderName
        }));
        const uniqueMessages = mappedMessages.filter(
          (msg: Message, index: number, self: Message[]) =>
            index === self.findIndex((m: Message) => m.id === msg.id)
        );
        setMessages(uniqueMessages);
        console.log("Fetched unique messages from API:", uniqueMessages);
      } catch (error) {
        console.error("Error fetching messages:", error);
      }
    };

    fetchMessages();
  }, [selectedUser, selectedGroup, user]);

  const handleSendMessage = (text: string) => {
    if ((!selectedUser && !selectedGroup) || !user || !user.id || !socket) {
      console.log("Message not sent: missing required data", {
        selectedUser,
        selectedGroup,
        socket,
        user,
      });
      return;
    }

    const message: Message = {
      id: Date.now().toString(),
      userId: user.id,
      text,
      timestamp: new Date().toISOString(),
      groupId: selectedGroup ? selectedGroup.id : null,
      senderName: user.name, // Added senderName
    };

    const room = selectedUser
      ? [user.id, selectedUser.id].sort().join("-")
      : selectedGroup!.room_id;
    const targetId = selectedUser ? selectedUser.id : null;

    socket.emit("joinRoom", { room });
    socket.emit("sendMessage", {
      senderId: user.id,
      recipientId: targetId,
      message: text,
      timestamp: message.timestamp,
      groupId: selectedGroup ? selectedGroup.id : null,
    });

    setMessages((prevMessages) => [...prevMessages, message]);
  };

  const handleSendFile = async (file: File) => {
    if ((!selectedUser && !selectedGroup) || !user || !user.id || !socket) {
      console.log("File not sent: missing required data", {
        selectedUser,
        selectedGroup,
        socket,
        user,
      });
      return;
    }

    const token = localStorage.getItem("token");
    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await axios.post(
        `${import.meta.env.VITE_API_URL}/upload-file`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      const fileUrl = res.data.fileUrl;
      const message: Message = {
        id: Date.now().toString(),
        userId: user.id,
        fileUrl,
        fileName: file.name,
        timestamp: new Date().toISOString(),
        groupId: selectedGroup ? selectedGroup.id : null,
        senderName: user.name, // Added senderName
      };

      const room = selectedUser
        ? [user.id, selectedUser.id].sort().join("-")
        : selectedGroup!.room_id;
      const targetId = selectedUser ? selectedUser.id : null;

      socket.emit("joinRoom", { room });
      socket.emit("sendMessage", {
        senderId: user.id,
        recipientId: targetId,
        message: `File: ${file.name}`,
        fileUrl,
        fileName: file.name,
        timestamp: message.timestamp,
        groupId: selectedGroup ? selectedGroup.id : null,
      });

      setMessages((prevMessages) => [...prevMessages, message]);
    } catch (error) {
      console.error("Error uploading file:", error);
    }
  };

  if (loading || !user || !socket) {
    return (
      <div className="flex items-center justify-center h-screen">
        Loading Chat...{!user ? " (Waiting for user data)" : ""}
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <Sidebar
        users={users}
        onSelectUser={setSelectedUser}
        groups={groups}
        onSelectGroup={setSelectedGroup}
        onCreateGroup={() => {
          setSelectedGroup(null);
          setSelectedUser(null);
          setMessages([]);
        }}
      />
      <ChatWindow
        selectedUser={selectedUser}
        selectedGroup={selectedGroup}
        messages={messages}
        onSendMessage={handleSendMessage}
        onSendFile={handleSendFile}
      />
    </div>
  );
};

export default Chat;
