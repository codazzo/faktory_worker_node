"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const client_1 = require("../client");
const mutation_1 = require("../mutation");
const _helper_1 = require("./_helper");
_helper_1.registerCleaner(ava_1.default);
ava_1.default("integration: #clear discards all retries", async (t) => {
    const client = new client_1.Client();
    await client.connect();
    await client.job("fail").push();
    const job = await client.fetch("default");
    if (!job)
        return t.fail("job not fetched");
    await client.fail(job.jid, new Error("test"));
    let info = await client.info();
    t.is(info.faktory.tasks.Retries.size, 1);
    await client.retries.clear();
    info = await client.info();
    t.is(info.faktory.tasks.Retries.size, 0);
    return;
});
ava_1.default("integration: #kill moves retries to dead", async (t) => {
    const client = new client_1.Client();
    await client.connect();
    await client.job("fail").push();
    const job = await client.fetch("default");
    if (!job)
        return t.fail("job not fetched");
    await client.fail(job.jid, new Error("test"));
    let info = await client.info();
    t.is(info.faktory.tasks.Retries.size, 1);
    await client.retries.ofType("fail").kill();
    info = await client.info();
    t.is(info.faktory.tasks.Retries.size, 0);
    t.is(info.faktory.tasks.Dead.size, 1);
    await client.dead.ofType("fail").discard();
    info = await client.info();
    t.is(info.faktory.tasks.Retries.size, 0);
    t.is(info.faktory.tasks.Dead.size, 0);
    return;
});
ava_1.default("integration: #kill moves scheduled to dead", async (t) => {
    const client = new client_1.Client();
    await client.connect();
    const job = client.job("fail", "unique");
    const date = new Date();
    date.setDate(date.getDate() + 1);
    job.at = date;
    await job.push();
    let info = await client.info();
    t.is(info.faktory.tasks.Scheduled.size, 1);
    t.is(info.faktory.tasks.Dead.size, 0);
    await client.scheduled.matching("*unique*").kill();
    info = await client.info();
    t.is(info.faktory.tasks.Dead.size, 1);
});
ava_1.default("integration: #requeue moves retries to queue", async (t) => {
    const client = new client_1.Client();
    await client.connect();
    await client.job("fail").push();
    const job = await client.fetch("default");
    if (!job)
        return t.fail("job not fetched");
    await client.fail(job.jid, new Error("test"));
    let info = await client.info();
    t.is(info.faktory.tasks.Retries.size, 1);
    await client.retries.withJids(job.jid).requeue();
    info = await client.info();
    t.is(info.faktory.queues.default, 1);
    t.is(info.faktory.tasks.Retries.size, 0);
    t.is(info.faktory.tasks.Dead.size, 0);
    return;
});
ava_1.default("#clear clears retries", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "clear",
                target: mutation_1.RETRIES,
                filter: {
                    jobtype: "clearsRetries",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.retries
            .ofType("clearsRetries")
            .withJids(["123"])
            .matching("*Not Found*")
            .clear();
    });
});
ava_1.default("#clear clears scheduled jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "clear",
                target: mutation_1.SCHEDULED,
                filter: {
                    jobtype: "clearsScheduled",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.scheduled
            .ofType("clearsScheduled")
            .withJids(["123"])
            .matching("*Not Found*")
            .clear();
    });
});
ava_1.default("#clear clears dead jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "clear",
                target: mutation_1.DEAD,
                filter: {
                    jobtype: "clearsDead",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.dead
            .ofType("clearsDead")
            .withJids(["123"])
            .matching("*Not Found*")
            .clear();
    });
});
ava_1.default("#kill kills retries", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "kill",
                target: mutation_1.RETRIES,
                filter: {
                    jobtype: "killsRetries",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.retries
            .ofType("killsRetries")
            .withJids(["123"])
            .matching("*Not Found*")
            .kill();
    });
});
ava_1.default("#kill kills scheduled jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "kill",
                target: mutation_1.SCHEDULED,
                filter: {
                    jobtype: "killsScheduled",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.scheduled
            .ofType("killsScheduled")
            .withJids(["123"])
            .matching("*Not Found*")
            .kill();
    });
});
ava_1.default("#kill kills dead jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "kill",
                target: mutation_1.DEAD,
                filter: {
                    jobtype: "killsDead",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.dead
            .ofType("killsDead")
            .withJids(["123"])
            .matching("*Not Found*")
            .kill();
    });
});
ava_1.default("#discard discards retries", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "discard",
                target: mutation_1.RETRIES,
                filter: {
                    jobtype: "discardsRetries",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.retries
            .ofType("discardsRetries")
            .withJids(["123"])
            .matching("*Not Found*")
            .discard();
    });
});
ava_1.default("#discard discards scheduled jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "discard",
                target: mutation_1.SCHEDULED,
                filter: {
                    jobtype: "discardsScheduled",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.scheduled
            .ofType("discardsScheduled")
            .withJids(["123"])
            .matching("*Not Found*")
            .discard();
    });
});
ava_1.default("#discard discards dead jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "discard",
                target: mutation_1.DEAD,
                filter: {
                    jobtype: "discardsDead",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.dead
            .ofType("discardsDead")
            .withJids(["123"])
            .matching("*Not Found*")
            .discard();
    });
});
ava_1.default("#requeue requeues retries", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "requeue",
                target: mutation_1.RETRIES,
                filter: {
                    jobtype: "requeuesRetries",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.retries
            .ofType("requeuesRetries")
            .withJids(["123"])
            .matching("*Not Found*")
            .requeue();
    });
});
ava_1.default("#requeue requeues scheduled jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "requeue",
                target: mutation_1.SCHEDULED,
                filter: {
                    jobtype: "requeuesScheduled",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.scheduled
            .ofType("requeuesScheduled")
            .withJids(["123"])
            .matching("*Not Found*")
            .requeue();
    });
});
ava_1.default("#requeue requeues dead jobs", async (t) => {
    t.plan(1);
    await _helper_1.mocked(async (server, port) => {
        const client = new client_1.Client({ port });
        server.on("MUTATE", ({ data, socket }) => {
            t.deepEqual(data, {
                cmd: "requeue",
                target: mutation_1.DEAD,
                filter: {
                    jobtype: "requeuesDead",
                    jids: ["123"],
                    regexp: "*Not Found*",
                },
            });
            socket.write("+OK\r\n");
        });
        await client.dead
            .ofType("requeuesDead")
            .withJids(["123"])
            .matching("*Not Found*")
            .requeue();
    });
});
ava_1.default("#matching disallows nonstrings", (t) => {
    t.throws(() => {
        const mutation = new mutation_1.Mutation(new client_1.Client());
        // @ts-ignore
        mutation.matching(new RegExp("something"));
    }, { message: /redis SCAN/ });
});
ava_1.default("#ofType disallows nonstring argument", (t) => {
    t.throws(() => {
        const mutation = new mutation_1.Mutation(new client_1.Client());
        const MyJob = () => { };
        // @ts-ignore
        mutation.ofType(MyJob);
    }, {
        message: /must be a string/i,
    });
});
