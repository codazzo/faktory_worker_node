"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const connection_1 = require("../connection");
const _helper_1 = require("./_helper");
_helper_1.registerCleaner(ava_1.default);
ava_1.default("#open: resolves after HI", async (t) => {
    await _helper_1.mocked(async (server, port) => {
        let acc = "";
        server.on("HI", () => (acc += "A"));
        const conn = new connection_1.Connection(port);
        await conn.open();
        acc += "B";
        t.is(acc, "AB");
    });
});
ava_1.default("#open: resolves with the server greeting", async (t) => {
    await _helper_1.mocked(async (_, port) => {
        const conn = new connection_1.Connection(port);
        const greeting = await conn.open();
        t.deepEqual(greeting, { v: 2, s: "abc", i: 3 });
    });
});
ava_1.default("#close: emits close", async (t) => {
    await _helper_1.mocked(async (_, port) => {
        const conn = new connection_1.Connection(port);
        conn.on("close", () => t.pass());
        await conn.open();
        await conn.close();
        t.is(conn.connected, false);
    });
});
ava_1.default("#open: emits connect", _helper_1.withCallback((t, end) => {
    _helper_1.mocked((_, port) => {
        const conn = new connection_1.Connection(port);
        conn.on("connect", end);
        return conn.open();
    });
}));
ava_1.default("#open: rejects when connection fails", async (t) => {
    const port = 1001;
    const conn = new connection_1.Connection(port);
    conn.on("error", () => { });
    await t.throwsAsync(conn.open(), { message: /ECONNREFUSED/ });
});
ava_1.default("#open: emits error when connection fails to connect", _helper_1.withCallback((t, end) => {
    const port = 1002;
    const conn = new connection_1.Connection(port);
    conn.on("error", (err) => {
        t.truthy(err);
        end();
    });
    conn
        .open()
        .catch(() => { })
        .then();
}));
ava_1.default("#send: resolves with server response", async (t) => {
    await _helper_1.mocked(async (_, port) => {
        const conn = new connection_1.Connection(port);
        await conn.open();
        const resp = await conn.send(["HELLO", '{ "v": 2, "s": "abc", "i": 3 }']);
        t.is(resp, "OK");
    });
});
ava_1.default("#sendWithAssert: throws when response does not match assertion", async (t) => {
    await _helper_1.mocked(async (_, port) => {
        const conn = new connection_1.Connection(port);
        await conn.open();
        return t.throwsAsync(conn.sendWithAssert(["HELLO", '{ "v": 2, "s": "abc", "i": 3 }'], "GOODBYE"), { message: /expected .* response/ });
    });
});
ava_1.default("#sendWithAssert: does not throw when response matches assertion", async (t) => {
    await _helper_1.mocked(async (_, port) => {
        const conn = new connection_1.Connection(port);
        await conn.open();
        return t.notThrowsAsync(conn.sendWithAssert(["HELLO", '{ "v": 2, "s": "abc", "i": 3 }'], "OK"));
    });
});
ava_1.default("#send: throws when the server responds with error", async (t) => {
    await _helper_1.mocked(async (server, port) => {
        server.on("INFO", ({ socket }) => {
            socket.write("-ERR Something is wrong\r\n");
        });
        const conn = new connection_1.Connection(port);
        await conn.open();
        return t.throwsAsync(conn.send(["INFO"]), {
            message: /something is wrong/i,
        });
    });
});
ava_1.default("#send: emits timeout when exceeds deadline", async (t) => {
    await _helper_1.mocked(async (server, port) => {
        let acc = "";
        server.on("INFO", ({ socket }) => {
            setTimeout(() => _helper_1.mocked.ok()({ socket }), 301);
        });
        const conn = new connection_1.Connection(port);
        await conn.open();
        conn.setTimeout(100);
        conn.on("timeout", () => (acc += "To"));
        await conn.send(["INFO"]);
        t.is(acc, "To");
    });
});
