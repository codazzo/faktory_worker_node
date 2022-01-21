"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const worker_1 = require("../worker");
const _helper_1 = require("./_helper");
_helper_1.registerCleaner(ava_1.default);
ava_1.default("accepts queues as array", (t) => {
    const worker = new worker_1.Worker({ queues: ["test"] });
    t.deepEqual(worker.queues, ["test"], "queue passed as string does not yield array");
});
ava_1.default("accepts queues as an array", (t) => {
    const worker = new worker_1.Worker({ queues: ["test"] });
    t.deepEqual(worker.queues, ["test"], "queues passed as array does not yield array");
});
ava_1.default("adds default to an empty queue array", (t) => {
    const worker = new worker_1.Worker({ queues: [] });
    t.deepEqual(worker.queues, ["default"]);
});
ava_1.default("passes the password to the client", (t) => {
    const worker = new worker_1.Worker({ password: "1234" });
    t.is(worker.client.password, "1234");
});
ava_1.default("passes poolSize option to Client", (t) => {
    const worker = new worker_1.Worker({ poolSize: 8 });
    t.is(worker.client.pool.size, 8);
});
ava_1.default.only("allows registering job functions", async (t) => {
    await _helper_1.mocked(async (server, port) => {
        server
            .on("BEAT", _helper_1.mocked.beat())
            .on("ACK", _helper_1.mocked.ok())
            .on("FETCH", _helper_1.mocked.fetch({ jid: "123", jobtype: "test", args: [], queue: "defaut" }));
        const worker = new worker_1.Worker({ concurrency: 1, port });
        worker.register("test", () => t.pass());
        await worker.work();
        await worker.stop();
    });
});
ava_1.default("hearbeats", async (t) => {
    await _helper_1.mocked(async (server, port) => {
        let worker;
        let called = 0;
        return new Promise((resolve) => {
            server
                .on("BEAT", ({ socket }) => {
                called += 1;
                if (called == 3) {
                    t.pass();
                    resolve();
                    worker.stop();
                }
                _helper_1.mocked.beat()({ socket });
            })
                .on("FETCH", _helper_1.mocked.fetch(null));
            worker = new worker_1.Worker({ concurrency: 1, port, beatInterval: 0.1 });
            worker.work();
        });
    });
});
ava_1.default(".work() creates a worker, runs, then resolves the worker", async (t) => {
    t.plan(3);
    await _helper_1.mocked(async (server, port) => {
        server
            .on("BEAT", ({ socket }) => {
            socket.write("+OK\r\n");
            t.true(true);
        })
            .on("FETCH", async ({ socket }) => {
            await _helper_1.sleep(10);
            t.true(true);
            socket.write("$-1\r\n");
        });
        const worker = await new worker_1.Worker({ port, concurrency: 1 }).work();
        t.true(worker instanceof worker_1.Worker);
        await worker.stop();
    });
});
