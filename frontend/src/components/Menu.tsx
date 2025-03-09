import React from "react";

interface MenuProps {
  options: string[];
  onOptionSelect: (option: string) => void;
}

function Menu({ options, onOptionSelect }: MenuProps) {
  return (
    <div className="absolute right-0 top-8 bg-white shadow-md border rounded">
      <ul>
        {options.map((option) => (
          <li
            key={option}
            onClick={() => onOptionSelect(option)}
            className="p-2 text-blue-700 hover:bg-gray-200 cursor-pointer"
          >
            {option.replace(/([a-z])([A-Z])/g, "$1 $2").replace(/\b\w/g, (char) => char.toUpperCase())}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default Menu;
