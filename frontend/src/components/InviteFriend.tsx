import React, { useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import SelectFriends from "./SelectFriends";

interface User {
  id: number;
  username: string;
}

interface inviteFriendProps {
  groupId: string;
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
}

function InviteFriend({ groupId, setSelectedOption }: inviteFriendProps) {
  const [friendList, setFriendList] = useState<User[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const socket = useWebSocket();

  const addMember = async () => {
    setLoading(true);
    try {
      socket?.send(
        JSON.stringify({
          type: "INVITE_FRIENDS",
          payload: {
            groupId,
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
    <div>
      <SelectFriends setFriendList={setFriendList} numberOfFriends={9} />
      <button
    type="submit"
    disabled={loading}
    onClick={addMember}
    className={`w-full py-3 px-4 rounded-lg font-medium ${
      loading
        ? "bg-gray-400 cursor-not-allowed"
        : "bg-blue-500 text-white hover:bg-blue-600 transition"
    }`}
  >
    {loading ? "Inviting..." : "Invite"}
  </button>

    </div>
  );
}

export default InviteFriend;
