import React, { useEffect, useState } from "react";
import Menu from "./Menu";
import { useWebSocket } from "../context/WebSocketContext";
import { useRecoilState } from "recoil";
import { countState, userState } from "../store/atoms";
import InfiniteScroll from "react-infinite-scroll-component";
import { infoAPI } from "../api";

interface GroupChatProps {
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
  groupId: string;
  setGroupId: React.Dispatch<React.SetStateAction<string>>;
}

interface Message {
  groupId: string;
  randomUserId: string;
  message: string;
  timeStamp: Date;
  isReceived: boolean;
  type: string;
  taggedBy?: string;
  taggedMessage?: string;
}

function GroupChat({ setSelectedOption, groupId, setGroupId }: GroupChatProps) {
  const [showMenu, setShowMenu] = useState<boolean>(false);
  const [messages, setMessages] = useState<Message[]>([]);

  const [newMessage, setNewMessage] = useState<string>("");
  const [taggedBy, setTaggedBy] = useState<string | null>(null);
  const [taggedMessage, setTaggedMessage] = useState<string | null>(null);

  const [dropdownOpen, setDropdownOpen] = useState<number | null>(null);

  const socket = useWebSocket();
  const [user, setUser] = useRecoilState(userState);
  const [loading, setLoading] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [page, setPage] = useState(1);
  const [count, setCount] = useRecoilState(countState);

  // Cache for storing messages for each group
  const [messageCache, setMessageCache] = useState<Map<number, Message[]>>(new Map());


  // Fetch messages from the database
  const fetchMessages = async (groupId: string, page: number) => {
    try {
      const response = await infoAPI.getMessages(groupId, page);
      const data = response.data as Message[];

      if (data.length < 15) {
        setHasMore(false); // No more messages to load
      }
      return data;
    } catch (error) {
      console.error("Error fetching messages:", error);
      return [];
    }
  };

  useEffect(() => {
    // Load initial messages when groupId changes
    const loadInitialMessages = async () => {
      setPage(1);
      setHasMore(true);
      const initialMessages = await fetchMessages(groupId, 1);
      setMessages(initialMessages.reverse()); // Reverse to show newest at the bottom
    };

    if (groupId) {
      loadInitialMessages();
    }
  }, [groupId]);

  const loadMoreMessages = async () => {
    console.log("Loading more messages...");
    const nextPage = page + 1;
    const olderMessages = await fetchMessages(groupId, nextPage);
    console.log(olderMessages);
    setMessages((prev) => [...olderMessages.reverse(), ...prev]); // Prepend older messages
    setPage(nextPage);
    console.log("Loading more messages...");
  };



  useEffect(() => {
    // Update messages from the cache when the groupId changes
    const cachedMessages = messageCache.get(Number(groupId)) || [];
    setMessages(cachedMessages);
  }, [groupId]);

  useEffect(() => {
    if (!socket) return;

    const newCount = new Map(count);
    newCount.set(Number(groupId), 0);
    setCount(newCount);

    const handleSocketMessage = (event: MessageEvent) => {
      const message = JSON.parse(event.data);

      if (message.type === "PUBLISH_MESSAGE") {
        const data = message.payload;

        const newMessage = {
          ...data,
          isReceived: data.randomUserId !== user.get(Number(groupId)),
        };

        if (data.groupId === groupId) {      // currently opened groupChat === message sent to group by server   => sent count to zero else increment count by 1
          // Update current group messages
          setMessages((prev) => [...prev, newMessage]);
          // Update count
          const newCount = new Map(count);
          newCount.set(Number(groupId), 0);
          setCount(newCount);
        } else {
          console.log(count.get(Number(data.groupId)));
          const newValue = (count.get(Number(data.groupId)) ?? 0) + 1;
          console.log(newValue);
          const newCount = new Map(count);
          newCount.set(Number(data.groupId), newValue);
          setCount(newCount);
          console.log(count);
        }

        const cachedMessages = new Map(messageCache);
        cachedMessages.set(Number(data.groupId), [...(cachedMessages.get(Number(data.groupId)) || []), newMessage]);
        setMessageCache(cachedMessages);

      }

      else if (message.type === "LEAVE_GROUP_CONFIRMATION") {  //"LEAVE_GROUP_CONFIRMATION", { id: groupId }
        if (message.payload.id === groupId) {
          console.log("LEAVE_GROUP_CONFIRMATION");
        }
      }
    };

    socket.addEventListener("message", handleSocketMessage);
    return () => {
      console.log(groupId);
      if (groupId != "") {
        const handleLeaveGroup = async () => {
          const end = Date.now();
          console.log(groupId);
          const gId = parseInt(groupId, 10);
          await infoAPI.updateLastRead({ gId, end });
        };

        handleLeaveGroup();
      }
      socket.removeEventListener("message", handleSocketMessage);
    };
  }, [socket, groupId, messageCache, user]);



  const sendMessage = async () => {
    if (loading || newMessage.trim() === "") return;
    setLoading(true);

    const randomId = user.get(Number(groupId));
    console.log(randomId);

    try {
      socket?.send(
        JSON.stringify({
          type: "SEND_MESSAGE",
          payload: { groupId, randomId, msg: newMessage.trim(), taggedBy, taggedMessage, type: "message" },
        })
      );
      setNewMessage("");
      setTaggedBy(null);
      setTaggedMessage(null);
    } catch (error) {
      console.error("Error sending message:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleMenuClick = (option: string) => {
    setShowMenu(false);
    if (option === "Leave Group") {
      console.log("Leave Group");
      try {
        socket?.send(
          JSON.stringify({
            type: "LEAVE_GROUP",
            payload: { groupId },
          })
        );
        setSelectedOption("chats");
        setGroupId("");
      } catch (error) {
        console.error("Error leaving group:", error);
      }
    }
    else {
      setSelectedOption(option);
    }
  };

  return groupId ? (
    <div className="p-6 bg-gray-100 rounded-lg shadow-md max-w-3xl mx-auto">
      {/* Three dots menu */}
      <div className="relative mb-4">
        <button
          className="text-2xl float-right"
          onClick={() => setShowMenu((prev) => !prev)}
        >
          &#8230;
        </button>
        {showMenu && (
          <Menu
            options={["groupInfo", "Leave Group", "inviteFriend"]}
            onOptionSelect={handleMenuClick}
          />
        )}
      </div>

      <h2 className="text-2xl font-bold text-gray-800 mb-4">Group Chat</h2>
      <p className="text-gray-600 mb-6">You're viewing messages for Group ID: {groupId}</p>
      {/* Messages Display with Infinite Scroll */}
      <div
        id="scrollableDiv"
        className="overflow-y-auto h-96 mb-6 bg-white rounded-lg p-4 shadow-inner flex flex-col-reverse"
      >
        <InfiniteScroll
          dataLength={messages.length}
          next={loadMoreMessages}
          hasMore={hasMore}
          inverse={true}
          loader={<p className="text-center text-gray-500">Loading...</p>}
          scrollableTarget="scrollableDiv"
        >
          {!hasMore && (
            <p className="text-center text-gray-500 mb-4">No more messages to load</p>
          )}
          {messages.map((msg, idx) => (
            <div>
              {msg.type === "notification" ?
                <div
                  key={idx}
                  className={`flex mb-4 justify-center`}
                >
                  <div
                    className={"bg-gray-200 text-gray-800 rounded-lg px-4 py-2 shadow-sm max-w-xs"}
                  >
                    <p className="text-sm">{msg.message}</p>
                    <span
                      className={"text-xs text-gray-500"
                      }
                    >
                      {new Date(msg.timeStamp).toLocaleTimeString()}
                    </span>
                  </div>
                </div>
                :
                <div
                  key={idx}
                  className={`flex mb-4 ${msg.isReceived ? "justify-start" : "justify-end"}`}
                >
                  <div className="relative flex items-center space-x-2">


                    {/* Message Container */}
                    <div className="flex flex-col items-start space-y-2 w-full relative group">

                      {/* Message Bubble */}
                      <div
                        className={`${msg.isReceived ? "text-gray-800" : "text-white"
                          } rounded-lg px-4 py-2 shadow-sm max-w-xs relative`}
                      >
                        {/* Tagged Message Section */}
                        {msg.taggedBy && msg.taggedMessage && (
                          <div className="bg-blue-100 border-l-4 border-blue-500 rounded-tl-md rounded-tr-md p-2">
                            <p className="text-xs font-semibold text-blue-600">
                              {msg.taggedBy}
                            </p>
                            <p className="text-sm text-gray-700 italic">
                              "{msg.taggedMessage}"
                            </p>
                          </div>
                        )}

                        {/* Main Message Content */}
                        <div className="bg-white border-l-4 border-blue-500 rounded-b-md p-4 relative pb-8 min-w-[190px]">
                          <p className={`text-xs font-semibold ${msg.isReceived ? "text-blue-600" : "text-yellow-600"}`}>
                            {msg.randomUserId}
                          </p>
                          <p className="text-lg text-gray-800 italic">
                            {msg.message}
                          </p>
                          {/* Time Display */}
                          <div className="absolute right-2 bottom-2 text-xs text-gray-400 whitespace-nowrap">
                            {new Date(msg.timeStamp).toLocaleTimeString([], {
                              day: '2-digit',
                              month: 'long',
                              year: 'numeric',
                              hour: '2-digit',
                              minute: '2-digit'
                            })}
                          </div>
                        </div>
                        
                      </div>


                      {/* Dropdown Icon */}
                      <div className="absolute top-2 right-2 invisible group-hover:visible">
                        <div className="relative">
                          <button
                            onClick={() => setDropdownOpen(idx)}
                            className="text-gray-500 hover:text-gray-900 text-lg pl-6"
                          >
                            ˇ
                          </button>
                          {dropdownOpen === idx && (
                            <div className="absolute right-0 mt-1 w-24 bg-white border border-gray-300 rounded-md shadow-md z-10">
                              <ul className="py-1">
                                <li
                                  onClick={() => {
                                    setTaggedBy(msg.randomUserId);
                                    setTaggedMessage(msg.message);
                                    setDropdownOpen(null); // Close dropdown after action
                                  }}
                                  className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                  Tag
                                </li>
                                <li
                                  onClick={() => setDropdownOpen(null)} // Close dropdown if no action
                                  className="px-2 py-1 text-sm text-gray-700 hover:bg-gray-100 cursor-pointer"
                                >
                                  Close
                                </li>
                              </ul>
                            </div>
                          )}
                        </div>
                      </div>

                    </div>
                  </div>
                </div>
              }

            </div>

          ))}
        </InfiniteScroll>

      </div>

      {/* Message Input */}
      <div className="p-2 border-t border-gray-200 bg-white flex flex-col space-y-2">

        {/* Tagged Message Section */}
        {taggedBy && taggedMessage && (
          <div className="flex items-center space-x-2 p-2 bg-gray-100 border-l-4 border-blue-500 rounded-md">
            <div className="flex-grow">
              <p className="text-xs font-semibold text-blue-500">Tagged by: {taggedBy}</p>
              <p className="text-sm text-gray-600 italic">{taggedMessage}</p>
            </div>
            <button
              onClick={() => {
                setTaggedBy(null);
                setTaggedMessage(null);
              }}
              className="text-gray-500 hover:text-gray-700"
            >
              ✖
            </button>
          </div>
        )}

        {/* Input Section */}
        <div className="flex items-center bg-gray-100 p-2 rounded-full border border-gray-300 shadow-sm">
          <input
            type="text"
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type a message"
            className="flex-grow bg-transparent text-sm p-2 focus:outline-none"
          />
          <button
            onClick={sendMessage}
            disabled={loading}
            className={`ml-2 px-3 py-2 rounded-full font-medium text-white text-sm ${loading ? "bg-blue-300" : "bg-blue-500 hover:bg-blue-600"
              }`}
          >
            {loading ? "..." : "➤"}
          </button>
        </div>
      </div>



    </div>
  ) : (
    <div className="text-center text-gray-500">Select a group to start chatting.</div>
  );

}

export default GroupChat;


