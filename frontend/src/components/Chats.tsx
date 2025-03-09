import { useEffect } from "react";
import { useWebSocket } from "../context/WebSocketContext";
import { useRecoilState } from "recoil";
import { countState, groupsState, userState } from "../store/atoms";

interface ChatsProps {
    setGroupId: React.Dispatch<React.SetStateAction<string>>;
}

interface Group {
    id: string;
    groupName: string;
}

interface UserGroupDetails {
    randomUserId: string;
    id: string;
    groupName: string;
    count: number;
}


function Chats({ setGroupId }: ChatsProps) {
    const [groups, setGroups] = useRecoilState(groupsState);
    const socket = useWebSocket();
    const [user, setUser] = useRecoilState(userState);
    const [count, setCount] = useRecoilState(countState);

    useEffect(() => {
        if (!socket) {
            return;
        }

        const handleSocketMessage = (event: MessageEvent) => {
            const message = JSON.parse(event.data);

            if (message.type === "INTIALIZE_USER_GROUP") {
                const details: UserGroupDetails[] = message.payload;
                console.log(details);

                const tempGroup: Group[] = [];
                const updatedUser = new Map(user); // Use the current map to update values
                const updatedCount = new Map(count);

                details.forEach((detail) => {
                    tempGroup.push({
                        id: detail.id,
                        groupName: detail.groupName,
                    });
                    updatedUser.set(Number(detail.id), detail.randomUserId); // Update the map
                    updatedCount.set(Number(detail.id), detail.count); // Update the map
                });

                setUser(updatedUser);
                setCount(updatedCount);
                setGroups(tempGroup);
                console.log(updatedUser);
            }
            else if (message.type === "JOIN_GROUP") {
                console.log("GETVC");
                console.log(message.payload);
                setGroups((prevGroups) => [
                    ...prevGroups,
                    { id: message.payload.id, groupName: message.payload.groupName }
                ]);
                console.log(groups);
                const newUser = new Map(user);
                newUser.set(Number(message.payload.id), message.payload.randomUserId);
                setUser(newUser);
                const newCount = new Map(count);
                newCount.set(Number(message.payload.id), 0);
                setCount(newCount);
            }
            else if (message.type === "LEAVE_GROUP_CONFIRMATION") {
                setGroups((prevGroups) =>
                    prevGroups.filter((group) => group.id !== message.payload.id))
                const newMap = new Map(user);
                newMap.delete(message.payload.id);
                setUser(newMap);
            }
        };

        socket.addEventListener("message", handleSocketMessage);

        return () => {
            socket.removeEventListener("message", handleSocketMessage);
        };
    }, [socket, count]);



    return (
        <div className="p-6 bg-white shadow-md rounded-lg">
            <h2 className="text-2xl font-bold mb-6 text-blue-700">Groups</h2>
            <ul className="divide-y divide-gray-200 p-2">
                {groups.map((group) => (
                    <li
                        key={group.id}
                        className="py-3 flex items-center justify-between hover:bg-gray-100 rounded-lg transition-all duration-200"
                    >
                        <button
                            onClick={() => setGroupId(group.id)}
                            className="text-lg text-gray-800 px-4 hover:text-blue-600 font-medium focus:outline-none"
                        >
                            {group.groupName}
                        </button>
                        {(count.get(Number(group.id)) ?? 0) > 0 && (
                            <span className="text-xs px-2 text-white bg-blue-500 rounded-full flex items-center justify-center w-6 h-6">
                                {count.get(Number(group.id))}
                            </span>
                        )}
                    </li>
                ))}
            </ul>
        </div>
    );
}

export default Chats;
