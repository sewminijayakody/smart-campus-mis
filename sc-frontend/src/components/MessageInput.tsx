import { useState, useRef } from "react";

const MessageInput = ({ onSendMessage }: { onSendMessage: (message: string) => void }) => {
  const [message, setMessage] = useState("");
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setMessage(e.target.value);
    adjustTextareaHeight();
  };

  const adjustTextareaHeight = () => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height first
      textareaRef.current.style.height = `${Math.min(textareaRef.current.scrollHeight, 150)}px`; // Max height limit
    }
  };

  const sendMessage = () => {
    if (!message.trim()) return;
    onSendMessage(message);
    setMessage("");
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto"; // Reset height after sending
    }
  };

  return (
    <div className="bg-white p-3 rounded-lg flex items-start space-x-2 w-full">
      {/* Typing Input Area */}
      <textarea
        ref={textareaRef}
        className="flex-1 p-2 text-sm rounded-lg outline-none border border-gray-300 resize-none overflow-hidden break-words"
        placeholder="Type a message..."
        value={message}
        onChange={handleInputChange}
        onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && sendMessage()}
        style={{ minHeight: "40px", maxHeight: "150px" }} // Ensures proper sizing
      />
      {/* Send Button */}
      <button
        className="bg-blue-500 text-white p-2 rounded-lg text-sm"
        onClick={sendMessage}
      >
        ➤
      </button>
    </div>
  );
};

export default MessageInput;
