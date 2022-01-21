"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.Connection = void 0;
const net_1 = require("net");
const assert_1 = require("assert");
const events_1 = require("events");
const debug_1 = __importDefault(require("debug"));
const redis_parser_1 = __importDefault(require("redis-parser"));
const debug = debug_1.default("faktory-worker:connection");
const SOCKET_TIMEOUT = 10000;
/**
 * A connection to the faktory server for sending commands
 * and receiving messages. Abstracts the underlying node Socket
 * and allows easier async sending and receiving. Not "threadsafe". Use in
 * a connection pool.
 *
 * @private
 */
class Connection extends events_1.EventEmitter {
    /**
     * @param {Number} port the port to connect on
     * @param {String} host the hostname to connect to
     */
    constructor(port, host) {
        super();
        this.host = host;
        this.port = port;
        this.connected = false;
        this.socket = new net_1.Socket();
        this.socket.setKeepAlive(true);
        this.pending = [];
        this.parser = new redis_parser_1.default({
            returnReply: (response) => { var _a; return (_a = this.pending.pop()) === null || _a === void 0 ? void 0 : _a.resolve(response); },
            returnError: (err) => { var _a; return (_a = this.pending.pop()) === null || _a === void 0 ? void 0 : _a.reject(err); },
        });
        this.listen();
    }
    /**
     * Sets the socket timeout
     * @param {Number} ms timeout in milliseconds
     */
    setTimeout(ms = SOCKET_TIMEOUT) {
        this.socket.setTimeout(ms);
    }
    /**
     * Registers listeners on the underlying node socket
     * @private
     * @return {Connection} self
     */
    listen() {
        this.socket
            .once("connect", this.onConnect.bind(this))
            .on("data", this.parser.execute.bind(this.parser))
            .on("timeout", this.onTimeout.bind(this))
            .on("error", this.onError.bind(this))
            .on("close", this.onClose.bind(this));
        return this;
    }
    /**
     * Opens a connection to the server
     * @return {Promise} resolves with the server's greeting
     */
    async open() {
        if (this.connected)
            throw new Error("already connected!");
        debug("connecting");
        const receiveGreetingResponse = new Promise((resolve, reject) => {
            this.pending.unshift({ resolve, reject });
        });
        this.socket.connect(this.port, this.host || "");
        const response = await receiveGreetingResponse;
        const greeting = JSON.parse(response.split(" ")[1]);
        this.emit("greeting", greeting);
        return greeting;
    }
    /**
     * @private
     */
    onConnect() {
        this.connected = true;
        this.emit("connect");
        this.setTimeout();
    }
    /**
     * @private
     */
    clearPending(err) {
        this.pending.forEach(({ reject }) => reject(err));
    }
    /**
     * @private
     */
    onClose() {
        debug("close");
        this.closing = false;
        this.connected = false;
        this.emit("close");
        // dead letters?
        this.clearPending(this.lastError || new Error("Connection closed"));
    }
    /**
     * @private
     */
    onTimeout() {
        this.emit("timeout");
        debug("timeout");
    }
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
    async sendWithAssert(command, expectedResponse) {
        const response = await this.send(command);
        assert_1.strictEqual(response, expectedResponse, `expected ${expectedResponse} response, but got ${response}`);
        return response;
    }
    /**
     * Sends a command to the server
     * @param  {Command} command command to send to server
     *                           is an array of strings or objects
     * @return {Promise}         resolved with the server's parsed response or
     *                           rejected with an error
     */
    send(command) {
        const commandString = command.join(" ");
        debug("SEND: %s", commandString);
        return new Promise((resolve, reject) => {
            this.socket.write(`${commandString}\r\n`);
            this.pending.unshift({
                resolve: (message) => {
                    debug("client=%o, server=%o", commandString, message);
                    resolve(message);
                },
                reject,
            });
        });
    }
    /**
     * @private
     */
    onError(err) {
        this.lastError = err;
        this.emit("error", err);
        this.close();
    }
    /**
     * Closes the connection to the server
     * @return {Promise} resolved when underlying socket emits "close"
     */
    async close() {
        if (this.closing)
            return;
        this.closing = true;
        return new Promise((resolve) => this.socket
            .once("close", () => {
            this.socket.removeAllListeners();
            resolve();
        })
            .end("END\r\n"));
    }
}
exports.Connection = Connection;
