import { ChannelManagerRedisClient } from "./RedisClient";

// Subscribe a user to a channel
export async function subscribe(groupId: string, userId: string) {
    const groupUsersKey = `group:${groupId}:users`;

    try {
        // Check if the key exists
        const exists = await ChannelManagerRedisClient.exists(groupUsersKey);

        if (!exists) {
            console.log(`Key ${groupUsersKey} does not exist. Creating it and adding user.`);
            // Add the user to the set, which creates the key if it doesn't exist
            await ChannelManagerRedisClient.sAdd(groupUsersKey, userId.toString());
            console.log(`User ${userId} subscribed to ${groupId}`);
            return;
        }

        // Check if the user is already a member
        const isMember = await ChannelManagerRedisClient.sIsMember(groupUsersKey, userId.toString());
        if (!isMember) {
            await ChannelManagerRedisClient.sAdd(groupUsersKey, userId.toString());
            console.log(`User ${userId} subscribed to ${groupId}`);
        } else {
            console.log(`User ${userId} is already a member of ${groupId}`);
        }
    } catch (error) {
        console.error("Error during check and subscribe:", error);
    }
}


// Unsubscribe a user from a channel
export async function unsubscribe(groupId: string, userId: string) {
    const groupUsersKey = `group:${groupId}:users`;
    const exists = await ChannelManagerRedisClient.sIsMember(groupUsersKey, userId.toString());
    if (!exists) return;
    await ChannelManagerRedisClient.sRem(groupUsersKey, userId.toString());
    console.log(`User ${userId} unsubscribed from ${groupId}`);
}

// Get subscribers of a channel
export async function getSubscribers(groupId: string) {
    const groupUsersKey = `group:${groupId}:users`;
    const subscribers = await ChannelManagerRedisClient.sMembers(groupUsersKey);
    return subscribers || [];
}
