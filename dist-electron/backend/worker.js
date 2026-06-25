"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const trpc_js_1 = require("./trpc.js");
const caller = (0, trpc_js_1.createCaller)({});
process.on("message", async (message) => {
    try {
        const fn = caller[message.payload.procedureName];
        const result = await fn(JSON.parse(message.payload.data));
        process.send?.({
            id: message.id,
            result
        });
    }
    catch (error) {
        process.send?.({
            id: message.id,
            error: String(error)
        });
    }
});
