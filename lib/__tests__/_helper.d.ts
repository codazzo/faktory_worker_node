/// <reference types="node" />
import { TestFn, ExecutionContext } from "ava";
import { Socket, Server } from "net";
import { JobPayload, PartialJobPayload } from "../job";
export declare type ServerControl = {
    socket: Socket;
    command?: string;
    data?: string;
};
export declare const mockServer: () => Server;
declare type ServerUser = {
    (server: Server, port: number): Promise<unknown>;
};
export declare const mocked: {
    (fn: ServerUser): Promise<unknown>;
    ok(): ({ socket }: ServerControl) => void;
    fail: () => ({ socket }: ServerControl) => void;
    beat(state?: string | undefined): ({ socket }: ServerControl) => void;
    fetch(job: JobPayload | null): ({ socket }: ServerControl) => void;
    info(): ({ socket }: ServerControl) => void;
};
export declare const sleep: (ms: number, value?: unknown) => Promise<unknown>;
export declare const randQueue: (label?: string) => string;
export declare const createJob: (...args: unknown[]) => PartialJobPayload;
export declare const push: ({ args, queue, jobtype, }?: {
    args?: unknown[] | undefined;
    queue?: string | undefined;
    jobtype?: string | undefined;
}) => Promise<JobPayload>;
export declare const flush: () => Promise<string>;
export declare function registerCleaner(test: TestFn): void;
export declare const withCallback: (fn: Function) => (t: ExecutionContext) => Promise<void>;
export {};
