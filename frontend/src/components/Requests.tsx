import { useEffect, useState } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { infoAPI } from "../api";
import { useRecoilState } from "recoil";
import { groupsState, userState } from "../store/atoms"
import GroupInfo from "./GroupInfo";

interface Request {
  requestId: number;
  groupId: number;
  userId: string;
  username: string;
  status: string;
}

interface RequestsProps {
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
}

function Requests({ setSelectedOption }: RequestsProps) {
  const socket = useWebSocket();
  const [groups, setGroups] = useRecoilState(groupsState);
  const [user, setUser] = useRecoilState(userState);
  const [requestReceived, setRequestReceived] = useState<Request[]>([]);
  const [requestSent, setRequestSent] = useState<Request[]>([]);
  const [loading, setLoading] = useState(false);
  const [showGroupInfo, setShowGroupInfo] = useState(false);

  useEffect(() => {
    if (!socket) return;

    const fetchData = async () => {
      try {
        const response = await infoAPI.getRequests();
        const fetchedRequests = response.data as any;
        console.log(fetchedRequests);
        setRequestReceived(fetchedRequests.requestReceived || []);
        setRequestSent(fetchedRequests.requestSent || []);
      } catch (error) {
        console.error("Error fetching requests:", error);
      }
    };

    fetchData();

    const handleSocketMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      if (message.type === "REQUEST_SENT_CONFIRMATION") {
        const data = message.payload as Request;
        setRequestSent((prev) => [data, ...prev]);
      }
      else if (message.type === "RECEIVE_REQUEST") {
        console.log("JAI SHREE RAM");
        console.log(message.payload);
        const data = message.payload as Request;
        setRequestReceived((prev) => [data, ...prev]);
      }
      else if (message.type === "JOIN_GROUP") {
        setGroups((prevGroups) => [
          ...prevGroups,
          { id: message.payload.id, groupName: message.payload.groupName }
        ]);
        console.log("XXXXXXXXXXXXXXXXXXXX", groups);
        console.log("XXXXXXXXXXXXXXXXXXXX", message.payload);


        const newMap = new Map(user);
        newMap.set(Number(message.payload.id), message.payload.randomUserId);
        setUser(newMap);

      } else if (message.type === "REQUEST_ACCEPTED") {
        const { requestId, status } = message.payload;
        setRequestReceived((prev) =>
          prev.filter((request) => request.requestId !== Number(requestId))
        );

        setRequestSent((prev) =>
          prev.map((request) =>
            request.requestId === Number(requestId) ? { ...request, status } : request
          )
        );
        setComponent();
      } else if (message.type === "REQUEST_REJECTED") {
        const { requestId, status } = message.payload;

        setRequestReceived((prev) =>
          prev.filter((request) => request.requestId !== Number(requestId))
        );

        setRequestSent((prev) =>
          prev.map((request) =>
            request.requestId === Number(requestId) ? { ...request, status } : request
          )
        );
      }
    };

    socket.addEventListener("message", handleSocketMessage);

    return () => {
      socket.removeEventListener("message", handleSocketMessage);
    };
  }, [socket]);

  const acceptRequest = async (requestId: string, senderId: string, groupId: string) => {
    if (loading) return; // Prevent action while loading
    setLoading(true);
    try {
      socket?.send(
        JSON.stringify({
          type: "ACCEPT_REQUEST",
          payload: { requestId, groupId, senderId },
        })
      );
    } catch (error) {
      console.error("Error accepting friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const declineRequest = async (requestId: string, senderId: string) => {
    if (loading) return; // Prevent action while loading
    setLoading(true);
    try {
      socket?.send(
        JSON.stringify({
          type: "DECLINE_REQUEST",
          payload: { senderId, requestId },
        })
      );
    } catch (error) {
      console.error("Error rejecting friend request:", error);
    } finally {
      setLoading(false);
    }
  };

  const setComponent = () => {
    setSelectedOption("chats");
  }

  return (
    <div className="p-6 bg-white shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-blue-700">Requests</h2>
      <div>
        {/* Requests Received Section */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Requests Received
          </h3>
          {requestReceived.length === 0 ? (
            <p className="text-gray-500">No requests received.</p>
          ) : (
            <ul className="space-y-4">
              {requestReceived.map((req) => (
                <li
                  key={req.requestId}
                  className="border border-gray-300 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <p className="text-gray-800 font-medium">
                    <span className="font-semibold">Request ID:</span>{" "}
                    {req.requestId}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-semibold">Username:</span> {req.username}
                  </p>
                  <div className="mt-4 flex flex-wrap gap-2">
                    <button
                      className="bg-green-500 text-white px-4 py-2 rounded-lg hover:bg-green-600 transition-colors duration-200"
                      onClick={() =>
                        acceptRequest(
                          req.requestId.toString(),
                          req.userId,
                          req.groupId.toString()
                        )
                      }
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Accept"}
                    </button>
                    <button
                      className="bg-red-500 text-white px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200"
                      onClick={() =>
                        declineRequest(req.requestId.toString(), req.userId)
                      }
                      disabled={loading}
                    >
                      {loading ? "Processing..." : "Decline"}
                    </button>
                    <div>
                      <button
                        className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                        onClick={() => setShowGroupInfo(true)}
                      >
                        View Group
                      </button>

                      {showGroupInfo && (
                        <div className="modal mt-2">
                          <GroupInfo groupId={req.groupId.toString()} />
                          <button className="bg-red-500 text-white mt-2 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200" onClick={() => setShowGroupInfo(false)}>Close</button>
                        </div>
                      )}
                    </div>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Requests Sent Section */}
        <div>
          <h3 className="text-lg font-semibold text-gray-700 mb-4">
            Requests Sent
          </h3>
          {requestSent.length === 0 ? (
            <p className="text-gray-500">No requests sent.</p>
          ) : (
            <ul className="space-y-4">
              {requestSent.map((req) => (
                <li
                  key={req.requestId}
                  className="border border-gray-300 p-4 rounded-lg shadow-sm hover:shadow-md transition-shadow duration-200"
                >
                  <p className="text-gray-800 font-medium">
                    <span className="font-semibold">Username:</span> {req.username}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-semibold">Group ID:</span> {req.groupId}
                  </p>
                  <p className="text-gray-800">
                    <span className="font-semibold">Status:</span> {req.status}
                  </p>
                  <div className="mt-4">

                    <button
                      className="bg-blue-500 text-white px-4 py-2 rounded-lg hover:bg-blue-600 transition-colors duration-200"
                      onClick={() => setShowGroupInfo(true)}
                    >
                      View Group
                    </button>

                    {showGroupInfo && (
                      <div className="modal mt-2">
                        <GroupInfo groupId={req.groupId.toString()} />
                        <button className="bg-red-500 text-white mt-2 px-4 py-2 rounded-lg hover:bg-red-600 transition-colors duration-200" onClick={() => setShowGroupInfo(false)}>Close</button>
                      </div>
                    )}
                  </div>

                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>

  );
}

export default Requests;
