"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const worker_1 = require("../worker");
const _helper_1 = require("./_helper");
_helper_1.registerCleaner(ava_1.default);
ava_1.default("invokes middleware", async (t) => {
    const { queue, jobtype } = await _helper_1.push();
    await new Promise((resolve) => {
        const worker = new worker_1.Worker({
            concurrency: 1,
            queues: [queue],
            middleware: [
                (ctx, next) => {
                    ctx.job.args = ["hello"];
                    return next();
                },
            ],
            registry: {
                [jobtype]: (...args) => {
                    t.deepEqual(args, ["hello"], "middleware not executed");
                    resolve();
                },
            },
        });
        worker.work();
    });
});
ava_1.default("invokes middleware in order", async (t) => {
    const recorder = [];
    const { queue, jobtype } = await _helper_1.push();
    const worker = new worker_1.Worker({
        concurrency: 1,
        queues: [queue],
        middleware: [
            async (_, next) => {
                recorder.push("before 1");
                await next();
                recorder.push("after 1");
            },
            async (_, next) => {
                recorder.push("before 2");
                await next();
                recorder.push("after 2");
            },
        ],
    });
    await new Promise((resolve) => {
        worker.register(jobtype, async () => {
            recorder.push("run 1");
            await _helper_1.sleep(1);
            recorder.push("run 2");
            resolve();
        });
        worker.work();
    });
    await worker.stop();
    t.deepEqual(recorder, ["before 1", "before 2", "run 1", "run 2", "after 2", "after 1"], "middleware not executed in order");
});
ava_1.default(".use() adds middleware to the stack", (t) => {
    const worker = new worker_1.Worker();
    const mmw = () => { };
    worker.use(mmw);
    t.is(worker.middleware[0], mmw, "middleware function not added to .middleware");
});
ava_1.default("middleware context is passed to job thunk", async (t) => {
    const { queue, jobtype } = await _helper_1.push({ args: [1] });
    const worker = new worker_1.Worker({ queues: [queue], concurrency: 1 });
    worker.use((ctx, next) => {
        ctx.memo = ["hello"];
        return next();
    });
    worker.use((ctx, next) => {
        ctx.memo.push("world");
        return next();
    });
    await new Promise((resolve) => {
        worker.register(jobtype, (...args) => ({ memo }) => {
            t.deepEqual(args, [1], "args not correct");
            t.deepEqual(memo, ["hello", "world"]);
            worker.stop();
            resolve();
        });
        worker.work();
    });
});
