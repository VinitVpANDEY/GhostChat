import { useState } from "react";
import Navbar from "../components/Navbar";
import Chats from "../components/Chats";
import Requests from "../components/Requests";
import NewGroup from "../components/NewGroup";
import Profile from "../components/Profile";
import GroupChat from "../components/GroupChat";
import GroupInfo from "../components/GroupInfo";
import InviteFriend from "../components/InviteFriend";

interface DynamicComponentProps {
    selectedOption: string;
    setSelectedOption: React.Dispatch<React.SetStateAction<string>>
    groupId: string;
    setGroupId: React.Dispatch<React.SetStateAction<string>>;
}

function DynamicComponent({ selectedOption, setSelectedOption, groupId, setGroupId }: DynamicComponentProps) {
    switch (selectedOption) {
        case "chats":
            return <Chats setGroupId={setGroupId} />;
        case "requests":
            return <Requests setSelectedOption={setSelectedOption} />;
        case "newGroup":
            return <NewGroup setSelectedOption={setSelectedOption} />;
        case "profile":
            return <Profile />;
        case "groupInfo":
            return <GroupInfo groupId={groupId} />;
        case "inviteFriend":
            return <InviteFriend groupId={groupId} setSelectedOption={setSelectedOption} />;
        default:
            return <div>Select an option from the menu.</div>;
    }
}


const HomePage = () => {
    const [selectedOption, setSelectedOption] = useState<string>("chats");
    const [groupId, setGroupId] = useState<string>("");

    return (
        <div className="flex h-screen">

            {/* NavBar */}
            <div className="w-1/6 bg-gray-100 p-4 border-r">
                <Navbar setSelectedOption={setSelectedOption} />
            </div>

            {/* Dynamic Components */}
            <div className="flex-1 bg-white p-4 border-r">
                <DynamicComponent selectedOption={selectedOption} setSelectedOption={setSelectedOption} groupId={groupId} setGroupId={setGroupId} />
            </div>

            {/* Group Chat */}
            <div className="w-1/2 bg-gray-50 p-4">
                <GroupChat setSelectedOption={setSelectedOption} groupId={groupId} setGroupId={setGroupId} />
            </div>

        </div>
    );
}

export default HomePage;