"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.decryptWithPrivKey = exports.encryptWithPubKey = exports.decryptSharedMessage = exports.encryptSharedMessage = exports.hexStringToUint8Array = void 0;
const Keys = __importStar(require("./keys"));
let Crypto;
function hexStringToUint8Array(hexString) {
    return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
}
exports.hexStringToUint8Array = hexStringToUint8Array;
;
async function encryptSharedMessage(ourPrivateKey, theirPublicKey, text) {
    const sharedSecret = Keys.getSharedSecret(ourPrivateKey, theirPublicKey);
    const sharedX = hexStringToUint8Array(sharedSecret.slice(2));
    let encryptedMessage;
    let ivBase64;
    if (typeof window !== "undefined") {
        const iv = crypto.getRandomValues(new Uint8Array(16));
        const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['encrypt']);
        const encryptedBuffer = await crypto.subtle.encrypt({ name: 'AES-CBC', iv }, key, new TextEncoder().encode(text));
        encryptedMessage = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
        ivBase64 = btoa(String.fromCharCode(...iv));
    }
    else {
        if (!Crypto) {
            Crypto = require('crypto');
        }
        ;
        const iv = Crypto.randomBytes(16);
        const cipher = Crypto.createCipheriv('aes-256-cbc', sharedX, iv);
        encryptedMessage = cipher.update(text, 'utf8', 'base64');
        encryptedMessage += cipher.final('base64');
        ivBase64 = iv.toString('base64');
    }
    ;
    return `${encryptedMessage}?iv=${ivBase64}`;
}
exports.encryptSharedMessage = encryptSharedMessage;
;
async function decryptSharedMessage(ourPrivateKey, theirPublicKey, encryptedData) {
    let decryptedMessage = '';
    try {
        const [encryptedMessage, ivBase64] = encryptedData.split('?iv=');
        const sharedSecret = Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
        const sharedX = hexStringToUint8Array(sharedSecret.slice(2));
        if (typeof window !== "undefined") {
            const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
            const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['decrypt']);
            const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0)));
            decryptedMessage = new TextDecoder().decode(decryptedBuffer);
        }
        else {
            if (!Crypto) {
                Crypto = require('crypto');
            }
            ;
            const iv = Buffer.from(ivBase64, 'base64');
            const decipher = Crypto.createDecipheriv('aes-256-cbc', sharedX, iv);
            let decrypted = decipher.update(Buffer.from(encryptedMessage, 'base64'));
            decrypted = Buffer.concat([decrypted, decipher.final()]);
            decryptedMessage = decrypted.toString('utf8');
        }
    }
    catch (e) {
    }
    ;
    return decryptedMessage;
}
exports.decryptSharedMessage = decryptSharedMessage;
;
async function encryptWithPubKey(publicKey, text) {
    let ephemeralKey = Keys.generatePrivateKey();
    return (await encryptSharedMessage(ephemeralKey, publicKey, text)) + "&pbk=" + Keys.getPublicKey(ephemeralKey);
}
exports.encryptWithPubKey = encryptWithPubKey;
async function decryptWithPrivKey(privateKey, encryptedData) {
    let decryptedMessage = '';
    try {
        let [_encryptedData, ephemeralKey] = encryptedData.split("&pbk=");
        decryptedMessage = await decryptSharedMessage(privateKey, ephemeralKey, _encryptedData);
    }
    catch (e) {
    }
    ;
    return decryptedMessage;
}
exports.decryptWithPrivKey = decryptWithPrivKey;
