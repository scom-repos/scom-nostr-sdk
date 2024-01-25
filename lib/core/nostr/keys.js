"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.decompressPublicKey = exports.getSharedSecret = exports.getPublicKeyY = exports.getPublicKey = exports.generatePrivateKey = void 0;
const secp256k1_1 = require("../curves/secp256k1");
const utils_1 = require("../hashes/utils");
function generatePrivateKey() {
    return (0, utils_1.bytesToHex)(secp256k1_1.schnorr.utils.randomPrivateKey());
}
exports.generatePrivateKey = generatePrivateKey;
function getPublicKey(privateKey) {
    return (0, utils_1.bytesToHex)(secp256k1_1.schnorr.getPublicKey(privateKey));
}
exports.getPublicKey = getPublicKey;
function getPublicKeyY(privateKey) {
    return (0, utils_1.bytesToHex)((0, secp256k1_1.schnorrGetExtPubKeyY)(privateKey));
}
exports.getPublicKeyY = getPublicKeyY;
function getSharedSecret(privateKey, publicKey) {
    return (0, utils_1.bytesToHex)(secp256k1_1.secp256k1.getSharedSecret(privateKey, publicKey));
}
exports.getSharedSecret = getSharedSecret;
function decompressPublicKey(publicKey) {
    const decompressedPublicKey = secp256k1_1.secp256k1.ProjectivePoint.fromHex(publicKey).toHex(false);
    return decompressedPublicKey;
}
exports.decompressPublicKey = decompressPublicKey;
