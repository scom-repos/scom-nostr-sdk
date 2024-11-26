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
var __exportStar = (this && this.__exportStar) || function(m, exports) {
    for (var p in m) if (p !== "default" && !Object.prototype.hasOwnProperty.call(exports, p)) __createBinding(exports, m, p);
};
define("@scom/scom-social-sdk/core/hashes/_assert.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.output = exports.exists = exports.hash = exports.bytes = exports.bool = exports.number = void 0;
    ///<amd-module name='@scom/scom-social-sdk/core/hashes/_assert.ts'/> 
    // adopted from https://github.com/paulmillr/noble-hashes
    function number(n) {
        if (!Number.isSafeInteger(n) || n < 0)
            throw new Error(`Wrong positive integer: ${n}`);
    }
    exports.number = number;
    function bool(b) {
        if (typeof b !== 'boolean')
            throw new Error(`Expected boolean, not ${b}`);
    }
    exports.bool = bool;
    function bytes(b, ...lengths) {
        if (!(b instanceof Uint8Array))
            throw new Error('Expected Uint8Array');
        if (lengths.length > 0 && !lengths.includes(b.length))
            throw new Error(`Expected Uint8Array of length ${lengths}, not of length=${b.length}`);
    }
    exports.bytes = bytes;
    function hash(hash) {
        if (typeof hash !== 'function' || typeof hash.create !== 'function')
            throw new Error('Hash should be wrapped by utils.wrapConstructor');
        number(hash.outputLen);
        number(hash.blockLen);
    }
    exports.hash = hash;
    function exists(instance, checkFinished = true) {
        if (instance.destroyed)
            throw new Error('Hash instance has been destroyed');
        if (checkFinished && instance.finished)
            throw new Error('Hash#digest() has already been called');
    }
    exports.exists = exists;
    function output(out, instance) {
        bytes(out);
        const min = instance.outputLen;
        if (out.length < min) {
            throw new Error(`digestInto() expects output buffer of length at least ${min}`);
        }
    }
    exports.output = output;
    const assert = { number, bool, bytes, hash, exists, output };
    exports.default = assert;
});
///<amd-module name='@scom/scom-social-sdk/core/hashes/utils.ts'/> 
// adopted from https://github.com/paulmillr/noble-hashes
/*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
define("@scom/scom-social-sdk/core/hashes/utils.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.randomBytes = exports.wrapConstructor = exports.Hash = exports.concatBytes = exports.toBytes = exports.utf8ToBytes = exports.hexToBytes = exports.bytesToHex = exports.rotr = exports.createView = void 0;
    const u8a = (a) => a instanceof Uint8Array;
    // Cast array to view
    const createView = (arr) => new DataView(arr.buffer, arr.byteOffset, arr.byteLength);
    exports.createView = createView;
    // The rotate right (circular right shift) operation for uint32
    const rotr = (word, shift) => (word << (32 - shift)) | (word >>> shift);
    exports.rotr = rotr;
    // Array where index 0xf0 (240) is mapped to string 'f0'
    const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
    /**
     * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
     */
    function bytesToHex(bytes) {
        if (!u8a(bytes))
            throw new Error('Uint8Array expected');
        // pre-caching improves the speed 6x
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            hex += hexes[bytes[i]];
        }
        return hex;
    }
    exports.bytesToHex = bytesToHex;
    // We use optimized technique to convert hex string to byte array
    const asciis = { _0: 48, _9: 57, _A: 65, _F: 70, _a: 97, _f: 102 };
    function asciiToBase16(char) {
        if (char >= asciis._0 && char <= asciis._9)
            return char - asciis._0;
        if (char >= asciis._A && char <= asciis._F)
            return char - (asciis._A - 10);
        if (char >= asciis._a && char <= asciis._f)
            return char - (asciis._a - 10);
        return;
    }
    /**
     * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
     */
    function hexToBytes(hex) {
        if (typeof hex !== 'string')
            throw new Error('hex string expected, got ' + typeof hex);
        const hl = hex.length;
        const al = hl / 2;
        if (hl % 2)
            throw new Error('padded hex string expected, got unpadded hex of length ' + hl);
        const array = new Uint8Array(al);
        for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
            const n1 = asciiToBase16(hex.charCodeAt(hi));
            const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
            if (n1 === undefined || n2 === undefined) {
                const char = hex[hi] + hex[hi + 1];
                throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
            }
            array[ai] = n1 * 16 + n2;
        }
        return array;
    }
    exports.hexToBytes = hexToBytes;
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    function utf8ToBytes(str) {
        if (typeof str !== 'string')
            throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
        return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
    }
    exports.utf8ToBytes = utf8ToBytes;
    /**
     * Normalizes (non-hex) string or Uint8Array to Uint8Array.
     * Warning: when Uint8Array is passed, it would NOT get copied.
     * Keep in mind for future mutable operations.
     */
    function toBytes(data) {
        if (typeof data === 'string')
            data = utf8ToBytes(data);
        if (!u8a(data))
            throw new Error(`expected Uint8Array, got ${typeof data}`);
        return data;
    }
    exports.toBytes = toBytes;
    /**
     * Copies several Uint8Arrays into one.
     */
    function concatBytes(...arrays) {
        const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
        let pad = 0; // walk through each item, ensure they have proper type
        arrays.forEach((a) => {
            if (!u8a(a))
                throw new Error('Uint8Array expected');
            r.set(a, pad);
            pad += a.length;
        });
        return r;
    }
    exports.concatBytes = concatBytes;
    // For runtime check if class implements interface
    class Hash {
        // Safe version that clones internal state
        clone() {
            return this._cloneInto();
        }
    }
    exports.Hash = Hash;
    function wrapConstructor(hashCons) {
        const hashC = (msg) => hashCons().update(toBytes(msg)).digest();
        const tmp = hashCons();
        hashC.outputLen = tmp.outputLen;
        hashC.blockLen = tmp.blockLen;
        hashC.create = () => hashCons();
        return hashC;
    }
    exports.wrapConstructor = wrapConstructor;
    /**
     * Secure PRNG. Uses `crypto.getRandomValues`, which defers to OS.
     */
    let crypto;
    function randomBytes(bytesLength = 32) {
        if (typeof window === 'object')
            crypto = window.crypto;
        else {
            // @ts-ignore
            crypto = require('crypto');
        }
        if (crypto && typeof crypto.getRandomValues === 'function') {
            return crypto.getRandomValues(new Uint8Array(bytesLength));
        }
        throw new Error('crypto.getRandomValues must be defined');
    }
    exports.randomBytes = randomBytes;
});
define("@scom/scom-social-sdk/core/hashes/_sha2.ts", ["require", "exports", "@scom/scom-social-sdk/core/hashes/_assert.ts", "@scom/scom-social-sdk/core/hashes/utils.ts"], function (require, exports, _assert_1, utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SHA2 = void 0;
    // Polyfill for Safari 14
    function setBigUint64(view, byteOffset, value, isLE) {
        if (typeof view.setBigUint64 === 'function')
            return view.setBigUint64(byteOffset, value, isLE);
        const _32n = BigInt(32);
        const _u32_max = BigInt(0xffffffff);
        const wh = Number((value >> _32n) & _u32_max);
        const wl = Number(value & _u32_max);
        const h = isLE ? 4 : 0;
        const l = isLE ? 0 : 4;
        view.setUint32(byteOffset + h, wh, isLE);
        view.setUint32(byteOffset + l, wl, isLE);
    }
    // Base SHA2 class (RFC 6234)
    class SHA2 extends utils_1.Hash {
        constructor(blockLen, outputLen, padOffset, isLE) {
            super();
            this.blockLen = blockLen;
            this.outputLen = outputLen;
            this.padOffset = padOffset;
            this.isLE = isLE;
            this.finished = false;
            this.length = 0;
            this.pos = 0;
            this.destroyed = false;
            this.buffer = new Uint8Array(blockLen);
            this.view = (0, utils_1.createView)(this.buffer);
        }
        update(data) {
            (0, _assert_1.exists)(this);
            const { view, buffer, blockLen } = this;
            data = (0, utils_1.toBytes)(data);
            const len = data.length;
            for (let pos = 0; pos < len;) {
                const take = Math.min(blockLen - this.pos, len - pos);
                // Fast path: we have at least one block in input, cast it to view and process
                if (take === blockLen) {
                    const dataView = (0, utils_1.createView)(data);
                    for (; blockLen <= len - pos; pos += blockLen)
                        this.process(dataView, pos);
                    continue;
                }
                buffer.set(data.subarray(pos, pos + take), this.pos);
                this.pos += take;
                pos += take;
                if (this.pos === blockLen) {
                    this.process(view, 0);
                    this.pos = 0;
                }
            }
            this.length += data.length;
            this.roundClean();
            return this;
        }
        digestInto(out) {
            (0, _assert_1.exists)(this);
            (0, _assert_1.output)(out, this);
            this.finished = true;
            // Padding
            // We can avoid allocation of buffer for padding completely if it
            // was previously not allocated here. But it won't change performance.
            const { buffer, view, blockLen, isLE } = this;
            let { pos } = this;
            // append the bit '1' to the message
            buffer[pos++] = 0b10000000;
            this.buffer.subarray(pos).fill(0);
            // we have less than padOffset left in buffer, so we cannot put length in current block, need process it and pad again
            if (this.padOffset > blockLen - pos) {
                this.process(view, 0);
                pos = 0;
            }
            // Pad until full block byte with zeros
            for (let i = pos; i < blockLen; i++)
                buffer[i] = 0;
            // Note: sha512 requires length to be 128bit integer, but length in JS will overflow before that
            // You need to write around 2 exabytes (u64_max / 8 / (1024**6)) for this to happen.
            // So we just write lowest 64 bits of that value.
            setBigUint64(view, blockLen - 8, BigInt(this.length * 8), isLE);
            this.process(view, 0);
            const oview = (0, utils_1.createView)(out);
            const len = this.outputLen;
            // NOTE: we do division by 4 later, which should be fused in single op with modulo by JIT
            if (len % 4)
                throw new Error('_sha2: outputLen should be aligned to 32bit');
            const outLen = len / 4;
            const state = this.get();
            if (outLen > state.length)
                throw new Error('_sha2: outputLen bigger than state');
            for (let i = 0; i < outLen; i++)
                oview.setUint32(4 * i, state[i], isLE);
        }
        digest() {
            const { buffer, outputLen } = this;
            this.digestInto(buffer);
            const res = buffer.slice(0, outputLen);
            this.destroy();
            return res;
        }
        _cloneInto(to) {
            to || (to = new this.constructor());
            to.set(...this.get());
            const { blockLen, buffer, length, finished, destroyed, pos } = this;
            to.length = length;
            to.pos = pos;
            to.finished = finished;
            to.destroyed = destroyed;
            if (length % blockLen)
                to.buffer.set(buffer);
            return to;
        }
    }
    exports.SHA2 = SHA2;
});
define("@scom/scom-social-sdk/core/hashes/sha256.ts", ["require", "exports", "@scom/scom-social-sdk/core/hashes/_sha2.ts", "@scom/scom-social-sdk/core/hashes/utils.ts"], function (require, exports, _sha2_1, utils_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.sha224 = exports.sha256 = void 0;
    // SHA2-256 need to try 2^128 hashes to execute birthday attack.
    // BTC network is doing 2^67 hashes/sec as per early 2023.
    // Choice: a ? b : c
    const Chi = (a, b, c) => (a & b) ^ (~a & c);
    // Majority function, true if any two inpust is true
    const Maj = (a, b, c) => (a & b) ^ (a & c) ^ (b & c);
    // Round constants:
    // first 32 bits of the fractional parts of the cube roots of the first 64 primes 2..311)
    // prettier-ignore
    const SHA256_K = /* @__PURE__ */ new Uint32Array([
        0x428a2f98, 0x71374491, 0xb5c0fbcf, 0xe9b5dba5, 0x3956c25b, 0x59f111f1, 0x923f82a4, 0xab1c5ed5,
        0xd807aa98, 0x12835b01, 0x243185be, 0x550c7dc3, 0x72be5d74, 0x80deb1fe, 0x9bdc06a7, 0xc19bf174,
        0xe49b69c1, 0xefbe4786, 0x0fc19dc6, 0x240ca1cc, 0x2de92c6f, 0x4a7484aa, 0x5cb0a9dc, 0x76f988da,
        0x983e5152, 0xa831c66d, 0xb00327c8, 0xbf597fc7, 0xc6e00bf3, 0xd5a79147, 0x06ca6351, 0x14292967,
        0x27b70a85, 0x2e1b2138, 0x4d2c6dfc, 0x53380d13, 0x650a7354, 0x766a0abb, 0x81c2c92e, 0x92722c85,
        0xa2bfe8a1, 0xa81a664b, 0xc24b8b70, 0xc76c51a3, 0xd192e819, 0xd6990624, 0xf40e3585, 0x106aa070,
        0x19a4c116, 0x1e376c08, 0x2748774c, 0x34b0bcb5, 0x391c0cb3, 0x4ed8aa4a, 0x5b9cca4f, 0x682e6ff3,
        0x748f82ee, 0x78a5636f, 0x84c87814, 0x8cc70208, 0x90befffa, 0xa4506ceb, 0xbef9a3f7, 0xc67178f2
    ]);
    // Initial state (first 32 bits of the fractional parts of the square roots of the first 8 primes 2..19):
    // prettier-ignore
    const IV = /* @__PURE__ */ new Uint32Array([
        0x6a09e667, 0xbb67ae85, 0x3c6ef372, 0xa54ff53a, 0x510e527f, 0x9b05688c, 0x1f83d9ab, 0x5be0cd19
    ]);
    // Temporary buffer, not used to store anything between runs
    // Named this way because it matches specification.
    const SHA256_W = /* @__PURE__ */ new Uint32Array(64);
    class SHA256 extends _sha2_1.SHA2 {
        constructor() {
            super(64, 32, 8, false);
            // We cannot use array here since array allows indexing by variable
            // which means optimizer/compiler cannot use registers.
            this.A = IV[0] | 0;
            this.B = IV[1] | 0;
            this.C = IV[2] | 0;
            this.D = IV[3] | 0;
            this.E = IV[4] | 0;
            this.F = IV[5] | 0;
            this.G = IV[6] | 0;
            this.H = IV[7] | 0;
        }
        get() {
            const { A, B, C, D, E, F, G, H } = this;
            return [A, B, C, D, E, F, G, H];
        }
        // prettier-ignore
        set(A, B, C, D, E, F, G, H) {
            this.A = A | 0;
            this.B = B | 0;
            this.C = C | 0;
            this.D = D | 0;
            this.E = E | 0;
            this.F = F | 0;
            this.G = G | 0;
            this.H = H | 0;
        }
        process(view, offset) {
            // Extend the first 16 words into the remaining 48 words w[16..63] of the message schedule array
            for (let i = 0; i < 16; i++, offset += 4)
                SHA256_W[i] = view.getUint32(offset, false);
            for (let i = 16; i < 64; i++) {
                const W15 = SHA256_W[i - 15];
                const W2 = SHA256_W[i - 2];
                const s0 = (0, utils_2.rotr)(W15, 7) ^ (0, utils_2.rotr)(W15, 18) ^ (W15 >>> 3);
                const s1 = (0, utils_2.rotr)(W2, 17) ^ (0, utils_2.rotr)(W2, 19) ^ (W2 >>> 10);
                SHA256_W[i] = (s1 + SHA256_W[i - 7] + s0 + SHA256_W[i - 16]) | 0;
            }
            // Compression function main loop, 64 rounds
            let { A, B, C, D, E, F, G, H } = this;
            for (let i = 0; i < 64; i++) {
                const sigma1 = (0, utils_2.rotr)(E, 6) ^ (0, utils_2.rotr)(E, 11) ^ (0, utils_2.rotr)(E, 25);
                const T1 = (H + sigma1 + Chi(E, F, G) + SHA256_K[i] + SHA256_W[i]) | 0;
                const sigma0 = (0, utils_2.rotr)(A, 2) ^ (0, utils_2.rotr)(A, 13) ^ (0, utils_2.rotr)(A, 22);
                const T2 = (sigma0 + Maj(A, B, C)) | 0;
                H = G;
                G = F;
                F = E;
                E = (D + T1) | 0;
                D = C;
                C = B;
                B = A;
                A = (T1 + T2) | 0;
            }
            // Add the compressed chunk to the current hash value
            A = (A + this.A) | 0;
            B = (B + this.B) | 0;
            C = (C + this.C) | 0;
            D = (D + this.D) | 0;
            E = (E + this.E) | 0;
            F = (F + this.F) | 0;
            G = (G + this.G) | 0;
            H = (H + this.H) | 0;
            this.set(A, B, C, D, E, F, G, H);
        }
        roundClean() {
            SHA256_W.fill(0);
        }
        destroy() {
            this.set(0, 0, 0, 0, 0, 0, 0, 0);
            this.buffer.fill(0);
        }
    }
    // Constants from https://nvlpubs.nist.gov/nistpubs/FIPS/NIST.FIPS.180-4.pdf
    class SHA224 extends SHA256 {
        constructor() {
            super();
            this.A = 0xc1059ed8 | 0;
            this.B = 0x367cd507 | 0;
            this.C = 0x3070dd17 | 0;
            this.D = 0xf70e5939 | 0;
            this.E = 0xffc00b31 | 0;
            this.F = 0x68581511 | 0;
            this.G = 0x64f98fa7 | 0;
            this.H = 0xbefa4fa4 | 0;
            this.outputLen = 28;
        }
    }
    /**
     * SHA2-256 hash function
     * @param message - data that would be hashed
     */
    exports.sha256 = (0, utils_2.wrapConstructor)(() => new SHA256());
    exports.sha224 = (0, utils_2.wrapConstructor)(() => new SHA224());
});
define("@scom/scom-social-sdk/core/curves/abstract/utils.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateObject = exports.createHmacDrbg = exports.bitMask = exports.bitSet = exports.bitGet = exports.bitLen = exports.utf8ToBytes = exports.equalBytes = exports.concatBytes = exports.ensureBytes = exports.numberToVarBytesBE = exports.numberToBytesLE = exports.numberToBytesBE = exports.bytesToNumberLE = exports.bytesToNumberBE = exports.hexToBytes = exports.hexToNumber = exports.numberToHexUnpadded = exports.bytesToHex = void 0;
    ///<amd-module name='@scom/scom-social-sdk/core/curves/abstract/utils.ts'/> 
    // adopted from https://github.com/paulmillr/noble-curves
    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    // 100 lines of code in the file are duplicated from noble-hashes (utils).
    // This is OK: `abstract` directory does not use noble-hashes.
    // User may opt-in into using different hashing library. This way, noble-hashes
    // won't be included into their bundle.
    const _0n = BigInt(0);
    const _1n = BigInt(1);
    const _2n = BigInt(2);
    const u8a = (a) => a instanceof Uint8Array;
    const hexes = /* @__PURE__ */ Array.from({ length: 256 }, (_, i) => i.toString(16).padStart(2, '0'));
    /**
     * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
     */
    function bytesToHex(bytes) {
        if (!u8a(bytes))
            throw new Error('Uint8Array expected');
        // pre-caching improves the speed 6x
        let hex = '';
        for (let i = 0; i < bytes.length; i++) {
            hex += hexes[bytes[i]];
        }
        return hex;
    }
    exports.bytesToHex = bytesToHex;
    function numberToHexUnpadded(num) {
        const hex = num.toString(16);
        return hex.length & 1 ? `0${hex}` : hex;
    }
    exports.numberToHexUnpadded = numberToHexUnpadded;
    function hexToNumber(hex) {
        if (typeof hex !== 'string')
            throw new Error('hex string expected, got ' + typeof hex);
        // Big Endian
        return BigInt(hex === '' ? '0' : `0x${hex}`);
    }
    exports.hexToNumber = hexToNumber;
    // We use optimized technique to convert hex string to byte array
    const asciis = { _0: 48, _9: 57, _A: 65, _F: 70, _a: 97, _f: 102 };
    function asciiToBase16(char) {
        if (char >= asciis._0 && char <= asciis._9)
            return char - asciis._0;
        if (char >= asciis._A && char <= asciis._F)
            return char - (asciis._A - 10);
        if (char >= asciis._a && char <= asciis._f)
            return char - (asciis._a - 10);
        return;
    }
    /**
     * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
     */
    function hexToBytes(hex) {
        if (typeof hex !== 'string')
            throw new Error('hex string expected, got ' + typeof hex);
        const hl = hex.length;
        const al = hl / 2;
        if (hl % 2)
            throw new Error('padded hex string expected, got unpadded hex of length ' + hl);
        const array = new Uint8Array(al);
        for (let ai = 0, hi = 0; ai < al; ai++, hi += 2) {
            const n1 = asciiToBase16(hex.charCodeAt(hi));
            const n2 = asciiToBase16(hex.charCodeAt(hi + 1));
            if (n1 === undefined || n2 === undefined) {
                const char = hex[hi] + hex[hi + 1];
                throw new Error('hex string expected, got non-hex character "' + char + '" at index ' + hi);
            }
            array[ai] = n1 * 16 + n2;
        }
        return array;
    }
    exports.hexToBytes = hexToBytes;
    // BE: Big Endian, LE: Little Endian
    function bytesToNumberBE(bytes) {
        return hexToNumber(bytesToHex(bytes));
    }
    exports.bytesToNumberBE = bytesToNumberBE;
    function bytesToNumberLE(bytes) {
        if (!u8a(bytes))
            throw new Error('Uint8Array expected');
        return hexToNumber(bytesToHex(Uint8Array.from(bytes).reverse()));
    }
    exports.bytesToNumberLE = bytesToNumberLE;
    function numberToBytesBE(n, len) {
        return hexToBytes(n.toString(16).padStart(len * 2, '0'));
    }
    exports.numberToBytesBE = numberToBytesBE;
    function numberToBytesLE(n, len) {
        return numberToBytesBE(n, len).reverse();
    }
    exports.numberToBytesLE = numberToBytesLE;
    // Unpadded, rarely used
    function numberToVarBytesBE(n) {
        return hexToBytes(numberToHexUnpadded(n));
    }
    exports.numberToVarBytesBE = numberToVarBytesBE;
    /**
     * Takes hex string or Uint8Array, converts to Uint8Array.
     * Validates output length.
     * Will throw error for other types.
     * @param title descriptive title for an error e.g. 'private key'
     * @param hex hex string or Uint8Array
     * @param expectedLength optional, will compare to result array's length
     * @returns
     */
    function ensureBytes(title, hex, expectedLength) {
        let res;
        if (typeof hex === 'string') {
            try {
                res = hexToBytes(hex);
            }
            catch (e) {
                throw new Error(`${title} must be valid hex string, got "${hex}". Cause: ${e}`);
            }
        }
        else if (u8a(hex)) {
            // Uint8Array.from() instead of hash.slice() because node.js Buffer
            // is instance of Uint8Array, and its slice() creates **mutable** copy
            res = Uint8Array.from(hex);
        }
        else {
            throw new Error(`${title} must be hex string or Uint8Array`);
        }
        const len = res.length;
        if (typeof expectedLength === 'number' && len !== expectedLength)
            throw new Error(`${title} expected ${expectedLength} bytes, got ${len}`);
        return res;
    }
    exports.ensureBytes = ensureBytes;
    /**
     * Copies several Uint8Arrays into one.
     */
    function concatBytes(...arrays) {
        const r = new Uint8Array(arrays.reduce((sum, a) => sum + a.length, 0));
        let pad = 0; // walk through each item, ensure they have proper type
        arrays.forEach((a) => {
            if (!u8a(a))
                throw new Error('Uint8Array expected');
            r.set(a, pad);
            pad += a.length;
        });
        return r;
    }
    exports.concatBytes = concatBytes;
    function equalBytes(b1, b2) {
        // We don't care about timing attacks here
        if (b1.length !== b2.length)
            return false;
        for (let i = 0; i < b1.length; i++)
            if (b1[i] !== b2[i])
                return false;
        return true;
    }
    exports.equalBytes = equalBytes;
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    function utf8ToBytes(str) {
        if (typeof str !== 'string')
            throw new Error(`utf8ToBytes expected string, got ${typeof str}`);
        return new Uint8Array(new TextEncoder().encode(str)); // https://bugzil.la/1681809
    }
    exports.utf8ToBytes = utf8ToBytes;
    // Bit operations
    /**
     * Calculates amount of bits in a bigint.
     * Same as `n.toString(2).length`
     */
    function bitLen(n) {
        let len;
        for (len = 0; n > _0n; n >>= _1n, len += 1)
            ;
        return len;
    }
    exports.bitLen = bitLen;
    /**
     * Gets single bit at position.
     * NOTE: first bit position is 0 (same as arrays)
     * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
     */
    function bitGet(n, pos) {
        return (n >> BigInt(pos)) & _1n;
    }
    exports.bitGet = bitGet;
    /**
     * Sets single bit at position.
     */
    const bitSet = (n, pos, value) => {
        return n | ((value ? _1n : _0n) << BigInt(pos));
    };
    exports.bitSet = bitSet;
    /**
     * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
     * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
     */
    const bitMask = (n) => (_2n << BigInt(n - 1)) - _1n;
    exports.bitMask = bitMask;
    // DRBG
    const u8n = (data) => new Uint8Array(data); // creates Uint8Array
    const u8fr = (arr) => Uint8Array.from(arr); // another shortcut
    /**
     * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
     * @returns function that will call DRBG until 2nd arg returns something meaningful
     * @example
     *   const drbg = createHmacDRBG<Key>(32, 32, hmac);
     *   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
     */
    function createHmacDrbg(hashLen, qByteLen, hmacFn) {
        if (typeof hashLen !== 'number' || hashLen < 2)
            throw new Error('hashLen must be a number');
        if (typeof qByteLen !== 'number' || qByteLen < 2)
            throw new Error('qByteLen must be a number');
        if (typeof hmacFn !== 'function')
            throw new Error('hmacFn must be a function');
        // Step B, Step C: set hashLen to 8*ceil(hlen/8)
        let v = u8n(hashLen); // Minimal non-full-spec HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
        let k = u8n(hashLen); // Steps B and C of RFC6979 3.2: set hashLen, in our case always same
        let i = 0; // Iterations counter, will throw when over 1000
        const reset = () => {
            v.fill(1);
            k.fill(0);
            i = 0;
        };
        const h = (...b) => hmacFn(k, v, ...b); // hmac(k)(v, ...values)
        const reseed = (seed = u8n()) => {
            // HMAC-DRBG reseed() function. Steps D-G
            k = h(u8fr([0x00]), seed); // k = hmac(k || v || 0x00 || seed)
            v = h(); // v = hmac(k || v)
            if (seed.length === 0)
                return;
            k = h(u8fr([0x01]), seed); // k = hmac(k || v || 0x01 || seed)
            v = h(); // v = hmac(k || v)
        };
        const gen = () => {
            // HMAC-DRBG generate() function
            if (i++ >= 1000)
                throw new Error('drbg: tried 1000 values');
            let len = 0;
            const out = [];
            while (len < qByteLen) {
                v = h();
                const sl = v.slice();
                out.push(sl);
                len += v.length;
            }
            return concatBytes(...out);
        };
        const genUntil = (seed, pred) => {
            reset();
            reseed(seed); // Steps D-G
            let res = undefined; // Step H: grind until k is in [1..n-1]
            while (!(res = pred(gen())))
                reseed();
            reset();
            return res;
        };
        return genUntil;
    }
    exports.createHmacDrbg = createHmacDrbg;
    // Validating curves and fields
    const validatorFns = {
        bigint: (val) => typeof val === 'bigint',
        function: (val) => typeof val === 'function',
        boolean: (val) => typeof val === 'boolean',
        string: (val) => typeof val === 'string',
        stringOrUint8Array: (val) => typeof val === 'string' || val instanceof Uint8Array,
        isSafeInteger: (val) => Number.isSafeInteger(val),
        array: (val) => Array.isArray(val),
        field: (val, object) => object.Fp.isValid(val),
        hash: (val) => typeof val === 'function' && Number.isSafeInteger(val.outputLen),
    };
    // type Record<K extends string | number | symbol, T> = { [P in K]: T; }
    function validateObject(object, validators, optValidators = {}) {
        const checkField = (fieldName, type, isOptional) => {
            const checkVal = validatorFns[type];
            if (typeof checkVal !== 'function')
                throw new Error(`Invalid validator "${type}", expected function`);
            const val = object[fieldName];
            if (isOptional && val === undefined)
                return;
            if (!checkVal(val, object)) {
                throw new Error(`Invalid param ${String(fieldName)}=${val} (${typeof val}), expected ${type}`);
            }
        };
        for (const [fieldName, type] of Object.entries(validators))
            checkField(fieldName, type, false);
        for (const [fieldName, type] of Object.entries(optValidators))
            checkField(fieldName, type, true);
        return object;
    }
    exports.validateObject = validateObject;
});
// validate type tests
// const o: { a: number; b: number; c: number } = { a: 1, b: 5, c: 6 };
// const z0 = validateObject(o, { a: 'isSafeInteger' }, { c: 'bigint' }); // Ok!
// // Should fail type-check
// const z1 = validateObject(o, { a: 'tmp' }, { c: 'zz' });
// const z2 = validateObject(o, { a: 'isSafeInteger' }, { c: 'zz' });
// const z3 = validateObject(o, { test: 'boolean', z: 'bug' });
// const z4 = validateObject(o, { a: 'boolean', z: 'bug' });
define("@scom/scom-social-sdk/core/curves/abstract/modular.ts", ["require", "exports", "@scom/scom-social-sdk/core/curves/abstract/utils.ts"], function (require, exports, utils_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mapHashToField = exports.getMinHashLength = exports.getFieldBytesLength = exports.hashToPrivateScalar = exports.FpSqrtEven = exports.FpSqrtOdd = exports.Field = exports.nLength = exports.FpIsSquare = exports.FpDiv = exports.FpInvertBatch = exports.FpPow = exports.validateField = exports.isNegativeLE = exports.FpSqrt = exports.tonelliShanks = exports.invert = exports.pow2 = exports.pow = exports.mod = void 0;
    // prettier-ignore
    const _0n = BigInt(0), _1n = BigInt(1), _2n = BigInt(2), _3n = BigInt(3);
    // prettier-ignore
    const _4n = BigInt(4), _5n = BigInt(5), _8n = BigInt(8);
    // prettier-ignore
    const _9n = BigInt(9), _16n = BigInt(16);
    // Calculates a modulo b
    function mod(a, b) {
        const result = a % b;
        return result >= _0n ? result : b + result;
    }
    exports.mod = mod;
    /**
     * Efficiently raise num to power and do modular division.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     * @example
     * pow(2n, 6n, 11n) // 64n % 11n == 9n
     */
    // TODO: use field version && remove
    function pow(num, power, modulo) {
        if (modulo <= _0n || power < _0n)
            throw new Error('Expected power/modulo > 0');
        if (modulo === _1n)
            return _0n;
        let res = _1n;
        while (power > _0n) {
            if (power & _1n)
                res = (res * num) % modulo;
            num = (num * num) % modulo;
            power >>= _1n;
        }
        return res;
    }
    exports.pow = pow;
    // Does x ^ (2 ^ power) mod p. pow2(30, 4) == 30 ^ (2 ^ 4)
    function pow2(x, power, modulo) {
        let res = x;
        while (power-- > _0n) {
            res *= res;
            res %= modulo;
        }
        return res;
    }
    exports.pow2 = pow2;
    // Inverses number over modulo
    function invert(number, modulo) {
        if (number === _0n || modulo <= _0n) {
            throw new Error(`invert: expected positive integers, got n=${number} mod=${modulo}`);
        }
        // Euclidean GCD https://brilliant.org/wiki/extended-euclidean-algorithm/
        // Fermat's little theorem "CT-like" version inv(n) = n^(m-2) mod m is 30x slower.
        let a = mod(number, modulo);
        let b = modulo;
        // prettier-ignore
        let x = _0n, y = _1n, u = _1n, v = _0n;
        while (a !== _0n) {
            // JIT applies optimization if those two lines follow each other
            const q = b / a;
            const r = b % a;
            const m = x - u * q;
            const n = y - v * q;
            // prettier-ignore
            b = a, a = r, x = u, y = v, u = m, v = n;
        }
        const gcd = b;
        if (gcd !== _1n)
            throw new Error('invert: does not exist');
        return mod(x, modulo);
    }
    exports.invert = invert;
    /**
     * Tonelli-Shanks square root search algorithm.
     * 1. https://eprint.iacr.org/2012/685.pdf (page 12)
     * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
     * Will start an infinite loop if field order P is not prime.
     * @param P field order
     * @returns function that takes field Fp (created from P) and number n
     */
    function tonelliShanks(P) {
        // Legendre constant: used to calculate Legendre symbol (a | p),
        // which denotes the value of a^((p-1)/2) (mod p).
        // (a | p) ≡ 1    if a is a square (mod p)
        // (a | p) ≡ -1   if a is not a square (mod p)
        // (a | p) ≡ 0    if a ≡ 0 (mod p)
        const legendreC = (P - _1n) / _2n;
        let Q, S, Z;
        // Step 1: By factoring out powers of 2 from p - 1,
        // find q and s such that p - 1 = q*(2^s) with q odd
        for (Q = P - _1n, S = 0; Q % _2n === _0n; Q /= _2n, S++)
            ;
        // Step 2: Select a non-square z such that (z | p) ≡ -1 and set c ≡ zq
        for (Z = _2n; Z < P && pow(Z, legendreC, P) !== P - _1n; Z++)
            ;
        // Fast-path
        if (S === 1) {
            const p1div4 = (P + _1n) / _4n;
            return function tonelliFast(Fp, n) {
                const root = Fp.pow(n, p1div4);
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Slow-path
        const Q1div2 = (Q + _1n) / _2n;
        return function tonelliSlow(Fp, n) {
            // Step 0: Check that n is indeed a square: (n | p) should not be ≡ -1
            if (Fp.pow(n, legendreC) === Fp.neg(Fp.ONE))
                throw new Error('Cannot find square root');
            let r = S;
            // TODO: will fail at Fp2/etc
            let g = Fp.pow(Fp.mul(Fp.ONE, Z), Q); // will update both x and b
            let x = Fp.pow(n, Q1div2); // first guess at the square root
            let b = Fp.pow(n, Q); // first guess at the fudge factor
            while (!Fp.eql(b, Fp.ONE)) {
                if (Fp.eql(b, Fp.ZERO))
                    return Fp.ZERO; // https://en.wikipedia.org/wiki/Tonelli%E2%80%93Shanks_algorithm (4. If t = 0, return r = 0)
                // Find m such b^(2^m)==1
                let m = 1;
                for (let t2 = Fp.sqr(b); m < r; m++) {
                    if (Fp.eql(t2, Fp.ONE))
                        break;
                    t2 = Fp.sqr(t2); // t2 *= t2
                }
                // NOTE: r-m-1 can be bigger than 32, need to convert to bigint before shift, otherwise there will be overflow
                const ge = Fp.pow(g, _1n << BigInt(r - m - 1)); // ge = 2^(r-m-1)
                g = Fp.sqr(ge); // g = ge * ge
                x = Fp.mul(x, ge); // x *= ge
                b = Fp.mul(b, g); // b *= g
                r = m;
            }
            return x;
        };
    }
    exports.tonelliShanks = tonelliShanks;
    function FpSqrt(P) {
        // NOTE: different algorithms can give different roots, it is up to user to decide which one they want.
        // For example there is FpSqrtOdd/FpSqrtEven to choice root based on oddness (used for hash-to-curve).
        // P ≡ 3 (mod 4)
        // √n = n^((P+1)/4)
        if (P % _4n === _3n) {
            // Not all roots possible!
            // const ORDER =
            //   0x1a0111ea397fe69a4b1ba7b6434bacd764774b84f38512bf6730d2a0f6b0f6241eabfffeb153ffffb9feffffffffaaabn;
            // const NUM = 72057594037927816n;
            const p1div4 = (P + _1n) / _4n;
            return function sqrt3mod4(Fp, n) {
                const root = Fp.pow(n, p1div4);
                // Throw if root**2 != n
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // Atkin algorithm for q ≡ 5 (mod 8), https://eprint.iacr.org/2012/685.pdf (page 10)
        if (P % _8n === _5n) {
            const c1 = (P - _5n) / _8n;
            return function sqrt5mod8(Fp, n) {
                const n2 = Fp.mul(n, _2n);
                const v = Fp.pow(n2, c1);
                const nv = Fp.mul(n, v);
                const i = Fp.mul(Fp.mul(nv, _2n), v);
                const root = Fp.mul(nv, Fp.sub(i, Fp.ONE));
                if (!Fp.eql(Fp.sqr(root), n))
                    throw new Error('Cannot find square root');
                return root;
            };
        }
        // P ≡ 9 (mod 16)
        if (P % _16n === _9n) {
            // NOTE: tonelli is too slow for bls-Fp2 calculations even on start
            // Means we cannot use sqrt for constants at all!
            //
            // const c1 = Fp.sqrt(Fp.negate(Fp.ONE)); //  1. c1 = sqrt(-1) in F, i.e., (c1^2) == -1 in F
            // const c2 = Fp.sqrt(c1);                //  2. c2 = sqrt(c1) in F, i.e., (c2^2) == c1 in F
            // const c3 = Fp.sqrt(Fp.negate(c1));     //  3. c3 = sqrt(-c1) in F, i.e., (c3^2) == -c1 in F
            // const c4 = (P + _7n) / _16n;           //  4. c4 = (q + 7) / 16        # Integer arithmetic
            // sqrt = (x) => {
            //   let tv1 = Fp.pow(x, c4);             //  1. tv1 = x^c4
            //   let tv2 = Fp.mul(c1, tv1);           //  2. tv2 = c1 * tv1
            //   const tv3 = Fp.mul(c2, tv1);         //  3. tv3 = c2 * tv1
            //   let tv4 = Fp.mul(c3, tv1);           //  4. tv4 = c3 * tv1
            //   const e1 = Fp.equals(Fp.square(tv2), x); //  5.  e1 = (tv2^2) == x
            //   const e2 = Fp.equals(Fp.square(tv3), x); //  6.  e2 = (tv3^2) == x
            //   tv1 = Fp.cmov(tv1, tv2, e1); //  7. tv1 = CMOV(tv1, tv2, e1)  # Select tv2 if (tv2^2) == x
            //   tv2 = Fp.cmov(tv4, tv3, e2); //  8. tv2 = CMOV(tv4, tv3, e2)  # Select tv3 if (tv3^2) == x
            //   const e3 = Fp.equals(Fp.square(tv2), x); //  9.  e3 = (tv2^2) == x
            //   return Fp.cmov(tv1, tv2, e3); //  10.  z = CMOV(tv1, tv2, e3)  # Select the sqrt from tv1 and tv2
            // }
        }
        // Other cases: Tonelli-Shanks algorithm
        return tonelliShanks(P);
    }
    exports.FpSqrt = FpSqrt;
    // Little-endian check for first LE bit (last BE bit);
    const isNegativeLE = (num, modulo) => (mod(num, modulo) & _1n) === _1n;
    exports.isNegativeLE = isNegativeLE;
    // prettier-ignore
    const FIELD_FIELDS = [
        'create', 'isValid', 'is0', 'neg', 'inv', 'sqrt', 'sqr',
        'eql', 'add', 'sub', 'mul', 'pow', 'div',
        'addN', 'subN', 'mulN', 'sqrN'
    ];
    function validateField(field) {
        const initial = {
            ORDER: 'bigint',
            MASK: 'bigint',
            BYTES: 'isSafeInteger',
            BITS: 'isSafeInteger',
        };
        const opts = FIELD_FIELDS.reduce((map, val) => {
            map[val] = 'function';
            return map;
        }, initial);
        return (0, utils_3.validateObject)(field, opts);
    }
    exports.validateField = validateField;
    // Generic field functions
    /**
     * Same as `pow` but for Fp: non-constant-time.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     */
    function FpPow(f, num, power) {
        // Should have same speed as pow for bigints
        // TODO: benchmark!
        if (power < _0n)
            throw new Error('Expected power > 0');
        if (power === _0n)
            return f.ONE;
        if (power === _1n)
            return num;
        let p = f.ONE;
        let d = num;
        while (power > _0n) {
            if (power & _1n)
                p = f.mul(p, d);
            d = f.sqr(d);
            power >>= _1n;
        }
        return p;
    }
    exports.FpPow = FpPow;
    /**
     * Efficiently invert an array of Field elements.
     * `inv(0)` will return `undefined` here: make sure to throw an error.
     */
    function FpInvertBatch(f, nums) {
        const tmp = new Array(nums.length);
        // Walk from first to last, multiply them by each other MOD p
        const lastMultiplied = nums.reduce((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = acc;
            return f.mul(acc, num);
        }, f.ONE);
        // Invert last element
        const inverted = f.inv(lastMultiplied);
        // Walk from last to first, multiply them by inverted each other MOD p
        nums.reduceRight((acc, num, i) => {
            if (f.is0(num))
                return acc;
            tmp[i] = f.mul(acc, tmp[i]);
            return f.mul(acc, num);
        }, inverted);
        return tmp;
    }
    exports.FpInvertBatch = FpInvertBatch;
    function FpDiv(f, lhs, rhs) {
        return f.mul(lhs, typeof rhs === 'bigint' ? invert(rhs, f.ORDER) : f.inv(rhs));
    }
    exports.FpDiv = FpDiv;
    // This function returns True whenever the value x is a square in the field F.
    function FpIsSquare(f) {
        const legendreConst = (f.ORDER - _1n) / _2n; // Integer arithmetic
        return (x) => {
            const p = f.pow(x, legendreConst);
            return f.eql(p, f.ZERO) || f.eql(p, f.ONE);
        };
    }
    exports.FpIsSquare = FpIsSquare;
    // CURVE.n lengths
    function nLength(n, nBitLength) {
        // Bit size, byte size of CURVE.n
        const _nBitLength = nBitLength !== undefined ? nBitLength : n.toString(2).length;
        const nByteLength = Math.ceil(_nBitLength / 8);
        return { nBitLength: _nBitLength, nByteLength };
    }
    exports.nLength = nLength;
    /**
     * Initializes a finite field over prime. **Non-primes are not supported.**
     * Do not init in loop: slow. Very fragile: always run a benchmark on a change.
     * Major performance optimizations:
     * * a) denormalized operations like mulN instead of mul
     * * b) same object shape: never add or remove keys
     * * c) Object.freeze
     * @param ORDER prime positive bigint
     * @param bitLen how many bits the field consumes
     * @param isLE (def: false) if encoding / decoding should be in little-endian
     * @param redef optional faster redefinitions of sqrt and other methods
     */
    function Field(ORDER, bitLen, isLE = false, redef = {}) {
        if (ORDER <= _0n)
            throw new Error(`Expected Field ORDER > 0, got ${ORDER}`);
        const { nBitLength: BITS, nByteLength: BYTES } = nLength(ORDER, bitLen);
        if (BYTES > 2048)
            throw new Error('Field lengths over 2048 bytes are not supported');
        const sqrtP = FpSqrt(ORDER);
        const f = Object.freeze({
            ORDER,
            BITS,
            BYTES,
            MASK: (0, utils_3.bitMask)(BITS),
            ZERO: _0n,
            ONE: _1n,
            create: (num) => mod(num, ORDER),
            isValid: (num) => {
                if (typeof num !== 'bigint')
                    throw new Error(`Invalid field element: expected bigint, got ${typeof num}`);
                return _0n <= num && num < ORDER; // 0 is valid element, but it's not invertible
            },
            is0: (num) => num === _0n,
            isOdd: (num) => (num & _1n) === _1n,
            neg: (num) => mod(-num, ORDER),
            eql: (lhs, rhs) => lhs === rhs,
            sqr: (num) => mod(num * num, ORDER),
            add: (lhs, rhs) => mod(lhs + rhs, ORDER),
            sub: (lhs, rhs) => mod(lhs - rhs, ORDER),
            mul: (lhs, rhs) => mod(lhs * rhs, ORDER),
            pow: (num, power) => FpPow(f, num, power),
            div: (lhs, rhs) => mod(lhs * invert(rhs, ORDER), ORDER),
            // Same as above, but doesn't normalize
            sqrN: (num) => num * num,
            addN: (lhs, rhs) => lhs + rhs,
            subN: (lhs, rhs) => lhs - rhs,
            mulN: (lhs, rhs) => lhs * rhs,
            inv: (num) => invert(num, ORDER),
            sqrt: redef.sqrt || ((n) => sqrtP(f, n)),
            invertBatch: (lst) => FpInvertBatch(f, lst),
            // TODO: do we really need constant cmov?
            // We don't have const-time bigints anyway, so probably will be not very useful
            cmov: (a, b, c) => (c ? b : a),
            toBytes: (num) => (isLE ? (0, utils_3.numberToBytesLE)(num, BYTES) : (0, utils_3.numberToBytesBE)(num, BYTES)),
            fromBytes: (bytes) => {
                if (bytes.length !== BYTES)
                    throw new Error(`Fp.fromBytes: expected ${BYTES}, got ${bytes.length}`);
                return isLE ? (0, utils_3.bytesToNumberLE)(bytes) : (0, utils_3.bytesToNumberBE)(bytes);
            },
        });
        return Object.freeze(f);
    }
    exports.Field = Field;
    function FpSqrtOdd(Fp, elm) {
        if (!Fp.isOdd)
            throw new Error(`Field doesn't have isOdd`);
        const root = Fp.sqrt(elm);
        return Fp.isOdd(root) ? root : Fp.neg(root);
    }
    exports.FpSqrtOdd = FpSqrtOdd;
    function FpSqrtEven(Fp, elm) {
        if (!Fp.isOdd)
            throw new Error(`Field doesn't have isOdd`);
        const root = Fp.sqrt(elm);
        return Fp.isOdd(root) ? Fp.neg(root) : root;
    }
    exports.FpSqrtEven = FpSqrtEven;
    /**
     * "Constant-time" private key generation utility.
     * Same as mapKeyToField, but accepts less bytes (40 instead of 48 for 32-byte field).
     * Which makes it slightly more biased, less secure.
     * @deprecated use mapKeyToField instead
     */
    function hashToPrivateScalar(hash, groupOrder, isLE = false) {
        hash = (0, utils_3.ensureBytes)('privateHash', hash);
        const hashLen = hash.length;
        const minLen = nLength(groupOrder).nByteLength + 8;
        if (minLen < 24 || hashLen < minLen || hashLen > 1024)
            throw new Error(`hashToPrivateScalar: expected ${minLen}-1024 bytes of input, got ${hashLen}`);
        const num = isLE ? (0, utils_3.bytesToNumberLE)(hash) : (0, utils_3.bytesToNumberBE)(hash);
        return mod(num, groupOrder - _1n) + _1n;
    }
    exports.hashToPrivateScalar = hashToPrivateScalar;
    /**
     * Returns total number of bytes consumed by the field element.
     * For example, 32 bytes for usual 256-bit weierstrass curve.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of field
     */
    function getFieldBytesLength(fieldOrder) {
        if (typeof fieldOrder !== 'bigint')
            throw new Error('field order must be bigint');
        const bitLength = fieldOrder.toString(2).length;
        return Math.ceil(bitLength / 8);
    }
    exports.getFieldBytesLength = getFieldBytesLength;
    /**
     * Returns minimal amount of bytes that can be safely reduced
     * by field order.
     * Should be 2^-128 for 128-bit curve such as P256.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of target hash
     */
    function getMinHashLength(fieldOrder) {
        const length = getFieldBytesLength(fieldOrder);
        return length + Math.ceil(length / 2);
    }
    exports.getMinHashLength = getMinHashLength;
    /**
     * "Constant-time" private key generation utility.
     * Can take (n + n/2) or more bytes of uniform input e.g. from CSPRNG or KDF
     * and convert them into private scalar, with the modulo bias being negligible.
     * Needs at least 48 bytes of input for 32-byte private key.
     * https://research.kudelskisecurity.com/2020/07/28/the-definitive-guide-to-modulo-bias-and-how-to-avoid-it/
     * FIPS 186-5, A.2 https://csrc.nist.gov/publications/detail/fips/186/5/final
     * RFC 9380, https://www.rfc-editor.org/rfc/rfc9380#section-5
     * @param hash hash output from SHA3 or a similar function
     * @param groupOrder size of subgroup - (e.g. secp256k1.CURVE.n)
     * @param isLE interpret hash bytes as LE num
     * @returns valid private scalar
     */
    function mapHashToField(key, fieldOrder, isLE = false) {
        const len = key.length;
        const fieldLen = getFieldBytesLength(fieldOrder);
        const minLen = getMinHashLength(fieldOrder);
        // No small numbers: need to understand bias story. No huge numbers: easier to detect JS timings.
        if (len < 16 || len < minLen || len > 1024)
            throw new Error(`expected ${minLen}-1024 bytes of input, got ${len}`);
        const num = isLE ? (0, utils_3.bytesToNumberBE)(key) : (0, utils_3.bytesToNumberLE)(key);
        // `mod(x, 11)` can sometimes produce 0. `mod(x, 10) + 1` is the same, but no 0
        const reduced = mod(num, fieldOrder - _1n) + _1n;
        return isLE ? (0, utils_3.numberToBytesLE)(reduced, fieldLen) : (0, utils_3.numberToBytesBE)(reduced, fieldLen);
    }
    exports.mapHashToField = mapHashToField;
});
define("@scom/scom-social-sdk/core/curves/abstract/curve.ts", ["require", "exports", "@scom/scom-social-sdk/core/curves/abstract/modular.ts", "@scom/scom-social-sdk/core/curves/abstract/utils.ts"], function (require, exports, modular_1, utils_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.validateBasic = exports.wNAF = void 0;
    const _0n = BigInt(0);
    const _1n = BigInt(1);
    // Elliptic curve multiplication of Point by scalar. Fragile.
    // Scalars should always be less than curve order: this should be checked inside of a curve itself.
    // Creates precomputation tables for fast multiplication:
    // - private scalar is split by fixed size windows of W bits
    // - every window point is collected from window's table & added to accumulator
    // - since windows are different, same point inside tables won't be accessed more than once per calc
    // - each multiplication is 'Math.ceil(CURVE_ORDER / 𝑊) + 1' point additions (fixed for any scalar)
    // - +1 window is neccessary for wNAF
    // - wNAF reduces table size: 2x less memory + 2x faster generation, but 10% slower multiplication
    // TODO: Research returning 2d JS array of windows, instead of a single window. This would allow
    // windows to be in different memory locations
    function wNAF(c, bits) {
        const constTimeNegate = (condition, item) => {
            const neg = item.negate();
            return condition ? neg : item;
        };
        const opts = (W) => {
            const windows = Math.ceil(bits / W) + 1; // +1, because
            const windowSize = 2 ** (W - 1); // -1 because we skip zero
            return { windows, windowSize };
        };
        return {
            constTimeNegate,
            // non-const time multiplication ladder
            unsafeLadder(elm, n) {
                let p = c.ZERO;
                let d = elm;
                while (n > _0n) {
                    if (n & _1n)
                        p = p.add(d);
                    d = d.double();
                    n >>= _1n;
                }
                return p;
            },
            /**
             * Creates a wNAF precomputation window. Used for caching.
             * Default window size is set by `utils.precompute()` and is equal to 8.
             * Number of precomputed points depends on the curve size:
             * 2^(𝑊−1) * (Math.ceil(𝑛 / 𝑊) + 1), where:
             * - 𝑊 is the window size
             * - 𝑛 is the bitlength of the curve order.
             * For a 256-bit curve and window size 8, the number of precomputed points is 128 * 33 = 4224.
             * @returns precomputed point tables flattened to a single array
             */
            precomputeWindow(elm, W) {
                const { windows, windowSize } = opts(W);
                const points = [];
                let p = elm;
                let base = p;
                for (let window = 0; window < windows; window++) {
                    base = p;
                    points.push(base);
                    // =1, because we skip zero
                    for (let i = 1; i < windowSize; i++) {
                        base = base.add(p);
                        points.push(base);
                    }
                    p = base.double();
                }
                return points;
            },
            /**
             * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
             * @param W window size
             * @param precomputes precomputed tables
             * @param n scalar (we don't check here, but should be less than curve order)
             * @returns real and fake (for const-time) points
             */
            wNAF(W, precomputes, n) {
                // TODO: maybe check that scalar is less than group order? wNAF behavious is undefined otherwise
                // But need to carefully remove other checks before wNAF. ORDER == bits here
                const { windows, windowSize } = opts(W);
                let p = c.ZERO;
                let f = c.BASE;
                const mask = BigInt(2 ** W - 1); // Create mask with W ones: 0b1111 for W=4 etc.
                const maxNumber = 2 ** W;
                const shiftBy = BigInt(W);
                for (let window = 0; window < windows; window++) {
                    const offset = window * windowSize;
                    // Extract W bits.
                    let wbits = Number(n & mask);
                    // Shift number by W bits.
                    n >>= shiftBy;
                    // If the bits are bigger than max size, we'll split those.
                    // +224 => 256 - 32
                    if (wbits > windowSize) {
                        wbits -= maxNumber;
                        n += _1n;
                    }
                    // This code was first written with assumption that 'f' and 'p' will never be infinity point:
                    // since each addition is multiplied by 2 ** W, it cannot cancel each other. However,
                    // there is negate now: it is possible that negated element from low value
                    // would be the same as high element, which will create carry into next window.
                    // It's not obvious how this can fail, but still worth investigating later.
                    // Check if we're onto Zero point.
                    // Add random point inside current window to f.
                    const offset1 = offset;
                    const offset2 = offset + Math.abs(wbits) - 1; // -1 because we skip zero
                    const cond1 = window % 2 !== 0;
                    const cond2 = wbits < 0;
                    if (wbits === 0) {
                        // The most important part for const-time getPublicKey
                        f = f.add(constTimeNegate(cond1, precomputes[offset1]));
                    }
                    else {
                        p = p.add(constTimeNegate(cond2, precomputes[offset2]));
                    }
                }
                // JIT-compiler should not eliminate f here, since it will later be used in normalizeZ()
                // Even if the variable is still unused, there are some checks which will
                // throw an exception, so compiler needs to prove they won't happen, which is hard.
                // At this point there is a way to F be infinity-point even if p is not,
                // which makes it less const-time: around 1 bigint multiply.
                return { p, f };
            },
            wNAFCached(P, precomputesMap, n, transform) {
                // @ts-ignore
                const W = P._WINDOW_SIZE || 1;
                // Calculate precomputes on a first run, reuse them after
                let comp = precomputesMap.get(P);
                if (!comp) {
                    comp = this.precomputeWindow(P, W);
                    if (W !== 1) {
                        precomputesMap.set(P, transform(comp));
                    }
                }
                return this.wNAF(W, comp, n);
            },
        };
    }
    exports.wNAF = wNAF;
    function validateBasic(curve) {
        (0, modular_1.validateField)(curve.Fp);
        (0, utils_4.validateObject)(curve, {
            n: 'bigint',
            h: 'bigint',
            Gx: 'field',
            Gy: 'field',
        }, {
            nBitLength: 'isSafeInteger',
            nByteLength: 'isSafeInteger',
        });
        // Set defaults
        return Object.freeze({
            ...(0, modular_1.nLength)(curve.n, curve.nBitLength),
            ...curve,
            ...{ p: curve.Fp.ORDER },
        });
    }
    exports.validateBasic = validateBasic;
});
define("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts", ["require", "exports", "@scom/scom-social-sdk/core/curves/abstract/modular.ts", "@scom/scom-social-sdk/core/curves/abstract/utils.ts", "@scom/scom-social-sdk/core/curves/abstract/utils.ts", "@scom/scom-social-sdk/core/curves/abstract/curve.ts"], function (require, exports, mod, ut, utils_5, curve_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.mapToCurveSimpleSWU = exports.SWUFpSqrtRatio = exports.weierstrass = exports.weierstrassPoints = exports.DER = void 0;
    function validatePointOpts(curve) {
        const opts = (0, curve_1.validateBasic)(curve);
        ut.validateObject(opts, {
            a: 'field',
            b: 'field',
        }, {
            allowedPrivateKeyLengths: 'array',
            wrapPrivateKey: 'boolean',
            isTorsionFree: 'function',
            clearCofactor: 'function',
            allowInfinityPoint: 'boolean',
            fromBytes: 'function',
            toBytes: 'function',
        });
        const { endo, Fp, a } = opts;
        if (endo) {
            if (!Fp.eql(a, Fp.ZERO)) {
                throw new Error('Endomorphism can only be defined for Koblitz curves that have a=0');
            }
            if (typeof endo !== 'object' ||
                typeof endo.beta !== 'bigint' ||
                typeof endo.splitScalar !== 'function') {
                throw new Error('Expected endomorphism with beta: bigint and splitScalar: function');
            }
        }
        return Object.freeze({ ...opts });
    }
    // ASN.1 DER encoding utilities
    const { bytesToNumberBE: b2n, hexToBytes: h2b } = ut;
    exports.DER = {
        // asn.1 DER encoding utils
        Err: class DERErr extends Error {
            constructor(m = '') {
                super(m);
            }
        },
        _parseInt(data) {
            const { Err: E } = exports.DER;
            if (data.length < 2 || data[0] !== 0x02)
                throw new E('Invalid signature integer tag');
            const len = data[1];
            const res = data.subarray(2, len + 2);
            if (!len || res.length !== len)
                throw new E('Invalid signature integer: wrong length');
            // https://crypto.stackexchange.com/a/57734 Leftmost bit of first byte is 'negative' flag,
            // since we always use positive integers here. It must always be empty:
            // - add zero byte if exists
            // - if next byte doesn't have a flag, leading zero is not allowed (minimal encoding)
            if (res[0] & 0b10000000)
                throw new E('Invalid signature integer: negative');
            if (res[0] === 0x00 && !(res[1] & 0b10000000))
                throw new E('Invalid signature integer: unnecessary leading zero');
            return { d: b2n(res), l: data.subarray(len + 2) }; // d is data, l is left
        },
        toSig(hex) {
            // parse DER signature
            const { Err: E } = exports.DER;
            const data = typeof hex === 'string' ? h2b(hex) : hex;
            if (!(data instanceof Uint8Array))
                throw new Error('ui8a expected');
            let l = data.length;
            if (l < 2 || data[0] != 0x30)
                throw new E('Invalid signature tag');
            if (data[1] !== l - 2)
                throw new E('Invalid signature: incorrect length');
            const { d: r, l: sBytes } = exports.DER._parseInt(data.subarray(2));
            const { d: s, l: rBytesLeft } = exports.DER._parseInt(sBytes);
            if (rBytesLeft.length)
                throw new E('Invalid signature: left bytes after parsing');
            return { r, s };
        },
        hexFromSig(sig) {
            // Add leading zero if first byte has negative bit enabled. More details in '_parseInt'
            const slice = (s) => (Number.parseInt(s[0], 16) & 0b1000 ? '00' + s : s);
            const h = (num) => {
                const hex = num.toString(16);
                return hex.length & 1 ? `0${hex}` : hex;
            };
            const s = slice(h(sig.s));
            const r = slice(h(sig.r));
            const shl = s.length / 2;
            const rhl = r.length / 2;
            const sl = h(shl);
            const rl = h(rhl);
            return `30${h(rhl + shl + 4)}02${rl}${r}02${sl}${s}`;
        },
    };
    // Be friendly to bad ECMAScript parsers by not using bigint literals
    // prettier-ignore
    const _0n = BigInt(0), _1n = BigInt(1), _2n = BigInt(2), _3n = BigInt(3), _4n = BigInt(4);
    function weierstrassPoints(opts) {
        const CURVE = validatePointOpts(opts);
        const { Fp } = CURVE; // All curves has same field / group length as for now, but they can differ
        const toBytes = CURVE.toBytes ||
            ((_c, point, _isCompressed) => {
                const a = point.toAffine();
                return ut.concatBytes(Uint8Array.from([0x04]), Fp.toBytes(a.x), Fp.toBytes(a.y));
            });
        const fromBytes = CURVE.fromBytes ||
            ((bytes) => {
                // const head = bytes[0];
                const tail = bytes.subarray(1);
                // if (head !== 0x04) throw new Error('Only non-compressed encoding is supported');
                const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                return { x, y };
            });
        /**
         * y² = x³ + ax + b: Short weierstrass curve formula
         * @returns y²
         */
        function weierstrassEquation(x) {
            const { a, b } = CURVE;
            const x2 = Fp.sqr(x); // x * x
            const x3 = Fp.mul(x2, x); // x2 * x
            return Fp.add(Fp.add(x3, Fp.mul(x, a)), b); // x3 + a * x + b
        }
        // Validate whether the passed curve params are valid.
        // We check if curve equation works for generator point.
        // `assertValidity()` won't work: `isTorsionFree()` is not available at this point in bls12-381.
        // ProjectivePoint class has not been initialized yet.
        if (!Fp.eql(Fp.sqr(CURVE.Gy), weierstrassEquation(CURVE.Gx)))
            throw new Error('bad generator point: equation left != right');
        // Valid group elements reside in range 1..n-1
        function isWithinCurveOrder(num) {
            return typeof num === 'bigint' && _0n < num && num < CURVE.n;
        }
        function assertGE(num) {
            if (!isWithinCurveOrder(num))
                throw new Error('Expected valid bigint: 0 < bigint < curve.n');
        }
        // Validates if priv key is valid and converts it to bigint.
        // Supports options allowedPrivateKeyLengths and wrapPrivateKey.
        function normPrivateKeyToScalar(key) {
            const { allowedPrivateKeyLengths: lengths, nByteLength, wrapPrivateKey, n } = CURVE;
            if (lengths && typeof key !== 'bigint') {
                if (key instanceof Uint8Array)
                    key = ut.bytesToHex(key);
                // Normalize to hex string, pad. E.g. P521 would norm 130-132 char hex to 132-char bytes
                if (typeof key !== 'string' || !lengths.includes(key.length))
                    throw new Error('Invalid key');
                key = key.padStart(nByteLength * 2, '0');
            }
            let num;
            try {
                num =
                    typeof key === 'bigint'
                        ? key
                        : ut.bytesToNumberBE((0, utils_5.ensureBytes)('private key', key, nByteLength));
            }
            catch (error) {
                throw new Error(`private key must be ${nByteLength} bytes, hex or bigint, not ${typeof key}`);
            }
            if (wrapPrivateKey)
                num = mod.mod(num, n); // disabled by default, enabled for BLS
            assertGE(num); // num in range [1..N-1]
            return num;
        }
        const pointPrecomputes = new Map();
        function assertPrjPoint(other) {
            if (!(other instanceof Point))
                throw new Error('ProjectivePoint expected');
        }
        /**
         * Projective Point works in 3d / projective (homogeneous) coordinates: (x, y, z) ∋ (x=x/z, y=y/z)
         * Default Point works in 2d / affine coordinates: (x, y)
         * We're doing calculations in projective, because its operations don't require costly inversion.
         */
        class Point {
            constructor(px, py, pz) {
                this.px = px;
                this.py = py;
                this.pz = pz;
                if (px == null || !Fp.isValid(px))
                    throw new Error('x required');
                if (py == null || !Fp.isValid(py))
                    throw new Error('y required');
                if (pz == null || !Fp.isValid(pz))
                    throw new Error('z required');
            }
            // Does not validate if the point is on-curve.
            // Use fromHex instead, or call assertValidity() later.
            static fromAffine(p) {
                const { x, y } = p || {};
                if (!p || !Fp.isValid(x) || !Fp.isValid(y))
                    throw new Error('invalid affine point');
                if (p instanceof Point)
                    throw new Error('projective point not allowed');
                const is0 = (i) => Fp.eql(i, Fp.ZERO);
                // fromAffine(x:0, y:0) would produce (x:0, y:0, z:1), but we need (x:0, y:1, z:0)
                if (is0(x) && is0(y))
                    return Point.ZERO;
                return new Point(x, y, Fp.ONE);
            }
            get x() {
                return this.toAffine().x;
            }
            get y() {
                return this.toAffine().y;
            }
            /**
             * Takes a bunch of Projective Points but executes only one
             * inversion on all of them. Inversion is very slow operation,
             * so this improves performance massively.
             * Optimization: converts a list of projective points to a list of identical points with Z=1.
             */
            static normalizeZ(points) {
                const toInv = Fp.invertBatch(points.map((p) => p.pz));
                return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
            }
            /**
             * Converts hash string or Uint8Array to Point.
             * @param hex short/long ECDSA hex
             */
            static fromHex(hex) {
                const P = Point.fromAffine(fromBytes((0, utils_5.ensureBytes)('pointHex', hex)));
                P.assertValidity();
                return P;
            }
            // Multiplies generator point by privateKey.
            static fromPrivateKey(privateKey) {
                return Point.BASE.multiply(normPrivateKeyToScalar(privateKey));
            }
            // "Private method", don't use it directly
            _setWindowSize(windowSize) {
                this._WINDOW_SIZE = windowSize;
                pointPrecomputes.delete(this);
            }
            // A point on curve is valid if it conforms to equation.
            assertValidity() {
                if (this.is0()) {
                    // (0, 1, 0) aka ZERO is invalid in most contexts.
                    // In BLS, ZERO can be serialized, so we allow it.
                    // (0, 0, 0) is wrong representation of ZERO and is always invalid.
                    if (CURVE.allowInfinityPoint && !Fp.is0(this.py))
                        return;
                    throw new Error('bad point: ZERO');
                }
                // Some 3rd-party test vectors require different wording between here & `fromCompressedHex`
                const { x, y } = this.toAffine();
                // Check if x, y are valid field elements
                if (!Fp.isValid(x) || !Fp.isValid(y))
                    throw new Error('bad point: x or y not FE');
                const left = Fp.sqr(y); // y²
                const right = weierstrassEquation(x); // x³ + ax + b
                if (!Fp.eql(left, right))
                    throw new Error('bad point: equation left != right');
                if (!this.isTorsionFree())
                    throw new Error('bad point: not in prime-order subgroup');
            }
            hasEvenY() {
                const { y } = this.toAffine();
                if (Fp.isOdd)
                    return !Fp.isOdd(y);
                throw new Error("Field doesn't support isOdd");
            }
            /**
             * Compare one point to another.
             */
            equals(other) {
                assertPrjPoint(other);
                const { px: X1, py: Y1, pz: Z1 } = this;
                const { px: X2, py: Y2, pz: Z2 } = other;
                const U1 = Fp.eql(Fp.mul(X1, Z2), Fp.mul(X2, Z1));
                const U2 = Fp.eql(Fp.mul(Y1, Z2), Fp.mul(Y2, Z1));
                return U1 && U2;
            }
            /**
             * Flips point to one corresponding to (x, -y) in Affine coordinates.
             */
            negate() {
                return new Point(this.px, Fp.neg(this.py), this.pz);
            }
            // Renes-Costello-Batina exception-free doubling formula.
            // There is 30% faster Jacobian formula, but it is not complete.
            // https://eprint.iacr.org/2015/1060, algorithm 3
            // Cost: 8M + 3S + 3*a + 2*b3 + 15add.
            double() {
                const { a, b } = CURVE;
                const b3 = Fp.mul(b, _3n);
                const { px: X1, py: Y1, pz: Z1 } = this;
                let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
                let t0 = Fp.mul(X1, X1); // step 1
                let t1 = Fp.mul(Y1, Y1);
                let t2 = Fp.mul(Z1, Z1);
                let t3 = Fp.mul(X1, Y1);
                t3 = Fp.add(t3, t3); // step 5
                Z3 = Fp.mul(X1, Z1);
                Z3 = Fp.add(Z3, Z3);
                X3 = Fp.mul(a, Z3);
                Y3 = Fp.mul(b3, t2);
                Y3 = Fp.add(X3, Y3); // step 10
                X3 = Fp.sub(t1, Y3);
                Y3 = Fp.add(t1, Y3);
                Y3 = Fp.mul(X3, Y3);
                X3 = Fp.mul(t3, X3);
                Z3 = Fp.mul(b3, Z3); // step 15
                t2 = Fp.mul(a, t2);
                t3 = Fp.sub(t0, t2);
                t3 = Fp.mul(a, t3);
                t3 = Fp.add(t3, Z3);
                Z3 = Fp.add(t0, t0); // step 20
                t0 = Fp.add(Z3, t0);
                t0 = Fp.add(t0, t2);
                t0 = Fp.mul(t0, t3);
                Y3 = Fp.add(Y3, t0);
                t2 = Fp.mul(Y1, Z1); // step 25
                t2 = Fp.add(t2, t2);
                t0 = Fp.mul(t2, t3);
                X3 = Fp.sub(X3, t0);
                Z3 = Fp.mul(t2, t1);
                Z3 = Fp.add(Z3, Z3); // step 30
                Z3 = Fp.add(Z3, Z3);
                return new Point(X3, Y3, Z3);
            }
            // Renes-Costello-Batina exception-free addition formula.
            // There is 30% faster Jacobian formula, but it is not complete.
            // https://eprint.iacr.org/2015/1060, algorithm 1
            // Cost: 12M + 0S + 3*a + 3*b3 + 23add.
            add(other) {
                assertPrjPoint(other);
                const { px: X1, py: Y1, pz: Z1 } = this;
                const { px: X2, py: Y2, pz: Z2 } = other;
                let X3 = Fp.ZERO, Y3 = Fp.ZERO, Z3 = Fp.ZERO; // prettier-ignore
                const a = CURVE.a;
                const b3 = Fp.mul(CURVE.b, _3n);
                let t0 = Fp.mul(X1, X2); // step 1
                let t1 = Fp.mul(Y1, Y2);
                let t2 = Fp.mul(Z1, Z2);
                let t3 = Fp.add(X1, Y1);
                let t4 = Fp.add(X2, Y2); // step 5
                t3 = Fp.mul(t3, t4);
                t4 = Fp.add(t0, t1);
                t3 = Fp.sub(t3, t4);
                t4 = Fp.add(X1, Z1);
                let t5 = Fp.add(X2, Z2); // step 10
                t4 = Fp.mul(t4, t5);
                t5 = Fp.add(t0, t2);
                t4 = Fp.sub(t4, t5);
                t5 = Fp.add(Y1, Z1);
                X3 = Fp.add(Y2, Z2); // step 15
                t5 = Fp.mul(t5, X3);
                X3 = Fp.add(t1, t2);
                t5 = Fp.sub(t5, X3);
                Z3 = Fp.mul(a, t4);
                X3 = Fp.mul(b3, t2); // step 20
                Z3 = Fp.add(X3, Z3);
                X3 = Fp.sub(t1, Z3);
                Z3 = Fp.add(t1, Z3);
                Y3 = Fp.mul(X3, Z3);
                t1 = Fp.add(t0, t0); // step 25
                t1 = Fp.add(t1, t0);
                t2 = Fp.mul(a, t2);
                t4 = Fp.mul(b3, t4);
                t1 = Fp.add(t1, t2);
                t2 = Fp.sub(t0, t2); // step 30
                t2 = Fp.mul(a, t2);
                t4 = Fp.add(t4, t2);
                t0 = Fp.mul(t1, t4);
                Y3 = Fp.add(Y3, t0);
                t0 = Fp.mul(t5, t4); // step 35
                X3 = Fp.mul(t3, X3);
                X3 = Fp.sub(X3, t0);
                t0 = Fp.mul(t3, t1);
                Z3 = Fp.mul(t5, Z3);
                Z3 = Fp.add(Z3, t0); // step 40
                return new Point(X3, Y3, Z3);
            }
            subtract(other) {
                return this.add(other.negate());
            }
            is0() {
                return this.equals(Point.ZERO);
            }
            wNAF(n) {
                return wnaf.wNAFCached(this, pointPrecomputes, n, (comp) => {
                    const toInv = Fp.invertBatch(comp.map((p) => p.pz));
                    return comp.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
                });
            }
            /**
             * Non-constant-time multiplication. Uses double-and-add algorithm.
             * It's faster, but should only be used when you don't care about
             * an exposed private key e.g. sig verification, which works over *public* keys.
             */
            multiplyUnsafe(n) {
                const I = Point.ZERO;
                if (n === _0n)
                    return I;
                assertGE(n); // Will throw on 0
                if (n === _1n)
                    return this;
                const { endo } = CURVE;
                if (!endo)
                    return wnaf.unsafeLadder(this, n);
                // Apply endomorphism
                let { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
                let k1p = I;
                let k2p = I;
                let d = this;
                while (k1 > _0n || k2 > _0n) {
                    if (k1 & _1n)
                        k1p = k1p.add(d);
                    if (k2 & _1n)
                        k2p = k2p.add(d);
                    d = d.double();
                    k1 >>= _1n;
                    k2 >>= _1n;
                }
                if (k1neg)
                    k1p = k1p.negate();
                if (k2neg)
                    k2p = k2p.negate();
                k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                return k1p.add(k2p);
            }
            /**
             * Constant time multiplication.
             * Uses wNAF method. Windowed method may be 10% faster,
             * but takes 2x longer to generate and consumes 2x memory.
             * Uses precomputes when available.
             * Uses endomorphism for Koblitz curves.
             * @param scalar by which the point would be multiplied
             * @returns New point
             */
            multiply(scalar) {
                assertGE(scalar);
                let n = scalar;
                let point, fake; // Fake point is used to const-time mult
                const { endo } = CURVE;
                if (endo) {
                    const { k1neg, k1, k2neg, k2 } = endo.splitScalar(n);
                    let { p: k1p, f: f1p } = this.wNAF(k1);
                    let { p: k2p, f: f2p } = this.wNAF(k2);
                    k1p = wnaf.constTimeNegate(k1neg, k1p);
                    k2p = wnaf.constTimeNegate(k2neg, k2p);
                    k2p = new Point(Fp.mul(k2p.px, endo.beta), k2p.py, k2p.pz);
                    point = k1p.add(k2p);
                    fake = f1p.add(f2p);
                }
                else {
                    const { p, f } = this.wNAF(n);
                    point = p;
                    fake = f;
                }
                // Normalize `z` for both points, but return only real one
                return Point.normalizeZ([point, fake])[0];
            }
            /**
             * Efficiently calculate `aP + bQ`. Unsafe, can expose private key, if used incorrectly.
             * Not using Strauss-Shamir trick: precomputation tables are faster.
             * The trick could be useful if both P and Q are not G (not in our case).
             * @returns non-zero affine point
             */
            multiplyAndAddUnsafe(Q, a, b) {
                const G = Point.BASE; // No Strauss-Shamir trick: we have 10% faster G precomputes
                const mul = (P, a // Select faster multiply() method
                ) => (a === _0n || a === _1n || !P.equals(G) ? P.multiplyUnsafe(a) : P.multiply(a));
                const sum = mul(this, a).add(mul(Q, b));
                return sum.is0() ? undefined : sum;
            }
            // Converts Projective point to affine (x, y) coordinates.
            // Can accept precomputed Z^-1 - for example, from invertBatch.
            // (x, y, z) ∋ (x=x/z, y=y/z)
            toAffine(iz) {
                const { px: x, py: y, pz: z } = this;
                const is0 = this.is0();
                // If invZ was 0, we return zero point. However we still want to execute
                // all operations, so we replace invZ with a random number, 1.
                if (iz == null)
                    iz = is0 ? Fp.ONE : Fp.inv(z);
                const ax = Fp.mul(x, iz);
                const ay = Fp.mul(y, iz);
                const zz = Fp.mul(z, iz);
                if (is0)
                    return { x: Fp.ZERO, y: Fp.ZERO };
                if (!Fp.eql(zz, Fp.ONE))
                    throw new Error('invZ was invalid');
                return { x: ax, y: ay };
            }
            isTorsionFree() {
                const { h: cofactor, isTorsionFree } = CURVE;
                if (cofactor === _1n)
                    return true; // No subgroups, always torsion-free
                if (isTorsionFree)
                    return isTorsionFree(Point, this);
                throw new Error('isTorsionFree() has not been declared for the elliptic curve');
            }
            clearCofactor() {
                const { h: cofactor, clearCofactor } = CURVE;
                if (cofactor === _1n)
                    return this; // Fast-path
                if (clearCofactor)
                    return clearCofactor(Point, this);
                return this.multiplyUnsafe(CURVE.h);
            }
            toRawBytes(isCompressed = true) {
                this.assertValidity();
                return toBytes(Point, this, isCompressed);
            }
            toHex(isCompressed = true) {
                return ut.bytesToHex(this.toRawBytes(isCompressed));
            }
        }
        Point.BASE = new Point(CURVE.Gx, CURVE.Gy, Fp.ONE);
        Point.ZERO = new Point(Fp.ZERO, Fp.ONE, Fp.ZERO);
        const _bits = CURVE.nBitLength;
        const wnaf = (0, curve_1.wNAF)(Point, CURVE.endo ? Math.ceil(_bits / 2) : _bits);
        // Validate if generator point is on curve
        return {
            CURVE,
            ProjectivePoint: Point,
            normPrivateKeyToScalar,
            weierstrassEquation,
            isWithinCurveOrder,
        };
    }
    exports.weierstrassPoints = weierstrassPoints;
    function validateOpts(curve) {
        const opts = (0, curve_1.validateBasic)(curve);
        ut.validateObject(opts, {
            hash: 'hash',
            hmac: 'function',
            randomBytes: 'function',
        }, {
            bits2int: 'function',
            bits2int_modN: 'function',
            lowS: 'boolean',
        });
        return Object.freeze({ lowS: true, ...opts });
    }
    function weierstrass(curveDef) {
        const CURVE = validateOpts(curveDef);
        const { Fp, n: CURVE_ORDER } = CURVE;
        const compressedLen = Fp.BYTES + 1; // e.g. 33 for 32
        const uncompressedLen = 2 * Fp.BYTES + 1; // e.g. 65 for 32
        function isValidFieldElement(num) {
            return _0n < num && num < Fp.ORDER; // 0 is banned since it's not invertible FE
        }
        function modN(a) {
            return mod.mod(a, CURVE_ORDER);
        }
        function invN(a) {
            return mod.invert(a, CURVE_ORDER);
        }
        const { ProjectivePoint: Point, normPrivateKeyToScalar, weierstrassEquation, isWithinCurveOrder, } = weierstrassPoints({
            ...CURVE,
            toBytes(_c, point, isCompressed) {
                const a = point.toAffine();
                const x = Fp.toBytes(a.x);
                const cat = ut.concatBytes;
                if (isCompressed) {
                    return cat(Uint8Array.from([point.hasEvenY() ? 0x02 : 0x03]), x);
                }
                else {
                    return cat(Uint8Array.from([0x04]), x, Fp.toBytes(a.y));
                }
            },
            fromBytes(bytes) {
                const len = bytes.length;
                const head = bytes[0];
                const tail = bytes.subarray(1);
                // this.assertValidity() is done inside of fromHex
                if (len === compressedLen && (head === 0x02 || head === 0x03)) {
                    const x = ut.bytesToNumberBE(tail);
                    if (!isValidFieldElement(x))
                        throw new Error('Point is not on curve');
                    const y2 = weierstrassEquation(x); // y² = x³ + ax + b
                    let y = Fp.sqrt(y2); // y = y² ^ (p+1)/4
                    const isYOdd = (y & _1n) === _1n;
                    // ECDSA
                    const isHeadOdd = (head & 1) === 1;
                    if (isHeadOdd !== isYOdd)
                        y = Fp.neg(y);
                    return { x, y };
                }
                else if (len === uncompressedLen && head === 0x04) {
                    const x = Fp.fromBytes(tail.subarray(0, Fp.BYTES));
                    const y = Fp.fromBytes(tail.subarray(Fp.BYTES, 2 * Fp.BYTES));
                    return { x, y };
                }
                else {
                    throw new Error(`Point of length ${len} was invalid. Expected ${compressedLen} compressed bytes or ${uncompressedLen} uncompressed bytes`);
                }
            },
        });
        const numToNByteStr = (num) => ut.bytesToHex(ut.numberToBytesBE(num, CURVE.nByteLength));
        function isBiggerThanHalfOrder(number) {
            const HALF = CURVE_ORDER >> _1n;
            return number > HALF;
        }
        function normalizeS(s) {
            return isBiggerThanHalfOrder(s) ? modN(-s) : s;
        }
        // slice bytes num
        const slcNum = (b, from, to) => ut.bytesToNumberBE(b.slice(from, to));
        /**
         * ECDSA signature with its (r, s) properties. Supports DER & compact representations.
         */
        class Signature {
            constructor(r, s, recovery) {
                this.r = r;
                this.s = s;
                this.recovery = recovery;
                this.assertValidity();
            }
            // pair (bytes of r, bytes of s)
            static fromCompact(hex) {
                const l = CURVE.nByteLength;
                hex = (0, utils_5.ensureBytes)('compactSignature', hex, l * 2);
                return new Signature(slcNum(hex, 0, l), slcNum(hex, l, 2 * l));
            }
            // DER encoded ECDSA signature
            // https://bitcoin.stackexchange.com/questions/57644/what-are-the-parts-of-a-bitcoin-transaction-input-script
            static fromDER(hex) {
                const { r, s } = exports.DER.toSig((0, utils_5.ensureBytes)('DER', hex));
                return new Signature(r, s);
            }
            assertValidity() {
                // can use assertGE here
                if (!isWithinCurveOrder(this.r))
                    throw new Error('r must be 0 < r < CURVE.n');
                if (!isWithinCurveOrder(this.s))
                    throw new Error('s must be 0 < s < CURVE.n');
            }
            addRecoveryBit(recovery) {
                return new Signature(this.r, this.s, recovery);
            }
            recoverPublicKey(msgHash) {
                const { r, s, recovery: rec } = this;
                const h = bits2int_modN((0, utils_5.ensureBytes)('msgHash', msgHash)); // Truncate hash
                if (rec == null || ![0, 1, 2, 3].includes(rec))
                    throw new Error('recovery id invalid');
                const radj = rec === 2 || rec === 3 ? r + CURVE.n : r;
                if (radj >= Fp.ORDER)
                    throw new Error('recovery id 2 or 3 invalid');
                const prefix = (rec & 1) === 0 ? '02' : '03';
                const R = Point.fromHex(prefix + numToNByteStr(radj));
                const ir = invN(radj); // r^-1
                const u1 = modN(-h * ir); // -hr^-1
                const u2 = modN(s * ir); // sr^-1
                const Q = Point.BASE.multiplyAndAddUnsafe(R, u1, u2); // (sr^-1)R-(hr^-1)G = -(hr^-1)G + (sr^-1)
                if (!Q)
                    throw new Error('point at infinify'); // unsafe is fine: no priv data leaked
                Q.assertValidity();
                return Q;
            }
            // Signatures should be low-s, to prevent malleability.
            hasHighS() {
                return isBiggerThanHalfOrder(this.s);
            }
            normalizeS() {
                return this.hasHighS() ? new Signature(this.r, modN(-this.s), this.recovery) : this;
            }
            // DER-encoded
            toDERRawBytes() {
                return ut.hexToBytes(this.toDERHex());
            }
            toDERHex() {
                return exports.DER.hexFromSig({ r: this.r, s: this.s });
            }
            // padded bytes of r, then padded bytes of s
            toCompactRawBytes() {
                return ut.hexToBytes(this.toCompactHex());
            }
            toCompactHex() {
                return numToNByteStr(this.r) + numToNByteStr(this.s);
            }
        }
        const utils = {
            isValidPrivateKey(privateKey) {
                try {
                    normPrivateKeyToScalar(privateKey);
                    return true;
                }
                catch (error) {
                    return false;
                }
            },
            normPrivateKeyToScalar: normPrivateKeyToScalar,
            /**
             * Produces cryptographically secure private key from random of size
             * (groupLen + ceil(groupLen / 2)) with modulo bias being negligible.
             */
            randomPrivateKey: () => {
                const length = mod.getMinHashLength(CURVE.n);
                return mod.mapHashToField(CURVE.randomBytes(length), CURVE.n);
            },
            /**
             * Creates precompute table for an arbitrary EC point. Makes point "cached".
             * Allows to massively speed-up `point.multiply(scalar)`.
             * @returns cached point
             * @example
             * const fast = utils.precompute(8, ProjectivePoint.fromHex(someonesPubKey));
             * fast.multiply(privKey); // much faster ECDH now
             */
            precompute(windowSize = 8, point = Point.BASE) {
                point._setWindowSize(windowSize);
                point.multiply(BigInt(3)); // 3 is arbitrary, just need any number here
                return point;
            },
        };
        /**
         * Computes public key for a private key. Checks for validity of the private key.
         * @param privateKey private key
         * @param isCompressed whether to return compact (default), or full key
         * @returns Public key, full when isCompressed=false; short when isCompressed=true
         */
        function getPublicKey(privateKey, isCompressed = true) {
            return Point.fromPrivateKey(privateKey).toRawBytes(isCompressed);
        }
        /**
         * Quick and dirty check for item being public key. Does not validate hex, or being on-curve.
         */
        function isProbPub(item) {
            const arr = item instanceof Uint8Array;
            const str = typeof item === 'string';
            const len = (arr || str) && item.length;
            if (arr)
                return len === compressedLen || len === uncompressedLen;
            if (str)
                return len === 2 * compressedLen || len === 2 * uncompressedLen;
            if (item instanceof Point)
                return true;
            return false;
        }
        /**
         * ECDH (Elliptic Curve Diffie Hellman).
         * Computes shared public key from private key and public key.
         * Checks: 1) private key validity 2) shared key is on-curve.
         * Does NOT hash the result.
         * @param privateA private key
         * @param publicB different public key
         * @param isCompressed whether to return compact (default), or full key
         * @returns shared public key
         */
        function getSharedSecret(privateA, publicB, isCompressed = true) {
            if (isProbPub(privateA))
                throw new Error('first arg must be private key');
            if (!isProbPub(publicB))
                throw new Error('second arg must be public key');
            const b = Point.fromHex(publicB); // check for being on-curve
            return b.multiply(normPrivateKeyToScalar(privateA)).toRawBytes(isCompressed);
        }
        // RFC6979: ensure ECDSA msg is X bytes and < N. RFC suggests optional truncating via bits2octets.
        // FIPS 186-4 4.6 suggests the leftmost min(nBitLen, outLen) bits, which matches bits2int.
        // bits2int can produce res>N, we can do mod(res, N) since the bitLen is the same.
        // int2octets can't be used; pads small msgs with 0: unacceptatble for trunc as per RFC vectors
        const bits2int = CURVE.bits2int ||
            function (bytes) {
                // For curves with nBitLength % 8 !== 0: bits2octets(bits2octets(m)) !== bits2octets(m)
                // for some cases, since bytes.length * 8 is not actual bitLength.
                const num = ut.bytesToNumberBE(bytes); // check for == u8 done here
                const delta = bytes.length * 8 - CURVE.nBitLength; // truncate to nBitLength leftmost bits
                return delta > 0 ? num >> BigInt(delta) : num;
            };
        const bits2int_modN = CURVE.bits2int_modN ||
            function (bytes) {
                return modN(bits2int(bytes)); // can't use bytesToNumberBE here
            };
        // NOTE: pads output with zero as per spec
        const ORDER_MASK = ut.bitMask(CURVE.nBitLength);
        /**
         * Converts to bytes. Checks if num in `[0..ORDER_MASK-1]` e.g.: `[0..2^256-1]`.
         */
        function int2octets(num) {
            if (typeof num !== 'bigint')
                throw new Error('bigint expected');
            if (!(_0n <= num && num < ORDER_MASK))
                throw new Error(`bigint expected < 2^${CURVE.nBitLength}`);
            // works with order, can have different size than numToField!
            return ut.numberToBytesBE(num, CURVE.nByteLength);
        }
        // Steps A, D of RFC6979 3.2
        // Creates RFC6979 seed; converts msg/privKey to numbers.
        // Used only in sign, not in verify.
        // NOTE: we cannot assume here that msgHash has same amount of bytes as curve order, this will be wrong at least for P521.
        // Also it can be bigger for P224 + SHA256
        function prepSig(msgHash, privateKey, opts = defaultSigOpts) {
            if (['recovered', 'canonical'].some((k) => k in opts))
                throw new Error('sign() legacy options not supported');
            const { hash, randomBytes } = CURVE;
            let { lowS, prehash, extraEntropy: ent } = opts; // generates low-s sigs by default
            if (lowS == null)
                lowS = true; // RFC6979 3.2: we skip step A, because we already provide hash
            msgHash = (0, utils_5.ensureBytes)('msgHash', msgHash);
            if (prehash)
                msgHash = (0, utils_5.ensureBytes)('prehashed msgHash', hash(msgHash));
            // We can't later call bits2octets, since nested bits2int is broken for curves
            // with nBitLength % 8 !== 0. Because of that, we unwrap it here as int2octets call.
            // const bits2octets = (bits) => int2octets(bits2int_modN(bits))
            const h1int = bits2int_modN(msgHash);
            const d = normPrivateKeyToScalar(privateKey); // validate private key, convert to bigint
            const seedArgs = [int2octets(d), int2octets(h1int)];
            // extraEntropy. RFC6979 3.6: additional k' (optional).
            if (ent != null) {
                // K = HMAC_K(V || 0x00 || int2octets(x) || bits2octets(h1) || k')
                const e = ent === true ? randomBytes(Fp.BYTES) : ent; // generate random bytes OR pass as-is
                seedArgs.push((0, utils_5.ensureBytes)('extraEntropy', e)); // check for being bytes
            }
            const seed = ut.concatBytes(...seedArgs); // Step D of RFC6979 3.2
            const m = h1int; // NOTE: no need to call bits2int second time here, it is inside truncateHash!
            // Converts signature params into point w r/s, checks result for validity.
            function k2sig(kBytes) {
                // RFC 6979 Section 3.2, step 3: k = bits2int(T)
                const k = bits2int(kBytes); // Cannot use fields methods, since it is group element
                if (!isWithinCurveOrder(k))
                    return; // Important: all mod() calls here must be done over N
                const ik = invN(k); // k^-1 mod n
                const q = Point.BASE.multiply(k).toAffine(); // q = Gk
                const r = modN(q.x); // r = q.x mod n
                if (r === _0n)
                    return;
                // Can use scalar blinding b^-1(bm + bdr) where b ∈ [1,q−1] according to
                // https://tches.iacr.org/index.php/TCHES/article/view/7337/6509. We've decided against it:
                // a) dependency on CSPRNG b) 15% slowdown c) doesn't really help since bigints are not CT
                const s = modN(ik * modN(m + r * d)); // Not using blinding here
                if (s === _0n)
                    return;
                let recovery = (q.x === r ? 0 : 2) | Number(q.y & _1n); // recovery bit (2 or 3, when q.x > n)
                let normS = s;
                if (lowS && isBiggerThanHalfOrder(s)) {
                    normS = normalizeS(s); // if lowS was passed, ensure s is always
                    recovery ^= 1; // // in the bottom half of N
                }
                return new Signature(r, normS, recovery); // use normS, not s
            }
            return { seed, k2sig };
        }
        const defaultSigOpts = { lowS: CURVE.lowS, prehash: false };
        const defaultVerOpts = { lowS: CURVE.lowS, prehash: false };
        /**
         * Signs message hash with a private key.
         * ```
         * sign(m, d, k) where
         *   (x, y) = G × k
         *   r = x mod n
         *   s = (m + dr)/k mod n
         * ```
         * @param msgHash NOT message. msg needs to be hashed to `msgHash`, or use `prehash`.
         * @param privKey private key
         * @param opts lowS for non-malleable sigs. extraEntropy for mixing randomness into k. prehash will hash first arg.
         * @returns signature with recovery param
         */
        function sign(msgHash, privKey, opts = defaultSigOpts) {
            const { seed, k2sig } = prepSig(msgHash, privKey, opts); // Steps A, D of RFC6979 3.2.
            const C = CURVE;
            const drbg = ut.createHmacDrbg(C.hash.outputLen, C.nByteLength, C.hmac);
            return drbg(seed, k2sig); // Steps B, C, D, E, F, G
        }
        // Enable precomputes. Slows down first publicKey computation by 20ms.
        Point.BASE._setWindowSize(8);
        // utils.precompute(8, ProjectivePoint.BASE)
        /**
         * Verifies a signature against message hash and public key.
         * Rejects lowS signatures by default: to override,
         * specify option `{lowS: false}`. Implements section 4.1.4 from https://www.secg.org/sec1-v2.pdf:
         *
         * ```
         * verify(r, s, h, P) where
         *   U1 = hs^-1 mod n
         *   U2 = rs^-1 mod n
         *   R = U1⋅G - U2⋅P
         *   mod(R.x, n) == r
         * ```
         */
        function verify(signature, msgHash, publicKey, opts = defaultVerOpts) {
            const sg = signature;
            msgHash = (0, utils_5.ensureBytes)('msgHash', msgHash);
            publicKey = (0, utils_5.ensureBytes)('publicKey', publicKey);
            if ('strict' in opts)
                throw new Error('options.strict was renamed to lowS');
            const { lowS, prehash } = opts;
            let _sig = undefined;
            let P;
            try {
                if (typeof sg === 'string' || sg instanceof Uint8Array) {
                    // Signature can be represented in 2 ways: compact (2*nByteLength) & DER (variable-length).
                    // Since DER can also be 2*nByteLength bytes, we check for it first.
                    try {
                        _sig = Signature.fromDER(sg);
                    }
                    catch (derError) {
                        if (!(derError instanceof exports.DER.Err))
                            throw derError;
                        _sig = Signature.fromCompact(sg);
                    }
                }
                else if (typeof sg === 'object' && typeof sg.r === 'bigint' && typeof sg.s === 'bigint') {
                    const { r, s } = sg;
                    _sig = new Signature(r, s);
                }
                else {
                    throw new Error('PARSE');
                }
                P = Point.fromHex(publicKey);
            }
            catch (error) {
                if (error.message === 'PARSE')
                    throw new Error(`signature must be Signature instance, Uint8Array or hex string`);
                return false;
            }
            if (lowS && _sig.hasHighS())
                return false;
            if (prehash)
                msgHash = CURVE.hash(msgHash);
            const { r, s } = _sig;
            const h = bits2int_modN(msgHash); // Cannot use fields methods, since it is group element
            const is = invN(s); // s^-1
            const u1 = modN(h * is); // u1 = hs^-1 mod n
            const u2 = modN(r * is); // u2 = rs^-1 mod n
            const R = Point.BASE.multiplyAndAddUnsafe(P, u1, u2)?.toAffine(); // R = u1⋅G + u2⋅P
            if (!R)
                return false;
            const v = modN(R.x);
            return v === r;
        }
        return {
            CURVE,
            getPublicKey,
            getSharedSecret,
            sign,
            verify,
            ProjectivePoint: Point,
            Signature,
            utils,
        };
    }
    exports.weierstrass = weierstrass;
    /**
     * Implementation of the Shallue and van de Woestijne method for any weierstrass curve.
     * TODO: check if there is a way to merge this with uvRatio in Edwards; move to modular.
     * b = True and y = sqrt(u / v) if (u / v) is square in F, and
     * b = False and y = sqrt(Z * (u / v)) otherwise.
     * @param Fp
     * @param Z
     * @returns
     */
    function SWUFpSqrtRatio(Fp, Z) {
        // Generic implementation
        const q = Fp.ORDER;
        let l = _0n;
        for (let o = q - _1n; o % _2n === _0n; o /= _2n)
            l += _1n;
        const c1 = l; // 1. c1, the largest integer such that 2^c1 divides q - 1.
        // We need 2n ** c1 and 2n ** (c1-1). We can't use **; but we can use <<.
        // 2n ** c1 == 2n << (c1-1)
        const _2n_pow_c1_1 = _2n << (c1 - _1n - _1n);
        const _2n_pow_c1 = _2n_pow_c1_1 * _2n;
        const c2 = (q - _1n) / _2n_pow_c1; // 2. c2 = (q - 1) / (2^c1)  # Integer arithmetic
        const c3 = (c2 - _1n) / _2n; // 3. c3 = (c2 - 1) / 2            # Integer arithmetic
        const c4 = _2n_pow_c1 - _1n; // 4. c4 = 2^c1 - 1                # Integer arithmetic
        const c5 = _2n_pow_c1_1; // 5. c5 = 2^(c1 - 1)                  # Integer arithmetic
        const c6 = Fp.pow(Z, c2); // 6. c6 = Z^c2
        const c7 = Fp.pow(Z, (c2 + _1n) / _2n); // 7. c7 = Z^((c2 + 1) / 2)
        let sqrtRatio = (u, v) => {
            let tv1 = c6; // 1. tv1 = c6
            let tv2 = Fp.pow(v, c4); // 2. tv2 = v^c4
            let tv3 = Fp.sqr(tv2); // 3. tv3 = tv2^2
            tv3 = Fp.mul(tv3, v); // 4. tv3 = tv3 * v
            let tv5 = Fp.mul(u, tv3); // 5. tv5 = u * tv3
            tv5 = Fp.pow(tv5, c3); // 6. tv5 = tv5^c3
            tv5 = Fp.mul(tv5, tv2); // 7. tv5 = tv5 * tv2
            tv2 = Fp.mul(tv5, v); // 8. tv2 = tv5 * v
            tv3 = Fp.mul(tv5, u); // 9. tv3 = tv5 * u
            let tv4 = Fp.mul(tv3, tv2); // 10. tv4 = tv3 * tv2
            tv5 = Fp.pow(tv4, c5); // 11. tv5 = tv4^c5
            let isQR = Fp.eql(tv5, Fp.ONE); // 12. isQR = tv5 == 1
            tv2 = Fp.mul(tv3, c7); // 13. tv2 = tv3 * c7
            tv5 = Fp.mul(tv4, tv1); // 14. tv5 = tv4 * tv1
            tv3 = Fp.cmov(tv2, tv3, isQR); // 15. tv3 = CMOV(tv2, tv3, isQR)
            tv4 = Fp.cmov(tv5, tv4, isQR); // 16. tv4 = CMOV(tv5, tv4, isQR)
            // 17. for i in (c1, c1 - 1, ..., 2):
            for (let i = c1; i > _1n; i--) {
                let tv5 = i - _2n; // 18.    tv5 = i - 2
                tv5 = _2n << (tv5 - _1n); // 19.    tv5 = 2^tv5
                let tvv5 = Fp.pow(tv4, tv5); // 20.    tv5 = tv4^tv5
                const e1 = Fp.eql(tvv5, Fp.ONE); // 21.    e1 = tv5 == 1
                tv2 = Fp.mul(tv3, tv1); // 22.    tv2 = tv3 * tv1
                tv1 = Fp.mul(tv1, tv1); // 23.    tv1 = tv1 * tv1
                tvv5 = Fp.mul(tv4, tv1); // 24.    tv5 = tv4 * tv1
                tv3 = Fp.cmov(tv2, tv3, e1); // 25.    tv3 = CMOV(tv2, tv3, e1)
                tv4 = Fp.cmov(tvv5, tv4, e1); // 26.    tv4 = CMOV(tv5, tv4, e1)
            }
            return { isValid: isQR, value: tv3 };
        };
        if (Fp.ORDER % _4n === _3n) {
            // sqrt_ratio_3mod4(u, v)
            const c1 = (Fp.ORDER - _3n) / _4n; // 1. c1 = (q - 3) / 4     # Integer arithmetic
            const c2 = Fp.sqrt(Fp.neg(Z)); // 2. c2 = sqrt(-Z)
            sqrtRatio = (u, v) => {
                let tv1 = Fp.sqr(v); // 1. tv1 = v^2
                const tv2 = Fp.mul(u, v); // 2. tv2 = u * v
                tv1 = Fp.mul(tv1, tv2); // 3. tv1 = tv1 * tv2
                let y1 = Fp.pow(tv1, c1); // 4. y1 = tv1^c1
                y1 = Fp.mul(y1, tv2); // 5. y1 = y1 * tv2
                const y2 = Fp.mul(y1, c2); // 6. y2 = y1 * c2
                const tv3 = Fp.mul(Fp.sqr(y1), v); // 7. tv3 = y1^2; 8. tv3 = tv3 * v
                const isQR = Fp.eql(tv3, u); // 9. isQR = tv3 == u
                let y = Fp.cmov(y2, y1, isQR); // 10. y = CMOV(y2, y1, isQR)
                return { isValid: isQR, value: y }; // 11. return (isQR, y) isQR ? y : y*c2
            };
        }
        // No curves uses that
        // if (Fp.ORDER % _8n === _5n) // sqrt_ratio_5mod8
        return sqrtRatio;
    }
    exports.SWUFpSqrtRatio = SWUFpSqrtRatio;
    /**
     * Simplified Shallue-van de Woestijne-Ulas Method
     * https://www.rfc-editor.org/rfc/rfc9380#section-6.6.2
     */
    function mapToCurveSimpleSWU(Fp, opts) {
        mod.validateField(Fp);
        if (!Fp.isValid(opts.A) || !Fp.isValid(opts.B) || !Fp.isValid(opts.Z))
            throw new Error('mapToCurveSimpleSWU: invalid opts');
        const sqrtRatio = SWUFpSqrtRatio(Fp, opts.Z);
        if (!Fp.isOdd)
            throw new Error('Fp.isOdd is not implemented!');
        // Input: u, an element of F.
        // Output: (x, y), a point on E.
        return (u) => {
            // prettier-ignore
            let tv1, tv2, tv3, tv4, tv5, tv6, x, y;
            tv1 = Fp.sqr(u); // 1.  tv1 = u^2
            tv1 = Fp.mul(tv1, opts.Z); // 2.  tv1 = Z * tv1
            tv2 = Fp.sqr(tv1); // 3.  tv2 = tv1^2
            tv2 = Fp.add(tv2, tv1); // 4.  tv2 = tv2 + tv1
            tv3 = Fp.add(tv2, Fp.ONE); // 5.  tv3 = tv2 + 1
            tv3 = Fp.mul(tv3, opts.B); // 6.  tv3 = B * tv3
            tv4 = Fp.cmov(opts.Z, Fp.neg(tv2), !Fp.eql(tv2, Fp.ZERO)); // 7.  tv4 = CMOV(Z, -tv2, tv2 != 0)
            tv4 = Fp.mul(tv4, opts.A); // 8.  tv4 = A * tv4
            tv2 = Fp.sqr(tv3); // 9.  tv2 = tv3^2
            tv6 = Fp.sqr(tv4); // 10. tv6 = tv4^2
            tv5 = Fp.mul(tv6, opts.A); // 11. tv5 = A * tv6
            tv2 = Fp.add(tv2, tv5); // 12. tv2 = tv2 + tv5
            tv2 = Fp.mul(tv2, tv3); // 13. tv2 = tv2 * tv3
            tv6 = Fp.mul(tv6, tv4); // 14. tv6 = tv6 * tv4
            tv5 = Fp.mul(tv6, opts.B); // 15. tv5 = B * tv6
            tv2 = Fp.add(tv2, tv5); // 16. tv2 = tv2 + tv5
            x = Fp.mul(tv1, tv3); // 17.   x = tv1 * tv3
            const { isValid, value } = sqrtRatio(tv2, tv6); // 18. (is_gx1_square, y1) = sqrt_ratio(tv2, tv6)
            y = Fp.mul(tv1, u); // 19.   y = tv1 * u  -> Z * u^3 * y1
            y = Fp.mul(y, value); // 20.   y = y * y1
            x = Fp.cmov(x, tv3, isValid); // 21.   x = CMOV(x, tv3, is_gx1_square)
            y = Fp.cmov(y, value, isValid); // 22.   y = CMOV(y, y1, is_gx1_square)
            const e1 = Fp.isOdd(u) === Fp.isOdd(y); // 23.  e1 = sgn0(u) == sgn0(y)
            y = Fp.cmov(Fp.neg(y), y, e1); // 24.   y = CMOV(-y, y, e1)
            x = Fp.div(x, tv4); // 25.   x = x / tv4
            return { x, y };
        };
    }
    exports.mapToCurveSimpleSWU = mapToCurveSimpleSWU;
});
define("@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts", ["require", "exports", "@scom/scom-social-sdk/core/curves/abstract/modular.ts", "@scom/scom-social-sdk/core/curves/abstract/utils.ts"], function (require, exports, modular_2, utils_6) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createHasher = exports.isogenyMap = exports.hash_to_field = exports.expand_message_xof = exports.expand_message_xmd = void 0;
    function validateDST(dst) {
        if (dst instanceof Uint8Array)
            return dst;
        if (typeof dst === 'string')
            return (0, utils_6.utf8ToBytes)(dst);
        throw new Error('DST must be Uint8Array or string');
    }
    // Octet Stream to Integer. "spec" implementation of os2ip is 2.5x slower vs bytesToNumberBE.
    const os2ip = utils_6.bytesToNumberBE;
    // Integer to Octet Stream (numberToBytesBE)
    function i2osp(value, length) {
        if (value < 0 || value >= 1 << (8 * length)) {
            throw new Error(`bad I2OSP call: value=${value} length=${length}`);
        }
        const res = Array.from({ length }).fill(0);
        for (let i = length - 1; i >= 0; i--) {
            res[i] = value & 0xff;
            value >>>= 8;
        }
        return new Uint8Array(res);
    }
    function strxor(a, b) {
        const arr = new Uint8Array(a.length);
        for (let i = 0; i < a.length; i++) {
            arr[i] = a[i] ^ b[i];
        }
        return arr;
    }
    function isBytes(item) {
        if (!(item instanceof Uint8Array))
            throw new Error('Uint8Array expected');
    }
    function isNum(item) {
        if (!Number.isSafeInteger(item))
            throw new Error('number expected');
    }
    // Produces a uniformly random byte string using a cryptographic hash function H that outputs b bits
    // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.1
    function expand_message_xmd(msg, DST, lenInBytes, H) {
        isBytes(msg);
        isBytes(DST);
        isNum(lenInBytes);
        // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.3
        if (DST.length > 255)
            DST = H((0, utils_6.concatBytes)((0, utils_6.utf8ToBytes)('H2C-OVERSIZE-DST-'), DST));
        const { outputLen: b_in_bytes, blockLen: r_in_bytes } = H;
        const ell = Math.ceil(lenInBytes / b_in_bytes);
        if (ell > 255)
            throw new Error('Invalid xmd length');
        const DST_prime = (0, utils_6.concatBytes)(DST, i2osp(DST.length, 1));
        const Z_pad = i2osp(0, r_in_bytes);
        const l_i_b_str = i2osp(lenInBytes, 2); // len_in_bytes_str
        const b = new Array(ell);
        const b_0 = H((0, utils_6.concatBytes)(Z_pad, msg, l_i_b_str, i2osp(0, 1), DST_prime));
        b[0] = H((0, utils_6.concatBytes)(b_0, i2osp(1, 1), DST_prime));
        for (let i = 1; i <= ell; i++) {
            const args = [strxor(b_0, b[i - 1]), i2osp(i + 1, 1), DST_prime];
            b[i] = H((0, utils_6.concatBytes)(...args));
        }
        const pseudo_random_bytes = (0, utils_6.concatBytes)(...b);
        return pseudo_random_bytes.slice(0, lenInBytes);
    }
    exports.expand_message_xmd = expand_message_xmd;
    // Produces a uniformly random byte string using an extendable-output function (XOF) H.
    // 1. The collision resistance of H MUST be at least k bits.
    // 2. H MUST be an XOF that has been proved indifferentiable from
    //    a random oracle under a reasonable cryptographic assumption.
    // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.2
    function expand_message_xof(msg, DST, lenInBytes, k, H) {
        isBytes(msg);
        isBytes(DST);
        isNum(lenInBytes);
        // https://www.rfc-editor.org/rfc/rfc9380#section-5.3.3
        // DST = H('H2C-OVERSIZE-DST-' || a_very_long_DST, Math.ceil((lenInBytes * k) / 8));
        if (DST.length > 255) {
            const dkLen = Math.ceil((2 * k) / 8);
            DST = H.create({ dkLen }).update((0, utils_6.utf8ToBytes)('H2C-OVERSIZE-DST-')).update(DST).digest();
        }
        if (lenInBytes > 65535 || DST.length > 255)
            throw new Error('expand_message_xof: invalid lenInBytes');
        return (H.create({ dkLen: lenInBytes })
            .update(msg)
            .update(i2osp(lenInBytes, 2))
            // 2. DST_prime = DST || I2OSP(len(DST), 1)
            .update(DST)
            .update(i2osp(DST.length, 1))
            .digest());
    }
    exports.expand_message_xof = expand_message_xof;
    /**
     * Hashes arbitrary-length byte strings to a list of one or more elements of a finite field F
     * https://www.rfc-editor.org/rfc/rfc9380#section-5.2
     * @param msg a byte string containing the message to hash
     * @param count the number of elements of F to output
     * @param options `{DST: string, p: bigint, m: number, k: number, expand: 'xmd' | 'xof', hash: H}`, see above
     * @returns [u_0, ..., u_(count - 1)], a list of field elements.
     */
    function hash_to_field(msg, count, options) {
        (0, utils_6.validateObject)(options, {
            DST: 'stringOrUint8Array',
            p: 'bigint',
            m: 'isSafeInteger',
            k: 'isSafeInteger',
            hash: 'hash',
        });
        const { p, k, m, hash, expand, DST: _DST } = options;
        isBytes(msg);
        isNum(count);
        const DST = validateDST(_DST);
        const log2p = p.toString(2).length;
        const L = Math.ceil((log2p + k) / 8); // section 5.1 of ietf draft link above
        const len_in_bytes = count * m * L;
        let prb; // pseudo_random_bytes
        if (expand === 'xmd') {
            prb = expand_message_xmd(msg, DST, len_in_bytes, hash);
        }
        else if (expand === 'xof') {
            prb = expand_message_xof(msg, DST, len_in_bytes, k, hash);
        }
        else if (expand === '_internal_pass') {
            // for internal tests only
            prb = msg;
        }
        else {
            throw new Error('expand must be "xmd" or "xof"');
        }
        const u = new Array(count);
        for (let i = 0; i < count; i++) {
            const e = new Array(m);
            for (let j = 0; j < m; j++) {
                const elm_offset = L * (j + i * m);
                const tv = prb.subarray(elm_offset, elm_offset + L);
                e[j] = (0, modular_2.mod)(os2ip(tv), p);
            }
            u[i] = e;
        }
        return u;
    }
    exports.hash_to_field = hash_to_field;
    function isogenyMap(field, map) {
        // Make same order as in spec
        const COEFF = map.map((i) => Array.from(i).reverse());
        return (x, y) => {
            const [xNum, xDen, yNum, yDen] = COEFF.map((val) => val.reduce((acc, i) => field.add(field.mul(acc, x), i)));
            x = field.div(xNum, xDen); // xNum / xDen
            y = field.mul(y, field.div(yNum, yDen)); // y * (yNum / yDev)
            return { x, y };
        };
    }
    exports.isogenyMap = isogenyMap;
    function createHasher(Point, mapToCurve, def) {
        if (typeof mapToCurve !== 'function')
            throw new Error('mapToCurve() must be defined');
        return {
            // Encodes byte string to elliptic curve.
            // hash_to_curve from https://www.rfc-editor.org/rfc/rfc9380#section-3
            hashToCurve(msg, options) {
                const u = hash_to_field(msg, 2, { ...def, DST: def.DST, ...options });
                const u0 = Point.fromAffine(mapToCurve(u[0]));
                const u1 = Point.fromAffine(mapToCurve(u[1]));
                const P = u0.add(u1).clearCofactor();
                P.assertValidity();
                return P;
            },
            // Encodes byte string to elliptic curve.
            // encode_to_curve from https://www.rfc-editor.org/rfc/rfc9380#section-3
            encodeToCurve(msg, options) {
                const u = hash_to_field(msg, 1, { ...def, DST: def.encodeDST, ...options });
                const P = Point.fromAffine(mapToCurve(u[0])).clearCofactor();
                P.assertValidity();
                return P;
            },
        };
    }
    exports.createHasher = createHasher;
});
define("@scom/scom-social-sdk/core/hashes/hmac.ts", ["require", "exports", "@scom/scom-social-sdk/core/hashes/_assert.ts", "@scom/scom-social-sdk/core/hashes/utils.ts"], function (require, exports, _assert_2, utils_7) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.hmac = exports.HMAC = void 0;
    // HMAC (RFC 2104)
    class HMAC extends utils_7.Hash {
        constructor(hash, _key) {
            super();
            this.finished = false;
            this.destroyed = false;
            (0, _assert_2.hash)(hash);
            const key = (0, utils_7.toBytes)(_key);
            this.iHash = hash.create();
            if (typeof this.iHash.update !== 'function')
                throw new Error('Expected instance of class which extends utils.Hash');
            this.blockLen = this.iHash.blockLen;
            this.outputLen = this.iHash.outputLen;
            const blockLen = this.blockLen;
            const pad = new Uint8Array(blockLen);
            // blockLen can be bigger than outputLen
            pad.set(key.length > blockLen ? hash.create().update(key).digest() : key);
            for (let i = 0; i < pad.length; i++)
                pad[i] ^= 0x36;
            this.iHash.update(pad);
            // By doing update (processing of first block) of outer hash here we can re-use it between multiple calls via clone
            this.oHash = hash.create();
            // Undo internal XOR && apply outer XOR
            for (let i = 0; i < pad.length; i++)
                pad[i] ^= 0x36 ^ 0x5c;
            this.oHash.update(pad);
            pad.fill(0);
        }
        update(buf) {
            (0, _assert_2.exists)(this);
            this.iHash.update(buf);
            return this;
        }
        digestInto(out) {
            (0, _assert_2.exists)(this);
            (0, _assert_2.bytes)(out, this.outputLen);
            this.finished = true;
            this.iHash.digestInto(out);
            this.oHash.update(out);
            this.oHash.digestInto(out);
            this.destroy();
        }
        digest() {
            const out = new Uint8Array(this.oHash.outputLen);
            this.digestInto(out);
            return out;
        }
        _cloneInto(to) {
            // Create new instance without calling constructor since key already in state and we don't know it.
            to || (to = Object.create(Object.getPrototypeOf(this), {}));
            const { oHash, iHash, finished, destroyed, blockLen, outputLen } = this;
            to = to;
            to.finished = finished;
            to.destroyed = destroyed;
            to.blockLen = blockLen;
            to.outputLen = outputLen;
            to.oHash = oHash._cloneInto(to.oHash);
            to.iHash = iHash._cloneInto(to.iHash);
            return to;
        }
        destroy() {
            this.destroyed = true;
            this.oHash.destroy();
            this.iHash.destroy();
        }
    }
    exports.HMAC = HMAC;
    /**
     * HMAC: RFC2104 message authentication code.
     * @param hash - function that would be used e.g. sha256
     * @param key - message key
     * @param message - message data
     */
    const hmac = (hash, key, message) => new HMAC(hash, key).update(message).digest();
    exports.hmac = hmac;
    exports.hmac.create = (hash, key) => new HMAC(hash, key);
});
define("@scom/scom-social-sdk/core/curves/_shortw_utils.ts", ["require", "exports", "@scom/scom-social-sdk/core/hashes/hmac.ts", "@scom/scom-social-sdk/core/hashes/utils.ts", "@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts"], function (require, exports, hmac_1, utils_8, weierstrass_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.createCurve = exports.getHash = void 0;
    // connects noble-curves to noble-hashes
    function getHash(hash) {
        return {
            hash,
            hmac: (key, ...msgs) => (0, hmac_1.hmac)(hash, key, (0, utils_8.concatBytes)(...msgs)),
            randomBytes: utils_8.randomBytes,
        };
    }
    exports.getHash = getHash;
    function createCurve(curveDef, defHash) {
        const create = (hash) => (0, weierstrass_1.weierstrass)({ ...curveDef, ...getHash(hash) });
        return Object.freeze({ ...create(defHash), create });
    }
    exports.createCurve = createCurve;
});
define("@scom/scom-social-sdk/core/curves/secp256k1.ts", ["require", "exports", "@scom/scom-social-sdk/core/hashes/sha256.ts", "@scom/scom-social-sdk/core/hashes/utils.ts", "@scom/scom-social-sdk/core/curves/abstract/modular.ts", "@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts", "@scom/scom-social-sdk/core/curves/abstract/utils.ts", "@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts", "@scom/scom-social-sdk/core/curves/_shortw_utils.ts"], function (require, exports, sha256_1, utils_9, modular_3, weierstrass_2, utils_10, hash_to_curve_1, _shortw_utils_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.schnorrGetExtPubKeyY = exports.encodeToCurve = exports.hashToCurve = exports.schnorr = exports.secp256k1 = void 0;
    const secp256k1P = BigInt('0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffffc2f');
    const secp256k1N = BigInt('0xfffffffffffffffffffffffffffffffebaaedce6af48a03bbfd25e8cd0364141');
    const _1n = BigInt(1);
    const _2n = BigInt(2);
    const divNearest = (a, b) => (a + b / _2n) / b;
    /**
     * √n = n^((p+1)/4) for fields p = 3 mod 4. We unwrap the loop and multiply bit-by-bit.
     * (P+1n/4n).toString(2) would produce bits [223x 1, 0, 22x 1, 4x 0, 11, 00]
     */
    function sqrtMod(y) {
        const P = secp256k1P;
        // prettier-ignore
        const _3n = BigInt(3), _6n = BigInt(6), _11n = BigInt(11), _22n = BigInt(22);
        // prettier-ignore
        const _23n = BigInt(23), _44n = BigInt(44), _88n = BigInt(88);
        const b2 = (y * y * y) % P; // x^3, 11
        const b3 = (b2 * b2 * y) % P; // x^7
        const b6 = ((0, modular_3.pow2)(b3, _3n, P) * b3) % P;
        const b9 = ((0, modular_3.pow2)(b6, _3n, P) * b3) % P;
        const b11 = ((0, modular_3.pow2)(b9, _2n, P) * b2) % P;
        const b22 = ((0, modular_3.pow2)(b11, _11n, P) * b11) % P;
        const b44 = ((0, modular_3.pow2)(b22, _22n, P) * b22) % P;
        const b88 = ((0, modular_3.pow2)(b44, _44n, P) * b44) % P;
        const b176 = ((0, modular_3.pow2)(b88, _88n, P) * b88) % P;
        const b220 = ((0, modular_3.pow2)(b176, _44n, P) * b44) % P;
        const b223 = ((0, modular_3.pow2)(b220, _3n, P) * b3) % P;
        const t1 = ((0, modular_3.pow2)(b223, _23n, P) * b22) % P;
        const t2 = ((0, modular_3.pow2)(t1, _6n, P) * b2) % P;
        const root = (0, modular_3.pow2)(t2, _2n, P);
        if (!Fp.eql(Fp.sqr(root), y))
            throw new Error('Cannot find square root');
        return root;
    }
    const Fp = (0, modular_3.Field)(secp256k1P, undefined, undefined, { sqrt: sqrtMod });
    exports.secp256k1 = (0, _shortw_utils_1.createCurve)({
        a: BigInt(0),
        b: BigInt(7),
        Fp,
        n: secp256k1N,
        // Base point (x, y) aka generator point
        Gx: BigInt('55066263022277343669578718895168534326250603453777594175500187360389116729240'),
        Gy: BigInt('32670510020758816978083085130507043184471273380659243275938904335757337482424'),
        h: BigInt(1),
        lowS: true,
        /**
         * secp256k1 belongs to Koblitz curves: it has efficiently computable endomorphism.
         * Endomorphism uses 2x less RAM, speeds up precomputation by 2x and ECDH / key recovery by 20%.
         * For precomputed wNAF it trades off 1/2 init time & 1/3 ram for 20% perf hit.
         * Explanation: https://gist.github.com/paulmillr/eb670806793e84df628a7c434a873066
         */
        endo: {
            beta: BigInt('0x7ae96a2b657c07106e64479eac3434e99cf0497512f58995c1396c28719501ee'),
            splitScalar: (k) => {
                const n = secp256k1N;
                const a1 = BigInt('0x3086d221a7d46bcde86c90e49284eb15');
                const b1 = -_1n * BigInt('0xe4437ed6010e88286f547fa90abfe4c3');
                const a2 = BigInt('0x114ca50f7a8e2f3f657c1108d9d44cfd8');
                const b2 = a1;
                const POW_2_128 = BigInt('0x100000000000000000000000000000000'); // (2n**128n).toString(16)
                const c1 = divNearest(b2 * k, n);
                const c2 = divNearest(-b1 * k, n);
                let k1 = (0, modular_3.mod)(k - c1 * a1 - c2 * a2, n);
                let k2 = (0, modular_3.mod)(-c1 * b1 - c2 * b2, n);
                const k1neg = k1 > POW_2_128;
                const k2neg = k2 > POW_2_128;
                if (k1neg)
                    k1 = n - k1;
                if (k2neg)
                    k2 = n - k2;
                if (k1 > POW_2_128 || k2 > POW_2_128) {
                    throw new Error('splitScalar: Endomorphism failed, k=' + k);
                }
                return { k1neg, k1, k2neg, k2 };
            },
        },
    }, sha256_1.sha256);
    // Schnorr signatures are superior to ECDSA from above. Below is Schnorr-specific BIP0340 code.
    // https://github.com/bitcoin/bips/blob/master/bip-0340.mediawiki
    const _0n = BigInt(0);
    const fe = (x) => typeof x === 'bigint' && _0n < x && x < secp256k1P;
    const ge = (x) => typeof x === 'bigint' && _0n < x && x < secp256k1N;
    /** An object mapping tags to their tagged hash prefix of [SHA256(tag) | SHA256(tag)] */
    const TAGGED_HASH_PREFIXES = {};
    function taggedHash(tag, ...messages) {
        let tagP = TAGGED_HASH_PREFIXES[tag];
        if (tagP === undefined) {
            const tagH = (0, sha256_1.sha256)(Uint8Array.from(tag, (c) => c.charCodeAt(0)));
            tagP = (0, utils_10.concatBytes)(tagH, tagH);
            TAGGED_HASH_PREFIXES[tag] = tagP;
        }
        return (0, sha256_1.sha256)((0, utils_10.concatBytes)(tagP, ...messages));
    }
    // ECDSA compact points are 33-byte. Schnorr is 32: we strip first byte 0x02 or 0x03
    const pointToBytes = (point) => point.toRawBytes(true).slice(1);
    const numTo32b = (n) => (0, utils_10.numberToBytesBE)(n, 32);
    const modP = (x) => (0, modular_3.mod)(x, secp256k1P);
    const modN = (x) => (0, modular_3.mod)(x, secp256k1N);
    const Point = exports.secp256k1.ProjectivePoint;
    const GmulAdd = (Q, a, b) => Point.BASE.multiplyAndAddUnsafe(Q, a, b);
    // Calculate point, scalar and bytes
    function schnorrGetExtPubKey(priv) {
        let d_ = exports.secp256k1.utils.normPrivateKeyToScalar(priv); // same method executed in fromPrivateKey
        let p = Point.fromPrivateKey(d_); // P = d'⋅G; 0 < d' < n check is done inside
        const scalar = p.hasEvenY() ? d_ : modN(-d_);
        return { scalar: scalar, bytes: pointToBytes(p) };
    }
    /**
     * lift_x from BIP340. Convert 32-byte x coordinate to elliptic curve point.
     * @returns valid point checked for being on-curve
     */
    function lift_x(x) {
        if (!fe(x))
            throw new Error('bad x: need 0 < x < p'); // Fail if x ≥ p.
        const xx = modP(x * x);
        const c = modP(xx * x + BigInt(7)); // Let c = x³ + 7 mod p.
        let y = sqrtMod(c); // Let y = c^(p+1)/4 mod p.
        if (y % _2n !== _0n)
            y = modP(-y); // Return the unique point P such that x(P) = x and
        const p = new Point(x, y, _1n); // y(P) = y if y mod 2 = 0 or y(P) = p-y otherwise.
        p.assertValidity();
        return p;
    }
    /**
     * Create tagged hash, convert it to bigint, reduce modulo-n.
     */
    function challenge(...args) {
        return modN((0, utils_10.bytesToNumberBE)(taggedHash('BIP0340/challenge', ...args)));
    }
    /**
     * Schnorr public key is just `x` coordinate of Point as per BIP340.
     */
    function schnorrGetPublicKey(privateKey) {
        return schnorrGetExtPubKey(privateKey).bytes; // d'=int(sk). Fail if d'=0 or d'≥n. Ret bytes(d'⋅G)
    }
    /**
     * Creates Schnorr signature as per BIP340. Verifies itself before returning anything.
     * auxRand is optional and is not the sole source of k generation: bad CSPRNG won't be dangerous.
     */
    function schnorrSign(message, privateKey, auxRand = (0, utils_9.randomBytes)(32)) {
        const m = (0, utils_10.ensureBytes)('message', message);
        const { bytes: px, scalar: d } = schnorrGetExtPubKey(privateKey); // checks for isWithinCurveOrder
        const a = (0, utils_10.ensureBytes)('auxRand', auxRand, 32); // Auxiliary random data a: a 32-byte array
        const t = numTo32b(d ^ (0, utils_10.bytesToNumberBE)(taggedHash('BIP0340/aux', a))); // Let t be the byte-wise xor of bytes(d) and hash/aux(a)
        const rand = taggedHash('BIP0340/nonce', t, px, m); // Let rand = hash/nonce(t || bytes(P) || m)
        const k_ = modN((0, utils_10.bytesToNumberBE)(rand)); // Let k' = int(rand) mod n
        if (k_ === _0n)
            throw new Error('sign failed: k is zero'); // Fail if k' = 0.
        const { bytes: rx, scalar: k } = schnorrGetExtPubKey(k_); // Let R = k'⋅G.
        const e = challenge(rx, px, m); // Let e = int(hash/challenge(bytes(R) || bytes(P) || m)) mod n.
        const sig = new Uint8Array(64); // Let sig = bytes(R) || bytes((k + ed) mod n).
        sig.set(rx, 0);
        sig.set(numTo32b(modN(k + e * d)), 32);
        // If Verify(bytes(P), m, sig) (see below) returns failure, abort
        if (!schnorrVerify(sig, m, px))
            throw new Error('sign: Invalid signature produced');
        return sig;
    }
    /**
     * Verifies Schnorr signature.
     * Will swallow errors & return false except for initial type validation of arguments.
     */
    function schnorrVerify(signature, message, publicKey) {
        const sig = (0, utils_10.ensureBytes)('signature', signature, 64);
        const m = (0, utils_10.ensureBytes)('message', message);
        const pub = (0, utils_10.ensureBytes)('publicKey', publicKey, 32);
        try {
            const P = lift_x((0, utils_10.bytesToNumberBE)(pub)); // P = lift_x(int(pk)); fail if that fails
            const r = (0, utils_10.bytesToNumberBE)(sig.subarray(0, 32)); // Let r = int(sig[0:32]); fail if r ≥ p.
            if (!fe(r))
                return false;
            const s = (0, utils_10.bytesToNumberBE)(sig.subarray(32, 64)); // Let s = int(sig[32:64]); fail if s ≥ n.
            if (!ge(s))
                return false;
            const e = challenge(numTo32b(r), pointToBytes(P), m); // int(challenge(bytes(r)||bytes(P)||m))%n
            const R = GmulAdd(P, s, modN(-e)); // R = s⋅G - e⋅P
            if (!R || !R.hasEvenY() || R.toAffine().x !== r)
                return false; // -eP == (n-e)P
            return true; // Fail if is_infinite(R) / not has_even_y(R) / x(R) ≠ r.
        }
        catch (error) {
            return false;
        }
    }
    exports.schnorr = (() => ({
        getPublicKey: schnorrGetPublicKey,
        sign: schnorrSign,
        verify: schnorrVerify,
        utils: {
            randomPrivateKey: exports.secp256k1.utils.randomPrivateKey,
            lift_x,
            pointToBytes,
            numberToBytesBE: utils_10.numberToBytesBE,
            bytesToNumberBE: utils_10.bytesToNumberBE,
            taggedHash,
            mod: modular_3.mod,
        },
    }))();
    const isoMap = /* @__PURE__ */ (() => (0, hash_to_curve_1.isogenyMap)(Fp, [
        // xNum
        [
            '0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa8c7',
            '0x7d3d4c80bc321d5b9f315cea7fd44c5d595d2fc0bf63b92dfff1044f17c6581',
            '0x534c328d23f234e6e2a413deca25caece4506144037c40314ecbd0b53d9dd262',
            '0x8e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38e38daaaaa88c',
        ],
        // xDen
        [
            '0xd35771193d94918a9ca34ccbb7b640dd86cd409542f8487d9fe6b745781eb49b',
            '0xedadc6f64383dc1df7c4b2d51b54225406d36b641f5e41bbc52a56612a8c6d14',
            '0x0000000000000000000000000000000000000000000000000000000000000001', // LAST 1
        ],
        // yNum
        [
            '0x4bda12f684bda12f684bda12f684bda12f684bda12f684bda12f684b8e38e23c',
            '0xc75e0c32d5cb7c0fa9d0a54b12a0a6d5647ab046d686da6fdffc90fc201d71a3',
            '0x29a6194691f91a73715209ef6512e576722830a201be2018a765e85a9ecee931',
            '0x2f684bda12f684bda12f684bda12f684bda12f684bda12f684bda12f38e38d84',
        ],
        // yDen
        [
            '0xfffffffffffffffffffffffffffffffffffffffffffffffffffffffefffff93b',
            '0x7a06534bb8bdb49fd5e9e6632722c2989467c1bfc8e8d978dfb425d2685c2573',
            '0x6484aa716545ca2cf3a70c3fa8fe337e0a3d21162f0d6299a7bf8192bfd2a76f',
            '0x0000000000000000000000000000000000000000000000000000000000000001', // LAST 1
        ],
    ].map((i) => i.map((j) => BigInt(j)))))();
    const mapSWU = /* @__PURE__ */ (() => (0, weierstrass_2.mapToCurveSimpleSWU)(Fp, {
        A: BigInt('0x3f8731abdd661adca08a5558f0f5d272e953d363cb6f0e5d405447c01a444533'),
        B: BigInt('1771'),
        Z: Fp.create(BigInt('-11')),
    }))();
    const htf = /* @__PURE__ */ (() => (0, hash_to_curve_1.createHasher)(exports.secp256k1.ProjectivePoint, (scalars) => {
        const { x, y } = mapSWU(Fp.create(scalars[0]));
        return isoMap(x, y);
    }, {
        DST: 'secp256k1_XMD:SHA-256_SSWU_RO_',
        encodeDST: 'secp256k1_XMD:SHA-256_SSWU_NU_',
        p: Fp.ORDER,
        m: 1,
        k: 128,
        expand: 'xmd',
        hash: sha256_1.sha256,
    }))();
    exports.hashToCurve = (() => htf.hashToCurve)();
    exports.encodeToCurve = (() => htf.encodeToCurve)();
    function schnorrGetExtPubKeyY(priv) {
        let d_ = exports.secp256k1.utils.normPrivateKeyToScalar(priv); // same method executed in fromPrivateKey
        let p = Point.fromPrivateKey(d_); // P = d'⋅G; 0 < d' < n check is done inside
        return p.toRawBytes(false).slice(1 + 32);
    }
    exports.schnorrGetExtPubKeyY = schnorrGetExtPubKeyY;
});
define("@scom/scom-social-sdk/core/nostr/keys.ts", ["require", "exports", "@scom/scom-social-sdk/core/curves/secp256k1.ts", "@scom/scom-social-sdk/core/hashes/utils.ts"], function (require, exports, secp256k1_1, utils_11) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.decompressPublicKey = exports.getSharedSecret = exports.getPublicKeyY = exports.getPublicKey = exports.generatePrivateKey = void 0;
    function generatePrivateKey() {
        return (0, utils_11.bytesToHex)(secp256k1_1.schnorr.utils.randomPrivateKey());
    }
    exports.generatePrivateKey = generatePrivateKey;
    function getPublicKey(privateKey) {
        return (0, utils_11.bytesToHex)(secp256k1_1.schnorr.getPublicKey(privateKey));
    }
    exports.getPublicKey = getPublicKey;
    function getPublicKeyY(privateKey) {
        return (0, utils_11.bytesToHex)((0, secp256k1_1.schnorrGetExtPubKeyY)(privateKey));
    }
    exports.getPublicKeyY = getPublicKeyY;
    function getSharedSecret(privateKey, publicKey) {
        return (0, utils_11.bytesToHex)(secp256k1_1.secp256k1.getSharedSecret(privateKey, publicKey));
    }
    exports.getSharedSecret = getSharedSecret;
    function decompressPublicKey(publicKey) {
        const decompressedPublicKey = secp256k1_1.secp256k1.ProjectivePoint.fromHex(publicKey).toHex(false);
        return decompressedPublicKey;
    }
    exports.decompressPublicKey = decompressPublicKey;
});
define("@scom/scom-social-sdk/core/nostr/event.ts", ["require", "exports", "@scom/scom-social-sdk/core/curves/secp256k1.ts", "@scom/scom-social-sdk/core/hashes/sha256.ts", "@scom/scom-social-sdk/core/hashes/utils.ts", "@scom/scom-social-sdk/core/nostr/keys.ts"], function (require, exports, secp256k1_2, sha256_2, utils_12, keys_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.getPaymentRequestHash = exports.getSignature = exports.signEvent = exports.verifySignature = exports.validateEvent = exports.getEventHash = exports.serializeEvent = exports.finishEvent = exports.getBlankEvent = exports.Kind = exports.verifiedSymbol = exports.utf8Encoder = void 0;
    exports.utf8Encoder = new TextEncoder();
    /** Designates a verified event signature. */
    exports.verifiedSymbol = Symbol('verified');
    /** @deprecated Use numbers instead. */
    /* eslint-disable no-unused-vars */
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
        let eventHash = (0, sha256_2.sha256)(exports.utf8Encoder.encode(serializeEvent(event)));
        return (0, utils_12.bytesToHex)(eventHash);
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
    /** Verify the event's signature. This function mutates the event with a `verified` symbol, making it idempotent. */
    function verifySignature(event) {
        if (typeof event[exports.verifiedSymbol] === 'boolean')
            return event[exports.verifiedSymbol];
        const hash = getEventHash(event);
        if (hash !== event.id) {
            return (event[exports.verifiedSymbol] = false);
        }
        try {
            return (event[exports.verifiedSymbol] = secp256k1_2.schnorr.verify(event.sig, hash, event.pubkey));
        }
        catch (err) {
            return (event[exports.verifiedSymbol] = false);
        }
    }
    exports.verifySignature = verifySignature;
    /** @deprecated Use `getSignature` instead. */
    function signEvent(event, key) {
        console.warn('nostr-tools: `signEvent` is deprecated and will be removed or changed in the future. Please use `getSignature` instead.');
        return getSignature(event, key);
    }
    exports.signEvent = signEvent;
    /** Calculate the signature for an event. */
    function getSignature(event, key) {
        return (0, utils_12.bytesToHex)(secp256k1_2.schnorr.sign(getEventHash(event), key));
    }
    exports.getSignature = getSignature;
    function getPaymentRequestHash(paymentRequest) {
        let eventHash = (0, sha256_2.sha256)(exports.utf8Encoder.encode(paymentRequest));
        return (0, utils_12.bytesToHex)(eventHash);
    }
    exports.getPaymentRequestHash = getPaymentRequestHash;
});
define("@scom/scom-social-sdk/core/bech32.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.bech32m = exports.bech32 = exports.assertNumber = void 0;
    ///<amd-module name='@scom/scom-social-sdk/core/bech32.ts'/> 
    // adopted from https://github.com/paulmillr/scure-base
    /**
     * @__NO_SIDE_EFFECTS__
     */
    function assertNumber(n) {
        if (!Number.isSafeInteger(n))
            throw new Error(`Wrong integer: ${n}`);
    }
    exports.assertNumber = assertNumber;
    /**
     * @__NO_SIDE_EFFECTS__
     */
    function chain(...args) {
        // Wrap call in closure so JIT can inline calls
        const wrap = (a, b) => (c) => a(b(c));
        // Construct chain of args[-1].encode(args[-2].encode([...]))
        const encode = Array.from(args)
            .reverse()
            .reduce((acc, i) => (acc ? wrap(acc, i.encode) : i.encode), undefined);
        // Construct chain of args[0].decode(args[1].decode(...))
        const decode = args.reduce((acc, i) => (acc ? wrap(acc, i.decode) : i.decode), undefined);
        return { encode, decode };
    }
    /**
     * Encodes integer radix representation to array of strings using alphabet and back
     * @__NO_SIDE_EFFECTS__
     */
    function alphabet(alphabet) {
        return {
            encode: (digits) => {
                if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                    throw new Error('alphabet.encode input should be an array of numbers');
                return digits.map((i) => {
                    assertNumber(i);
                    if (i < 0 || i >= alphabet.length)
                        throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
                    return alphabet[i];
                });
            },
            decode: (input) => {
                if (!Array.isArray(input) || (input.length && typeof input[0] !== 'string'))
                    throw new Error('alphabet.decode input should be array of strings');
                return input.map((letter) => {
                    if (typeof letter !== 'string')
                        throw new Error(`alphabet.decode: not string element=${letter}`);
                    const index = alphabet.indexOf(letter);
                    if (index === -1)
                        throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
                    return index;
                });
            },
        };
    }
    /**
     * @__NO_SIDE_EFFECTS__
     */
    function join(separator = '') {
        if (typeof separator !== 'string')
            throw new Error('join separator should be string');
        return {
            encode: (from) => {
                if (!Array.isArray(from) || (from.length && typeof from[0] !== 'string'))
                    throw new Error('join.encode input should be array of strings');
                for (let i of from)
                    if (typeof i !== 'string')
                        throw new Error(`join.encode: non-string input=${i}`);
                return from.join(separator);
            },
            decode: (to) => {
                if (typeof to !== 'string')
                    throw new Error('join.decode input should be string');
                return to.split(separator);
            },
        };
    }
    const gcd = /* @__NO_SIDE_EFFECTS__ */ (a, b) => (!b ? a : gcd(b, a % b));
    const radix2carry = /*@__NO_SIDE_EFFECTS__ */ (from, to) => from + (to - gcd(from, to));
    /**
     * Implemented with numbers, because BigInt is 5x slower
     * @__NO_SIDE_EFFECTS__
     */
    function convertRadix2(data, from, to, padding) {
        if (!Array.isArray(data))
            throw new Error('convertRadix2: data should be array');
        if (from <= 0 || from > 32)
            throw new Error(`convertRadix2: wrong from=${from}`);
        if (to <= 0 || to > 32)
            throw new Error(`convertRadix2: wrong to=${to}`);
        if (radix2carry(from, to) > 32) {
            throw new Error(`convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`);
        }
        let carry = 0;
        let pos = 0; // bitwise position in current element
        const mask = 2 ** to - 1;
        const res = [];
        for (const n of data) {
            assertNumber(n);
            if (n >= 2 ** from)
                throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
            carry = (carry << from) | n;
            if (pos + from > 32)
                throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
            pos += from;
            for (; pos >= to; pos -= to)
                res.push(((carry >> (pos - to)) & mask) >>> 0);
            carry &= 2 ** pos - 1; // clean carry, otherwise it will cause overflow
        }
        carry = (carry << (to - pos)) & mask;
        if (!padding && pos >= from)
            throw new Error('Excess padding');
        if (!padding && carry)
            throw new Error(`Non-zero padding: ${carry}`);
        if (padding && pos > 0)
            res.push(carry >>> 0);
        return res;
    }
    /**
     * If both bases are power of same number (like `2**8 <-> 2**64`),
     * there is a linear algorithm. For now we have implementation for power-of-two bases only.
     * @__NO_SIDE_EFFECTS__
     */
    function radix2(bits, revPadding = false) {
        assertNumber(bits);
        if (bits <= 0 || bits > 32)
            throw new Error('radix2: bits should be in (0..32]');
        if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32)
            throw new Error('radix2: carry overflow');
        return {
            encode: (bytes) => {
                if (!(bytes instanceof Uint8Array))
                    throw new Error('radix2.encode input should be Uint8Array');
                return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
            },
            decode: (digits) => {
                if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
                    throw new Error('radix2.decode input should be array of strings');
                return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
            },
        };
    }
    /**
     * @__NO_SIDE_EFFECTS__
     */
    function unsafeWrapper(fn) {
        if (typeof fn !== 'function')
            throw new Error('unsafeWrapper fn should be function');
        return function (...args) {
            try {
                return fn.apply(null, args);
            }
            catch (e) { }
        };
    }
    const BECH_ALPHABET = /* @__PURE__ */ chain(alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'), join(''));
    const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
    /**
     * @__NO_SIDE_EFFECTS__
     */
    function bech32Polymod(pre) {
        const b = pre >> 25;
        let chk = (pre & 0x1ffffff) << 5;
        for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
            if (((b >> i) & 1) === 1)
                chk ^= POLYMOD_GENERATORS[i];
        }
        return chk;
    }
    /**
     * @__NO_SIDE_EFFECTS__
     */
    function bechChecksum(prefix, words, encodingConst = 1) {
        const len = prefix.length;
        let chk = 1;
        for (let i = 0; i < len; i++) {
            const c = prefix.charCodeAt(i);
            if (c < 33 || c > 126)
                throw new Error(`Invalid prefix (${prefix})`);
            chk = bech32Polymod(chk) ^ (c >> 5);
        }
        chk = bech32Polymod(chk);
        for (let i = 0; i < len; i++)
            chk = bech32Polymod(chk) ^ (prefix.charCodeAt(i) & 0x1f);
        for (let v of words)
            chk = bech32Polymod(chk) ^ v;
        for (let i = 0; i < 6; i++)
            chk = bech32Polymod(chk);
        chk ^= encodingConst;
        return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
    }
    /**
     * @__NO_SIDE_EFFECTS__
     */
    function genBech32(encoding) {
        const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
        const _words = radix2(5);
        const fromWords = _words.decode;
        const toWords = _words.encode;
        const fromWordsUnsafe = unsafeWrapper(fromWords);
        function encode(prefix, words, limit = 90) {
            if (typeof prefix !== 'string')
                throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
            if (!Array.isArray(words) || (words.length && typeof words[0] !== 'number'))
                throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
            const actualLength = prefix.length + 7 + words.length;
            if (limit !== false && actualLength > limit)
                throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
            const lowered = prefix.toLowerCase();
            const sum = bechChecksum(lowered, words, ENCODING_CONST);
            return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}`;
        }
        function decode(str, limit = 90) {
            if (typeof str !== 'string')
                throw new Error(`bech32.decode input should be string, not ${typeof str}`);
            if (str.length < 8 || (limit !== false && str.length > limit))
                throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
            // don't allow mixed case
            const lowered = str.toLowerCase();
            if (str !== lowered && str !== str.toUpperCase())
                throw new Error(`String must be lowercase or uppercase`);
            str = lowered;
            const sepIndex = str.lastIndexOf('1');
            if (sepIndex === 0 || sepIndex === -1)
                throw new Error(`Letter "1" must be present between prefix and data only`);
            const prefix = str.slice(0, sepIndex);
            const _words = str.slice(sepIndex + 1);
            if (_words.length < 6)
                throw new Error('Data must be at least 6 characters long');
            const words = BECH_ALPHABET.decode(_words).slice(0, -6);
            const sum = bechChecksum(prefix, words, ENCODING_CONST);
            if (!_words.endsWith(sum))
                throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
            return { prefix, words };
        }
        const decodeUnsafe = unsafeWrapper(decode);
        function decodeToBytes(str) {
            const { prefix, words } = decode(str, false);
            return { prefix, words, bytes: fromWords(words) };
        }
        return { encode, decode, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
    }
    exports.bech32 = genBech32('bech32');
    exports.bech32m = genBech32('bech32m');
});
define("@scom/scom-social-sdk/core/nostr/nip19.ts", ["require", "exports", "@scom/scom-social-sdk/core/hashes/utils.ts", "@scom/scom-social-sdk/core/bech32.ts"], function (require, exports, utils_13, bech32_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.nrelayEncode = exports.naddrEncode = exports.neventEncode = exports.nprofileEncode = exports.noteEncode = exports.npubEncode = exports.nsecEncode = exports.decode = exports.BECH32_REGEX = exports.utf8Encoder = exports.utf8Decoder = void 0;
    exports.utf8Decoder = new TextDecoder('utf-8');
    exports.utf8Encoder = new TextEncoder();
    const Bech32MaxSize = 5000;
    /**
     * Bech32 regex.
     * @see https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#bech32
     */
    exports.BECH32_REGEX = /[\x21-\x7E]{1,83}1[023456789acdefghjklmnpqrstuvwxyz]{6,}/;
    function integerToUint8Array(number) {
        // Create a Uint8Array with enough space to hold a 32-bit integer (4 bytes).
        const uint8Array = new Uint8Array(4);
        // Use bitwise operations to extract the bytes.
        uint8Array[0] = (number >> 24) & 0xff; // Most significant byte (MSB)
        uint8Array[1] = (number >> 16) & 0xff;
        uint8Array[2] = (number >> 8) & 0xff;
        uint8Array[3] = number & 0xff; // Least significant byte (LSB)
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
                        pubkey: (0, utils_13.bytesToHex)(tlv[0][0]),
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
                        id: (0, utils_13.bytesToHex)(tlv[0][0]),
                        relays: tlv[1] ? tlv[1].map(d => exports.utf8Decoder.decode(d)) : [],
                        author: tlv[2]?.[0] ? (0, utils_13.bytesToHex)(tlv[2][0]) : undefined,
                        kind: tlv[3]?.[0] ? parseInt((0, utils_13.bytesToHex)(tlv[3][0]), 16) : undefined,
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
                        pubkey: (0, utils_13.bytesToHex)(tlv[2][0]),
                        kind: parseInt((0, utils_13.bytesToHex)(tlv[3][0]), 16),
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
                return { type: prefix, data: (0, utils_13.bytesToHex)(data) };
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
        let data = (0, utils_13.hexToBytes)(hex);
        return encodeBech32(prefix, data);
    }
    function nprofileEncode(profile) {
        let data = encodeTLV({
            0: [(0, utils_13.hexToBytes)(profile.pubkey)],
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
            0: [(0, utils_13.hexToBytes)(event.id)],
            1: (event.relays || []).map(url => exports.utf8Encoder.encode(url)),
            2: event.author ? [(0, utils_13.hexToBytes)(event.author)] : [],
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
            2: [(0, utils_13.hexToBytes)(addr.pubkey)],
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
        return (0, utils_13.concatBytes)(...entries);
    }
});
define("@scom/scom-social-sdk/core/index.ts", ["require", "exports", "@scom/scom-social-sdk/core/nostr/event.ts", "@scom/scom-social-sdk/core/nostr/keys.ts", "@scom/scom-social-sdk/core/nostr/nip19.ts", "@scom/scom-social-sdk/core/bech32.ts", "@scom/scom-social-sdk/core/curves/secp256k1.ts"], function (require, exports, Event, Keys, Nip19, Bech32, secp256k1_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.schnorr = exports.secp256k1 = exports.Bech32 = exports.Nip19 = exports.Keys = exports.Event = void 0;
    ///<amd-module name='@scom/scom-social-sdk/core/index.ts'/> 
    exports.Event = Event;
    exports.Keys = Keys;
    exports.Nip19 = Nip19;
    exports.Bech32 = Bech32;
    Object.defineProperty(exports, "secp256k1", { enumerable: true, get: function () { return secp256k1_3.secp256k1; } });
    Object.defineProperty(exports, "schnorr", { enumerable: true, get: function () { return secp256k1_3.schnorr; } });
});
///<amd-module name='@scom/scom-social-sdk/utils/interfaces.ts'/> 
define("@scom/scom-social-sdk/utils/interfaces.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CalendarEventType = exports.CommunityRole = exports.SubscriptionBundleType = exports.CampaignActivityType = exports.PaymentMethod = exports.PaymentModel = exports.ProtectedMembershipPolicyType = exports.MembershipType = exports.ScpStandardId = exports.TokenType = exports.NftType = void 0;
    var NftType;
    (function (NftType) {
        NftType["ERC721"] = "ERC721";
        NftType["ERC1155"] = "ERC1155";
    })(NftType = exports.NftType || (exports.NftType = {}));
    var TokenType;
    (function (TokenType) {
        TokenType["ERC20"] = "ERC20";
        TokenType["ERC721"] = "ERC721";
        TokenType["ERC1155"] = "ERC1155";
    })(TokenType = exports.TokenType || (exports.TokenType = {}));
    var ScpStandardId;
    (function (ScpStandardId) {
        ScpStandardId["Community"] = "1";
        ScpStandardId["CommunityPost"] = "2";
        ScpStandardId["Channel"] = "3";
        ScpStandardId["ChannelMessage"] = "4";
        ScpStandardId["GroupKeys"] = "5";
    })(ScpStandardId = exports.ScpStandardId || (exports.ScpStandardId = {}));
    var MembershipType;
    (function (MembershipType) {
        MembershipType["Open"] = "Open";
        MembershipType["Protected"] = "Protected";
    })(MembershipType = exports.MembershipType || (exports.MembershipType = {}));
    var ProtectedMembershipPolicyType;
    (function (ProtectedMembershipPolicyType) {
        ProtectedMembershipPolicyType["TokenExclusive"] = "TokenExclusive";
        ProtectedMembershipPolicyType["Whitelist"] = "Whitelist";
    })(ProtectedMembershipPolicyType = exports.ProtectedMembershipPolicyType || (exports.ProtectedMembershipPolicyType = {}));
    var PaymentModel;
    (function (PaymentModel) {
        PaymentModel["OneTimePurchase"] = "OneTimePurchase";
        PaymentModel["Subscription"] = "Subscription";
    })(PaymentModel = exports.PaymentModel || (exports.PaymentModel = {}));
    var PaymentMethod;
    (function (PaymentMethod) {
        PaymentMethod["EVM"] = "EVM";
        PaymentMethod["TON"] = "TON";
        PaymentMethod["Telegram"] = "Telegram";
    })(PaymentMethod = exports.PaymentMethod || (exports.PaymentMethod = {}));
    var CampaignActivityType;
    (function (CampaignActivityType) {
        CampaignActivityType["LuckySpin"] = "LuckySpin";
        CampaignActivityType["Quest"] = "Quest";
        CampaignActivityType["BlindBox"] = "BlindBox";
        CampaignActivityType["Quiz"] = "Quiz";
    })(CampaignActivityType = exports.CampaignActivityType || (exports.CampaignActivityType = {}));
    var SubscriptionBundleType;
    (function (SubscriptionBundleType) {
        SubscriptionBundleType["NoDiscount"] = "NoDiscount";
        SubscriptionBundleType["MinimumDuration"] = "MinimumDuration";
        SubscriptionBundleType["ValidityPeriod"] = "ValidityPeriod";
    })(SubscriptionBundleType = exports.SubscriptionBundleType || (exports.SubscriptionBundleType = {}));
    var CommunityRole;
    (function (CommunityRole) {
        CommunityRole["Creator"] = "creator";
        CommunityRole["Moderator"] = "moderator";
        CommunityRole["GeneralMember"] = "generalMember";
        CommunityRole["None"] = "none";
    })(CommunityRole = exports.CommunityRole || (exports.CommunityRole = {}));
    var CalendarEventType;
    (function (CalendarEventType) {
        CalendarEventType["DateBased"] = "dateBased";
        CalendarEventType["TimeBased"] = "timeBased";
    })(CalendarEventType = exports.CalendarEventType || (exports.CalendarEventType = {}));
});
define("@scom/scom-social-sdk/utils/index.ts", ["require", "exports", "@scom/scom-social-sdk/utils/interfaces.ts"], function (require, exports, interfaces_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    ///<amd-module name='@scom/scom-social-sdk/utils/index.ts'/> 
    __exportStar(interfaces_1, exports);
});
define("@scom/scom-social-sdk/managers/utilsManager.ts", ["require", "exports", "@ijstech/eth-wallet", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/index.ts", "@scom/scom-signer"], function (require, exports, eth_wallet_1, index_1, utils_14, scom_signer_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SocialUtilsManager = void 0;
    class SocialUtilsManager {
        static hexStringToUint8Array(hexString) {
            return new Uint8Array(hexString.match(/.{1,2}/g).map(byte => parseInt(byte, 16)));
        }
        static base64ToUtf8(base64) {
            if (typeof window !== "undefined") {
                return atob(base64);
            }
            else {
                // @ts-ignore
                return Buffer.from(base64, 'base64').toString('utf8');
            }
        }
        static utf8ToBase64(utf8) {
            if (typeof window !== "undefined") {
                return btoa(utf8);
            }
            else {
                // @ts-ignore
                return Buffer.from(utf8).toString('base64');
            }
        }
        static convertPrivateKeyToPubkey(privateKey) {
            if (!privateKey)
                return null;
            if (privateKey.startsWith('0x'))
                privateKey = privateKey.replace('0x', '');
            let pub = eth_wallet_1.Utils.padLeft(index_1.Keys.getPublicKey(privateKey), 64);
            return pub;
        }
        static async encryptMessage(ourPrivateKey, theirPublicKey, text) {
            const sharedSecret = index_1.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
            const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
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
                // @ts-ignore
                const crypto = require('crypto');
                const iv = crypto.randomBytes(16);
                const cipher = crypto.createCipheriv('aes-256-cbc', sharedX, iv);
                encryptedMessage = cipher.update(text, 'utf8', 'base64');
                encryptedMessage += cipher.final('base64');
                ivBase64 = iv.toString('base64');
            }
            return `${encryptedMessage}?iv=${ivBase64}`;
        }
        static async decryptMessage(ourPrivateKey, theirPublicKey, encryptedData) {
            let decryptedMessage = null;
            try {
                const [encryptedMessage, ivBase64] = encryptedData.split('?iv=');
                const sharedSecret = index_1.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
                const sharedX = SocialUtilsManager.hexStringToUint8Array(sharedSecret.slice(2));
                if (typeof window !== "undefined") {
                    const iv = Uint8Array.from(atob(ivBase64), c => c.charCodeAt(0));
                    const key = await crypto.subtle.importKey('raw', sharedX, { name: 'AES-CBC' }, false, ['decrypt']);
                    const decryptedBuffer = await crypto.subtle.decrypt({ name: 'AES-CBC', iv }, key, Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0)));
                    decryptedMessage = new TextDecoder().decode(decryptedBuffer);
                }
                else {
                    // @ts-ignore
                    const crypto = require('crypto');
                    // @ts-ignore
                    const iv = Buffer.from(ivBase64, 'base64');
                    const decipher = crypto.createDecipheriv('aes-256-cbc', sharedX, iv);
                    // @ts-ignore
                    let decrypted = decipher.update(Buffer.from(encryptedMessage, 'base64'));
                    // @ts-ignore
                    decrypted = Buffer.concat([decrypted, decipher.final()]);
                    decryptedMessage = decrypted.toString('utf8');
                }
            }
            catch (e) {
            }
            return decryptedMessage;
        }
        static pad(number) {
            return number < 10 ? '0' + number : number.toString();
        }
        static getGMTOffset(timezone) {
            let gmtOffset;
            try {
                const date = new Date();
                const utcDate = new Date(date.toLocaleString('en-US', { timeZone: 'UTC' }));
                const tzDate = new Date(date.toLocaleString('en-US', { timeZone: timezone }));
                const offset = (tzDate.getTime() - utcDate.getTime()) / (1000 * 60 * 60);
                const sign = offset < 0 ? '-' : '+';
                const absoluteOffset = Math.abs(offset);
                const hours = Math.floor(absoluteOffset);
                const minutes = (absoluteOffset - hours) * 60;
                gmtOffset = `GMT${sign}${this.pad(hours)}:${this.pad(minutes)}`;
            }
            catch (err) {
                console.error(err);
            }
            return gmtOffset;
        }
        static async exponentialBackoffRetry(fn, // Function to retry
        retries, // Maximum number of retries
        delay, // Initial delay duration in milliseconds
        maxDelay, // Maximum delay duration in milliseconds
        factor, // Exponential backoff factor
        stopCondition = () => true // Stop condition
        ) {
            let currentDelay = delay;
            for (let i = 0; i < retries; i++) {
                try {
                    const data = await fn();
                    if (stopCondition(data)) {
                        return data;
                    }
                    else {
                        console.log(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`);
                        await new Promise(resolve => setTimeout(resolve, currentDelay));
                        currentDelay = Math.min(maxDelay, currentDelay * factor);
                    }
                }
                catch (error) {
                    console.error('error', error);
                    console.log(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`);
                    await new Promise(resolve => setTimeout(resolve, currentDelay));
                    currentDelay = Math.min(maxDelay, currentDelay * factor);
                }
            }
            throw new Error(`Failed after ${retries} retries`);
        }
        static getCommunityUri(creatorId, communityId) {
            const decodedPubkey = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
            return `34550:${decodedPubkey}:${communityId}`;
        }
        static getMarketplaceStallUri(creatorId, stallId) {
            const decodedPubkey = creatorId.startsWith('npub1') ? index_1.Nip19.decode(creatorId).data : creatorId;
            return `30018:${decodedPubkey}:${stallId}`;
        }
        static getCommunityBasicInfoFromUri(communityUri) {
            const parts = communityUri.split(':');
            return {
                creatorId: parts[1],
                communityId: parts[2]
            };
        }
        static extractCommunityInfo(event) {
            const communityId = event.tags.find(tag => tag[0] === 'd')?.[1];
            const description = event.tags.find(tag => tag[0] === 'description')?.[1];
            const rules = event.tags.find(tag => tag[0] === 'rules')?.[1];
            const image = event.tags.find(tag => tag[0] === 'image')?.[1];
            const avatar = event.tags.find(tag => tag[0] === 'avatar')?.[1];
            const privateRelay = event.tags.find(tag => tag[0] === 'private_relay')?.[1];
            const creatorId = index_1.Nip19.npubEncode(event.pubkey);
            const moderatorIds = event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'moderator').map(tag => index_1.Nip19.npubEncode(tag[1]));
            const scpTag = event.tags.find(tag => tag[0] === 'scp');
            const enableLeaderboard = event.tags.some(tag => tag[0] === 'leaderboard');
            const parentCommunityUri = event.tags.find(tag => tag[0] === 'a')?.[1];
            let policies = [];
            let scpData;
            let gatekeeperNpub;
            let membershipType = utils_14.MembershipType.Open;
            let telegramBotUsername;
            let data = {};
            if (event.content) {
                try {
                    data = JSON.parse(event.content);
                }
                catch {
                    data = {};
                }
            }
            let pointSystem, collectibles, campaigns, postStatusOptions;
            if (scpTag && scpTag[1] === '1') {
                membershipType = utils_14.MembershipType.Protected;
                if (Array.isArray(data)) {
                    policies = data;
                }
                else {
                    if (data.policies) {
                        for (let policy of data.policies) {
                            let paymentMethod;
                            if (policy.paymentMethod) {
                                paymentMethod = policy.paymentMethod;
                            }
                            else if (policy.chainId) {
                                paymentMethod = utils_14.PaymentMethod.EVM;
                            }
                            else {
                                paymentMethod = policy.currency === 'TON' ? utils_14.PaymentMethod.TON : utils_14.PaymentMethod.Telegram;
                            }
                            policies.push({
                                ...policy,
                                paymentMethod
                            });
                        }
                    }
                }
                const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
                if (!scpDataStr.startsWith('$scp:'))
                    return null;
                scpData = JSON.parse(scpDataStr.substring(5));
                if (scpData.gatekeeperPublicKey) {
                    gatekeeperNpub = index_1.Nip19.npubEncode(scpData.gatekeeperPublicKey);
                }
            }
            if (!Array.isArray(data)) {
                telegramBotUsername = data.telegramBotUsername;
                pointSystem = data.pointSystem;
                collectibles = data.collectibles;
                campaigns = data.campaigns;
                postStatusOptions = data.postStatuses?.length > 0 && typeof data.postStatuses[0] === 'string' ? data.postStatuses.map(status => ({ status })) : data.postStatuses;
            }
            const communityUri = SocialUtilsManager.getCommunityUri(creatorId, communityId);
            let communityInfo = {
                creatorId,
                moderatorIds,
                communityUri,
                communityId,
                description,
                rules,
                bannerImgUrl: image,
                avatarImgUrl: avatar,
                scpData,
                eventData: event,
                gatekeeperNpub,
                membershipType,
                telegramBotUsername,
                privateRelay,
                policies,
                pointSystem,
                collectibles,
                campaigns,
                enableLeaderboard,
                parentCommunityUri,
                postStatusOptions
            };
            return communityInfo;
        }
        static extractBookmarkedCommunities(event, excludedCommunity) {
            const communities = [];
            const communityUriArr = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
            for (let communityUri of communityUriArr) {
                const basicInfo = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                if (excludedCommunity) {
                    const decodedPubkey = index_1.Nip19.decode(excludedCommunity.creatorId).data;
                    if (basicInfo.communityId === excludedCommunity.communityId && basicInfo.creatorId === decodedPubkey)
                        continue;
                }
                communities.push({
                    communityId: basicInfo.communityId,
                    creatorId: basicInfo.creatorId
                });
            }
            return communities;
        }
        static extractBookmarkedChannels(event) {
            const channelEventIds = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
            return channelEventIds;
        }
        static extractScpData(event, standardId) {
            const scpTag = event.tags.find(tag => tag[0] === 'scp');
            let scpData;
            if (scpTag && scpTag[1] === standardId) {
                const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
                if (!scpDataStr.startsWith('$scp:'))
                    return null;
                scpData = JSON.parse(scpDataStr.substring(5));
            }
            return scpData;
        }
        static parseContent(content) {
            try {
                return JSON.parse(content);
            }
            catch (err) {
                console.log('Error parsing content', content);
            }
            ;
        }
        static extractChannelInfo(event) {
            const content = this.parseContent(event.content);
            let eventId;
            if (event.kind === 40) {
                eventId = event.id;
            }
            else if (event.kind === 41) {
                eventId = event.tags.find(tag => tag[0] === 'e')?.[1];
            }
            if (!eventId)
                return null;
            let scpData = this.extractScpData(event, utils_14.ScpStandardId.Channel);
            let channelInfo = {
                id: eventId,
                name: content.name,
                about: content.about,
                picture: content.picture,
                scpData,
                eventData: event,
            };
            return channelInfo;
        }
        static constructAuthHeader(privateKey) {
            if (!privateKey)
                return null;
            const pubkey = index_1.Keys.getPublicKey(privateKey);
            const signature = scom_signer_1.Signer.getSignature({ pubkey }, privateKey, { pubkey: 'string' });
            const authHeader = `Bearer ${pubkey}:${signature}`;
            return authHeader;
        }
        static constructUserProfile(metadata, followersCountMap) {
            const followersCount = followersCountMap?.[metadata.pubkey] || 0;
            const encodedPubkey = index_1.Nip19.npubEncode(metadata.pubkey);
            const metadataContent = metadata.content;
            const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
            let userProfile = {
                id: encodedPubkey,
                username: metadataContent.username || metadataContent.name,
                description: metadataContent.about,
                avatar: metadataContent.picture,
                npub: encodedPubkey,
                pubkey: metadata.pubkey,
                displayName: metadataContent.display_name || metadataContent.displayName || metadataContent.name,
                internetIdentifier,
                website: metadataContent.website,
                banner: metadataContent.banner,
                followers: followersCount,
                lud16: metadataContent.lud16,
                ethWallet: metadataContent.eth_wallet,
                telegramAccount: metadataContent.telegram_account,
                metadata,
            };
            return userProfile;
        }
        //FIXME: remove this when compiler is fixed
        static flatMap(array, callback) {
            return array.reduce((acc, item) => {
                return acc.concat(callback(item));
            }, []);
        }
    }
    exports.SocialUtilsManager = SocialUtilsManager;
});
define("@scom/scom-social-sdk/managers/communication.ts", ["require", "exports", "@scom/scom-social-sdk/managers/utilsManager.ts"], function (require, exports, utilsManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrWebSocketManager = exports.NostrRestAPIManager = void 0;
    function determineWebSocketType() {
        if (typeof window !== "undefined") {
            return WebSocket;
        }
        else {
            // @ts-ignore
            let WebSocket = require('ws');
            return WebSocket;
        }
        ;
    }
    ;
    class NostrRestAPIManager {
        constructor(url) {
            this.requestCallbackMap = {};
            this._url = url;
        }
        get url() {
            return this._url;
        }
        set url(url) {
            this._url = url;
        }
        async fetchEvents(...requests) {
            try {
                const response = await fetch(`${this._url}/fetch-events`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        requests: [...requests]
                    })
                });
                const data = await response.json();
                return data;
            }
            catch (error) {
                console.error('Error fetching events:', error);
                throw error;
            }
        }
        async fetchEventsFromAPI(endpoint, msg, authHeader) {
            try {
                const requestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(msg)
                };
                if (authHeader) {
                    requestInit.headers['Authorization'] = authHeader;
                }
                const response = await fetch(`${this._url}/${endpoint}`, requestInit);
                let result = await response.json();
                if (result.requestId) {
                    let requestId = result.requestId;
                    const pollFunction = async () => {
                        const pollRequestInit = {
                            method: 'GET',
                            headers: {
                                'Content-Type': 'application/json'
                            }
                        };
                        if (authHeader) {
                            pollRequestInit.headers['Authorization'] = authHeader;
                        }
                        const pollResponse = await fetch(`${this._url}/poll/${requestId}`, pollRequestInit);
                        const pollResult = await pollResponse.json();
                        return pollResult;
                    };
                    const stopPolling = (pollResult) => {
                        return !!pollResult?.data;
                    };
                    const pollResult = await utilsManager_1.SocialUtilsManager.exponentialBackoffRetry(pollFunction, 10, 200, 10000, 2, stopPolling);
                    console.log('pollResult', pollResult);
                    result = pollResult.data;
                }
                return result;
            }
            catch (error) {
                console.error('Error fetching events:', error);
                throw error;
            }
        }
        async fetchCachedEvents(eventType, msg) {
            const events = await this.fetchEvents({
                cache: [
                    eventType,
                    msg
                ]
            });
            return events;
        }
        async submitEvent(event, authHeader) {
            try {
                const requestInit = {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(event)
                };
                if (authHeader) {
                    requestInit.headers['Authorization'] = authHeader;
                }
                const response = await fetch(`${this._url}/submit-event`, requestInit);
                const data = await response.json();
                return {
                    ...data,
                    relay: this.url
                };
            }
            catch (error) {
                console.error('Error submitting event:', error);
                throw error;
            }
        }
    }
    exports.NostrRestAPIManager = NostrRestAPIManager;
    class NostrWebSocketManager {
        constructor(url) {
            this.requestCallbackMap = {};
            this._url = url;
            this.messageListenerBound = this.messageListener.bind(this);
        }
        get url() {
            return this._url;
        }
        set url(url) {
            this._url = url;
        }
        generateRandomNumber() {
            let randomNumber = '';
            for (let i = 0; i < 10; i++) {
                randomNumber += Math.floor(Math.random() * 10).toString();
            }
            return randomNumber;
        }
        messageListener(event) {
            const messageStr = event.data.toString();
            const message = JSON.parse(messageStr);
            let requestId = message[1];
            if (message[0] === 'EOSE' || message[0] === 'OK') {
                if (this.requestCallbackMap[requestId]) {
                    this.requestCallbackMap[requestId](message);
                    delete this.requestCallbackMap[requestId];
                }
            }
            else if (message[0] === 'EVENT') {
                if (this.requestCallbackMap[requestId]) {
                    this.requestCallbackMap[requestId](message);
                }
            }
        }
        establishConnection(requestId, cb) {
            const WebSocket = determineWebSocketType();
            this.requestCallbackMap[requestId] = cb;
            return new Promise((resolve, reject) => {
                const openListener = () => {
                    this.ws.removeEventListener('open', openListener);
                    resolve({ ws: this.ws, error: null });
                };
                if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                    this.ws = new WebSocket(this._url);
                    this.ws.addEventListener('open', openListener);
                    this.ws.addEventListener('message', this.messageListenerBound);
                    this.ws.addEventListener('close', () => {
                        this.requestCallbackMap = {};
                        resolve({ ws: null, error: 'Disconnected from server' });
                    });
                    this.ws.addEventListener('error', (error) => {
                        resolve({ ws: null, error });
                    });
                }
                else {
                    if (this.ws.readyState === WebSocket.OPEN) {
                        resolve({ ws: this.ws, error: null });
                    }
                    else {
                        this.ws.addEventListener('open', openListener);
                    }
                }
            });
        }
        async fetchEvents(...requests) {
            let requestId;
            do {
                requestId = this.generateRandomNumber();
            } while (this.requestCallbackMap[requestId]);
            return new Promise(async (resolve, reject) => {
                let events = [];
                const { ws, error } = await this.establishConnection(requestId, (message) => {
                    if (message[0] === "EVENT") {
                        const eventData = message[2];
                        // Implement the verifySignature function according to your needs
                        // console.log(verifySignature(eventData)); // true
                        events.push(eventData);
                    }
                    else if (message[0] === "EOSE") {
                        resolve({
                            events
                        });
                    }
                });
                if (error) {
                    resolve({
                        error: 'Error establishing connection'
                    });
                }
                else if (ws) {
                    ws.send(JSON.stringify(["REQ", requestId, ...requests]));
                }
                else {
                    resolve({
                        error: 'Error establishing connection'
                    });
                }
            });
        }
        async fetchCachedEvents(eventType, msg) {
            const events = await this.fetchEvents({
                cache: [
                    eventType,
                    msg
                ]
            });
            return events;
        }
        async submitEvent(event) {
            return new Promise(async (resolve, reject) => {
                let msg = JSON.stringify(["EVENT", event]);
                const { ws, error } = await this.establishConnection(event.id, (message) => {
                    resolve({
                        success: message[2],
                        message: message[3],
                        relay: this.url
                    });
                });
                if (error) {
                    resolve({
                        success: false,
                        message: error,
                        relay: this.url
                    });
                }
                else if (ws) {
                    ws.send(msg);
                }
            });
        }
    }
    exports.NostrWebSocketManager = NostrWebSocketManager;
});
define("@scom/scom-social-sdk/managers/eventManagerWrite.ts", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/index.ts", "@scom/scom-social-sdk/managers/utilsManager.ts"], function (require, exports, index_2, utils_15, utilsManager_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrEventManagerWrite = void 0;
    function convertUnixTimestampToDate(timestamp) {
        const date = new Date(timestamp * 1000);
        const year = date.getFullYear();
        const month = ("0" + (date.getMonth() + 1)).slice(-2);
        const day = ("0" + date.getDate()).slice(-2);
        return `${year}-${month}-${day}`;
    }
    class NostrEventManagerWrite {
        constructor(managers, mainRelay) {
            this._nostrCommunicationManagers = [];
            this._nostrCommunicationManagers = managers;
            this._mainNostrRestAPIManager = managers.find(manager => manager.url === mainRelay);
        }
        set nostrCommunicationManagers(managers) {
            this._nostrCommunicationManagers = managers;
        }
        set privateKey(privateKey) {
            this._privateKey = privateKey;
        }
        calculateConversationPathTags(conversationPath) {
            let tags = [];
            for (let i = 0; i < conversationPath.noteIds.length; i++) {
                const noteId = conversationPath.noteIds[i];
                const decodedNoteId = noteId.startsWith('note1') ? index_2.Nip19.decode(noteId).data : noteId;
                let tagItem;
                if (i === 0) {
                    tagItem = [
                        "e",
                        decodedNoteId,
                        "",
                        "root"
                    ];
                }
                else if (i === conversationPath.noteIds.length - 1) {
                    tagItem = [
                        "e",
                        decodedNoteId,
                        "",
                        "reply"
                    ];
                }
                else {
                    tagItem = [
                        "e",
                        decodedNoteId
                    ];
                }
                tags.push(tagItem);
            }
            for (let authorId of conversationPath.authorIds) {
                const decodedAuthorId = authorId.startsWith('npub1') ? index_2.Nip19.decode(authorId).data : authorId;
                tags.push([
                    "p",
                    decodedAuthorId
                ]);
            }
            return tags;
        }
        async handleEventSubmission(event, options) {
            let mainRelayOnly = options?.mainRelayOnly;
            let privateKey = options?.privateKey || this._privateKey;
            const verifiedEvent = index_2.Event.finishEvent(event, privateKey);
            const authHeader = utilsManager_2.SocialUtilsManager.constructAuthHeader(this._privateKey);
            const response = await this._mainNostrRestAPIManager.submitEvent(verifiedEvent, authHeader);
            if (response.success) {
                if (!mainRelayOnly) {
                    const otherRelays = this._nostrCommunicationManagers.filter(manager => manager.url !== this._mainNostrRestAPIManager.url);
                    setTimeout(async () => {
                        try {
                            await Promise.all(otherRelays.map(manager => manager.submitEvent(verifiedEvent, authHeader)));
                        }
                        catch (error) {
                            console.error('Error submitting to other relays:', error);
                        }
                    });
                }
            }
            return {
                event: verifiedEvent,
                relayResponse: response
            };
        }
        async updateContactList(content, contactPubKeys) {
            let event = {
                "kind": 3,
                "created_at": Math.round(Date.now() / 1000),
                "content": content,
                "tags": []
            };
            for (let contactPubKey of contactPubKeys) {
                event.tags.push([
                    "p",
                    contactPubKey
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async postNote(content, conversationPath, createdAt) {
            let event = {
                "kind": 1,
                "created_at": createdAt !== undefined ? createdAt : Math.round(Date.now() / 1000),
                "content": content,
                "tags": []
            };
            if (conversationPath) {
                const conversationPathTags = this.calculateConversationPathTags(conversationPath);
                event.tags = conversationPathTags;
            }
            // const noteId = Nip19.noteEncode(verifiedEvent.id);
            // return noteId;
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async deleteEvents(eventIds) {
            let event = {
                "kind": 5,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": []
            };
            for (let eventId of eventIds) {
                const decodedEventId = eventId.startsWith('note1') ? index_2.Nip19.decode(eventId).data : eventId;
                event.tags.push([
                    "e",
                    decodedEventId
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateChannel(info) {
            let kind = info.id ? 41 : 40;
            let event = {
                "kind": kind,
                "created_at": Math.round(Date.now() / 1000),
                "content": JSON.stringify({
                    name: info.name,
                    about: info.about,
                    picture: info.picture
                }),
                "tags": []
            };
            if (info.id) {
                event.tags.push([
                    "e",
                    info.id
                ]);
            }
            if (info.scpData) {
                let encodedScpData = utilsManager_2.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    utils_15.ScpStandardId.Channel,
                    encodedScpData
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateUserBookmarkedChannels(channelEventIds) {
            let event = {
                "kind": 30001,
                "created_at": Math.round(Date.now() / 1000),
                "content": '',
                "tags": [
                    [
                        "d",
                        "channels"
                    ]
                ]
            };
            for (let channelEventId of channelEventIds) {
                event.tags.push([
                    "a",
                    channelEventId
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateCommunity(info) {
            const data = {
                pointSystem: info.pointSystem,
                collectibles: info.collectibles,
                telegramBotUsername: info.telegramBotUsername,
            };
            if (info.membershipType === utils_15.MembershipType.Protected) {
                data.policies = [];
                for (let policy of info.policies) {
                    const memberIds = policy.memberIds?.map(memberId => {
                        return memberId.startsWith('npub1') ? index_2.Nip19.decode(memberId).data : memberId;
                    });
                    data.policies.push({
                        ...policy,
                        memberIds
                    });
                }
            }
            if (info.postStatusOptions?.length > 0) {
                data.postStatuses = info.postStatusOptions;
            }
            if (info.campaigns?.length > 0) {
                data.campaigns = info.campaigns;
            }
            const isEmptyObject = JSON.stringify(data) === "{}";
            const content = isEmptyObject ? "" : JSON.stringify(data);
            let event = {
                "kind": 34550,
                "created_at": Math.round(Date.now() / 1000),
                "content": content,
                "tags": [
                    [
                        "d",
                        info.communityId
                    ],
                    [
                        "description",
                        info.description
                    ]
                ]
            };
            if (info.bannerImgUrl) {
                event.tags.push([
                    "image",
                    info.bannerImgUrl
                ]);
            }
            if (info.avatarImgUrl) {
                event.tags.push([
                    "avatar",
                    info.avatarImgUrl
                ]);
            }
            if (info.rules) {
                event.tags.push([
                    "rules",
                    info.rules
                ]);
            }
            if (info.privateRelay) {
                event.tags.push([
                    "private_relay",
                    info.privateRelay
                ]);
            }
            if (info.scpData) {
                let encodedScpData = utilsManager_2.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    utils_15.ScpStandardId.Community,
                    encodedScpData
                ]);
            }
            for (let moderatorId of info.moderatorIds) {
                const decodedModeratorId = moderatorId.startsWith('npub1') ? index_2.Nip19.decode(moderatorId).data : moderatorId;
                event.tags.push([
                    "p",
                    decodedModeratorId,
                    "",
                    "moderator"
                ]);
            }
            if (info.enableLeaderboard) {
                event.tags.push([
                    "leaderboard",
                    "true"
                ]);
            }
            if (info.parentCommunityUri) {
                event.tags.push([
                    "a",
                    info.parentCommunityUri
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateUserBookmarkedCommunities(communities) {
            let communityUriArr = [];
            for (let community of communities) {
                const communityUri = utilsManager_2.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
                communityUriArr.push(communityUri);
            }
            let event = {
                "kind": 30001,
                "created_at": Math.round(Date.now() / 1000),
                "content": '',
                "tags": [
                    [
                        "d",
                        "communities"
                    ]
                ]
            };
            for (let communityUri of communityUriArr) {
                event.tags.push([
                    "a",
                    communityUri
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async submitCommunityPost(info) {
            const community = info.community;
            const communityUri = utilsManager_2.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
            let event = {
                "kind": 1,
                "created_at": info.timestamp || Math.round(Date.now() / 1000),
                "content": info.message,
                "tags": []
            };
            if (info.scpData) {
                let encodedScpData = utilsManager_2.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    utils_15.ScpStandardId.CommunityPost,
                    encodedScpData
                ]);
            }
            if (info.conversationPath) {
                const conversationPathTags = this.calculateConversationPathTags(info.conversationPath);
                event.tags.push(...conversationPathTags);
            }
            else {
                event.tags.push([
                    "a",
                    communityUri,
                    "",
                    "root"
                ]);
            }
            if (info.alt) {
                event.tags.push([
                    "alt",
                    info.alt
                ]);
            }
            console.log('submitCommunityPost', event);
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async submitChannelMessage(info) {
            let event = {
                "kind": 42,
                "created_at": Math.round(Date.now() / 1000),
                "content": info.message,
                "tags": []
            };
            if (info.scpData) {
                let encodedScpData = utilsManager_2.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    utils_15.ScpStandardId.ChannelMessage,
                    encodedScpData
                ]);
            }
            if (info.conversationPath) {
                const conversationPathTags = this.calculateConversationPathTags(info.conversationPath);
                event.tags.push(...conversationPathTags);
            }
            else {
                event.tags.push([
                    "e",
                    info.channelId,
                    "",
                    "root"
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateUserProfile(content) {
            let event = {
                "kind": 0,
                "created_at": Math.round(Date.now() / 1000),
                "content": JSON.stringify(content),
                "tags": []
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async sendMessage(receiver, encryptedMessage, replyToEventId) {
            const decodedPubKey = receiver.startsWith('npub1') ? index_2.Nip19.decode(receiver).data : receiver;
            let event = {
                "kind": 4,
                "created_at": Math.round(Date.now() / 1000),
                "content": encryptedMessage,
                "tags": [
                    [
                        'p',
                        decodedPubKey
                    ]
                ]
            };
            if (replyToEventId) {
                event.tags.push(['e', replyToEventId]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async sendTempMessage(options) {
            const { receiver, encryptedMessage, replyToEventId, widgetId } = options;
            const decodedPubKey = receiver.startsWith('npub1') ? index_2.Nip19.decode(receiver).data : receiver;
            let event = {
                "kind": 20004,
                "created_at": Math.round(Date.now() / 1000),
                "content": encryptedMessage,
                "tags": [
                    [
                        'p',
                        decodedPubKey
                    ]
                ]
            };
            if (replyToEventId) {
                event.tags.push(['e', replyToEventId]);
            }
            if (widgetId) {
                event.tags.push(['w', widgetId]);
            }
            const result = await this.handleEventSubmission(event, {
                mainRelayOnly: true
            });
            return result;
        }
        async updateGroupKeys(identifier, groupKind, keys, invitees) {
            let event = {
                "kind": 30078,
                "created_at": Math.round(Date.now() / 1000),
                "content": keys,
                "tags": [
                    [
                        "d",
                        identifier
                    ],
                    [
                        "k",
                        groupKind.toString()
                    ],
                    [
                        "scp",
                        utils_15.ScpStandardId.GroupKeys
                    ]
                ]
            };
            for (let invitee of invitees) {
                const decodedInvitee = invitee.startsWith('npub1') ? index_2.Nip19.decode(invitee).data : invitee;
                event.tags.push([
                    "p",
                    decodedInvitee,
                    "",
                    "invitee"
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateCalendarEvent(info) {
            let kind;
            let start;
            let end;
            if (info.type === utils_15.CalendarEventType.DateBased) {
                kind = 31922;
                start = convertUnixTimestampToDate(info.start);
            }
            else {
                kind = 31923;
                start = info.start.toString();
            }
            let event = {
                "kind": kind,
                "created_at": Math.round(Date.now() / 1000),
                "content": info.description,
                "tags": [
                    [
                        "d",
                        info.id
                    ],
                    [
                        "title",
                        info.title
                    ],
                    [
                        "start",
                        start
                    ],
                    [
                        "location",
                        info.location
                    ],
                    [
                        "g",
                        info.geohash
                    ]
                ]
            };
            if (info.image) {
                event.tags.push([
                    "image",
                    info.image
                ]);
            }
            if (info.end) {
                if (info.type === utils_15.CalendarEventType.DateBased) {
                    end = convertUnixTimestampToDate(info.end);
                }
                else {
                    end = info.end.toString();
                }
                event.tags.push([
                    "end",
                    end
                ]);
            }
            if (info.startTzid) {
                event.tags.push([
                    "start_tzid",
                    info.startTzid
                ]);
            }
            if (info.endTzid) {
                event.tags.push([
                    "end_tzid",
                    info.endTzid
                ]);
            }
            if (info.hostIds) {
                for (let hostId of info.hostIds) {
                    const decodedHostId = hostId.startsWith('npub1') ? index_2.Nip19.decode(hostId).data : hostId;
                    event.tags.push([
                        "p",
                        decodedHostId,
                        "",
                        "host"
                    ]);
                }
            }
            if (info.city) {
                event.tags.push([
                    "city",
                    info.city
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async createCalendarEventRSVP(rsvpId, calendarEventUri, accepted) {
            let event = {
                "kind": 31925,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": [
                    [
                        "d",
                        rsvpId
                    ],
                    [
                        "a",
                        calendarEventUri
                    ],
                    [
                        "L",
                        "status"
                    ],
                    [
                        "l",
                        accepted ? "accepted" : "declined",
                        "status"
                    ]
                ]
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async submitCalendarEventPost(info) {
            let event = {
                "kind": 1,
                "created_at": Math.round(Date.now() / 1000),
                "content": info.message,
                "tags": []
            };
            if (info.conversationPath) {
                const conversationPathTags = this.calculateConversationPathTags(info.conversationPath);
                event.tags.push(...conversationPathTags);
            }
            else {
                event.tags.push([
                    "a",
                    info.calendarEventUri,
                    "",
                    "root"
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async submitLongFormContentEvents(info) {
            let hashtags = [];
            if (info.hashtags?.length > 0) {
                hashtags = info.hashtags.map(tag => ["t", tag]);
            }
            let event = {
                "kind": 1,
                "created_at": info.createdAt || Math.round(Date.now() / 1000),
                "content": info.content,
                "tags": [
                    [
                        "d",
                        info.id
                    ],
                    [
                        "c",
                        "md"
                    ],
                    [
                        "content",
                        info.markdownContent
                    ],
                    ...hashtags
                ]
            };
            if (info.title) {
                event.tags.push([
                    "title",
                    info.title
                ]);
            }
            if (info.image) {
                event.tags.push([
                    "image",
                    info.image
                ]);
            }
            if (info.summary) {
                event.tags.push([
                    "summary",
                    info.summary
                ]);
            }
            if (info.publishedAt) {
                event.tags.push([
                    "published_at",
                    info.publishedAt.toString()
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async submitLike(tags) {
            let event = {
                "kind": 7,
                "created_at": Math.round(Date.now() / 1000),
                "content": "+",
                "tags": tags
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async submitRepost(content, tags) {
            let event = {
                "kind": 6,
                "created_at": Math.round(Date.now() / 1000),
                "content": content,
                "tags": tags
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateRelayList(relays) {
            let event = {
                "kind": 10002,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": []
            };
            for (let url in relays) {
                const { read, write } = relays[url];
                if (!read && !write)
                    continue;
                const tag = [
                    "r",
                    url
                ];
                if (!read || !write)
                    tag.push(read ? 'read' : 'write');
                event.tags.push(tag);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async createPaymentRequestEvent(paymentRequest, amount, comment, isLightningInvoice) {
            let hash = index_2.Event.getPaymentRequestHash(paymentRequest);
            let event = {
                "kind": 9739,
                "created_at": Math.round(Date.now() / 1000),
                "content": comment,
                "tags": [
                    [
                        "r",
                        hash
                    ],
                    [
                        isLightningInvoice ? "bolt11" : "payreq",
                        paymentRequest
                    ],
                    [
                        "amount",
                        amount
                    ]
                ]
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async createPaymentReceiptEvent(requestEventId, recipient, comment, preimage, tx) {
            let event = {
                "kind": 9740,
                "created_at": Math.round(Date.now() / 1000),
                "content": comment,
                "tags": [
                    [
                        "e",
                        requestEventId
                    ],
                    [
                        "p",
                        recipient
                    ],
                ]
            };
            if (preimage) {
                event.tags.push([
                    "preimage",
                    preimage
                ]);
            }
            if (tx) {
                event.tags.push([
                    "tx",
                    tx
                ]);
            }
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateCommunityPinnedNotes(creatorId, communityId, eventIds) {
            const communityUri = utilsManager_2.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            let tags = eventIds.map(id => ["e", id]);
            let event = {
                "kind": 9741,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": [
                    [
                        "a",
                        communityUri
                    ],
                    ...tags
                ]
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateUserPinnedNotes(eventIds) {
            let tags = eventIds.map(id => ["e", id]);
            let event = {
                "kind": 10001,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": tags
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateUserBookmarks(tags) {
            let event = {
                "kind": 10003,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": [...tags]
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateUserEthWalletAccountsInfo(options, privateKey) {
            let event = {
                "kind": 9742,
                "created_at": Math.round(Date.now() / 1000),
                "content": JSON.stringify({
                    "master_wallet_signature": options.masterWalletSignature,
                    "social_wallet_signature": options.socialWalletSignature,
                    "encrypted_key": options.encryptedKey
                }),
                "tags": [
                    [
                        "d",
                        options.masterWalletHash
                    ]
                ]
            };
            const result = await this.handleEventSubmission(event, {
                privateKey
            });
            return result;
        }
        async updateNoteStatus(noteId, status) {
            let event = {
                "kind": 1985,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": [
                    [
                        "L",
                        "status"
                    ],
                    [
                        "l",
                        status,
                        "status"
                    ],
                    [
                        "e",
                        noteId
                    ]
                ]
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateCommunityStall(creatorId, communityId, stall) {
            const communityUri = utilsManager_2.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            let event = {
                "kind": 30017,
                "created_at": Math.round(Date.now() / 1000),
                "content": JSON.stringify(stall),
                "tags": [
                    [
                        "d",
                        stall.id
                    ],
                    [
                        "a",
                        communityUri
                    ]
                ]
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
        async updateCommunityProduct(creatorId, communityId, product) {
            const communityUri = utilsManager_2.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            const stallUri = utilsManager_2.SocialUtilsManager.getMarketplaceStallUri(creatorId, product.stallId);
            const productContent = JSON.stringify({
                id: product.id,
                stall_id: product.stallId,
                name: product.name,
                description: product.description,
                images: product.images,
                currency: product.currency,
                price: product.price,
                quantity: product.quantity,
                specs: product.specs,
                shipping: product.shipping
            });
            let event = {
                "kind": 30018,
                "created_at": Math.round(Date.now() / 1000),
                "content": productContent,
                "tags": [
                    [
                        "d",
                        product.id
                    ],
                    [
                        "a",
                        stallUri
                    ],
                    [
                        "a",
                        communityUri
                    ]
                ]
            };
            const result = await this.handleEventSubmission(event);
            return result;
        }
    }
    exports.NostrEventManagerWrite = NostrEventManagerWrite;
});
define("@scom/scom-social-sdk/managers/eventManagerRead.ts", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/index.ts", "@scom/scom-social-sdk/managers/utilsManager.ts"], function (require, exports, index_3, utils_16, utilsManager_3) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrEventManagerRead = void 0;
    class NostrEventManagerRead {
        constructor(manager) {
            this._nostrCommunicationManager = manager;
        }
        set nostrCommunicationManager(manager) {
            this._nostrCommunicationManager = manager;
        }
        set privateKey(privateKey) {
            this._privateKey = privateKey;
        }
        async fetchThreadCacheEvents(options) {
            const { id, pubKey } = options;
            let decodedId = id.startsWith('note1') ? index_3.Nip19.decode(id).data : id;
            let msg = {
                event_id: decodedId,
                limit: 100
            };
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
                msg.user_pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('thread_view', msg);
            return fetchEventsResponse.events;
        }
        async fetchTrendingCacheEvents(options) {
            const { pubKey } = options;
            let msg = {};
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
                msg.user_pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('explore_global_trending_24h', msg);
            return fetchEventsResponse.events;
        }
        async fetchProfileFeedCacheEvents(options) {
            let { pubKey, since, until, userPubkey } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                limit: 20,
                notes: "authored",
                pubkey: decodedPubKey
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            if (userPubkey) {
                const decodedUserPubKey = userPubkey.startsWith('npub1') ? index_3.Nip19.decode(userPubkey).data : userPubkey;
                msg.user_pubkey = decodedUserPubKey;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchProfileRepliesCacheEvents(options) {
            let { pubKey, since, until, userPubkey } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                limit: 20,
                notes: "replies",
                pubkey: decodedPubKey
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            if (userPubkey) {
                const decodedUserPubKey = userPubkey.startsWith('npub1') ? index_3.Nip19.decode(userPubkey).data : userPubkey;
                msg.user_pubkey = decodedUserPubKey;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchHomeFeedCacheEvents(options) {
            let { since, until, pubKey } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let msg = {
                limit: 20
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            msg.pubkey = index_3.Nip19.decode('npub1nfgqmnxqsjsnsvc2r5djhcx4ap3egcjryhf9ppxnajskfel2dx9qq6mnsp').data; //FIXME: Account to show Nostr highlights 
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
                msg.user_pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchUserProfileCacheEvents(options) {
            const { pubKeys } = options;
            if (!pubKeys || pubKeys.length === 0)
                return [];
            const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey);
            let msg = {
                pubkeys: decodedPubKeys
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_infos', msg);
            return fetchEventsResponse.events;
        }
        async fetchUserProfileDetailEvents(options) {
            const { pubKey } = options;
            if (!pubKey)
                return [];
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey,
                user_pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_profile', msg);
            return fetchEventsResponse.events;
        }
        async fetchContactListCacheEvents(options) {
            const { pubKey, detailIncluded } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                extended_response: detailIncluded,
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('contact_list', msg);
            return fetchEventsResponse.events;
        }
        async fetchUserRelays(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_user_relays', msg);
            return fetchEventsResponse.events;
        }
        async fetchFollowersCacheEvents(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_followers', msg);
            return fetchEventsResponse.events;
        }
        async fetchCommunities(options) {
            const { pubkeyToCommunityIdsMap } = options;
            let events;
            if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                let requests = [];
                for (let pubkey in pubkeyToCommunityIdsMap) {
                    const decodedPubKey = pubkey.startsWith('npub1') ? index_3.Nip19.decode(pubkey).data : pubkey;
                    const communityIds = pubkeyToCommunityIdsMap[pubkey];
                    let request = {
                        kinds: [34550],
                        authors: [decodedPubKey],
                        "#d": communityIds
                    };
                    requests.push(request);
                }
                const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(...requests);
                events = fetchEventsResponse.events;
            }
            else {
                let request = {
                    kinds: [34550],
                    limit: 50
                };
                const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
                events = fetchEventsResponse.events;
            }
            return events;
        }
        async fetchAllUserRelatedCommunities(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let requestForCreatedCommunities = {
                kinds: [34550],
                authors: [decodedPubKey]
            };
            let requestForFollowedCommunities = {
                kinds: [30001],
                "#d": ["communities"],
                authors: [decodedPubKey]
            };
            let requestForModeratedCommunities = {
                kinds: [34550],
                "#p": [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForCreatedCommunities, requestForFollowedCommunities, requestForModeratedCommunities);
            let communitiesEvents = [];
            const pubkeyToCommunityIdsMap = {};
            for (let event of fetchEventsResponse.events) {
                if (event.kind === 34550) {
                    communitiesEvents.push(event);
                }
                else if (event.kind === 30001) {
                    const bookmarkedCommunities = utilsManager_3.SocialUtilsManager.extractBookmarkedCommunities(event);
                    for (let community of bookmarkedCommunities) {
                        const pubkey = community.creatorId;
                        const communityId = community.communityId;
                        if (!pubkeyToCommunityIdsMap[pubkey]) {
                            pubkeyToCommunityIdsMap[pubkey] = [];
                        }
                        pubkeyToCommunityIdsMap[pubkey].push(communityId);
                    }
                }
            }
            if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                const bookmarkedCommunitiesEvents = await this.fetchCommunities({ pubkeyToCommunityIdsMap });
                for (let event of bookmarkedCommunitiesEvents) {
                    communitiesEvents.push(event);
                }
            }
            return communitiesEvents;
        }
        async fetchAllUserRelatedCommunitiesFeed(options) {
            const { since, until } = options;
            const communitiesEvents = await this.fetchAllUserRelatedCommunities(options);
            let communityUriArr = [];
            let identifiers = [];
            for (let event of communitiesEvents) {
                if (event.kind === 34550) {
                    const communityInfo = utilsManager_3.SocialUtilsManager.extractCommunityInfo(event);
                    identifiers.push(communityInfo.communityUri + ':keys');
                    communityUriArr.push(communityInfo.communityUri);
                }
            }
            let feedEvents = [];
            if (communityUriArr.length > 0) {
                feedEvents = await this.fetchCommunitiesFeed({ communityUriArr, since, until });
            }
            return feedEvents;
        }
        async fetchUserBookmarkedCommunities(options) {
            const { pubKey, excludedCommunity } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let request = {
                kinds: [30001],
                "#d": ["communities"],
                authors: [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            const bookmarkedCommunitiesEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
            const communities = utilsManager_3.SocialUtilsManager.extractBookmarkedCommunities(bookmarkedCommunitiesEvent, excludedCommunity);
            return communities;
        }
        async fetchCommunity(options) {
            const { communityId, creatorId } = options;
            const decodedCreatorId = creatorId.startsWith('npub1') ? index_3.Nip19.decode(creatorId).data : creatorId;
            let infoMsg = {
                kinds: [34550],
                authors: [decodedCreatorId],
                "#d": [communityId]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(infoMsg);
            return fetchEventsResponse.events;
        }
        async fetchCommunityFeed(options) {
            const { communityUri, since, until } = options;
            let request = {
                kinds: [1],
                "#a": [communityUri],
                limit: 20
            };
            if (since != null) {
                request.since = since;
            }
            if (until != null) {
                request.until = until;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async fetchCommunitiesFeed(options) {
            const { communityUriArr, since, until } = options;
            let request = {
                kinds: [1],
                "#a": communityUriArr,
                limit: 20
            };
            if (since != null) {
                request.since = since;
            }
            if (until != null) {
                request.until = until;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async fetchCommunitiesGeneralMembers(options) {
            const { communities } = options;
            const communityUriArr = [];
            for (let community of communities) {
                const communityUri = utilsManager_3.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
                communityUriArr.push(communityUri);
            }
            let request = {
                kinds: [30001],
                "#d": ["communities"],
                "#a": communityUriArr
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        // async fetchNotes(options: IFetchNotesOptions) {
        //     const decodedNpubs = options.authors?.map(npub => Nip19.decode(npub).data);
        //     let decodedIds = options.ids?.map(id => id.startsWith('note1') ? Nip19.decode(id).data : id);
        //     let msg: any = {
        //         kinds: [1],
        //         limit: 20
        //     };
        //     if (decodedNpubs) msg.authors = decodedNpubs;
        //     if (decodedIds) msg.ids = decodedIds;
        //     const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(msg);
        //     return fetchEventsResponse.events;
        // }
        // async fetchMetadata(options: IFetchMetadataOptions) {
        //     let decodedNpubs;
        //     if (options.decodedAuthors) {
        //         decodedNpubs = options.decodedAuthors;
        //     }
        //     else {
        //         decodedNpubs = options.authors?.map(npub => Nip19.decode(npub).data) || [];
        //     }
        //     const msg = {
        //         authors: decodedNpubs,
        //         kinds: [0]
        //     };
        //     const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(msg);
        //     return fetchEventsResponse.events;
        // }
        // async fetchReplies(options: IFetchRepliesOptions) {
        //     let decodedNoteIds;
        //     if (options.decodedIds) {
        //         decodedNoteIds = options.decodedIds;
        //     }
        //     else {
        //         decodedNoteIds = options.noteIds?.map(id => id.startsWith('note1') ? Nip19.decode(id).data : id);
        //     }
        //     const msg = {
        //         "#e": decodedNoteIds,
        //         kinds: [1],
        //         limit: 20,
        //     }
        //     const events = await this._nostrCommunicationManager.fetchEvents(msg);
        //     return events;
        // }
        // async fetchFollowing(npubs: string[]) {
        //     const decodedNpubs = npubs.map(npub => Nip19.decode(npub).data);
        //     const msg = {
        //         authors: decodedNpubs,
        //         kinds: [3]
        //     }
        //     const events = await this._nostrCommunicationManager.fetchEvents(msg);
        //     return events;
        // }
        async fetchAllUserRelatedChannels(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let requestForCreatedChannels = {
                kinds: [40, 41],
                authors: [decodedPubKey]
            };
            let requestForJoinedChannels = {
                kinds: [30001],
                "#d": ["channels"],
                authors: [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForCreatedChannels, requestForJoinedChannels);
            let channels = [];
            let bookmarkedChannelEventIds = [];
            const channelMetadataMap = {};
            const handleChannelEvent = (event) => {
                if (event.kind === 40) {
                    const channelInfo = utilsManager_3.SocialUtilsManager.extractChannelInfo(event);
                    if (channelInfo) {
                        channels.push(channelInfo);
                    }
                }
                else if (event.kind === 41) {
                    const channelInfo = utilsManager_3.SocialUtilsManager.extractChannelInfo(event);
                    if (channelInfo) {
                        channelMetadataMap[channelInfo.id] = channelInfo;
                    }
                }
            };
            for (let event of fetchEventsResponse.events) {
                if (event.kind === 30001) {
                    bookmarkedChannelEventIds = utilsManager_3.SocialUtilsManager.extractBookmarkedChannels(event);
                }
                else {
                    handleChannelEvent(event);
                }
            }
            if (bookmarkedChannelEventIds.length > 0) {
                const bookmarkedChannelEvents = await this.fetchEventsByIds({
                    ids: bookmarkedChannelEventIds
                });
                for (let event of bookmarkedChannelEvents) {
                    handleChannelEvent(event);
                }
            }
            const pubkeyToCommunityIdsMap = {};
            for (let channel of channels) {
                const scpData = channel.scpData;
                if (!scpData?.communityUri)
                    continue;
                const { communityId } = utilsManager_3.SocialUtilsManager.getCommunityBasicInfoFromUri(scpData.communityUri);
                pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
                if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(communityId)) {
                    pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(communityId);
                }
            }
            let channelIdToCommunityMap = {};
            const communityEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of communityEvents) {
                const communityInfo = utilsManager_3.SocialUtilsManager.extractCommunityInfo(event);
                const channelId = communityInfo.scpData?.channelEventId;
                if (!channelId)
                    continue;
                channelIdToCommunityMap[channelId] = communityInfo;
            }
            return {
                channels,
                channelMetadataMap,
                channelIdToCommunityMap
            };
        }
        async fetchUserBookmarkedChannelEventIds(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let requestForJoinedChannels = {
                kinds: [30001],
                "#d": ["channels"],
                authors: [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForJoinedChannels);
            const bookmarkedChannelsEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
            const channelEventIds = utilsManager_3.SocialUtilsManager.extractBookmarkedChannels(bookmarkedChannelsEvent);
            return channelEventIds;
        }
        async fetchEventsByIds(options) {
            const { ids } = options;
            let request = {
                ids: ids
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async fetchTempEvents(options) {
            return []; //Not supported
        }
        async fetchChannelMessages(options) {
            let { channelId, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedChannelId = channelId.startsWith('npub1') ? index_3.Nip19.decode(channelId).data : channelId;
            let messagesReq = {
                kinds: [42],
                "#e": [decodedChannelId],
                limit: 20
            };
            if (until === 0) {
                messagesReq.since = since;
            }
            else {
                messagesReq.until = until;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(messagesReq);
            return fetchEventsResponse.events;
        }
        async fetchChannelInfoMessages(options) {
            const { channelId } = options;
            const decodedChannelId = channelId.startsWith('npub1') ? index_3.Nip19.decode(channelId).data : channelId;
            let channelCreationEventReq = {
                kinds: [40],
                ids: [decodedChannelId],
            };
            let channelMetadataEventReq = {
                kinds: [41],
                "#e": [decodedChannelId]
            };
            let messagesReq = {
                kinds: [42],
                "#e": [decodedChannelId],
                limit: 20
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(channelCreationEventReq, channelMetadataEventReq, messagesReq);
            return fetchEventsResponse.events;
        }
        async fetchMessageContactsCacheEvents(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                user_pubkey: decodedPubKey,
                relation: 'follows'
            };
            const followsEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
            msg = {
                user_pubkey: decodedPubKey,
                relation: 'other'
            };
            const otherEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
            return [...followsEventsResponse.events, ...otherEventsResponse.events];
        }
        async fetchDirectMessages(options) {
            let { pubKey, sender, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            const decodedSenderPubKey = sender.startsWith('npub1') ? index_3.Nip19.decode(sender).data : sender;
            const req = {
                receiver: decodedPubKey,
                sender: decodedSenderPubKey,
                limit: 20
            };
            if (until === 0) {
                req.since = since;
            }
            else {
                req.until = until;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('get_directmsgs', req);
            return fetchEventsResponse.events;
        }
        async resetMessageCount(options) {
            const { pubKey, sender } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            const decodedSenderPubKey = sender.startsWith('npub1') ? index_3.Nip19.decode(sender).data : sender;
            const createAt = Math.ceil(Date.now() / 1000);
            let event = {
                "content": JSON.stringify({ "description": `reset messages from '${decodedSenderPubKey}'` }),
                "kind": 30078,
                "tags": [
                    [
                        "d",
                        "Scom Social"
                    ]
                ],
                "created_at": createAt,
                "pubkey": decodedPubKey
            };
            event.id = index_3.Event.getEventHash(event);
            event.sig = index_3.Event.getSignature(event, this._privateKey);
            const msg = {
                event_from_user: event,
                sender: decodedSenderPubKey
            };
            await this._nostrCommunicationManager.fetchCachedEvents('reset_directmsg_count', msg);
        }
        async fetchGroupKeys(options) {
            const { identifiers } = options;
            let req = {
                kinds: [30078],
                "#d": identifiers
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events || [];
        }
        async fetchUserGroupInvitations(options) {
            const { pubKey, groupKinds } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let req = {
                kinds: [30078],
                "#p": [decodedPubKey],
                "#k": groupKinds.map(kind => kind.toString())
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
            return events;
        }
        async fetchCalendarEvents(options) {
            const { limit } = options;
            let req = {
                kinds: [31922, 31923],
                limit: limit || 10
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return {
                events: fetchEventsResponse.events,
                data: fetchEventsResponse.data
            };
        }
        async fetchCalendarEvent(options) {
            const { address } = options;
            let req = {
                kinds: [address.kind],
                "#d": [address.identifier],
                authors: [address.pubkey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchCalendarEventPosts(options) {
            const { calendarEventUri } = options;
            let request = {
                kinds: [1],
                "#a": [calendarEventUri],
                limit: 50
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async fetchCalendarEventRSVPs(options) {
            const { calendarEventUri, pubkey } = options;
            let req = {
                kinds: [31925],
                "#a": [calendarEventUri]
            };
            if (pubkey) {
                const decodedPubKey = pubkey.startsWith('npub1') ? index_3.Nip19.decode(pubkey).data : pubkey;
                req.authors = [decodedPubKey];
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events;
        }
        async fetchLongFormContentEvents(options) {
            let { pubKey, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let req = {
                kinds: [30023],
                limit: 20
            };
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
                req.authors = [decodedPubKey];
            }
            if (until === 0) {
                req.since = since;
            }
            else {
                req.until = until;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events;
        }
        // async fetchLikes(eventId: string) {
        //     let req: any = {
        //         kinds: [7],
        //         "#e": [eventId]
        //     };
        //     const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
        //     return fetchEventsResponse.events;
        // }
        async searchUsers(options) {
            const { query } = options;
            const req = {
                query: query,
                limit: 10
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('user_search', req);
            return fetchEventsResponse.events;
        }
        async fetchPaymentRequestEvent(options) {
            const { paymentRequest } = options;
            let hash = index_3.Event.getPaymentRequestHash(paymentRequest);
            let req = {
                kinds: [9739],
                "#r": [hash]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchPaymentReceiptEvent(options) {
            const { requestEventId } = options;
            let req = {
                kinds: [9740],
                "#e": [requestEventId]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        getPaymentHash(tags) {
            let tagsMap = {};
            for (let _t of tags) {
                tagsMap[_t[0]] = _t.slice(1);
            }
            return tagsMap['bolt11']?.[0] || tagsMap['payreq']?.[0] || tagsMap['r']?.[0];
        }
        async fetchPaymentActivitiesForRecipient(options) {
            let { pubkey, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let paymentRequestEventsReq = {
                kinds: [9739],
                authors: [pubkey],
                limit: 10
            };
            if (until === 0) {
                paymentRequestEventsReq.since = since;
            }
            else {
                paymentRequestEventsReq.until = until;
            }
            const paymentRequestEvents = await this._nostrCommunicationManager.fetchEvents(paymentRequestEventsReq);
            const requestEventIds = paymentRequestEvents.events.map(event => event.id);
            let paymentReceiptEventsReq = {
                kinds: [9740],
                "#e": requestEventIds
            };
            const paymentReceiptEvents = await this._nostrCommunicationManager.fetchEvents(paymentReceiptEventsReq);
            let paymentActivity = [];
            for (let requestEvent of paymentRequestEvents.events) {
                const paymentHash = this.getPaymentHash(requestEvent.tags);
                const amount = requestEvent.tags.find(tag => tag[0] === 'amount')?.[1];
                const receiptEvent = paymentReceiptEvents.events.find(event => event.tags.find(tag => tag[0] === 'e')?.[1] === requestEvent.id);
                let status = 'pending';
                let sender;
                if (receiptEvent) {
                    status = 'completed';
                    sender = receiptEvent.pubkey;
                }
                paymentActivity.push({
                    paymentHash,
                    sender,
                    recipient: pubkey,
                    amount,
                    status,
                    createdAt: requestEvent.created_at
                });
            }
            return paymentActivity;
        }
        async fetchPaymentActivitiesForSender(options) {
            let { pubkey, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let paymentReceiptEventsReq = {
                kinds: [9740],
                authors: [pubkey],
                limit: 10
            };
            if (until === 0) {
                paymentReceiptEventsReq.since = since;
            }
            else {
                paymentReceiptEventsReq.until = until;
            }
            const paymentReceiptEvents = await this._nostrCommunicationManager.fetchEvents(paymentReceiptEventsReq);
            let requestEventIds = [];
            for (let event of paymentReceiptEvents.events) {
                const requestEventId = event.tags.find(tag => tag[0] === 'e')?.[1];
                if (requestEventId) {
                    requestEventIds.push(requestEventId);
                }
            }
            let paymentRequestEventsReq = {
                kinds: [9739],
                ids: requestEventIds
            };
            const paymentRequestEvents = await this._nostrCommunicationManager.fetchEvents(paymentRequestEventsReq);
            let paymentActivity = [];
            for (let receiptEvent of paymentReceiptEvents.events) {
                const requestEventId = receiptEvent.tags.find(tag => tag[0] === 'e')?.[1];
                const requestEvent = paymentRequestEvents.events.find(event => event.id === requestEventId);
                if (requestEvent) {
                    const paymentHash = this.getPaymentHash(requestEvent.tags);
                    const amount = requestEvent.tags.find(tag => tag[0] === 'amount')?.[1];
                    paymentActivity.push({
                        paymentHash,
                        sender: pubkey,
                        recipient: requestEvent.pubkey,
                        amount,
                        status: 'completed',
                        createdAt: receiptEvent.created_at
                    });
                }
            }
            return paymentActivity;
        }
        async fetchUserFollowingFeed(options) {
            let { pubKey, until } = options;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                user_pubkey: decodedPubKey,
                timeframe: 'latest',
                scope: 'follows',
                limit: 20
            };
            if (until > 0) {
                msg.until = until;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchCachedEvents('explore', msg);
            return fetchEventsResponse.events;
        }
        async fetchCommunityPinnedNotesEvents(options) {
            const { creatorId, communityId } = options;
            const communityUri = utilsManager_3.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            let request = {
                kinds: [9741],
                "#a": [communityUri]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events || [];
        }
        async fetchCommunityPinnedNoteIds(options) {
            const events = await this.fetchCommunityPinnedNotesEvents(options);
            const event = events[0];
            let noteIds = [];
            if (event) {
                for (let tag of event.tags) {
                    if (tag[0] === 'e') {
                        noteIds.push(tag[1]);
                    }
                }
            }
            return noteIds;
        }
        async fetchUserPinnedNotes(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let request = {
                kinds: [10001],
                authors: [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchUserBookmarks(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
            let request = {
                kinds: [10003],
                authors: [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchTrendingCommunities() {
            const pubkeyToCommunityIdsMap = {
                "npub1rjc54ve4sahunm7r0kpchg58eut7ttwvevst7m2fl8dfd9w4y33q0w0qw2": ["Photography"],
                "npub1c6dhrhzkflwr2zkdmlujnujawgp2c9rsep6gscyt6mvcusnt5a3srnzmx3": ["Vegan_Consciousness"]
            };
            const events = this.fetchCommunities({
                pubkeyToCommunityIdsMap
            });
            return events || [];
        }
        async fetchUserEthWalletAccountsInfo(options) {
            const { pubKey, walletHash } = options;
            let request = {
                kinds: [9742]
            };
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_3.Nip19.decode(pubKey).data : pubKey;
                request.authors = [decodedPubKey];
            }
            else if (walletHash) {
                request["#d"] = [walletHash];
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchSubcommunites(options) {
            return []; // Not supported
        }
        async fetchCommunityDetailMetadata(options) {
            const { communityCreatorId, communityName } = options;
            const decodedCreatorId = communityCreatorId.startsWith('npub1') ? index_3.Nip19.decode(communityCreatorId).data : communityCreatorId;
            let request = {
                kinds: [34550],
                authors: [decodedCreatorId],
                "#d": communityName
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async getCommunityUriToMembersMap(communities) {
            const communityUriToMemberIdRoleComboMap = {};
            const communityUriToCreatorOrModeratorIdsMap = {};
            for (let community of communities) {
                const communityUri = community.communityUri;
                communityUriToMemberIdRoleComboMap[communityUri] = [];
                communityUriToMemberIdRoleComboMap[communityUri].push({
                    id: community.creatorId,
                    role: utils_16.CommunityRole.Creator
                });
                communityUriToCreatorOrModeratorIdsMap[communityUri] = new Set();
                communityUriToCreatorOrModeratorIdsMap[communityUri].add(community.creatorId);
                if (community.moderatorIds) {
                    for (let moderator of community.moderatorIds) {
                        if (moderator === community.creatorId)
                            continue;
                        communityUriToMemberIdRoleComboMap[communityUri].push({
                            id: moderator,
                            role: utils_16.CommunityRole.Moderator
                        });
                        communityUriToCreatorOrModeratorIdsMap[communityUri].add(moderator);
                    }
                }
            }
            const generalMembersEvents = await this.fetchCommunitiesGeneralMembers({ communities });
            for (let event of generalMembersEvents) {
                const communityUriArr = event.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
                for (let communityUri of communityUriArr) {
                    if (!communityUriToMemberIdRoleComboMap[communityUri])
                        continue;
                    const pubkey = index_3.Nip19.npubEncode(event.pubkey);
                    if (communityUriToCreatorOrModeratorIdsMap[communityUri].has(pubkey))
                        continue;
                    communityUriToMemberIdRoleComboMap[communityUri].push({
                        id: pubkey,
                        role: utils_16.CommunityRole.GeneralMember
                    });
                }
            }
            let pubkeys = new Set(utilsManager_3.SocialUtilsManager.flatMap(Object.values(communityUriToMemberIdRoleComboMap), combo => combo.map(c => c.id)));
            const communityUriToMembersMap = {};
            if (pubkeys.size > 0) {
                let metadataArr = [];
                let followersCountMap = {};
                try {
                    const events = await this.fetchUserProfileCacheEvents({ pubKeys: Array.from(pubkeys) });
                    for (let event of events) {
                        if (event.kind === 0) {
                            metadataArr.push({
                                ...event,
                                content: utilsManager_3.SocialUtilsManager.parseContent(event.content)
                            });
                        }
                        else if (event.kind === 10000108) {
                            followersCountMap = utilsManager_3.SocialUtilsManager.parseContent(event.content);
                        }
                    }
                }
                catch (error) {
                    console.error('fetchUserProfiles', error);
                }
                if (metadataArr.length == 0)
                    return null;
                const userProfiles = [];
                for (let metadata of metadataArr) {
                    let userProfile = utilsManager_3.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
                    userProfiles.push(userProfile);
                }
                if (!userProfiles)
                    return communityUriToMembersMap;
                for (let community of communities) {
                    const memberIds = communityUriToMemberIdRoleComboMap[community.communityUri];
                    if (!memberIds)
                        continue;
                    const communityMembers = [];
                    for (let memberIdRoleCombo of memberIds) {
                        const userProfile = userProfiles.find(profile => profile.npub === memberIdRoleCombo.id);
                        if (!userProfile)
                            continue;
                        let communityMember = {
                            id: userProfile.npub,
                            name: userProfile.displayName,
                            profileImageUrl: userProfile.avatar,
                            username: userProfile.username,
                            internetIdentifier: userProfile.internetIdentifier,
                            role: memberIdRoleCombo.role
                        };
                        communityMembers.push(communityMember);
                    }
                    communityUriToMembersMap[community.communityUri] = communityMembers;
                }
            }
            return communityUriToMembersMap;
        }
        async fetchCommunityStalls(options) {
            const { creatorId, communityId } = options;
            const communityUri = utilsManager_3.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            let request = {
                kinds: [30017],
                "#a": [communityUri]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async fetchCommunityProducts(options) {
            const { creatorId, communityId } = options;
            const communityUri = utilsManager_3.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            let request = {
                kinds: [30018],
                "#a": [communityUri]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
    }
    exports.NostrEventManagerRead = NostrEventManagerRead;
});
define("@scom/scom-social-sdk/managers/eventManagerReadV1o5.ts", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/index.ts", "@scom/scom-social-sdk/managers/utilsManager.ts"], function (require, exports, index_4, utils_17, utilsManager_4) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrEventManagerReadV1o5 = void 0;
    class NostrEventManagerReadV1o5 {
        constructor(manager) {
            this._nostrCommunicationManager = manager;
        }
        set nostrCommunicationManager(manager) {
            this._nostrCommunicationManager = manager;
        }
        set privateKey(privateKey) {
            this._privateKey = privateKey;
        }
        async fetchEventsFromAPIWithAuth(endpoint, msg) {
            const authHeader = utilsManager_4.SocialUtilsManager.constructAuthHeader(this._privateKey);
            return await this._nostrCommunicationManager.fetchEventsFromAPI(endpoint, msg, authHeader);
        }
        async fetchThreadCacheEvents(options) {
            const { id } = options;
            let decodedId = id.startsWith('note1') ? index_4.Nip19.decode(id).data : id;
            let msg = {
                eventId: decodedId,
                limit: 100
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-thread-posts', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchTrendingCacheEvents(options) {
            let msg = {};
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-trending-posts', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchProfileFeedCacheEvents(options) {
            let { pubKey, since, until, userPubkey } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                limit: 20,
                pubkey: decodedPubKey
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            if (userPubkey) {
                const decodedUserPubKey = userPubkey.startsWith('npub1') ? index_4.Nip19.decode(userPubkey).data : userPubkey;
                msg.user_pubkey = decodedUserPubKey;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-profile-feed', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchProfileRepliesCacheEvents(options) {
            let { pubKey, since, until, userPubkey } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                limit: 20,
                pubkey: decodedPubKey
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            if (userPubkey) {
                const decodedUserPubKey = userPubkey.startsWith('npub1') ? index_4.Nip19.decode(userPubkey).data : userPubkey;
                msg.user_pubkey = decodedUserPubKey;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-profile-replies', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchHomeFeedCacheEvents(options) {
            let { since, until, pubKey } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let msg = {
                limit: 20
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
                msg.pubKey = decodedPubKey;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-home-feed', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchUserProfileCacheEvents(options) {
            let { pubKeys } = options;
            if (!pubKeys || pubKeys.length === 0)
                return [];
            const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey);
            let msg = {
                pubkeys: decodedPubKeys
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-profiles', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchUserProfileDetailEvents(options) {
            let { pubKey, telegramAccount } = options;
            if (!pubKey && !telegramAccount)
                return [];
            let decodedPubKey;
            if (pubKey) {
                decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            }
            let msg = {
                pubkey: decodedPubKey,
                telegramAccount
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-profile-detail', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchContactListCacheEvents(options) {
            let { pubKey, detailIncluded } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey,
                detailIncluded: detailIncluded,
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-contact-list', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchUserRelays(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-relays', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchFollowersCacheEvents(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-followers', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchCommunities(options) {
            const { pubkeyToCommunityIdsMap, query } = options;
            let events;
            if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                let msg = {
                    identifiers: []
                };
                for (let pubkey in pubkeyToCommunityIdsMap) {
                    const decodedPubKey = pubkey.startsWith('npub1') ? index_4.Nip19.decode(pubkey).data : pubkey;
                    const communityIds = pubkeyToCommunityIdsMap[pubkey];
                    let request = {
                        pubkey: decodedPubKey,
                        names: communityIds
                    };
                    msg.identifiers.push(request);
                }
                let response = await this.fetchEventsFromAPIWithAuth('fetch-communities', msg);
                events = response.events;
            }
            else {
                let msg = {
                    limit: 50,
                    query
                };
                let response = await this.fetchEventsFromAPIWithAuth('fetch-communities', msg);
                events = response.events;
            }
            return events;
        }
        async fetchAllUserRelatedCommunities(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            let response = await this.fetchEventsFromAPIWithAuth('fetch-user-communities', msg);
            return response.events || [];
        }
        async fetchAllUserRelatedCommunitiesFeed(options) {
            const { pubKey, since, until } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey,
                since,
                until,
                limit: 20
            };
            let response = await this.fetchEventsFromAPIWithAuth('fetch-user-communities-feed', msg);
            return response.events || [];
        }
        async fetchUserBookmarkedCommunities(options) {
            const { pubKey, excludedCommunity } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            let response = await this.fetchEventsFromAPIWithAuth('fetch-user-bookmarked-communities', msg);
            let communities = [];
            for (let community of response.data) {
                if (excludedCommunity) {
                    const decodedPubkey = index_4.Nip19.decode(excludedCommunity.creatorId).data;
                    if (community.communityId === excludedCommunity.communityId && community.creatorId === decodedPubkey)
                        continue;
                }
                communities.push(community);
            }
            return communities;
        }
        async fetchCommunity(options) {
            const { communityId, creatorId } = options;
            const decodedCreatorId = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let msg = {
                identifiers: [
                    {
                        pubkey: decodedCreatorId,
                        names: [communityId]
                    }
                ]
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-communities', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchCommunityFeed(options) {
            const { communityUri, since, until } = options;
            const { creatorId, communityId } = utilsManager_4.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
            let identifier = {
                pubkey: creatorId,
                names: [communityId]
            };
            let msg = {
                identifiers: [identifier],
                limit: 50,
                since,
                until
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-community-feed', msg);
            return fetchEventsResponse.events || [];
        }
        // async fetchNotes(options: IFetchNotesOptions) {
        //     const decodedNpubs = options.authors?.map(npub => Nip19.decode(npub).data);
        //     let decodedIds = options.ids?.map(id => id.startsWith('note1') ? Nip19.decode(id).data : id);
        //     let msg: any = {
        //         kinds: [1],
        //         limit: 20
        //     };
        //     if (decodedNpubs) msg.authors = decodedNpubs;
        //     if (decodedIds) msg.ids = decodedIds;
        //     const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(msg);
        //     return fetchEventsResponse.events || [];
        // }
        async fetchAllUserRelatedChannels(options) {
            const { pubKey } = options;
            let msg = {
                pubKey
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-related-channels', msg);
            let channels = [];
            const channelMetadataMap = {};
            for (let event of fetchEventsResponse.events) {
                if (event.kind === 40) {
                    const channelInfo = utilsManager_4.SocialUtilsManager.extractChannelInfo(event);
                    if (channelInfo) {
                        channels.push(channelInfo);
                    }
                }
                else if (event.kind === 41) {
                    const channelInfo = utilsManager_4.SocialUtilsManager.extractChannelInfo(event);
                    if (channelInfo) {
                        channelMetadataMap[channelInfo.id] = channelInfo;
                    }
                }
            }
            const pubkeyToCommunityIdsMap = {};
            for (let channel of channels) {
                const scpData = channel.scpData;
                if (!scpData?.communityUri)
                    continue;
                const { communityId } = utilsManager_4.SocialUtilsManager.getCommunityBasicInfoFromUri(scpData.communityUri);
                pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
                if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(communityId)) {
                    pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(communityId);
                }
            }
            let channelIdToCommunityMap = {};
            const communityEvents = await this.fetchCommunities({ pubkeyToCommunityIdsMap });
            for (let event of communityEvents) {
                const communityInfo = utilsManager_4.SocialUtilsManager.extractCommunityInfo(event);
                const channelId = communityInfo.scpData?.channelEventId;
                if (!channelId)
                    continue;
                channelIdToCommunityMap[channelId] = communityInfo;
            }
            return {
                channels,
                channelMetadataMap,
                channelIdToCommunityMap
            };
        }
        async fetchUserBookmarkedChannelEventIds(options) {
            const { pubKey } = options;
            let msg = {
                pubKey
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-bookmarked-channel-event-ids', msg);
            return fetchEventsResponse.data;
        }
        async fetchEventsByIds(options) {
            const { ids } = options;
            let msg = {
                ids
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-events', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchTempEvents(options) {
            const { ids } = options;
            let msg = {
                ids
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-temp-events', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchChannelMessages(options) {
            let { channelId, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedChannelId = channelId.startsWith('npub1') ? index_4.Nip19.decode(channelId).data : channelId;
            let msg = {
                channelId: decodedChannelId,
                limit: 20
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-channel-messages', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchChannelInfoMessages(options) {
            const { channelId } = options;
            const decodedChannelId = channelId.startsWith('npub1') ? index_4.Nip19.decode(channelId).data : channelId;
            let msg = {
                channelId: decodedChannelId,
                limit: 20
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-channel-info-messages', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchMessageContactsCacheEvents(options) {
            const { pubKey } = options;
            const senderToLastReadMap = {};
            //FIXME: Implement a better way to get last read messages
            if (localStorage) {
                const lastReadsStr = localStorage.getItem('lastReads');
                if (lastReadsStr) {
                    const lastReads = JSON.parse(lastReadsStr);
                    for (let sender in lastReads) {
                        const decodedSender = sender.startsWith('npub1') ? index_4.Nip19.decode(sender).data : sender;
                        senderToLastReadMap[decodedSender] = lastReads[sender];
                    }
                }
            }
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            const msg = {
                receiver: decodedPubKey,
                senderToLastReadMap: senderToLastReadMap
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-direct-messages-stats', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchDirectMessages(options) {
            let { pubKey, since, until, sender } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            const decodedSenderPubKey = sender.startsWith('npub1') ? index_4.Nip19.decode(sender).data : sender;
            const msg = {
                receiver: decodedPubKey,
                sender: decodedSenderPubKey,
                limit: 20
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-direct-messages', msg);
            return fetchEventsResponse.events || [];
        }
        async resetMessageCount(options) {
            const { sender } = options;
            //FIXME: Implement a better way to set last read messages
            if (localStorage) {
                const lastReadsStr = localStorage.getItem('lastReads');
                let lastReads = {};
                if (lastReadsStr) {
                    lastReads = JSON.parse(lastReadsStr);
                }
                lastReads[sender] = Math.ceil(Date.now() / 1000);
                localStorage.setItem('lastReads', JSON.stringify(lastReads));
            }
        }
        async fetchGroupKeys(options) {
            const { identifiers } = options;
            let msg = {
                identifiers
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-application-specific', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchUserGroupInvitations(options) {
            const { pubKey, groupKinds } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubKey: decodedPubKey,
                groupKinds: groupKinds
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-group-invitations', msg);
            let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
            return events;
        }
        async fetchCalendarEvents(options) {
            const { start, end, limit, previousEventId } = options;
            let msg = {
                start: start,
                end: end,
                limit: limit || 10,
                previousEventId
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-calendar-events', msg);
            return {
                events: fetchEventsResponse.events || [],
                data: fetchEventsResponse.data
            };
        }
        async fetchCalendarEvent(options) {
            const { address } = options;
            const key = `${address.kind}:${address.pubkey}:${address.identifier}`;
            let msg = {
                key
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-calendar-events', msg);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchCalendarEventPosts(options) {
            const { calendarEventUri } = options;
            let msg = {
                eventUri: calendarEventUri,
                limit: 50
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-calendar-posts', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchCalendarEventRSVPs(options) {
            const { calendarEventUri, pubkey } = options;
            let msg = {
                eventUri: calendarEventUri
            };
            if (pubkey) {
                const decodedPubKey = pubkey.startsWith('npub1') ? index_4.Nip19.decode(pubkey).data : pubkey;
                msg.pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-calendar-rsvps', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchLongFormContentEvents(options) {
            let { pubKey, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let msg = {
                limit: 20
            };
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
                msg.pubKey = decodedPubKey;
            }
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-long-form-content', msg);
            return fetchEventsResponse.events || [];
        }
        async searchUsers(options) {
            const { query } = options;
            let msg = {
                query,
                limit: 10
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('search-users', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchPaymentRequestEvent(options) {
            const { paymentRequest } = options;
            let hash = index_4.Event.getPaymentRequestHash(paymentRequest);
            let req = {
                kinds: [9739],
                "#r": [hash]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchPaymentReceiptEvent(options) {
            const { requestEventId } = options;
            let req = {
                kinds: [9740],
                "#e": [requestEventId]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        getPaymentHash(tags) {
            let tagsMap = {};
            for (let _t of tags) {
                tagsMap[_t[0]] = _t.slice(1);
            }
            return tagsMap['bolt11']?.[0] || tagsMap['payreq']?.[0] || tagsMap['r']?.[0];
        }
        async fetchPaymentActivitiesForRecipient(options) {
            let { pubkey, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let paymentRequestEventsReq = {
                kinds: [9739],
                authors: [pubkey],
                limit: 10
            };
            if (until === 0) {
                paymentRequestEventsReq.since = since;
            }
            else {
                paymentRequestEventsReq.until = until;
            }
            const paymentRequestEvents = await this._nostrCommunicationManager.fetchEvents(paymentRequestEventsReq);
            const requestEventIds = paymentRequestEvents.events.map(event => event.id);
            let paymentReceiptEventsReq = {
                kinds: [9740],
                "#e": requestEventIds
            };
            const paymentReceiptEvents = await this._nostrCommunicationManager.fetchEvents(paymentReceiptEventsReq);
            let paymentActivity = [];
            for (let requestEvent of paymentRequestEvents.events) {
                const paymentHash = this.getPaymentHash(requestEvent.tags);
                const amount = requestEvent.tags.find(tag => tag[0] === 'amount')?.[1];
                const receiptEvent = paymentReceiptEvents.events.find(event => event.tags.find(tag => tag[0] === 'e')?.[1] === requestEvent.id);
                let status = 'pending';
                let sender;
                if (receiptEvent) {
                    status = 'completed';
                    sender = receiptEvent.pubkey;
                }
                paymentActivity.push({
                    paymentHash,
                    sender,
                    recipient: pubkey,
                    amount,
                    status,
                    createdAt: requestEvent.created_at
                });
            }
            return paymentActivity;
        }
        async fetchPaymentActivitiesForSender(options) {
            let { pubkey, since, until } = options;
            if (!since)
                since = 0;
            if (!until)
                until = 0;
            let paymentReceiptEventsReq = {
                kinds: [9740],
                authors: [pubkey],
                limit: 10
            };
            if (until === 0) {
                paymentReceiptEventsReq.since = since;
            }
            else {
                paymentReceiptEventsReq.until = until;
            }
            const paymentReceiptEvents = await this._nostrCommunicationManager.fetchEvents(paymentReceiptEventsReq);
            let requestEventIds = [];
            for (let event of paymentReceiptEvents.events) {
                const requestEventId = event.tags.find(tag => tag[0] === 'e')?.[1];
                if (requestEventId) {
                    requestEventIds.push(requestEventId);
                }
            }
            let paymentRequestEventsReq = {
                kinds: [9739],
                ids: requestEventIds
            };
            const paymentRequestEvents = await this._nostrCommunicationManager.fetchEvents(paymentRequestEventsReq);
            let paymentActivity = [];
            for (let receiptEvent of paymentReceiptEvents.events) {
                const requestEventId = receiptEvent.tags.find(tag => tag[0] === 'e')?.[1];
                const requestEvent = paymentRequestEvents.events.find(event => event.id === requestEventId);
                if (requestEvent) {
                    const paymentHash = this.getPaymentHash(requestEvent.tags);
                    const amount = requestEvent.tags.find(tag => tag[0] === 'amount')?.[1];
                    paymentActivity.push({
                        paymentHash,
                        sender: pubkey,
                        recipient: requestEvent.pubkey,
                        amount,
                        status: 'completed',
                        createdAt: receiptEvent.created_at
                    });
                }
            }
            return paymentActivity;
        }
        async fetchUserFollowingFeed(options) {
            let { pubKey, until } = options;
            if (!until)
                until = 0;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey,
                limit: 20
            };
            if (until > 0) {
                msg.until = until;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-following-feed', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchCommunityPinnedNotesEvents(options) {
            const { communityId, creatorId } = options;
            const communityPubkey = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let msg = {
                communityPubkey,
                communityName: communityId,
                eventMetadataIncluded: true
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-community-pinned-notes', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchCommunityPinnedNoteIds(options) {
            const { communityId, creatorId } = options;
            const communityPubkey = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let msg = {
                communityPubkey,
                communityName: communityId,
                eventMetadataIncluded: false
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-community-pinned-notes', msg);
            return fetchEventsResponse.data?.ids || [];
        }
        async fetchUserPinnedNotes(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-pinned-notes', msg);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchUserBookmarks(options) {
            const { pubKey } = options;
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-bookmarks', msg);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchTrendingCommunities() {
            let msg = {};
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-trending-communities', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchUserEthWalletAccountsInfo(options) {
            const { pubKey, walletHash } = options;
            let msg = {};
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
                msg.pubkey = decodedPubKey;
            }
            else if (walletHash) {
                msg.walletHash = walletHash;
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-user-eth-wallet-info', msg);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchSubcommunites(options) {
            const { communityCreatorId, communityName } = options;
            const communityPubkey = communityCreatorId.startsWith('npub1') ? index_4.Nip19.decode(communityCreatorId).data : communityCreatorId;
            let msg = {
                communityPubkey,
                communityName
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-subcommunities', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchCommunityDetailMetadata(options) {
            const { communityCreatorId, communityName } = options;
            const communityPubkey = communityCreatorId.startsWith('npub1') ? index_4.Nip19.decode(communityCreatorId).data : communityCreatorId;
            let msg = {
                communityPubkey,
                communityName
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-community-detail-metadata', msg);
            return fetchEventsResponse.events || [];
        }
        async getCommunityUriToMembersMap(communities) {
            let msg = {
                identifiers: []
            };
            for (let community of communities) {
                const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_4.Nip19.decode(community.creatorId).data : community.creatorId;
                let request = {
                    pubkey: decodedCreatorId,
                    names: [community.communityId]
                };
                msg.identifiers.push(request);
            }
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-communities-members', msg);
            const events = fetchEventsResponse.events || [];
            const communityMemberEvents = events.filter(event => event.kind === 10000112);
            const nonCommunityMemberEvents = events.filter(event => event.kind !== 10000112);
            let metadataArr = [];
            let followersCountMap = {};
            for (let event of nonCommunityMemberEvents) {
                if (event.kind === 0) {
                    metadataArr.push({
                        ...event,
                        content: utilsManager_4.SocialUtilsManager.parseContent(event.content)
                    });
                }
                else if (event.kind === 10000108) {
                    followersCountMap = utilsManager_4.SocialUtilsManager.parseContent(event.content);
                }
            }
            const pubkeyToProfileMap = {};
            for (let metadata of metadataArr) {
                let userProfile = utilsManager_4.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
                pubkeyToProfileMap[metadata.pubkey] = userProfile;
            }
            const communityUriToMembersMap = {};
            const mapProfileToCommunityMember = (profile, role) => {
                return {
                    id: profile.npub,
                    name: profile.displayName,
                    profileImageUrl: profile.avatar,
                    username: profile.username,
                    internetIdentifier: profile.internetIdentifier,
                    role
                };
            };
            for (let event of communityMemberEvents) {
                const content = utilsManager_4.SocialUtilsManager.parseContent(event.content);
                const communityUri = utilsManager_4.SocialUtilsManager.getCommunityUri(content.communities_pubkey, content.communities_d);
                const communityMembers = [];
                const creatorProfile = pubkeyToProfileMap[content.communities_pubkey];
                if (!creatorProfile)
                    continue;
                let creator = mapProfileToCommunityMember(creatorProfile, utils_17.CommunityRole.Creator);
                communityMembers.push(creator);
                for (let moderator of content.moderators) {
                    const userProfile = pubkeyToProfileMap[moderator];
                    if (!userProfile)
                        continue;
                    let communityMember = mapProfileToCommunityMember(userProfile, utils_17.CommunityRole.Moderator);
                    communityMembers.push(communityMember);
                }
                for (let member of content.general_members) {
                    const userProfile = pubkeyToProfileMap[member];
                    if (!userProfile)
                        continue;
                    let communityMember = mapProfileToCommunityMember(userProfile, utils_17.CommunityRole.GeneralMember);
                    communityMembers.push(communityMember);
                }
                communityUriToMembersMap[communityUri] = communityMembers;
            }
            return communityUriToMembersMap;
        }
        async fetchCommunityStalls(options) {
            const { creatorId, communityId } = options;
            const communityPubkey = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let msg = {
                communityPubkey,
                communityName: communityId
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-community-stalls', msg);
            return fetchEventsResponse.events || [];
        }
        async fetchCommunityProducts(options) {
            const { creatorId, communityId } = options;
            const communityPubkey = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let msg = {
                communityPubkey,
                communityName: communityId
            };
            const fetchEventsResponse = await this.fetchEventsFromAPIWithAuth('fetch-community-products', msg);
            return fetchEventsResponse.events || [];
        }
    }
    exports.NostrEventManagerReadV1o5 = NostrEventManagerReadV1o5;
});
define("@scom/scom-social-sdk/managers/eventManagerReadV2.ts", ["require", "exports", "@scom/scom-social-sdk/managers/eventManagerReadV1o5.ts"], function (require, exports, eventManagerReadV1o5_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrEventManagerReadV2 = void 0;
    class NostrEventManagerReadV2 extends eventManagerReadV1o5_1.NostrEventManagerReadV1o5 {
        constructor(manager) {
            super(manager);
        }
        set nostrCommunicationManager(manager) {
            this._nostrCommunicationManager = manager;
        }
        async searchUsers(options) {
            return [];
        }
        async fetchPaymentRequestEvent(options) {
            return null;
        }
        async fetchPaymentActivitiesForRecipient(options) {
            return [];
        }
        async fetchPaymentActivitiesForSender(options) {
            return [];
        }
        async fetchUserFollowingFeed(options) {
            return [];
        }
    }
    exports.NostrEventManagerReadV2 = NostrEventManagerReadV2;
});
///<amd-module name='@scom/scom-social-sdk/utils/geohash.ts'/> 
/**
 * Portions of this file are derived from [node-geohash](https://github.com/sunng87/node-geohash)
 * by Ning Sun, licensed under the MIT License.
 */
define("@scom/scom-social-sdk/utils/geohash.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    const BASE32_CODES = "0123456789bcdefghjkmnpqrstuvwxyz";
    const BASE32_CODES_DICT = {};
    for (let i = 0; i < BASE32_CODES.length; i++) {
        BASE32_CODES_DICT[BASE32_CODES.charAt(i)] = i;
    }
    const ENCODE_AUTO = 'auto';
    const MAX_LAT = 90;
    const MIN_LAT = -90;
    const MAX_LON = 180;
    const MIN_LON = -180;
    /**
     * Significant Figure Hash Length
     *
     * This is a quick and dirty lookup to figure out how long our hash
     * should be in order to guarantee a certain amount of trailing
     * significant figures. This was calculated by determining the error:
     * 45/2^(n-1) where n is the number of bits for a latitude or
     * longitude. Key is # of desired sig figs, value is minimum length of
     * the geohash.
     * @type Array
     */
    //     Desired sig figs:  0  1  2  3  4   5   6   7   8   9  10
    const SIGFIG_HASH_LENGTH = [0, 5, 7, 8, 11, 12, 13, 15, 16, 17, 18];
    /**
     * Encode
     *
     * Create a Geohash out of a latitude and longitude that is
     * `numberOfChars` long.
     *
     * @param {Number|String} latitude
     * @param {Number|String} longitude
     * @param {Number} numberOfChars
     * @returns {String}
     */
    const encode = (latitude, longitude, numberOfChars = 9) => {
        if (numberOfChars === ENCODE_AUTO) {
            if (typeof (latitude) === 'number' || typeof (longitude) === 'number') {
                throw new Error('string notation required for auto precision.');
            }
            const decSigFigsLat = latitude.split('.')[1].length;
            const decSigFigsLong = longitude.split('.')[1].length;
            let numberOfSigFigs = Math.max(decSigFigsLat, decSigFigsLong);
            numberOfChars = SIGFIG_HASH_LENGTH[numberOfSigFigs];
        }
        else if (numberOfChars === undefined) {
            numberOfChars = 9;
        }
        let chars = [];
        let bits = 0;
        let bitsTotal = 0;
        let hash_value = 0;
        let maxLat = MAX_LAT;
        let minLat = MIN_LAT;
        let maxLon = MAX_LON;
        let minLon = MIN_LON;
        let mid;
        while (chars.length < numberOfChars) {
            if (bitsTotal % 2 === 0) {
                mid = (maxLon + minLon) / 2;
                if (longitude > mid) {
                    hash_value = (hash_value << 1) + 1;
                    minLon = mid;
                }
                else {
                    hash_value = (hash_value << 1) + 0;
                    maxLon = mid;
                }
            }
            else {
                mid = (maxLat + minLat) / 2;
                if (latitude > mid) {
                    hash_value = (hash_value << 1) + 1;
                    minLat = mid;
                }
                else {
                    hash_value = (hash_value << 1) + 0;
                    maxLat = mid;
                }
            }
            bits++;
            bitsTotal++;
            if (bits === 5) {
                let code = BASE32_CODES[hash_value];
                chars.push(code);
                bits = 0;
                hash_value = 0;
            }
        }
        return chars.join('');
    };
    /**
     * Encode Integer
     *
     * Create a Geohash out of a latitude and longitude that is of 'bitDepth'.
     *
     * @param {Number} latitude
     * @param {Number} longitude
     * @param {Number} bitDepth
     * @returns {Number}
     */
    const encode_int = (latitude, longitude, bitDepth) => {
        bitDepth = bitDepth || 52;
        let bitsTotal = 0;
        let maxLat = MAX_LAT;
        let minLat = MIN_LAT;
        let maxLon = MAX_LON;
        let minLon = MIN_LON;
        let mid;
        let combinedBits = 0;
        while (bitsTotal < bitDepth) {
            combinedBits *= 2;
            if (bitsTotal % 2 === 0) {
                mid = (maxLon + minLon) / 2;
                if (longitude > mid) {
                    combinedBits += 1;
                    minLon = mid;
                }
                else {
                    maxLon = mid;
                }
            }
            else {
                mid = (maxLat + minLat) / 2;
                if (latitude > mid) {
                    combinedBits += 1;
                    minLat = mid;
                }
                else {
                    maxLat = mid;
                }
            }
            bitsTotal++;
        }
        ;
        return combinedBits;
    };
    const decode_bbox = (hashString) => {
        let isLon = true;
        let maxLat = MAX_LAT;
        let minLat = MIN_LAT;
        let maxLon = MAX_LON;
        let minLon = MIN_LON;
        let mid;
        const hashValueList = hashString
            .toLowerCase()
            .split('')
            .map((char) => BASE32_CODES_DICT[char]);
        for (const hashValue of hashValueList) {
            for (let bits = 4; bits >= 0; bits--) {
                const bit = (hashValue >> bits) & 1;
                if (isLon) {
                    mid = (maxLon + minLon) / 2;
                    if (bit === 1) {
                        minLon = mid;
                    }
                    else {
                        maxLon = mid;
                    }
                }
                else {
                    mid = (maxLat + minLat) / 2;
                    if (bit === 1) {
                        minLat = mid;
                    }
                    else {
                        maxLat = mid;
                    }
                }
                isLon = !isLon;
            }
        }
        return [minLat, minLon, maxLat, maxLon];
    };
    const decode_bbox_int = (hashInt, bitDepth = 52) => {
        let maxLat = MAX_LAT;
        let minLat = MIN_LAT;
        let maxLon = MAX_LON;
        let minLon = MIN_LON;
        let latBit = 0, lonBit = 0;
        const step = bitDepth / 2;
        for (let i = 0; i < step; i++) {
            lonBit = get_bit(hashInt, (step - i) * 2 - 1);
            latBit = get_bit(hashInt, (step - i) * 2 - 2);
            if (latBit === 0) {
                maxLat = (maxLat + minLat) / 2;
            }
            else {
                minLat = (maxLat + minLat) / 2;
            }
            if (lonBit === 0) {
                maxLon = (maxLon + minLon) / 2;
            }
            else {
                minLon = (maxLon + minLon) / 2;
            }
        }
        return [minLat, minLon, maxLat, maxLon];
    };
    const get_bit = (bits, position) => (bits / Math.pow(2, position)) & 0x01;
    const decode = (hashString) => {
        const bbox = decode_bbox(hashString);
        const lat = (bbox[0] + bbox[2]) / 2;
        const lon = (bbox[1] + bbox[3]) / 2;
        const latErr = bbox[2] - lat;
        const lonErr = bbox[3] - lon;
        return {
            latitude: lat,
            longitude: lon,
            error: { latitude: latErr, longitude: lonErr },
        };
    };
    const decode_int = (hashInt, bitDepth = 52) => {
        const bbox = decode_bbox_int(hashInt, bitDepth);
        const lat = (bbox[0] + bbox[2]) / 2;
        const lon = (bbox[1] + bbox[3]) / 2;
        const latErr = bbox[2] - lat;
        const lonErr = bbox[3] - lon;
        return {
            latitude: lat,
            longitude: lon,
            error: { latitude: latErr, longitude: lonErr },
        };
    };
    const neighbor = (hashString, direction) => {
        const lonLat = decode(hashString);
        const neighborLat = lonLat.latitude + direction[0] * lonLat.error.latitude * 2;
        const neighborLon = lonLat.longitude + direction[1] * lonLat.error.longitude * 2;
        const validLon = ensure_valid_lon(neighborLon);
        const validLat = ensure_valid_lat(neighborLat);
        return encode(validLat, validLon, hashString.length);
    };
    const neighbor_int = (hashInt, direction, bitDepth = 52) => {
        const lonlat = decode_int(hashInt, bitDepth);
        const neighborLat = lonlat.latitude + direction[0] * lonlat.error.latitude * 2;
        const neighborLon = lonlat.longitude + direction[1] * lonlat.error.longitude * 2;
        const validLon = ensure_valid_lon(neighborLon);
        const validLat = ensure_valid_lat(neighborLat);
        return encode_int(validLat, validLon, bitDepth);
    };
    const neighbors = (hashString) => {
        const hashstringLength = hashString.length;
        const lonlat = decode(hashString);
        const lat = lonlat.latitude;
        const lon = lonlat.longitude;
        const latErr = lonlat.error.latitude * 2;
        const lonErr = lonlat.error.longitude * 2;
        const neighborHashList = [
            encodeNeighbor(1, 0),
            encodeNeighbor(1, 1),
            encodeNeighbor(0, 1),
            encodeNeighbor(-1, 1),
            encodeNeighbor(-1, 0),
            encodeNeighbor(-1, -1),
            encodeNeighbor(0, -1),
            encodeNeighbor(1, -1),
        ];
        function encodeNeighbor(neighborLatDir, neighborLonDir) {
            const neighbor_lat = lat + neighborLatDir * latErr;
            const neighbor_lon = lon + neighborLonDir * lonErr;
            const validLon = ensure_valid_lon(neighbor_lon);
            const validLat = ensure_valid_lat(neighbor_lat);
            return encode(validLat, validLon, hashstringLength);
        }
        return neighborHashList;
    };
    const neighbors_int = (hashInt, bitDepth = 52) => {
        const lonlat = decode_int(hashInt, bitDepth);
        const lat = lonlat.latitude;
        const lon = lonlat.longitude;
        const latErr = lonlat.error.latitude * 2;
        const lonErr = lonlat.error.longitude * 2;
        const neighborHashIntList = [
            encodeNeighbor_int(1, 0),
            encodeNeighbor_int(1, 1),
            encodeNeighbor_int(0, 1),
            encodeNeighbor_int(-1, 1),
            encodeNeighbor_int(-1, 0),
            encodeNeighbor_int(-1, -1),
            encodeNeighbor_int(0, -1),
            encodeNeighbor_int(1, -1),
        ];
        function encodeNeighbor_int(neighborLatDir, neighborLonDir) {
            const neighbor_lat = lat + neighborLatDir * latErr;
            const neighbor_lon = lon + neighborLonDir * lonErr;
            const validLon = ensure_valid_lon(neighbor_lon);
            const validLat = ensure_valid_lat(neighbor_lat);
            return encode_int(validLat, validLon, bitDepth);
        }
        return neighborHashIntList;
    };
    const bboxes = (minLat, minLon, maxLat, maxLon, numberOfChars) => {
        if (numberOfChars <= 0) {
            throw new Error('numberOfChars must be strictly positive');
        }
        numberOfChars = numberOfChars || 9;
        const hashSouthWest = encode(minLat, minLon, numberOfChars);
        const hashNorthEast = encode(maxLat, maxLon, numberOfChars);
        const latLon = decode(hashSouthWest);
        const perLat = latLon.error.latitude * 2;
        const perLon = latLon.error.longitude * 2;
        const boxSouthWest = decode_bbox(hashSouthWest);
        const boxNorthEast = decode_bbox(hashNorthEast);
        const latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
        const lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);
        const hashList = [];
        for (let lat = 0; lat <= latStep; lat++) {
            for (let lon = 0; lon <= lonStep; lon++) {
                hashList.push(neighbor(hashSouthWest, [lat, lon]));
            }
        }
        return hashList;
    };
    const bboxes_int = (minLat, minLon, maxLat, maxLon, bitDepth) => {
        bitDepth = bitDepth || 52;
        const hashSouthWest = encode_int(minLat, minLon, bitDepth);
        const hashNorthEast = encode_int(maxLat, maxLon, bitDepth);
        const latlon = decode_int(hashSouthWest, bitDepth);
        const perLat = latlon.error.latitude * 2;
        const perLon = latlon.error.longitude * 2;
        const boxSouthWest = decode_bbox_int(hashSouthWest, bitDepth);
        const boxNorthEast = decode_bbox_int(hashNorthEast, bitDepth);
        const latStep = Math.round((boxNorthEast[0] - boxSouthWest[0]) / perLat);
        const lonStep = Math.round((boxNorthEast[1] - boxSouthWest[1]) / perLon);
        const hashList = [];
        for (let lat = 0; lat <= latStep; lat++) {
            for (let lon = 0; lon <= lonStep; lon++) {
                hashList.push(neighbor_int(hashSouthWest, [lat, lon], bitDepth));
            }
        }
        return hashList;
    };
    const ensure_valid_lon = (lon) => {
        if (lon > MAX_LON)
            return MIN_LON + (lon % MAX_LON);
        if (lon < MIN_LON)
            return MAX_LON + (lon % MAX_LON);
        return lon;
    };
    const ensure_valid_lat = (lat) => {
        if (lat > MAX_LAT)
            return MAX_LAT;
        if (lat < MIN_LAT)
            return MIN_LAT;
        return lat;
    };
    const Geohash = {
        ENCODE_AUTO,
        encode,
        encode_uint64: encode_int,
        encode_int,
        decode,
        decode_int,
        decode_uint64: decode_int,
        decode_bbox,
        decode_bbox_uint64: decode_bbox_int,
        decode_bbox_int,
        neighbor,
        neighbor_int,
        neighbors,
        neighbors_int,
        bboxes,
        bboxes_int,
    };
    exports.default = Geohash;
});
define("@scom/scom-social-sdk/utils/lightningWallet.ts", ["require", "exports", "@ijstech/ln-wallet", "@scom/scom-social-sdk/core/index.ts"], function (require, exports, ln_wallet_1, index_5) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.LightningWalletManager = void 0;
    class LightningWalletManager {
        constructor() {
            this.webln = new ln_wallet_1.WebLN();
        }
        set privateKey(privateKey) {
            this._privateKey = privateKey;
        }
        isAvailable() {
            return typeof this.webln.provider !== "undefined";
        }
        async makeZapInvoice(recipient, lnAddress, amount, comment, relays, eventId) {
            if (!lnAddress) {
                return null;
            }
            const zapEndpoint = await this.getZapEndpoint(lnAddress);
            if (!zapEndpoint) {
                throw new Error("no zap endpoint");
            }
            const millisats = Math.round(amount * 1000);
            let nip57 = this.createNip57Event(comment, relays, millisats, recipient, eventId);
            let lnurl2 = `${zapEndpoint}?amount=${millisats}&nostr=${encodeURI(JSON.stringify(nip57))}`;
            let lud06Res2;
            try {
                let r = await fetch(lnurl2);
                lud06Res2 = await r.json();
            }
            catch (e) {
                throw e;
            }
            return lud06Res2.pr;
        }
        async makeInvoice(amount, comment) {
            const invoice = await this.webln.makeInvoice({
                amount,
                defaultMemo: comment
            });
            return invoice.paymentRequest;
        }
        async sendPayment(paymentRequest) {
            const response = await this.webln.sendPayment(paymentRequest);
            return response.preimage;
        }
        createNip57Event(comment, relays, amount, recipient, eventId) {
            let nip57 = {
                kind: 9734,
                content: comment,
                tags: [
                    ["relays"].concat(relays),
                    ["amount", amount.toString()],
                    ["p", recipient]
                ],
                created_at: Math.round(Date.now() / 1000),
            };
            if (eventId) {
                // if (recipient != event.pubkey) {
                //     throw new Error("recipient != event.pubkey");
                // }
                nip57.tags.push(["e", eventId /*event.pubkey*/]);
            }
            nip57 = index_5.Event.finishEvent(nip57, this._privateKey);
            return nip57;
        }
        async getZapEndpoint(lnAddress) {
            let lnurl;
            let [name, domain] = lnAddress.split('@');
            lnurl = `https://${domain}/.well-known/lnurlp/${name}`;
            let lud06Res1 = await (await fetch(lnurl)).json();
            // if (lud06Res1.status != "OK") {
            //     throw new Error("status no OK");
            // }
            // if (!lud06Res1.allowsNostr) {
            //     throw new Error("nostr not allowed");
            // }
            // if (!lud06Res1.callback) {
            //     throw new Error("missing callback");
            // }
            // if (millisats < lud06Res1.minSendable || millisats > lud06Res1.maxSendable) {
            //     throw new Error("amount out of range");
            // }
            // if (lud06Res1.commentAllowed && lud06Res1.commentAllowed < comment.length) {
            //     throw new Error("comment too long");
            // }
            if (lud06Res1.allowsNostr && lud06Res1.nostrPubkey) {
                return lud06Res1.callback;
            }
            return null;
        }
        async zap(recipient, lnAddress, amount, comment, relays, eventId) {
            let paymentRequest = await this.makeZapInvoice(recipient, lnAddress, amount, comment, relays, eventId);
            if (!paymentRequest) {
                throw new Error("no payment request");
            }
            let response;
            try {
                response = await this.webln.sendPayment(paymentRequest);
            }
            catch (e) {
                throw e;
            }
            return response;
        }
        async getBalance() {
            const balance = this.webln.getBalance();
            return balance;
        }
    }
    exports.LightningWalletManager = LightningWalletManager;
});
define("@scom/scom-social-sdk/managers/dataManager.ts", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/index.ts", "@scom/scom-social-sdk/managers/communication.ts", "@scom/scom-social-sdk/utils/geohash.ts", "@scom/scom-mqtt", "@scom/scom-social-sdk/utils/lightningWallet.ts", "@scom/scom-social-sdk/managers/utilsManager.ts", "@scom/scom-social-sdk/managers/eventManagerWrite.ts", "@scom/scom-social-sdk/managers/eventManagerRead.ts", "@scom/scom-social-sdk/managers/eventManagerReadV2.ts", "@scom/scom-social-sdk/managers/eventManagerReadV1o5.ts", "@scom/scom-signer", "@ijstech/eth-wallet"], function (require, exports, index_6, utils_18, communication_1, geohash_1, scom_mqtt_1, lightningWallet_1, utilsManager_5, eventManagerWrite_1, eventManagerRead_1, eventManagerReadV2_1, eventManagerReadV1o5_2, scom_signer_2, eth_wallet_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.SocialDataManager = void 0;
    class SocialDataManager {
        constructor(config) {
            this._apiBaseUrl = config.apiBaseUrl || '';
            this._ipLocationServiceBaseUrl = config.ipLocationServiceBaseUrl;
            this._publicIndexingRelay = config.publicIndexingRelay;
            const writeRelaysManagers = this._initializeWriteRelaysManagers(config.writeRelays);
            if (config.readManager) {
                this._socialEventManagerRead = config.readManager;
            }
            else {
                let nostrReadRelayManager = new communication_1.NostrRestAPIManager(config.readRelay);
                if (config.version === 2) {
                    this._socialEventManagerRead = new eventManagerReadV2_1.NostrEventManagerReadV2(nostrReadRelayManager);
                }
                else if (config.version === 1.5) {
                    this._socialEventManagerRead = new eventManagerReadV1o5_2.NostrEventManagerReadV1o5(nostrReadRelayManager);
                }
                else {
                    this._socialEventManagerRead = new eventManagerRead_1.NostrEventManagerRead(nostrReadRelayManager);
                }
            }
            this._socialEventManagerWrite = new eventManagerWrite_1.NostrEventManagerWrite(writeRelaysManagers, this._publicIndexingRelay);
            if (config.mqttBrokerUrl) {
                try {
                    this.mqttManager = new scom_mqtt_1.MqttManager({
                        brokerUrl: config.mqttBrokerUrl,
                        mqttClientOptions: config.mqttClientOptions,
                        subscriptions: config.mqttSubscriptions,
                        messageCallback: config.mqttMessageCallback
                    });
                }
                catch (e) {
                    console.error('Failed to connect to MQTT broker', e);
                }
            }
            if (config.enableLightningWallet) {
                this.lightningWalletManager = new lightningWallet_1.LightningWalletManager();
            }
        }
        async dispose() {
            if (this.mqttManager) {
                await this.mqttManager.disconnect();
                this.mqttManager = null;
            }
        }
        set privateKey(privateKey) {
            this._privateKey = privateKey;
            this._selfPubkey = utilsManager_5.SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
            this._socialEventManagerRead.privateKey = privateKey;
            this._socialEventManagerWrite.privateKey = privateKey;
            if (this.lightningWalletManager) {
                this.lightningWalletManager.privateKey = privateKey;
            }
        }
        get socialEventManagerRead() {
            return this._socialEventManagerRead;
        }
        get socialEventManagerWrite() {
            return this._socialEventManagerWrite;
        }
        set relays(value) {
            const writeRelaysManagers = this._initializeWriteRelaysManagers(value);
            this._socialEventManagerWrite.nostrCommunicationManagers = writeRelaysManagers;
        }
        get privateKey() {
            return this._privateKey;
        }
        get selfPubkey() {
            return this._selfPubkey;
        }
        _initializeWriteRelaysManagers(relays) {
            if (!relays || relays.length === 0) {
                this._writeRelays = [];
                return [];
            }
            this._writeRelays = [this._publicIndexingRelay, ...relays];
            this._writeRelays = Array.from(new Set(this._writeRelays));
            let nostrCommunicationManagers = [];
            for (let relay of this._writeRelays) {
                if (relay.startsWith('wss://')) {
                    nostrCommunicationManagers.push(new communication_1.NostrWebSocketManager(relay));
                }
                else {
                    nostrCommunicationManagers.push(new communication_1.NostrRestAPIManager(relay));
                }
            }
            return nostrCommunicationManagers;
        }
        subscribeToMqttTopics(topics) {
            this.mqttManager.subscribe(topics);
        }
        unsubscribeFromMqttTopics(topics) {
            this.mqttManager.unsubscribe(topics);
        }
        publishToMqttTopic(topic, message) {
            this.mqttManager.publish(topic, message);
        }
        async fetchCommunityFeedInfo(creatorId, communityId, since, until) {
            const communityUri = utilsManager_5.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            const events = await this._socialEventManagerRead.fetchCommunityFeed({
                communityUri,
                since,
                until
            });
            const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap
            };
        }
        retrieveCommunityUri(noteEvent, scpData) {
            let communityUri = null;
            if (scpData?.communityUri) {
                communityUri = scpData.communityUri;
            }
            else {
                const replaceableTag = noteEvent.tags.find(tag => tag[0] === 'a');
                if (replaceableTag) {
                    const replaceableTagArr = replaceableTag[1].split(':');
                    if (replaceableTagArr[0] === '34550') {
                        communityUri = replaceableTag[1];
                    }
                }
            }
            return communityUri;
        }
        //To be deprecated
        async retrievePostPrivateKey(event, communityUri, communityPrivateKey) {
            let key = null;
            let postScpData = utilsManager_5.SocialUtilsManager.extractScpData(event, utils_18.ScpStandardId.CommunityPost);
            if (!postScpData)
                return key;
            try {
                const postPrivateKey = await utilsManager_5.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
                const messageContentStr = await utilsManager_5.SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
                const messageContent = JSON.parse(messageContentStr);
                if (communityUri === messageContent.communityUri) {
                    key = postPrivateKey;
                }
            }
            catch (e) {
                // console.error(e);
            }
            return key;
        }
        async decryptPostPrivateKeyForCommunity(options) {
            const { event, selfPubkey, communityUri, communityPublicKey, communityPrivateKey } = options;
            let key = null;
            let postScpData = utilsManager_5.SocialUtilsManager.extractScpData(event, utils_18.ScpStandardId.CommunityPost);
            if (!postScpData)
                return key;
            try {
                if (selfPubkey && communityPublicKey && event.pubkey === selfPubkey) {
                    key = await utilsManager_5.SocialUtilsManager.decryptMessage(this._privateKey, communityPublicKey, postScpData.encryptedKey);
                }
                else if (communityPrivateKey) {
                    const postPrivateKey = await utilsManager_5.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
                    const messageContentStr = await utilsManager_5.SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
                    const messageContent = JSON.parse(messageContentStr);
                    if (communityUri === messageContent.communityUri) {
                        key = postPrivateKey;
                    }
                }
            }
            catch (e) {
                // console.error(e);
            }
            return key;
        }
        async retrieveChannelMessagePrivateKey(event, channelId, communityPrivateKey) {
            let key = null;
            let messageScpData = utilsManager_5.SocialUtilsManager.extractScpData(event, utils_18.ScpStandardId.ChannelMessage);
            try {
                const messagePrivateKey = await utilsManager_5.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, messageScpData.encryptedKey);
                const messageContentStr = await utilsManager_5.SocialUtilsManager.decryptMessage(messagePrivateKey, event.pubkey, event.content);
                const messageContent = JSON.parse(messageContentStr);
                if (channelId === messageContent.channelId) {
                    key = messagePrivateKey;
                }
            }
            catch (e) {
                // console.error(e);
            }
            return key;
        }
        async retrieveCommunityPrivateKey(communityInfo, selfPrivateKey) {
            if (!communityInfo.scpData?.gatekeeperPublicKey)
                return null;
            const encryptedKey = communityInfo.scpData.encryptedKey || communityInfo.memberKeyMap?.[communityInfo.scpData.gatekeeperPublicKey];
            if (!encryptedKey)
                return null;
            let communityPrivateKey;
            const creatorPubkey = communityInfo.eventData.pubkey;
            if (this.selfPubkey === communityInfo.scpData.gatekeeperPublicKey) {
                communityPrivateKey = await utilsManager_5.SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
            }
            else if (this.selfPubkey === creatorPubkey) {
                communityPrivateKey = await utilsManager_5.SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, encryptedKey);
            }
            return communityPrivateKey;
        }
        async constructCommunityNoteIdToPrivateKeyMap(communityInfo, noteInfoList) {
            let noteIdToPrivateKey = {};
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
            for (const note of noteInfoList) {
                let postPrivateKey = await this.decryptPostPrivateKeyForCommunity({
                    event: note.eventData,
                    selfPubkey: this.selfPubkey,
                    communityUri: communityInfo.communityUri,
                    communityPublicKey: communityInfo.scpData.publicKey,
                    communityPrivateKey
                });
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.eventData.id] = postPrivateKey;
                }
            }
            return noteIdToPrivateKey;
        }
        async retrieveCommunityPostKeys(options) {
            const { communityInfo, noteInfoList } = options;
            let noteIdToPrivateKey = {};
            if (options.gatekeeperUrl) {
                const authHeader = utilsManager_5.SocialUtilsManager.constructAuthHeader(this._privateKey);
                let bodyData = {
                    creatorId: communityInfo.creatorId,
                    communityId: communityInfo.communityId,
                    message: options.message,
                    signature: options.signature,
                    since: options.since,
                    until: options.until
                };
                let url = `${options.gatekeeperUrl}/communities/post-keys`;
                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    },
                    body: JSON.stringify(bodyData)
                });
                let result = await response.json();
                if (result.success) {
                    noteIdToPrivateKey = result.data;
                }
            }
            else {
                noteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(communityInfo, noteInfoList);
            }
            return noteIdToPrivateKey;
        }
        async retrieveCommunityThreadPostKeys(options) {
            const { communityInfo, noteInfoList } = options;
            let noteIdToPrivateKey = {};
            if (options.gatekeeperUrl) {
                const authHeader = utilsManager_5.SocialUtilsManager.constructAuthHeader(this._privateKey);
                let bodyData = {
                    creatorId: communityInfo.creatorId,
                    communityId: communityInfo.communityId,
                    focusedNoteId: options.focusedNoteId,
                    message: options.message,
                    signature: options.signature
                };
                let url = `${options.gatekeeperUrl}/communities/post-keys`;
                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        'Authorization': authHeader
                    },
                    body: JSON.stringify(bodyData)
                });
                let result = await response.json();
                if (result.success) {
                    noteIdToPrivateKey = result.data;
                }
            }
            else {
                noteIdToPrivateKey = await this.constructCommunityNoteIdToPrivateKeyMap(communityInfo, noteInfoList);
            }
            return noteIdToPrivateKey;
        }
        async retrieveCommunityPostKeysByNoteEvents(options) {
            let noteIdToPrivateKey = {};
            let communityPrivateKeyMap = {};
            const noteCommunityMappings = await this.createNoteCommunityMappings(options.notes);
            if (noteCommunityMappings.noteCommunityInfoList.length === 0)
                return noteIdToPrivateKey;
            const communityInfoMap = {};
            for (let communityInfo of noteCommunityMappings.communityInfoList) {
                communityInfoMap[communityInfo.communityUri] = communityInfo;
                if (communityInfo.membershipType === utils_18.MembershipType.Open)
                    continue;
                let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
                if (communityPrivateKey) {
                    communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
                }
            }
            let relayToNotesMap = {};
            for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
                const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
                const communityInfo = communityInfoMap[noteCommunityInfo.communityUri];
                if (!communityInfo)
                    continue;
                if (communityInfo.membershipType === utils_18.MembershipType.Open)
                    continue;
                let postPrivateKey = await this.decryptPostPrivateKeyForCommunity({
                    event: noteCommunityInfo.eventData,
                    selfPubkey: options.pubKey,
                    communityUri: noteCommunityInfo.communityUri,
                    communityPublicKey: communityInfo.scpData.publicKey,
                    communityPrivateKey
                });
                if (postPrivateKey) {
                    noteIdToPrivateKey[noteCommunityInfo.eventData.id] = postPrivateKey;
                }
                else {
                    if (communityInfo.privateRelay) {
                        relayToNotesMap[communityInfo.privateRelay] = relayToNotesMap[communityInfo.privateRelay] || [];
                        relayToNotesMap[communityInfo.privateRelay].push(noteCommunityInfo);
                    }
                    else if (options.gatekeeperUrl) {
                        relayToNotesMap[options.gatekeeperUrl] = relayToNotesMap[options.gatekeeperUrl] || [];
                        relayToNotesMap[options.gatekeeperUrl].push(noteCommunityInfo);
                    }
                }
            }
            if (Object.keys(relayToNotesMap).length > 0) {
                for (let relay in relayToNotesMap) {
                    const noteIds = relayToNotesMap[relay].map(v => v.eventData.id);
                    const signature = await options.getSignature(options.message);
                    const authHeader = utilsManager_5.SocialUtilsManager.constructAuthHeader(this._privateKey);
                    let bodyData = {
                        noteIds: noteIds.join(','),
                        message: options.message,
                        signature: signature
                    };
                    let url = `${relay}/communities/post-keys`;
                    let response = await fetch(url, {
                        method: 'POST',
                        headers: {
                            Accept: 'application/json',
                            'Content-Type': 'application/json',
                            'Authorization': authHeader
                        },
                        body: JSON.stringify(bodyData)
                    });
                    let result = await response.json();
                    if (result.success) {
                        noteIdToPrivateKey = {
                            ...noteIdToPrivateKey,
                            ...result.data
                        };
                    }
                }
            }
            return noteIdToPrivateKey;
        }
        async checkIfUserHasAccessToCommunity(options) {
            const { communityInfo, gatekeeperUrl, walletAddresses } = options;
            let data = { hasAccess: false, subscriptions: [], isWhiteListed: false };
            const pubkey = index_6.Keys.getPublicKey(this._privateKey);
            let bodyData = {
                creatorId: communityInfo.creatorId,
                communityId: communityInfo.communityId,
                pubkey,
                walletAddresses
            };
            let url = `${gatekeeperUrl}/communities/check-user-access`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            if (result.success) {
                data = result.data;
            }
            return data;
        }
        async constructMetadataByPubKeyMap(notes) {
            let mentionAuthorSet = new Set();
            for (let i = 0; i < notes.length; i++) {
                const mentionTags = notes[i].tags.filter(tag => tag[0] === 'p' && tag[1] !== notes[i].pubkey)?.map(tag => tag[1]) || [];
                if (mentionTags.length) {
                    mentionTags.forEach(tag => mentionAuthorSet.add(tag));
                }
            }
            const uniqueKeys = Array.from(mentionAuthorSet);
            const npubs = notes.map(note => note.pubkey).filter((value, index, self) => self.indexOf(value) === index);
            const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
                pubKeys: [...npubs, ...uniqueKeys]
            });
            const metadataByPubKeyMap = metadata.reduce((acc, cur) => {
                const content = JSON.parse(cur.content);
                if (cur.pubkey) {
                    acc[cur.pubkey] = {
                        ...cur,
                        content
                    };
                }
                return acc;
            }, {});
            return metadataByPubKeyMap;
        }
        async fetchUserProfiles(pubKeys) {
            if (pubKeys.length === 0)
                return [];
            let metadataArr = [];
            let followersCountMap = {};
            try {
                const events = await this._socialEventManagerRead.fetchUserProfileCacheEvents({ pubKeys });
                for (let event of events) {
                    if (event.kind === 0) {
                        metadataArr.push({
                            ...event,
                            content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                        });
                    }
                    else if (event.kind === 10000108) {
                        followersCountMap = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                    }
                }
            }
            catch (error) {
                console.error('fetchUserProfiles', error);
            }
            if (metadataArr.length == 0)
                return null;
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = utilsManager_5.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        //To be deprecated
        async updateUserProfile(content) {
            await this._socialEventManagerWrite.updateUserProfile(content);
        }
        async updateUserProfileV2(profile) {
            const content = {
                ...profile.metadata?.content,
                name: profile.username,
                display_name: profile.displayName,
                website: profile.website,
                picture: profile.avatar,
                about: profile.description,
                banner: profile.banner,
                eth_wallet: profile.ethWallet,
                telegram_account: profile.telegramAccount,
            };
            await this._socialEventManagerWrite.updateUserProfile(content);
        }
        async fetchTrendingNotesInfo() {
            let notes = [];
            let metadataByPubKeyMap = {};
            const events = await this._socialEventManagerRead.fetchTrendingCacheEvents({});
            for (let event of events) {
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    };
                }
                else if (event.kind === 1) {
                    notes.push({
                        eventData: event
                    });
                }
            }
            return {
                notes,
                metadataByPubKeyMap
            };
        }
        constructNoteCommunity(noteEvent, communityInfoMap) {
            let community;
            if (noteEvent.tags?.length) {
                let scpData = utilsManager_5.SocialUtilsManager.extractScpData(noteEvent, utils_18.ScpStandardId.CommunityPost);
                let communityUri = this.retrieveCommunityUri(noteEvent, scpData);
                if (communityUri) {
                    const communityInfo = communityInfoMap[communityUri];
                    const { creatorId, communityId } = utilsManager_5.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    community = {
                        communityUri,
                        communityId: communityInfo?.communityId || communityId,
                        creatorId: communityInfo?.creatorId || index_6.Nip19.npubEncode(creatorId),
                        photoUrl: communityInfo?.avatarImgUrl || communityInfo?.bannerImgUrl,
                        parentCommunityUri: communityInfo?.parentCommunityUri,
                        privateRelay: communityInfo?.privateRelay,
                        isExclusive: communityInfo?.membershipType === utils_18.MembershipType.Protected,
                        isWhitelist: communityInfo?.policies?.[0]?.policyType === utils_18.ProtectedMembershipPolicyType.Whitelist,
                        policies: communityInfo?.policies
                    };
                }
            }
            return community;
        }
        async fetchProfileFeedInfo(pubKey, since = 0, until) {
            const events = await this._socialEventManagerRead.fetchProfileFeedCacheEvents({
                userPubkey: this.selfPubkey,
                pubKey,
                since,
                until
            });
            const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
            const { notes, metadataByPubKeyMap, quotedNotesMap, noteToRepostIdMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(events);
            const communityInfoMap = {};
            if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                    pubkeyToCommunityIdsMap
                });
                for (let event of communityEvents) {
                    let communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                    communityInfoMap[communityInfo.communityUri] = communityInfo;
                }
            }
            for (let note of notes) {
                note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
                const noteId = note.eventData.id;
                const repostId = noteToRepostIdMap[noteId];
                if (!repostId)
                    continue;
                const metadata = metadataByPubKeyMap[repostId];
                if (!metadata)
                    continue;
                const metadataContent = metadata.content;
                const encodedPubkey = index_6.Nip19.npubEncode(metadata.pubkey);
                const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
                note.repost = {
                    id: encodedPubkey,
                    username: '',
                    description: metadataContent.about,
                    avatar: metadataContent.picture,
                    pubKey: encodedPubkey,
                    displayName: metadataContent.display_name || metadataContent.name,
                    internetIdentifier: internetIdentifier
                };
            }
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap,
                earliest
            };
        }
        async fetchProfileRepliesInfo(pubKey, since = 0, until) {
            const events = await this._socialEventManagerRead.fetchProfileRepliesCacheEvents({
                userPubkey: this.selfPubkey,
                pubKey,
                since,
                until
            });
            const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
            const { notes, metadataByPubKeyMap, quotedNotesMap, noteToParentAuthorIdMap } = this.createNoteEventMappings(events, true);
            for (let note of notes) {
                const noteId = note.eventData.id;
                const parentAuthorId = noteToParentAuthorIdMap[noteId];
                if (!parentAuthorId)
                    continue;
                const metadata = metadataByPubKeyMap[parentAuthorId];
                if (!metadata)
                    continue;
                const metadataContent = metadata.content;
                const encodedPubkey = index_6.Nip19.npubEncode(metadata.pubkey);
                const internetIdentifier = typeof metadataContent.nip05 === 'string' ? metadataContent.nip05?.replace('_@', '') || '' : '';
                note.parentAuthor = {
                    id: encodedPubkey,
                    username: '',
                    description: metadataContent.about,
                    avatar: metadataContent.picture,
                    pubKey: encodedPubkey,
                    displayName: metadataContent.display_name || metadataContent.name,
                    internetIdentifier: internetIdentifier
                };
            }
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap,
                earliest
            };
        }
        async fetchEventsByIds(ids) {
            const events = await this._socialEventManagerRead.fetchEventsByIds({ ids });
            return events;
        }
        async fetchNotesByIds(ids) {
            const noteEvents = await this._socialEventManagerRead.fetchEventsByIds({ ids });
            const { notes, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(noteEvents);
            let metadataByPubKeyMap = await this.constructMetadataByPubKeyMap(noteEvents);
            const communityInfoMap = {};
            if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                    pubkeyToCommunityIdsMap
                });
                for (let event of communityEvents) {
                    let communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                    communityInfoMap[communityInfo.communityUri] = communityInfo;
                }
            }
            for (let note of notes) {
                if (!note.actions)
                    note.actions = {};
                note.actions.bookmarked = true;
                note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
            }
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap
            };
        }
        async fetchTempEvents(ids) {
            const noteEvents = await this._socialEventManagerRead.fetchTempEvents({ ids });
            return noteEvents;
        }
        getEarliestEventTimestamp(events) {
            if (!events || events.length === 0) {
                return 0;
            }
            return events.reduce((createdAt, event) => {
                return Math.min(createdAt, event.created_at);
            }, events[0].created_at);
        }
        async fetchHomeFeedInfo(pubKey, since = 0, until) {
            let events = await this._socialEventManagerRead.fetchHomeFeedCacheEvents({
                pubKey,
                since,
                until
            });
            const earliest = this.getEarliestEventTimestamp(events.filter(v => v.kind === 1).filter(v => v.created_at));
            const { notes, metadataByPubKeyMap, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(events);
            const communityInfoMap = {};
            if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                    pubkeyToCommunityIdsMap
                });
                for (let event of communityEvents) {
                    let communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                    communityInfoMap[communityInfo.communityUri] = communityInfo;
                }
            }
            for (let note of notes) {
                note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
            }
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap,
                earliest
            };
        }
        async fetchUserFollowingFeedInfo(pubKey, until) {
            let events = await this._socialEventManagerRead.fetchUserFollowingFeed({
                pubKey,
                until
            });
            const earliest = this.getEarliestEventTimestamp(events.filter(v => (v.kind === 1 || v.kind === 6) && v.created_at));
            const { notes, metadataByPubKeyMap, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(events);
            const communityInfoMap = {};
            if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                    pubkeyToCommunityIdsMap
                });
                for (let event of communityEvents) {
                    let communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                    communityInfoMap[communityInfo.communityUri] = communityInfo;
                }
            }
            for (let note of notes) {
                note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
            }
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap,
                earliest
            };
        }
        createNoteEventMappings(events, parentAuthorsInfo = false) {
            let notes = [];
            let metadataByPubKeyMap = {};
            let quotedNotesMap = {};
            let noteToParentAuthorIdMap = {};
            let noteToRepostIdMap = {};
            let noteStatsMap = {};
            let noteActionsMap = {};
            let pubkeyToCommunityIdsMap = {};
            for (let event of events) {
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    };
                }
                else if (event.kind === 10000107) {
                    if (!event.content)
                        continue;
                    const noteEvent = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                    quotedNotesMap[noteEvent.id] = {
                        eventData: noteEvent
                    };
                }
                else if (event.kind === 1) {
                    notes.push({
                        eventData: event
                    });
                    if (parentAuthorsInfo) {
                        const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                        if (parentAuthors.length > 0) {
                            noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                        }
                    }
                }
                else if (event.kind === 6) {
                    if (!event.content)
                        continue;
                    const originalNoteContent = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                    notes.push({
                        eventData: originalNoteContent
                    });
                    if (originalNoteContent?.id)
                        noteToRepostIdMap[originalNoteContent.id] = event.pubkey;
                    if (parentAuthorsInfo) {
                        const parentAuthors = event.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || [];
                        if (parentAuthors.length > 0) {
                            noteToParentAuthorIdMap[event.id] = parentAuthors[parentAuthors.length - 1];
                        }
                    }
                }
                else if (event.kind === 10000100) {
                    if (!event.content)
                        continue;
                    const content = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                    noteStatsMap[content.event_id] = {
                        upvotes: content.likes,
                        replies: content.replies,
                        reposts: content.reposts,
                        satszapped: content.satszapped,
                        status: content.status
                    };
                }
                else if (event.kind === 10000113) {
                    //"{\"since\":1700034697,\"until\":1700044097,\"order_by\":\"created_at\"}"
                    const timeInfo = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                }
                else if (event.kind === 10000115) {
                    if (!event.content)
                        continue;
                    const content = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                    noteActionsMap[content.event_id] = {
                        liked: content.liked,
                        replied: content.replied,
                        reposted: content.reposted,
                        zapped: content.zapped
                    };
                }
            }
            for (let note of notes) {
                const noteId = note.eventData?.id;
                note.stats = noteStatsMap[noteId];
                note.actions = noteActionsMap[noteId];
                const communityUri = note.eventData?.tags?.find(tag => tag[0] === 'a')?.[1];
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_5.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    if (!pubkeyToCommunityIdsMap[creatorId]) {
                        pubkeyToCommunityIdsMap[creatorId] = [];
                    }
                    if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                        pubkeyToCommunityIdsMap[creatorId].push(communityId);
                    }
                }
            }
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap,
                noteToParentAuthorIdMap,
                noteStatsMap,
                noteToRepostIdMap,
                noteActionsMap,
                pubkeyToCommunityIdsMap
            };
        }
        async fetchCommunityInfo(creatorId, communityId) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunity({
                creatorId,
                communityId
            });
            const communityEvent = communityEvents.find(event => event.kind === 34550);
            if (!communityEvent)
                return null;
            let communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(communityEvent);
            //Fetch group keys only when scpData.encryptedKey is undefined for backward compatibility
            if (communityInfo.membershipType === utils_18.MembershipType.Protected && !communityInfo.scpData?.encryptedKey) {
                const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                    identifiers: [communityInfo.communityUri + ':keys']
                });
                const keyEvent = keyEvents[0];
                if (keyEvent) {
                    communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                }
            }
            return communityInfo;
        }
        getRandomInt(min, max) {
            const minCeiled = Math.ceil(min);
            const maxFloored = Math.floor(max);
            return Math.floor(Math.random() * (maxFloored - minCeiled + 1) + minCeiled);
        }
        constructLeaderboard(members, min, max) {
            const data = members.map(m => ({
                npub: m.id,
                username: m.username,
                displayName: m.name,
                avatar: m.profileImageUrl,
                internetIdentifier: m.internetIdentifier,
                point: this.getRandomInt(min, max)
            })).sort((a, b) => b.point - a.point).slice(0, 10);
            return data;
        }
        async fetchCommunityLeaderboard(community) {
            const communityUriToMembersMap = await this.fetchCommunitiesMembers([community]);
            const members = communityUriToMembersMap[community.communityUri] || [];
            const allTime = this.constructLeaderboard(members, 100, 600);
            const monthly = this.constructLeaderboard(members, 40, 99);
            const weekly = this.constructLeaderboard(members, 1, 39);
            return {
                allTime,
                monthly,
                weekly
            };
        }
        async fetchUserRelatedCommunityFeedInfo(pubKey, since, until) {
            let result = [];
            const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunitiesFeed({ pubKey, since, until });
            const statsEvents = events.filter(event => event.kind === 10000100);
            // const {
            //     notes,
            //     metadataByPubKeyMap,
            //     quotedNotesMap
            // } = this.createNoteEventMappings(feedEvents);
            let noteStatsMap = {};
            for (let event of statsEvents) {
                const content = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                noteStatsMap[content.event_id] = {
                    upvotes: content.likes,
                    replies: content.replies,
                    reposts: content.reposts,
                    satszapped: content.satszapped
                };
            }
            const notesEvents = events.filter(event => event.kind === 1);
            for (let noteEvent of notesEvents) {
                if (noteEvent.tags?.length) {
                    const communityUri = noteEvent.tags.find(tag => tag[0] === 'a')?.[1];
                    if (communityUri) {
                        const { creatorId, communityId } = utilsManager_5.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                        const stats = noteStatsMap[noteEvent.id];
                        const noteInfo = {
                            eventData: noteEvent,
                            stats,
                            community: {
                                communityUri,
                                communityId,
                                creatorId: index_6.Nip19.npubEncode(creatorId)
                            }
                        };
                        result.push(noteInfo);
                    }
                }
            }
            return result;
        }
        async fetchThreadNotesInfo(focusedNoteId) {
            let focusedNote;
            let ancestorNotes = [];
            let replies = [];
            let childReplyEventTagIds = [];
            //Ancestor posts -> Focused post -> Child replies
            let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? index_6.Nip19.decode(focusedNoteId).data : focusedNoteId;
            const threadEvents = await this._socialEventManagerRead.fetchThreadCacheEvents({
                id: decodedFocusedNoteId,
                pubKey: this.selfPubkey
            });
            const { notes, metadataByPubKeyMap, quotedNotesMap, pubkeyToCommunityIdsMap } = this.createNoteEventMappings(threadEvents);
            const communityInfoMap = {};
            if (Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                    pubkeyToCommunityIdsMap
                });
                for (let event of communityEvents) {
                    let communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                    communityInfoMap[communityInfo.communityUri] = communityInfo;
                }
            }
            const quotedPubKeys = [];
            for (let eventId in quotedNotesMap) {
                const pubKey = quotedNotesMap[eventId].eventData.pubkey;
                if (!metadataByPubKeyMap[pubKey])
                    quotedPubKeys.push(pubKey);
            }
            if (quotedPubKeys.length > 0) {
                const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
                    pubKeys: quotedPubKeys
                });
                const _metadataByPubKeyMap = metadata.reduce((acc, cur) => {
                    const content = JSON.parse(cur.content);
                    if (cur.pubkey) {
                        acc[cur.pubkey] = {
                            ...cur,
                            content
                        };
                    }
                    return acc;
                }, {});
                Object.assign(metadataByPubKeyMap, _metadataByPubKeyMap);
            }
            for (let note of notes) {
                note.community = this.constructNoteCommunity(note.eventData, communityInfoMap);
                if (note.eventData.id === decodedFocusedNoteId) {
                    focusedNote = note;
                }
                else if (note.eventData.tags.some(tag => tag[0] === 'e' && tag[1] === decodedFocusedNoteId)) {
                    replies.push(note);
                }
                else {
                    ancestorNotes.push(note);
                }
            }
            replies = replies.sort((a, b) => b.eventData.created_at - a.eventData.created_at);
            ancestorNotes = ancestorNotes.sort((a, b) => a.eventData.created_at - b.eventData.created_at);
            let communityInfo = null;
            let scpData = utilsManager_5.SocialUtilsManager.extractScpData(focusedNote.eventData, utils_18.ScpStandardId.CommunityPost);
            if (scpData) {
                const communityUri = this.retrieveCommunityUri(focusedNote.eventData, scpData);
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_5.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                    communityInfo = await this.fetchCommunityInfo(creatorId, communityId);
                }
            }
            return {
                focusedNote,
                ancestorNotes,
                replies,
                quotedNotesMap,
                metadataByPubKeyMap,
                childReplyEventTagIds,
                communityInfo
            };
        }
        async createNoteCommunityMappings(notes) {
            let noteCommunityInfoList = [];
            let pubkeyToCommunityIdsMap = {};
            let communityInfoList = [];
            for (let note of notes) {
                let scpData = utilsManager_5.SocialUtilsManager.extractScpData(note, utils_18.ScpStandardId.CommunityPost);
                if (scpData) {
                    const communityUri = this.retrieveCommunityUri(note, scpData);
                    if (communityUri) {
                        const { creatorId, communityId } = utilsManager_5.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                        pubkeyToCommunityIdsMap[creatorId] = pubkeyToCommunityIdsMap[creatorId] || [];
                        if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                            pubkeyToCommunityIdsMap[creatorId].push(communityId);
                        }
                        noteCommunityInfoList.push({
                            eventData: note,
                            communityUri,
                            communityId,
                            creatorId,
                        });
                    }
                }
            }
            if (noteCommunityInfoList.length > 0) {
                const communityEvents = await this._socialEventManagerRead.fetchCommunities({
                    pubkeyToCommunityIdsMap
                });
                for (let event of communityEvents) {
                    let communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                    communityInfoList.push(communityInfo);
                }
                //Fetch group keys only when scpData.encryptedKey is undefined for backward compatibility
                const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                    identifiers: communityInfoList.filter(v => !v.scpData?.encryptedKey).map(v => v.communityUri + ':keys')
                });
                for (let keyEvent of keyEvents) {
                    const identifier = keyEvent.tags.find(tag => tag[0] === 'd')?.[1];
                    const communityUri = identifier.replace(':keys', '');
                    const communityInfo = communityInfoList.find(v => v.communityUri === communityUri);
                    if (communityInfo) {
                        communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                    }
                }
            }
            return {
                noteCommunityInfoList,
                communityInfoList
            };
        }
        async retrieveUserProfileDetail(options) {
            const { pubKey, telegramAccount } = options;
            let metadata;
            let stats;
            const userProfileEvents = await this._socialEventManagerRead.fetchUserProfileDetailEvents({ pubKey, telegramAccount });
            for (let event of userProfileEvents) {
                if (event.kind === 0) {
                    metadata = {
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    };
                }
                else if (event.kind === 10000105) {
                    let content = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                    stats = {
                        notes: content.note_count,
                        replies: content.reply_count,
                        followers: content.followers_count,
                        following: content.follows_count,
                        relays: content.relay_count,
                        timeJoined: content.time_joined
                    };
                }
            }
            if (!metadata)
                return null;
            let userProfile = utilsManager_5.SocialUtilsManager.constructUserProfile(metadata);
            return {
                userProfile,
                stats
            };
        }
        async fetchUserContactList(pubKey) {
            let metadataArr = [];
            let followersCountMap = {};
            const userContactEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
                pubKey,
                detailIncluded: true
            });
            for (let event of userContactEvents) {
                if (event.kind === 0) {
                    metadataArr.push({
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    });
                }
                else if (event.kind === 10000108) {
                    followersCountMap = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                }
            }
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = utilsManager_5.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        async fetchUserFollowersList(pubKey) {
            let metadataArr = [];
            let followersCountMap = {};
            const userFollowersEvents = await this._socialEventManagerRead.fetchFollowersCacheEvents({ pubKey });
            for (let event of userFollowersEvents) {
                if (event.kind === 0) {
                    metadataArr.push({
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    });
                }
                else if (event.kind === 10000108) {
                    followersCountMap = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                }
            }
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = utilsManager_5.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        async fetchUserRelayList(pubKey) {
            let relayList = [];
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({ pubKey });
            const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
            if (!relaysEvent)
                return relayList;
            relayList = relaysEvent.tags.filter(tag => tag[0] === 'r')?.map(tag => tag[1]) || [];
            relayList = Array.from(new Set(relayList));
            return relayList;
        }
        async followUser(userPubKey) {
            const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_6.Nip19.decode(userPubKey).data : userPubKey;
            const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
                pubKey: this.selfPubkey,
                detailIncluded: false
            });
            let content = '';
            let contactPubKeys = new Set();
            let contactListEvent = contactListEvents.find(event => event.kind === 3);
            if (contactListEvent) {
                content = contactListEvent.content;
                contactPubKeys = new Set(contactListEvent.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || []);
            }
            contactPubKeys.add(decodedUserPubKey);
            await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys));
        }
        async unfollowUser(userPubKey) {
            const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_6.Nip19.decode(userPubKey).data : userPubKey;
            const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents({
                pubKey: this.selfPubkey,
                detailIncluded: false
            });
            let content = '';
            let contactPubKeys = new Set();
            const contactListEvent = contactListEvents.find(event => event.kind === 3);
            if (contactListEvent) {
                content = contactListEvent.content;
                for (let tag of contactListEvent.tags) {
                    if (tag[0] === 'p' && tag[1] !== decodedUserPubKey) {
                        contactPubKeys.add(tag[1]);
                    }
                }
            }
            await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys));
        }
        async generateGroupKeys(privateKey, encryptionPublicKeys) {
            const groupPrivateKey = index_6.Keys.generatePrivateKey();
            const groupPublicKey = index_6.Keys.getPublicKey(groupPrivateKey);
            let encryptedGroupKeys = {};
            for (let encryptionPublicKey of encryptionPublicKeys) {
                const encryptedGroupKey = await utilsManager_5.SocialUtilsManager.encryptMessage(privateKey, encryptionPublicKey, groupPrivateKey);
                encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
            }
            return {
                groupPrivateKey,
                groupPublicKey,
                encryptedGroupKeys
            };
        }
        async createCommunity(newInfo, creatorId) {
            const communityUri = utilsManager_5.SocialUtilsManager.getCommunityUri(creatorId, newInfo.name);
            let communityInfo = {
                communityUri,
                communityId: newInfo.name,
                creatorId,
                description: newInfo.description,
                rules: newInfo.rules,
                bannerImgUrl: newInfo.bannerImgUrl,
                avatarImgUrl: newInfo.avatarImgUrl,
                moderatorIds: newInfo.moderatorIds,
                scpData: newInfo.scpData,
                membershipType: newInfo.membershipType,
                privateRelay: newInfo.privateRelay,
                gatekeeperNpub: newInfo.gatekeeperNpub,
                policies: newInfo.policies,
                pointSystem: newInfo.pointSystem,
                collectibles: newInfo.collectibles,
                parentCommunityUri: newInfo.parentCommunityUri
            };
            if (communityInfo.membershipType === utils_18.MembershipType.Protected) {
                const gatekeeperPublicKey = index_6.Nip19.decode(communityInfo.gatekeeperNpub).data;
                const groupPrivateKey = index_6.Keys.generatePrivateKey();
                const groupPublicKey = index_6.Keys.getPublicKey(groupPrivateKey);
                const encryptedGroupKey = await utilsManager_5.SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
                communityInfo.scpData = {
                    ...communityInfo.scpData,
                    publicKey: groupPublicKey,
                    gatekeeperPublicKey,
                    encryptedKey: encryptedGroupKey
                };
                if (communityInfo.scpData) {
                    const result = await this.updateCommunityChannel(communityInfo);
                    if (result.event.id) {
                        communityInfo.scpData.channelEventId = result.event.id;
                    }
                }
            }
            await this._socialEventManagerWrite.updateCommunity(communityInfo);
            return communityInfo;
        }
        async updateCommunity(info) {
            if (info.membershipType === utils_18.MembershipType.Protected) {
                const gatekeeperPublicKey = index_6.Nip19.decode(info.gatekeeperNpub).data;
                if (info.scpData) {
                    if (!info.scpData.encryptedKey || !info.scpData.gatekeeperPublicKey) {
                        const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
                        const encryptedGroupKey = await utilsManager_5.SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
                        info.scpData = {
                            ...info.scpData,
                            gatekeeperPublicKey,
                            encryptedKey: encryptedGroupKey
                        };
                    }
                }
                else {
                    const groupPrivateKey = index_6.Keys.generatePrivateKey();
                    const groupPublicKey = index_6.Keys.getPublicKey(groupPrivateKey);
                    const encryptedGroupKey = await utilsManager_5.SocialUtilsManager.encryptMessage(this._privateKey, gatekeeperPublicKey, groupPrivateKey);
                    info.scpData = {
                        ...info.scpData,
                        publicKey: groupPublicKey,
                        gatekeeperPublicKey,
                        encryptedKey: encryptedGroupKey
                    };
                }
            }
            await this._socialEventManagerWrite.updateCommunity(info);
            return info;
        }
        async updateCommunityChannel(communityInfo) {
            let channelScpData = {
                communityUri: communityInfo.communityUri
            };
            let channelInfo = {
                name: communityInfo.communityId,
                about: communityInfo.description,
                scpData: channelScpData
            };
            const updateChannelResponse = await this._socialEventManagerWrite.updateChannel(channelInfo);
            return updateChannelResponse;
        }
        async createChannel(channelInfo, memberIds) {
            let encryptionPublicKeys = [];
            for (let memberId of memberIds) {
                const memberPublicKey = index_6.Nip19.decode(memberId).data;
                encryptionPublicKeys.push(memberPublicKey);
            }
            const channelKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
            channelInfo.scpData = {
                ...channelInfo.scpData,
                publicKey: channelKeys.groupPublicKey
            };
            const result = await this._socialEventManagerWrite.updateChannel(channelInfo);
            if (result.event.id) {
                const channelUri = `40:${result.event.id}`;
                await this._socialEventManagerWrite.updateGroupKeys(channelUri + ':keys', 40, JSON.stringify(channelKeys.encryptedGroupKeys), memberIds);
            }
            return channelInfo;
        }
        async updateChannel(channelInfo) {
            const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo);
            return updateChannelResponses;
        }
        async fetchCommunitiesMembers(communities) {
            if (communities.length === 0)
                return {};
            const communityUriToMembersMap = await this._socialEventManagerRead.getCommunityUriToMembersMap(communities);
            return communityUriToMembersMap;
        }
        getEventIdToMemberMap(events) {
            const memberCountsEvents = events.filter(event => event.kind === 10000109);
            let eventIdToMemberCountMap = {};
            for (let event of memberCountsEvents) {
                const content = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                eventIdToMemberCountMap[content.event_id] = content.member_count;
            }
            return eventIdToMemberCountMap;
        }
        async fetchCommunities(query) {
            let communities = [];
            const events = await this._socialEventManagerRead.fetchCommunities({
                query
            });
            let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
            const communityEvents = events.filter(event => event.kind === 34550);
            for (let event of communityEvents) {
                const communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                const memberCount = eventIdToMemberCountMap[event.id] || 0;
                let community = {
                    ...communityInfo,
                    members: [],
                    memberCount
                };
                communities.push(community);
            }
            return communities;
        }
        async fetchMyCommunities(pubKey) {
            let communities = [];
            const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities({ pubKey });
            let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
            const communitiesEvents = events.filter(event => event.kind === 34550);
            for (let event of communitiesEvents) {
                const communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                const memberCount = eventIdToMemberCountMap[event.id] || 0;
                let community = {
                    ...communityInfo,
                    members: [],
                    memberCount
                };
                communities.push(community);
            }
            return communities;
        }
        async fetchUserRoleInCommunity(community, pubKey) {
            if (!pubKey)
                return utils_18.CommunityRole.None;
            if (community.creatorId === pubKey)
                return utils_18.CommunityRole.Creator;
            if (community.moderatorIds?.includes(pubKey))
                return utils_18.CommunityRole.Moderator;
            const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities({ pubKey });
            const decodedCreatorId = community.creatorId.startsWith('npub1') ? index_6.Nip19.decode(community.creatorId).data : community.creatorId;
            const isMember = communities.find(c => c.communityId === community.communityId && c.creatorId === decodedCreatorId) != null;
            return isMember ? utils_18.CommunityRole.GeneralMember : utils_18.CommunityRole.None;
        }
        async joinCommunity(community, pubKey) {
            const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities({ pubKey });
            communities.push(community);
            await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
            if (community.scpData?.channelEventId) {
                const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds({ pubKey });
                channelEventIds.push(community.scpData.channelEventId);
                await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
            }
        }
        async leaveCommunity(community, pubKey) {
            const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities({
                pubKey,
                excludedCommunity: community
            });
            await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities);
            if (community.scpData?.channelEventId) {
                const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds({ pubKey });
                const index = channelEventIds.indexOf(community.scpData.channelEventId);
                if (index > -1) {
                    channelEventIds.splice(index, 1);
                }
                await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds);
            }
        }
        async encryptGroupMessage(privateKey, groupPublicKey, message) {
            const messagePrivateKey = index_6.Keys.generatePrivateKey();
            const messagePublicKey = index_6.Keys.getPublicKey(messagePrivateKey);
            const encryptedGroupKey = await utilsManager_5.SocialUtilsManager.encryptMessage(privateKey, groupPublicKey, messagePrivateKey);
            const encryptedMessage = await utilsManager_5.SocialUtilsManager.encryptMessage(privateKey, messagePublicKey, message);
            return {
                encryptedMessage,
                encryptedGroupKey
            };
        }
        async submitCommunityPost(message, info, conversationPath, timestamp, alt, isPublicPost = false) {
            const messageContent = {
                communityUri: info.communityUri,
                message,
            };
            let newCommunityPostInfo;
            if (info.membershipType === utils_18.MembershipType.Open || isPublicPost) {
                newCommunityPostInfo = {
                    community: info,
                    message,
                    timestamp,
                    conversationPath
                };
            }
            else {
                const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
                newCommunityPostInfo = {
                    community: info,
                    message: encryptedMessage,
                    timestamp,
                    conversationPath,
                    scpData: {
                        encryptedKey: encryptedGroupKey,
                        communityUri: info.communityUri
                    }
                };
            }
            if (alt)
                newCommunityPostInfo.alt = alt;
            const responses = await this._socialEventManagerWrite.submitCommunityPost(newCommunityPostInfo);
            return responses;
        }
        async fetchAllUserRelatedChannels(pubKey) {
            const { channels, channelMetadataMap, channelIdToCommunityMap } = await this._socialEventManagerRead.fetchAllUserRelatedChannels({ pubKey });
            let outputChannels = [];
            for (let channel of channels) {
                const channelMetadata = channelMetadataMap[channel.id];
                const communityInfo = channelIdToCommunityMap[channel.id];
                if (channelMetadata) {
                    outputChannels.push({
                        ...channel,
                        ...channelMetadata,
                        communityInfo: communityInfo
                    });
                }
                else {
                    outputChannels.push({
                        ...channel,
                        communityInfo: communityInfo
                    });
                }
            }
            return outputChannels;
        }
        async retrieveChannelMessages(channelId, since, until) {
            const events = await this._socialEventManagerRead.fetchChannelMessages({
                channelId,
                since,
                until
            });
            const messageEvents = events.filter(event => event.kind === 42);
            return messageEvents;
        }
        async retrieveChannelEvents(creatorId, channelId) {
            const channelEvents = await this._socialEventManagerRead.fetchChannelInfoMessages({ channelId });
            const messageEvents = channelEvents.filter(event => event.kind === 42);
            const channelCreationEvent = channelEvents.find(event => event.kind === 40);
            if (!channelCreationEvent)
                throw new Error('No info event found');
            const channelMetadataEvent = channelEvents.find(event => event.kind === 41);
            let channelInfo;
            if (channelMetadataEvent) {
                channelInfo = utilsManager_5.SocialUtilsManager.extractChannelInfo(channelMetadataEvent);
            }
            else {
                channelInfo = utilsManager_5.SocialUtilsManager.extractChannelInfo(channelCreationEvent);
            }
            if (!channelInfo)
                throw new Error('No info event found');
            return {
                messageEvents,
                info: channelInfo
            };
        }
        async retrieveChannelMessageKeys(options) {
            let messageIdToPrivateKey = {};
            if (options.gatekeeperUrl) {
                const authHeader = utilsManager_5.SocialUtilsManager.constructAuthHeader(this._privateKey);
                let bodyData = {
                    creatorId: options.creatorId,
                    channelId: options.channelId,
                    message: options.message,
                    signature: options.signature
                };
                let url = `${options.gatekeeperUrl}/channels/message-keys`;
                let response = await fetch(url, {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: authHeader
                    },
                    body: JSON.stringify(bodyData)
                });
                let result = await response.json();
                if (result.success) {
                    messageIdToPrivateKey = result.data;
                }
            }
            else if (options.privateKey) {
                let groupPrivateKey;
                const channelEvents = await this.retrieveChannelEvents(options.creatorId, options.channelId);
                const channelInfo = channelEvents.info;
                const messageEvents = channelEvents.messageEvents;
                if (channelInfo.scpData.communityUri) {
                    const { communityId } = utilsManager_5.SocialUtilsManager.getCommunityBasicInfoFromUri(channelInfo.scpData.communityUri);
                    const communityInfo = await this.fetchCommunityInfo(channelInfo.eventData.pubkey, communityId);
                    groupPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
                    if (!groupPrivateKey)
                        return messageIdToPrivateKey;
                }
                else {
                    const groupUri = `40:${channelInfo.id}`;
                    const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                        identifiers: [groupUri + ':keys']
                    });
                    const keyEvent = keyEvents[0];
                    if (keyEvent) {
                        const creatorPubkey = channelInfo.eventData.pubkey;
                        const memberKeyMap = JSON.parse(keyEvent.content);
                        const encryptedKey = memberKeyMap?.[this.selfPubkey];
                        if (encryptedKey) {
                            groupPrivateKey = await utilsManager_5.SocialUtilsManager.decryptMessage(options.privateKey, creatorPubkey, encryptedKey);
                        }
                    }
                }
                for (const messageEvent of messageEvents) {
                    const messagePrivateKey = await this.retrieveChannelMessagePrivateKey(messageEvent, channelInfo.id, groupPrivateKey);
                    if (messagePrivateKey) {
                        messageIdToPrivateKey[messageEvent.id] = messagePrivateKey;
                    }
                }
            }
            return messageIdToPrivateKey;
        }
        async submitChannelMessage(message, channelId, communityPublicKey, conversationPath) {
            const messageContent = {
                channelId,
                message,
            };
            const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, communityPublicKey, JSON.stringify(messageContent));
            const newChannelMessageInfo = {
                channelId: channelId,
                message: encryptedMessage,
                conversationPath,
                scpData: {
                    encryptedKey: encryptedGroupKey,
                    channelId: channelId
                }
            };
            await this._socialEventManagerWrite.submitChannelMessage(newChannelMessageInfo);
        }
        async fetchDirectMessagesBySender(selfPubKey, senderPubKey, since, until) {
            const decodedSenderPubKey = index_6.Nip19.decode(senderPubKey).data;
            const events = await this._socialEventManagerRead.fetchDirectMessages({
                pubKey: selfPubKey,
                sender: decodedSenderPubKey,
                since,
                until
            });
            let metadataByPubKeyMap = {};
            const encryptedMessages = [];
            for (let event of events) {
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    };
                }
                else if (event.kind === 4) {
                    encryptedMessages.push(event);
                }
            }
            return {
                decodedSenderPubKey,
                encryptedMessages,
                metadataByPubKeyMap
            };
        }
        async sendDirectMessage(chatId, message, replyToEventId) {
            const decodedReceiverPubKey = index_6.Nip19.decode(chatId).data;
            const content = await utilsManager_5.SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
            const result = await this._socialEventManagerWrite.sendMessage(decodedReceiverPubKey, content, replyToEventId);
            return result;
        }
        async sendTempMessage(options) {
            const { receiverId, message, replyToEventId, widgetId } = options;
            const decodedReceiverPubKey = index_6.Nip19.decode(receiverId).data;
            const content = await utilsManager_5.SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
            const result = await this._socialEventManagerWrite.sendTempMessage({
                receiver: decodedReceiverPubKey,
                encryptedMessage: content,
                replyToEventId,
                widgetId
            });
            return result;
        }
        async resetMessageCount(selfPubKey, senderPubKey) {
            await this._socialEventManagerRead.resetMessageCount({
                pubKey: selfPubKey,
                sender: senderPubKey
            });
        }
        async fetchMessageContacts(pubKey) {
            const events = await this._socialEventManagerRead.fetchMessageContactsCacheEvents({ pubKey });
            const pubkeyToMessageInfoMap = {};
            let metadataByPubKeyMap = {};
            for (let event of events) {
                if (event.kind === 10000118) {
                    const content = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                    Object.keys(content).forEach(pubkey => {
                        pubkeyToMessageInfoMap[pubkey] = content[pubkey];
                    });
                }
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    };
                }
            }
            let profiles = Object.entries(metadataByPubKeyMap).map(([k, v]) => {
                const encodedPubkey = index_6.Nip19.npubEncode(k);
                return {
                    id: encodedPubkey,
                    pubKey: k,
                    creatorId: encodedPubkey,
                    username: v.content.name,
                    displayName: v.content.display_name,
                    avatar: v.content.picture,
                    banner: v.content.banner,
                    latestAt: pubkeyToMessageInfoMap[k].latest_at,
                    cnt: pubkeyToMessageInfoMap[k].cnt
                };
            });
            const channels = await this.fetchAllUserRelatedChannels(pubKey);
            for (let channel of channels) {
                let creatorId = index_6.Nip19.npubEncode(channel.eventData.pubkey);
                profiles.push({
                    id: channel.id,
                    pubKey: channel.eventData.pubkey,
                    creatorId,
                    username: channel.name,
                    displayName: channel.name,
                    avatar: channel.picture || channel.communityInfo?.avatarImgUrl,
                    banner: '',
                    latestAt: 0,
                    cnt: 0,
                    isGroup: true,
                    channelInfo: channel
                });
            }
            const invitations = await this.fetchUserGroupInvitations(pubKey);
            console.log('invitations', invitations);
            return profiles;
        }
        async fetchUserGroupInvitations(pubKey) {
            const identifiers = [];
            const events = await this._socialEventManagerRead.fetchUserGroupInvitations({
                groupKinds: [40, 34550],
                pubKey
            });
            for (let event of events) {
                const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
                if (identifier) {
                    identifiers.push(identifier);
                }
            }
            return identifiers;
        }
        extractCalendarEventInfo(event) {
            const description = event.content;
            const id = event.tags.find(tag => tag[0] === 'd')?.[1];
            const name = event.tags.find(tag => tag[0] === 'name')?.[1]; //deprecated
            const title = event.tags.find(tag => tag[0] === 'title')?.[1];
            const start = event.tags.find(tag => tag[0] === 'start')?.[1];
            const end = event.tags.find(tag => tag[0] === 'end')?.[1];
            const startTzid = event.tags.find(tag => tag[0] === 'start_tzid')?.[1];
            const endTzid = event.tags.find(tag => tag[0] === 'end_tzid')?.[1];
            const location = event.tags.find(tag => tag[0] === 'location')?.[1];
            const city = event.tags.find(tag => tag[0] === 'city')?.[1];
            let lonlat;
            const geohash = event.tags.find(tag => tag[0] === 'g')?.[1];
            if (geohash) {
                lonlat = geohash_1.default.decode(geohash);
            }
            const image = event.tags.find(tag => tag[0] === 'image')?.[1];
            let type;
            let startTime;
            let endTime;
            if (event.kind === 31922) {
                type = utils_18.CalendarEventType.DateBased;
                const startDate = new Date(start);
                startTime = startDate.getTime() / 1000;
                if (end) {
                    const endDate = new Date(end);
                    endTime = endDate.getTime() / 1000;
                }
            }
            else if (event.kind === 31923) {
                type = utils_18.CalendarEventType.TimeBased;
                startTime = Number(start);
                if (end) {
                    endTime = Number(end);
                }
            }
            const naddr = index_6.Nip19.naddrEncode({
                identifier: id,
                pubkey: event.pubkey,
                kind: event.kind,
                relays: []
            });
            let calendarEventInfo = {
                naddr,
                type,
                id,
                title: title || name,
                description,
                start: startTime,
                end: endTime,
                startTzid,
                endTzid,
                location,
                city,
                latitude: lonlat?.latitude,
                longitude: lonlat?.longitude,
                geohash,
                image,
                eventData: event
            };
            return calendarEventInfo;
        }
        async updateCalendarEvent(updateCalendarEventInfo) {
            const geohash = geohash_1.default.encode(updateCalendarEventInfo.latitude, updateCalendarEventInfo.longitude);
            updateCalendarEventInfo = {
                ...updateCalendarEventInfo,
                geohash
            };
            let naddr;
            const responses = await this._socialEventManagerWrite.updateCalendarEvent(updateCalendarEventInfo);
            const response = responses[0];
            if (response.success) {
                naddr = index_6.Nip19.naddrEncode({
                    identifier: updateCalendarEventInfo.id,
                    pubkey: this.selfPubkey,
                    kind: updateCalendarEventInfo.type === utils_18.CalendarEventType.DateBased ? 31922 : 31923,
                    relays: []
                });
            }
            return naddr;
        }
        async retrieveCalendarEventsByDateRange(start, end, limit, previousEventId) {
            const result = await this._socialEventManagerRead.fetchCalendarEvents({
                start,
                end,
                limit,
                previousEventId
            });
            let calendarEventInfoList = [];
            for (let event of result.events) {
                let calendarEventInfo = this.extractCalendarEventInfo(event);
                calendarEventInfoList.push(calendarEventInfo);
            }
            return {
                calendarEventInfoList,
                startDates: result.data?.dates
            };
        }
        async retrieveCalendarEvent(naddr) {
            let address = index_6.Nip19.decode(naddr).data;
            const calendarEvent = await this._socialEventManagerRead.fetchCalendarEvent({ address });
            if (!calendarEvent)
                return null;
            let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
            let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            let hosts = [];
            let attendees = [];
            let attendeePubkeys = [];
            let attendeePubkeyToEventMap = {};
            const postEvents = await this._socialEventManagerRead.fetchCalendarEventPosts({ calendarEventUri });
            const notes = [];
            for (let postEvent of postEvents) {
                const note = {
                    eventData: postEvent
                };
                notes.push(note);
            }
            const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs({ calendarEventUri });
            for (let rsvpEvent of rsvpEvents) {
                if (attendeePubkeyToEventMap[rsvpEvent.pubkey])
                    continue;
                let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
                if (attendanceStatus === 'accepted') {
                    attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                    attendeePubkeys.push(rsvpEvent.pubkey);
                }
            }
            const userProfileEvents = await this._socialEventManagerRead.fetchUserProfileCacheEvents({
                pubKeys: [
                    ...hostPubkeys,
                    ...attendeePubkeys
                ]
            });
            for (let event of userProfileEvents) {
                if (event.kind === 0) {
                    let metaData = {
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    };
                    let userProfile = utilsManager_5.SocialUtilsManager.constructUserProfile(metaData);
                    if (hostPubkeys.includes(event.pubkey)) {
                        let host = {
                            pubkey: event.pubkey,
                            userProfile
                        };
                        hosts.push(host);
                    }
                    else if (attendeePubkeyToEventMap[event.pubkey]) {
                        let attendee = {
                            pubkey: event.pubkey,
                            userProfile,
                            rsvpEventData: attendeePubkeyToEventMap[event.pubkey]
                        };
                        attendees.push(attendee);
                    }
                }
            }
            let detailInfo = {
                ...calendarEventInfo,
                hosts,
                attendees,
                notes
            };
            return detailInfo;
        }
        async acceptCalendarEvent(rsvpId, naddr) {
            let address = index_6.Nip19.decode(naddr).data;
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs({
                calendarEventUri,
                pubkey: this.selfPubkey
            });
            if (rsvpEvents.length > 0) {
                rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
            }
            await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, true);
        }
        async declineCalendarEvent(rsvpId, naddr) {
            let address = index_6.Nip19.decode(naddr).data;
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs({
                calendarEventUri,
                pubkey: this.selfPubkey
            });
            if (rsvpEvents.length > 0) {
                rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
            }
            await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, false);
        }
        async submitCalendarEventPost(naddr, message, conversationPath) {
            let address = index_6.Nip19.decode(naddr).data;
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            let info = {
                calendarEventUri,
                message,
                conversationPath
            };
            const responses = await this._socialEventManagerWrite.submitCalendarEventPost(info);
            const response = responses[0];
            return response.success ? response.eventId : null;
        }
        async fetchTimezones() {
            const apiUrl = `${this._apiBaseUrl}/timezones`;
            const apiResponse = await fetch(apiUrl);
            const apiResult = await apiResponse.json();
            if (!apiResult.success)
                throw new Error(apiResult.error.message);
            let timezones = [];
            for (let timezone of apiResult.data.timezones) {
                let gmtOffset = utilsManager_5.SocialUtilsManager.getGMTOffset(timezone.timezoneName);
                if (!gmtOffset)
                    continue;
                timezones.push({
                    timezoneName: timezone.timezoneName,
                    description: timezone.description,
                    gmtOffset: gmtOffset
                });
            }
            timezones.sort((a, b) => {
                if (a.gmtOffset.startsWith('GMT-') && b.gmtOffset.startsWith('GMT+'))
                    return -1;
                if (a.gmtOffset.startsWith('GMT+') && b.gmtOffset.startsWith('GMT-'))
                    return 1;
                if (a.gmtOffset.startsWith('GMT-')) {
                    if (a.gmtOffset < b.gmtOffset)
                        return 1;
                    if (a.gmtOffset > b.gmtOffset)
                        return -1;
                }
                else {
                    if (a.gmtOffset > b.gmtOffset)
                        return 1;
                    if (a.gmtOffset < b.gmtOffset)
                        return -1;
                }
                if (a.description < b.description)
                    return -1;
                if (a.description > b.description)
                    return 1;
                return 0;
            });
            return timezones;
        }
        async fetchCitiesByKeyword(keyword) {
            const apiUrl = `${this._apiBaseUrl}/cities?keyword=${keyword}`;
            const apiResponse = await fetch(apiUrl);
            const apiResult = await apiResponse.json();
            if (!apiResult.success)
                throw new Error(apiResult.error.message);
            let cities = [];
            for (let city of apiResult.data.cities) {
                cities.push({
                    id: city.id,
                    city: city.city,
                    cityAscii: city.cityAscii,
                    latitude: city.lat,
                    longitude: city.lng,
                    country: city.country
                });
            }
            return cities;
        }
        async fetchCitiesByCoordinates(latitude, longitude) {
            const apiUrl = `${this._apiBaseUrl}/cities?lat=${latitude}&lng=${longitude}`;
            const apiResponse = await fetch(apiUrl);
            const apiResult = await apiResponse.json();
            if (!apiResult.success)
                throw new Error(apiResult.error.message);
            let cities = [];
            for (let city of apiResult.data.cities) {
                cities.push({
                    id: city.id,
                    city: city.city,
                    cityAscii: city.cityAscii,
                    latitude: city.lat,
                    longitude: city.lng,
                    country: city.country
                });
            }
            return cities;
        }
        async fetchLocationInfoFromIP() {
            if (!this._ipLocationServiceBaseUrl)
                return null;
            const response = await fetch(this._ipLocationServiceBaseUrl);
            const result = await response.json();
            let locationInfo;
            if (result.success) {
                locationInfo = {
                    latitude: result.data.lat,
                    longitude: result.data.long
                };
            }
            return locationInfo;
        }
        async fetchEventMetadataFromIPFS(ipfsBaseUrl, eventId) {
            const url = `${ipfsBaseUrl}/nostr/${eventId}`;
            const response = await fetch(url);
            const result = await response.json();
            return result;
        }
        async getAccountBalance(walletAddress) {
            const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getAccountBalance';
            const bodyData = {
                jsonrpc: '2.0',
                method: 'ankr_getAccountBalance',
                params: {
                    blockchain: [
                        'bsc',
                        'avalanche'
                    ],
                    walletAddress
                },
                id: 1
            };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            const data = await response.json();
            if (data.error) {
                console.log('error', data.error);
                return null;
            }
            return data.result;
        }
        async getNFTsByOwner(walletAddress) {
            const apiUrl = 'https://rpc.ankr.com/multichain/79258ce7f7ee046decc3b5292a24eb4bf7c910d7e39b691384c7ce0cfb839a01/?ankr_getNFTsByOwner';
            const bodyData = {
                jsonrpc: '2.0',
                method: 'ankr_getNFTsByOwner',
                params: {
                    blockchain: [
                        'bsc',
                        'avalanche'
                    ],
                    walletAddress
                },
                id: 1
            };
            const response = await fetch(apiUrl, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(bodyData)
            });
            const data = await response.json();
            if (data.error) {
                console.log('error', data.error);
                return null;
            }
            return data.result;
        }
        async submitMessage(message, conversationPath, createdAt) {
            return this._socialEventManagerWrite.postNote(message, conversationPath, createdAt);
        }
        async submitLongFormContent(info) {
            return this._socialEventManagerWrite.submitLongFormContentEvents(info);
        }
        async submitLike(postEventData) {
            let tags = postEventData.tags.filter(tag => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p'));
            tags.push(['e', postEventData.id]);
            tags.push(['p', postEventData.pubkey]);
            tags.push(['k', postEventData.kind.toString()]);
            await this._socialEventManagerWrite.submitLike(tags);
        }
        async submitRepost(postEventData) {
            let tags = [
                [
                    'e',
                    postEventData.id
                ],
                [
                    'p',
                    postEventData.pubkey
                ]
            ];
            const content = JSON.stringify(postEventData);
            await this._socialEventManagerWrite.submitRepost(content, tags);
        }
        async sendPingRequest(pubkey, relayUrl = this._publicIndexingRelay) {
            const authHeader = utilsManager_5.SocialUtilsManager.constructAuthHeader(this._privateKey);
            const data = {
                pubkey: pubkey,
            };
            let result;
            try {
                let response = await fetch(relayUrl + '/ping', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: authHeader
                    },
                    body: JSON.stringify(data)
                });
                result = await response.json();
            }
            catch (err) {
            }
            return result;
        }
        async checkRelayStatus(pubkey, relayUrl) {
            if (!relayUrl)
                relayUrl = this._publicIndexingRelay;
            const authHeader = utilsManager_5.SocialUtilsManager.constructAuthHeader(this._privateKey);
            const data = {
                pubkey: pubkey,
            };
            let result;
            try {
                let response = await fetch(relayUrl + '/check-status', {
                    method: 'POST',
                    headers: {
                        Accept: 'application/json',
                        'Content-Type': 'application/json',
                        Authorization: authHeader
                    },
                    body: JSON.stringify(data)
                });
                if (response.ok) {
                    result = await response.json();
                }
                else if (response.status === 401) {
                    result = {
                        success: false,
                        error: 'Access Denied: You do not have permission to access this relay.'
                    };
                }
            }
            catch (err) {
            }
            return result;
        }
        async searchUsers(query) {
            const events = await this._socialEventManagerRead.searchUsers({ query });
            let metadataArr = [];
            let followersCountMap = {};
            for (let event of events) {
                if (event.kind === 0) {
                    metadataArr.push({
                        ...event,
                        content: utilsManager_5.SocialUtilsManager.parseContent(event.content)
                    });
                }
                else if (event.kind === 10000108) {
                    followersCountMap = utilsManager_5.SocialUtilsManager.parseContent(event.content);
                }
            }
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = utilsManager_5.SocialUtilsManager.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        async addRelay(url) {
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
                pubKey: this.selfPubkey
            });
            const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
            let relays = { [url]: { write: true, read: true } };
            if (relaysEvent) {
                for (let tag of relaysEvent.tags) {
                    if (tag[0] !== 'r')
                        continue;
                    let config = { read: true, write: true };
                    if (tag[2] === 'write') {
                        config.read = false;
                    }
                    if (tag[2] === 'read') {
                        config.write = false;
                    }
                    relays[tag[1]] = config;
                }
            }
            await this._socialEventManagerWrite.updateRelayList(relays);
        }
        async removeRelay(url) {
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
                pubKey: this.selfPubkey
            });
            const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
            let relays = {};
            if (relaysEvent) {
                for (let tag of relaysEvent.tags) {
                    if (tag[0] !== 'r' || tag[1] === url)
                        continue;
                    let config = { read: true, write: true };
                    if (tag[2] === 'write') {
                        config.read = false;
                    }
                    if (tag[2] === 'read') {
                        config.write = false;
                    }
                    relays[tag[1]] = config;
                }
            }
            await this._socialEventManagerWrite.updateRelayList(relays);
        }
        async updateRelays(add, remove, defaultRelays) {
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays({
                pubKey: this.selfPubkey
            });
            const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
            let relaysMap = {};
            for (let relay of add) {
                relaysMap[relay] = { read: true, write: true };
            }
            if (relaysEvent) {
                for (let tag of relaysEvent.tags) {
                    if (tag[0] !== 'r' || remove.includes(tag[1]))
                        continue;
                    let config = { read: true, write: true };
                    if (tag[2] === 'write') {
                        config.read = false;
                    }
                    if (tag[2] === 'read') {
                        config.write = false;
                    }
                    relaysMap[tag[1]] = config;
                }
            }
            let relayUrls = Object.keys(relaysMap);
            // this.relays = relayUrls.length > 0 ? relayUrls : defaultRelays;
            await this._socialEventManagerWrite.updateRelayList(relaysMap);
            return relayUrls;
        }
        async makeInvoice(amount, comment) {
            const paymentRequest = await this.lightningWalletManager.makeInvoice(Number(amount), comment);
            await this._socialEventManagerWrite.createPaymentRequestEvent(paymentRequest, amount, comment, true);
            return paymentRequest;
        }
        async createPaymentRequest(chainId, token, amount, to, comment) {
            const paymentRequest = btoa(JSON.stringify({
                chainId,
                token,
                amount,
                comment,
                to,
                createdAt: Math.round(Date.now() / 1000)
            }));
            await this._socialEventManagerWrite.createPaymentRequestEvent(paymentRequest, amount, comment);
            return paymentRequest;
        }
        parsePaymentRequest(paymentRequest) {
            const decoded = atob(paymentRequest);
            let data = JSON.parse(decoded);
            return data;
        }
        async sendToken(paymentRequest) {
            let receipt;
            try {
                let data = this.parsePaymentRequest(paymentRequest);
                const wallet = eth_wallet_2.Wallet.getClientInstance();
                await wallet.init();
                if (data.chainId !== wallet.chainId) {
                    await wallet.switchNetwork(data.chainId);
                }
                if (data.token.address) {
                    const erc20 = new eth_wallet_2.Contracts.ERC20(wallet, data.token.address);
                    let amount = eth_wallet_2.Utils.toDecimals(data.amount, data.token.decimals);
                    receipt = await erc20.transfer({
                        to: data.to,
                        amount: amount
                    });
                }
                else {
                    receipt = await wallet.send(data.to, data.amount);
                }
            }
            catch (err) {
                throw new Error('Payment failed');
            }
            return receipt?.transactionHash;
        }
        isLightningInvoice(value) {
            const lnRegex = /^(lnbc|lntb|lnbcrt|lnsb|lntbs)([0-9]+(m|u|n|p))?1\S+/g;
            return lnRegex.test(value);
        }
        async sendPayment(paymentRequest, comment) {
            let preimage;
            let tx;
            if (this.isLightningInvoice(paymentRequest)) {
                preimage = await this.lightningWalletManager.sendPayment(paymentRequest);
            }
            else {
                tx = await this.sendToken(paymentRequest);
            }
            const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent({ paymentRequest });
            if (requestEvent) {
                await this._socialEventManagerWrite.createPaymentReceiptEvent(requestEvent.id, requestEvent.pubkey, comment, preimage, tx);
            }
            return preimage || tx;
        }
        async zap(pubkey, lud16, amount, noteId) {
            const response = await this.lightningWalletManager.zap(pubkey, lud16, Number(amount), '', this._writeRelays, noteId);
            return response;
        }
        async fetchUserPaymentActivities(pubkey, since, until) {
            const paymentActivitiesForSender = await this._socialEventManagerRead.fetchPaymentActivitiesForSender({
                pubkey,
                since,
                until
            });
            const paymentActivitiesForRecipient = await this._socialEventManagerRead.fetchPaymentActivitiesForRecipient({
                pubkey,
                since,
                until
            });
            const paymentActivities = [...paymentActivitiesForSender, ...paymentActivitiesForRecipient];
            return paymentActivities.sort((a, b) => b.createdAt - a.createdAt);
        }
        async fetchPaymentReceiptInfo(paymentRequest) {
            let info = {
                status: 'pending'
            };
            const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent({ paymentRequest });
            if (requestEvent) {
                const receiptEvent = await this._socialEventManagerRead.fetchPaymentReceiptEvent({
                    requestEventId: requestEvent.id
                });
                if (receiptEvent && receiptEvent.pubkey === this.selfPubkey) {
                    info.status = 'completed';
                    info.preimage = receiptEvent.tags.find(tag => tag[0] === 'preimage')?.[1];
                    info.tx = receiptEvent.tags.find(tag => tag[0] === 'tx')?.[1];
                }
            }
            return info;
        }
        async getLightningBalance() {
            const response = await this.lightningWalletManager.getBalance();
            return response;
        }
        isLightningAvailable() {
            const isAvailable = this.lightningWalletManager.isAvailable();
            return isAvailable;
        }
        async getBitcoinPrice() {
            const response = await fetch('https://api.coinpaprika.com/v1/tickers/btc-bitcoin');
            const result = await response.json();
            const price = result.quotes.USD.price;
            return price;
        }
        async fetchUserPrivateRelay(pubkey) {
            const url = `${this._publicIndexingRelay}/private-relay?pubkey=${pubkey}`;
            const response = await fetch(url);
            const result = await response.json();
            return result.data.relay;
        }
        async fetchApps(keyword) {
            let url = `${this._apiBaseUrl}/apps`;
            if (keyword !== undefined)
                url += `?keyword=${keyword}`;
            try {
                const response = await fetch(url);
                const result = await response.json();
                return result.data.apps;
            }
            catch (e) {
                console.log('e', e);
            }
        }
        async fetchApp(pubkey, id) {
            const installed = await this.fetchInstalledByPubKey(pubkey);
            let installedVersionId;
            if (installed)
                installedVersionId = installed[id];
            const url = `${this._apiBaseUrl}/app`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    id,
                    pubkey,
                    installedVersionId
                })
            });
            const result = await response.json();
            return result.data.app;
        }
        async fetchInstalledByPubKey(pubkey) {
            const url = `${this._apiBaseUrl}/installed?pubkey=${pubkey}`;
            const response = await fetch(url);
            const result = await response.json();
            const installed = result.data.installed;
            // const decrypted = await SocialUtilsManager.decryptMessage(this._privateKey, pubkey, installed);
            if (!installed)
                return null;
            const decrypted = await scom_signer_2.Crypto.decryptWithPrivKey(this._privateKey, installed);
            console.log('decrypted', decrypted);
            return JSON.parse(decrypted);
        }
        async fetchInstalledApps(pubkey) {
            const installed = await this.fetchInstalledByPubKey(pubkey);
            if (!installed)
                return [];
            // const decrypted = await SocialUtilsManager.decryptMessage(this._privateKey, pubkey, installed);
            const url = `${this._apiBaseUrl}/installed-apps`;
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    pubkey,
                    decryptedInstalled: JSON.stringify(installed)
                })
            });
            const result = await response.json();
            return result.data.installedApps;
        }
        async installApp(pubkey, appId, appVersionId) {
            const url = `${this._apiBaseUrl}/install-app`;
            const installedApps = await this.fetchInstalledByPubKey(pubkey);
            // console.log('installed', installed);
            // const decryptedInstalled = await SocialUtilsManager.decryptMessage(this._privateKey, pubkey, installed);
            // console.log('decryptedInstalled', decryptedInstalled)
            // const installedApps =  JSON.parse(decryptedInstalled);
            // console.log('installedApps', installedApps);
            let newInstalledApps = {};
            if (installedApps)
                newInstalledApps = { ...installedApps };
            newInstalledApps[appId] = appVersionId;
            // const encryptedInstalledAppList = await SocialUtilsManager.encryptMessage(this._privateKey, pubkey, JSON.stringify(newInstalledApps));
            const encryptedInstalledAppList = await scom_signer_2.Crypto.encryptWithPubKey(pubkey, JSON.stringify(newInstalledApps));
            const response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify({
                    pubkey,
                    installedAppList: encryptedInstalledAppList
                })
            });
            const result = await response.json();
            return result;
        }
        async fetchCommunityPinnedNotes(creatorId, communityId) {
            const events = await this._socialEventManagerRead.fetchCommunityPinnedNotesEvents({
                creatorId,
                communityId
            });
            const { notes, metadataByPubKeyMap } = this.createNoteEventMappings(events);
            return {
                notes,
                metadataByPubKeyMap
            };
        }
        async pinCommunityNote(creatorId, communityId, noteId) {
            let noteIds = await this._socialEventManagerRead.fetchCommunityPinnedNoteIds({
                creatorId,
                communityId
            });
            noteIds = Array.from(new Set([...noteIds, noteId]));
            await this._socialEventManagerWrite.updateCommunityPinnedNotes(creatorId, communityId, noteIds);
        }
        async unpinCommunityNote(creatorId, communityId, noteId) {
            let noteIds = await this._socialEventManagerRead.fetchCommunityPinnedNoteIds({
                creatorId,
                communityId
            });
            noteIds = Array.from(new Set(noteIds));
            const index = noteIds.indexOf(noteId);
            if (index > -1) {
                noteIds.splice(index, 1);
            }
            await this._socialEventManagerWrite.updateCommunityPinnedNotes(creatorId, communityId, noteIds);
        }
        async fetchUserPinnedNotes(pubKey) {
            const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
            let noteIds = [];
            if (pinnedNotesEvent) {
                for (let tag of pinnedNotesEvent.tags) {
                    if (tag[0] === 'e') {
                        noteIds.push(tag[1]);
                    }
                }
            }
            if (noteIds.length > 0)
                return this._socialEventManagerRead.fetchEventsByIds({ ids: noteIds });
            else
                return [];
        }
        async pinUserNote(pubKey, noteId) {
            const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
            let noteIds = [noteId];
            if (pinnedNotesEvent) {
                for (let tag of pinnedNotesEvent.tags) {
                    if (tag[0] === 'e' && tag[1] !== noteId) {
                        noteIds.push(tag[1]);
                    }
                }
            }
            await this._socialEventManagerWrite.updateUserPinnedNotes(noteIds);
        }
        async unpinUserNote(pubKey, noteId) {
            const pinnedNotesEvent = await this._socialEventManagerRead.fetchUserPinnedNotes({ pubKey });
            let noteIds = [];
            if (pinnedNotesEvent) {
                for (let tag of pinnedNotesEvent.tags) {
                    if (tag[0] === 'e' && tag[1] !== noteId) {
                        noteIds.push(tag[1]);
                    }
                }
            }
            await this._socialEventManagerWrite.updateUserPinnedNotes(noteIds);
        }
        async fetchUserBookmarks(pubKey) {
            const bookmarksEvent = await this._socialEventManagerRead.fetchUserBookmarks({ pubKey });
            const eventIds = [];
            if (bookmarksEvent) {
                for (let tag of bookmarksEvent.tags) {
                    if (tag[0] === 'e' || tag[0] === 'a') {
                        eventIds.push(tag[1]);
                    }
                }
            }
            return eventIds;
        }
        async addBookmark(pubKey, eventId, isArticle = false) {
            const bookmarksEvent = await this._socialEventManagerRead.fetchUserBookmarks({ pubKey });
            let tags = [
                [isArticle ? "a" : "e", eventId]
            ];
            if (bookmarksEvent) {
                for (let tag of bookmarksEvent.tags) {
                    if (tag[1] !== eventId) {
                        tags.push(tag);
                    }
                }
            }
            await this._socialEventManagerWrite.updateUserBookmarks(tags);
        }
        async removeBookmark(pubKey, eventId, isArticle = false) {
            const bookmarksEvent = await this._socialEventManagerRead.fetchUserBookmarks({ pubKey });
            let tags = [];
            if (bookmarksEvent) {
                for (let tag of bookmarksEvent.tags) {
                    if (tag[1] !== eventId) {
                        tags.push(tag);
                    }
                }
            }
            await this._socialEventManagerWrite.updateUserBookmarks(tags);
        }
        async deleteEvents(eventIds) {
            await this._socialEventManagerWrite.deleteEvents(eventIds);
        }
        async fetchTrendingCommunities() {
            let communities = [];
            const events = await this._socialEventManagerRead.fetchTrendingCommunities();
            let eventIdToMemberCountMap = this.getEventIdToMemberMap(events);
            const communitiesEvents = events.filter(event => event.kind === 34550);
            for (let event of communitiesEvents) {
                const communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                const memberCount = eventIdToMemberCountMap[event.id] || 0;
                let community = {
                    ...communityInfo,
                    memberCount
                };
                communities.push(community);
            }
            return communities;
        }
        async fetchUserEthWalletAccountsInfo(options) {
            const { walletHash, pubKey } = options;
            const event = await this._socialEventManagerRead.fetchUserEthWalletAccountsInfo({ walletHash, pubKey });
            if (!event)
                return null;
            const content = utilsManager_5.SocialUtilsManager.parseContent(event.content);
            let accountsInfo = {
                masterWalletSignature: content.master_wallet_signature,
                socialWalletSignature: content.social_wallet_signature,
                encryptedKey: content.encrypted_key,
                masterWalletHash: walletHash,
                eventData: event
            };
            return accountsInfo;
        }
        async updateUserEthWalletAccountsInfo(info, privateKey) {
            const responses = await this._socialEventManagerWrite.updateUserEthWalletAccountsInfo(info, privateKey);
            const response = responses[0];
            return response.success ? response.eventId : null;
        }
        async fetchSubCommunities(creatorId, communityId) {
            let communities = [];
            try {
                const events = await this._socialEventManagerRead.fetchSubcommunites({
                    communityCreatorId: creatorId,
                    communityName: communityId
                });
                for (let event of events) {
                    const communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(event);
                    let community = {
                        ...communityInfo,
                        members: []
                    };
                    communities.push(community);
                }
            }
            catch (error) {
                console.error('fetchSubCommunities', error);
            }
            return communities;
        }
        async fetchCommunityDetailMetadata(creatorId, communityId) {
            const events = await this._socialEventManagerRead.fetchCommunityDetailMetadata({
                communityCreatorId: creatorId,
                communityName: communityId
            });
            const communityEvent = events.find(event => event.kind === 34550);
            if (!communityEvent)
                return null;
            const communityInfo = utilsManager_5.SocialUtilsManager.extractCommunityInfo(communityEvent);
            const statsEvent = events.find(event => event.kind === 10000105);
            let stats;
            if (statsEvent) {
                const content = utilsManager_5.SocialUtilsManager.parseContent(statsEvent.content);
                stats = {
                    notesCount: content.note_count,
                    membersCount: content.member_count,
                    subcommunitiesCount: content.subcommunity_count
                };
            }
            //Fetch group keys only when scpData.encryptedKey is undefined for backward compatibility
            if (communityInfo.membershipType === utils_18.MembershipType.Protected && !communityInfo.scpData?.encryptedKey) {
                const keyEvents = await this._socialEventManagerRead.fetchGroupKeys({
                    identifiers: [communityInfo.communityUri + ':keys']
                });
                const keyEvent = keyEvents[0];
                if (keyEvent) {
                    communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                }
            }
            let detailMetadata = {
                info: communityInfo,
                stats
            };
            return detailMetadata;
        }
        async updateNoteStatus(noteId, status) {
            const result = await this._socialEventManagerWrite.updateNoteStatus(noteId, status);
            return result;
        }
        async updateCommunitySubscription(options) {
            const communityPubkey = options.communityCreatorId.startsWith('npub1') ? index_6.Nip19.decode(options.communityCreatorId).data : options.communityCreatorId;
            const authHeader = utilsManager_5.SocialUtilsManager.constructAuthHeader(this._privateKey);
            let bodyData = {
                communityPubkey: communityPubkey,
                communityD: options.communityId,
                pubkey: this.selfPubkey,
                start: options.start,
                end: options.end,
                chainId: options.chainId,
                currency: options.currency,
                txHash: options.txHash,
                timeCreated: Math.round(Date.now() / 1000)
            };
            const relayUrl = this._publicIndexingRelay;
            let url = `${relayUrl}/update-community-subscription`;
            let response = await fetch(url, {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                    Authorization: authHeader
                },
                body: JSON.stringify(bodyData)
            });
            let result = await response.json();
            return result;
        }
    }
    exports.SocialDataManager = SocialDataManager;
});
define("@scom/scom-social-sdk/managers/index.ts", ["require", "exports", "@scom/scom-social-sdk/managers/communication.ts", "@scom/scom-social-sdk/managers/utilsManager.ts", "@scom/scom-social-sdk/managers/eventManagerWrite.ts", "@scom/scom-social-sdk/managers/eventManagerRead.ts", "@scom/scom-social-sdk/managers/eventManagerReadV2.ts", "@scom/scom-social-sdk/managers/dataManager.ts"], function (require, exports, communication_2, utilsManager_6, eventManagerWrite_2, eventManagerRead_2, eventManagerReadV2_2, dataManager_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrWebSocketManager = exports.NostrRestAPIManager = exports.SocialDataManager = exports.SocialUtilsManager = exports.NostrEventManagerWrite = exports.NostrEventManagerReadV2 = exports.NostrEventManagerRead = void 0;
    Object.defineProperty(exports, "NostrRestAPIManager", { enumerable: true, get: function () { return communication_2.NostrRestAPIManager; } });
    Object.defineProperty(exports, "NostrWebSocketManager", { enumerable: true, get: function () { return communication_2.NostrWebSocketManager; } });
    Object.defineProperty(exports, "SocialUtilsManager", { enumerable: true, get: function () { return utilsManager_6.SocialUtilsManager; } });
    Object.defineProperty(exports, "NostrEventManagerWrite", { enumerable: true, get: function () { return eventManagerWrite_2.NostrEventManagerWrite; } });
    Object.defineProperty(exports, "NostrEventManagerRead", { enumerable: true, get: function () { return eventManagerRead_2.NostrEventManagerRead; } });
    Object.defineProperty(exports, "NostrEventManagerReadV2", { enumerable: true, get: function () { return eventManagerReadV2_2.NostrEventManagerReadV2; } });
    Object.defineProperty(exports, "SocialDataManager", { enumerable: true, get: function () { return dataManager_1.SocialDataManager; } });
});
define("@scom/scom-social-sdk", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/index.ts", "@scom/scom-social-sdk/managers/index.ts"], function (require, exports, index_7, index_8, managers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrRestAPIManager = exports.NostrWebSocketManager = exports.SocialDataManager = exports.SocialUtilsManager = exports.NostrEventManagerWrite = exports.NostrEventManagerReadV2 = exports.NostrEventManagerRead = exports.schnorr = exports.secp256k1 = exports.Bech32 = exports.Nip19 = exports.Keys = exports.Event = void 0;
    Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return index_7.Event; } });
    Object.defineProperty(exports, "Keys", { enumerable: true, get: function () { return index_7.Keys; } });
    Object.defineProperty(exports, "Nip19", { enumerable: true, get: function () { return index_7.Nip19; } });
    Object.defineProperty(exports, "Bech32", { enumerable: true, get: function () { return index_7.Bech32; } });
    Object.defineProperty(exports, "secp256k1", { enumerable: true, get: function () { return index_7.secp256k1; } });
    Object.defineProperty(exports, "schnorr", { enumerable: true, get: function () { return index_7.schnorr; } });
    __exportStar(index_8, exports);
    Object.defineProperty(exports, "NostrEventManagerRead", { enumerable: true, get: function () { return managers_1.NostrEventManagerRead; } });
    Object.defineProperty(exports, "NostrEventManagerReadV2", { enumerable: true, get: function () { return managers_1.NostrEventManagerReadV2; } });
    Object.defineProperty(exports, "NostrEventManagerWrite", { enumerable: true, get: function () { return managers_1.NostrEventManagerWrite; } });
    Object.defineProperty(exports, "SocialUtilsManager", { enumerable: true, get: function () { return managers_1.SocialUtilsManager; } });
    Object.defineProperty(exports, "SocialDataManager", { enumerable: true, get: function () { return managers_1.SocialDataManager; } });
    Object.defineProperty(exports, "NostrWebSocketManager", { enumerable: true, get: function () { return managers_1.NostrWebSocketManager; } });
    Object.defineProperty(exports, "NostrRestAPIManager", { enumerable: true, get: function () { return managers_1.NostrRestAPIManager; } });
});
