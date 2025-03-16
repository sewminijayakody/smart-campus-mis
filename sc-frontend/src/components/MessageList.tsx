// Updated MessageList component
import { Message } from "../components/types";
import { useUser } from "../context/UserContext";

interface MessageListProps {
  messages: Message[];
  onDeleteMessage: (index: number) => void;
}

const MessageList = ({ messages, onDeleteMessage }: MessageListProps) => {
  const { user } = useUser();
  console.log("Rendering MessageList with messages:", messages);

  return (
    <div className="overflow-y-auto space-y-2">
      {messages.map((msg, index) => (
        <div
          key={`${msg.userId}-${msg.timestamp}-${index}`}
          className={`flex ${msg.userId === user?.id ? "justify-end" : "justify-start"}`}
        >
          <div className="bg-white p-3 rounded-lg shadow-md max-w-xs w-full break-words relative">
            {/* Display sender's name if available, especially for group chats */}
            {msg.senderName && (
              <p className={`text-sm ${msg.userId === user?.id ? "text-blue-500" : "text-gray-600"}`}>
                {msg.userId === user?.id ? "You" : msg.senderName}
              </p>
            )}
            {msg.text && <p className="text-black">{msg.text}</p>}
            {!msg.text && <p className="text-gray-500 italic">No text content</p>}
            {msg.fileUrl && (
              <div className="mt-2">
                <a
                  href={msg.fileUrl}
                  download={msg.fileName || "file"}
                  className="text-blue-500 text-sm"
                >
                  Download {msg.fileName || "unnamed file"}
                </a>
              </div>
            )}
            <button
              onClick={() => onDeleteMessage(index)}
              className="absolute top-1 right-2 text-red-500 text-xs hover:text-red-700"
            >
              🗑️
            </button>
          </div>
        </div>
      ))}
    </div>
  );
};

export default MessageList;