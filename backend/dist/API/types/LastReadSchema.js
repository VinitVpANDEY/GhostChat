"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.lastReadSchema = void 0;
const zod_1 = require("zod");
exports.lastReadSchema = zod_1.z.object({
    gId: zod_1.z.number(),
    end: zod_1.z.number(),
});
