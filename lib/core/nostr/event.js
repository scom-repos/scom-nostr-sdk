"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.getSignature = exports.signEvent = exports.verifySignature = exports.validateEvent = exports.getEventHash = exports.serializeEvent = exports.finishEvent = exports.getBlankEvent = exports.Kind = exports.verifiedSymbol = exports.utf8Encoder = void 0;
const secp256k1_1 = require("../curves/secp256k1");
const sha256_1 = require("../hashes/sha256");
const utils_1 = require("../hashes/utils");
const keys_1 = require("./keys");
exports.utf8Encoder = new TextEncoder();
exports.verifiedSymbol = Symbol('verified');
var Kind;
(function (Kind) {
    Kind[Kind["Metadata"] = 0] = "Metadata";
    Kind[Kind["Text"] = 1] = "Text";
    Kind[Kind["RecommendRelay"] = 2] = "RecommendRelay";
    Kind[Kind["Contacts"] = 3] = "Contacts";
    Kind[Kind["EncryptedDirectMessage"] = 4] = "EncryptedDirectMessage";
    Kind[Kind["EventDeletion"] = 5] = "EventDeletion";
    Kind[Kind["Repost"] = 6] = "Repost";
    Kind[Kind["Reaction"] = 7] = "Reaction";
    Kind[Kind["BadgeAward"] = 8] = "BadgeAward";
    Kind[Kind["ChannelCreation"] = 40] = "ChannelCreation";
    Kind[Kind["ChannelMetadata"] = 41] = "ChannelMetadata";
    Kind[Kind["ChannelMessage"] = 42] = "ChannelMessage";
    Kind[Kind["ChannelHideMessage"] = 43] = "ChannelHideMessage";
    Kind[Kind["ChannelMuteUser"] = 44] = "ChannelMuteUser";
    Kind[Kind["Blank"] = 255] = "Blank";
    Kind[Kind["Report"] = 1984] = "Report";
    Kind[Kind["ZapRequest"] = 9734] = "ZapRequest";
    Kind[Kind["Zap"] = 9735] = "Zap";
    Kind[Kind["RelayList"] = 10002] = "RelayList";
    Kind[Kind["ClientAuth"] = 22242] = "ClientAuth";
    Kind[Kind["NwcRequest"] = 23194] = "NwcRequest";
    Kind[Kind["HttpAuth"] = 27235] = "HttpAuth";
    Kind[Kind["ProfileBadge"] = 30008] = "ProfileBadge";
    Kind[Kind["BadgeDefinition"] = 30009] = "BadgeDefinition";
    Kind[Kind["Article"] = 30023] = "Article";
    Kind[Kind["FileMetadata"] = 1063] = "FileMetadata";
})(Kind = exports.Kind || (exports.Kind = {}));
function getBlankEvent(kind = Kind.Blank) {
    return {
        kind,
        content: '',
        tags: [],
        created_at: 0,
    };
}
exports.getBlankEvent = getBlankEvent;
function finishEvent(t, privateKey) {
    const event = t;
    event.pubkey = (0, keys_1.getPublicKey)(privateKey);
    event.id = getEventHash(event);
    event.sig = getSignature(event, privateKey);
    event[exports.verifiedSymbol] = true;
    return event;
}
exports.finishEvent = finishEvent;
function serializeEvent(evt) {
    if (!validateEvent(evt))
        throw new Error("can't serialize event with wrong or missing properties");
    return JSON.stringify([0, evt.pubkey, evt.created_at, evt.kind, evt.tags, evt.content]);
}
exports.serializeEvent = serializeEvent;
function getEventHash(event) {
    let eventHash = (0, sha256_1.sha256)(exports.utf8Encoder.encode(serializeEvent(event)));
    return (0, utils_1.bytesToHex)(eventHash);
}
exports.getEventHash = getEventHash;
const isRecord = (obj) => obj instanceof Object;
function validateEvent(event) {
    if (!isRecord(event))
        return false;
    if (typeof event.kind !== 'number' || event.content === null)
        return false;
    if (typeof event.content !== 'string')
        return false;
    if (typeof event.created_at !== 'number')
        return false;
    if (typeof event.pubkey !== 'string')
        return false;
    if (!event.pubkey.match(/^[a-fA-F0-9]{64}$/))
        return false;
    if (!Array.isArray(event.tags))
        return false;
    for (let i = 0; i < event.tags.length; i++) {
        let tag = event.tags[i];
        if (!Array.isArray(tag))
            return false;
        for (let j = 0; j < tag.length; j++) {
            if (typeof tag[j] === 'object' && tag[j] !== null && tag[j] !== undefined)
                return false;
        }
    }
    return true;
}
exports.validateEvent = validateEvent;
function verifySignature(event) {
    if (typeof event[exports.verifiedSymbol] === 'boolean')
        return event[exports.verifiedSymbol];
    const hash = getEventHash(event);
    if (hash !== event.id) {
        return (event[exports.verifiedSymbol] = false);
    }
    try {
        return (event[exports.verifiedSymbol] = secp256k1_1.schnorr.verify(event.sig, hash, event.pubkey));
    }
    catch (err) {
        return (event[exports.verifiedSymbol] = false);
    }
}
exports.verifySignature = verifySignature;
function signEvent(event, key) {
    console.warn('nostr-tools: `signEvent` is deprecated and will be removed or changed in the future. Please use `getSignature` instead.');
    return getSignature(event, key);
}
exports.signEvent = signEvent;
function getSignature(event, key) {
    return (0, utils_1.bytesToHex)(secp256k1_1.schnorr.sign(getEventHash(event), key));
}
exports.getSignature = getSignature;
