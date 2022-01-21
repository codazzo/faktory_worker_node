"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const faktory_1 = require("../faktory");
const _helper_1 = require("./_helper");
_helper_1.registerCleaner(ava_1.default);
const concurrency = 1;
function create(options = {}) {
    return new faktory_1.Worker(Object.assign({ concurrency }, options));
}
ava_1.default(".quiet() stops job fetching", async (t) => {
    let fetched = 0;
    await _helper_1.mocked(async (server, port) => {
        server.once("BEAT", _helper_1.mocked.beat()).on("FETCH", (serverControl) => {
            fetched += 1;
            _helper_1.mocked.fetch(null)(serverControl);
        });
        const worker = create({ port });
        await worker.work();
        await _helper_1.sleep(20);
        const before = fetched;
        worker.quiet();
        await _helper_1.sleep(20);
        const after = fetched;
        t.truthy(fetched > 1);
        t.truthy(after - before < 2);
        worker.stop();
    });
});
ava_1.default(".stop() breaks the work loop", async (t) => {
    let called = 0;
    const { queue, jobtype } = await _helper_1.push();
    await _helper_1.push({ queue, jobtype });
    const stop = await new Promise((resolve) => {
        const worker = create({
            queues: [queue],
            registry: {
                [jobtype]: async () => {
                    resolve(() => worker.stop());
                    called += 1;
                },
            },
        });
        worker.work();
    });
    await stop();
    t.is(called, 1, "continued fetching after .stop");
});
ava_1.default(".stop() allows in-progress jobs to finish", async (t) => {
    const { queue, jobtype } = await _helper_1.push();
    const stop = await new Promise((resolve) => {
        const worker = create({
            queues: [queue],
            timeout: 250,
            registry: {
                [jobtype]: async () => {
                    resolve(() => worker.stop());
                    await _helper_1.sleep(100);
                    t.pass();
                },
            },
        });
        worker.work();
    });
    await stop();
});
ava_1.default("worker exits the process after stop timeout", async (t) => {
    const { queue, jobtype } = await _helper_1.push();
    let exited = false;
    const originalExit = process.exit;
    // @ts-ignore
    process.exit = (code) => {
        exited = true;
        process.exit = originalExit;
    };
    await new Promise(async (resolve) => {
        const worker = create({
            queues: [queue],
            timeout: 0.05,
            registry: {
                [jobtype]: async () => {
                    worker.stop();
                    await _helper_1.sleep(1000);
                    t.truthy(exited);
                    resolve();
                },
            },
        });
        worker.work();
    });
});
ava_1.default.serial("SIGTERM stops the worker", async (t) => {
    t.plan(1);
    const worker = create();
    await worker.work();
    const originalStop = worker.stop.bind(worker);
    const promise = new Promise((resolve) => {
        worker.stop = async () => {
            t.pass();
            originalStop();
            resolve();
        };
    });
    process.kill(process.pid, "SIGTERM");
    await promise;
});
ava_1.default.serial("SIGINT stops the worker", async (t) => {
    t.plan(1);
    const worker = create();
    await worker.work();
    const originalStop = worker.stop.bind(worker);
    const promise = new Promise((resolve) => {
        worker.stop = async () => {
            t.pass();
            originalStop();
            resolve();
        };
    });
    process.kill(process.pid, "SIGINT");
    await promise;
});
ava_1.default.serial("SIGTSTP quiets the worker", async (t) => {
    t.plan(1);
    const worker = create();
    await worker.work();
    const originalQuiet = worker.quiet.bind(worker);
    const promise = new Promise((resolve) => {
        worker.quiet = () => {
            t.pass();
            originalQuiet();
            resolve();
        };
    });
    process.kill(process.pid, "SIGTSTP");
    await promise;
});
ava_1.default("quiets when the heartbeat response says so", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        server.once("BEAT", _helper_1.mocked.beat("quiet")).on("FETCH", _helper_1.mocked.fetch(null));
        const worker = create({ port });
        const originalQuiet = worker.quiet.bind(worker);
        const promise = new Promise((resolve) => {
            worker.quiet = () => {
                t.pass();
                worker.quiet = originalQuiet;
                worker.stop();
                resolve();
            };
        });
        await worker.beat();
        await promise;
    });
});
ava_1.default("stops when the heartbeat response says terminate", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        server.on("BEAT", _helper_1.mocked.beat("terminate")).on("FETCH", _helper_1.mocked.fetch(null));
        const worker = create({ port });
        const originalStop = worker.stop.bind(worker);
        const promise = new Promise((resolve) => {
            worker.stop = async () => {
                t.pass();
                originalStop();
                resolve();
            };
        });
        await worker.beat();
        await promise;
    });
});
