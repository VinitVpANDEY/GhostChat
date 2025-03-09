import { useState, useEffect } from "react";
import InfiniteScroll from "react-infinite-scroll-component";
import { infoAPI } from "../api";

interface User {
  id: number;
  username: string;
}

interface SelectFriendsProps {
  setFriendList: React.Dispatch<React.SetStateAction<User[]>>;
  numberOfFriends: number;
}

const SelectFriends = ({ setFriendList, numberOfFriends }: SelectFriendsProps) => {
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUsers, setSelectedUsers] = useState<User[]>([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Fetch users from backend
  const fetchUsers = async (search: string, pageNumber: number) => {
    try {
      const response = await infoAPI.getUsers(search, pageNumber, 15);
      const fetchedUsers = response.data as User[];
      setUsers((prev) => (pageNumber === 1 ? fetchedUsers : [...prev, ...fetchedUsers]));
      setHasMore(fetchedUsers.length === 15);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  // Handle search with debouncing
  useEffect(() => {
    const timeout = setTimeout(() => {
      setPage(1);
      fetchUsers(searchTerm, 1);
    }, 300);
    return () => clearTimeout(timeout);
  }, [searchTerm]);

  // Fetch users on page change
  useEffect(() => {
    fetchUsers(searchTerm, page);
  }, [page]);

  const handleSelect = (user: User) => {
    if (selectedUsers.length < numberOfFriends && !selectedUsers.some((u) => u.id === user.id)) {
      const updatedUsers = [...selectedUsers, user];
      setSelectedUsers(updatedUsers);
      setFriendList(updatedUsers); // Use the updated state
    }
  }

  const handleRemove = (userId: number) => {
    setSelectedUsers((prev) => prev.filter((user) => user.id !== Number(userId)));
    setFriendList(selectedUsers);
  };

  return (
    <div className="w-full max-w-md mx-auto p-6 bg-white shadow-md rounded-lg">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search users..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full p-3 border rounded-lg focus:outline-none focus:ring focus:border-blue-300"
        />
      </div>

      {/* Selected Users */}
      <div className="mb-6">
        <div className="flex flex-wrap gap-2">
          {selectedUsers.map((user) => (
            <div
              key={user.id}
              className="flex items-center bg-blue-100 px-3 py-1 rounded-full"
            >
              <span className="text-gray-800">{user.username}</span>
              <button
                className="ml-2 text-red-500 hover:text-red-600 focus:outline-none"
                onClick={() => handleRemove(user.id)}
              >
                &times;
              </button>
            </div>
          ))}
        </div>
      </div>

      {/* Infinite Scroll User List */}
      <InfiniteScroll
        dataLength={users.length}
        next={() => setPage((prev) => prev + 1)}
        hasMore={hasMore}
        loader={<div className="text-center py-2">Loading...</div>}
        scrollThreshold={0.9}
      >
        <div>
          {users.map((user) => (
            <div
              key={user.id}
              className="flex justify-between items-center p-3 border-b hover:bg-gray-100 rounded-md transition-all cursor-pointer"
              onClick={() => handleSelect(user)}
            >
              <span className="text-gray-800">{user.username}</span>
              <input
                type="checkbox"
                checked={selectedUsers.some((u) => u.id === user.id)}
                onChange={() => handleSelect(user)}
                className="form-checkbox h-5 w-5 text-blue-500"
              />
            </div>
          ))}
        </div>
      </InfiniteScroll>
    </div>

  );
};

export default SelectFriends;
