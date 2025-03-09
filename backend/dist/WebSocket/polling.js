"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.startPolling = void 0;
const dbQuery_1 = require("../dbQuery");
const RedisClient_1 = require("./RedisClient");
function startPolling() {
    return __awaiter(this, void 0, void 0, function* () {
        while (true) {
            try {
                const poppedData = yield RedisClient_1.MessageManagerRedisClient.rPop("messages");
                if (poppedData) {
                    const { groupId, randomUserId, message, timeStamp, type, taggedBy, taggedMessage } = JSON.parse(poppedData);
                    console.log(`Popped message: ${message} from ${randomUserId} in ${groupId}`);
                    yield (0, dbQuery_1.addMessageDB)(groupId, randomUserId, message, timeStamp, type, taggedBy, taggedMessage);
                    console.log("Db update successfull");
                }
                else {
                    // console.log('No data to pop')
                }
            }
            catch (error) {
                console.error('Error popping score:', error);
            }
        }
    });
}
exports.startPolling = startPolling;
