/// <reference types="node" />
import { Socket } from "net";
import { EventEmitter } from "events";
import RedisParser from "redis-parser";
/**
 * A command to send the server in array form
 *
 * @typedef {string[]} Command
 * @example
 *
 * // multiple string arguments
 * ['FETCH', 'critical', 'default']
 *
 * // json string as an argument
 * ['PUSH', '{"jid": "123"}']
 *
 * // single string argument
 * ['ACK', '123']
 */
export declare type Command = Array<string>;
export declare type Greeting = {
    v: number;
    s: string;
    i: number;
};
export declare type ConnectionOptions = {
    host?: string;
    port?: string | number;
    password?: string;
};
interface PendingRequest {
    resolve(message: string): void;
    reject(error: Error): void;
}
/**
 * A connection to the faktory server for sending commands
 * and receiving messages. Abstracts the underlying node Socket
 * and allows easier async sending and receiving. Not "threadsafe". Use in
 * a connection pool.
 *
 * @private
 */
export declare class Connection extends EventEmitter {
    connected: boolean;
    closing: boolean;
    host: string | undefined;
    port: string | number;
    pending: PendingRequest[];
    socket: Socket;
    parser: RedisParser;
    lastError: Error;
    /**
     * @param {Number} port the port to connect on
     * @param {String} host the hostname to connect to
     */
    constructor(port: string | number, host?: string);
    /**
     * Sets the socket timeout
     * @param {Number} ms timeout in milliseconds
     */
    setTimeout(ms?: number): void;
    /**
     * Registers listeners on the underlying node socket
     * @private
     * @return {Connection} self
     */
    private listen;
    /**
     * Opens a connection to the server
     * @return {Promise} resolves with the server's greeting
     */
    open(): Promise<Greeting>;
    /**
     * @private
     */
    private onConnect;
    /**
     * @private
     */
    private clearPending;
    /**
     * @private
     */
    private onClose;
    /**
     * @private
     */
    private onTimeout;
    /**
     * Sends a command to the faktory server and asserts that the response
     * matches the provided expectedResponse argument
     * @param  {Command} command          command
     * @param  {String} expectedResponse the expected string response from the server. If the
     *                                   response from the server does not match, an error is
     *                                   thrown
     * @return {String}                  the server's response string
     * @throws {AssertionError}
     */
    sendWithAssert(command: Command, expectedResponse: string): Promise<string>;
    /**
     * Sends a command to the server
     * @param  {Command} command command to send to server
     *                           is an array of strings or objects
     * @return {Promise}         resolved with the server's parsed response or
     *                           rejected with an error
     */
    send(command: Command): Promise<string>;
    /**
     * @private
     */
    private onError;
    /**
     * Closes the connection to the server
     * @return {Promise} resolved when underlying socket emits "close"
     */
    close(): Promise<void>;
}
export {};
