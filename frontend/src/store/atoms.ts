// Recoil atoms require updates to be immutable. Since Map is mutable, you need to create a new Map when updating the state.
import { atom } from "recoil";

interface Group {
  id: string;
  groupName: string;
}


export const userState = atom<Map<number, string>>({
  key: "userState", 
  default: new Map<number, string>(),   // groupId: randomUserId
});


export const groupsState = atom<Group[]>({
  key: "groupsState", 
  default: [], 
});


export const countState = atom<Map<number, number>>({
  key: "countState",
  default: new Map<number, number>(), // groupId: count
});


