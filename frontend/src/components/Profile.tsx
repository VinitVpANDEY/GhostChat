import { useEffect, useState } from "react";
import { infoAPI } from "../api";
import { useAuth } from "../context/AuthContext";

interface User {
  username: string;
  email: string;
  notificationPermission: boolean;
  theme: string;
}

function Profile() {
  const [user, setUser] = useState<User>();
  const { logout } = useAuth();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await infoAPI.getUser();
        const fetchedData = response.data as User;
        if (fetchedData) setUser(fetchedData);
      } catch (error) {
        console.error("Failed to fetch user data:", error);
      }
    };
    fetchData();
  }, []);

  const handleUpdateTheme = () => {
    console.log("Open theme change dialog");
  };

  const toggleNotifications = async () => {
    try {
      const updatedUser = {
        ...user,
        notificationPermission: !user?.notificationPermission,
      };
      // setUser(updatedUser);
      // await infoAPI.updateUserNotificationPermission(updatedUser.notificationPermission);
    } catch (error) {
      console.error("Failed to update notification settings:", error);
    }
  };

  return (
    <div className="max-w-md mx-auto bg-white p-6 shadow-md rounded-lg">
      <h2 className="text-2xl font-bold mb-6 text-blue-600">Profile</h2>
      {user ? (
        <div className="space-y-4">
          <div>
            <h3 className="text-lg font-semibold">Username</h3>
            <p className="text-gray-700">{user.username}</p>
          </div>
          <div>
            <h3 className="text-lg font-semibold">Email</h3>
            <p className="text-gray-700">{user.email}</p>
          </div>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Notifications</h3>
            <button
              className={`py-1 px-3 rounded-md text-white ${user.notificationPermission ? "bg-green-500" : "bg-red-500"
                }`}
              onClick={toggleNotifications}
            >
              {user.notificationPermission ? "Enabled" : "Disabled"}
            </button>
          </div>
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-semibold">Theme</h3>
            <button
              className="py-1 px-3 bg-blue-500 text-white rounded-md"
              onClick={handleUpdateTheme}
            >
              {user.theme}
            </button>
          </div>
        </div>
      ) : (
        <p className="text-gray-500">Loading user data...</p>
      )}

      <button
        onClick={logout}
        className={`ml-2 mt-4 px-4 py-2 rounded-lg font-medium text-white bg-red-500 hover:bg-red-600 focus:outline-none`}
      >
        {"Logout"}
      </button>

    </div>
  );
}

export default Profile;
