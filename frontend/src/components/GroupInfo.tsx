import { useEffect, useState } from "react";
import { infoAPI } from "../api";

interface Member {
  id: number;
  username: string;
}

interface GroupInfo {
  name: string;
  members: Member[];
  size: number;
  createdAt: Date;
}

function GroupInfo({ groupId }: { groupId: string }) {
  const [group, setGroup] = useState<GroupInfo>();

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await infoAPI.getGroup(groupId);
        const fetchedData = response.data as GroupInfo;
        if (fetchedData) setGroup(fetchedData);
      } catch (error) {
        console.error("Failed to fetch group members:", error);
      }
    };
    fetchData();
  }, [groupId]);

  return (
    <div className="p-6 bg-gradient-to-r from-blue-50 via-blue-100 to-blue-50 rounded-lg shadow-lg max-w-3xl mx-auto">
      {/* Group Name */}
      <h2 className="text-4xl font-serif text-blue-800 mb-6 text-center">
        {group?.name || "Loading..."}
      </h2>

      {/* Group Details */}
      <div className="mb-6 bg-white p-4 rounded-lg shadow-sm">
        <p className="text-gray-700 text-lg font-medium mb-2">
          <span className="font-bold text-blue-900">Group Size:</span>{" "}
          {group?.size || 0}
        </p>
        <p className="text-gray-700 text-lg font-medium">
          <span className="font-bold text-blue-900">Created On:</span>{" "}
          {group?.createdAt
            ? new Date(group.createdAt).toLocaleDateString()
            : "Loading..."}
        </p>
      </div>

      {/* Members Section */}
      <h3 className="text-3xl font-semibold text-gray-800 mb-4">Group Members</h3>
      <div className="space-y-4">
        {group?.members?.length ? (
          group.members.map((member) => (
            <div
              key={member.id}
              className="flex items-center bg-white p-3 rounded-md shadow-sm hover:shadow-lg transition-shadow"
            >
              <div className="flex-shrink-0 w-10 h-10 bg-blue-100 text-blue-600 font-bold rounded-full flex items-center justify-center mr-3">
                {member.username[0].toUpperCase()}
              </div>
              <div>
                <h4 className="text-base font-medium text-gray-700">
                  {member.username}
                </h4>
                <p className="text-sm text-gray-500">Member ID: {member.id}</p>
              </div>
            </div>
          ))
        ) : (
          <p className="text-gray-500 text-center">No members found in this group.</p>
        )}
      </div>
    </div>
  );
}

export default GroupInfo;
