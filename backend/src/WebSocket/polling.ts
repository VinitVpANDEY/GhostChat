import { addMessageDB } from "../dbQuery";
import { MessageManagerRedisClient } from "./RedisClient";

export async function startPolling() {
    while (true) {
        try {
            const poppedData = await MessageManagerRedisClient.rPop("messages");
            if (poppedData) {
                const { groupId, randomUserId, message, timeStamp, type, taggedBy, taggedMessage } = JSON.parse(poppedData);
                console.log(`Popped message: ${message} from ${randomUserId} in ${groupId}`);
                await addMessageDB(groupId, randomUserId, message, timeStamp, type, taggedBy, taggedMessage);
                console.log("Db update successfull")
            } else {
                // console.log('No data to pop')
            }

        } catch (error) {
            console.error('Error popping score:', error);
        }
    }
}



