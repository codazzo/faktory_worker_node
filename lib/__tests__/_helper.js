"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.withCallback = exports.registerCleaner = exports.flush = exports.push = exports.createJob = exports.randQueue = exports.sleep = exports.mocked = exports.mockServer = void 0;
const util_1 = require("util");
const net_1 = require("net");
const uuid_1 = require("uuid");
const get_port_1 = __importDefault(require("get-port"));
const client_1 = require("../client");
const mockServer = () => {
    const server = net_1.createServer();
    server.on("connection", (socket) => {
        server
            .once("HELLO", ({ socket }) => socket.write("+OK\r\n"))
            .on("END", ({ socket }) => socket.destroy());
        socket.on("data", (chunk) => {
            const string = chunk.toString();
            const [command] = string.replace(/\r\n$/, "").split(" ", 1);
            const rawData = string.replace(`${command} `, "");
            let data = rawData;
            try {
                data = JSON.parse(rawData);
            }
            catch (_) { }
            server.emit(command, { command, data, socket });
            server.emit("*", { command, data, socket });
        });
        socket.write('+HI {"v":2,"s":"abc","i":3}\r\n');
        server.emit("HI");
    });
    return server;
};
exports.mockServer = mockServer;
const mocked = async (fn) => {
    const server = exports.mockServer();
    const port = await get_port_1.default();
    server.listen(port, "127.0.0.1");
    try {
        return fn(server, port);
    }
    finally {
        await new Promise((resolve) => server.close(() => resolve()));
    }
};
exports.mocked = mocked;
exports.mocked.ok = () => ({ socket }) => {
    socket.write("+OK\r\n");
};
exports.mocked.fail = exports.mocked.ok;
exports.mocked.beat = (state) => ({ socket }) => {
    if (!state) {
        socket.write("+OK\r\n");
    }
    else {
        const json = JSON.stringify({ state });
        socket.write(`$${json.length}\r\n${json}\r\n`);
    }
};
exports.mocked.fetch = (job) => ({ socket }) => {
    if (job) {
        const string = JSON.stringify(job);
        socket.write(`$${string.length}\r\n${string}\r\n`);
    }
    else {
        socket.write("$-1\r\n");
    }
};
exports.mocked.info = () => ({ socket }) => {
    const json = JSON.stringify({
        queues: [],
        faktory: {},
        server_utc_time: Date.now(),
    });
    socket.write(`$${json.length}\r\n${json}\r\n`);
};
const sleep = (ms, value) => {
    return new Promise((resolve) => setTimeout(() => resolve(value), ms));
};
exports.sleep = sleep;
const randQueue = (label = "test") => {
    return `${label}-${uuid_1.v4().slice(0, 6)}`;
};
exports.randQueue = randQueue;
const createJob = (...args) => {
    return {
        jobtype: "testJob",
        queue: exports.randQueue(),
        args,
    };
};
exports.createJob = createJob;
const push = async ({ args, queue, jobtype, } = {}) => {
    const client = new client_1.Client();
    const job = client.job(jobtype || "test");
    job.queue = queue || exports.randQueue();
    job.args = args || [];
    await job.push();
    client.close();
    return job;
};
exports.push = push;
const flush = () => new client_1.Client().flush();
exports.flush = flush;
function registerCleaner(test) {
    test.beforeEach(async () => {
        await exports.flush();
    });
    test.afterEach.always(async () => {
        await exports.flush();
    });
}
exports.registerCleaner = registerCleaner;
const withCallback = (fn) => async (t) => {
    await util_1.promisify(fn)(t);
    t.pass();
};
exports.withCallback = withCallback;
