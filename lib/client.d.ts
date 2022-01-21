import { Pool } from "generic-pool";
import { Job, JobPayload, JobType } from "./job";
import { Mutation, RETRIES, DEAD, SCHEDULED } from "./mutation";
import { Connection, Greeting, Command } from "./connection";
import { ConnectionFactory } from "./connection-factory";
export declare type ClientOptions = {
    host?: string;
    port?: string | number;
    password?: string;
    url?: string;
    wid?: string;
    labels?: string[];
    poolSize?: number;
};
export declare type JSONable = {
    toJSON(): Record<string, unknown>;
};
export declare type Hello = {
    hostname: string;
    v: number;
    wid?: string;
    labels?: string[];
    pid?: number;
    pwdhash?: string;
};
export declare type ServerInfo = {
    server_utc_time: string;
    faktory: {
        queues: {
            [name: string]: number;
        };
        tasks: {
            Retries: {
                size: number;
            };
            Dead: {
                size: number;
            };
            Scheduled: {
                size: number;
            };
        };
    };
};
/**
 * A client connection handle for interacting with the faktory server. Holds a pool of 1 or more
 * underlying connections. Safe for concurrent use and tolerant of unexpected
 * connection terminations. Use this object for all interactions with the factory server.
 *
 * @example
 * const client = new Client();
 *
 * const job = await client.fetch('default');
 *
 */
export declare class Client {
    password?: string;
    labels: string[];
    wid?: string;
    connectionFactory: ConnectionFactory;
    pool: Pool<Connection>;
    /**
     * Creates a Client with a connection pool
     *
     * @param {object} [options]
     * @param {string} [options.url=tcp://localhost:7419] connection string for the faktory server
     *                                                    (checks for FAKTORY_PROVIDER and
     *                                                    FAKTORY_URL)
     * @param {string} [options.host=localhost] host string to connect to
     * @param {number|string} [options.port=7419] port to connect to faktory server on
     * @param {string} [options.password] faktory server password to use during HELLO
     * @param {string} [options.wid] optional wid that should be provided to the server
     *                               (only necessary for a worker process consuming jobs)
     * @param {string[]} [options.labels=[]] optional labels to provide the faktory server
     *                                       for this client
     * @param {number} [options.poolSize=10] the maxmimum size of the connection pool
     */
    constructor(options?: ClientOptions);
    static assertVersion(version: number): void;
    /**
     * Explicitly opens a connection and then closes it to test connectivity.
     * Under normal circumstances you don't need to call this method as all of the
     * communication methods will check out a connection before executing. If a connection is
     * not available, one will be created. This method exists to ensure connection is possible
     * if you need to do so. You can think of this like {@link https://godoc.org/github.com/jmoiron/sqlx#MustConnect|sqlx#MustConnect}
     *
     * @return {Promise.<Client>} resolves when a connection is opened
     */
    connect(): Promise<Client>;
    /**
     * Closes the connection to the server
     * @return {Promise.<undefined>}
     */
    close(): Promise<void>;
    /**
     * Creates a new Job object to build a job payload
     * @param  {String}    jobtype name of the job function
     * @param  {...*} args    arguments to the job function
     * @return {Job}            a job builder with attached Client for PUSHing
     * @see  Job
     */
    job(jobtype: JobType, ...args: unknown[]): Job;
    handshake(conn: Connection, greeting: Greeting): Promise<string>;
    /**
     * builds a hello object for the server handshake
     * @param  {string} options.s: salt          the salt string from the server
     * @param  {number} options.i: iterations    the number of hash iterations to perform
     * @return {object}            the hello object to send back to the server
     * @private
     */
    buildHello({ s: salt, i: iterations }: Greeting): Hello;
    /**
     * Borrows a connection from the connection pool, forwards all arguments to
     * {@link Connection.send}, and checks the connection back into the pool when
     * the promise returned by the wrapped function is resolved or rejected.
     *
     * @param {...*} args arguments to {@link Connection.send}
     * @see Connection.send
     */
    send(command: Command): PromiseLike<string>;
    sendWithAssert(command: Command, assertion: string): PromiseLike<string>;
    /**
     * Fetches a job payload from the server from one of ...queues
     * @param  {...String} queues list of queues to pull a job from
     * @return {Promise.<object|null>}           a job payload if one is available, otherwise null
     */
    fetch(...queues: string[]): Promise<JobPayload | null>;
    /**
     * Sends a heartbeat for this.wid to the server
     * @return {Promise.<string>} string 'OK' when the heartbeat is accepted, otherwise
     *                           may return a state string when the server has a signal
     *                           to send this client (`quiet`, `terminate`)
     */
    beat(): Promise<string>;
    /**
     * Pushes a job payload to the server
     * @param  {Job|Object} job job payload to push
     * @return {Promise.<string>}         the jid for the pushed job
     */
    push(job: JSONable | Record<string, unknown>): Promise<string>;
    /**
     * Sends a FLUSH to the server
     * @return {Promise.<string>} resolves with the server's response text
     */
    flush(): Promise<string>;
    /**
     * Sends an INFO command to the server
     * @return {Promise.<object>} the server's INFO response object
     */
    info(): Promise<ServerInfo>;
    /**
     * Sends an ACK to the server for a particular job ID
     * @param  {String} jid the jid of the job to acknowledge
     * @return {Promise.<string>}     the server's response text
     */
    ack(jid: string): Promise<string>;
    /**
     * Sends a FAIL command to the server for a particular job ID with error information
     * @param  {String} jid the jid of the job to FAIL
     * @param  {Error} e   an error object that caused the job to fail
     * @return {Promise.<string>}     the server's response text
     */
    fail(jid: string, e: Error): PromiseLike<string>;
    get [RETRIES](): Mutation;
    get [SCHEDULED](): Mutation;
    get [DEAD](): Mutation;
}
