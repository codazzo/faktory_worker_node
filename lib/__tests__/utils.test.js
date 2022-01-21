"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const ava_1 = __importDefault(require("ava"));
const crypto_1 = require("crypto");
const utils_1 = require("../utils");
ava_1.default("hash: builds a hex pwdhash with salt", (t) => {
    const iterations = 10;
    const password = "password1";
    const salt = "dozens";
    const result = utils_1.hash(password, salt, iterations);
    let current = crypto_1.createHash("sha256").update(password + salt);
    for (let i = 1; i < iterations; i++) {
        current = crypto_1.createHash("sha256").update(current.digest());
    }
    t.is(result, current.digest("hex"), "pwdhash not generated correctly");
});
