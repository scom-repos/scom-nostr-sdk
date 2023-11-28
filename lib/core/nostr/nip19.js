"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.nrelayEncode = exports.naddrEncode = exports.neventEncode = exports.nprofileEncode = exports.noteEncode = exports.npubEncode = exports.nsecEncode = exports.decode = exports.BECH32_REGEX = exports.utf8Encoder = exports.utf8Decoder = void 0;
const utils_1 = require("../hashes/utils");
const bech32_1 = require("../bech32");
exports.utf8Decoder = new TextDecoder('utf-8');
exports.utf8Encoder = new TextEncoder();
const Bech32MaxSize = 5000;
exports.BECH32_REGEX = /[\x21-\x7E]{1,83}1[023456789acdefghjklmnpqrstuvwxyz]{6,}/;
function integerToUint8Array(number) {
    const uint8Array = new Uint8Array(4);
    uint8Array[0] = (number >> 24) & 0xff;
    uint8Array[1] = (number >> 16) & 0xff;
    uint8Array[2] = (number >> 8) & 0xff;
    uint8Array[3] = number & 0xff;
    return uint8Array;
}
function decode(nip19) {
    let { prefix, words } = bech32_1.bech32.decode(nip19, Bech32MaxSize);
    let data = new Uint8Array(bech32_1.bech32.fromWords(words));
    switch (prefix) {
        case 'nprofile': {
            let tlv = parseTLV(data);
            if (!tlv[0]?.[0])
                throw new Error('missing TLV 0 for nprofile');
            if (tlv[0][0].length !== 32)
                throw new Error('TLV 0 should be 32 bytes');
            return {
                type: 'nprofile',
                data: {
                    pubkey: (0, utils_1.bytesToHex)(tlv[0][0]),
                    relays: tlv[1] ? tlv[1].map(d => exports.utf8Decoder.decode(d)) : [],
                },
            };
        }
        case 'nevent': {
            let tlv = parseTLV(data);
            if (!tlv[0]?.[0])
                throw new Error('missing TLV 0 for nevent');
            if (tlv[0][0].length !== 32)
                throw new Error('TLV 0 should be 32 bytes');
            if (tlv[2] && tlv[2][0].length !== 32)
                throw new Error('TLV 2 should be 32 bytes');
            if (tlv[3] && tlv[3][0].length !== 4)
                throw new Error('TLV 3 should be 4 bytes');
            return {
                type: 'nevent',
                data: {
                    id: (0, utils_1.bytesToHex)(tlv[0][0]),
                    relays: tlv[1] ? tlv[1].map(d => exports.utf8Decoder.decode(d)) : [],
                    author: tlv[2]?.[0] ? (0, utils_1.bytesToHex)(tlv[2][0]) : undefined,
                    kind: tlv[3]?.[0] ? parseInt((0, utils_1.bytesToHex)(tlv[3][0]), 16) : undefined,
                },
            };
        }
        case 'naddr': {
            let tlv = parseTLV(data);
            if (!tlv[0]?.[0])
                throw new Error('missing TLV 0 for naddr');
            if (!tlv[2]?.[0])
                throw new Error('missing TLV 2 for naddr');
            if (tlv[2][0].length !== 32)
                throw new Error('TLV 2 should be 32 bytes');
            if (!tlv[3]?.[0])
                throw new Error('missing TLV 3 for naddr');
            if (tlv[3][0].length !== 4)
                throw new Error('TLV 3 should be 4 bytes');
            return {
                type: 'naddr',
                data: {
                    identifier: exports.utf8Decoder.decode(tlv[0][0]),
                    pubkey: (0, utils_1.bytesToHex)(tlv[2][0]),
                    kind: parseInt((0, utils_1.bytesToHex)(tlv[3][0]), 16),
                    relays: tlv[1] ? tlv[1].map(d => exports.utf8Decoder.decode(d)) : [],
                },
            };
        }
        case 'nrelay': {
            let tlv = parseTLV(data);
            if (!tlv[0]?.[0])
                throw new Error('missing TLV 0 for nrelay');
            return {
                type: 'nrelay',
                data: exports.utf8Decoder.decode(tlv[0][0]),
            };
        }
        case 'nsec':
        case 'npub':
        case 'note':
            return { type: prefix, data: (0, utils_1.bytesToHex)(data) };
        default:
            throw new Error(`unknown prefix ${prefix}`);
    }
}
exports.decode = decode;
function parseTLV(data) {
    let result = {};
    let rest = data;
    while (rest.length > 0) {
        let t = rest[0];
        let l = rest[1];
        if (!l)
            throw new Error(`malformed TLV ${t}`);
        let v = rest.slice(2, 2 + l);
        rest = rest.slice(2 + l);
        if (v.length < l)
            throw new Error(`not enough data to read on TLV ${t}`);
        result[t] = result[t] || [];
        result[t].push(v);
    }
    return result;
}
function nsecEncode(hex) {
    return encodeBytes('nsec', hex);
}
exports.nsecEncode = nsecEncode;
function npubEncode(hex) {
    return encodeBytes('npub', hex);
}
exports.npubEncode = npubEncode;
function noteEncode(hex) {
    return encodeBytes('note', hex);
}
exports.noteEncode = noteEncode;
function encodeBech32(prefix, data) {
    let words = bech32_1.bech32.toWords(data);
    return bech32_1.bech32.encode(prefix, words, Bech32MaxSize);
}
function encodeBytes(prefix, hex) {
    let data = (0, utils_1.hexToBytes)(hex);
    return encodeBech32(prefix, data);
}
function nprofileEncode(profile) {
    let data = encodeTLV({
        0: [(0, utils_1.hexToBytes)(profile.pubkey)],
        1: (profile.relays || []).map(url => exports.utf8Encoder.encode(url)),
    });
    return encodeBech32('nprofile', data);
}
exports.nprofileEncode = nprofileEncode;
function neventEncode(event) {
    let kindArray;
    if (event.kind != undefined) {
        kindArray = integerToUint8Array(event.kind);
    }
    let data = encodeTLV({
        0: [(0, utils_1.hexToBytes)(event.id)],
        1: (event.relays || []).map(url => exports.utf8Encoder.encode(url)),
        2: event.author ? [(0, utils_1.hexToBytes)(event.author)] : [],
        3: kindArray ? [new Uint8Array(kindArray)] : [],
    });
    return encodeBech32('nevent', data);
}
exports.neventEncode = neventEncode;
function naddrEncode(addr) {
    let kind = new ArrayBuffer(4);
    new DataView(kind).setUint32(0, addr.kind, false);
    let data = encodeTLV({
        0: [exports.utf8Encoder.encode(addr.identifier)],
        1: (addr.relays || []).map(url => exports.utf8Encoder.encode(url)),
        2: [(0, utils_1.hexToBytes)(addr.pubkey)],
        3: [new Uint8Array(kind)],
    });
    return encodeBech32('naddr', data);
}
exports.naddrEncode = naddrEncode;
function nrelayEncode(url) {
    let data = encodeTLV({
        0: [exports.utf8Encoder.encode(url)],
    });
    return encodeBech32('nrelay', data);
}
exports.nrelayEncode = nrelayEncode;
function encodeTLV(tlv) {
    let entries = [];
    Object.entries(tlv).forEach(([t, vs]) => {
        vs.forEach(v => {
            let entry = new Uint8Array(v.length + 2);
            entry.set([parseInt(t)], 0);
            entry.set([v.length], 1);
            entry.set(v, 2);
            entries.push(entry);
        });
    });
    return (0, utils_1.concatBytes)(...entries);
}
