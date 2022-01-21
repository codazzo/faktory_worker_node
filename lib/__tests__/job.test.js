"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const job_1 = require("../job");
const client_1 = require("../client");
ava_1.default(".jid: generates a uuid jid", (t) => {
    t.truthy(job_1.Job.jid().length > 8);
});
ava_1.default("get jid: returns generated jid", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.truthy(job.jid);
});
ava_1.default("set jid: sets the jid", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.jid = "123";
    t.is(job.jid, "123");
});
ava_1.default("get jobtype: returns jobtype", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.is(job.jobtype, "test");
});
ava_1.default("set jobtype: sets jobtype", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.jobtype = "other";
    const data = job.toJSON();
    t.is(data.jobtype, "other");
});
ava_1.default("get queue: returns queue default", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.is(job.queue, "default");
});
ava_1.default("set queue: sets the queue", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.queue = "new";
    const data = job.toJSON();
    t.is(data.queue, "new");
});
ava_1.default("get args: returns args default", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.deepEqual(job.args, []);
});
ava_1.default("set args: sets the args", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.args = [1, 2, 3];
    const data = job.toJSON();
    t.deepEqual(data.args, [1, 2, 3]);
});
ava_1.default("get priority: returns priority default", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.is(job.priority, 5);
});
ava_1.default("set priority: sets the priority", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.priority = 1;
    const data = job.toJSON();
    t.is(data.priority, 1);
});
ava_1.default("get at: returns the at default", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.is(job.at, undefined);
});
ava_1.default("set at: set the scheduled job time", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    const jobAt = new Date();
    job.at = new Date();
    const data = job.toJSON();
    t.is(data.at, jobAt.toISOString());
});
ava_1.default("get retry: returns the retry default", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.is(job.retry, 25);
});
ava_1.default("set retry: set the number of retries", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.retry = -1;
    const data = job.toJSON();
    t.is(data.retry, -1);
});
ava_1.default("get reserveFor: returns the reserveFor default", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.is(job.reserveFor, undefined);
});
ava_1.default("set reserveFor: sets the reserveFor", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.reserveFor = 100;
    const data = job.toJSON();
    t.is(data.reserve_for, 100);
});
ava_1.default("get custom: returns the custom default", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    t.is(job.custom, undefined);
});
ava_1.default("set custom: set the custom context", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    job.custom = { some: "thing" };
    const data = job.toJSON();
    t.deepEqual(data.custom, { some: "thing" });
});
ava_1.default("job push sends specification to client", (t) => {
    t.plan(1);
    const client = new client_1.Client();
    client.push = async (arg) => {
        t.is(arg, job);
        return job.jid;
    };
    const job = new job_1.Job("MyJob", client);
    job.push();
});
ava_1.default("job serializes to JSON", (t) => {
    const jobAt = new Date().toISOString();
    const job = new job_1.Job("MyJob", new client_1.Client());
    job.args = [1, 2, 3];
    job.custom = { locale: "en-us" };
    job.priority = 10;
    job.queue = "critical";
    job.at = jobAt;
    job.reserveFor = 300;
    job.retry = 1;
    const data = job.toJSON();
    t.truthy(data.jid);
    delete data.jid;
    t.deepEqual(data, {
        jobtype: "MyJob",
        args: [1, 2, 3],
        custom: { locale: "en-us" },
        priority: 10,
        queue: "critical",
        at: jobAt,
        reserve_for: 300,
        retry: 1,
    });
});
ava_1.default("defaults match protocol specification", (t) => {
    const job = new job_1.Job("test", new client_1.Client());
    const data = job.toJSON();
    delete data.jid;
    t.deepEqual(data, {
        jobtype: "test",
        queue: "default",
        args: [],
        priority: 5,
        retry: 25,
    });
});
ava_1.default("throws an error when no jobtype provided", (t) => {
    // @ts-ignore
    t.throws(() => new job_1.Job());
});
