"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.randomIdRenerator = void 0;
function randomIdRenerator(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let result = '';
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * characters.length));
    }
    return result;
}
exports.randomIdRenerator = randomIdRenerator;
