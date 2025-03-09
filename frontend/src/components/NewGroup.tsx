import { useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import SelectFriends from "./SelectFriends";

interface NewGroupProps {
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
}

interface User {
  id: number;
  username: string;
}

function NewGroup({setSelectedOption} : NewGroupProps) {
  const [name, setName] = useState<string>("");
  const [friendList, setFriendList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const socket = useWebSocket();

  const createGroup = async () => {
    setLoading(true);
    try {
      socket?.send(
        JSON.stringify({
          type: "CREATE_GROUP",
          payload: {
            groupName: name,
            receivers: friendList,
          },
        })
      );
      setSelectedOption("chats");
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-lg mx-auto p-6 bg-white shadow-md rounded-lg">
  <h2 className="text-2xl font-bold mb-6 text-blue-700">Create New Group</h2>
  <div className="mb-4">
    <input
      type="text"
      placeholder="Enter group name"
      value={name}
      onChange={(e) => setName(e.target.value)}
      className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
    />
  </div>
  <div className="mb-6">
    <SelectFriends setFriendList={setFriendList} numberOfFriends={9} />
  </div>
  <button
    type="submit"
    disabled={loading}
    onClick={createGroup}
    className={`w-full py-3 px-4 rounded-lg font-medium ${
      loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-blue-500 text-white hover:bg-blue-600 transition"
    }`}
  >
    {loading ? "Creating Group..." : "Create Group"}
  </button>
</div>

  );
}

export default NewGroup;
