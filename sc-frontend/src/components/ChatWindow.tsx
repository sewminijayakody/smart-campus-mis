import { useEffect, useRef } from "react";
import MessageList from "./MessageList";
import MessageInput from "./MessageInput";
import FileShare from "./FileShare";
import { Message, User } from "../components/types";

interface ChatWindowProps {
  selectedUser: User | null;
  selectedGroup: { id: number; room_id: string; name: string } | null;
  messages: Message[];
  onSendMessage: (message: string) => void;
  onSendFile: (file: File) => void;
}

const ChatWindow = ({ selectedUser, selectedGroup, messages, onSendMessage, onSendFile }: ChatWindowProps) => {
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Scroll to bottom when a new message is received
  useEffect(() => {
    console.log("Messages updated in ChatWindow:", messages); // Debug messages prop
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleDeleteMessage = (index: number) => {
    // Optional: Implement delete functionality with backend if needed
    console.log("Delete message at index:", index);
  };

  return (
    <div className="flex-1 bg-[#D8EAF3] rounded-xl shadow-md m-4 p-4 flex flex-col">
      {selectedUser || selectedGroup ? (
        <>
          {/* User or Group Info Header */}
          <div className="p-4 bg-[#E7FFFF] shadow-md rounded-lg flex items-center">
            {selectedUser ? (
              <>
                <img src={selectedUser.avatar} alt="avatar" className="w-12 h-12 rounded-full mr-3" />
                <span className="text-lg font-semibold">{selectedUser.name}</span>
              </>
            ) : (
              <span className="text-lg font-semibold">{selectedGroup!.name}</span>
            )}
          </div>

          {/* Scrollable message area */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-4 space-y-2 max-h-[400px]">
            <MessageList messages={messages} onDeleteMessage={handleDeleteMessage} />
            <div ref={messagesEndRef} />
          </div>

          {/* Input & File Share Area */}
          <div className="flex items-center space-x-2 mt-2 bg-white p-2 rounded-lg">
            <FileShare onSendFile={onSendFile} />
            <MessageInput onSendMessage={onSendMessage} />
          </div>
        </>
      ) : (
        <div className="flex items-center justify-center h-full text-gray-500 text-xl">
          Select a user or group to start chatting
        </div>
      )}
    </div>
  );
};

export default ChatWindow;