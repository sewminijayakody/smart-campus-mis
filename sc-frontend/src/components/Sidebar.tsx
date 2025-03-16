import { useState } from "react";
import { User } from "./types";

interface Group {
  id: number;
  room_id: string;
  name: string;
  isGroup: boolean;
}

interface SidebarProps {
  users: User[];
  onSelectUser: (user: User) => void;
  groups?: Group[];
  onSelectGroup?: (group: Group) => void;
  onCreateGroup?: () => void;
}

const Sidebar = ({ users, onSelectUser, groups = [], onSelectGroup, onCreateGroup }: SidebarProps) => {
  const [searchTerm, setSearchTerm] = useState("");
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [selectedMembers, setSelectedMembers] = useState<string[]>([]);

  const handleCreateGroup = async () => {
    if (!groupName || selectedMembers.length === 0) {
      alert("Please enter a group name and select at least one member.");
      return;
    }

    const token = localStorage.getItem("token");
    try {
      const res = await fetch("http://localhost:5000/api/groups", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name: groupName, memberIds: selectedMembers.map(Number) }),
      });
      if (res.ok && onCreateGroup) onCreateGroup();
      setIsCreatingGroup(false);
      setGroupName("");
      setSelectedMembers([]);
    } catch (error) {
      console.error("Error creating group:", error);
    }
  };

  const toggleMemberSelection = (userId: number) => {
    const userIdStr = userId.toString();
    setSelectedMembers((prev) =>
      prev.includes(userIdStr)
        ? prev.filter((id) => id !== userIdStr)
        : [...prev, userIdStr]
    );
  };

  // Combine users and groups into a single list with proper typing
  const combinedList: Array<User | Group> = [
    ...users,
    ...groups,
  ];

  return (
    <div className="w-1/4 p-4 m-4 h-full flex flex-col relative">
      {/* Search bar and plus icon horizontally aligned with equal width */}
      <div className="flex items-center space-x-2 mb-4">
        <div className="bg-white p-2 rounded-md shadow-sm flex-1">
          <input
            type="text"
            placeholder="Search"
            className="w-full outline-none bg-transparent"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="bg-white p-2 rounded-md shadow-sm h-10">
          <button
            onClick={() => setIsCreatingGroup(true)}
            className="text-gray-500 p-2 rounded-full w-full h-full flex justify-center items-center hover:bg-gray-200"
          >
            ➕
          </button>
        </div>
      </div>

      {/* Combined list of users and groups */}
      <div className="bg-[#D8EAF3] p-4 rounded-xl flex-1 overflow-y-auto">
        <div className="space-y-2 max-h-full overflow-y-auto">
          {combinedList
            .filter((item) => item.name.toLowerCase().includes(searchTerm.toLowerCase()))
            .map((item) => (
              <div
                key={isGroup(item) ? item.room_id : item.id}
                className="flex items-center p-3 bg-[#E7FFFF] rounded-lg shadow-sm cursor-pointer hover:bg-gray-200"
                onClick={() =>
                  isGroup(item) && onSelectGroup
                    ? onSelectGroup(item as Group)
                    : onSelectUser(item as User)
                }
              >
                {isGroup(item) ? (
                  <span className="w-10 h-10 rounded-full mr-3 bg-gray-300 flex items-center justify-center text-white font-semibold">
                    G
                  </span>
                ) : (
                  <img
                    src={(item as User).avatar}
                    alt="avatar"
                    className="w-10 h-10 rounded-full mr-3"
                  />
                )}
                <div>
                  <p className="font-semibold">{item.name}</p>
                  <p className="text-xs text-gray-500">
                    {isGroup(item) ? "Group" : (item as User).role}
                  </p>
                </div>
              </div>
            ))}
        </div>
      </div>

      {/* Modal for group creation */}
      {isCreatingGroup && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-30 z-50">
          <div className="bg-white p-6 rounded-lg shadow-xl w-1/3 transform transition-all">
            <h2 className="text-xl font-semibold mb-4 text-gray-800">Create a New Group</h2>
            <input
              type="text"
              value={groupName}
              onChange={(e) => setGroupName(e.target.value)}
              placeholder="Group Name"
              className="w-full p-3 mb-4 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <div className="max-h-48 overflow-y-auto border rounded-lg p-3 mb-4">
              {users.map((user) => (
                <div key={user.id} className="flex items-center space-x-2 mb-2">
                  <input
                    type="checkbox"
                    checked={selectedMembers.includes(user.id.toString())}
                    onChange={() => toggleMemberSelection(user.id)}
                    className="h-5 w-5 text-blue-500 rounded"
                  />
                  <label className="text-gray-700">{user.name}</label>
                </div>
              ))}
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreateGroup}
                className="bg-blue-500 text-white p-3 rounded-lg hover:bg-blue-600 transition"
              >
                Create Group
              </button>
              <button
                onClick={() => setIsCreatingGroup(false)}
                className="bg-red-500 text-white p-3 rounded-lg hover:bg-red-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

// Type guard to check if an item is a Group
function isGroup(item: User | Group): item is Group {
  return (item as Group).room_id !== undefined;
}

export default Sidebar;