"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const worker_1 = require("../worker");
const _helper_1 = require("./_helper");
const concurrency = 1;
_helper_1.registerCleaner(ava_1.default);
function create(options = {}) {
    return new worker_1.Worker(Object.assign({ concurrency }, options));
}
ava_1.default("passes args to jobfn", async (t) => {
    const args = [1, 2, "three"];
    const { queue, jobtype } = await _helper_1.push({ args });
    await new Promise((resolve) => {
        const worker = create({
            queues: [queue],
            registry: {
                [jobtype]: (...args) => {
                    t.deepEqual(args, [1, 2, "three"], "args do not match");
                    resolve();
                },
            },
        });
        worker.work();
    });
});
ava_1.default("awaits async jobfns", async (t) => {
    const args = [1, 2, "three"];
    const { queue, jobtype } = await _helper_1.push({ args });
    await new Promise((resolve) => {
        const worker = create({
            queues: [queue],
            registry: {
                [jobtype]: async (...args) => {
                    await _helper_1.sleep(1);
                    t.deepEqual(args, [1, 2, "three"], "args do not match");
                    resolve();
                },
            },
        });
        worker.work();
    });
});
ava_1.default("handles sync jobfn and sync thunk", async (t) => {
    const args = [1, 2, "three"];
    const { queue, jobtype, jid } = await _helper_1.push({ args });
    await new Promise((resolve) => {
        const worker = create({
            queues: [queue],
            registry: {
                [jobtype]: (...args) => ({ job }) => {
                    t.is(job.jid, jid, "jid does not match");
                    t.deepEqual(args, [1, 2, "three"], "args do not match");
                    resolve();
                },
            },
        });
        worker.work();
    });
});
ava_1.default("handles sync jobfn and async (thunk)", async (t) => {
    const args = [1, 2, "three"];
    const { queue, jobtype, jid } = await _helper_1.push({ args });
    await new Promise((resolve) => {
        const worker = create({
            queues: [queue],
            registry: {
                [jobtype]: (...args) => async ({ job }) => {
                    await _helper_1.sleep(1);
                    t.is(job.jid, jid, "jid does not match");
                    t.deepEqual(args, [1, 2, "three"], "args do not match");
                    resolve();
                },
            },
        });
        worker.work();
    });
});
ava_1.default("handles async jobfn and sync thunk", async (t) => {
    const args = [1, 2, "three"];
    const { queue, jobtype, jid } = await _helper_1.push({ args });
    const worker = create({ queues: [queue] });
    await new Promise(async (resolve) => {
        worker.register(jobtype, async (...args) => ({ job }) => {
            t.is(job.jid, jid, "jid does not match");
            t.deepEqual(args, [1, 2, "three"], "args do not match");
            resolve();
        });
        await worker.work();
        await worker.stop();
    });
});
ava_1.default("handles async jobfn and async thunk", async (t) => {
    const args = [1, 2, "three"];
    const { queue, jobtype, jid } = await _helper_1.push({ args });
    await new Promise((resolve) => {
        const worker = create({
            queues: [queue],
            registry: {
                [jobtype]: async (...args) => async ({ job }) => {
                    await _helper_1.sleep(1);
                    t.is(job.jid, jid, "jid does not match");
                    t.deepEqual(args, [1, 2, "three"], "args do not match");
                    resolve();
                },
            },
        });
        worker.work();
    });
});
ava_1.default(".handle() FAILs and throws when no job is registered", async (t) => {
    const job = { jid: "123", jobtype: "Unknown", args: [], queue: "default" };
    await _helper_1.mocked(async (server, port) => {
        let worker;
        return new Promise((resolve) => {
            server
                .on("BEAT", _helper_1.mocked.beat())
                .on("FETCH", _helper_1.mocked.fetch(job))
                .on("FAIL", ({ data }) => {
                t.is(data.jid, job.jid);
                worker.stop();
                resolve();
            });
            worker = create({ port });
            worker.work();
        });
    });
});
ava_1.default(".handle() FAILs and throws when the job throws (sync) during execution", async (t) => {
    const jid = "123";
    const jobtype = "failingjob";
    const queue = "default";
    const job = { jid, jobtype, args: [], queue };
    await _helper_1.mocked(async (server, port) => {
        let worker;
        return new Promise((resolve) => {
            server
                .on("BEAT", _helper_1.mocked.beat())
                .on("FETCH", _helper_1.mocked.fetch(job))
                .on("FAIL", ({ data }) => {
                t.is(data.jid, jid);
                t.truthy(/always fails/.test(data.message));
                worker.stop();
                resolve();
            });
            worker = create({
                port,
                registry: {
                    [jobtype]: () => {
                        throw new Error("always fails");
                    },
                },
            });
            worker.work();
        });
    });
});
// #2
ava_1.default(".handle() FAILs and throws when the job rejects (async) during execution", async (t) => {
    const jid = "123";
    const jobtype = "failingjob";
    const queue = "default";
    const job = { jid, jobtype, args: [], queue };
    await _helper_1.mocked(async (server, port) => {
        let worker;
        return new Promise((resolve) => {
            server
                .on("BEAT", _helper_1.mocked.beat())
                .on("FETCH", _helper_1.mocked.fetch(job))
                .on("FAIL", ({ data }) => {
                t.is(data.jid, jid);
                t.truthy(/rejected promise/.test(data.message));
                worker.stop();
                resolve();
            });
            worker = create({
                port,
                registry: {
                    [jobtype]: async () => {
                        throw new Error("rejected promise");
                    },
                },
            });
            worker.work();
        });
    });
});
// #2
ava_1.default(".handle() FAILs when the job returns a rejected promise with no error", async (t) => {
    const jid = "123";
    const jobtype = "failingjob";
    const queue = "default";
    const job = { jid, jobtype, args: [], queue };
    await _helper_1.mocked(async (server, port) => {
        let worker;
        return new Promise((resolve) => {
            server
                .on("BEAT", _helper_1.mocked.beat())
                .on("FETCH", _helper_1.mocked.fetch(job))
                .on("FAIL", ({ data }) => {
                t.is(data.jid, jid);
                t.truthy(/no error or message/.test(data.message));
                worker.stop();
                resolve();
            });
            worker = create({
                port,
                registry: {
                    [jobtype]: async () => Promise.reject(),
                },
            });
            worker.work();
        });
    });
});
