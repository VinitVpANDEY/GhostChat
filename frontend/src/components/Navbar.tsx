import React from "react";

interface NavbarProps {
  setSelectedOption: React.Dispatch<React.SetStateAction<string>>;
}

function Navbar({ setSelectedOption }: NavbarProps) {
  return (
    <nav className="bg-white shadow-md p-4 rounded-lg">
      <ul className="space-y-2">
        <li>
          <button
            onClick={() => setSelectedOption("chats")}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 rounded-lg"
          >
            Groups
          </button>
        </li>
        <li>
          <button
            onClick={() => setSelectedOption("requests")}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 rounded-lg"
          >
            Requests
          </button>
        </li>
        <li>
          <button
            onClick={() => setSelectedOption("newGroup")}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 rounded-lg"
          >
            New Group
          </button>
        </li>
        <li>
          <button
            onClick={() => setSelectedOption("profile")}
            className="w-full text-left px-4 py-2 text-gray-700 hover:bg-blue-100 hover:text-blue-600 transition-all duration-200 rounded-lg"
          >
            Profile
          </button>
        </li>
      </ul>
    </nav>
  );
}

export default Navbar;
