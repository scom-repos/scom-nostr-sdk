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
    exports.getSignature = exports.signEvent = exports.verifySignature = exports.validateEvent = exports.getEventHash = exports.serializeEvent = exports.finishEvent = exports.getBlankEvent = exports.Kind = exports.verifiedSymbol = exports.utf8Encoder = void 0;
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
define("@scom/scom-social-sdk/core/index.ts", ["require", "exports", "@scom/scom-social-sdk/core/nostr/event.ts", "@scom/scom-social-sdk/core/nostr/keys.ts", "@scom/scom-social-sdk/core/nostr/nip19.ts", "@scom/scom-social-sdk/core/bech32.ts"], function (require, exports, Event, Keys, Nip19, Bech32) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.Bech32 = exports.Nip19 = exports.Keys = exports.Event = void 0;
    ///<amd-module name='@scom/scom-social-sdk/core/index.ts'/> 
    exports.Event = Event;
    exports.Keys = Keys;
    exports.Nip19 = Nip19;
    exports.Bech32 = Bech32;
});
define("@scom/scom-social-sdk/utils/interfaces.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.CalendarEventType = exports.CommunityRole = exports.MembershipType = exports.ScpStandardId = exports.NftType = void 0;
    var NftType;
    (function (NftType) {
        NftType["ERC721"] = "ERC721";
        NftType["ERC1155"] = "ERC1155";
    })(NftType = exports.NftType || (exports.NftType = {}));
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
        MembershipType["NFTExclusive"] = "NFTExclusive";
        MembershipType["InviteOnly"] = "InviteOnly";
    })(MembershipType = exports.MembershipType || (exports.MembershipType = {}));
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
define("@scom/scom-social-sdk/utils/mqtt.ts", ["require", "exports"], function (require, exports) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MqttManager = void 0;
    // import mqtt, { MqttClient } from 'mqtt';
    function determineMqttType() {
        if (typeof window !== "undefined") {
            return mqtt;
        }
        else {
            // @ts-ignore
            let Mqtt = require('mqtt');
            return Mqtt;
        }
        ;
    }
    ;
    class MqttManager {
        constructor(config) {
            this.config = config;
            this.subscriptions = [];
            const mqtt = determineMqttType();
            this.client = mqtt.connect(config.brokerUrl);
            if (config.subscriptions) {
                this.subscribe(config.subscriptions);
            }
            this.client.on('connect', () => {
                if (config.connectCallback) {
                    config.connectCallback();
                }
            });
            this.client.on('message', (topic, message) => {
                if (config.messageCallback) {
                    config.messageCallback(topic, message.toString());
                }
            });
            this.client.on('error', (error) => {
                console.error(`MQTT Error: ${error}`);
                if (config.errorCallback) {
                    config.errorCallback(error);
                }
            });
        }
        subscribe(topics) {
            if (topics?.length === 0) {
                return;
            }
            this.client.subscribe(topics, (error) => {
                if (error) {
                    console.error(`Failed to subscribe to ${topics}: ${error}`);
                }
                else {
                    this.subscriptions = this.subscriptions.concat(topics);
                }
            });
        }
        unsubscribe(topics) {
            if (topics?.length === 0) {
                return;
            }
            this.client.unsubscribe(topics, (error) => {
                if (error) {
                    console.error(`Failed to unsubscribe from ${topics}: ${error}`);
                }
                else {
                    this.subscriptions = this.subscriptions.filter((topic) => !topics.includes(topic));
                }
            });
        }
        publish(topic, message) {
            this.client.publish(topic, message, (error) => {
                if (error) {
                    console.error(`Failed to publish to ${topic}: ${error}`);
                }
            });
        }
        disconnect() {
            this.client.end();
        }
    }
    exports.MqttManager = MqttManager;
});
define("@scom/scom-social-sdk/utils/index.ts", ["require", "exports", "@scom/scom-social-sdk/utils/interfaces.ts", "@scom/scom-social-sdk/utils/mqtt.ts"], function (require, exports, interfaces_1, mqtt_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.MqttManager = exports.CalendarEventType = exports.CommunityRole = exports.MembershipType = void 0;
    Object.defineProperty(exports, "MembershipType", { enumerable: true, get: function () { return interfaces_1.MembershipType; } });
    Object.defineProperty(exports, "CommunityRole", { enumerable: true, get: function () { return interfaces_1.CommunityRole; } });
    Object.defineProperty(exports, "CalendarEventType", { enumerable: true, get: function () { return interfaces_1.CalendarEventType; } });
    Object.defineProperty(exports, "MqttManager", { enumerable: true, get: function () { return mqtt_1.MqttManager; } });
});
define("@scom/scom-social-sdk/managers/communication.ts", ["require", "exports"], function (require, exports) {
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
        async fetchEventsFromAPI(endpoint, msg) {
            try {
                const response = await fetch(`${this._url}/${endpoint}`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(msg)
                });
                const data = await response.json();
                return data;
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
        async submitEvent(event) {
            try {
                const response = await fetch(`${this._url}/submit-event`, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(event)
                });
                const data = await response.json();
                return data;
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
                    console.log('Connected to server');
                    this.ws.removeEventListener('open', openListener);
                    resolve({ ws: this.ws, error: null });
                };
                if (!this.ws || this.ws.readyState === WebSocket.CLOSED) {
                    this.ws = new WebSocket(this._url);
                    this.ws.addEventListener('open', openListener);
                    this.ws.addEventListener('message', this.messageListenerBound);
                    this.ws.addEventListener('close', () => {
                        console.log('Disconnected from server');
                        resolve({ ws: null, error: 'Disconnected from server' });
                    });
                    this.ws.addEventListener('error', (error) => {
                        console.error('WebSocket Error:', error);
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
                        console.log("end of stored events");
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
                console.log(msg);
                const { ws, error } = await this.establishConnection(event.id, (message) => {
                    console.log('from server:', message);
                    resolve({
                        eventId: message[1],
                        success: message[2],
                        message: message[3]
                    });
                });
                if (error) {
                    resolve({
                        eventId: event.id,
                        success: false,
                        message: error
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
define("@scom/scom-social-sdk/utils/lightningWallet.ts", ["require", "exports", "@ijstech/ln-wallet", "@scom/scom-social-sdk/core/index.ts"], function (require, exports, ln_wallet_1, index_1) {
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
            nip57 = index_1.Event.finishEvent(nip57, this._privateKey);
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
define("@scom/scom-social-sdk/managers/utilsManager.ts", ["require", "exports", "@ijstech/eth-wallet", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/interfaces.ts"], function (require, exports, eth_wallet_1, index_2, interfaces_2) {
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
            if (privateKey.startsWith('0x'))
                privateKey = privateKey.replace('0x', '');
            let pub = eth_wallet_1.Utils.padLeft(index_2.Keys.getPublicKey(privateKey), 64);
            return pub;
        }
        static async encryptMessage(ourPrivateKey, theirPublicKey, text) {
            const sharedSecret = index_2.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
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
                const sharedSecret = index_2.Keys.getSharedSecret(ourPrivateKey, '02' + theirPublicKey);
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
        factor // Exponential backoff factor
        ) {
            let currentDelay = delay;
            for (let i = 0; i < retries; i++) {
                try {
                    return await fn();
                }
                catch (error) {
                    console.error(`Attempt ${i + 1} failed. Retrying in ${currentDelay}ms...`);
                    // Wait for the current delay period
                    await new Promise(resolve => setTimeout(resolve, currentDelay));
                    // Update delay for the next iteration, capped at maxDelay
                    currentDelay = Math.min(maxDelay, currentDelay * factor);
                }
            }
            // If all retries have been exhausted, throw an error
            throw new Error(`Failed after ${retries} retries`);
        }
        static getCommunityUri(creatorId, communityId) {
            const decodedPubkey = creatorId.startsWith('npub1') ? index_2.Nip19.decode(creatorId).data : creatorId;
            return `34550:${decodedPubkey}:${communityId}`;
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
            const creatorId = index_2.Nip19.npubEncode(event.pubkey);
            const moderatorIds = event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'moderator').map(tag => index_2.Nip19.npubEncode(tag[1]));
            const scpTag = event.tags.find(tag => tag[0] === 'scp');
            let scpData;
            let gatekeeperNpub;
            let membershipType = interfaces_2.MembershipType.Open;
            if (scpTag && scpTag[1] === '1') {
                const scpDataStr = SocialUtilsManager.base64ToUtf8(scpTag[2]);
                if (!scpDataStr.startsWith('$scp:'))
                    return null;
                scpData = JSON.parse(scpDataStr.substring(5));
                if (scpData.gatekeeperPublicKey) {
                    gatekeeperNpub = index_2.Nip19.npubEncode(scpData.gatekeeperPublicKey);
                    membershipType = interfaces_2.MembershipType.NFTExclusive;
                }
                else {
                    membershipType = interfaces_2.MembershipType.InviteOnly;
                }
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
                membershipType
            };
            return communityInfo;
        }
        static extractBookmarkedCommunities(event, excludedCommunity) {
            const communities = [];
            const communityUriArr = event?.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
            for (let communityUri of communityUriArr) {
                const basicInfo = SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                if (excludedCommunity) {
                    const decodedPubkey = index_2.Nip19.decode(excludedCommunity.creatorId).data;
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
            let scpData = this.extractScpData(event, interfaces_2.ScpStandardId.Channel);
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
    }
    exports.SocialUtilsManager = SocialUtilsManager;
});
define("@scom/scom-social-sdk/managers/eventManagerWrite.ts", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/interfaces.ts", "@scom/scom-social-sdk/managers/utilsManager.ts"], function (require, exports, index_3, interfaces_3, utilsManager_1) {
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
        constructor(managers, apiBaseUrl) {
            this._nostrCommunicationManagers = [];
            this._nostrCommunicationManagers = managers;
            this._apiBaseUrl = apiBaseUrl;
        }
        set nostrCommunicationManagers(managers) {
            this._nostrCommunicationManagers = managers;
        }
        calculateConversationPathTags(conversationPath) {
            let tags = [];
            for (let i = 0; i < conversationPath.noteIds.length; i++) {
                const noteId = conversationPath.noteIds[i];
                const decodedNoteId = noteId.startsWith('note1') ? index_3.Nip19.decode(noteId).data : noteId;
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
                const decodedAuthorId = authorId.startsWith('npub1') ? index_3.Nip19.decode(authorId).data : authorId;
                tags.push([
                    "p",
                    decodedAuthorId
                ]);
            }
            return tags;
        }
        async updateContactList(content, contactPubKeys, privateKey) {
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async postNote(content, privateKey, conversationPath) {
            let event = {
                "kind": 1,
                "created_at": Math.round(Date.now() / 1000),
                "content": content,
                "tags": []
            };
            if (conversationPath) {
                const conversationPathTags = this.calculateConversationPathTags(conversationPath);
                event.tags = conversationPathTags;
            }
            console.log('postNote', event);
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async deleteEvents(eventIds, privateKey) {
            let event = {
                "kind": 5,
                "created_at": Math.round(Date.now() / 1000),
                "content": "",
                "tags": []
            };
            for (let eventId of eventIds) {
                const decodedEventId = eventId.startsWith('note1') ? index_3.Nip19.decode(eventId).data : eventId;
                event.tags.push([
                    "e",
                    decodedEventId
                ]);
            }
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
            return responses;
        }
        async updateChannel(info, privateKey) {
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
                let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    interfaces_3.ScpStandardId.Channel,
                    encodedScpData
                ]);
            }
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
            return responses;
        }
        async updateUserBookmarkedChannels(channelEventIds, privateKey) {
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async updateCommunity(info, privateKey) {
            let event = {
                "kind": 34550,
                "created_at": Math.round(Date.now() / 1000),
                "content": '',
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
            if (info.scpData) {
                let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    interfaces_3.ScpStandardId.Community,
                    encodedScpData
                ]);
            }
            for (let moderatorId of info.moderatorIds) {
                const decodedModeratorId = moderatorId.startsWith('npub1') ? index_3.Nip19.decode(moderatorId).data : moderatorId;
                event.tags.push([
                    "p",
                    decodedModeratorId,
                    "",
                    "moderator"
                ]);
            }
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
            return responses;
        }
        async updateUserBookmarkedCommunities(communities, privateKey) {
            let communityUriArr = [];
            for (let community of communities) {
                const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async submitCommunityPost(info, privateKey) {
            const community = info.community;
            const communityUri = utilsManager_1.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
            let event = {
                "kind": 1,
                "created_at": Math.round(Date.now() / 1000),
                "content": info.message,
                "tags": []
            };
            if (info.scpData) {
                let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    interfaces_3.ScpStandardId.CommunityPost,
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
            console.log('submitCommunityPost', event);
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async submitChannelMessage(info, privateKey) {
            let event = {
                "kind": 42,
                "created_at": Math.round(Date.now() / 1000),
                "content": info.message,
                "tags": []
            };
            if (info.scpData) {
                let encodedScpData = utilsManager_1.SocialUtilsManager.utf8ToBase64('$scp:' + JSON.stringify(info.scpData));
                event.tags.push([
                    "scp",
                    interfaces_3.ScpStandardId.ChannelMessage,
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async updateUserProfile(content, privateKey) {
            let event = {
                "kind": 0,
                "created_at": Math.round(Date.now() / 1000),
                "content": JSON.stringify(content),
                "tags": []
            };
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async sendMessage(receiver, encryptedMessage, privateKey) {
            const decodedPubKey = receiver.startsWith('npub1') ? index_3.Nip19.decode(receiver).data : receiver;
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async updateGroupKeys(identifier, groupKind, keys, invitees, privateKey) {
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
                        interfaces_3.ScpStandardId.GroupKeys
                    ]
                ]
            };
            for (let invitee of invitees) {
                const decodedInvitee = invitee.startsWith('npub1') ? index_3.Nip19.decode(invitee).data : invitee;
                event.tags.push([
                    "p",
                    decodedInvitee,
                    "",
                    "invitee"
                ]);
            }
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
            return responses;
        }
        async updateCalendarEvent(info, privateKey) {
            let kind;
            let start;
            let end;
            if (info.type === interfaces_3.CalendarEventType.DateBased) {
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
                if (info.type === interfaces_3.CalendarEventType.DateBased) {
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
                    const decodedHostId = hostId.startsWith('npub1') ? index_3.Nip19.decode(hostId).data : hostId;
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
            const failedResponses = responses.filter(response => !response.success); //FIXME: Handle failed responses
            if (failedResponses.length === 0) {
                let response = responses[0];
                let pubkey = utilsManager_1.SocialUtilsManager.convertPrivateKeyToPubkey(privateKey);
                let eventKey = `${kind}:${pubkey}:${info.id}`;
                let apiRequestBody = {
                    eventId: response.eventId,
                    eventKey,
                    start,
                    end,
                    location: info.location
                };
                const apiUrl = `${this._apiBaseUrl}/calendar-events`;
                await fetch(apiUrl, {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify(apiRequestBody)
                });
            }
            return responses;
        }
        async createCalendarEventRSVP(rsvpId, calendarEventUri, accepted, privateKey) {
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
            return responses;
        }
        async submitCalendarEventPost(info, privateKey) {
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
            return responses;
        }
        async submitLongFormContentEvents(info, privateKey) {
            let event = {
                "kind": 30023,
                "created_at": Math.round(Date.now() / 1000),
                "content": info.content,
                "tags": [
                    [
                        "d",
                        info.id
                    ]
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async submitLike(tags, privateKey) {
            let event = {
                "kind": 7,
                "created_at": Math.round(Date.now() / 1000),
                "content": "+",
                "tags": tags
            };
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async submitRepost(content, tags, privateKey) {
            let event = {
                "kind": 6,
                "created_at": Math.round(Date.now() / 1000),
                "content": content,
                "tags": tags
            };
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async updateRelayList(relays, privateKey) {
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
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async createPaymentRequestEvent(paymentRequest, amount, comment, privateKey) {
            let event = {
                "kind": 9739,
                "created_at": Math.round(Date.now() / 1000),
                "content": comment,
                "tags": [
                    [
                        "r",
                        paymentRequest
                    ],
                    [
                        "amount",
                        amount
                    ]
                ]
            };
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
        async createPaymentReceiptEvent(requestEventId, recipient, preimage, comment, privateKey) {
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
                    [
                        "preimage",
                        preimage
                    ]
                ]
            };
            const verifiedEvent = index_3.Event.finishEvent(event, privateKey);
            const responses = await Promise.all(this._nostrCommunicationManagers.map(manager => manager.submitEvent(verifiedEvent)));
        }
    }
    exports.NostrEventManagerWrite = NostrEventManagerWrite;
});
define("@scom/scom-social-sdk/managers/eventManagerRead.ts", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/managers/utilsManager.ts"], function (require, exports, index_4, utilsManager_2) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrEventManagerReadV2 = exports.NostrEventManagerRead = void 0;
    class NostrEventManagerRead {
        constructor(manager, cachedManager, apiBaseUrl) {
            this._nostrCommunicationManager = manager;
            this._nostrCachedCommunicationManager = cachedManager;
            this._apiBaseUrl = apiBaseUrl;
        }
        set nostrCommunicationManager(manager) {
            this._nostrCommunicationManager = manager;
        }
        async fetchThreadCacheEvents(id, pubKey) {
            let decodedId = id.startsWith('note1') ? index_4.Nip19.decode(id).data : id;
            let msg = {
                event_id: decodedId,
                limit: 100
            };
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
                msg.user_pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('thread_view', msg);
            return fetchEventsResponse.events;
        }
        async fetchTrendingCacheEvents(pubKey) {
            let msg = {};
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
                msg.user_pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('explore_global_trending_24h', msg);
            return fetchEventsResponse.events;
        }
        async fetchProfileFeedCacheEvents(pubKey, since = 0, until = 0) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                limit: 20,
                notes: "authored",
                pubkey: decodedPubKey,
                user_pubkey: decodedPubKey
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchProfileRepliesCacheEvents(pubKey, since = 0, until = 0) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                limit: 20,
                notes: "replies",
                pubkey: decodedPubKey,
                user_pubkey: decodedPubKey
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchHomeFeedCacheEvents(pubKey, since = 0, until = 0) {
            let msg = {
                limit: 20
            };
            if (until === 0) {
                msg.since = since;
            }
            else {
                msg.until = until;
            }
            msg.pubkey = index_4.Nip19.decode('npub1nfgqmnxqsjsnsvc2r5djhcx4ap3egcjryhf9ppxnajskfel2dx9qq6mnsp').data; //FIXME: Account to show Nostr highlights 
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
                msg.user_pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchUserProfileCacheEvents(pubKeys) {
            const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey);
            let msg = {
                pubkeys: decodedPubKeys
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_infos', msg);
            return fetchEventsResponse.events;
        }
        async fetchUserProfileDetailCacheEvents(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey,
                user_pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_profile', msg);
            return fetchEventsResponse.events;
        }
        async fetchContactListCacheEvents(pubKey, detailIncluded = true) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                extended_response: detailIncluded,
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('contact_list', msg);
            return fetchEventsResponse.events;
        }
        async fetchUserRelays(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_user_relays', msg);
            return fetchEventsResponse.events;
        }
        async fetchFollowersCacheEvents(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_followers', msg);
            return fetchEventsResponse.events;
        }
        async fetchCommunities(pubkeyToCommunityIdsMap) {
            let events;
            if (pubkeyToCommunityIdsMap && Object.keys(pubkeyToCommunityIdsMap).length > 0) {
                let requests = [];
                for (let pubkey in pubkeyToCommunityIdsMap) {
                    const decodedPubKey = pubkey.startsWith('npub1') ? index_4.Nip19.decode(pubkey).data : pubkey;
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
        async fetchAllUserRelatedCommunities(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
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
                    const bookmarkedCommunities = utilsManager_2.SocialUtilsManager.extractBookmarkedCommunities(event);
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
                const bookmarkedCommunitiesEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
                for (let event of bookmarkedCommunitiesEvents) {
                    communitiesEvents.push(event);
                }
            }
            return communitiesEvents;
        }
        async fetchUserBookmarkedCommunities(pubKey, excludedCommunity) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let request = {
                kinds: [30001],
                "#d": ["communities"],
                authors: [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            const bookmarkedCommunitiesEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
            const communities = utilsManager_2.SocialUtilsManager.extractBookmarkedCommunities(bookmarkedCommunitiesEvent, excludedCommunity);
            return communities;
        }
        async fetchCommunity(creatorId, communityId) {
            const decodedCreatorId = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let infoMsg = {
                kinds: [34550],
                authors: [decodedCreatorId],
                "#d": [communityId]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(infoMsg);
            return fetchEventsResponse.events;
        }
        async fetchCommunityFeed(creatorId, communityId) {
            const decodedCreatorId = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            const communityUri = utilsManager_2.SocialUtilsManager.getCommunityUri(creatorId, communityId);
            let infoMsg = {
                kinds: [34550],
                authors: [decodedCreatorId],
                "#d": [communityId]
            };
            let notesMsg = {
                // kinds: [1, 7, 9735],
                kinds: [1],
                "#a": [communityUri],
                limit: 50
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(infoMsg, notesMsg);
            return fetchEventsResponse.events;
        }
        async fetchCommunitiesGeneralMembers(communities) {
            const communityUriArr = [];
            for (let community of communities) {
                const communityUri = utilsManager_2.SocialUtilsManager.getCommunityUri(community.creatorId, community.communityId);
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
        //     const events = await this._nostrCommunicationManager.fetchEvents(msg);
        //     return events;
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
        async fetchAllUserRelatedChannels(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
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
                    const channelInfo = utilsManager_2.SocialUtilsManager.extractChannelInfo(event);
                    if (channelInfo) {
                        channels.push(channelInfo);
                    }
                }
                else if (event.kind === 41) {
                    const channelInfo = utilsManager_2.SocialUtilsManager.extractChannelInfo(event);
                    if (channelInfo) {
                        channelMetadataMap[channelInfo.id] = channelInfo;
                    }
                }
            };
            for (let event of fetchEventsResponse.events) {
                if (event.kind === 30001) {
                    bookmarkedChannelEventIds = utilsManager_2.SocialUtilsManager.extractBookmarkedChannels(event);
                }
                else {
                    handleChannelEvent(event);
                }
            }
            if (bookmarkedChannelEventIds.length > 0) {
                const bookmarkedChannelEvents = await this.fetchEventsByIds(bookmarkedChannelEventIds);
                for (let event of bookmarkedChannelEvents) {
                    handleChannelEvent(event);
                }
            }
            const pubkeyToCommunityIdsMap = {};
            for (let channel of channels) {
                const scpData = channel.scpData;
                if (!scpData?.communityUri)
                    continue;
                const { communityId } = utilsManager_2.SocialUtilsManager.getCommunityBasicInfoFromUri(scpData.communityUri);
                pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
                if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(communityId)) {
                    pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(communityId);
                }
            }
            let channelIdToCommunityMap = {};
            const communityEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of communityEvents) {
                const communityInfo = utilsManager_2.SocialUtilsManager.extractCommunityInfo(event);
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
        async fetchUserBookmarkedChannelEventIds(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let requestForJoinedChannels = {
                kinds: [30001],
                "#d": ["channels"],
                authors: [decodedPubKey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(requestForJoinedChannels);
            const bookmarkedChannelsEvent = fetchEventsResponse.events.find(event => event.kind === 30001);
            const channelEventIds = utilsManager_2.SocialUtilsManager.extractBookmarkedChannels(bookmarkedChannelsEvent);
            return channelEventIds;
        }
        async fetchEventsByIds(ids) {
            let request = {
                ids: ids
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async fetchChannelMessages(channelId, since = 0, until = 0) {
            const decodedChannelId = channelId.startsWith('npub1') ? index_4.Nip19.decode(channelId).data : channelId;
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
        async fetchChannelInfoMessages(channelId) {
            const decodedChannelId = channelId.startsWith('npub1') ? index_4.Nip19.decode(channelId).data : channelId;
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
        async fetchMessageContactsCacheEvents(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                user_pubkey: decodedPubKey,
                relation: 'follows'
            };
            const followsEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
            msg = {
                user_pubkey: decodedPubKey,
                relation: 'other'
            };
            const otherEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsg_contacts', msg);
            return [...followsEventsResponse.events, ...otherEventsResponse.events];
        }
        async fetchDirectMessages(pubKey, sender, since = 0, until = 0) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            const decodedSenderPubKey = sender.startsWith('npub1') ? index_4.Nip19.decode(sender).data : sender;
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
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('get_directmsgs', req);
            return fetchEventsResponse.events;
        }
        async resetMessageCount(pubKey, sender, privateKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            const decodedSenderPubKey = sender.startsWith('npub1') ? index_4.Nip19.decode(sender).data : sender;
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
            event.id = index_4.Event.getEventHash(event);
            event.sig = index_4.Event.getSignature(event, privateKey);
            const msg = {
                event_from_user: event,
                sender: decodedSenderPubKey
            };
            await this._nostrCachedCommunicationManager.fetchCachedEvents('reset_directmsg_count', msg);
        }
        async fetchGroupKeys(identifier) {
            let req = {
                kinds: [30078],
                "#d": [identifier]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchUserGroupInvitations(groupKinds, pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let req = {
                kinds: [30078],
                "#p": [decodedPubKey],
                "#k": groupKinds.map(kind => kind.toString())
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
            return events;
        }
        async fetchCalendarEvents(start, end, limit) {
            let req;
            // FixME: Remove line comments when events are indexed
            // if (this._apiBaseUrl) {
            //     let queriesObj: any = {
            //         start: start.toString()
            //     };
            //     if (end) {
            //         queriesObj.end = end.toString();
            //     }
            //     let queries = new URLSearchParams(queriesObj).toString();
            //     const apiUrl = `${this._apiBaseUrl}/calendar-events?${queries}`;
            //     const apiResponse = await fetch(apiUrl);
            //     const apiResult = await apiResponse.json();
            //     let calendarEventIds: string[] = [];
            //     if (apiResult.success) {
            //         const calendarEvents = apiResult.data.calendarEvents;
            //         calendarEventIds = calendarEvents.map(calendarEvent => calendarEvent.eventId);
            //     }
            //     req = {
            //         kinds: [31922, 31923],
            //         ids: calendarEventIds
            //     };
            // }
            // else {
            req = {
                kinds: [31922, 31923],
                limit: limit || 10
            };
            // }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events;
        }
        async fetchCalendarEvent(address) {
            let req = {
                kinds: [address.kind],
                "#d": [address.identifier],
                authors: [address.pubkey]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchCalendarEventPosts(calendarEventUri) {
            let request = {
                kinds: [1],
                "#a": [calendarEventUri],
                limit: 50
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(request);
            return fetchEventsResponse.events;
        }
        async fetchCalendarEventRSVPs(calendarEventUri, pubkey) {
            let req = {
                kinds: [31925],
                "#a": [calendarEventUri]
            };
            if (pubkey) {
                const decodedPubKey = pubkey.startsWith('npub1') ? index_4.Nip19.decode(pubkey).data : pubkey;
                req.authors = [decodedPubKey];
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events;
        }
        async fetchLongFormContentEvents(pubKey, since = 0, until = 0) {
            let req = {
                kinds: [30023],
                limit: 20
            };
            if (pubKey) {
                const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
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
        async searchUsers(query) {
            const req = {
                query: query,
                limit: 10
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('user_search', req);
            return fetchEventsResponse.events;
        }
        async fetchPaymentRequestEvent(paymentRequest) {
            let req = {
                kinds: [9739],
                "#r": [paymentRequest]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents(req);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchPaymentActivitiesForRecipient(pubkey, since = 0, until = 0) {
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
                const paymentHash = requestEvent.tags.find(tag => tag[0] === 'r')?.[1];
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
        async fetchPaymentActivitiesForSender(pubkey, since = 0, until = 0) {
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
                    const paymentHash = requestEvent.tags.find(tag => tag[0] === 'r')?.[1];
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
        async fetchUserFollowingFeed(pubKey, until = 0) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                user_pubkey: decodedPubKey,
                timeframe: 'latest',
                scope: 'follows',
                limit: 20
            };
            if (until > 0) {
                msg.until = until;
            }
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchCachedEvents('explore', msg);
            return fetchEventsResponse.events;
        }
    }
    exports.NostrEventManagerRead = NostrEventManagerRead;
    class NostrEventManagerReadV2 extends NostrEventManagerRead {
        constructor(manager, cachedManager, apiBaseUrl) {
            super(manager, cachedManager, apiBaseUrl);
        }
        set nostrCommunicationManager(manager) {
            this._nostrCommunicationManager = manager;
        }
        async fetchThreadCacheEvents(id, pubKey) {
            let decodedId = id.startsWith('note1') ? index_4.Nip19.decode(id).data : id;
            let msg = {
                eventId: decodedId,
                limit: 100
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-thread-posts', msg);
            return fetchEventsResponse.events;
        }
        async fetchTrendingCacheEvents(pubKey) {
            let msg = {};
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-trending-posts', msg);
            return fetchEventsResponse.events;
        }
        async fetchProfileFeedCacheEvents(pubKey, since = 0, until = 0) {
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
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-profile-feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchProfileRepliesCacheEvents(pubKey, since = 0, until = 0) {
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
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-profile-replies', msg);
            return fetchEventsResponse.events;
        }
        async WIP_fetchHomeFeedCacheEvents(pubKey, since = 0, until = 0) {
        }
        async fetchUserProfileCacheEvents(pubKeys) {
            const decodedPubKeys = pubKeys.map(pubKey => pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey);
            let msg = {
                pubkeys: decodedPubKeys
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-user-profiles', msg);
            return fetchEventsResponse.events;
        }
        async fetchUserProfileDetailCacheEvents(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-user-profile-detail', msg);
            return fetchEventsResponse.events;
        }
        async fetchContactListCacheEvents(pubKey, detailIncluded = true) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey,
                detailIncluded: detailIncluded,
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-contact-list', msg);
            return fetchEventsResponse.events;
        }
        async fetchFollowersCacheEvents(pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubkey: decodedPubKey
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-followers', msg);
            return fetchEventsResponse.events;
        }
        async fetchCommunities(pubkeyToCommunityIdsMap) {
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
                let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
                events = response.events;
            }
            else {
                let msg = {
                    limit: 50
                };
                let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
                events = response.events;
            }
            return events;
        }
        async fetchAllUserRelatedCommunities(pubKey) {
            let msg = {
                pubKey
            };
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-communities', msg);
            return response.events;
        }
        async fetchUserBookmarkedCommunities(pubKey, excludedCommunity) {
            let msg = {
                pubKey
            };
            let response = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-communities', msg);
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
        async fetchCommunity(creatorId, communityId) {
            const decodedCreatorId = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let msg = {
                identifiers: [
                    {
                        pubkey: decodedCreatorId,
                        names: [communityId]
                    }
                ]
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities', msg);
            return fetchEventsResponse.events;
        }
        async fetchCommunityFeed(creatorId, communityId) {
            const decodedCreatorId = creatorId.startsWith('npub1') ? index_4.Nip19.decode(creatorId).data : creatorId;
            let msg = {
                identifiers: [
                    {
                        pubkey: decodedCreatorId,
                        names: [communityId]
                    }
                ],
                limit: 50
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-community-feed', msg);
            return fetchEventsResponse.events;
        }
        async fetchCommunitiesGeneralMembers(communities) {
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
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-communities-general-members', msg);
            return fetchEventsResponse.events;
        }
        async fetchAllUserRelatedChannels(pubKey) {
            let msg = {
                pubKey
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-related-channels', msg);
            let channels = [];
            const channelMetadataMap = {};
            for (let event of fetchEventsResponse.events) {
                if (event.kind === 40) {
                    const channelInfo = utilsManager_2.SocialUtilsManager.extractChannelInfo(event);
                    if (channelInfo) {
                        channels.push(channelInfo);
                    }
                }
                else if (event.kind === 41) {
                    const channelInfo = utilsManager_2.SocialUtilsManager.extractChannelInfo(event);
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
                const { communityId } = utilsManager_2.SocialUtilsManager.getCommunityBasicInfoFromUri(scpData.communityUri);
                pubkeyToCommunityIdsMap[channel.eventData.pubkey] = pubkeyToCommunityIdsMap[channel.eventData.pubkey] || [];
                if (!pubkeyToCommunityIdsMap[channel.eventData.pubkey].includes(communityId)) {
                    pubkeyToCommunityIdsMap[channel.eventData.pubkey].push(communityId);
                }
            }
            let channelIdToCommunityMap = {};
            const communityEvents = await this.fetchCommunities(pubkeyToCommunityIdsMap);
            for (let event of communityEvents) {
                const communityInfo = utilsManager_2.SocialUtilsManager.extractCommunityInfo(event);
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
        async fetchUserBookmarkedChannelEventIds(pubKey) {
            let msg = {
                pubKey
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-bookmarked-channel-event-ids', msg);
            return fetchEventsResponse.data;
        }
        async fetchEventsByIds(ids) {
            let msg = {
                ids
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-events', msg);
            return fetchEventsResponse.events;
        }
        async fetchChannelMessages(channelId, since = 0, until = 0) {
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
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents('fetch-channel-messages', msg);
            return fetchEventsResponse.events;
        }
        async fetchChannelInfoMessages(channelId) {
            const decodedChannelId = channelId.startsWith('npub1') ? index_4.Nip19.decode(channelId).data : channelId;
            let msg = {
                channelId: decodedChannelId,
                limit: 20
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEvents('fetch-channel-info-messages', msg);
            return fetchEventsResponse.events;
        }
        async fetchMessageContactsCacheEvents(pubKey) {
            const senderToLastReadMap = {};
            //FIXME: Implement a better way to get last read messages
            if (localStorage) {
                const lastReadsStr = localStorage.getItem('lastReads');
                if (lastReadsStr) {
                    const lastReads = JSON.parse(lastReadsStr);
                    for (let sender in lastReads) {
                        senderToLastReadMap[sender] = lastReads[sender];
                    }
                }
            }
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            const msg = {
                receiver: decodedPubKey,
                senderToLastReadMap: senderToLastReadMap
            };
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-direct-messages-stats', msg);
            return fetchEventsResponse.events;
        }
        async fetchDirectMessages(pubKey, sender, since = 0, until = 0) {
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
            const fetchEventsResponse = await this._nostrCachedCommunicationManager.fetchEventsFromAPI('fetch-direct-messages', msg);
            return fetchEventsResponse.events;
        }
        async resetMessageCount(pubKey, sender, privateKey) {
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
        async fetchGroupKeys(identifier) {
            let msg = {
                identifier
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-application-specific', msg);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchUserGroupInvitations(groupKinds, pubKey) {
            const decodedPubKey = pubKey.startsWith('npub1') ? index_4.Nip19.decode(pubKey).data : pubKey;
            let msg = {
                pubKey: decodedPubKey,
                groupKinds: groupKinds
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-user-group-invitations', msg);
            let events = fetchEventsResponse.events?.filter(event => event.tags.filter(tag => tag[0] === 'p' && tag?.[3] === 'invitee').map(tag => tag[1]).includes(decodedPubKey));
            return events;
        }
        async fetchCalendarEvents(start, end, limit) {
            let msg = {
                start: start,
                end: end,
                limit: limit || 10
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
            return fetchEventsResponse.events;
        }
        async fetchCalendarEvent(address) {
            const key = `${address.kind}:${address.pubkey}:${address.identifier}`;
            let msg = {
                key
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-events', msg);
            return fetchEventsResponse.events?.length > 0 ? fetchEventsResponse.events[0] : null;
        }
        async fetchCalendarEventPosts(calendarEventUri) {
            let msg = {
                eventUri: calendarEventUri,
                limit: 50
            };
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-posts', msg);
            return fetchEventsResponse.events;
        }
        async fetchCalendarEventRSVPs(calendarEventUri, pubkey) {
            let msg = {
                eventUri: calendarEventUri
            };
            if (pubkey) {
                const decodedPubKey = pubkey.startsWith('npub1') ? index_4.Nip19.decode(pubkey).data : pubkey;
                msg.pubkey = decodedPubKey;
            }
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-calendar-rsvps', msg);
            return fetchEventsResponse.events;
        }
        async fetchLongFormContentEvents(pubKey, since = 0, until = 0) {
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
            const fetchEventsResponse = await this._nostrCommunicationManager.fetchEventsFromAPI('fetch-long-form-content', msg);
            return fetchEventsResponse.events;
        }
    }
    exports.NostrEventManagerReadV2 = NostrEventManagerReadV2;
});
define("@scom/scom-social-sdk/managers/index.ts", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/interfaces.ts", "@scom/scom-social-sdk/managers/communication.ts", "@scom/scom-social-sdk/utils/geohash.ts", "@scom/scom-social-sdk/utils/mqtt.ts", "@scom/scom-social-sdk/utils/lightningWallet.ts", "@scom/scom-social-sdk/managers/utilsManager.ts", "@scom/scom-social-sdk/managers/eventManagerWrite.ts", "@scom/scom-social-sdk/managers/eventManagerRead.ts"], function (require, exports, index_5, interfaces_4, communication_1, geohash_1, mqtt_2, lightningWallet_1, utilsManager_3, eventManagerWrite_1, eventManagerRead_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrWebSocketManager = exports.NostrRestAPIManager = exports.SocialDataManager = exports.SocialUtilsManager = exports.NostrEventManagerWrite = exports.NostrEventManagerReadV2 = exports.NostrEventManagerRead = void 0;
    Object.defineProperty(exports, "NostrRestAPIManager", { enumerable: true, get: function () { return communication_1.NostrRestAPIManager; } });
    Object.defineProperty(exports, "NostrWebSocketManager", { enumerable: true, get: function () { return communication_1.NostrWebSocketManager; } });
    Object.defineProperty(exports, "SocialUtilsManager", { enumerable: true, get: function () { return utilsManager_3.SocialUtilsManager; } });
    Object.defineProperty(exports, "NostrEventManagerWrite", { enumerable: true, get: function () { return eventManagerWrite_1.NostrEventManagerWrite; } });
    Object.defineProperty(exports, "NostrEventManagerRead", { enumerable: true, get: function () { return eventManagerRead_1.NostrEventManagerRead; } });
    Object.defineProperty(exports, "NostrEventManagerReadV2", { enumerable: true, get: function () { return eventManagerRead_1.NostrEventManagerReadV2; } });
    //FIXME: remove this when compiler is fixed
    function flatMap(array, callback) {
        return array.reduce((acc, item) => {
            return acc.concat(callback(item));
        }, []);
    }
    class SocialDataManager {
        constructor(config) {
            this._apiBaseUrl = config.apiBaseUrl;
            this._ipLocationServiceBaseUrl = config.ipLocationServiceBaseUrl;
            let nostrCommunicationManagers = [];
            let nostrCachedCommunicationManager;
            this._relays = config.relays;
            for (let relay of config.relays) {
                if (relay.startsWith('wss://')) {
                    nostrCommunicationManagers.push(new communication_1.NostrWebSocketManager(relay));
                }
                else {
                    nostrCommunicationManagers.push(new communication_1.NostrRestAPIManager(relay));
                    if (!this._defaultRestAPIRelay) {
                        this._defaultRestAPIRelay = relay;
                    }
                }
            }
            if (config.cachedServer.startsWith('wss://')) {
                nostrCachedCommunicationManager = new communication_1.NostrWebSocketManager(config.cachedServer);
            }
            else {
                nostrCachedCommunicationManager = new communication_1.NostrRestAPIManager(config.cachedServer);
            }
            if (config.version === 2) {
                this._socialEventManagerRead = new eventManagerRead_1.NostrEventManagerReadV2(nostrCommunicationManagers[0], nostrCachedCommunicationManager, config.apiBaseUrl);
            }
            else {
                this._socialEventManagerRead = new eventManagerRead_1.NostrEventManagerRead(nostrCommunicationManagers[0], nostrCachedCommunicationManager, config.apiBaseUrl);
            }
            this._socialEventManagerWrite = new eventManagerWrite_1.NostrEventManagerWrite(nostrCommunicationManagers, config.apiBaseUrl);
            if (config.mqttBrokerUrl) {
                this.mqttManager = new mqtt_2.MqttManager({
                    brokerUrl: config.mqttBrokerUrl,
                    subscriptions: config.mqttSubscriptions,
                    messageCallback: config.mqttMessageCallback
                });
            }
            this.lightningWalletManager = new lightningWallet_1.LightningWalletManager();
        }
        set privateKey(privateKey) {
            this._privateKey = privateKey;
            this.lightningWalletManager.privateKey = privateKey;
        }
        get socialEventManagerRead() {
            return this._socialEventManagerRead;
        }
        get socialEventManagerWrite() {
            return this._socialEventManagerWrite;
        }
        set relays(value) {
            this._setRelays(value);
        }
        _setRelays(relays) {
            let nostrCommunicationManagers = [];
            for (let relay of relays) {
                if (relay.startsWith('wss://')) {
                    nostrCommunicationManagers.push(new communication_1.NostrWebSocketManager(relay));
                }
                else {
                    nostrCommunicationManagers.push(new communication_1.NostrRestAPIManager(relay));
                    if (!this._defaultRestAPIRelay) {
                        this._defaultRestAPIRelay = relay;
                    }
                }
            }
            this._socialEventManagerRead.nostrCommunicationManager = nostrCommunicationManagers[0];
            this._socialEventManagerWrite.nostrCommunicationManagers = nostrCommunicationManagers;
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
        async retrieveCommunityEvents(creatorId, communityId) {
            const feedEvents = await this._socialEventManagerRead.fetchCommunityFeed(creatorId, communityId);
            const notes = feedEvents.filter(event => event.kind === 1);
            const communityEvent = feedEvents.find(event => event.kind === 34550);
            if (!communityEvent)
                throw new Error('No info event found');
            const communityInfo = utilsManager_3.SocialUtilsManager.extractCommunityInfo(communityEvent);
            if (!communityInfo)
                throw new Error('No info event found');
            //FIXME: not the best way to do this
            if (communityInfo.membershipType === interfaces_4.MembershipType.InviteOnly) {
                const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
                if (keyEvent) {
                    communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                }
            }
            return {
                notes,
                info: communityInfo
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
        async retrievePostPrivateKey(event, communityUri, communityPrivateKey) {
            let key = null;
            let postScpData = utilsManager_3.SocialUtilsManager.extractScpData(event, interfaces_4.ScpStandardId.CommunityPost);
            try {
                const postPrivateKey = await utilsManager_3.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, postScpData.encryptedKey);
                const messageContentStr = await utilsManager_3.SocialUtilsManager.decryptMessage(postPrivateKey, event.pubkey, event.content);
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
        async retrieveChannelMessagePrivateKey(event, channelId, communityPrivateKey) {
            let key = null;
            let messageScpData = utilsManager_3.SocialUtilsManager.extractScpData(event, interfaces_4.ScpStandardId.ChannelMessage);
            try {
                const messagePrivateKey = await utilsManager_3.SocialUtilsManager.decryptMessage(communityPrivateKey, event.pubkey, messageScpData.encryptedKey);
                const messageContentStr = await utilsManager_3.SocialUtilsManager.decryptMessage(messagePrivateKey, event.pubkey, event.content);
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
            let communityPrivateKey;
            if (communityInfo.membershipType === interfaces_4.MembershipType.InviteOnly) {
                const creatorPubkey = communityInfo.eventData.pubkey;
                const pubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(selfPrivateKey);
                const encryptedKey = communityInfo.memberKeyMap?.[pubkey];
                if (encryptedKey) {
                    communityPrivateKey = await utilsManager_3.SocialUtilsManager.decryptMessage(selfPrivateKey, creatorPubkey, encryptedKey);
                }
            }
            else if (communityInfo.membershipType === interfaces_4.MembershipType.NFTExclusive) {
                communityPrivateKey = await utilsManager_3.SocialUtilsManager.decryptMessage(selfPrivateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
            }
            return communityPrivateKey;
        }
        async retrieveInviteOnlyCommunityNotePrivateKeys(creatorId, communityId) {
            let noteIdToPrivateKey = {};
            const communityEvents = await this.retrieveCommunityEvents(creatorId, communityId);
            const communityInfo = communityEvents.info;
            const notes = communityEvents.notes;
            let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
            if (!communityPrivateKey)
                return noteIdToPrivateKey;
            for (const note of notes) {
                const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                if (postPrivateKey) {
                    noteIdToPrivateKey[note.id] = postPrivateKey;
                }
            }
            return noteIdToPrivateKey;
        }
        async retrieveCommunityPostKeys(options) {
            let noteIdToPrivateKey = {};
            if (options.gatekeeperUrl) {
                let bodyData = {
                    creatorId: options.creatorId,
                    communityId: options.communityId,
                    message: options.message,
                    signature: options.signature
                };
                let url = `${options.gatekeeperUrl}/api/communities/v0/post-keys`;
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
                    noteIdToPrivateKey = result.data;
                }
            }
            else {
                const inviteOnlyNoteIdToPrivateKey = await this.retrieveInviteOnlyCommunityNotePrivateKeys(options.creatorId, options.communityId);
                noteIdToPrivateKey = {
                    ...noteIdToPrivateKey,
                    ...inviteOnlyNoteIdToPrivateKey
                };
            }
            return noteIdToPrivateKey;
        }
        async retrieveCommunityThreadPostKeys(options) {
            const communityInfo = options.communityInfo;
            let noteIdToPrivateKey = {};
            if (options.gatekeeperUrl) {
                let bodyData = {
                    creatorId: communityInfo.creatorId,
                    communityId: communityInfo.communityId,
                    focusedNoteId: options.focusedNoteId,
                    message: options.message,
                    signature: options.signature
                };
                let url = `${options.gatekeeperUrl}/api/communities/v0/post-keys`;
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
                    noteIdToPrivateKey = result.data;
                }
            }
            else {
                let communityPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, this._privateKey);
                if (!communityPrivateKey)
                    return noteIdToPrivateKey;
                for (const note of options.noteEvents) {
                    const postPrivateKey = await this.retrievePostPrivateKey(note, communityInfo.communityUri, communityPrivateKey);
                    if (postPrivateKey) {
                        noteIdToPrivateKey[note.id] = postPrivateKey;
                    }
                }
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
                if (options.pubKey === communityInfo.creatorId) {
                    let communityPrivateKey = await utilsManager_3.SocialUtilsManager.decryptMessage(this._privateKey, communityInfo.scpData.gatekeeperPublicKey, communityInfo.scpData.encryptedKey);
                    if (communityPrivateKey) {
                        communityPrivateKeyMap[communityInfo.communityUri] = communityPrivateKey;
                    }
                }
                communityInfoMap[communityInfo.communityUri] = communityInfo;
            }
            let gatekeeperNpubToNotesMap = {};
            let inviteOnlyCommunityNotesMap = {};
            for (let noteCommunityInfo of noteCommunityMappings.noteCommunityInfoList) {
                const communityPrivateKey = communityPrivateKeyMap[noteCommunityInfo.communityUri];
                if (communityPrivateKey) {
                    const postPrivateKey = await this.retrievePostPrivateKey(noteCommunityInfo.eventData, noteCommunityInfo.communityUri, communityPrivateKey);
                    if (postPrivateKey) {
                        noteIdToPrivateKey[noteCommunityInfo.eventData.id] = postPrivateKey;
                    }
                }
                else {
                    const communityInfo = communityInfoMap[noteCommunityInfo.communityUri];
                    if (!communityInfo)
                        continue;
                    if (communityInfo.membershipType === interfaces_4.MembershipType.InviteOnly) {
                        inviteOnlyCommunityNotesMap[communityInfo.communityUri] = inviteOnlyCommunityNotesMap[communityInfo.communityUri] || [];
                        inviteOnlyCommunityNotesMap[communityInfo.communityUri].push(noteCommunityInfo);
                    }
                    else if (communityInfo.gatekeeperNpub) {
                        gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] = gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub] || [];
                        gatekeeperNpubToNotesMap[communityInfo.gatekeeperNpub].push(noteCommunityInfo);
                    }
                }
            }
            if (Object.keys(gatekeeperNpubToNotesMap).length > 0) {
                for (let gatekeeperNpub in gatekeeperNpubToNotesMap) {
                    const gatekeeperUrl = options.gatekeepers.find(v => v.npub === gatekeeperNpub)?.url;
                    if (gatekeeperUrl) {
                        const noteIds = gatekeeperNpubToNotesMap[gatekeeperNpub].map(v => v.eventData.id);
                        const signature = await options.getSignature(options.pubKey);
                        let bodyData = {
                            noteIds: noteIds.join(','),
                            message: options.pubKey,
                            signature: signature
                        };
                        let url = `${gatekeeperUrl}/api/communities/v0/post-keys`;
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
                            noteIdToPrivateKey = {
                                ...noteIdToPrivateKey,
                                ...result.data
                            };
                        }
                    }
                }
            }
            for (let communityUri in inviteOnlyCommunityNotesMap) {
                for (let noteCommunityInfo of inviteOnlyCommunityNotesMap[communityUri]) {
                    const inviteOnlyNoteIdToPrivateKey = await this.retrieveInviteOnlyCommunityNotePrivateKeys(noteCommunityInfo.creatorId, noteCommunityInfo.communityId);
                    noteIdToPrivateKey = {
                        ...noteIdToPrivateKey,
                        ...inviteOnlyNoteIdToPrivateKey
                    };
                }
            }
            return noteIdToPrivateKey;
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
            const metadata = await this._socialEventManagerRead.fetchUserProfileCacheEvents([...npubs, ...uniqueKeys]);
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
            const fetchFromCache = true;
            let metadataArr = [];
            let followersCountMap = {};
            const fetchData = async () => {
                if (fetchFromCache) {
                    const events = await this._socialEventManagerRead.fetchUserProfileCacheEvents(pubKeys);
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
                // else {
                //     const metadataEvents = await this._socialEventManagerRead.fetchMetadata({
                //         authors: pubKeys
                //     });
                //     if (metadataEvents.length === 0) return null;
                //     metadataArr.push({
                //         ...metadataEvents[0],
                //         content: JSON.parse(metadataEvents[0].content)
                //     });
                // }
                // if (metadataArr.length == 0) {
                //     throw new Error(`Metadata not found`);
                // }
            };
            try {
                await utilsManager_3.SocialUtilsManager.exponentialBackoffRetry(fetchData, 5, 1000, 16000, 2);
            }
            catch (error) { }
            if (metadataArr.length == 0)
                return null;
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = this.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        async updateUserProfile(content) {
            await this._socialEventManagerWrite.updateUserProfile(content, this._privateKey);
        }
        async fetchTrendingNotesInfo() {
            let notes = [];
            let metadataByPubKeyMap = {};
            const events = await this._socialEventManagerRead.fetchTrendingCacheEvents();
            for (let event of events) {
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_3.SocialUtilsManager.parseContent(event.content)
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
        async fetchProfileFeedInfo(pubKey, since = 0, until) {
            const events = await this._socialEventManagerRead.fetchProfileFeedCacheEvents(pubKey, since, until);
            const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
            const { notes, metadataByPubKeyMap, quotedNotesMap, noteToRepostIdMap } = this.createNoteEventMappings(events);
            for (let note of notes) {
                if (note.eventData.tags?.length) {
                    const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                    if (communityUri) {
                        const { creatorId, communityId } = utilsManager_3.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                        note.community = {
                            communityUri,
                            communityId,
                            creatorId: index_5.Nip19.npubEncode(creatorId)
                        };
                    }
                }
                const noteId = note.eventData.id;
                const repostId = noteToRepostIdMap[noteId];
                if (!repostId)
                    continue;
                const metadata = metadataByPubKeyMap[repostId];
                if (!metadata)
                    continue;
                const metadataContent = metadata.content;
                const encodedPubkey = index_5.Nip19.npubEncode(metadata.pubkey);
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
            const events = await this._socialEventManagerRead.fetchProfileRepliesCacheEvents(pubKey, since, until);
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
                const encodedPubkey = index_5.Nip19.npubEncode(metadata.pubkey);
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
        getEarliestEventTimestamp(events) {
            if (!events || events.length === 0) {
                return 0;
            }
            return events.reduce((createdAt, event) => {
                return Math.min(createdAt, event.created_at);
            }, events[0].created_at);
        }
        async fetchHomeFeedInfo(pubKey, since = 0, until) {
            let events = await this._socialEventManagerRead.fetchHomeFeedCacheEvents(pubKey, since, until);
            const earliest = this.getEarliestEventTimestamp(events.filter(v => v.created_at));
            const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap,
                earliest
            };
        }
        async fetchUserFollowingFeedInfo(pubKey, until) {
            let events = await this._socialEventManagerRead.fetchUserFollowingFeed(pubKey, until);
            const earliest = this.getEarliestEventTimestamp(events.filter(v => (v.kind === 1 || v.kind === 6) && v.created_at));
            const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(events);
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
            for (let event of events) {
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_3.SocialUtilsManager.parseContent(event.content)
                    };
                }
                else if (event.kind === 10000107) {
                    const noteEvent = utilsManager_3.SocialUtilsManager.parseContent(event.content);
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
                    const originalNoteContent = utilsManager_3.SocialUtilsManager.parseContent(event.content);
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
                    const content = utilsManager_3.SocialUtilsManager.parseContent(event.content);
                    noteStatsMap[content.event_id] = {
                        upvotes: content.likes,
                        replies: content.replies,
                        reposts: content.reposts
                    };
                }
                else if (event.kind === 10000113) {
                    //"{\"since\":1700034697,\"until\":1700044097,\"order_by\":\"created_at\"}"
                    const timeInfo = utilsManager_3.SocialUtilsManager.parseContent(event.content);
                }
            }
            for (let note of notes) {
                const noteId = note.eventData?.id;
                note.stats = noteStatsMap[noteId];
            }
            return {
                notes,
                metadataByPubKeyMap,
                quotedNotesMap,
                noteToParentAuthorIdMap,
                noteStatsMap,
                noteToRepostIdMap
            };
        }
        async fetchCommunityInfo(creatorId, communityId) {
            const communityEvents = await this._socialEventManagerRead.fetchCommunity(creatorId, communityId);
            const communityEvent = communityEvents.find(event => event.kind === 34550);
            if (!communityEvent)
                return null;
            let communityInfo = utilsManager_3.SocialUtilsManager.extractCommunityInfo(communityEvent);
            //FIXME: not the best way to do this
            if (communityInfo.membershipType === interfaces_4.MembershipType.InviteOnly) {
                const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(communityInfo.communityUri + ':keys');
                if (keyEvent) {
                    communityInfo.memberKeyMap = JSON.parse(keyEvent.content);
                }
            }
            return communityInfo;
        }
        async fetchThreadNotesInfo(focusedNoteId) {
            let focusedNote;
            let ancestorNotes = [];
            let replies = [];
            let childReplyEventTagIds = [];
            //Ancestor posts -> Focused post -> Child replies
            let decodedFocusedNoteId = focusedNoteId.startsWith('note1') ? index_5.Nip19.decode(focusedNoteId).data : focusedNoteId;
            const threadEvents = await this._socialEventManagerRead.fetchThreadCacheEvents(decodedFocusedNoteId);
            const { notes, metadataByPubKeyMap, quotedNotesMap } = this.createNoteEventMappings(threadEvents);
            for (let note of notes) {
                if (note.eventData.tags?.length) {
                    const communityUri = note.eventData.tags.find(tag => tag[0] === 'a')?.[1];
                    if (communityUri) {
                        const { creatorId, communityId } = utilsManager_3.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                        note.community = {
                            communityUri,
                            communityId,
                            creatorId: index_5.Nip19.npubEncode(creatorId)
                        };
                    }
                }
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
            let scpData = utilsManager_3.SocialUtilsManager.extractScpData(focusedNote.eventData, interfaces_4.ScpStandardId.CommunityPost);
            if (scpData) {
                const communityUri = this.retrieveCommunityUri(focusedNote.eventData, scpData);
                if (communityUri) {
                    const { creatorId, communityId } = utilsManager_3.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
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
                let scpData = utilsManager_3.SocialUtilsManager.extractScpData(note, interfaces_4.ScpStandardId.CommunityPost);
                if (scpData) {
                    const communityUri = this.retrieveCommunityUri(note, scpData);
                    if (communityUri) {
                        const { creatorId, communityId } = utilsManager_3.SocialUtilsManager.getCommunityBasicInfoFromUri(communityUri);
                        pubkeyToCommunityIdsMap[creatorId] = pubkeyToCommunityIdsMap[creatorId] || [];
                        if (!pubkeyToCommunityIdsMap[creatorId].includes(communityId)) {
                            pubkeyToCommunityIdsMap[creatorId].push(communityId);
                        }
                        noteCommunityInfoList.push({
                            eventData: note,
                            communityUri,
                            communityId,
                            creatorId
                        });
                    }
                }
            }
            if (noteCommunityInfoList.length > 0) {
                const communityEvents = await this._socialEventManagerRead.fetchCommunities(pubkeyToCommunityIdsMap);
                for (let event of communityEvents) {
                    let communityInfo = utilsManager_3.SocialUtilsManager.extractCommunityInfo(event);
                    communityInfoList.push(communityInfo);
                }
            }
            return {
                noteCommunityInfoList,
                communityInfoList
            };
        }
        async retrieveUserProfileDetail(pubKey) {
            let metadata;
            let stats;
            const userContactEvents = await this._socialEventManagerRead.fetchUserProfileDetailCacheEvents(pubKey);
            for (let event of userContactEvents) {
                if (event.kind === 0) {
                    metadata = {
                        ...event,
                        content: utilsManager_3.SocialUtilsManager.parseContent(event.content)
                    };
                }
                else if (event.kind === 10000105) {
                    let content = utilsManager_3.SocialUtilsManager.parseContent(event.content);
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
            let userProfile = this.constructUserProfile(metadata);
            return {
                userProfile,
                stats
            };
        }
        constructUserProfile(metadata, followersCountMap) {
            const followersCount = followersCountMap?.[metadata.pubkey] || 0;
            const encodedPubkey = index_5.Nip19.npubEncode(metadata.pubkey);
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
                metadata,
            };
            return userProfile;
        }
        async fetchUserContactList(pubKey) {
            let metadataArr = [];
            let followersCountMap = {};
            const userContactEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(pubKey, true);
            for (let event of userContactEvents) {
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
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = this.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        async fetchUserFollowersList(pubKey) {
            let metadataArr = [];
            let followersCountMap = {};
            const userFollowersEvents = await this._socialEventManagerRead.fetchFollowersCacheEvents(pubKey);
            for (let event of userFollowersEvents) {
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
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = this.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        async fetchUserRelayList(pubKey) {
            let relayList = [];
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(pubKey);
            const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
            if (!relaysEvent)
                return relayList;
            relayList = relaysEvent.tags.filter(tag => tag[0] === 'r')?.map(tag => tag[1]) || [];
            return relayList;
        }
        async followUser(userPubKey) {
            const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_5.Nip19.decode(userPubKey).data : userPubKey;
            const selfPubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
            let content = '';
            let contactPubKeys = new Set();
            let contactListEvent = contactListEvents.find(event => event.kind === 3);
            if (contactListEvent) {
                content = contactListEvent.content;
                contactPubKeys = new Set(contactListEvent.tags.filter(tag => tag[0] === 'p')?.map(tag => tag[1]) || []);
            }
            contactPubKeys.add(decodedUserPubKey);
            await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys), this._privateKey);
        }
        async unfollowUser(userPubKey) {
            const decodedUserPubKey = userPubKey.startsWith('npub1') ? index_5.Nip19.decode(userPubKey).data : userPubKey;
            const selfPubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            const contactListEvents = await this._socialEventManagerRead.fetchContactListCacheEvents(selfPubkey, false);
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
            await this._socialEventManagerWrite.updateContactList(content, Array.from(contactPubKeys), this._privateKey);
        }
        async generateGroupKeys(privateKey, encryptionPublicKeys) {
            const groupPrivateKey = index_5.Keys.generatePrivateKey();
            const groupPublicKey = index_5.Keys.getPublicKey(groupPrivateKey);
            let encryptedGroupKeys = {};
            for (let encryptionPublicKey of encryptionPublicKeys) {
                const encryptedGroupKey = await utilsManager_3.SocialUtilsManager.encryptMessage(privateKey, encryptionPublicKey, groupPrivateKey);
                encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
            }
            return {
                groupPrivateKey,
                groupPublicKey,
                encryptedGroupKeys
            };
        }
        async createCommunity(newInfo, creatorId) {
            const communityUri = utilsManager_3.SocialUtilsManager.getCommunityUri(creatorId, newInfo.name);
            let communityInfo = {
                communityUri,
                communityId: newInfo.name,
                creatorId,
                description: newInfo.description,
                rules: newInfo.rules,
                bannerImgUrl: newInfo.bannerImgUrl,
                avatarImgUrl: newInfo.avatarImgUrl,
                moderatorIds: newInfo.moderatorIds,
                gatekeeperNpub: newInfo.gatekeeperNpub,
                scpData: newInfo.scpData,
                membershipType: newInfo.membershipType,
                memberIds: newInfo.memberIds
            };
            if (communityInfo.membershipType === interfaces_4.MembershipType.NFTExclusive) {
                const gatekeeperPublicKey = index_5.Nip19.decode(communityInfo.gatekeeperNpub).data;
                const communityKeys = await this.generateGroupKeys(this._privateKey, [gatekeeperPublicKey]);
                const encryptedKey = communityKeys.encryptedGroupKeys[gatekeeperPublicKey];
                communityInfo.scpData = {
                    ...communityInfo.scpData,
                    publicKey: communityKeys.groupPublicKey,
                    encryptedKey: encryptedKey,
                    gatekeeperPublicKey
                };
            }
            else if (communityInfo.membershipType === interfaces_4.MembershipType.InviteOnly) {
                let encryptionPublicKeys = [];
                for (let memberId of communityInfo.memberIds) {
                    const memberPublicKey = index_5.Nip19.decode(memberId).data;
                    encryptionPublicKeys.push(memberPublicKey);
                }
                const communityKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
                await this._socialEventManagerWrite.updateGroupKeys(communityUri + ':keys', 34550, JSON.stringify(communityKeys.encryptedGroupKeys), communityInfo.memberIds, this._privateKey);
                communityInfo.scpData = {
                    ...communityInfo.scpData,
                    publicKey: communityKeys.groupPublicKey
                };
            }
            if (communityInfo.scpData) {
                const updateChannelResponses = await this.updateCommunityChannel(communityInfo);
                //FIXME: fix this when the relay is fixed
                const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
                if (updateChannelResponse?.eventId) {
                    communityInfo.scpData.channelEventId = updateChannelResponse.eventId;
                }
            }
            await this._socialEventManagerWrite.updateCommunity(communityInfo, this._privateKey);
            return communityInfo;
        }
        async updateCommunity(info) {
            if (info.membershipType === interfaces_4.MembershipType.NFTExclusive) {
                const gatekeeperPublicKey = index_5.Nip19.decode(info.gatekeeperNpub).data;
                info.scpData.gatekeeperPublicKey = gatekeeperPublicKey;
            }
            else if (info.membershipType === interfaces_4.MembershipType.InviteOnly) {
                let encryptionPublicKeys = [];
                for (let memberId of info.memberIds) {
                    const memberPublicKey = index_5.Nip19.decode(memberId).data;
                    encryptionPublicKeys.push(memberPublicKey);
                }
                const groupPrivateKey = await this.retrieveCommunityPrivateKey(info, this._privateKey);
                let encryptedGroupKeys = {};
                for (let encryptionPublicKey of encryptionPublicKeys) {
                    const encryptedGroupKey = await utilsManager_3.SocialUtilsManager.encryptMessage(this._privateKey, encryptionPublicKey, groupPrivateKey);
                    encryptedGroupKeys[encryptionPublicKey] = encryptedGroupKey;
                }
                const response = await this._socialEventManagerWrite.updateGroupKeys(info.communityUri + ':keys', 34550, JSON.stringify(encryptedGroupKeys), info.memberIds, this._privateKey);
                console.log('updateCommunity', response);
            }
            await this._socialEventManagerWrite.updateCommunity(info, this._privateKey);
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
            const updateChannelResponse = await this._socialEventManagerWrite.updateChannel(channelInfo, this._privateKey);
            return updateChannelResponse;
        }
        async createChannel(channelInfo, memberIds) {
            let encryptionPublicKeys = [];
            for (let memberId of memberIds) {
                const memberPublicKey = index_5.Nip19.decode(memberId).data;
                encryptionPublicKeys.push(memberPublicKey);
            }
            const channelKeys = await this.generateGroupKeys(this._privateKey, encryptionPublicKeys);
            channelInfo.scpData = {
                ...channelInfo.scpData,
                publicKey: channelKeys.groupPublicKey
            };
            const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo, this._privateKey);
            //FIXME: fix this when the relay is fixed
            const updateChannelResponse = updateChannelResponses.find(v => v.success && !!v.eventId);
            if (updateChannelResponse?.eventId) {
                const channelUri = `40:${updateChannelResponse.eventId}`;
                await this._socialEventManagerWrite.updateGroupKeys(channelUri + ':keys', 40, JSON.stringify(channelKeys.encryptedGroupKeys), memberIds, this._privateKey);
            }
            return channelInfo;
        }
        async updateChannel(channelInfo) {
            const updateChannelResponses = await this._socialEventManagerWrite.updateChannel(channelInfo, this._privateKey);
            return updateChannelResponses;
        }
        async fetchCommunitiesMembers(communities) {
            const communityUriToMemberIdRoleComboMap = await this.mapCommunityUriToMemberIdRoleCombo(communities);
            let pubkeys = new Set(flatMap(Object.values(communityUriToMemberIdRoleComboMap), combo => combo.map(c => c.id)));
            const communityUriToMembersMap = {};
            if (pubkeys.size > 0) {
                const userProfiles = await this.fetchUserProfiles(Array.from(pubkeys));
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
        async fetchCommunities() {
            let communities = [];
            const events = await this._socialEventManagerRead.fetchCommunities();
            for (let event of events) {
                const communityInfo = utilsManager_3.SocialUtilsManager.extractCommunityInfo(event);
                let community = {
                    ...communityInfo,
                    members: []
                };
                communities.push(community);
            }
            const communityUriToMembersMap = await this.fetchCommunitiesMembers(communities);
            for (let community of communities) {
                community.members = communityUriToMembersMap[community.communityUri];
            }
            return communities;
        }
        async fetchMyCommunities(pubKey) {
            let communities = [];
            const events = await this._socialEventManagerRead.fetchAllUserRelatedCommunities(pubKey);
            for (let event of events) {
                if (event.kind === 34550) {
                    const communityInfo = utilsManager_3.SocialUtilsManager.extractCommunityInfo(event);
                    communities.push(communityInfo);
                }
            }
            return communities;
        }
        async joinCommunity(community, pubKey) {
            const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities(pubKey);
            communities.push(community);
            await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities, this._privateKey);
            if (community.scpData?.channelEventId) {
                const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds(pubKey);
                channelEventIds.push(community.scpData.channelEventId);
                await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds, this._privateKey);
            }
        }
        async leaveCommunity(community, pubKey) {
            const communities = await this._socialEventManagerRead.fetchUserBookmarkedCommunities(pubKey, community);
            await this._socialEventManagerWrite.updateUserBookmarkedCommunities(communities, this._privateKey);
            if (community.scpData?.channelEventId) {
                const channelEventIds = await this._socialEventManagerRead.fetchUserBookmarkedChannelEventIds(pubKey);
                const index = channelEventIds.indexOf(community.scpData.channelEventId);
                if (index > -1) {
                    channelEventIds.splice(index, 1);
                }
                await this._socialEventManagerWrite.updateUserBookmarkedChannels(channelEventIds, this._privateKey);
            }
        }
        async encryptGroupMessage(privateKey, groupPublicKey, message) {
            const messagePrivateKey = index_5.Keys.generatePrivateKey();
            const messagePublicKey = index_5.Keys.getPublicKey(messagePrivateKey);
            const encryptedGroupKey = await utilsManager_3.SocialUtilsManager.encryptMessage(privateKey, groupPublicKey, messagePrivateKey);
            const encryptedMessage = await utilsManager_3.SocialUtilsManager.encryptMessage(privateKey, messagePublicKey, message);
            return {
                encryptedMessage,
                encryptedGroupKey
            };
        }
        async submitCommunityPost(message, info, conversationPath) {
            const messageContent = {
                communityUri: info.communityUri,
                message,
            };
            let newCommunityPostInfo;
            if (info.membershipType === interfaces_4.MembershipType.Open) {
                newCommunityPostInfo = {
                    community: info,
                    message,
                    conversationPath
                };
            }
            else {
                const { encryptedMessage, encryptedGroupKey } = await this.encryptGroupMessage(this._privateKey, info.scpData.publicKey, JSON.stringify(messageContent));
                newCommunityPostInfo = {
                    community: info,
                    message: encryptedMessage,
                    conversationPath,
                    scpData: {
                        encryptedKey: encryptedGroupKey,
                        communityUri: info.communityUri
                    }
                };
            }
            await this._socialEventManagerWrite.submitCommunityPost(newCommunityPostInfo, this._privateKey);
        }
        async fetchAllUserRelatedChannels(pubKey) {
            const { channels, channelMetadataMap, channelIdToCommunityMap } = await this._socialEventManagerRead.fetchAllUserRelatedChannels(pubKey);
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
            const events = await this._socialEventManagerRead.fetchChannelMessages(channelId, since, until);
            const messageEvents = events.filter(event => event.kind === 42);
            return messageEvents;
        }
        async retrieveChannelEvents(creatorId, channelId) {
            const channelEvents = await this._socialEventManagerRead.fetchChannelInfoMessages(channelId);
            const messageEvents = channelEvents.filter(event => event.kind === 42);
            const channelCreationEvent = channelEvents.find(event => event.kind === 40);
            if (!channelCreationEvent)
                throw new Error('No info event found');
            const channelMetadataEvent = channelEvents.find(event => event.kind === 41);
            let channelInfo;
            if (channelMetadataEvent) {
                channelInfo = utilsManager_3.SocialUtilsManager.extractChannelInfo(channelMetadataEvent);
            }
            else {
                channelInfo = utilsManager_3.SocialUtilsManager.extractChannelInfo(channelCreationEvent);
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
                let bodyData = {
                    creatorId: options.creatorId,
                    channelId: options.channelId,
                    message: options.message,
                    signature: options.signature
                };
                let url = `${options.gatekeeperUrl}/api/channels/v0/message-keys`;
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
                    messageIdToPrivateKey = result.data;
                }
            }
            else if (options.privateKey) {
                let groupPrivateKey;
                const channelEvents = await this.retrieveChannelEvents(options.creatorId, options.channelId);
                const channelInfo = channelEvents.info;
                const messageEvents = channelEvents.messageEvents;
                if (channelInfo.scpData.communityUri) {
                    const { communityId } = utilsManager_3.SocialUtilsManager.getCommunityBasicInfoFromUri(channelInfo.scpData.communityUri);
                    const communityInfo = await this.fetchCommunityInfo(channelInfo.eventData.pubkey, communityId);
                    groupPrivateKey = await this.retrieveCommunityPrivateKey(communityInfo, options.privateKey);
                    if (!groupPrivateKey)
                        return messageIdToPrivateKey;
                }
                else {
                    const groupUri = `40:${channelInfo.id}`;
                    const keyEvent = await this._socialEventManagerRead.fetchGroupKeys(groupUri + ':keys');
                    if (keyEvent) {
                        const creatorPubkey = channelInfo.eventData.pubkey;
                        const pubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(options.privateKey);
                        const memberKeyMap = JSON.parse(keyEvent.content);
                        const encryptedKey = memberKeyMap?.[pubkey];
                        if (encryptedKey) {
                            groupPrivateKey = await utilsManager_3.SocialUtilsManager.decryptMessage(options.privateKey, creatorPubkey, encryptedKey);
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
            await this._socialEventManagerWrite.submitChannelMessage(newChannelMessageInfo, this._privateKey);
        }
        async fetchDirectMessagesBySender(selfPubKey, senderPubKey, since, until) {
            const decodedSenderPubKey = index_5.Nip19.decode(senderPubKey).data;
            const events = await this._socialEventManagerRead.fetchDirectMessages(selfPubKey, decodedSenderPubKey, since, until);
            let metadataByPubKeyMap = {};
            const encryptedMessages = [];
            for (let event of events) {
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_3.SocialUtilsManager.parseContent(event.content)
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
        async sendDirectMessage(chatId, message) {
            const decodedReceiverPubKey = index_5.Nip19.decode(chatId).data;
            const content = await utilsManager_3.SocialUtilsManager.encryptMessage(this._privateKey, decodedReceiverPubKey, message);
            await this._socialEventManagerWrite.sendMessage(decodedReceiverPubKey, content, this._privateKey);
        }
        async resetMessageCount(selfPubKey, senderPubKey) {
            await this._socialEventManagerRead.resetMessageCount(selfPubKey, senderPubKey, this._privateKey);
        }
        async fetchMessageContacts(pubKey) {
            const events = await this._socialEventManagerRead.fetchMessageContactsCacheEvents(pubKey);
            const pubkeyToMessageInfoMap = {};
            let metadataByPubKeyMap = {};
            for (let event of events) {
                if (event.kind === 10000118) {
                    const content = utilsManager_3.SocialUtilsManager.parseContent(event.content);
                    Object.keys(content).forEach(pubkey => {
                        pubkeyToMessageInfoMap[pubkey] = content[pubkey];
                    });
                }
                if (event.kind === 0) {
                    metadataByPubKeyMap[event.pubkey] = {
                        ...event,
                        content: utilsManager_3.SocialUtilsManager.parseContent(event.content)
                    };
                }
            }
            let profiles = Object.entries(metadataByPubKeyMap).map(([k, v]) => {
                const encodedPubkey = index_5.Nip19.npubEncode(k);
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
                let creatorId = index_5.Nip19.npubEncode(channel.eventData.pubkey);
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
            const events = await this._socialEventManagerRead.fetchUserGroupInvitations([40, 34550], pubKey);
            for (let event of events) {
                const identifier = event.tags.find(tag => tag[0] === 'd')?.[1];
                if (identifier) {
                    identifiers.push(identifier);
                }
            }
            return identifiers;
        }
        async mapCommunityUriToMemberIdRoleCombo(communities) {
            const communityUriToMemberIdRoleComboMap = {};
            const communityUriToCreatorOrModeratorIdsMap = {};
            for (let community of communities) {
                const communityUri = community.communityUri;
                communityUriToMemberIdRoleComboMap[communityUri] = [];
                communityUriToMemberIdRoleComboMap[communityUri].push({
                    id: community.creatorId,
                    role: interfaces_4.CommunityRole.Creator
                });
                communityUriToCreatorOrModeratorIdsMap[communityUri] = new Set();
                communityUriToCreatorOrModeratorIdsMap[communityUri].add(community.creatorId);
                if (community.moderatorIds) {
                    if (community.moderatorIds.includes(community.creatorId))
                        continue;
                    for (let moderator of community.moderatorIds) {
                        communityUriToMemberIdRoleComboMap[communityUri].push({
                            id: moderator,
                            role: interfaces_4.CommunityRole.Moderator
                        });
                        communityUriToCreatorOrModeratorIdsMap[communityUri].add(moderator);
                    }
                }
            }
            const generalMembersEvents = await this._socialEventManagerRead.fetchCommunitiesGeneralMembers(communities);
            for (let event of generalMembersEvents) {
                const communityUriArr = event.tags.filter(tag => tag[0] === 'a')?.map(tag => tag[1]) || [];
                for (let communityUri of communityUriArr) {
                    if (!communityUriToMemberIdRoleComboMap[communityUri])
                        continue;
                    const pubkey = index_5.Nip19.npubEncode(event.pubkey);
                    if (communityUriToCreatorOrModeratorIdsMap[communityUri].has(pubkey))
                        continue;
                    communityUriToMemberIdRoleComboMap[communityUri].push({
                        id: pubkey,
                        role: interfaces_4.CommunityRole.GeneralMember
                    });
                }
            }
            return communityUriToMemberIdRoleComboMap;
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
                type = interfaces_4.CalendarEventType.DateBased;
                const startDate = new Date(start);
                startTime = startDate.getTime() / 1000;
                if (end) {
                    const endDate = new Date(end);
                    endTime = endDate.getTime() / 1000;
                }
            }
            else if (event.kind === 31923) {
                type = interfaces_4.CalendarEventType.TimeBased;
                startTime = Number(start);
                if (end) {
                    endTime = Number(end);
                }
            }
            const naddr = index_5.Nip19.naddrEncode({
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
            const responses = await this._socialEventManagerWrite.updateCalendarEvent(updateCalendarEventInfo, this._privateKey);
            const response = responses[0];
            if (response.success) {
                const pubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
                naddr = index_5.Nip19.naddrEncode({
                    identifier: updateCalendarEventInfo.id,
                    pubkey: pubkey,
                    kind: updateCalendarEventInfo.type === interfaces_4.CalendarEventType.DateBased ? 31922 : 31923,
                    relays: []
                });
            }
            return naddr;
        }
        async retrieveCalendarEventsByDateRange(start, end, limit) {
            const events = await this._socialEventManagerRead.fetchCalendarEvents(start, end, limit);
            let calendarEventInfoList = [];
            for (let event of events) {
                let calendarEventInfo = this.extractCalendarEventInfo(event);
                calendarEventInfoList.push(calendarEventInfo);
            }
            return calendarEventInfoList;
        }
        async retrieveCalendarEvent(naddr) {
            let address = index_5.Nip19.decode(naddr).data;
            const calendarEvent = await this._socialEventManagerRead.fetchCalendarEvent(address);
            if (!calendarEvent)
                return null;
            let calendarEventInfo = this.extractCalendarEventInfo(calendarEvent);
            let hostPubkeys = calendarEvent.tags.filter(tag => tag[0] === 'p' && tag[3] === 'host')?.map(tag => tag[1]) || [];
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            let hosts = [];
            let attendees = [];
            let attendeePubkeys = [];
            let attendeePubkeyToEventMap = {};
            const postEvents = await this._socialEventManagerRead.fetchCalendarEventPosts(calendarEventUri);
            const notes = [];
            for (let postEvent of postEvents) {
                const note = {
                    eventData: postEvent
                };
                notes.push(note);
            }
            const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri);
            for (let rsvpEvent of rsvpEvents) {
                if (attendeePubkeyToEventMap[rsvpEvent.pubkey])
                    continue;
                let attendanceStatus = rsvpEvent.tags.find(tag => tag[0] === 'l' && tag[2] === 'status')?.[1];
                if (attendanceStatus === 'accepted') {
                    attendeePubkeyToEventMap[rsvpEvent.pubkey] = rsvpEvent;
                    attendeePubkeys.push(rsvpEvent.pubkey);
                }
            }
            const userProfileEvents = await this._socialEventManagerRead.fetchUserProfileCacheEvents([
                ...hostPubkeys,
                ...attendeePubkeys
            ]);
            for (let event of userProfileEvents) {
                if (event.kind === 0) {
                    let metaData = {
                        ...event,
                        content: utilsManager_3.SocialUtilsManager.parseContent(event.content)
                    };
                    let userProfile = this.constructUserProfile(metaData);
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
            let address = index_5.Nip19.decode(naddr).data;
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            const pubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
            if (rsvpEvents.length > 0) {
                rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
            }
            await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, true, this._privateKey);
        }
        async declineCalendarEvent(rsvpId, naddr) {
            let address = index_5.Nip19.decode(naddr).data;
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            const pubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            const rsvpEvents = await this._socialEventManagerRead.fetchCalendarEventRSVPs(calendarEventUri, pubkey);
            if (rsvpEvents.length > 0) {
                rsvpId = rsvpEvents[0].tags.find(tag => tag[0] === 'd')?.[1];
            }
            await this._socialEventManagerWrite.createCalendarEventRSVP(rsvpId, calendarEventUri, false, this._privateKey);
        }
        async submitCalendarEventPost(naddr, message, conversationPath) {
            let address = index_5.Nip19.decode(naddr).data;
            const calendarEventUri = `${address.kind}:${address.pubkey}:${address.identifier}`;
            let info = {
                calendarEventUri,
                message,
                conversationPath
            };
            const responses = await this._socialEventManagerWrite.submitCalendarEventPost(info, this._privateKey);
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
                let gmtOffset = utilsManager_3.SocialUtilsManager.getGMTOffset(timezone.timezoneName);
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
        async submitMessage(message, conversationPath) {
            await this._socialEventManagerWrite.postNote(message, this._privateKey, conversationPath);
        }
        async submitLongFormContent(info) {
            await this._socialEventManagerWrite.submitLongFormContentEvents(info, this._privateKey);
        }
        async submitLike(postEventData) {
            let tags = postEventData.tags.filter(tag => tag.length >= 2 && (tag[0] === 'e' || tag[0] === 'p'));
            tags.push(['e', postEventData.id]);
            tags.push(['p', postEventData.pubkey]);
            tags.push(['k', postEventData.kind.toString()]);
            await this._socialEventManagerWrite.submitLike(tags, this._privateKey);
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
            await this._socialEventManagerWrite.submitRepost(content, tags, this._privateKey);
        }
        async sendPingRequest(pubkey, walletAddress, signature) {
            if (!this._defaultRestAPIRelay)
                return null;
            let msg = pubkey;
            const pubkeyY = index_5.Keys.getPublicKeyY(this._privateKey);
            const data = {
                msg: msg,
                signature: signature,
                pubkey: pubkey,
                pubkeyY: pubkeyY,
                walletAddress: walletAddress
            };
            let response = await fetch(this._defaultRestAPIRelay + '/ping', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            let result = await response.json();
            return result;
        }
        async fetchUnreadMessageCounts(pubkey) {
            if (!this._defaultRestAPIRelay)
                return null;
            let url = this._defaultRestAPIRelay + '/unread-message-counts?pubkey=' + pubkey;
            const response = await fetch(url);
            const result = await response.json();
            return result;
        }
        async updateMessageLastReadReceipt(pubkey, walletAddress, signature, fromId) {
            if (!this._defaultRestAPIRelay)
                return null;
            let msg = pubkey;
            const data = {
                fromId: fromId,
                msg: msg,
                signature: signature,
                pubkey: pubkey,
                walletAddress: walletAddress
            };
            let response = await fetch(this._defaultRestAPIRelay + '/update-message-last-read-receipt', {
                method: 'POST',
                headers: {
                    Accept: 'application/json',
                    'Content-Type': 'application/json',
                },
                body: JSON.stringify(data)
            });
            let result = await response.json();
            return result;
        }
        async searchUsers(query) {
            const events = await this._socialEventManagerRead.searchUsers(query);
            let metadataArr = [];
            let followersCountMap = {};
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
            const userProfiles = [];
            for (let metadata of metadataArr) {
                let userProfile = this.constructUserProfile(metadata, followersCountMap);
                userProfiles.push(userProfile);
            }
            return userProfiles;
        }
        async addRelay(url) {
            const selfPubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
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
            await this._socialEventManagerWrite.updateRelayList(relays, this._privateKey);
        }
        async removeRelay(url) {
            const selfPubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
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
            await this._socialEventManagerWrite.updateRelayList(relays, this._privateKey);
        }
        async updateRelays(add, remove, defaultRelays) {
            const selfPubkey = utilsManager_3.SocialUtilsManager.convertPrivateKeyToPubkey(this._privateKey);
            const relaysEvents = await this._socialEventManagerRead.fetchUserRelays(selfPubkey);
            const relaysEvent = relaysEvents.find(event => event.kind === 10000139);
            let relays = {};
            for (let relay of add) {
                relays[relay] = { read: true, write: true };
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
                    relays[tag[1]] = config;
                }
            }
            let relayUrls = Object.keys(relays);
            this.relays = relayUrls.length > 0 ? relayUrls : defaultRelays;
            await this._socialEventManagerWrite.updateRelayList(relays, this._privateKey);
        }
        async makeInvoice(amount, comment) {
            const paymentRequest = await this.lightningWalletManager.makeInvoice(Number(amount), comment);
            await this._socialEventManagerWrite.createPaymentRequestEvent(paymentRequest, amount, comment, this._privateKey);
            return paymentRequest;
        }
        async sendPayment(paymentRequest, comment) {
            const preimage = await this.lightningWalletManager.sendPayment(paymentRequest);
            const requestEvent = await this._socialEventManagerRead.fetchPaymentRequestEvent(paymentRequest);
            if (requestEvent) {
                await this._socialEventManagerWrite.createPaymentReceiptEvent(requestEvent.id, requestEvent.pubkey, preimage, comment, this._privateKey);
            }
            return preimage;
        }
        async zap(pubkey, lud16, amount, noteId) {
            const response = await this.lightningWalletManager.zap(pubkey, lud16, Number(amount), '', this._relays, noteId);
            return response;
        }
        async fetchUserPaymentActivities(pubkey, since, until) {
            const paymentActivitiesForSender = await this._socialEventManagerRead.fetchPaymentActivitiesForSender(pubkey, since, until);
            const paymentActivitiesForRecipient = await this._socialEventManagerRead.fetchPaymentActivitiesForRecipient(pubkey, since, until);
            const paymentActivities = [...paymentActivitiesForSender, ...paymentActivitiesForRecipient];
            return paymentActivities.sort((a, b) => b.createdAt - a.createdAt);
        }
        async getLightningBalance() {
            const response = await this.lightningWalletManager.getBalance();
            return response;
        }
        async getBitcoinPrice() {
            const response = await fetch('https://api.coinpaprika.com/v1/tickers/btc-bitcoin');
            const result = await response.json();
            const price = result.quotes.USD.price;
            return price;
        }
    }
    exports.SocialDataManager = SocialDataManager;
});
define("@scom/scom-social-sdk", ["require", "exports", "@scom/scom-social-sdk/core/index.ts", "@scom/scom-social-sdk/utils/index.ts", "@scom/scom-social-sdk/managers/index.ts"], function (require, exports, index_6, index_7, managers_1) {
    "use strict";
    Object.defineProperty(exports, "__esModule", { value: true });
    exports.NostrRestAPIManager = exports.NostrWebSocketManager = exports.SocialDataManager = exports.SocialUtilsManager = exports.NostrEventManagerWrite = exports.NostrEventManagerReadV2 = exports.NostrEventManagerRead = exports.MqttManager = exports.CalendarEventType = exports.CommunityRole = exports.MembershipType = exports.Bech32 = exports.Nip19 = exports.Keys = exports.Event = void 0;
    Object.defineProperty(exports, "Event", { enumerable: true, get: function () { return index_6.Event; } });
    Object.defineProperty(exports, "Keys", { enumerable: true, get: function () { return index_6.Keys; } });
    Object.defineProperty(exports, "Nip19", { enumerable: true, get: function () { return index_6.Nip19; } });
    Object.defineProperty(exports, "Bech32", { enumerable: true, get: function () { return index_6.Bech32; } });
    Object.defineProperty(exports, "MembershipType", { enumerable: true, get: function () { return index_7.MembershipType; } });
    Object.defineProperty(exports, "CommunityRole", { enumerable: true, get: function () { return index_7.CommunityRole; } });
    Object.defineProperty(exports, "CalendarEventType", { enumerable: true, get: function () { return index_7.CalendarEventType; } });
    Object.defineProperty(exports, "MqttManager", { enumerable: true, get: function () { return index_7.MqttManager; } });
    Object.defineProperty(exports, "NostrEventManagerRead", { enumerable: true, get: function () { return managers_1.NostrEventManagerRead; } });
    Object.defineProperty(exports, "NostrEventManagerReadV2", { enumerable: true, get: function () { return managers_1.NostrEventManagerReadV2; } });
    Object.defineProperty(exports, "NostrEventManagerWrite", { enumerable: true, get: function () { return managers_1.NostrEventManagerWrite; } });
    Object.defineProperty(exports, "SocialUtilsManager", { enumerable: true, get: function () { return managers_1.SocialUtilsManager; } });
    Object.defineProperty(exports, "SocialDataManager", { enumerable: true, get: function () { return managers_1.SocialDataManager; } });
    Object.defineProperty(exports, "NostrWebSocketManager", { enumerable: true, get: function () { return managers_1.NostrWebSocketManager; } });
    Object.defineProperty(exports, "NostrRestAPIManager", { enumerable: true, get: function () { return managers_1.NostrRestAPIManager; } });
});
"use strict";var mqtt=(()=>{var hs=Object.defineProperty;var qg=Object.getOwnPropertyDescriptor;var Dg=Object.getOwnPropertyNames;var jg=Object.prototype.hasOwnProperty;var be=(t,e)=>()=>(t&&(e=t(t=0)),e);var M=(t,e)=>()=>(e||t((e={exports:{}}).exports,e),e.exports),Qt=(t,e)=>{for(var r in e)hs(t,r,{get:e[r],enumerable:!0})},Fg=(t,e,r,i)=>{if(e&&typeof e=="object"||typeof e=="function")for(let n of Dg(e))!jg.call(t,n)&&n!==r&&hs(t,n,{get:()=>e[n],enumerable:!(i=qg(e,n))||i.enumerable});return t};var Z=t=>Fg(hs({},"__esModule",{value:!0}),t);var _=be(()=>{});var B={};Qt(B,{_debugEnd:()=>pu,_debugProcess:()=>du,_events:()=>Pu,_eventsCount:()=>Ou,_exiting:()=>Gl,_fatalExceptions:()=>uu,_getActiveHandles:()=>Xl,_getActiveRequests:()=>Jl,_kill:()=>eu,_linkedBinding:()=>zl,_maxListeners:()=>Bu,_preload_modules:()=>Tu,_rawDebug:()=>Hl,_startProfilerIdleNotifier:()=>gu,_stopProfilerIdleNotifier:()=>yu,_tickCallback:()=>hu,abort:()=>mu,addListener:()=>xu,allowedNodeEnvironmentFlags:()=>ou,arch:()=>Ol,argv:()=>Ml,argv0:()=>Iu,assert:()=>au,binding:()=>Dl,chdir:()=>Wl,config:()=>Ql,cpuUsage:()=>qi,cwd:()=>Fl,debugPort:()=>Au,default:()=>Fu,dlopen:()=>Yl,domain:()=>Kl,emit:()=>Nu,emitWarning:()=>ql,env:()=>kl,execArgv:()=>Ll,execPath:()=>Su,exit:()=>nu,features:()=>lu,hasUncaughtExceptionCaptureCallback:()=>cu,hrtime:()=>Ni,kill:()=>iu,listeners:()=>ju,memoryUsage:()=>ru,moduleLoadList:()=>Vl,nextTick:()=>Cl,off:()=>Mu,on:()=>bt,once:()=>ku,openStdin:()=>su,pid:()=>vu,platform:()=>xl,ppid:()=>Eu,prependListener:()=>qu,prependOnceListener:()=>Du,reallyExit:()=>Zl,release:()=>$l,removeAllListeners:()=>Uu,removeListener:()=>Lu,resourceUsage:()=>tu,setSourceMapsEnabled:()=>Ru,setUncaughtExceptionCaptureCallback:()=>fu,stderr:()=>wu,stdin:()=>_u,stdout:()=>bu,title:()=>Pl,umask:()=>jl,uptime:()=>Cu,version:()=>Ul,versions:()=>Nl});function gs(t){throw new Error("Node.js process "+t+" is not supported by JSPM core outside of Node.js")}function Wg(){!xr||!Yt||(xr=!1,Yt.length?yt=Yt.concat(yt):Ui=-1,yt.length&&Rl())}function Rl(){if(!xr){var t=setTimeout(Wg,0);xr=!0;for(var e=yt.length;e;){for(Yt=yt,yt=[];++Ui<e;)Yt&&Yt[Ui].run();Ui=-1,e=yt.length}Yt=null,xr=!1,clearTimeout(t)}}function Cl(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)e[r-1]=arguments[r];yt.push(new Bl(t,e)),yt.length===1&&!xr&&setTimeout(Rl,0)}function Bl(t,e){this.fun=t,this.array=e}function me(){}function zl(t){gs("_linkedBinding")}function Yl(t){gs("dlopen")}function Jl(){return[]}function Xl(){return[]}function au(t,e){if(!t)throw new Error(e||"assertion error")}function cu(){return!1}function Cu(){return Mt.now()/1e3}function Ni(t){var e=Math.floor((Date.now()-Mt.now())*.001),r=Mt.now()*.001,i=Math.floor(r)+e,n=Math.floor(r%1*1e9);return t&&(i=i-t[0],n=n-t[1],n<0&&(i--,n+=ps)),[i,n]}function bt(){return Fu}function ju(t){return[]}var yt,xr,Yt,Ui,Pl,Ol,xl,kl,Ml,Ll,Ul,Nl,ql,Dl,jl,Fl,Wl,$l,Hl,Vl,Kl,Gl,Ql,Zl,eu,qi,tu,ru,iu,nu,su,ou,lu,uu,fu,hu,du,pu,gu,yu,bu,wu,_u,mu,vu,Eu,Su,Au,Iu,Tu,Ru,Mt,ds,ps,Bu,Pu,Ou,xu,ku,Mu,Lu,Uu,Nu,qu,Du,Fu,Wu=be(()=>{_();v();m();yt=[],xr=!1,Ui=-1;Bl.prototype.run=function(){this.fun.apply(null,this.array)};Pl="browser",Ol="x64",xl="browser",kl={PATH:"/usr/bin",LANG:navigator.language+".UTF-8",PWD:"/",HOME:"/home",TMP:"/tmp"},Ml=["/usr/bin/node"],Ll=[],Ul="v16.8.0",Nl={},ql=function(t,e){console.warn((e?e+": ":"")+t)},Dl=function(t){gs("binding")},jl=function(t){return 0},Fl=function(){return"/"},Wl=function(t){},$l={name:"node",sourceUrl:"",headersUrl:"",libUrl:""};Hl=me,Vl=[];Kl={},Gl=!1,Ql={};Zl=me,eu=me,qi=function(){return{}},tu=qi,ru=qi,iu=me,nu=me,su=me,ou={};lu={inspector:!1,debug:!1,uv:!1,ipv6:!1,tls_alpn:!1,tls_sni:!1,tls_ocsp:!1,tls:!1,cached_builtins:!0},uu=me,fu=me;hu=me,du=me,pu=me,gu=me,yu=me,bu=void 0,wu=void 0,_u=void 0,mu=me,vu=2,Eu=1,Su="/bin/usr/node",Au=9229,Iu="node",Tu=[],Ru=me,Mt={now:typeof performance<"u"?performance.now.bind(performance):void 0,timing:typeof performance<"u"?performance.timing:void 0};Mt.now===void 0&&(ds=Date.now(),Mt.timing&&Mt.timing.navigationStart&&(ds=Mt.timing.navigationStart),Mt.now=()=>Date.now()-ds);ps=1e9;Ni.bigint=function(t){var e=Ni(t);return typeof BigInt>"u"?e[0]*ps+e[1]:BigInt(e[0]*ps)+BigInt(e[1])};Bu=10,Pu={},Ou=0;xu=bt,ku=bt,Mu=bt,Lu=bt,Uu=bt,Nu=me,qu=bt,Du=bt;Fu={version:Ul,versions:Nl,arch:Ol,platform:xl,release:$l,_rawDebug:Hl,moduleLoadList:Vl,binding:Dl,_linkedBinding:zl,_events:Pu,_eventsCount:Ou,_maxListeners:Bu,on:bt,addListener:xu,once:ku,off:Mu,removeListener:Lu,removeAllListeners:Uu,emit:Nu,prependListener:qu,prependOnceListener:Du,listeners:ju,domain:Kl,_exiting:Gl,config:Ql,dlopen:Yl,uptime:Cu,_getActiveRequests:Jl,_getActiveHandles:Xl,reallyExit:Zl,_kill:eu,cpuUsage:qi,resourceUsage:tu,memoryUsage:ru,kill:iu,exit:nu,openStdin:su,allowedNodeEnvironmentFlags:ou,assert:au,features:lu,_fatalExceptions:uu,setUncaughtExceptionCaptureCallback:fu,hasUncaughtExceptionCaptureCallback:cu,emitWarning:ql,nextTick:Cl,_tickCallback:hu,_debugProcess:du,_debugEnd:pu,_startProfilerIdleNotifier:gu,_stopProfilerIdleNotifier:yu,stdout:bu,stdin:_u,stderr:wu,abort:mu,umask:jl,chdir:Wl,cwd:Fl,env:kl,title:Pl,argv:Ml,execArgv:Ll,pid:vu,ppid:Eu,execPath:Su,debugPort:Au,hrtime:Ni,argv0:Iu,_preload_modules:Tu,setSourceMapsEnabled:Ru}});var m=be(()=>{Wu()});var ve={};Qt(ve,{Buffer:()=>x,INSPECT_MAX_BYTES:()=>zg,default:()=>Lt,kMaxLength:()=>Kg});function $g(){if($u)return li;$u=!0,li.byteLength=a,li.toByteArray=c,li.fromByteArray=g;for(var t=[],e=[],r=typeof Uint8Array<"u"?Uint8Array:Array,i="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",n=0,o=i.length;n<o;++n)t[n]=i[n],e[i.charCodeAt(n)]=n;e["-".charCodeAt(0)]=62,e["_".charCodeAt(0)]=63;function s(y){var w=y.length;if(w%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var E=y.indexOf("=");E===-1&&(E=w);var S=E===w?0:4-E%4;return[E,S]}function a(y){var w=s(y),E=w[0],S=w[1];return(E+S)*3/4-S}function u(y,w,E){return(w+E)*3/4-E}function c(y){var w,E=s(y),S=E[0],I=E[1],C=new r(u(y,S,I)),R=0,U=I>0?S-4:S,N;for(N=0;N<U;N+=4)w=e[y.charCodeAt(N)]<<18|e[y.charCodeAt(N+1)]<<12|e[y.charCodeAt(N+2)]<<6|e[y.charCodeAt(N+3)],C[R++]=w>>16&255,C[R++]=w>>8&255,C[R++]=w&255;return I===2&&(w=e[y.charCodeAt(N)]<<2|e[y.charCodeAt(N+1)]>>4,C[R++]=w&255),I===1&&(w=e[y.charCodeAt(N)]<<10|e[y.charCodeAt(N+1)]<<4|e[y.charCodeAt(N+2)]>>2,C[R++]=w>>8&255,C[R++]=w&255),C}function h(y){return t[y>>18&63]+t[y>>12&63]+t[y>>6&63]+t[y&63]}function d(y,w,E){for(var S,I=[],C=w;C<E;C+=3)S=(y[C]<<16&16711680)+(y[C+1]<<8&65280)+(y[C+2]&255),I.push(h(S));return I.join("")}function g(y){for(var w,E=y.length,S=E%3,I=[],C=16383,R=0,U=E-S;R<U;R+=C)I.push(d(y,R,R+C>U?U:R+C));return S===1?(w=y[E-1],I.push(t[w>>2]+t[w<<4&63]+"==")):S===2&&(w=(y[E-2]<<8)+y[E-1],I.push(t[w>>10]+t[w>>4&63]+t[w<<2&63]+"=")),I.join("")}return li}function Hg(){if(Hu)return Di;Hu=!0;return Di.read=function(t,e,r,i,n){var o,s,a=n*8-i-1,u=(1<<a)-1,c=u>>1,h=-7,d=r?n-1:0,g=r?-1:1,y=t[e+d];for(d+=g,o=y&(1<<-h)-1,y>>=-h,h+=a;h>0;o=o*256+t[e+d],d+=g,h-=8);for(s=o&(1<<-h)-1,o>>=-h,h+=i;h>0;s=s*256+t[e+d],d+=g,h-=8);if(o===0)o=1-c;else{if(o===u)return s?NaN:(y?-1:1)*(1/0);s=s+Math.pow(2,i),o=o-c}return(y?-1:1)*s*Math.pow(2,o-i)},Di.write=function(t,e,r,i,n,o){var s,a,u,c=o*8-n-1,h=(1<<c)-1,d=h>>1,g=n===23?Math.pow(2,-24)-Math.pow(2,-77):0,y=i?0:o-1,w=i?1:-1,E=e<0||e===0&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(a=isNaN(e)?1:0,s=h):(s=Math.floor(Math.log(e)/Math.LN2),e*(u=Math.pow(2,-s))<1&&(s--,u*=2),s+d>=1?e+=g/u:e+=g*Math.pow(2,1-d),e*u>=2&&(s++,u/=2),s+d>=h?(a=0,s=h):s+d>=1?(a=(e*u-1)*Math.pow(2,n),s=s+d):(a=e*Math.pow(2,d-1)*Math.pow(2,n),s=0));n>=8;t[r+y]=a&255,y+=w,a/=256,n-=8);for(s=s<<n|a,c+=n;c>0;t[r+y]=s&255,y+=w,s/=256,c-=8);t[r+y-w]|=E*128},Di}function Vg(){if(Vu)return Jt;Vu=!0;let t=$g(),e=Hg(),r=typeof Symbol=="function"&&typeof Symbol.for=="function"?Symbol.for("nodejs.util.inspect.custom"):null;Jt.Buffer=s,Jt.SlowBuffer=I,Jt.INSPECT_MAX_BYTES=50;let i=2147483647;Jt.kMaxLength=i,s.TYPED_ARRAY_SUPPORT=n(),!s.TYPED_ARRAY_SUPPORT&&typeof console<"u"&&typeof console.error=="function"&&console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support.");function n(){try{let p=new Uint8Array(1),l={foo:function(){return 42}};return Object.setPrototypeOf(l,Uint8Array.prototype),Object.setPrototypeOf(p,l),p.foo()===42}catch{return!1}}Object.defineProperty(s.prototype,"parent",{enumerable:!0,get:function(){if(s.isBuffer(this))return this.buffer}}),Object.defineProperty(s.prototype,"offset",{enumerable:!0,get:function(){if(s.isBuffer(this))return this.byteOffset}});function o(p){if(p>i)throw new RangeError('The value "'+p+'" is invalid for option "size"');let l=new Uint8Array(p);return Object.setPrototypeOf(l,s.prototype),l}function s(p,l,f){if(typeof p=="number"){if(typeof l=="string")throw new TypeError('The "string" argument must be of type string. Received type number');return h(p)}return a(p,l,f)}s.poolSize=8192;function a(p,l,f){if(typeof p=="string")return d(p,l);if(ArrayBuffer.isView(p))return y(p);if(p==null)throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof p);if(Ye(p,ArrayBuffer)||p&&Ye(p.buffer,ArrayBuffer)||typeof SharedArrayBuffer<"u"&&(Ye(p,SharedArrayBuffer)||p&&Ye(p.buffer,SharedArrayBuffer)))return w(p,l,f);if(typeof p=="number")throw new TypeError('The "value" argument must not be of type number. Received type number');let b=p.valueOf&&p.valueOf();if(b!=null&&b!==p)return s.from(b,l,f);let A=E(p);if(A)return A;if(typeof Symbol<"u"&&Symbol.toPrimitive!=null&&typeof p[Symbol.toPrimitive]=="function")return s.from(p[Symbol.toPrimitive]("string"),l,f);throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof p)}s.from=function(p,l,f){return a(p,l,f)},Object.setPrototypeOf(s.prototype,Uint8Array.prototype),Object.setPrototypeOf(s,Uint8Array);function u(p){if(typeof p!="number")throw new TypeError('"size" argument must be of type number');if(p<0)throw new RangeError('The value "'+p+'" is invalid for option "size"')}function c(p,l,f){return u(p),p<=0?o(p):l!==void 0?typeof f=="string"?o(p).fill(l,f):o(p).fill(l):o(p)}s.alloc=function(p,l,f){return c(p,l,f)};function h(p){return u(p),o(p<0?0:S(p)|0)}s.allocUnsafe=function(p){return h(p)},s.allocUnsafeSlow=function(p){return h(p)};function d(p,l){if((typeof l!="string"||l==="")&&(l="utf8"),!s.isEncoding(l))throw new TypeError("Unknown encoding: "+l);let f=C(p,l)|0,b=o(f),A=b.write(p,l);return A!==f&&(b=b.slice(0,A)),b}function g(p){let l=p.length<0?0:S(p.length)|0,f=o(l);for(let b=0;b<l;b+=1)f[b]=p[b]&255;return f}function y(p){if(Ye(p,Uint8Array)){let l=new Uint8Array(p);return w(l.buffer,l.byteOffset,l.byteLength)}return g(p)}function w(p,l,f){if(l<0||p.byteLength<l)throw new RangeError('"offset" is outside of buffer bounds');if(p.byteLength<l+(f||0))throw new RangeError('"length" is outside of buffer bounds');let b;return l===void 0&&f===void 0?b=new Uint8Array(p):f===void 0?b=new Uint8Array(p,l):b=new Uint8Array(p,l,f),Object.setPrototypeOf(b,s.prototype),b}function E(p){if(s.isBuffer(p)){let l=S(p.length)|0,f=o(l);return f.length===0||p.copy(f,0,0,l),f}if(p.length!==void 0)return typeof p.length!="number"||cs(p.length)?o(0):g(p);if(p.type==="Buffer"&&Array.isArray(p.data))return g(p.data)}function S(p){if(p>=i)throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+i.toString(16)+" bytes");return p|0}function I(p){return+p!=p&&(p=0),s.alloc(+p)}s.isBuffer=function(l){return l!=null&&l._isBuffer===!0&&l!==s.prototype},s.compare=function(l,f){if(Ye(l,Uint8Array)&&(l=s.from(l,l.offset,l.byteLength)),Ye(f,Uint8Array)&&(f=s.from(f,f.offset,f.byteLength)),!s.isBuffer(l)||!s.isBuffer(f))throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');if(l===f)return 0;let b=l.length,A=f.length;for(let T=0,P=Math.min(b,A);T<P;++T)if(l[T]!==f[T]){b=l[T],A=f[T];break}return b<A?-1:A<b?1:0},s.isEncoding=function(l){switch(String(l).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},s.concat=function(l,f){if(!Array.isArray(l))throw new TypeError('"list" argument must be an Array of Buffers');if(l.length===0)return s.alloc(0);let b;if(f===void 0)for(f=0,b=0;b<l.length;++b)f+=l[b].length;let A=s.allocUnsafe(f),T=0;for(b=0;b<l.length;++b){let P=l[b];if(Ye(P,Uint8Array))T+P.length>A.length?(s.isBuffer(P)||(P=s.from(P)),P.copy(A,T)):Uint8Array.prototype.set.call(A,P,T);else if(s.isBuffer(P))P.copy(A,T);else throw new TypeError('"list" argument must be an Array of Buffers');T+=P.length}return A};function C(p,l){if(s.isBuffer(p))return p.length;if(ArrayBuffer.isView(p)||Ye(p,ArrayBuffer))return p.byteLength;if(typeof p!="string")throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+typeof p);let f=p.length,b=arguments.length>2&&arguments[2]===!0;if(!b&&f===0)return 0;let A=!1;for(;;)switch(l){case"ascii":case"latin1":case"binary":return f;case"utf8":case"utf-8":return fs(p).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return f*2;case"hex":return f>>>1;case"base64":return Tl(p).length;default:if(A)return b?-1:fs(p).length;l=(""+l).toLowerCase(),A=!0}}s.byteLength=C;function R(p,l,f){let b=!1;if((l===void 0||l<0)&&(l=0),l>this.length||((f===void 0||f>this.length)&&(f=this.length),f<=0)||(f>>>=0,l>>>=0,f<=l))return"";for(p||(p="utf8");;)switch(p){case"hex":return Bg(this,l,f);case"utf8":case"utf-8":return Rr(this,l,f);case"ascii":return ls(this,l,f);case"latin1":case"binary":return Cg(this,l,f);case"base64":return pe(this,l,f);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return Pg(this,l,f);default:if(b)throw new TypeError("Unknown encoding: "+p);p=(p+"").toLowerCase(),b=!0}}s.prototype._isBuffer=!0;function U(p,l,f){let b=p[l];p[l]=p[f],p[f]=b}s.prototype.swap16=function(){let l=this.length;if(l%2!==0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(let f=0;f<l;f+=2)U(this,f,f+1);return this},s.prototype.swap32=function(){let l=this.length;if(l%4!==0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(let f=0;f<l;f+=4)U(this,f,f+3),U(this,f+1,f+2);return this},s.prototype.swap64=function(){let l=this.length;if(l%8!==0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(let f=0;f<l;f+=8)U(this,f,f+7),U(this,f+1,f+6),U(this,f+2,f+5),U(this,f+3,f+4);return this},s.prototype.toString=function(){let l=this.length;return l===0?"":arguments.length===0?Rr(this,0,l):R.apply(this,arguments)},s.prototype.toLocaleString=s.prototype.toString,s.prototype.equals=function(l){if(!s.isBuffer(l))throw new TypeError("Argument must be a Buffer");return this===l?!0:s.compare(this,l)===0},s.prototype.inspect=function(){let l="",f=Jt.INSPECT_MAX_BYTES;return l=this.toString("hex",0,f).replace(/(.{2})/g,"$1 ").trim(),this.length>f&&(l+=" ... "),"<Buffer "+l+">"},r&&(s.prototype[r]=s.prototype.inspect),s.prototype.compare=function(l,f,b,A,T){if(Ye(l,Uint8Array)&&(l=s.from(l,l.offset,l.byteLength)),!s.isBuffer(l))throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type '+typeof l);if(f===void 0&&(f=0),b===void 0&&(b=l?l.length:0),A===void 0&&(A=0),T===void 0&&(T=this.length),f<0||b>l.length||A<0||T>this.length)throw new RangeError("out of range index");if(A>=T&&f>=b)return 0;if(A>=T)return-1;if(f>=b)return 1;if(f>>>=0,b>>>=0,A>>>=0,T>>>=0,this===l)return 0;let P=T-A,$=b-f,se=Math.min(P,$),te=this.slice(A,T),oe=l.slice(f,b);for(let J=0;J<se;++J)if(te[J]!==oe[J]){P=te[J],$=oe[J];break}return P<$?-1:$<P?1:0};function N(p,l,f,b,A){if(p.length===0)return-1;if(typeof f=="string"?(b=f,f=0):f>2147483647?f=2147483647:f<-2147483648&&(f=-2147483648),f=+f,cs(f)&&(f=A?0:p.length-1),f<0&&(f=p.length+f),f>=p.length){if(A)return-1;f=p.length-1}else if(f<0)if(A)f=0;else return-1;if(typeof l=="string"&&(l=s.from(l,b)),s.isBuffer(l))return l.length===0?-1:W(p,l,f,b,A);if(typeof l=="number")return l=l&255,typeof Uint8Array.prototype.indexOf=="function"?A?Uint8Array.prototype.indexOf.call(p,l,f):Uint8Array.prototype.lastIndexOf.call(p,l,f):W(p,[l],f,b,A);throw new TypeError("val must be string, number or Buffer")}function W(p,l,f,b,A){let T=1,P=p.length,$=l.length;if(b!==void 0&&(b=String(b).toLowerCase(),b==="ucs2"||b==="ucs-2"||b==="utf16le"||b==="utf-16le")){if(p.length<2||l.length<2)return-1;T=2,P/=2,$/=2,f/=2}function se(oe,J){return T===1?oe[J]:oe.readUInt16BE(J*T)}let te;if(A){let oe=-1;for(te=f;te<P;te++)if(se(p,te)===se(l,oe===-1?0:te-oe)){if(oe===-1&&(oe=te),te-oe+1===$)return oe*T}else oe!==-1&&(te-=te-oe),oe=-1}else for(f+$>P&&(f=P-$),te=f;te>=0;te--){let oe=!0;for(let J=0;J<$;J++)if(se(p,te+J)!==se(l,J)){oe=!1;break}if(oe)return te}return-1}s.prototype.includes=function(l,f,b){return this.indexOf(l,f,b)!==-1},s.prototype.indexOf=function(l,f,b){return N(this,l,f,b,!0)},s.prototype.lastIndexOf=function(l,f,b){return N(this,l,f,b,!1)};function K(p,l,f,b){f=Number(f)||0;let A=p.length-f;b?(b=Number(b),b>A&&(b=A)):b=A;let T=l.length;b>T/2&&(b=T/2);let P;for(P=0;P<b;++P){let $=parseInt(l.substr(P*2,2),16);if(cs($))return P;p[f+P]=$}return P}function z(p,l,f,b){return Li(fs(l,p.length-f),p,f,b)}function G(p,l,f,b){return Li(Mg(l),p,f,b)}function de(p,l,f,b){return Li(Tl(l),p,f,b)}function Gt(p,l,f,b){return Li(Lg(l,p.length-f),p,f,b)}s.prototype.write=function(l,f,b,A){if(f===void 0)A="utf8",b=this.length,f=0;else if(b===void 0&&typeof f=="string")A=f,b=this.length,f=0;else if(isFinite(f))f=f>>>0,isFinite(b)?(b=b>>>0,A===void 0&&(A="utf8")):(A=b,b=void 0);else throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");let T=this.length-f;if((b===void 0||b>T)&&(b=T),l.length>0&&(b<0||f<0)||f>this.length)throw new RangeError("Attempt to write outside buffer bounds");A||(A="utf8");let P=!1;for(;;)switch(A){case"hex":return K(this,l,f,b);case"utf8":case"utf-8":return z(this,l,f,b);case"ascii":case"latin1":case"binary":return G(this,l,f,b);case"base64":return de(this,l,f,b);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return Gt(this,l,f,b);default:if(P)throw new TypeError("Unknown encoding: "+A);A=(""+A).toLowerCase(),P=!0}},s.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};function pe(p,l,f){return l===0&&f===p.length?t.fromByteArray(p):t.fromByteArray(p.slice(l,f))}function Rr(p,l,f){f=Math.min(p.length,f);let b=[],A=l;for(;A<f;){let T=p[A],P=null,$=T>239?4:T>223?3:T>191?2:1;if(A+$<=f){let se,te,oe,J;switch($){case 1:T<128&&(P=T);break;case 2:se=p[A+1],(se&192)===128&&(J=(T&31)<<6|se&63,J>127&&(P=J));break;case 3:se=p[A+1],te=p[A+2],(se&192)===128&&(te&192)===128&&(J=(T&15)<<12|(se&63)<<6|te&63,J>2047&&(J<55296||J>57343)&&(P=J));break;case 4:se=p[A+1],te=p[A+2],oe=p[A+3],(se&192)===128&&(te&192)===128&&(oe&192)===128&&(J=(T&15)<<18|(se&63)<<12|(te&63)<<6|oe&63,J>65535&&J<1114112&&(P=J))}}P===null?(P=65533,$=1):P>65535&&(P-=65536,b.push(P>>>10&1023|55296),P=56320|P&1023),b.push(P),A+=$}return Br(b)}let Cr=4096;function Br(p){let l=p.length;if(l<=Cr)return String.fromCharCode.apply(String,p);let f="",b=0;for(;b<l;)f+=String.fromCharCode.apply(String,p.slice(b,b+=Cr));return f}function ls(p,l,f){let b="";f=Math.min(p.length,f);for(let A=l;A<f;++A)b+=String.fromCharCode(p[A]&127);return b}function Cg(p,l,f){let b="";f=Math.min(p.length,f);for(let A=l;A<f;++A)b+=String.fromCharCode(p[A]);return b}function Bg(p,l,f){let b=p.length;(!l||l<0)&&(l=0),(!f||f<0||f>b)&&(f=b);let A="";for(let T=l;T<f;++T)A+=Ug[p[T]];return A}function Pg(p,l,f){let b=p.slice(l,f),A="";for(let T=0;T<b.length-1;T+=2)A+=String.fromCharCode(b[T]+b[T+1]*256);return A}s.prototype.slice=function(l,f){let b=this.length;l=~~l,f=f===void 0?b:~~f,l<0?(l+=b,l<0&&(l=0)):l>b&&(l=b),f<0?(f+=b,f<0&&(f=0)):f>b&&(f=b),f<l&&(f=l);let A=this.subarray(l,f);return Object.setPrototypeOf(A,s.prototype),A};function ge(p,l,f){if(p%1!==0||p<0)throw new RangeError("offset is not uint");if(p+l>f)throw new RangeError("Trying to access beyond buffer length")}s.prototype.readUintLE=s.prototype.readUIntLE=function(l,f,b){l=l>>>0,f=f>>>0,b||ge(l,f,this.length);let A=this[l],T=1,P=0;for(;++P<f&&(T*=256);)A+=this[l+P]*T;return A},s.prototype.readUintBE=s.prototype.readUIntBE=function(l,f,b){l=l>>>0,f=f>>>0,b||ge(l,f,this.length);let A=this[l+--f],T=1;for(;f>0&&(T*=256);)A+=this[l+--f]*T;return A},s.prototype.readUint8=s.prototype.readUInt8=function(l,f){return l=l>>>0,f||ge(l,1,this.length),this[l]},s.prototype.readUint16LE=s.prototype.readUInt16LE=function(l,f){return l=l>>>0,f||ge(l,2,this.length),this[l]|this[l+1]<<8},s.prototype.readUint16BE=s.prototype.readUInt16BE=function(l,f){return l=l>>>0,f||ge(l,2,this.length),this[l]<<8|this[l+1]},s.prototype.readUint32LE=s.prototype.readUInt32LE=function(l,f){return l=l>>>0,f||ge(l,4,this.length),(this[l]|this[l+1]<<8|this[l+2]<<16)+this[l+3]*16777216},s.prototype.readUint32BE=s.prototype.readUInt32BE=function(l,f){return l=l>>>0,f||ge(l,4,this.length),this[l]*16777216+(this[l+1]<<16|this[l+2]<<8|this[l+3])},s.prototype.readBigUInt64LE=kt(function(l){l=l>>>0,Or(l,"offset");let f=this[l],b=this[l+7];(f===void 0||b===void 0)&&ai(l,this.length-8);let A=f+this[++l]*2**8+this[++l]*2**16+this[++l]*2**24,T=this[++l]+this[++l]*2**8+this[++l]*2**16+b*2**24;return BigInt(A)+(BigInt(T)<<BigInt(32))}),s.prototype.readBigUInt64BE=kt(function(l){l=l>>>0,Or(l,"offset");let f=this[l],b=this[l+7];(f===void 0||b===void 0)&&ai(l,this.length-8);let A=f*2**24+this[++l]*2**16+this[++l]*2**8+this[++l],T=this[++l]*2**24+this[++l]*2**16+this[++l]*2**8+b;return(BigInt(A)<<BigInt(32))+BigInt(T)}),s.prototype.readIntLE=function(l,f,b){l=l>>>0,f=f>>>0,b||ge(l,f,this.length);let A=this[l],T=1,P=0;for(;++P<f&&(T*=256);)A+=this[l+P]*T;return T*=128,A>=T&&(A-=Math.pow(2,8*f)),A},s.prototype.readIntBE=function(l,f,b){l=l>>>0,f=f>>>0,b||ge(l,f,this.length);let A=f,T=1,P=this[l+--A];for(;A>0&&(T*=256);)P+=this[l+--A]*T;return T*=128,P>=T&&(P-=Math.pow(2,8*f)),P},s.prototype.readInt8=function(l,f){return l=l>>>0,f||ge(l,1,this.length),this[l]&128?(255-this[l]+1)*-1:this[l]},s.prototype.readInt16LE=function(l,f){l=l>>>0,f||ge(l,2,this.length);let b=this[l]|this[l+1]<<8;return b&32768?b|4294901760:b},s.prototype.readInt16BE=function(l,f){l=l>>>0,f||ge(l,2,this.length);let b=this[l+1]|this[l]<<8;return b&32768?b|4294901760:b},s.prototype.readInt32LE=function(l,f){return l=l>>>0,f||ge(l,4,this.length),this[l]|this[l+1]<<8|this[l+2]<<16|this[l+3]<<24},s.prototype.readInt32BE=function(l,f){return l=l>>>0,f||ge(l,4,this.length),this[l]<<24|this[l+1]<<16|this[l+2]<<8|this[l+3]},s.prototype.readBigInt64LE=kt(function(l){l=l>>>0,Or(l,"offset");let f=this[l],b=this[l+7];(f===void 0||b===void 0)&&ai(l,this.length-8);let A=this[l+4]+this[l+5]*2**8+this[l+6]*2**16+(b<<24);return(BigInt(A)<<BigInt(32))+BigInt(f+this[++l]*2**8+this[++l]*2**16+this[++l]*2**24)}),s.prototype.readBigInt64BE=kt(function(l){l=l>>>0,Or(l,"offset");let f=this[l],b=this[l+7];(f===void 0||b===void 0)&&ai(l,this.length-8);let A=(f<<24)+this[++l]*2**16+this[++l]*2**8+this[++l];return(BigInt(A)<<BigInt(32))+BigInt(this[++l]*2**24+this[++l]*2**16+this[++l]*2**8+b)}),s.prototype.readFloatLE=function(l,f){return l=l>>>0,f||ge(l,4,this.length),e.read(this,l,!0,23,4)},s.prototype.readFloatBE=function(l,f){return l=l>>>0,f||ge(l,4,this.length),e.read(this,l,!1,23,4)},s.prototype.readDoubleLE=function(l,f){return l=l>>>0,f||ge(l,8,this.length),e.read(this,l,!0,52,8)},s.prototype.readDoubleBE=function(l,f){return l=l>>>0,f||ge(l,8,this.length),e.read(this,l,!1,52,8)};function Ce(p,l,f,b,A,T){if(!s.isBuffer(p))throw new TypeError('"buffer" argument must be a Buffer instance');if(l>A||l<T)throw new RangeError('"value" argument is out of bounds');if(f+b>p.length)throw new RangeError("Index out of range")}s.prototype.writeUintLE=s.prototype.writeUIntLE=function(l,f,b,A){if(l=+l,f=f>>>0,b=b>>>0,!A){let $=Math.pow(2,8*b)-1;Ce(this,l,f,b,$,0)}let T=1,P=0;for(this[f]=l&255;++P<b&&(T*=256);)this[f+P]=l/T&255;return f+b},s.prototype.writeUintBE=s.prototype.writeUIntBE=function(l,f,b,A){if(l=+l,f=f>>>0,b=b>>>0,!A){let $=Math.pow(2,8*b)-1;Ce(this,l,f,b,$,0)}let T=b-1,P=1;for(this[f+T]=l&255;--T>=0&&(P*=256);)this[f+T]=l/P&255;return f+b},s.prototype.writeUint8=s.prototype.writeUInt8=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,1,255,0),this[f]=l&255,f+1},s.prototype.writeUint16LE=s.prototype.writeUInt16LE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,2,65535,0),this[f]=l&255,this[f+1]=l>>>8,f+2},s.prototype.writeUint16BE=s.prototype.writeUInt16BE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,2,65535,0),this[f]=l>>>8,this[f+1]=l&255,f+2},s.prototype.writeUint32LE=s.prototype.writeUInt32LE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,4,4294967295,0),this[f+3]=l>>>24,this[f+2]=l>>>16,this[f+1]=l>>>8,this[f]=l&255,f+4},s.prototype.writeUint32BE=s.prototype.writeUInt32BE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,4,4294967295,0),this[f]=l>>>24,this[f+1]=l>>>16,this[f+2]=l>>>8,this[f+3]=l&255,f+4};function _l(p,l,f,b,A){Il(l,b,A,p,f,7);let T=Number(l&BigInt(4294967295));p[f++]=T,T=T>>8,p[f++]=T,T=T>>8,p[f++]=T,T=T>>8,p[f++]=T;let P=Number(l>>BigInt(32)&BigInt(4294967295));return p[f++]=P,P=P>>8,p[f++]=P,P=P>>8,p[f++]=P,P=P>>8,p[f++]=P,f}function ml(p,l,f,b,A){Il(l,b,A,p,f,7);let T=Number(l&BigInt(4294967295));p[f+7]=T,T=T>>8,p[f+6]=T,T=T>>8,p[f+5]=T,T=T>>8,p[f+4]=T;let P=Number(l>>BigInt(32)&BigInt(4294967295));return p[f+3]=P,P=P>>8,p[f+2]=P,P=P>>8,p[f+1]=P,P=P>>8,p[f]=P,f+8}s.prototype.writeBigUInt64LE=kt(function(l,f=0){return _l(this,l,f,BigInt(0),BigInt("0xffffffffffffffff"))}),s.prototype.writeBigUInt64BE=kt(function(l,f=0){return ml(this,l,f,BigInt(0),BigInt("0xffffffffffffffff"))}),s.prototype.writeIntLE=function(l,f,b,A){if(l=+l,f=f>>>0,!A){let se=Math.pow(2,8*b-1);Ce(this,l,f,b,se-1,-se)}let T=0,P=1,$=0;for(this[f]=l&255;++T<b&&(P*=256);)l<0&&$===0&&this[f+T-1]!==0&&($=1),this[f+T]=(l/P>>0)-$&255;return f+b},s.prototype.writeIntBE=function(l,f,b,A){if(l=+l,f=f>>>0,!A){let se=Math.pow(2,8*b-1);Ce(this,l,f,b,se-1,-se)}let T=b-1,P=1,$=0;for(this[f+T]=l&255;--T>=0&&(P*=256);)l<0&&$===0&&this[f+T+1]!==0&&($=1),this[f+T]=(l/P>>0)-$&255;return f+b},s.prototype.writeInt8=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,1,127,-128),l<0&&(l=255+l+1),this[f]=l&255,f+1},s.prototype.writeInt16LE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,2,32767,-32768),this[f]=l&255,this[f+1]=l>>>8,f+2},s.prototype.writeInt16BE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,2,32767,-32768),this[f]=l>>>8,this[f+1]=l&255,f+2},s.prototype.writeInt32LE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,4,2147483647,-2147483648),this[f]=l&255,this[f+1]=l>>>8,this[f+2]=l>>>16,this[f+3]=l>>>24,f+4},s.prototype.writeInt32BE=function(l,f,b){return l=+l,f=f>>>0,b||Ce(this,l,f,4,2147483647,-2147483648),l<0&&(l=4294967295+l+1),this[f]=l>>>24,this[f+1]=l>>>16,this[f+2]=l>>>8,this[f+3]=l&255,f+4},s.prototype.writeBigInt64LE=kt(function(l,f=0){return _l(this,l,f,-BigInt("0x8000000000000000"),BigInt("0x7fffffffffffffff"))}),s.prototype.writeBigInt64BE=kt(function(l,f=0){return ml(this,l,f,-BigInt("0x8000000000000000"),BigInt("0x7fffffffffffffff"))});function vl(p,l,f,b,A,T){if(f+b>p.length)throw new RangeError("Index out of range");if(f<0)throw new RangeError("Index out of range")}function El(p,l,f,b,A){return l=+l,f=f>>>0,A||vl(p,l,f,4),e.write(p,l,f,b,23,4),f+4}s.prototype.writeFloatLE=function(l,f,b){return El(this,l,f,!0,b)},s.prototype.writeFloatBE=function(l,f,b){return El(this,l,f,!1,b)};function Sl(p,l,f,b,A){return l=+l,f=f>>>0,A||vl(p,l,f,8),e.write(p,l,f,b,52,8),f+8}s.prototype.writeDoubleLE=function(l,f,b){return Sl(this,l,f,!0,b)},s.prototype.writeDoubleBE=function(l,f,b){return Sl(this,l,f,!1,b)},s.prototype.copy=function(l,f,b,A){if(!s.isBuffer(l))throw new TypeError("argument should be a Buffer");if(b||(b=0),!A&&A!==0&&(A=this.length),f>=l.length&&(f=l.length),f||(f=0),A>0&&A<b&&(A=b),A===b||l.length===0||this.length===0)return 0;if(f<0)throw new RangeError("targetStart out of bounds");if(b<0||b>=this.length)throw new RangeError("Index out of range");if(A<0)throw new RangeError("sourceEnd out of bounds");A>this.length&&(A=this.length),l.length-f<A-b&&(A=l.length-f+b);let T=A-b;return this===l&&typeof Uint8Array.prototype.copyWithin=="function"?this.copyWithin(f,b,A):Uint8Array.prototype.set.call(l,this.subarray(b,A),f),T},s.prototype.fill=function(l,f,b,A){if(typeof l=="string"){if(typeof f=="string"?(A=f,f=0,b=this.length):typeof b=="string"&&(A=b,b=this.length),A!==void 0&&typeof A!="string")throw new TypeError("encoding must be a string");if(typeof A=="string"&&!s.isEncoding(A))throw new TypeError("Unknown encoding: "+A);if(l.length===1){let P=l.charCodeAt(0);(A==="utf8"&&P<128||A==="latin1")&&(l=P)}}else typeof l=="number"?l=l&255:typeof l=="boolean"&&(l=Number(l));if(f<0||this.length<f||this.length<b)throw new RangeError("Out of range index");if(b<=f)return this;f=f>>>0,b=b===void 0?this.length:b>>>0,l||(l=0);let T;if(typeof l=="number")for(T=f;T<b;++T)this[T]=l;else{let P=s.isBuffer(l)?l:s.from(l,A),$=P.length;if($===0)throw new TypeError('The value "'+l+'" is invalid for argument "value"');for(T=0;T<b-f;++T)this[T+f]=P[T%$]}return this};let Pr={};function us(p,l,f){Pr[p]=class extends f{constructor(){super(),Object.defineProperty(this,"message",{value:l.apply(this,arguments),writable:!0,configurable:!0}),this.name=`${this.name} [${p}]`,this.stack,delete this.name}get code(){return p}set code(A){Object.defineProperty(this,"code",{configurable:!0,enumerable:!0,value:A,writable:!0})}toString(){return`${this.name} [${p}]: ${this.message}`}}}us("ERR_BUFFER_OUT_OF_BOUNDS",function(p){return p?`${p} is outside of buffer bounds`:"Attempt to access memory outside buffer bounds"},RangeError),us("ERR_INVALID_ARG_TYPE",function(p,l){return`The "${p}" argument must be of type number. Received type ${typeof l}`},TypeError),us("ERR_OUT_OF_RANGE",function(p,l,f){let b=`The value of "${p}" is out of range.`,A=f;return Number.isInteger(f)&&Math.abs(f)>2**32?A=Al(String(f)):typeof f=="bigint"&&(A=String(f),(f>BigInt(2)**BigInt(32)||f<-(BigInt(2)**BigInt(32)))&&(A=Al(A)),A+="n"),b+=` It must be ${l}. Received ${A}`,b},RangeError);function Al(p){let l="",f=p.length,b=p[0]==="-"?1:0;for(;f>=b+4;f-=3)l=`_${p.slice(f-3,f)}${l}`;return`${p.slice(0,f)}${l}`}function Og(p,l,f){Or(l,"offset"),(p[l]===void 0||p[l+f]===void 0)&&ai(l,p.length-(f+1))}function Il(p,l,f,b,A,T){if(p>f||p<l){let P=typeof l=="bigint"?"n":"",$;throw T>3?l===0||l===BigInt(0)?$=`>= 0${P} and < 2${P} ** ${(T+1)*8}${P}`:$=`>= -(2${P} ** ${(T+1)*8-1}${P}) and < 2 ** ${(T+1)*8-1}${P}`:$=`>= ${l}${P} and <= ${f}${P}`,new Pr.ERR_OUT_OF_RANGE("value",$,p)}Og(b,A,T)}function Or(p,l){if(typeof p!="number")throw new Pr.ERR_INVALID_ARG_TYPE(l,"number",p)}function ai(p,l,f){throw Math.floor(p)!==p?(Or(p,f),new Pr.ERR_OUT_OF_RANGE(f||"offset","an integer",p)):l<0?new Pr.ERR_BUFFER_OUT_OF_BOUNDS:new Pr.ERR_OUT_OF_RANGE(f||"offset",`>= ${f?1:0} and <= ${l}`,p)}let xg=/[^+/0-9A-Za-z-_]/g;function kg(p){if(p=p.split("=")[0],p=p.trim().replace(xg,""),p.length<2)return"";for(;p.length%4!==0;)p=p+"=";return p}function fs(p,l){l=l||1/0;let f,b=p.length,A=null,T=[];for(let P=0;P<b;++P){if(f=p.charCodeAt(P),f>55295&&f<57344){if(!A){if(f>56319){(l-=3)>-1&&T.push(239,191,189);continue}else if(P+1===b){(l-=3)>-1&&T.push(239,191,189);continue}A=f;continue}if(f<56320){(l-=3)>-1&&T.push(239,191,189),A=f;continue}f=(A-55296<<10|f-56320)+65536}else A&&(l-=3)>-1&&T.push(239,191,189);if(A=null,f<128){if((l-=1)<0)break;T.push(f)}else if(f<2048){if((l-=2)<0)break;T.push(f>>6|192,f&63|128)}else if(f<65536){if((l-=3)<0)break;T.push(f>>12|224,f>>6&63|128,f&63|128)}else if(f<1114112){if((l-=4)<0)break;T.push(f>>18|240,f>>12&63|128,f>>6&63|128,f&63|128)}else throw new Error("Invalid code point")}return T}function Mg(p){let l=[];for(let f=0;f<p.length;++f)l.push(p.charCodeAt(f)&255);return l}function Lg(p,l){let f,b,A,T=[];for(let P=0;P<p.length&&!((l-=2)<0);++P)f=p.charCodeAt(P),b=f>>8,A=f%256,T.push(A),T.push(b);return T}function Tl(p){return t.toByteArray(kg(p))}function Li(p,l,f,b){let A;for(A=0;A<b&&!(A+f>=l.length||A>=p.length);++A)l[A+f]=p[A];return A}function Ye(p,l){return p instanceof l||p!=null&&p.constructor!=null&&p.constructor.name!=null&&p.constructor.name===l.name}function cs(p){return p!==p}let Ug=function(){let p="0123456789abcdef",l=new Array(256);for(let f=0;f<16;++f){let b=f*16;for(let A=0;A<16;++A)l[b+A]=p[f]+p[A]}return l}();function kt(p){return typeof BigInt>"u"?Ng:p}function Ng(){throw new Error("BigInt not supported")}return Jt}var li,$u,Di,Hu,Jt,Vu,Lt,x,zg,Kg,we=be(()=>{_();v();m();li={},$u=!1;Di={},Hu=!1;Jt={},Vu=!1;Lt=Vg();Lt.Buffer;Lt.SlowBuffer;Lt.INSPECT_MAX_BYTES;Lt.kMaxLength;x=Lt.Buffer,zg=Lt.INSPECT_MAX_BYTES,Kg=Lt.kMaxLength});var v=be(()=>{we()});var zu=M(bs=>{"use strict";_();v();m();Object.defineProperty(bs,"__esModule",{value:!0});var ys=class{constructor(e){this.aliasToTopic={},this.max=e}put(e,r){return r===0||r>this.max?!1:(this.aliasToTopic[r]=e,this.length=Object.keys(this.aliasToTopic).length,!0)}getTopicByAlias(e){return this.aliasToTopic[e]}clear(){this.aliasToTopic={}}};bs.default=ys});var ce=M((cA,Ku)=>{"use strict";_();v();m();Ku.exports={ArrayIsArray(t){return Array.isArray(t)},ArrayPrototypeIncludes(t,e){return t.includes(e)},ArrayPrototypeIndexOf(t,e){return t.indexOf(e)},ArrayPrototypeJoin(t,e){return t.join(e)},ArrayPrototypeMap(t,e){return t.map(e)},ArrayPrototypePop(t,e){return t.pop(e)},ArrayPrototypePush(t,e){return t.push(e)},ArrayPrototypeSlice(t,e,r){return t.slice(e,r)},Error,FunctionPrototypeCall(t,e,...r){return t.call(e,...r)},FunctionPrototypeSymbolHasInstance(t,e){return Function.prototype[Symbol.hasInstance].call(t,e)},MathFloor:Math.floor,Number,NumberIsInteger:Number.isInteger,NumberIsNaN:Number.isNaN,NumberMAX_SAFE_INTEGER:Number.MAX_SAFE_INTEGER,NumberMIN_SAFE_INTEGER:Number.MIN_SAFE_INTEGER,NumberParseInt:Number.parseInt,ObjectDefineProperties(t,e){return Object.defineProperties(t,e)},ObjectDefineProperty(t,e,r){return Object.defineProperty(t,e,r)},ObjectGetOwnPropertyDescriptor(t,e){return Object.getOwnPropertyDescriptor(t,e)},ObjectKeys(t){return Object.keys(t)},ObjectSetPrototypeOf(t,e){return Object.setPrototypeOf(t,e)},Promise,PromisePrototypeCatch(t,e){return t.catch(e)},PromisePrototypeThen(t,e,r){return t.then(e,r)},PromiseReject(t){return Promise.reject(t)},ReflectApply:Reflect.apply,RegExpPrototypeTest(t,e){return t.test(e)},SafeSet:Set,String,StringPrototypeSlice(t,e,r){return t.slice(e,r)},StringPrototypeToLowerCase(t){return t.toLowerCase()},StringPrototypeToUpperCase(t){return t.toUpperCase()},StringPrototypeTrim(t){return t.trim()},Symbol,SymbolFor:Symbol.for,SymbolAsyncIterator:Symbol.asyncIterator,SymbolHasInstance:Symbol.hasInstance,SymbolIterator:Symbol.iterator,TypedArrayPrototypeSet(t,e,r){return t.set(e,r)},Uint8Array}});var Je=M((wA,_s)=>{"use strict";_();v();m();var Gg=(we(),Z(ve)),Qg=Object.getPrototypeOf(async function(){}).constructor,Gu=globalThis.Blob||Gg.Blob,Yg=typeof Gu<"u"?function(e){return e instanceof Gu}:function(e){return!1},ws=class extends Error{constructor(e){if(!Array.isArray(e))throw new TypeError(`Expected input to be an Array, got ${typeof e}`);let r="";for(let i=0;i<e.length;i++)r+=`    ${e[i].stack}
`;super(r),this.name="AggregateError",this.errors=e}};_s.exports={AggregateError:ws,kEmptyObject:Object.freeze({}),once(t){let e=!1;return function(...r){e||(e=!0,t.apply(this,r))}},createDeferredPromise:function(){let t,e;return{promise:new Promise((i,n)=>{t=i,e=n}),resolve:t,reject:e}},promisify(t){return new Promise((e,r)=>{t((i,...n)=>i?r(i):e(...n))})},debuglog(){return function(){}},format(t,...e){return t.replace(/%([sdifj])/g,function(...[r,i]){let n=e.shift();return i==="f"?n.toFixed(6):i==="j"?JSON.stringify(n):i==="s"&&typeof n=="object"?`${n.constructor!==Object?n.constructor.name:""} {}`.trim():n.toString()})},inspect(t){switch(typeof t){case"string":if(t.includes("'"))if(t.includes('"')){if(!t.includes("`")&&!t.includes("${"))return`\`${t}\``}else return`"${t}"`;return`'${t}'`;case"number":return isNaN(t)?"NaN":Object.is(t,-0)?String(t):t;case"bigint":return`${String(t)}n`;case"boolean":case"undefined":return String(t);case"object":return"{}"}},types:{isAsyncFunction(t){return t instanceof Qg},isArrayBufferView(t){return ArrayBuffer.isView(t)}},isBlob:Yg};_s.exports.promisify.custom=Symbol.for("nodejs.util.promisify.custom")});var Fi=M((IA,ji)=>{"use strict";_();v();m();var{AbortController:Qu,AbortSignal:Jg}=typeof self<"u"?self:typeof window<"u"?window:void 0;ji.exports=Qu;ji.exports.AbortSignal=Jg;ji.exports.default=Qu});var Se=M((xA,Xu)=>{"use strict";_();v();m();var{format:Xg,inspect:Wi,AggregateError:Zg}=Je(),ey=globalThis.AggregateError||Zg,ty=Symbol("kIsNodeError"),ry=["string","function","number","object","Function","Object","boolean","bigint","symbol"],iy=/^([A-Z][a-z0-9]*)+$/,ny="__node_internal_",$i={};function Xt(t,e){if(!t)throw new $i.ERR_INTERNAL_ASSERTION(e)}function Yu(t){let e="",r=t.length,i=t[0]==="-"?1:0;for(;r>=i+4;r-=3)e=`_${t.slice(r-3,r)}${e}`;return`${t.slice(0,r)}${e}`}function sy(t,e,r){if(typeof e=="function")return Xt(e.length<=r.length,`Code: ${t}; The provided arguments length (${r.length}) does not match the required ones (${e.length}).`),e(...r);let i=(e.match(/%[dfijoOs]/g)||[]).length;return Xt(i===r.length,`Code: ${t}; The provided arguments length (${r.length}) does not match the required ones (${i}).`),r.length===0?e:Xg(e,...r)}function _e(t,e,r){r||(r=Error);class i extends r{constructor(...o){super(sy(t,e,o))}toString(){return`${this.name} [${t}]: ${this.message}`}}Object.defineProperties(i.prototype,{name:{value:r.name,writable:!0,enumerable:!1,configurable:!0},toString:{value(){return`${this.name} [${t}]: ${this.message}`},writable:!0,enumerable:!1,configurable:!0}}),i.prototype.code=t,i.prototype[ty]=!0,$i[t]=i}function Ju(t){let e=ny+t.name;return Object.defineProperty(t,"name",{value:e}),t}function oy(t,e){if(t&&e&&t!==e){if(Array.isArray(e.errors))return e.errors.push(t),e;let r=new ey([e,t],e.message);return r.code=e.code,r}return t||e}var ms=class extends Error{constructor(e="The operation was aborted",r=void 0){if(r!==void 0&&typeof r!="object")throw new $i.ERR_INVALID_ARG_TYPE("options","Object",r);super(e,r),this.code="ABORT_ERR",this.name="AbortError"}};_e("ERR_ASSERTION","%s",Error);_e("ERR_INVALID_ARG_TYPE",(t,e,r)=>{Xt(typeof t=="string","'name' must be a string"),Array.isArray(e)||(e=[e]);let i="The ";t.endsWith(" argument")?i+=`${t} `:i+=`"${t}" ${t.includes(".")?"property":"argument"} `,i+="must be ";let n=[],o=[],s=[];for(let u of e)Xt(typeof u=="string","All expected entries have to be of type string"),ry.includes(u)?n.push(u.toLowerCase()):iy.test(u)?o.push(u):(Xt(u!=="object",'The value "object" should be written as "Object"'),s.push(u));if(o.length>0){let u=n.indexOf("object");u!==-1&&(n.splice(n,u,1),o.push("Object"))}if(n.length>0){switch(n.length){case 1:i+=`of type ${n[0]}`;break;case 2:i+=`one of type ${n[0]} or ${n[1]}`;break;default:{let u=n.pop();i+=`one of type ${n.join(", ")}, or ${u}`}}(o.length>0||s.length>0)&&(i+=" or ")}if(o.length>0){switch(o.length){case 1:i+=`an instance of ${o[0]}`;break;case 2:i+=`an instance of ${o[0]} or ${o[1]}`;break;default:{let u=o.pop();i+=`an instance of ${o.join(", ")}, or ${u}`}}s.length>0&&(i+=" or ")}switch(s.length){case 0:break;case 1:s[0].toLowerCase()!==s[0]&&(i+="an "),i+=`${s[0]}`;break;case 2:i+=`one of ${s[0]} or ${s[1]}`;break;default:{let u=s.pop();i+=`one of ${s.join(", ")}, or ${u}`}}if(r==null)i+=`. Received ${r}`;else if(typeof r=="function"&&r.name)i+=`. Received function ${r.name}`;else if(typeof r=="object"){var a;if((a=r.constructor)!==null&&a!==void 0&&a.name)i+=`. Received an instance of ${r.constructor.name}`;else{let u=Wi(r,{depth:-1});i+=`. Received ${u}`}}else{let u=Wi(r,{colors:!1});u.length>25&&(u=`${u.slice(0,25)}...`),i+=`. Received type ${typeof r} (${u})`}return i},TypeError);_e("ERR_INVALID_ARG_VALUE",(t,e,r="is invalid")=>{let i=Wi(e);return i.length>128&&(i=i.slice(0,128)+"..."),`The ${t.includes(".")?"property":"argument"} '${t}' ${r}. Received ${i}`},TypeError);_e("ERR_INVALID_RETURN_VALUE",(t,e,r)=>{var i;let n=r!=null&&(i=r.constructor)!==null&&i!==void 0&&i.name?`instance of ${r.constructor.name}`:`type ${typeof r}`;return`Expected ${t} to be returned from the "${e}" function but got ${n}.`},TypeError);_e("ERR_MISSING_ARGS",(...t)=>{Xt(t.length>0,"At least one arg needs to be specified");let e,r=t.length;switch(t=(Array.isArray(t)?t:[t]).map(i=>`"${i}"`).join(" or "),r){case 1:e+=`The ${t[0]} argument`;break;case 2:e+=`The ${t[0]} and ${t[1]} arguments`;break;default:{let i=t.pop();e+=`The ${t.join(", ")}, and ${i} arguments`}break}return`${e} must be specified`},TypeError);_e("ERR_OUT_OF_RANGE",(t,e,r)=>{Xt(e,'Missing "range" argument');let i;return Number.isInteger(r)&&Math.abs(r)>2**32?i=Yu(String(r)):typeof r=="bigint"?(i=String(r),(r>2n**32n||r<-(2n**32n))&&(i=Yu(i)),i+="n"):i=Wi(r),`The value of "${t}" is out of range. It must be ${e}. Received ${i}`},RangeError);_e("ERR_MULTIPLE_CALLBACK","Callback called multiple times",Error);_e("ERR_METHOD_NOT_IMPLEMENTED","The %s method is not implemented",Error);_e("ERR_STREAM_ALREADY_FINISHED","Cannot call %s after a stream was finished",Error);_e("ERR_STREAM_CANNOT_PIPE","Cannot pipe, not readable",Error);_e("ERR_STREAM_DESTROYED","Cannot call %s after a stream was destroyed",Error);_e("ERR_STREAM_NULL_VALUES","May not write null values to stream",TypeError);_e("ERR_STREAM_PREMATURE_CLOSE","Premature close",Error);_e("ERR_STREAM_PUSH_AFTER_EOF","stream.push() after EOF",Error);_e("ERR_STREAM_UNSHIFT_AFTER_END_EVENT","stream.unshift() after end event",Error);_e("ERR_STREAM_WRITE_AFTER_END","write after end",Error);_e("ERR_UNKNOWN_ENCODING","Unknown encoding: %s",TypeError);Xu.exports={AbortError:ms,aggregateTwoErrors:Ju(oy),hideStackFrames:Ju,codes:$i}});var ui=M((DA,lf)=>{"use strict";_();v();m();var{ArrayIsArray:Es,ArrayPrototypeIncludes:rf,ArrayPrototypeJoin:nf,ArrayPrototypeMap:ay,NumberIsInteger:Ss,NumberIsNaN:ly,NumberMAX_SAFE_INTEGER:uy,NumberMIN_SAFE_INTEGER:fy,NumberParseInt:cy,ObjectPrototypeHasOwnProperty:hy,RegExpPrototypeExec:sf,String:dy,StringPrototypeToUpperCase:py,StringPrototypeTrim:gy}=ce(),{hideStackFrames:Ue,codes:{ERR_SOCKET_BAD_PORT:yy,ERR_INVALID_ARG_TYPE:Ae,ERR_INVALID_ARG_VALUE:kr,ERR_OUT_OF_RANGE:Zt,ERR_UNKNOWN_SIGNAL:Zu}}=Se(),{normalizeEncoding:by}=Je(),{isAsyncFunction:wy,isArrayBufferView:_y}=Je().types,ef={};function my(t){return t===(t|0)}function vy(t){return t===t>>>0}var Ey=/^[0-7]+$/,Sy="must be a 32-bit unsigned integer or an octal string";function Ay(t,e,r){if(typeof t>"u"&&(t=r),typeof t=="string"){if(sf(Ey,t)===null)throw new kr(e,t,Sy);t=cy(t,8)}return of(t,e),t}var Iy=Ue((t,e,r=fy,i=uy)=>{if(typeof t!="number")throw new Ae(e,"number",t);if(!Ss(t))throw new Zt(e,"an integer",t);if(t<r||t>i)throw new Zt(e,`>= ${r} && <= ${i}`,t)}),Ty=Ue((t,e,r=-2147483648,i=2147483647)=>{if(typeof t!="number")throw new Ae(e,"number",t);if(!Ss(t))throw new Zt(e,"an integer",t);if(t<r||t>i)throw new Zt(e,`>= ${r} && <= ${i}`,t)}),of=Ue((t,e,r=!1)=>{if(typeof t!="number")throw new Ae(e,"number",t);if(!Ss(t))throw new Zt(e,"an integer",t);let i=r?1:0,n=4294967295;if(t<i||t>n)throw new Zt(e,`>= ${i} && <= ${n}`,t)});function As(t,e){if(typeof t!="string")throw new Ae(e,"string",t)}function Ry(t,e,r=void 0,i){if(typeof t!="number")throw new Ae(e,"number",t);if(r!=null&&t<r||i!=null&&t>i||(r!=null||i!=null)&&ly(t))throw new Zt(e,`${r!=null?`>= ${r}`:""}${r!=null&&i!=null?" && ":""}${i!=null?`<= ${i}`:""}`,t)}var Cy=Ue((t,e,r)=>{if(!rf(r,t)){let n="must be one of: "+nf(ay(r,o=>typeof o=="string"?`'${o}'`:dy(o)),", ");throw new kr(e,t,n)}});function af(t,e){if(typeof t!="boolean")throw new Ae(e,"boolean",t)}function vs(t,e,r){return t==null||!hy(t,e)?r:t[e]}var By=Ue((t,e,r=null)=>{let i=vs(r,"allowArray",!1),n=vs(r,"allowFunction",!1);if(!vs(r,"nullable",!1)&&t===null||!i&&Es(t)||typeof t!="object"&&(!n||typeof t!="function"))throw new Ae(e,"Object",t)}),Py=Ue((t,e)=>{if(t!=null&&typeof t!="object"&&typeof t!="function")throw new Ae(e,"a dictionary",t)}),Is=Ue((t,e,r=0)=>{if(!Es(t))throw new Ae(e,"Array",t);if(t.length<r){let i=`must be longer than ${r}`;throw new kr(e,t,i)}});function Oy(t,e){Is(t,e);for(let r=0;r<t.length;r++)As(t[r],`${e}[${r}]`)}function xy(t,e){Is(t,e);for(let r=0;r<t.length;r++)af(t[r],`${e}[${r}]`)}function ky(t,e="signal"){if(As(t,e),ef[t]===void 0)throw ef[py(t)]!==void 0?new Zu(t+" (signals must use all capital letters)"):new Zu(t)}var My=Ue((t,e="buffer")=>{if(!_y(t))throw new Ae(e,["Buffer","TypedArray","DataView"],t)});function Ly(t,e){let r=by(e),i=t.length;if(r==="hex"&&i%2!==0)throw new kr("encoding",e,`is invalid for data of length ${i}`)}function Uy(t,e="Port",r=!0){if(typeof t!="number"&&typeof t!="string"||typeof t=="string"&&gy(t).length===0||+t!==+t>>>0||t>65535||t===0&&!r)throw new yy(e,t,r);return t|0}var Ny=Ue((t,e)=>{if(t!==void 0&&(t===null||typeof t!="object"||!("aborted"in t)))throw new Ae(e,"AbortSignal",t)}),qy=Ue((t,e)=>{if(typeof t!="function")throw new Ae(e,"Function",t)}),Dy=Ue((t,e)=>{if(typeof t!="function"||wy(t))throw new Ae(e,"Function",t)}),jy=Ue((t,e)=>{if(t!==void 0)throw new Ae(e,"undefined",t)});function Fy(t,e,r){if(!rf(r,t))throw new Ae(e,`('${nf(r,"|")}')`,t)}var Wy=/^(?:<[^>]*>)(?:\s*;\s*[^;"\s]+(?:=(")?[^;"\s]*\1)?)*$/;function tf(t,e){if(typeof t>"u"||!sf(Wy,t))throw new kr(e,t,'must be an array or string of format "</styles.css>; rel=preload; as=style"')}function $y(t){if(typeof t=="string")return tf(t,"hints"),t;if(Es(t)){let e=t.length,r="";if(e===0)return r;for(let i=0;i<e;i++){let n=t[i];tf(n,"hints"),r+=n,i!==e-1&&(r+=", ")}return r}throw new kr("hints",t,'must be an array or string of format "</styles.css>; rel=preload; as=style"')}lf.exports={isInt32:my,isUint32:vy,parseFileMode:Ay,validateArray:Is,validateStringArray:Oy,validateBooleanArray:xy,validateBoolean:af,validateBuffer:My,validateDictionary:Py,validateEncoding:Ly,validateFunction:qy,validateInt32:Ty,validateInteger:Iy,validateNumber:Ry,validateObject:By,validateOneOf:Cy,validatePlainFunction:Dy,validatePort:Uy,validateSignalName:ky,validateString:As,validateUint32:of,validateUndefined:jy,validateUnion:Fy,validateAbortSignal:Ny,validateLinkHeaderValue:$y}});var Ut=M((zA,hf)=>{_();v();m();var ae=hf.exports={},Xe,Ze;function Ts(){throw new Error("setTimeout has not been defined")}function Rs(){throw new Error("clearTimeout has not been defined")}(function(){try{typeof setTimeout=="function"?Xe=setTimeout:Xe=Ts}catch{Xe=Ts}try{typeof clearTimeout=="function"?Ze=clearTimeout:Ze=Rs}catch{Ze=Rs}})();function uf(t){if(Xe===setTimeout)return setTimeout(t,0);if((Xe===Ts||!Xe)&&setTimeout)return Xe=setTimeout,setTimeout(t,0);try{return Xe(t,0)}catch{try{return Xe.call(null,t,0)}catch{return Xe.call(this,t,0)}}}function Hy(t){if(Ze===clearTimeout)return clearTimeout(t);if((Ze===Rs||!Ze)&&clearTimeout)return Ze=clearTimeout,clearTimeout(t);try{return Ze(t)}catch{try{return Ze.call(null,t)}catch{return Ze.call(this,t)}}}var wt=[],Mr=!1,er,Hi=-1;function Vy(){!Mr||!er||(Mr=!1,er.length?wt=er.concat(wt):Hi=-1,wt.length&&ff())}function ff(){if(!Mr){var t=uf(Vy);Mr=!0;for(var e=wt.length;e;){for(er=wt,wt=[];++Hi<e;)er&&er[Hi].run();Hi=-1,e=wt.length}er=null,Mr=!1,Hy(t)}}ae.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)e[r-1]=arguments[r];wt.push(new cf(t,e)),wt.length===1&&!Mr&&uf(ff)};function cf(t,e){this.fun=t,this.array=e}cf.prototype.run=function(){this.fun.apply(null,this.array)};ae.title="browser";ae.browser=!0;ae.env={};ae.argv=[];ae.version="";ae.versions={};function _t(){}ae.on=_t;ae.addListener=_t;ae.once=_t;ae.off=_t;ae.removeListener=_t;ae.removeAllListeners=_t;ae.emit=_t;ae.prependListener=_t;ae.prependOnceListener=_t;ae.listeners=function(t){return[]};ae.binding=function(t){throw new Error("process.binding is not supported")};ae.cwd=function(){return"/"};ae.chdir=function(t){throw new Error("process.chdir is not supported")};ae.umask=function(){return 0}});var tt=M((ZA,Cf)=>{"use strict";_();v();m();var{Symbol:Vi,SymbolAsyncIterator:df,SymbolIterator:pf,SymbolFor:gf}=ce(),yf=Vi("kDestroyed"),bf=Vi("kIsErrored"),Cs=Vi("kIsReadable"),wf=Vi("kIsDisturbed"),zy=gf("nodejs.webstream.isClosedPromise"),Ky=gf("nodejs.webstream.controllerErrorFunction");function zi(t,e=!1){var r;return!!(t&&typeof t.pipe=="function"&&typeof t.on=="function"&&(!e||typeof t.pause=="function"&&typeof t.resume=="function")&&(!t._writableState||((r=t._readableState)===null||r===void 0?void 0:r.readable)!==!1)&&(!t._writableState||t._readableState))}function Ki(t){var e;return!!(t&&typeof t.write=="function"&&typeof t.on=="function"&&(!t._readableState||((e=t._writableState)===null||e===void 0?void 0:e.writable)!==!1))}function Gy(t){return!!(t&&typeof t.pipe=="function"&&t._readableState&&typeof t.on=="function"&&typeof t.write=="function")}function et(t){return t&&(t._readableState||t._writableState||typeof t.write=="function"&&typeof t.on=="function"||typeof t.pipe=="function"&&typeof t.on=="function")}function _f(t){return!!(t&&!et(t)&&typeof t.pipeThrough=="function"&&typeof t.getReader=="function"&&typeof t.cancel=="function")}function mf(t){return!!(t&&!et(t)&&typeof t.getWriter=="function"&&typeof t.abort=="function")}function vf(t){return!!(t&&!et(t)&&typeof t.readable=="object"&&typeof t.writable=="object")}function Qy(t){return _f(t)||mf(t)||vf(t)}function Yy(t,e){return t==null?!1:e===!0?typeof t[df]=="function":e===!1?typeof t[pf]=="function":typeof t[df]=="function"||typeof t[pf]=="function"}function Gi(t){if(!et(t))return null;let e=t._writableState,r=t._readableState,i=e||r;return!!(t.destroyed||t[yf]||i!=null&&i.destroyed)}function Ef(t){if(!Ki(t))return null;if(t.writableEnded===!0)return!0;let e=t._writableState;return e!=null&&e.errored?!1:typeof e?.ended!="boolean"?null:e.ended}function Jy(t,e){if(!Ki(t))return null;if(t.writableFinished===!0)return!0;let r=t._writableState;return r!=null&&r.errored?!1:typeof r?.finished!="boolean"?null:!!(r.finished||e===!1&&r.ended===!0&&r.length===0)}function Xy(t){if(!zi(t))return null;if(t.readableEnded===!0)return!0;let e=t._readableState;return!e||e.errored?!1:typeof e?.ended!="boolean"?null:e.ended}function Sf(t,e){if(!zi(t))return null;let r=t._readableState;return r!=null&&r.errored?!1:typeof r?.endEmitted!="boolean"?null:!!(r.endEmitted||e===!1&&r.ended===!0&&r.length===0)}function Af(t){return t&&t[Cs]!=null?t[Cs]:typeof t?.readable!="boolean"?null:Gi(t)?!1:zi(t)&&t.readable&&!Sf(t)}function If(t){return typeof t?.writable!="boolean"?null:Gi(t)?!1:Ki(t)&&t.writable&&!Ef(t)}function Zy(t,e){return et(t)?Gi(t)?!0:!(e?.readable!==!1&&Af(t)||e?.writable!==!1&&If(t)):null}function eb(t){var e,r;return et(t)?t.writableErrored?t.writableErrored:(e=(r=t._writableState)===null||r===void 0?void 0:r.errored)!==null&&e!==void 0?e:null:null}function tb(t){var e,r;return et(t)?t.readableErrored?t.readableErrored:(e=(r=t._readableState)===null||r===void 0?void 0:r.errored)!==null&&e!==void 0?e:null:null}function rb(t){if(!et(t))return null;if(typeof t.closed=="boolean")return t.closed;let e=t._writableState,r=t._readableState;return typeof e?.closed=="boolean"||typeof r?.closed=="boolean"?e?.closed||r?.closed:typeof t._closed=="boolean"&&Tf(t)?t._closed:null}function Tf(t){return typeof t._closed=="boolean"&&typeof t._defaultKeepAlive=="boolean"&&typeof t._removedConnection=="boolean"&&typeof t._removedContLen=="boolean"}function Rf(t){return typeof t._sent100=="boolean"&&Tf(t)}function ib(t){var e;return typeof t._consuming=="boolean"&&typeof t._dumped=="boolean"&&((e=t.req)===null||e===void 0?void 0:e.upgradeOrConnect)===void 0}function nb(t){if(!et(t))return null;let e=t._writableState,r=t._readableState,i=e||r;return!i&&Rf(t)||!!(i&&i.autoDestroy&&i.emitClose&&i.closed===!1)}function sb(t){var e;return!!(t&&((e=t[wf])!==null&&e!==void 0?e:t.readableDidRead||t.readableAborted))}function ob(t){var e,r,i,n,o,s,a,u,c,h;return!!(t&&((e=(r=(i=(n=(o=(s=t[bf])!==null&&s!==void 0?s:t.readableErrored)!==null&&o!==void 0?o:t.writableErrored)!==null&&n!==void 0?n:(a=t._readableState)===null||a===void 0?void 0:a.errorEmitted)!==null&&i!==void 0?i:(u=t._writableState)===null||u===void 0?void 0:u.errorEmitted)!==null&&r!==void 0?r:(c=t._readableState)===null||c===void 0?void 0:c.errored)!==null&&e!==void 0?e:!((h=t._writableState)===null||h===void 0)&&h.errored))}Cf.exports={kDestroyed:yf,isDisturbed:sb,kIsDisturbed:wf,isErrored:ob,kIsErrored:bf,isReadable:Af,kIsReadable:Cs,kIsClosedPromise:zy,kControllerErrorFunction:Ky,isClosed:rb,isDestroyed:Gi,isDuplexNodeStream:Gy,isFinished:Zy,isIterable:Yy,isReadableNodeStream:zi,isReadableStream:_f,isReadableEnded:Xy,isReadableFinished:Sf,isReadableErrored:tb,isNodeStream:et,isWebStream:Qy,isWritable:If,isWritableNodeStream:Ki,isWritableStream:mf,isWritableEnded:Ef,isWritableFinished:Jy,isWritableErrored:eb,isServerRequest:ib,isServerResponse:Rf,willEmitClose:nb,isTransformStream:vf}});var mt=M((oI,ks)=>{_();v();m();var Nt=Ut(),{AbortError:Nf,codes:ab}=Se(),{ERR_INVALID_ARG_TYPE:lb,ERR_STREAM_PREMATURE_CLOSE:Bf}=ab,{kEmptyObject:Ps,once:Os}=Je(),{validateAbortSignal:ub,validateFunction:fb,validateObject:cb,validateBoolean:hb}=ui(),{Promise:db,PromisePrototypeThen:pb}=ce(),{isClosed:gb,isReadable:Pf,isReadableNodeStream:Bs,isReadableStream:yb,isReadableFinished:Of,isReadableErrored:xf,isWritable:kf,isWritableNodeStream:Mf,isWritableStream:bb,isWritableFinished:Lf,isWritableErrored:Uf,isNodeStream:wb,willEmitClose:_b,kIsClosedPromise:mb}=tt();function vb(t){return t.setHeader&&typeof t.abort=="function"}var xs=()=>{};function qf(t,e,r){var i,n;if(arguments.length===2?(r=e,e=Ps):e==null?e=Ps:cb(e,"options"),fb(r,"callback"),ub(e.signal,"options.signal"),r=Os(r),yb(t)||bb(t))return Eb(t,e,r);if(!wb(t))throw new lb("stream",["ReadableStream","WritableStream","Stream"],t);let o=(i=e.readable)!==null&&i!==void 0?i:Bs(t),s=(n=e.writable)!==null&&n!==void 0?n:Mf(t),a=t._writableState,u=t._readableState,c=()=>{t.writable||g()},h=_b(t)&&Bs(t)===o&&Mf(t)===s,d=Lf(t,!1),g=()=>{d=!0,t.destroyed&&(h=!1),!(h&&(!t.readable||o))&&(!o||y)&&r.call(t)},y=Of(t,!1),w=()=>{y=!0,t.destroyed&&(h=!1),!(h&&(!t.writable||s))&&(!s||d)&&r.call(t)},E=N=>{r.call(t,N)},S=gb(t),I=()=>{S=!0;let N=Uf(t)||xf(t);if(N&&typeof N!="boolean")return r.call(t,N);if(o&&!y&&Bs(t,!0)&&!Of(t,!1))return r.call(t,new Bf);if(s&&!d&&!Lf(t,!1))return r.call(t,new Bf);r.call(t)},C=()=>{S=!0;let N=Uf(t)||xf(t);if(N&&typeof N!="boolean")return r.call(t,N);r.call(t)},R=()=>{t.req.on("finish",g)};vb(t)?(t.on("complete",g),h||t.on("abort",I),t.req?R():t.on("request",R)):s&&!a&&(t.on("end",c),t.on("close",c)),!h&&typeof t.aborted=="boolean"&&t.on("aborted",I),t.on("end",w),t.on("finish",g),e.error!==!1&&t.on("error",E),t.on("close",I),S?Nt.nextTick(I):a!=null&&a.errorEmitted||u!=null&&u.errorEmitted?h||Nt.nextTick(C):(!o&&(!h||Pf(t))&&(d||kf(t)===!1)||!s&&(!h||kf(t))&&(y||Pf(t)===!1)||u&&t.req&&t.aborted)&&Nt.nextTick(C);let U=()=>{r=xs,t.removeListener("aborted",I),t.removeListener("complete",g),t.removeListener("abort",I),t.removeListener("request",R),t.req&&t.req.removeListener("finish",g),t.removeListener("end",c),t.removeListener("close",c),t.removeListener("finish",g),t.removeListener("end",w),t.removeListener("error",E),t.removeListener("close",I)};if(e.signal&&!S){let N=()=>{let W=r;U(),W.call(t,new Nf(void 0,{cause:e.signal.reason}))};if(e.signal.aborted)Nt.nextTick(N);else{let W=r;r=Os((...K)=>{e.signal.removeEventListener("abort",N),W.apply(t,K)}),e.signal.addEventListener("abort",N)}}return U}function Eb(t,e,r){let i=!1,n=xs;if(e.signal)if(n=()=>{i=!0,r.call(t,new Nf(void 0,{cause:e.signal.reason}))},e.signal.aborted)Nt.nextTick(n);else{let s=r;r=Os((...a)=>{e.signal.removeEventListener("abort",n),s.apply(t,a)}),e.signal.addEventListener("abort",n)}let o=(...s)=>{i||Nt.nextTick(()=>r.apply(t,s))};return pb(t[mb].promise,o,o),xs}function Sb(t,e){var r;let i=!1;return e===null&&(e=Ps),(r=e)!==null&&r!==void 0&&r.cleanup&&(hb(e.cleanup,"cleanup"),i=e.cleanup),new db((n,o)=>{let s=qf(t,e,a=>{i&&s(),a?o(a):n()})})}ks.exports=qf;ks.exports.finished=Sb});var tr=M((dI,zf)=>{"use strict";_();v();m();var rt=Ut(),{aggregateTwoErrors:Ab,codes:{ERR_MULTIPLE_CALLBACK:Ib},AbortError:Tb}=Se(),{Symbol:Ff}=ce(),{kDestroyed:Rb,isDestroyed:Cb,isFinished:Bb,isServerRequest:Pb}=tt(),Wf=Ff("kDestroy"),Ms=Ff("kConstruct");function $f(t,e,r){t&&(t.stack,e&&!e.errored&&(e.errored=t),r&&!r.errored&&(r.errored=t))}function Ob(t,e){let r=this._readableState,i=this._writableState,n=i||r;return i!=null&&i.destroyed||r!=null&&r.destroyed?(typeof e=="function"&&e(),this):($f(t,i,r),i&&(i.destroyed=!0),r&&(r.destroyed=!0),n.constructed?Df(this,t,e):this.once(Wf,function(o){Df(this,Ab(o,t),e)}),this)}function Df(t,e,r){let i=!1;function n(o){if(i)return;i=!0;let s=t._readableState,a=t._writableState;$f(o,a,s),a&&(a.closed=!0),s&&(s.closed=!0),typeof r=="function"&&r(o),o?rt.nextTick(xb,t,o):rt.nextTick(Hf,t)}try{t._destroy(e||null,n)}catch(o){n(o)}}function xb(t,e){Ls(t,e),Hf(t)}function Hf(t){let e=t._readableState,r=t._writableState;r&&(r.closeEmitted=!0),e&&(e.closeEmitted=!0),(r!=null&&r.emitClose||e!=null&&e.emitClose)&&t.emit("close")}function Ls(t,e){let r=t._readableState,i=t._writableState;i!=null&&i.errorEmitted||r!=null&&r.errorEmitted||(i&&(i.errorEmitted=!0),r&&(r.errorEmitted=!0),t.emit("error",e))}function kb(){let t=this._readableState,e=this._writableState;t&&(t.constructed=!0,t.closed=!1,t.closeEmitted=!1,t.destroyed=!1,t.errored=null,t.errorEmitted=!1,t.reading=!1,t.ended=t.readable===!1,t.endEmitted=t.readable===!1),e&&(e.constructed=!0,e.destroyed=!1,e.closed=!1,e.closeEmitted=!1,e.errored=null,e.errorEmitted=!1,e.finalCalled=!1,e.prefinished=!1,e.ended=e.writable===!1,e.ending=e.writable===!1,e.finished=e.writable===!1)}function Us(t,e,r){let i=t._readableState,n=t._writableState;if(n!=null&&n.destroyed||i!=null&&i.destroyed)return this;i!=null&&i.autoDestroy||n!=null&&n.autoDestroy?t.destroy(e):e&&(e.stack,n&&!n.errored&&(n.errored=e),i&&!i.errored&&(i.errored=e),r?rt.nextTick(Ls,t,e):Ls(t,e))}function Mb(t,e){if(typeof t._construct!="function")return;let r=t._readableState,i=t._writableState;r&&(r.constructed=!1),i&&(i.constructed=!1),t.once(Ms,e),!(t.listenerCount(Ms)>1)&&rt.nextTick(Lb,t)}function Lb(t){let e=!1;function r(i){if(e){Us(t,i??new Ib);return}e=!0;let n=t._readableState,o=t._writableState,s=o||n;n&&(n.constructed=!0),o&&(o.constructed=!0),s.destroyed?t.emit(Wf,i):i?Us(t,i,!0):rt.nextTick(Ub,t)}try{t._construct(i=>{rt.nextTick(r,i)})}catch(i){rt.nextTick(r,i)}}function Ub(t){t.emit(Ms)}function jf(t){return t?.setHeader&&typeof t.abort=="function"}function Vf(t){t.emit("close")}function Nb(t,e){t.emit("error",e),rt.nextTick(Vf,t)}function qb(t,e){!t||Cb(t)||(!e&&!Bb(t)&&(e=new Tb),Pb(t)?(t.socket=null,t.destroy(e)):jf(t)?t.abort():jf(t.req)?t.req.abort():typeof t.destroy=="function"?t.destroy(e):typeof t.close=="function"?t.close():e?rt.nextTick(Nb,t,e):rt.nextTick(Vf,t),t.destroyed||(t[Rb]=!0))}zf.exports={construct:Mb,destroyer:qb,destroy:Ob,undestroy:kb,errorOrDestroy:Us}});function Y(){Y.init.call(this)}function Qi(t){if(typeof t!="function")throw new TypeError('The "listener" argument must be of type Function. Received type '+typeof t)}function rc(t){return t._maxListeners===void 0?Y.defaultMaxListeners:t._maxListeners}function Yf(t,e,r,i){var n,o,s,a;if(Qi(r),(o=t._events)===void 0?(o=t._events=Object.create(null),t._eventsCount=0):(o.newListener!==void 0&&(t.emit("newListener",e,r.listener?r.listener:r),o=t._events),s=o[e]),s===void 0)s=o[e]=r,++t._eventsCount;else if(typeof s=="function"?s=o[e]=i?[r,s]:[s,r]:i?s.unshift(r):s.push(r),(n=rc(t))>0&&s.length>n&&!s.warned){s.warned=!0;var u=new Error("Possible EventEmitter memory leak detected. "+s.length+" "+String(e)+" listeners added. Use emitter.setMaxListeners() to increase limit");u.name="MaxListenersExceededWarning",u.emitter=t,u.type=e,u.count=s.length,a=u,console&&console.warn&&console.warn(a)}return t}function Db(){if(!this.fired)return this.target.removeListener(this.type,this.wrapFn),this.fired=!0,arguments.length===0?this.listener.call(this.target):this.listener.apply(this.target,arguments)}function Jf(t,e,r){var i={fired:!1,wrapFn:void 0,target:t,type:e,listener:r},n=Db.bind(i);return n.listener=r,i.wrapFn=n,n}function Xf(t,e,r){var i=t._events;if(i===void 0)return[];var n=i[e];return n===void 0?[]:typeof n=="function"?r?[n.listener||n]:[n]:r?function(o){for(var s=new Array(o.length),a=0;a<s.length;++a)s[a]=o[a].listener||o[a];return s}(n):ic(n,n.length)}function Zf(t){var e=this._events;if(e!==void 0){var r=e[t];if(typeof r=="function")return 1;if(r!==void 0)return r.length}return 0}function ic(t,e){for(var r=new Array(e),i=0;i<e;++i)r[i]=t[i];return r}var ec,tc,Lr,Kf,Gf,Qf,Be,Ns=be(()=>{_();v();m();Lr=typeof Reflect=="object"?Reflect:null,Kf=Lr&&typeof Lr.apply=="function"?Lr.apply:function(t,e,r){return Function.prototype.apply.call(t,e,r)};tc=Lr&&typeof Lr.ownKeys=="function"?Lr.ownKeys:Object.getOwnPropertySymbols?function(t){return Object.getOwnPropertyNames(t).concat(Object.getOwnPropertySymbols(t))}:function(t){return Object.getOwnPropertyNames(t)};Gf=Number.isNaN||function(t){return t!=t};ec=Y,Y.EventEmitter=Y,Y.prototype._events=void 0,Y.prototype._eventsCount=0,Y.prototype._maxListeners=void 0;Qf=10;Object.defineProperty(Y,"defaultMaxListeners",{enumerable:!0,get:function(){return Qf},set:function(t){if(typeof t!="number"||t<0||Gf(t))throw new RangeError('The value of "defaultMaxListeners" is out of range. It must be a non-negative number. Received '+t+".");Qf=t}}),Y.init=function(){this._events!==void 0&&this._events!==Object.getPrototypeOf(this)._events||(this._events=Object.create(null),this._eventsCount=0),this._maxListeners=this._maxListeners||void 0},Y.prototype.setMaxListeners=function(t){if(typeof t!="number"||t<0||Gf(t))throw new RangeError('The value of "n" is out of range. It must be a non-negative number. Received '+t+".");return this._maxListeners=t,this},Y.prototype.getMaxListeners=function(){return rc(this)},Y.prototype.emit=function(t){for(var e=[],r=1;r<arguments.length;r++)e.push(arguments[r]);var i=t==="error",n=this._events;if(n!==void 0)i=i&&n.error===void 0;else if(!i)return!1;if(i){var o;if(e.length>0&&(o=e[0]),o instanceof Error)throw o;var s=new Error("Unhandled error."+(o?" ("+o.message+")":""));throw s.context=o,s}var a=n[t];if(a===void 0)return!1;if(typeof a=="function")Kf(a,this,e);else{var u=a.length,c=ic(a,u);for(r=0;r<u;++r)Kf(c[r],this,e)}return!0},Y.prototype.addListener=function(t,e){return Yf(this,t,e,!1)},Y.prototype.on=Y.prototype.addListener,Y.prototype.prependListener=function(t,e){return Yf(this,t,e,!0)},Y.prototype.once=function(t,e){return Qi(e),this.on(t,Jf(this,t,e)),this},Y.prototype.prependOnceListener=function(t,e){return Qi(e),this.prependListener(t,Jf(this,t,e)),this},Y.prototype.removeListener=function(t,e){var r,i,n,o,s;if(Qi(e),(i=this._events)===void 0)return this;if((r=i[t])===void 0)return this;if(r===e||r.listener===e)--this._eventsCount==0?this._events=Object.create(null):(delete i[t],i.removeListener&&this.emit("removeListener",t,r.listener||e));else if(typeof r!="function"){for(n=-1,o=r.length-1;o>=0;o--)if(r[o]===e||r[o].listener===e){s=r[o].listener,n=o;break}if(n<0)return this;n===0?r.shift():function(a,u){for(;u+1<a.length;u++)a[u]=a[u+1];a.pop()}(r,n),r.length===1&&(i[t]=r[0]),i.removeListener!==void 0&&this.emit("removeListener",t,s||e)}return this},Y.prototype.off=Y.prototype.removeListener,Y.prototype.removeAllListeners=function(t){var e,r,i;if((r=this._events)===void 0)return this;if(r.removeListener===void 0)return arguments.length===0?(this._events=Object.create(null),this._eventsCount=0):r[t]!==void 0&&(--this._eventsCount==0?this._events=Object.create(null):delete r[t]),this;if(arguments.length===0){var n,o=Object.keys(r);for(i=0;i<o.length;++i)(n=o[i])!=="removeListener"&&this.removeAllListeners(n);return this.removeAllListeners("removeListener"),this._events=Object.create(null),this._eventsCount=0,this}if(typeof(e=r[t])=="function")this.removeListener(t,e);else if(e!==void 0)for(i=e.length-1;i>=0;i--)this.removeListener(t,e[i]);return this},Y.prototype.listeners=function(t){return Xf(this,t,!0)},Y.prototype.rawListeners=function(t){return Xf(this,t,!1)},Y.listenerCount=function(t,e){return typeof t.listenerCount=="function"?t.listenerCount(e):Zf.call(t,e)},Y.prototype.listenerCount=Zf,Y.prototype.eventNames=function(){return this._eventsCount>0?tc(this._events):[]};Be=ec;Be.EventEmitter;Be.defaultMaxListeners;Be.init;Be.listenerCount;Be.EventEmitter;Be.defaultMaxListeners;Be.init;Be.listenerCount});var rr={};Qt(rr,{EventEmitter:()=>jb,default:()=>Be,defaultMaxListeners:()=>Fb,init:()=>Wb,listenerCount:()=>$b,on:()=>Hb,once:()=>Vb});var jb,Fb,Wb,$b,Hb,Vb,ir=be(()=>{_();v();m();Ns();Ns();Be.once=function(t,e){return new Promise((r,i)=>{function n(...s){o!==void 0&&t.removeListener("error",o),r(s)}let o;e!=="error"&&(o=s=>{t.removeListener(name,n),i(s)},t.once("error",o)),t.once(e,n)})};Be.on=function(t,e){let r=[],i=[],n=null,o=!1,s={async next(){let c=r.shift();if(c)return createIterResult(c,!1);if(n){let h=Promise.reject(n);return n=null,h}return o?createIterResult(void 0,!0):new Promise((h,d)=>i.push({resolve:h,reject:d}))},async return(){t.removeListener(e,a),t.removeListener("error",u),o=!0;for(let c of i)c.resolve(createIterResult(void 0,!0));return createIterResult(void 0,!0)},throw(c){n=c,t.removeListener(e,a),t.removeListener("error",u)},[Symbol.asyncIterator](){return this}};return t.on(e,a),t.on("error",u),s;function a(...c){let h=i.shift();h?h.resolve(createIterResult(c,!1)):r.push(c)}function u(c){o=!0;let h=i.shift();h?h.reject(c):n=c,s.return()}};({EventEmitter:jb,defaultMaxListeners:Fb,init:Wb,listenerCount:$b,on:Hb,once:Vb}=Be)});var Xi=M((LI,sc)=>{"use strict";_();v();m();var{ArrayIsArray:zb,ObjectSetPrototypeOf:nc}=ce(),{EventEmitter:Yi}=(ir(),Z(rr));function Ji(t){Yi.call(this,t)}nc(Ji.prototype,Yi.prototype);nc(Ji,Yi);Ji.prototype.pipe=function(t,e){let r=this;function i(h){t.writable&&t.write(h)===!1&&r.pause&&r.pause()}r.on("data",i);function n(){r.readable&&r.resume&&r.resume()}t.on("drain",n),!t._isStdio&&(!e||e.end!==!1)&&(r.on("end",s),r.on("close",a));let o=!1;function s(){o||(o=!0,t.end())}function a(){o||(o=!0,typeof t.destroy=="function"&&t.destroy())}function u(h){c(),Yi.listenerCount(this,"error")===0&&this.emit("error",h)}qs(r,"error",u),qs(t,"error",u);function c(){r.removeListener("data",i),t.removeListener("drain",n),r.removeListener("end",s),r.removeListener("close",a),r.removeListener("error",u),t.removeListener("error",u),r.removeListener("end",c),r.removeListener("close",c),t.removeListener("close",c)}return r.on("end",c),r.on("close",c),t.on("close",c),t.emit("pipe",r),t};function qs(t,e,r){if(typeof t.prependListener=="function")return t.prependListener(e,r);!t._events||!t._events[e]?t.on(e,r):zb(t._events[e])?t._events[e].unshift(r):t._events[e]=[r,t._events[e]]}sc.exports={Stream:Ji,prependListener:qs}});var fi=M((WI,Zi)=>{"use strict";_();v();m();var{AbortError:oc,codes:Kb}=Se(),{isNodeStream:ac,isWebStream:Gb,kControllerErrorFunction:Qb}=tt(),Yb=mt(),{ERR_INVALID_ARG_TYPE:lc}=Kb,Jb=(t,e)=>{if(typeof t!="object"||!("aborted"in t))throw new lc(e,"AbortSignal",t)};Zi.exports.addAbortSignal=function(e,r){if(Jb(e,"signal"),!ac(r)&&!Gb(r))throw new lc("stream",["ReadableStream","WritableStream","Stream"],r);return Zi.exports.addAbortSignalNoValidate(e,r)};Zi.exports.addAbortSignalNoValidate=function(t,e){if(typeof t!="object"||!("aborted"in t))return e;let r=ac(e)?()=>{e.destroy(new oc(void 0,{cause:t.reason}))}:()=>{e[Qb](new oc(void 0,{cause:t.reason}))};return t.aborted?r():(t.addEventListener("abort",r),Yb(e,()=>t.removeEventListener("abort",r))),e}});var cc=M((YI,fc)=>{"use strict";_();v();m();var{StringPrototypeSlice:uc,SymbolIterator:Xb,TypedArrayPrototypeSet:en,Uint8Array:Zb}=ce(),{Buffer:Ds}=(we(),Z(ve)),{inspect:ew}=Je();fc.exports=class{constructor(){this.head=null,this.tail=null,this.length=0}push(e){let r={data:e,next:null};this.length>0?this.tail.next=r:this.head=r,this.tail=r,++this.length}unshift(e){let r={data:e,next:this.head};this.length===0&&(this.tail=r),this.head=r,++this.length}shift(){if(this.length===0)return;let e=this.head.data;return this.length===1?this.head=this.tail=null:this.head=this.head.next,--this.length,e}clear(){this.head=this.tail=null,this.length=0}join(e){if(this.length===0)return"";let r=this.head,i=""+r.data;for(;(r=r.next)!==null;)i+=e+r.data;return i}concat(e){if(this.length===0)return Ds.alloc(0);let r=Ds.allocUnsafe(e>>>0),i=this.head,n=0;for(;i;)en(r,i.data,n),n+=i.data.length,i=i.next;return r}consume(e,r){let i=this.head.data;if(e<i.length){let n=i.slice(0,e);return this.head.data=i.slice(e),n}return e===i.length?this.shift():r?this._getString(e):this._getBuffer(e)}first(){return this.head.data}*[Xb](){for(let e=this.head;e;e=e.next)yield e.data}_getString(e){let r="",i=this.head,n=0;do{let o=i.data;if(e>o.length)r+=o,e-=o.length;else{e===o.length?(r+=o,++n,i.next?this.head=i.next:this.head=this.tail=null):(r+=uc(o,0,e),this.head=i,i.data=uc(o,e));break}++n}while((i=i.next)!==null);return this.length-=n,r}_getBuffer(e){let r=Ds.allocUnsafe(e),i=e,n=this.head,o=0;do{let s=n.data;if(e>s.length)en(r,s,i-e),e-=s.length;else{e===s.length?(en(r,s,i-e),++o,n.next?this.head=n.next:this.head=this.tail=null):(en(r,new Zb(s.buffer,s.byteOffset,e),i-e),this.head=n,n.data=s.slice(e));break}++o}while((n=n.next)!==null);return this.length-=o,r}[Symbol.for("nodejs.util.inspect.custom")](e,r){return ew(this,{...r,depth:0,customInspect:!1})}}});var tn=M((iT,dc)=>{"use strict";_();v();m();var{MathFloor:tw,NumberIsInteger:rw}=ce(),{ERR_INVALID_ARG_VALUE:iw}=Se().codes;function nw(t,e,r){return t.highWaterMark!=null?t.highWaterMark:e?t[r]:null}function hc(t){return t?16:16*1024}function sw(t,e,r,i){let n=nw(e,i,r);if(n!=null){if(!rw(n)||n<0){let o=i?`options.${r}`:"options.highWaterMark";throw new iw(o,n)}return tw(n)}return hc(t.objectMode)}dc.exports={getHighWaterMark:sw,getDefaultHighWaterMark:hc}});function yc(t){var e=t.length;if(e%4>0)throw new Error("Invalid string. Length must be a multiple of 4");var r=t.indexOf("=");return r===-1&&(r=e),[r,r===e?0:4-r%4]}function ow(t,e,r){for(var i,n,o=[],s=e;s<r;s+=3)i=(t[s]<<16&16711680)+(t[s+1]<<8&65280)+(255&t[s+2]),o.push($e[(n=i)>>18&63]+$e[n>>12&63]+$e[n>>6&63]+$e[63&n]);return o.join("")}function vt(t){if(t>2147483647)throw new RangeError('The value "'+t+'" is invalid for option "size"');var e=new Uint8Array(t);return Object.setPrototypeOf(e,k.prototype),e}function k(t,e,r){if(typeof t=="number"){if(typeof e=="string")throw new TypeError('The "string" argument must be of type string. Received type number');return $s(t)}return Tc(t,e,r)}function Tc(t,e,r){if(typeof t=="string")return function(o,s){if(typeof s=="string"&&s!==""||(s="utf8"),!k.isEncoding(s))throw new TypeError("Unknown encoding: "+s);var a=0|Cc(o,s),u=vt(a),c=u.write(o,s);return c!==a&&(u=u.slice(0,c)),u}(t,e);if(ArrayBuffer.isView(t))return js(t);if(t==null)throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof t);if(Et(t,ArrayBuffer)||t&&Et(t.buffer,ArrayBuffer)||typeof SharedArrayBuffer<"u"&&(Et(t,SharedArrayBuffer)||t&&Et(t.buffer,SharedArrayBuffer)))return wc(t,e,r);if(typeof t=="number")throw new TypeError('The "value" argument must not be of type number. Received type number');var i=t.valueOf&&t.valueOf();if(i!=null&&i!==t)return k.from(i,e,r);var n=function(o){if(k.isBuffer(o)){var s=0|zs(o.length),a=vt(s);return a.length===0||o.copy(a,0,0,s),a}if(o.length!==void 0)return typeof o.length!="number"||Ks(o.length)?vt(0):js(o);if(o.type==="Buffer"&&Array.isArray(o.data))return js(o.data)}(t);if(n)return n;if(typeof Symbol<"u"&&Symbol.toPrimitive!=null&&typeof t[Symbol.toPrimitive]=="function")return k.from(t[Symbol.toPrimitive]("string"),e,r);throw new TypeError("The first argument must be one of type string, Buffer, ArrayBuffer, Array, or Array-like Object. Received type "+typeof t)}function Rc(t){if(typeof t!="number")throw new TypeError('"size" argument must be of type number');if(t<0)throw new RangeError('The value "'+t+'" is invalid for option "size"')}function $s(t){return Rc(t),vt(t<0?0:0|zs(t))}function js(t){for(var e=t.length<0?0:0|zs(t.length),r=vt(e),i=0;i<e;i+=1)r[i]=255&t[i];return r}function wc(t,e,r){if(e<0||t.byteLength<e)throw new RangeError('"offset" is outside of buffer bounds');if(t.byteLength<e+(r||0))throw new RangeError('"length" is outside of buffer bounds');var i;return i=e===void 0&&r===void 0?new Uint8Array(t):r===void 0?new Uint8Array(t,e):new Uint8Array(t,e,r),Object.setPrototypeOf(i,k.prototype),i}function zs(t){if(t>=2147483647)throw new RangeError("Attempt to allocate Buffer larger than maximum size: 0x"+2147483647 .toString(16)+" bytes");return 0|t}function Cc(t,e){if(k.isBuffer(t))return t.length;if(ArrayBuffer.isView(t)||Et(t,ArrayBuffer))return t.byteLength;if(typeof t!="string")throw new TypeError('The "string" argument must be one of type string, Buffer, or ArrayBuffer. Received type '+typeof t);var r=t.length,i=arguments.length>2&&arguments[2]===!0;if(!i&&r===0)return 0;for(var n=!1;;)switch(e){case"ascii":case"latin1":case"binary":return r;case"utf8":case"utf-8":return Hs(t).length;case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return 2*r;case"hex":return r>>>1;case"base64":return xc(t).length;default:if(n)return i?-1:Hs(t).length;e=(""+e).toLowerCase(),n=!0}}function lw(t,e,r){var i=!1;if((e===void 0||e<0)&&(e=0),e>this.length||((r===void 0||r>this.length)&&(r=this.length),r<=0)||(r>>>=0)<=(e>>>=0))return"";for(t||(t="utf8");;)switch(t){case"hex":return bw(this,e,r);case"utf8":case"utf-8":return Pc(this,e,r);case"ascii":return gw(this,e,r);case"latin1":case"binary":return yw(this,e,r);case"base64":return pw(this,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return ww(this,e,r);default:if(i)throw new TypeError("Unknown encoding: "+t);t=(t+"").toLowerCase(),i=!0}}function sr(t,e,r){var i=t[e];t[e]=t[r],t[r]=i}function _c(t,e,r,i,n){if(t.length===0)return-1;if(typeof r=="string"?(i=r,r=0):r>2147483647?r=2147483647:r<-2147483648&&(r=-2147483648),Ks(r=+r)&&(r=n?0:t.length-1),r<0&&(r=t.length+r),r>=t.length){if(n)return-1;r=t.length-1}else if(r<0){if(!n)return-1;r=0}if(typeof e=="string"&&(e=k.from(e,i)),k.isBuffer(e))return e.length===0?-1:mc(t,e,r,i,n);if(typeof e=="number")return e&=255,typeof Uint8Array.prototype.indexOf=="function"?n?Uint8Array.prototype.indexOf.call(t,e,r):Uint8Array.prototype.lastIndexOf.call(t,e,r):mc(t,[e],r,i,n);throw new TypeError("val must be string, number or Buffer")}function mc(t,e,r,i,n){var o,s=1,a=t.length,u=e.length;if(i!==void 0&&((i=String(i).toLowerCase())==="ucs2"||i==="ucs-2"||i==="utf16le"||i==="utf-16le")){if(t.length<2||e.length<2)return-1;s=2,a/=2,u/=2,r/=2}function c(y,w){return s===1?y[w]:y.readUInt16BE(w*s)}if(n){var h=-1;for(o=r;o<a;o++)if(c(t,o)===c(e,h===-1?0:o-h)){if(h===-1&&(h=o),o-h+1===u)return h*s}else h!==-1&&(o-=o-h),h=-1}else for(r+u>a&&(r=a-u),o=r;o>=0;o--){for(var d=!0,g=0;g<u;g++)if(c(t,o+g)!==c(e,g)){d=!1;break}if(d)return o}return-1}function uw(t,e,r,i){r=Number(r)||0;var n=t.length-r;i?(i=Number(i))>n&&(i=n):i=n;var o=e.length;i>o/2&&(i=o/2);for(var s=0;s<i;++s){var a=parseInt(e.substr(2*s,2),16);if(Ks(a))return s;t[r+s]=a}return s}function fw(t,e,r,i){return on(Hs(e,t.length-r),t,r,i)}function Bc(t,e,r,i){return on(function(n){for(var o=[],s=0;s<n.length;++s)o.push(255&n.charCodeAt(s));return o}(e),t,r,i)}function cw(t,e,r,i){return Bc(t,e,r,i)}function hw(t,e,r,i){return on(xc(e),t,r,i)}function dw(t,e,r,i){return on(function(n,o){for(var s,a,u,c=[],h=0;h<n.length&&!((o-=2)<0);++h)s=n.charCodeAt(h),a=s>>8,u=s%256,c.push(u),c.push(a);return c}(e,t.length-r),t,r,i)}function pw(t,e,r){return e===0&&r===t.length?Ws.fromByteArray(t):Ws.fromByteArray(t.slice(e,r))}function Pc(t,e,r){r=Math.min(t.length,r);for(var i=[],n=e;n<r;){var o,s,a,u,c=t[n],h=null,d=c>239?4:c>223?3:c>191?2:1;if(n+d<=r)switch(d){case 1:c<128&&(h=c);break;case 2:(192&(o=t[n+1]))==128&&(u=(31&c)<<6|63&o)>127&&(h=u);break;case 3:o=t[n+1],s=t[n+2],(192&o)==128&&(192&s)==128&&(u=(15&c)<<12|(63&o)<<6|63&s)>2047&&(u<55296||u>57343)&&(h=u);break;case 4:o=t[n+1],s=t[n+2],a=t[n+3],(192&o)==128&&(192&s)==128&&(192&a)==128&&(u=(15&c)<<18|(63&o)<<12|(63&s)<<6|63&a)>65535&&u<1114112&&(h=u)}h===null?(h=65533,d=1):h>65535&&(h-=65536,i.push(h>>>10&1023|55296),h=56320|1023&h),i.push(h),n+=d}return function(g){var y=g.length;if(y<=4096)return String.fromCharCode.apply(String,g);for(var w="",E=0;E<y;)w+=String.fromCharCode.apply(String,g.slice(E,E+=4096));return w}(i)}function gw(t,e,r){var i="";r=Math.min(t.length,r);for(var n=e;n<r;++n)i+=String.fromCharCode(127&t[n]);return i}function yw(t,e,r){var i="";r=Math.min(t.length,r);for(var n=e;n<r;++n)i+=String.fromCharCode(t[n]);return i}function bw(t,e,r){var i=t.length;(!e||e<0)&&(e=0),(!r||r<0||r>i)&&(r=i);for(var n="",o=e;o<r;++o)n+=mw[t[o]];return n}function ww(t,e,r){for(var i=t.slice(e,r),n="",o=0;o<i.length;o+=2)n+=String.fromCharCode(i[o]+256*i[o+1]);return n}function ye(t,e,r){if(t%1!=0||t<0)throw new RangeError("offset is not uint");if(t+e>r)throw new RangeError("Trying to access beyond buffer length")}function Pe(t,e,r,i,n,o){if(!k.isBuffer(t))throw new TypeError('"buffer" argument must be a Buffer instance');if(e>n||e<o)throw new RangeError('"value" argument is out of bounds');if(r+i>t.length)throw new RangeError("Index out of range")}function Oc(t,e,r,i,n,o){if(r+i>t.length)throw new RangeError("Index out of range");if(r<0)throw new RangeError("Index out of range")}function vc(t,e,r,i,n){return e=+e,r>>>=0,n||Oc(t,0,r,4),Ur.write(t,e,r,i,23,4),r+4}function Ec(t,e,r,i,n){return e=+e,r>>>=0,n||Oc(t,0,r,8),Ur.write(t,e,r,i,52,8),r+8}function Hs(t,e){var r;e=e||1/0;for(var i=t.length,n=null,o=[],s=0;s<i;++s){if((r=t.charCodeAt(s))>55295&&r<57344){if(!n){if(r>56319){(e-=3)>-1&&o.push(239,191,189);continue}if(s+1===i){(e-=3)>-1&&o.push(239,191,189);continue}n=r;continue}if(r<56320){(e-=3)>-1&&o.push(239,191,189),n=r;continue}r=65536+(n-55296<<10|r-56320)}else n&&(e-=3)>-1&&o.push(239,191,189);if(n=null,r<128){if((e-=1)<0)break;o.push(r)}else if(r<2048){if((e-=2)<0)break;o.push(r>>6|192,63&r|128)}else if(r<65536){if((e-=3)<0)break;o.push(r>>12|224,r>>6&63|128,63&r|128)}else{if(!(r<1114112))throw new Error("Invalid code point");if((e-=4)<0)break;o.push(r>>18|240,r>>12&63|128,r>>6&63|128,63&r|128)}}return o}function xc(t){return Ws.toByteArray(function(e){if((e=(e=e.split("=")[0]).trim().replace(_w,"")).length<2)return"";for(;e.length%4!=0;)e+="=";return e}(t))}function on(t,e,r,i){for(var n=0;n<i&&!(n+r>=e.length||n>=t.length);++n)e[n+r]=t[n];return n}function Et(t,e){return t instanceof e||t!=null&&t.constructor!=null&&t.constructor.name!=null&&t.constructor.name===e.name}function Ks(t){return t!=t}function Sc(t,e){for(var r in t)e[r]=t[r]}function or(t,e,r){return it(t,e,r)}function ci(t){var e;switch(this.encoding=function(r){var i=function(n){if(!n)return"utf8";for(var o;;)switch(n){case"utf8":case"utf-8":return"utf8";case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return"utf16le";case"latin1":case"binary":return"latin1";case"base64":case"ascii":case"hex":return n;default:if(o)return;n=(""+n).toLowerCase(),o=!0}}(r);if(typeof i!="string"&&(Vs.isEncoding===Ac||!Ac(r)))throw new Error("Unknown encoding: "+r);return i||r}(t),this.encoding){case"utf16le":this.text=Sw,this.end=Aw,e=4;break;case"utf8":this.fillLast=Ew,e=4;break;case"base64":this.text=Iw,this.end=Tw,e=3;break;default:return this.write=Rw,this.end=Cw,void 0}this.lastNeed=0,this.lastTotal=0,this.lastChar=Vs.allocUnsafe(e)}function Fs(t){return t<=127?0:t>>5==6?2:t>>4==14?3:t>>3==30?4:t>>6==2?-1:-2}function Ew(t){var e=this.lastTotal-this.lastNeed,r=function(i,n,o){if((192&n[0])!=128)return i.lastNeed=0,"\uFFFD";if(i.lastNeed>1&&n.length>1){if((192&n[1])!=128)return i.lastNeed=1,"\uFFFD";if(i.lastNeed>2&&n.length>2&&(192&n[2])!=128)return i.lastNeed=2,"\uFFFD"}}(this,t);return r!==void 0?r:this.lastNeed<=t.length?(t.copy(this.lastChar,e,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal)):(t.copy(this.lastChar,e,0,t.length),this.lastNeed-=t.length,void 0)}function Sw(t,e){if((t.length-e)%2==0){var r=t.toString("utf16le",e);if(r){var i=r.charCodeAt(r.length-1);if(i>=55296&&i<=56319)return this.lastNeed=2,this.lastTotal=4,this.lastChar[0]=t[t.length-2],this.lastChar[1]=t[t.length-1],r.slice(0,-1)}return r}return this.lastNeed=1,this.lastTotal=2,this.lastChar[0]=t[t.length-1],t.toString("utf16le",e,t.length-1)}function Aw(t){var e=t&&t.length?this.write(t):"";if(this.lastNeed){var r=this.lastTotal-this.lastNeed;return e+this.lastChar.toString("utf16le",0,r)}return e}function Iw(t,e){var r=(t.length-e)%3;return r===0?t.toString("base64",e):(this.lastNeed=3-r,this.lastTotal=3,r===1?this.lastChar[0]=t[t.length-1]:(this.lastChar[0]=t[t.length-2],this.lastChar[1]=t[t.length-1]),t.toString("base64",e,t.length-r))}function Tw(t){var e=t&&t.length?this.write(t):"";return this.lastNeed?e+this.lastChar.toString("base64",0,3-this.lastNeed):e}function Rw(t){return t.toString(this.encoding)}function Cw(t){return t&&t.length?this.write(t):""}var Ic,$e,xe,pc,rn,nr,gc,aw,St,Ws,Ur,bc,_w,mw,nn,sn,it,vw,ar,Vs,Ac,Gs=be(()=>{_();v();m();for(Ic={byteLength:function(t){var e=yc(t),r=e[0],i=e[1];return 3*(r+i)/4-i},toByteArray:function(t){var e,r,i=yc(t),n=i[0],o=i[1],s=new pc(function(c,h,d){return 3*(h+d)/4-d}(0,n,o)),a=0,u=o>0?n-4:n;for(r=0;r<u;r+=4)e=xe[t.charCodeAt(r)]<<18|xe[t.charCodeAt(r+1)]<<12|xe[t.charCodeAt(r+2)]<<6|xe[t.charCodeAt(r+3)],s[a++]=e>>16&255,s[a++]=e>>8&255,s[a++]=255&e;return o===2&&(e=xe[t.charCodeAt(r)]<<2|xe[t.charCodeAt(r+1)]>>4,s[a++]=255&e),o===1&&(e=xe[t.charCodeAt(r)]<<10|xe[t.charCodeAt(r+1)]<<4|xe[t.charCodeAt(r+2)]>>2,s[a++]=e>>8&255,s[a++]=255&e),s},fromByteArray:function(t){for(var e,r=t.length,i=r%3,n=[],o=0,s=r-i;o<s;o+=16383)n.push(ow(t,o,o+16383>s?s:o+16383));return i===1?(e=t[r-1],n.push($e[e>>2]+$e[e<<4&63]+"==")):i===2&&(e=(t[r-2]<<8)+t[r-1],n.push($e[e>>10]+$e[e>>4&63]+$e[e<<2&63]+"=")),n.join("")}},$e=[],xe=[],pc=typeof Uint8Array<"u"?Uint8Array:Array,rn="ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",nr=0,gc=rn.length;nr<gc;++nr)$e[nr]=rn[nr],xe[rn.charCodeAt(nr)]=nr;xe["-".charCodeAt(0)]=62,xe["_".charCodeAt(0)]=63;aw={read:function(t,e,r,i,n){var o,s,a=8*n-i-1,u=(1<<a)-1,c=u>>1,h=-7,d=r?n-1:0,g=r?-1:1,y=t[e+d];for(d+=g,o=y&(1<<-h)-1,y>>=-h,h+=a;h>0;o=256*o+t[e+d],d+=g,h-=8);for(s=o&(1<<-h)-1,o>>=-h,h+=i;h>0;s=256*s+t[e+d],d+=g,h-=8);if(o===0)o=1-c;else{if(o===u)return s?NaN:1/0*(y?-1:1);s+=Math.pow(2,i),o-=c}return(y?-1:1)*s*Math.pow(2,o-i)},write:function(t,e,r,i,n,o){var s,a,u,c=8*o-n-1,h=(1<<c)-1,d=h>>1,g=n===23?Math.pow(2,-24)-Math.pow(2,-77):0,y=i?0:o-1,w=i?1:-1,E=e<0||e===0&&1/e<0?1:0;for(e=Math.abs(e),isNaN(e)||e===1/0?(a=isNaN(e)?1:0,s=h):(s=Math.floor(Math.log(e)/Math.LN2),e*(u=Math.pow(2,-s))<1&&(s--,u*=2),(e+=s+d>=1?g/u:g*Math.pow(2,1-d))*u>=2&&(s++,u/=2),s+d>=h?(a=0,s=h):s+d>=1?(a=(e*u-1)*Math.pow(2,n),s+=d):(a=e*Math.pow(2,d-1)*Math.pow(2,n),s=0));n>=8;t[r+y]=255&a,y+=w,a/=256,n-=8);for(s=s<<n|a,c+=n;c>0;t[r+y]=255&s,y+=w,s/=256,c-=8);t[r+y-w]|=128*E}},St={},Ws=Ic,Ur=aw,bc=typeof Symbol=="function"&&typeof Symbol.for=="function"?Symbol.for("nodejs.util.inspect.custom"):null;St.Buffer=k,St.SlowBuffer=function(t){return+t!=t&&(t=0),k.alloc(+t)},St.INSPECT_MAX_BYTES=50;St.kMaxLength=2147483647,k.TYPED_ARRAY_SUPPORT=function(){try{var t=new Uint8Array(1),e={foo:function(){return 42}};return Object.setPrototypeOf(e,Uint8Array.prototype),Object.setPrototypeOf(t,e),t.foo()===42}catch{return!1}}(),k.TYPED_ARRAY_SUPPORT||typeof console>"u"||typeof console.error!="function"||console.error("This browser lacks typed array (Uint8Array) support which is required by `buffer` v5.x. Use `buffer` v4.x if you require old browser support."),Object.defineProperty(k.prototype,"parent",{enumerable:!0,get:function(){if(k.isBuffer(this))return this.buffer}}),Object.defineProperty(k.prototype,"offset",{enumerable:!0,get:function(){if(k.isBuffer(this))return this.byteOffset}}),k.poolSize=8192,k.from=function(t,e,r){return Tc(t,e,r)},Object.setPrototypeOf(k.prototype,Uint8Array.prototype),Object.setPrototypeOf(k,Uint8Array),k.alloc=function(t,e,r){return function(i,n,o){return Rc(i),i<=0?vt(i):n!==void 0?typeof o=="string"?vt(i).fill(n,o):vt(i).fill(n):vt(i)}(t,e,r)},k.allocUnsafe=function(t){return $s(t)},k.allocUnsafeSlow=function(t){return $s(t)},k.isBuffer=function(t){return t!=null&&t._isBuffer===!0&&t!==k.prototype},k.compare=function(t,e){if(Et(t,Uint8Array)&&(t=k.from(t,t.offset,t.byteLength)),Et(e,Uint8Array)&&(e=k.from(e,e.offset,e.byteLength)),!k.isBuffer(t)||!k.isBuffer(e))throw new TypeError('The "buf1", "buf2" arguments must be one of type Buffer or Uint8Array');if(t===e)return 0;for(var r=t.length,i=e.length,n=0,o=Math.min(r,i);n<o;++n)if(t[n]!==e[n]){r=t[n],i=e[n];break}return r<i?-1:i<r?1:0},k.isEncoding=function(t){switch(String(t).toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"latin1":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return!0;default:return!1}},k.concat=function(t,e){if(!Array.isArray(t))throw new TypeError('"list" argument must be an Array of Buffers');if(t.length===0)return k.alloc(0);var r;if(e===void 0)for(e=0,r=0;r<t.length;++r)e+=t[r].length;var i=k.allocUnsafe(e),n=0;for(r=0;r<t.length;++r){var o=t[r];if(Et(o,Uint8Array)&&(o=k.from(o)),!k.isBuffer(o))throw new TypeError('"list" argument must be an Array of Buffers');o.copy(i,n),n+=o.length}return i},k.byteLength=Cc,k.prototype._isBuffer=!0,k.prototype.swap16=function(){var t=this.length;if(t%2!=0)throw new RangeError("Buffer size must be a multiple of 16-bits");for(var e=0;e<t;e+=2)sr(this,e,e+1);return this},k.prototype.swap32=function(){var t=this.length;if(t%4!=0)throw new RangeError("Buffer size must be a multiple of 32-bits");for(var e=0;e<t;e+=4)sr(this,e,e+3),sr(this,e+1,e+2);return this},k.prototype.swap64=function(){var t=this.length;if(t%8!=0)throw new RangeError("Buffer size must be a multiple of 64-bits");for(var e=0;e<t;e+=8)sr(this,e,e+7),sr(this,e+1,e+6),sr(this,e+2,e+5),sr(this,e+3,e+4);return this},k.prototype.toString=function(){var t=this.length;return t===0?"":arguments.length===0?Pc(this,0,t):lw.apply(this,arguments)},k.prototype.toLocaleString=k.prototype.toString,k.prototype.equals=function(t){if(!k.isBuffer(t))throw new TypeError("Argument must be a Buffer");return this===t||k.compare(this,t)===0},k.prototype.inspect=function(){var t="",e=St.INSPECT_MAX_BYTES;return t=this.toString("hex",0,e).replace(/(.{2})/g,"$1 ").trim(),this.length>e&&(t+=" ... "),"<Buffer "+t+">"},bc&&(k.prototype[bc]=k.prototype.inspect),k.prototype.compare=function(t,e,r,i,n){if(Et(t,Uint8Array)&&(t=k.from(t,t.offset,t.byteLength)),!k.isBuffer(t))throw new TypeError('The "target" argument must be one of type Buffer or Uint8Array. Received type '+typeof t);if(e===void 0&&(e=0),r===void 0&&(r=t?t.length:0),i===void 0&&(i=0),n===void 0&&(n=this.length),e<0||r>t.length||i<0||n>this.length)throw new RangeError("out of range index");if(i>=n&&e>=r)return 0;if(i>=n)return-1;if(e>=r)return 1;if(this===t)return 0;for(var o=(n>>>=0)-(i>>>=0),s=(r>>>=0)-(e>>>=0),a=Math.min(o,s),u=this.slice(i,n),c=t.slice(e,r),h=0;h<a;++h)if(u[h]!==c[h]){o=u[h],s=c[h];break}return o<s?-1:s<o?1:0},k.prototype.includes=function(t,e,r){return this.indexOf(t,e,r)!==-1},k.prototype.indexOf=function(t,e,r){return _c(this,t,e,r,!0)},k.prototype.lastIndexOf=function(t,e,r){return _c(this,t,e,r,!1)},k.prototype.write=function(t,e,r,i){if(e===void 0)i="utf8",r=this.length,e=0;else if(r===void 0&&typeof e=="string")i=e,r=this.length,e=0;else{if(!isFinite(e))throw new Error("Buffer.write(string, encoding, offset[, length]) is no longer supported");e>>>=0,isFinite(r)?(r>>>=0,i===void 0&&(i="utf8")):(i=r,r=void 0)}var n=this.length-e;if((r===void 0||r>n)&&(r=n),t.length>0&&(r<0||e<0)||e>this.length)throw new RangeError("Attempt to write outside buffer bounds");i||(i="utf8");for(var o=!1;;)switch(i){case"hex":return uw(this,t,e,r);case"utf8":case"utf-8":return fw(this,t,e,r);case"ascii":return Bc(this,t,e,r);case"latin1":case"binary":return cw(this,t,e,r);case"base64":return hw(this,t,e,r);case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":return dw(this,t,e,r);default:if(o)throw new TypeError("Unknown encoding: "+i);i=(""+i).toLowerCase(),o=!0}},k.prototype.toJSON=function(){return{type:"Buffer",data:Array.prototype.slice.call(this._arr||this,0)}};k.prototype.slice=function(t,e){var r=this.length;(t=~~t)<0?(t+=r)<0&&(t=0):t>r&&(t=r),(e=e===void 0?r:~~e)<0?(e+=r)<0&&(e=0):e>r&&(e=r),e<t&&(e=t);var i=this.subarray(t,e);return Object.setPrototypeOf(i,k.prototype),i},k.prototype.readUIntLE=function(t,e,r){t>>>=0,e>>>=0,r||ye(t,e,this.length);for(var i=this[t],n=1,o=0;++o<e&&(n*=256);)i+=this[t+o]*n;return i},k.prototype.readUIntBE=function(t,e,r){t>>>=0,e>>>=0,r||ye(t,e,this.length);for(var i=this[t+--e],n=1;e>0&&(n*=256);)i+=this[t+--e]*n;return i},k.prototype.readUInt8=function(t,e){return t>>>=0,e||ye(t,1,this.length),this[t]},k.prototype.readUInt16LE=function(t,e){return t>>>=0,e||ye(t,2,this.length),this[t]|this[t+1]<<8},k.prototype.readUInt16BE=function(t,e){return t>>>=0,e||ye(t,2,this.length),this[t]<<8|this[t+1]},k.prototype.readUInt32LE=function(t,e){return t>>>=0,e||ye(t,4,this.length),(this[t]|this[t+1]<<8|this[t+2]<<16)+16777216*this[t+3]},k.prototype.readUInt32BE=function(t,e){return t>>>=0,e||ye(t,4,this.length),16777216*this[t]+(this[t+1]<<16|this[t+2]<<8|this[t+3])},k.prototype.readIntLE=function(t,e,r){t>>>=0,e>>>=0,r||ye(t,e,this.length);for(var i=this[t],n=1,o=0;++o<e&&(n*=256);)i+=this[t+o]*n;return i>=(n*=128)&&(i-=Math.pow(2,8*e)),i},k.prototype.readIntBE=function(t,e,r){t>>>=0,e>>>=0,r||ye(t,e,this.length);for(var i=e,n=1,o=this[t+--i];i>0&&(n*=256);)o+=this[t+--i]*n;return o>=(n*=128)&&(o-=Math.pow(2,8*e)),o},k.prototype.readInt8=function(t,e){return t>>>=0,e||ye(t,1,this.length),128&this[t]?-1*(255-this[t]+1):this[t]},k.prototype.readInt16LE=function(t,e){t>>>=0,e||ye(t,2,this.length);var r=this[t]|this[t+1]<<8;return 32768&r?4294901760|r:r},k.prototype.readInt16BE=function(t,e){t>>>=0,e||ye(t,2,this.length);var r=this[t+1]|this[t]<<8;return 32768&r?4294901760|r:r},k.prototype.readInt32LE=function(t,e){return t>>>=0,e||ye(t,4,this.length),this[t]|this[t+1]<<8|this[t+2]<<16|this[t+3]<<24},k.prototype.readInt32BE=function(t,e){return t>>>=0,e||ye(t,4,this.length),this[t]<<24|this[t+1]<<16|this[t+2]<<8|this[t+3]},k.prototype.readFloatLE=function(t,e){return t>>>=0,e||ye(t,4,this.length),Ur.read(this,t,!0,23,4)},k.prototype.readFloatBE=function(t,e){return t>>>=0,e||ye(t,4,this.length),Ur.read(this,t,!1,23,4)},k.prototype.readDoubleLE=function(t,e){return t>>>=0,e||ye(t,8,this.length),Ur.read(this,t,!0,52,8)},k.prototype.readDoubleBE=function(t,e){return t>>>=0,e||ye(t,8,this.length),Ur.read(this,t,!1,52,8)},k.prototype.writeUIntLE=function(t,e,r,i){t=+t,e>>>=0,r>>>=0,i||Pe(this,t,e,r,Math.pow(2,8*r)-1,0);var n=1,o=0;for(this[e]=255&t;++o<r&&(n*=256);)this[e+o]=t/n&255;return e+r},k.prototype.writeUIntBE=function(t,e,r,i){t=+t,e>>>=0,r>>>=0,i||Pe(this,t,e,r,Math.pow(2,8*r)-1,0);var n=r-1,o=1;for(this[e+n]=255&t;--n>=0&&(o*=256);)this[e+n]=t/o&255;return e+r},k.prototype.writeUInt8=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,1,255,0),this[e]=255&t,e+1},k.prototype.writeUInt16LE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,2,65535,0),this[e]=255&t,this[e+1]=t>>>8,e+2},k.prototype.writeUInt16BE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,2,65535,0),this[e]=t>>>8,this[e+1]=255&t,e+2},k.prototype.writeUInt32LE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,4,4294967295,0),this[e+3]=t>>>24,this[e+2]=t>>>16,this[e+1]=t>>>8,this[e]=255&t,e+4},k.prototype.writeUInt32BE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,4,4294967295,0),this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t,e+4},k.prototype.writeIntLE=function(t,e,r,i){if(t=+t,e>>>=0,!i){var n=Math.pow(2,8*r-1);Pe(this,t,e,r,n-1,-n)}var o=0,s=1,a=0;for(this[e]=255&t;++o<r&&(s*=256);)t<0&&a===0&&this[e+o-1]!==0&&(a=1),this[e+o]=(t/s>>0)-a&255;return e+r},k.prototype.writeIntBE=function(t,e,r,i){if(t=+t,e>>>=0,!i){var n=Math.pow(2,8*r-1);Pe(this,t,e,r,n-1,-n)}var o=r-1,s=1,a=0;for(this[e+o]=255&t;--o>=0&&(s*=256);)t<0&&a===0&&this[e+o+1]!==0&&(a=1),this[e+o]=(t/s>>0)-a&255;return e+r},k.prototype.writeInt8=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,1,127,-128),t<0&&(t=255+t+1),this[e]=255&t,e+1},k.prototype.writeInt16LE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,2,32767,-32768),this[e]=255&t,this[e+1]=t>>>8,e+2},k.prototype.writeInt16BE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,2,32767,-32768),this[e]=t>>>8,this[e+1]=255&t,e+2},k.prototype.writeInt32LE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,4,2147483647,-2147483648),this[e]=255&t,this[e+1]=t>>>8,this[e+2]=t>>>16,this[e+3]=t>>>24,e+4},k.prototype.writeInt32BE=function(t,e,r){return t=+t,e>>>=0,r||Pe(this,t,e,4,2147483647,-2147483648),t<0&&(t=4294967295+t+1),this[e]=t>>>24,this[e+1]=t>>>16,this[e+2]=t>>>8,this[e+3]=255&t,e+4},k.prototype.writeFloatLE=function(t,e,r){return vc(this,t,e,!0,r)},k.prototype.writeFloatBE=function(t,e,r){return vc(this,t,e,!1,r)},k.prototype.writeDoubleLE=function(t,e,r){return Ec(this,t,e,!0,r)},k.prototype.writeDoubleBE=function(t,e,r){return Ec(this,t,e,!1,r)},k.prototype.copy=function(t,e,r,i){if(!k.isBuffer(t))throw new TypeError("argument should be a Buffer");if(r||(r=0),i||i===0||(i=this.length),e>=t.length&&(e=t.length),e||(e=0),i>0&&i<r&&(i=r),i===r||t.length===0||this.length===0)return 0;if(e<0)throw new RangeError("targetStart out of bounds");if(r<0||r>=this.length)throw new RangeError("Index out of range");if(i<0)throw new RangeError("sourceEnd out of bounds");i>this.length&&(i=this.length),t.length-e<i-r&&(i=t.length-e+r);var n=i-r;if(this===t&&typeof Uint8Array.prototype.copyWithin=="function")this.copyWithin(e,r,i);else if(this===t&&r<e&&e<i)for(var o=n-1;o>=0;--o)t[o+e]=this[o+r];else Uint8Array.prototype.set.call(t,this.subarray(r,i),e);return n},k.prototype.fill=function(t,e,r,i){if(typeof t=="string"){if(typeof e=="string"?(i=e,e=0,r=this.length):typeof r=="string"&&(i=r,r=this.length),i!==void 0&&typeof i!="string")throw new TypeError("encoding must be a string");if(typeof i=="string"&&!k.isEncoding(i))throw new TypeError("Unknown encoding: "+i);if(t.length===1){var n=t.charCodeAt(0);(i==="utf8"&&n<128||i==="latin1")&&(t=n)}}else typeof t=="number"?t&=255:typeof t=="boolean"&&(t=Number(t));if(e<0||this.length<e||this.length<r)throw new RangeError("Out of range index");if(r<=e)return this;var o;if(e>>>=0,r=r===void 0?this.length:r>>>0,t||(t=0),typeof t=="number")for(o=e;o<r;++o)this[o]=t;else{var s=k.isBuffer(t)?t:k.from(t,i),a=s.length;if(a===0)throw new TypeError('The value "'+t+'" is invalid for argument "value"');for(o=0;o<r-e;++o)this[o+e]=s[o%a]}return this};_w=/[^+/0-9A-Za-z-_]/g;mw=function(){for(var t=new Array(256),e=0;e<16;++e)for(var r=16*e,i=0;i<16;++i)t[r+i]="0123456789abcdef"[e]+"0123456789abcdef"[i];return t}();St.Buffer;St.INSPECT_MAX_BYTES;St.kMaxLength;nn={},sn=St,it=sn.Buffer;it.from&&it.alloc&&it.allocUnsafe&&it.allocUnsafeSlow?nn=sn:(Sc(sn,nn),nn.Buffer=or),or.prototype=Object.create(it.prototype),Sc(it,or),or.from=function(t,e,r){if(typeof t=="number")throw new TypeError("Argument must not be a number");return it(t,e,r)},or.alloc=function(t,e,r){if(typeof t!="number")throw new TypeError("Argument must be a number");var i=it(t);return e!==void 0?typeof r=="string"?i.fill(e,r):i.fill(e):i.fill(0),i},or.allocUnsafe=function(t){if(typeof t!="number")throw new TypeError("Argument must be a number");return it(t)},or.allocUnsafeSlow=function(t){if(typeof t!="number")throw new TypeError("Argument must be a number");return sn.SlowBuffer(t)};vw=nn,ar={},Vs=vw.Buffer,Ac=Vs.isEncoding||function(t){switch((t=""+t)&&t.toLowerCase()){case"hex":case"utf8":case"utf-8":case"ascii":case"binary":case"base64":case"ucs2":case"ucs-2":case"utf16le":case"utf-16le":case"raw":return!0;default:return!1}};ar.StringDecoder=ci,ci.prototype.write=function(t){if(t.length===0)return"";var e,r;if(this.lastNeed){if((e=this.fillLast(t))===void 0)return"";r=this.lastNeed,this.lastNeed=0}else r=0;return r<t.length?e?e+this.text(t,r):this.text(t,r):e||""},ci.prototype.end=function(t){var e=t&&t.length?this.write(t):"";return this.lastNeed?e+"\uFFFD":e},ci.prototype.text=function(t,e){var r=function(n,o,s){var a=o.length-1;if(a<s)return 0;var u=Fs(o[a]);return u>=0?(u>0&&(n.lastNeed=u-1),u):--a<s||u===-2?0:(u=Fs(o[a]))>=0?(u>0&&(n.lastNeed=u-2),u):--a<s||u===-2?0:(u=Fs(o[a]))>=0?(u>0&&(u===2?u=0:n.lastNeed=u-3),u):0}(this,t,e);if(!this.lastNeed)return t.toString("utf8",e);this.lastTotal=r;var i=t.length-(r-this.lastNeed);return t.copy(this.lastChar,0,i),t.toString("utf8",e,i)},ci.prototype.fillLast=function(t){if(this.lastNeed<=t.length)return t.copy(this.lastChar,this.lastTotal-this.lastNeed,0,this.lastNeed),this.lastChar.toString(this.encoding,0,this.lastTotal);t.copy(this.lastChar,this.lastTotal-this.lastNeed,0,t.length),this.lastNeed-=t.length};ar.StringDecoder;ar.StringDecoder});var kc={};Qt(kc,{StringDecoder:()=>Bw,default:()=>ar});var Bw,Mc=be(()=>{_();v();m();Gs();Gs();Bw=ar.StringDecoder});var Qs=M((IT,qc)=>{"use strict";_();v();m();var Lc=Ut(),{PromisePrototypeThen:Pw,SymbolAsyncIterator:Uc,SymbolIterator:Nc}=ce(),{Buffer:Ow}=(we(),Z(ve)),{ERR_INVALID_ARG_TYPE:xw,ERR_STREAM_NULL_VALUES:kw}=Se().codes;function Mw(t,e,r){let i;if(typeof e=="string"||e instanceof Ow)return new t({objectMode:!0,...r,read(){this.push(e),this.push(null)}});let n;if(e&&e[Uc])n=!0,i=e[Uc]();else if(e&&e[Nc])n=!1,i=e[Nc]();else throw new xw("iterable",["Iterable"],e);let o=new t({objectMode:!0,highWaterMark:1,...r}),s=!1;o._read=function(){s||(s=!0,u())},o._destroy=function(c,h){Pw(a(c),()=>Lc.nextTick(h,c),d=>Lc.nextTick(h,d||c))};async function a(c){let h=c!=null,d=typeof i.throw=="function";if(h&&d){let{value:g,done:y}=await i.throw(c);if(await g,y)return}if(typeof i.return=="function"){let{value:g}=await i.return();await g}}async function u(){for(;;){try{let{value:c,done:h}=n?await i.next():i.next();if(h)o.push(null);else{let d=c&&typeof c.then=="function"?await c:c;if(d===null)throw s=!1,new kw;if(o.push(d))continue;s=!1}}catch(c){o.destroy(c)}break}}return o}qc.exports=Mw});var hi=M((xT,Jc)=>{_();v();m();var He=Ut(),{ArrayPrototypeIndexOf:Lw,NumberIsInteger:Uw,NumberIsNaN:Nw,NumberParseInt:qw,ObjectDefineProperties:Fc,ObjectKeys:Dw,ObjectSetPrototypeOf:Wc,Promise:jw,SafeSet:Fw,SymbolAsyncIterator:Ww,Symbol:$w}=ce();Jc.exports=F;F.ReadableState=to;var{EventEmitter:Hw}=(ir(),Z(rr)),{Stream:qt,prependListener:Vw}=Xi(),{Buffer:Ys}=(we(),Z(ve)),{addAbortSignal:zw}=fi(),Kw=mt(),H=Je().debuglog("stream",t=>{H=t}),Gw=cc(),qr=tr(),{getHighWaterMark:Qw,getDefaultHighWaterMark:Yw}=tn(),{aggregateTwoErrors:Dc,codes:{ERR_INVALID_ARG_TYPE:Jw,ERR_METHOD_NOT_IMPLEMENTED:Xw,ERR_OUT_OF_RANGE:Zw,ERR_STREAM_PUSH_AFTER_EOF:e_,ERR_STREAM_UNSHIFT_AFTER_END_EVENT:t_}}=Se(),{validateObject:r_}=ui(),lr=$w("kPaused"),{StringDecoder:$c}=(Mc(),Z(kc)),i_=Qs();Wc(F.prototype,qt.prototype);Wc(F,qt);var Js=()=>{},{errorOrDestroy:Nr}=qr;function to(t,e,r){typeof r!="boolean"&&(r=e instanceof nt()),this.objectMode=!!(t&&t.objectMode),r&&(this.objectMode=this.objectMode||!!(t&&t.readableObjectMode)),this.highWaterMark=t?Qw(this,t,"readableHighWaterMark",r):Yw(!1),this.buffer=new Gw,this.length=0,this.pipes=[],this.flowing=null,this.ended=!1,this.endEmitted=!1,this.reading=!1,this.constructed=!0,this.sync=!0,this.needReadable=!1,this.emittedReadable=!1,this.readableListening=!1,this.resumeScheduled=!1,this[lr]=null,this.errorEmitted=!1,this.emitClose=!t||t.emitClose!==!1,this.autoDestroy=!t||t.autoDestroy!==!1,this.destroyed=!1,this.errored=null,this.closed=!1,this.closeEmitted=!1,this.defaultEncoding=t&&t.defaultEncoding||"utf8",this.awaitDrainWriters=null,this.multiAwaitDrain=!1,this.readingMore=!1,this.dataEmitted=!1,this.decoder=null,this.encoding=null,t&&t.encoding&&(this.decoder=new $c(t.encoding),this.encoding=t.encoding)}function F(t){if(!(this instanceof F))return new F(t);let e=this instanceof nt();this._readableState=new to(t,this,e),t&&(typeof t.read=="function"&&(this._read=t.read),typeof t.destroy=="function"&&(this._destroy=t.destroy),typeof t.construct=="function"&&(this._construct=t.construct),t.signal&&!e&&zw(t.signal,this)),qt.call(this,t),qr.construct(this,()=>{this._readableState.needReadable&&an(this,this._readableState)})}F.prototype.destroy=qr.destroy;F.prototype._undestroy=qr.undestroy;F.prototype._destroy=function(t,e){e(t)};F.prototype[Hw.captureRejectionSymbol]=function(t){this.destroy(t)};F.prototype.push=function(t,e){return Hc(this,t,e,!1)};F.prototype.unshift=function(t,e){return Hc(this,t,e,!0)};function Hc(t,e,r,i){H("readableAddChunk",e);let n=t._readableState,o;if(n.objectMode||(typeof e=="string"?(r=r||n.defaultEncoding,n.encoding!==r&&(i&&n.encoding?e=Ys.from(e,r).toString(n.encoding):(e=Ys.from(e,r),r=""))):e instanceof Ys?r="":qt._isUint8Array(e)?(e=qt._uint8ArrayToBuffer(e),r=""):e!=null&&(o=new Jw("chunk",["string","Buffer","Uint8Array"],e))),o)Nr(t,o);else if(e===null)n.reading=!1,o_(t,n);else if(n.objectMode||e&&e.length>0)if(i)if(n.endEmitted)Nr(t,new t_);else{if(n.destroyed||n.errored)return!1;Xs(t,n,e,!0)}else if(n.ended)Nr(t,new e_);else{if(n.destroyed||n.errored)return!1;n.reading=!1,n.decoder&&!r?(e=n.decoder.write(e),n.objectMode||e.length!==0?Xs(t,n,e,!1):an(t,n)):Xs(t,n,e,!1)}else i||(n.reading=!1,an(t,n));return!n.ended&&(n.length<n.highWaterMark||n.length===0)}function Xs(t,e,r,i){e.flowing&&e.length===0&&!e.sync&&t.listenerCount("data")>0?(e.multiAwaitDrain?e.awaitDrainWriters.clear():e.awaitDrainWriters=null,e.dataEmitted=!0,t.emit("data",r)):(e.length+=e.objectMode?1:r.length,i?e.buffer.unshift(r):e.buffer.push(r),e.needReadable&&ln(t)),an(t,e)}F.prototype.isPaused=function(){let t=this._readableState;return t[lr]===!0||t.flowing===!1};F.prototype.setEncoding=function(t){let e=new $c(t);this._readableState.decoder=e,this._readableState.encoding=this._readableState.decoder.encoding;let r=this._readableState.buffer,i="";for(let n of r)i+=e.write(n);return r.clear(),i!==""&&r.push(i),this._readableState.length=i.length,this};var n_=1073741824;function s_(t){if(t>n_)throw new Zw("size","<= 1GiB",t);return t--,t|=t>>>1,t|=t>>>2,t|=t>>>4,t|=t>>>8,t|=t>>>16,t++,t}function jc(t,e){return t<=0||e.length===0&&e.ended?0:e.objectMode?1:Nw(t)?e.flowing&&e.length?e.buffer.first().length:e.length:t<=e.length?t:e.ended?e.length:0}F.prototype.read=function(t){H("read",t),t===void 0?t=NaN:Uw(t)||(t=qw(t,10));let e=this._readableState,r=t;if(t>e.highWaterMark&&(e.highWaterMark=s_(t)),t!==0&&(e.emittedReadable=!1),t===0&&e.needReadable&&((e.highWaterMark!==0?e.length>=e.highWaterMark:e.length>0)||e.ended))return H("read: emitReadable",e.length,e.ended),e.length===0&&e.ended?Zs(this):ln(this),null;if(t=jc(t,e),t===0&&e.ended)return e.length===0&&Zs(this),null;let i=e.needReadable;if(H("need readable",i),(e.length===0||e.length-t<e.highWaterMark)&&(i=!0,H("length less than watermark",i)),e.ended||e.reading||e.destroyed||e.errored||!e.constructed)i=!1,H("reading, ended or constructing",i);else if(i){H("do read"),e.reading=!0,e.sync=!0,e.length===0&&(e.needReadable=!0);try{this._read(e.highWaterMark)}catch(o){Nr(this,o)}e.sync=!1,e.reading||(t=jc(r,e))}let n;return t>0?n=Qc(t,e):n=null,n===null?(e.needReadable=e.length<=e.highWaterMark,t=0):(e.length-=t,e.multiAwaitDrain?e.awaitDrainWriters.clear():e.awaitDrainWriters=null),e.length===0&&(e.ended||(e.needReadable=!0),r!==t&&e.ended&&Zs(this)),n!==null&&!e.errorEmitted&&!e.closeEmitted&&(e.dataEmitted=!0,this.emit("data",n)),n};function o_(t,e){if(H("onEofChunk"),!e.ended){if(e.decoder){let r=e.decoder.end();r&&r.length&&(e.buffer.push(r),e.length+=e.objectMode?1:r.length)}e.ended=!0,e.sync?ln(t):(e.needReadable=!1,e.emittedReadable=!0,Vc(t))}}function ln(t){let e=t._readableState;H("emitReadable",e.needReadable,e.emittedReadable),e.needReadable=!1,e.emittedReadable||(H("emitReadable",e.flowing),e.emittedReadable=!0,He.nextTick(Vc,t))}function Vc(t){let e=t._readableState;H("emitReadable_",e.destroyed,e.length,e.ended),!e.destroyed&&!e.errored&&(e.length||e.ended)&&(t.emit("readable"),e.emittedReadable=!1),e.needReadable=!e.flowing&&!e.ended&&e.length<=e.highWaterMark,Kc(t)}function an(t,e){!e.readingMore&&e.constructed&&(e.readingMore=!0,He.nextTick(a_,t,e))}function a_(t,e){for(;!e.reading&&!e.ended&&(e.length<e.highWaterMark||e.flowing&&e.length===0);){let r=e.length;if(H("maybeReadMore read 0"),t.read(0),r===e.length)break}e.readingMore=!1}F.prototype._read=function(t){throw new Xw("_read()")};F.prototype.pipe=function(t,e){let r=this,i=this._readableState;i.pipes.length===1&&(i.multiAwaitDrain||(i.multiAwaitDrain=!0,i.awaitDrainWriters=new Fw(i.awaitDrainWriters?[i.awaitDrainWriters]:[]))),i.pipes.push(t),H("pipe count=%d opts=%j",i.pipes.length,e);let o=(!e||e.end!==!1)&&t!==He.stdout&&t!==He.stderr?a:S;i.endEmitted?He.nextTick(o):r.once("end",o),t.on("unpipe",s);function s(I,C){H("onunpipe"),I===r&&C&&C.hasUnpiped===!1&&(C.hasUnpiped=!0,h())}function a(){H("onend"),t.end()}let u,c=!1;function h(){H("cleanup"),t.removeListener("close",w),t.removeListener("finish",E),u&&t.removeListener("drain",u),t.removeListener("error",y),t.removeListener("unpipe",s),r.removeListener("end",a),r.removeListener("end",S),r.removeListener("data",g),c=!0,u&&i.awaitDrainWriters&&(!t._writableState||t._writableState.needDrain)&&u()}function d(){c||(i.pipes.length===1&&i.pipes[0]===t?(H("false write response, pause",0),i.awaitDrainWriters=t,i.multiAwaitDrain=!1):i.pipes.length>1&&i.pipes.includes(t)&&(H("false write response, pause",i.awaitDrainWriters.size),i.awaitDrainWriters.add(t)),r.pause()),u||(u=l_(r,t),t.on("drain",u))}r.on("data",g);function g(I){H("ondata");let C=t.write(I);H("dest.write",C),C===!1&&d()}function y(I){if(H("onerror",I),S(),t.removeListener("error",y),t.listenerCount("error")===0){let C=t._writableState||t._readableState;C&&!C.errorEmitted?Nr(t,I):t.emit("error",I)}}Vw(t,"error",y);function w(){t.removeListener("finish",E),S()}t.once("close",w);function E(){H("onfinish"),t.removeListener("close",w),S()}t.once("finish",E);function S(){H("unpipe"),r.unpipe(t)}return t.emit("pipe",r),t.writableNeedDrain===!0?i.flowing&&d():i.flowing||(H("pipe resume"),r.resume()),t};function l_(t,e){return function(){let i=t._readableState;i.awaitDrainWriters===e?(H("pipeOnDrain",1),i.awaitDrainWriters=null):i.multiAwaitDrain&&(H("pipeOnDrain",i.awaitDrainWriters.size),i.awaitDrainWriters.delete(e)),(!i.awaitDrainWriters||i.awaitDrainWriters.size===0)&&t.listenerCount("data")&&t.resume()}}F.prototype.unpipe=function(t){let e=this._readableState,r={hasUnpiped:!1};if(e.pipes.length===0)return this;if(!t){let n=e.pipes;e.pipes=[],this.pause();for(let o=0;o<n.length;o++)n[o].emit("unpipe",this,{hasUnpiped:!1});return this}let i=Lw(e.pipes,t);return i===-1?this:(e.pipes.splice(i,1),e.pipes.length===0&&this.pause(),t.emit("unpipe",this,r),this)};F.prototype.on=function(t,e){let r=qt.prototype.on.call(this,t,e),i=this._readableState;return t==="data"?(i.readableListening=this.listenerCount("readable")>0,i.flowing!==!1&&this.resume()):t==="readable"&&!i.endEmitted&&!i.readableListening&&(i.readableListening=i.needReadable=!0,i.flowing=!1,i.emittedReadable=!1,H("on readable",i.length,i.reading),i.length?ln(this):i.reading||He.nextTick(u_,this)),r};F.prototype.addListener=F.prototype.on;F.prototype.removeListener=function(t,e){let r=qt.prototype.removeListener.call(this,t,e);return t==="readable"&&He.nextTick(zc,this),r};F.prototype.off=F.prototype.removeListener;F.prototype.removeAllListeners=function(t){let e=qt.prototype.removeAllListeners.apply(this,arguments);return(t==="readable"||t===void 0)&&He.nextTick(zc,this),e};function zc(t){let e=t._readableState;e.readableListening=t.listenerCount("readable")>0,e.resumeScheduled&&e[lr]===!1?e.flowing=!0:t.listenerCount("data")>0?t.resume():e.readableListening||(e.flowing=null)}function u_(t){H("readable nexttick read 0"),t.read(0)}F.prototype.resume=function(){let t=this._readableState;return t.flowing||(H("resume"),t.flowing=!t.readableListening,f_(this,t)),t[lr]=!1,this};function f_(t,e){e.resumeScheduled||(e.resumeScheduled=!0,He.nextTick(c_,t,e))}function c_(t,e){H("resume",e.reading),e.reading||t.read(0),e.resumeScheduled=!1,t.emit("resume"),Kc(t),e.flowing&&!e.reading&&t.read(0)}F.prototype.pause=function(){return H("call pause flowing=%j",this._readableState.flowing),this._readableState.flowing!==!1&&(H("pause"),this._readableState.flowing=!1,this.emit("pause")),this._readableState[lr]=!0,this};function Kc(t){let e=t._readableState;for(H("flow",e.flowing);e.flowing&&t.read()!==null;);}F.prototype.wrap=function(t){let e=!1;t.on("data",i=>{!this.push(i)&&t.pause&&(e=!0,t.pause())}),t.on("end",()=>{this.push(null)}),t.on("error",i=>{Nr(this,i)}),t.on("close",()=>{this.destroy()}),t.on("destroy",()=>{this.destroy()}),this._read=()=>{e&&t.resume&&(e=!1,t.resume())};let r=Dw(t);for(let i=1;i<r.length;i++){let n=r[i];this[n]===void 0&&typeof t[n]=="function"&&(this[n]=t[n].bind(t))}return this};F.prototype[Ww]=function(){return Gc(this)};F.prototype.iterator=function(t){return t!==void 0&&r_(t,"options"),Gc(this,t)};function Gc(t,e){typeof t.read!="function"&&(t=F.wrap(t,{objectMode:!0}));let r=h_(t,e);return r.stream=t,r}async function*h_(t,e){let r=Js;function i(s){this===t?(r(),r=Js):r=s}t.on("readable",i);let n,o=Kw(t,{writable:!1},s=>{n=s?Dc(n,s):null,r(),r=Js});try{for(;;){let s=t.destroyed?null:t.read();if(s!==null)yield s;else{if(n)throw n;if(n===null)return;await new jw(i)}}}catch(s){throw n=Dc(n,s),n}finally{(n||e?.destroyOnReturn!==!1)&&(n===void 0||t._readableState.autoDestroy)?qr.destroyer(t,null):(t.off("readable",i),o())}}Fc(F.prototype,{readable:{__proto__:null,get(){let t=this._readableState;return!!t&&t.readable!==!1&&!t.destroyed&&!t.errorEmitted&&!t.endEmitted},set(t){this._readableState&&(this._readableState.readable=!!t)}},readableDidRead:{__proto__:null,enumerable:!1,get:function(){return this._readableState.dataEmitted}},readableAborted:{__proto__:null,enumerable:!1,get:function(){return!!(this._readableState.readable!==!1&&(this._readableState.destroyed||this._readableState.errored)&&!this._readableState.endEmitted)}},readableHighWaterMark:{__proto__:null,enumerable:!1,get:function(){return this._readableState.highWaterMark}},readableBuffer:{__proto__:null,enumerable:!1,get:function(){return this._readableState&&this._readableState.buffer}},readableFlowing:{__proto__:null,enumerable:!1,get:function(){return this._readableState.flowing},set:function(t){this._readableState&&(this._readableState.flowing=t)}},readableLength:{__proto__:null,enumerable:!1,get(){return this._readableState.length}},readableObjectMode:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.objectMode:!1}},readableEncoding:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.encoding:null}},errored:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.errored:null}},closed:{__proto__:null,get(){return this._readableState?this._readableState.closed:!1}},destroyed:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.destroyed:!1},set(t){this._readableState&&(this._readableState.destroyed=t)}},readableEnded:{__proto__:null,enumerable:!1,get(){return this._readableState?this._readableState.endEmitted:!1}}});Fc(to.prototype,{pipesCount:{__proto__:null,get(){return this.pipes.length}},paused:{__proto__:null,get(){return this[lr]!==!1},set(t){this[lr]=!!t}}});F._fromList=Qc;function Qc(t,e){if(e.length===0)return null;let r;return e.objectMode?r=e.buffer.shift():!t||t>=e.length?(e.decoder?r=e.buffer.join(""):e.buffer.length===1?r=e.buffer.first():r=e.buffer.concat(e.length),e.buffer.clear()):r=e.buffer.consume(t,e.decoder),r}function Zs(t){let e=t._readableState;H("endReadable",e.endEmitted),e.endEmitted||(e.ended=!0,He.nextTick(d_,e,t))}function d_(t,e){if(H("endReadableNT",t.endEmitted,t.length),!t.errored&&!t.closeEmitted&&!t.endEmitted&&t.length===0){if(t.endEmitted=!0,e.emit("end"),e.writable&&e.allowHalfOpen===!1)He.nextTick(p_,e);else if(t.autoDestroy){let r=e._writableState;(!r||r.autoDestroy&&(r.finished||r.writable===!1))&&e.destroy()}}}function p_(t){t.writable&&!t.writableEnded&&!t.destroyed&&t.end()}F.from=function(t,e){return i_(F,t,e)};var eo;function Yc(){return eo===void 0&&(eo={}),eo}F.fromWeb=function(t,e){return Yc().newStreamReadableFromReadableStream(t,e)};F.toWeb=function(t,e){return Yc().newReadableStreamFromStreamReadable(t,e)};F.wrap=function(t,e){var r,i;return new F({objectMode:(r=(i=t.readableObjectMode)!==null&&i!==void 0?i:t.objectMode)!==null&&r!==void 0?r:!0,...e,destroy(n,o){qr.destroyer(t,n),o(n)}}).wrap(t)}});var lo=M((DT,uh)=>{_();v();m();var ur=Ut(),{ArrayPrototypeSlice:eh,Error:g_,FunctionPrototypeSymbolHasInstance:th,ObjectDefineProperty:rh,ObjectDefineProperties:y_,ObjectSetPrototypeOf:ih,StringPrototypeToLowerCase:b_,Symbol:w_,SymbolHasInstance:__}=ce();uh.exports=ie;ie.WritableState=gi;var{EventEmitter:m_}=(ir(),Z(rr)),di=Xi().Stream,{Buffer:un}=(we(),Z(ve)),hn=tr(),{addAbortSignal:v_}=fi(),{getHighWaterMark:E_,getDefaultHighWaterMark:S_}=tn(),{ERR_INVALID_ARG_TYPE:A_,ERR_METHOD_NOT_IMPLEMENTED:I_,ERR_MULTIPLE_CALLBACK:nh,ERR_STREAM_CANNOT_PIPE:T_,ERR_STREAM_DESTROYED:pi,ERR_STREAM_ALREADY_FINISHED:R_,ERR_STREAM_NULL_VALUES:C_,ERR_STREAM_WRITE_AFTER_END:B_,ERR_UNKNOWN_ENCODING:sh}=Se().codes,{errorOrDestroy:Dr}=hn;ih(ie.prototype,di.prototype);ih(ie,di);function no(){}var jr=w_("kOnFinished");function gi(t,e,r){typeof r!="boolean"&&(r=e instanceof nt()),this.objectMode=!!(t&&t.objectMode),r&&(this.objectMode=this.objectMode||!!(t&&t.writableObjectMode)),this.highWaterMark=t?E_(this,t,"writableHighWaterMark",r):S_(!1),this.finalCalled=!1,this.needDrain=!1,this.ending=!1,this.ended=!1,this.finished=!1,this.destroyed=!1;let i=!!(t&&t.decodeStrings===!1);this.decodeStrings=!i,this.defaultEncoding=t&&t.defaultEncoding||"utf8",this.length=0,this.writing=!1,this.corked=0,this.sync=!0,this.bufferProcessing=!1,this.onwrite=O_.bind(void 0,e),this.writecb=null,this.writelen=0,this.afterWriteTickInfo=null,cn(this),this.pendingcb=0,this.constructed=!0,this.prefinished=!1,this.errorEmitted=!1,this.emitClose=!t||t.emitClose!==!1,this.autoDestroy=!t||t.autoDestroy!==!1,this.errored=null,this.closed=!1,this.closeEmitted=!1,this[jr]=[]}function cn(t){t.buffered=[],t.bufferedIndex=0,t.allBuffers=!0,t.allNoop=!0}gi.prototype.getBuffer=function(){return eh(this.buffered,this.bufferedIndex)};rh(gi.prototype,"bufferedRequestCount",{__proto__:null,get(){return this.buffered.length-this.bufferedIndex}});function ie(t){let e=this instanceof nt();if(!e&&!th(ie,this))return new ie(t);this._writableState=new gi(t,this,e),t&&(typeof t.write=="function"&&(this._write=t.write),typeof t.writev=="function"&&(this._writev=t.writev),typeof t.destroy=="function"&&(this._destroy=t.destroy),typeof t.final=="function"&&(this._final=t.final),typeof t.construct=="function"&&(this._construct=t.construct),t.signal&&v_(t.signal,this)),di.call(this,t),hn.construct(this,()=>{let r=this._writableState;r.writing||oo(this,r),ao(this,r)})}rh(ie,__,{__proto__:null,value:function(t){return th(this,t)?!0:this!==ie?!1:t&&t._writableState instanceof gi}});ie.prototype.pipe=function(){Dr(this,new T_)};function oh(t,e,r,i){let n=t._writableState;if(typeof r=="function")i=r,r=n.defaultEncoding;else{if(!r)r=n.defaultEncoding;else if(r!=="buffer"&&!un.isEncoding(r))throw new sh(r);typeof i!="function"&&(i=no)}if(e===null)throw new C_;if(!n.objectMode)if(typeof e=="string")n.decodeStrings!==!1&&(e=un.from(e,r),r="buffer");else if(e instanceof un)r="buffer";else if(di._isUint8Array(e))e=di._uint8ArrayToBuffer(e),r="buffer";else throw new A_("chunk",["string","Buffer","Uint8Array"],e);let o;return n.ending?o=new B_:n.destroyed&&(o=new pi("write")),o?(ur.nextTick(i,o),Dr(t,o,!0),o):(n.pendingcb++,P_(t,n,e,r,i))}ie.prototype.write=function(t,e,r){return oh(this,t,e,r)===!0};ie.prototype.cork=function(){this._writableState.corked++};ie.prototype.uncork=function(){let t=this._writableState;t.corked&&(t.corked--,t.writing||oo(this,t))};ie.prototype.setDefaultEncoding=function(e){if(typeof e=="string"&&(e=b_(e)),!un.isEncoding(e))throw new sh(e);return this._writableState.defaultEncoding=e,this};function P_(t,e,r,i,n){let o=e.objectMode?1:r.length;e.length+=o;let s=e.length<e.highWaterMark;return s||(e.needDrain=!0),e.writing||e.corked||e.errored||!e.constructed?(e.buffered.push({chunk:r,encoding:i,callback:n}),e.allBuffers&&i!=="buffer"&&(e.allBuffers=!1),e.allNoop&&n!==no&&(e.allNoop=!1)):(e.writelen=o,e.writecb=n,e.writing=!0,e.sync=!0,t._write(r,i,e.onwrite),e.sync=!1),s&&!e.errored&&!e.destroyed}function Xc(t,e,r,i,n,o,s){e.writelen=i,e.writecb=s,e.writing=!0,e.sync=!0,e.destroyed?e.onwrite(new pi("write")):r?t._writev(n,e.onwrite):t._write(n,o,e.onwrite),e.sync=!1}function Zc(t,e,r,i){--e.pendingcb,i(r),so(e),Dr(t,r)}function O_(t,e){let r=t._writableState,i=r.sync,n=r.writecb;if(typeof n!="function"){Dr(t,new nh);return}r.writing=!1,r.writecb=null,r.length-=r.writelen,r.writelen=0,e?(e.stack,r.errored||(r.errored=e),t._readableState&&!t._readableState.errored&&(t._readableState.errored=e),i?ur.nextTick(Zc,t,r,e,n):Zc(t,r,e,n)):(r.buffered.length>r.bufferedIndex&&oo(t,r),i?r.afterWriteTickInfo!==null&&r.afterWriteTickInfo.cb===n?r.afterWriteTickInfo.count++:(r.afterWriteTickInfo={count:1,cb:n,stream:t,state:r},ur.nextTick(x_,r.afterWriteTickInfo)):ah(t,r,1,n))}function x_({stream:t,state:e,count:r,cb:i}){return e.afterWriteTickInfo=null,ah(t,e,r,i)}function ah(t,e,r,i){for(!e.ending&&!t.destroyed&&e.length===0&&e.needDrain&&(e.needDrain=!1,t.emit("drain"));r-- >0;)e.pendingcb--,i();e.destroyed&&so(e),ao(t,e)}function so(t){if(t.writing)return;for(let n=t.bufferedIndex;n<t.buffered.length;++n){var e;let{chunk:o,callback:s}=t.buffered[n],a=t.objectMode?1:o.length;t.length-=a,s((e=t.errored)!==null&&e!==void 0?e:new pi("write"))}let r=t[jr].splice(0);for(let n=0;n<r.length;n++){var i;r[n]((i=t.errored)!==null&&i!==void 0?i:new pi("end"))}cn(t)}function oo(t,e){if(e.corked||e.bufferProcessing||e.destroyed||!e.constructed)return;let{buffered:r,bufferedIndex:i,objectMode:n}=e,o=r.length-i;if(!o)return;let s=i;if(e.bufferProcessing=!0,o>1&&t._writev){e.pendingcb-=o-1;let a=e.allNoop?no:c=>{for(let h=s;h<r.length;++h)r[h].callback(c)},u=e.allNoop&&s===0?r:eh(r,s);u.allBuffers=e.allBuffers,Xc(t,e,!0,e.length,u,"",a),cn(e)}else{do{let{chunk:a,encoding:u,callback:c}=r[s];r[s++]=null;let h=n?1:a.length;Xc(t,e,!1,h,a,u,c)}while(s<r.length&&!e.writing);s===r.length?cn(e):s>256?(r.splice(0,s),e.bufferedIndex=0):e.bufferedIndex=s}e.bufferProcessing=!1}ie.prototype._write=function(t,e,r){if(this._writev)this._writev([{chunk:t,encoding:e}],r);else throw new I_("_write()")};ie.prototype._writev=null;ie.prototype.end=function(t,e,r){let i=this._writableState;typeof t=="function"?(r=t,t=null,e=null):typeof e=="function"&&(r=e,e=null);let n;if(t!=null){let o=oh(this,t,e);o instanceof g_&&(n=o)}return i.corked&&(i.corked=1,this.uncork()),n||(!i.errored&&!i.ending?(i.ending=!0,ao(this,i,!0),i.ended=!0):i.finished?n=new R_("end"):i.destroyed&&(n=new pi("end"))),typeof r=="function"&&(n||i.finished?ur.nextTick(r,n):i[jr].push(r)),this};function fn(t){return t.ending&&!t.destroyed&&t.constructed&&t.length===0&&!t.errored&&t.buffered.length===0&&!t.finished&&!t.writing&&!t.errorEmitted&&!t.closeEmitted}function k_(t,e){let r=!1;function i(n){if(r){Dr(t,n??nh());return}if(r=!0,e.pendingcb--,n){let o=e[jr].splice(0);for(let s=0;s<o.length;s++)o[s](n);Dr(t,n,e.sync)}else fn(e)&&(e.prefinished=!0,t.emit("prefinish"),e.pendingcb++,ur.nextTick(io,t,e))}e.sync=!0,e.pendingcb++;try{t._final(i)}catch(n){i(n)}e.sync=!1}function M_(t,e){!e.prefinished&&!e.finalCalled&&(typeof t._final=="function"&&!e.destroyed?(e.finalCalled=!0,k_(t,e)):(e.prefinished=!0,t.emit("prefinish")))}function ao(t,e,r){fn(e)&&(M_(t,e),e.pendingcb===0&&(r?(e.pendingcb++,ur.nextTick((i,n)=>{fn(n)?io(i,n):n.pendingcb--},t,e)):fn(e)&&(e.pendingcb++,io(t,e))))}function io(t,e){e.pendingcb--,e.finished=!0;let r=e[jr].splice(0);for(let i=0;i<r.length;i++)r[i]();if(t.emit("finish"),e.autoDestroy){let i=t._readableState;(!i||i.autoDestroy&&(i.endEmitted||i.readable===!1))&&t.destroy()}}y_(ie.prototype,{closed:{__proto__:null,get(){return this._writableState?this._writableState.closed:!1}},destroyed:{__proto__:null,get(){return this._writableState?this._writableState.destroyed:!1},set(t){this._writableState&&(this._writableState.destroyed=t)}},writable:{__proto__:null,get(){let t=this._writableState;return!!t&&t.writable!==!1&&!t.destroyed&&!t.errored&&!t.ending&&!t.ended},set(t){this._writableState&&(this._writableState.writable=!!t)}},writableFinished:{__proto__:null,get(){return this._writableState?this._writableState.finished:!1}},writableObjectMode:{__proto__:null,get(){return this._writableState?this._writableState.objectMode:!1}},writableBuffer:{__proto__:null,get(){return this._writableState&&this._writableState.getBuffer()}},writableEnded:{__proto__:null,get(){return this._writableState?this._writableState.ending:!1}},writableNeedDrain:{__proto__:null,get(){let t=this._writableState;return t?!t.destroyed&&!t.ending&&t.needDrain:!1}},writableHighWaterMark:{__proto__:null,get(){return this._writableState&&this._writableState.highWaterMark}},writableCorked:{__proto__:null,get(){return this._writableState?this._writableState.corked:0}},writableLength:{__proto__:null,get(){return this._writableState&&this._writableState.length}},errored:{__proto__:null,enumerable:!1,get(){return this._writableState?this._writableState.errored:null}},writableAborted:{__proto__:null,enumerable:!1,get:function(){return!!(this._writableState.writable!==!1&&(this._writableState.destroyed||this._writableState.errored)&&!this._writableState.finished)}}});var L_=hn.destroy;ie.prototype.destroy=function(t,e){let r=this._writableState;return!r.destroyed&&(r.bufferedIndex<r.buffered.length||r[jr].length)&&ur.nextTick(so,r),L_.call(this,t,e),this};ie.prototype._undestroy=hn.undestroy;ie.prototype._destroy=function(t,e){e(t)};ie.prototype[m_.captureRejectionSymbol]=function(t){this.destroy(t)};var ro;function lh(){return ro===void 0&&(ro={}),ro}ie.fromWeb=function(t,e){return lh().newStreamWritableFromWritableStream(t,e)};ie.toWeb=function(t){return lh().newWritableStreamFromStreamWritable(t)}});var vh=M((zT,mh)=>{_();v();m();var uo=Ut(),U_=(we(),Z(ve)),{isReadable:N_,isWritable:q_,isIterable:fh,isNodeStream:D_,isReadableNodeStream:ch,isWritableNodeStream:hh,isDuplexNodeStream:j_}=tt(),dh=mt(),{AbortError:_h,codes:{ERR_INVALID_ARG_TYPE:F_,ERR_INVALID_RETURN_VALUE:ph}}=Se(),{destroyer:Fr}=tr(),W_=nt(),$_=hi(),{createDeferredPromise:gh}=Je(),yh=Qs(),bh=globalThis.Blob||U_.Blob,H_=typeof bh<"u"?function(e){return e instanceof bh}:function(e){return!1},V_=globalThis.AbortController||Fi().AbortController,{FunctionPrototypeCall:wh}=ce(),fr=class extends W_{constructor(e){super(e),e?.readable===!1&&(this._readableState.readable=!1,this._readableState.ended=!0,this._readableState.endEmitted=!0),e?.writable===!1&&(this._writableState.writable=!1,this._writableState.ending=!0,this._writableState.ended=!0,this._writableState.finished=!0)}};mh.exports=function t(e,r){if(j_(e))return e;if(ch(e))return dn({readable:e});if(hh(e))return dn({writable:e});if(D_(e))return dn({writable:!1,readable:!1});if(typeof e=="function"){let{value:n,write:o,final:s,destroy:a}=z_(e);if(fh(n))return yh(fr,n,{objectMode:!0,write:o,final:s,destroy:a});let u=n?.then;if(typeof u=="function"){let c,h=wh(u,n,d=>{if(d!=null)throw new ph("nully","body",d)},d=>{Fr(c,d)});return c=new fr({objectMode:!0,readable:!1,write:o,final(d){s(async()=>{try{await h,uo.nextTick(d,null)}catch(g){uo.nextTick(d,g)}})},destroy:a})}throw new ph("Iterable, AsyncIterable or AsyncFunction",r,n)}if(H_(e))return t(e.arrayBuffer());if(fh(e))return yh(fr,e,{objectMode:!0,writable:!1});if(typeof e?.writable=="object"||typeof e?.readable=="object"){let n=e!=null&&e.readable?ch(e?.readable)?e?.readable:t(e.readable):void 0,o=e!=null&&e.writable?hh(e?.writable)?e?.writable:t(e.writable):void 0;return dn({readable:n,writable:o})}let i=e?.then;if(typeof i=="function"){let n;return wh(i,e,o=>{o!=null&&n.push(o),n.push(null)},o=>{Fr(n,o)}),n=new fr({objectMode:!0,writable:!1,read(){}})}throw new F_(r,["Blob","ReadableStream","WritableStream","Stream","Iterable","AsyncIterable","Function","{ readable, writable } pair","Promise"],e)};function z_(t){let{promise:e,resolve:r}=gh(),i=new V_,n=i.signal;return{value:t(async function*(){for(;;){let s=e;e=null;let{chunk:a,done:u,cb:c}=await s;if(uo.nextTick(c),u)return;if(n.aborted)throw new _h(void 0,{cause:n.reason});({promise:e,resolve:r}=gh()),yield a}}(),{signal:n}),write(s,a,u){let c=r;r=null,c({chunk:s,done:!1,cb:u})},final(s){let a=r;r=null,a({done:!0,cb:s})},destroy(s,a){i.abort(),a(s)}}}function dn(t){let e=t.readable&&typeof t.readable.read!="function"?$_.wrap(t.readable):t.readable,r=t.writable,i=!!N_(e),n=!!q_(r),o,s,a,u,c;function h(d){let g=u;u=null,g?g(d):d&&c.destroy(d)}return c=new fr({readableObjectMode:!!(e!=null&&e.readableObjectMode),writableObjectMode:!!(r!=null&&r.writableObjectMode),readable:i,writable:n}),n&&(dh(r,d=>{n=!1,d&&Fr(e,d),h(d)}),c._write=function(d,g,y){r.write(d,g)?y():o=y},c._final=function(d){r.end(),s=d},r.on("drain",function(){if(o){let d=o;o=null,d()}}),r.on("finish",function(){if(s){let d=s;s=null,d()}})),i&&(dh(e,d=>{i=!1,d&&Fr(e,d),h(d)}),e.on("readable",function(){if(a){let d=a;a=null,d()}}),e.on("end",function(){c.push(null)}),c._read=function(){for(;;){let d=e.read();if(d===null){a=c._read;return}if(!c.push(d))return}}),c._destroy=function(d,g){!d&&u!==null&&(d=new _h),a=null,o=null,s=null,u===null?g(d):(u=g,Fr(r,d),Fr(e,d))},c}});var nt=M((ZT,Ah)=>{"use strict";_();v();m();var{ObjectDefineProperties:K_,ObjectGetOwnPropertyDescriptor:At,ObjectKeys:G_,ObjectSetPrototypeOf:Eh}=ce();Ah.exports=Ve;var ho=hi(),Ne=lo();Eh(Ve.prototype,ho.prototype);Eh(Ve,ho);{let t=G_(Ne.prototype);for(let e=0;e<t.length;e++){let r=t[e];Ve.prototype[r]||(Ve.prototype[r]=Ne.prototype[r])}}function Ve(t){if(!(this instanceof Ve))return new Ve(t);ho.call(this,t),Ne.call(this,t),t?(this.allowHalfOpen=t.allowHalfOpen!==!1,t.readable===!1&&(this._readableState.readable=!1,this._readableState.ended=!0,this._readableState.endEmitted=!0),t.writable===!1&&(this._writableState.writable=!1,this._writableState.ending=!0,this._writableState.ended=!0,this._writableState.finished=!0)):this.allowHalfOpen=!0}K_(Ve.prototype,{writable:{__proto__:null,...At(Ne.prototype,"writable")},writableHighWaterMark:{__proto__:null,...At(Ne.prototype,"writableHighWaterMark")},writableObjectMode:{__proto__:null,...At(Ne.prototype,"writableObjectMode")},writableBuffer:{__proto__:null,...At(Ne.prototype,"writableBuffer")},writableLength:{__proto__:null,...At(Ne.prototype,"writableLength")},writableFinished:{__proto__:null,...At(Ne.prototype,"writableFinished")},writableCorked:{__proto__:null,...At(Ne.prototype,"writableCorked")},writableEnded:{__proto__:null,...At(Ne.prototype,"writableEnded")},writableNeedDrain:{__proto__:null,...At(Ne.prototype,"writableNeedDrain")},destroyed:{__proto__:null,get(){return this._readableState===void 0||this._writableState===void 0?!1:this._readableState.destroyed&&this._writableState.destroyed},set(t){this._readableState&&this._writableState&&(this._readableState.destroyed=t,this._writableState.destroyed=t)}}});var fo;function Sh(){return fo===void 0&&(fo={}),fo}Ve.fromWeb=function(t,e){return Sh().newStreamDuplexFromReadableWritablePair(t,e)};Ve.toWeb=function(t){return Sh().newReadableWritablePairFromDuplex(t)};var co;Ve.from=function(t){return co||(co=vh()),co(t,"body")}});var yo=M((o2,Th)=>{"use strict";_();v();m();var{ObjectSetPrototypeOf:Ih,Symbol:Q_}=ce();Th.exports=It;var{ERR_METHOD_NOT_IMPLEMENTED:Y_}=Se().codes,go=nt(),{getHighWaterMark:J_}=tn();Ih(It.prototype,go.prototype);Ih(It,go);var yi=Q_("kCallback");function It(t){if(!(this instanceof It))return new It(t);let e=t?J_(this,t,"readableHighWaterMark",!0):null;e===0&&(t={...t,highWaterMark:null,readableHighWaterMark:e,writableHighWaterMark:t.writableHighWaterMark||0}),go.call(this,t),this._readableState.sync=!1,this[yi]=null,t&&(typeof t.transform=="function"&&(this._transform=t.transform),typeof t.flush=="function"&&(this._flush=t.flush)),this.on("prefinish",X_)}function po(t){typeof this._flush=="function"&&!this.destroyed?this._flush((e,r)=>{if(e){t?t(e):this.destroy(e);return}r!=null&&this.push(r),this.push(null),t&&t()}):(this.push(null),t&&t())}function X_(){this._final!==po&&po.call(this)}It.prototype._final=po;It.prototype._transform=function(t,e,r){throw new Y_("_transform()")};It.prototype._write=function(t,e,r){let i=this._readableState,n=this._writableState,o=i.length;this._transform(t,e,(s,a)=>{if(s){r(s);return}a!=null&&this.push(a),n.ended||o===i.length||i.length<i.highWaterMark?r():this[yi]=r})};It.prototype._read=function(){if(this[yi]){let t=this[yi];this[yi]=null,t()}}});var wo=M((d2,Ch)=>{"use strict";_();v();m();var{ObjectSetPrototypeOf:Rh}=ce();Ch.exports=Wr;var bo=yo();Rh(Wr.prototype,bo.prototype);Rh(Wr,bo);function Wr(t){if(!(this instanceof Wr))return new Wr(t);bo.call(this,t)}Wr.prototype._transform=function(t,e,r){r(null,t)}});var bn=M((m2,kh)=>{_();v();m();var bi=Ut(),{ArrayIsArray:Z_,Promise:e0,SymbolAsyncIterator:t0}=ce(),yn=mt(),{once:r0}=Je(),i0=tr(),Bh=nt(),{aggregateTwoErrors:n0,codes:{ERR_INVALID_ARG_TYPE:To,ERR_INVALID_RETURN_VALUE:_o,ERR_MISSING_ARGS:s0,ERR_STREAM_DESTROYED:o0,ERR_STREAM_PREMATURE_CLOSE:a0},AbortError:l0}=Se(),{validateFunction:u0,validateAbortSignal:f0}=ui(),{isIterable:cr,isReadable:mo,isReadableNodeStream:gn,isNodeStream:Ph,isTransformStream:$r,isWebStream:c0,isReadableStream:vo,isReadableEnded:h0}=tt(),d0=globalThis.AbortController||Fi().AbortController,Eo,So;function Oh(t,e,r){let i=!1;t.on("close",()=>{i=!0});let n=yn(t,{readable:e,writable:r},o=>{i=!o});return{destroy:o=>{i||(i=!0,i0.destroyer(t,o||new o0("pipe")))},cleanup:n}}function p0(t){return u0(t[t.length-1],"streams[stream.length - 1]"),t.pop()}function Ao(t){if(cr(t))return t;if(gn(t))return g0(t);throw new To("val",["Readable","Iterable","AsyncIterable"],t)}async function*g0(t){So||(So=hi()),yield*So.prototype[t0].call(t)}async function pn(t,e,r,{end:i}){let n,o=null,s=c=>{if(c&&(n=c),o){let h=o;o=null,h()}},a=()=>new e0((c,h)=>{n?h(n):o=()=>{n?h(n):c()}});e.on("drain",s);let u=yn(e,{readable:!1},s);try{e.writableNeedDrain&&await a();for await(let c of t)e.write(c)||await a();i&&e.end(),await a(),r()}catch(c){r(n!==c?n0(n,c):c)}finally{u(),e.off("drain",s)}}async function Io(t,e,r,{end:i}){$r(e)&&(e=e.writable);let n=e.getWriter();try{for await(let o of t)await n.ready,n.write(o).catch(()=>{});await n.ready,i&&await n.close(),r()}catch(o){try{await n.abort(o),r(o)}catch(s){r(s)}}}function y0(...t){return xh(t,r0(p0(t)))}function xh(t,e,r){if(t.length===1&&Z_(t[0])&&(t=t[0]),t.length<2)throw new s0("streams");let i=new d0,n=i.signal,o=r?.signal,s=[];f0(o,"options.signal");function a(){y(new l0)}o?.addEventListener("abort",a);let u,c,h=[],d=0;function g(C){y(C,--d===0)}function y(C,R){if(C&&(!u||u.code==="ERR_STREAM_PREMATURE_CLOSE")&&(u=C),!(!u&&!R)){for(;h.length;)h.shift()(u);o?.removeEventListener("abort",a),i.abort(),R&&(u||s.forEach(U=>U()),bi.nextTick(e,u,c))}}let w;for(let C=0;C<t.length;C++){let R=t[C],U=C<t.length-1,N=C>0,W=U||r?.end!==!1,K=C===t.length-1;if(Ph(R)){let z=function(G){G&&G.name!=="AbortError"&&G.code!=="ERR_STREAM_PREMATURE_CLOSE"&&g(G)};var I=z;if(W){let{destroy:G,cleanup:de}=Oh(R,U,N);h.push(G),mo(R)&&K&&s.push(de)}R.on("error",z),mo(R)&&K&&s.push(()=>{R.removeListener("error",z)})}if(C===0)if(typeof R=="function"){if(w=R({signal:n}),!cr(w))throw new _o("Iterable, AsyncIterable or Stream","source",w)}else cr(R)||gn(R)||$r(R)?w=R:w=Bh.from(R);else if(typeof R=="function"){if($r(w)){var E;w=Ao((E=w)===null||E===void 0?void 0:E.readable)}else w=Ao(w);if(w=R(w,{signal:n}),U){if(!cr(w,!0))throw new _o("AsyncIterable",`transform[${C-1}]`,w)}else{var S;Eo||(Eo=wo());let z=new Eo({objectMode:!0}),G=(S=w)===null||S===void 0?void 0:S.then;if(typeof G=="function")d++,G.call(w,pe=>{c=pe,pe!=null&&z.write(pe),W&&z.end(),bi.nextTick(g)},pe=>{z.destroy(pe),bi.nextTick(g,pe)});else if(cr(w,!0))d++,pn(w,z,g,{end:W});else if(vo(w)||$r(w)){let pe=w.readable||w;d++,pn(pe,z,g,{end:W})}else throw new _o("AsyncIterable or Promise","destination",w);w=z;let{destroy:de,cleanup:Gt}=Oh(w,!1,!0);h.push(de),K&&s.push(Gt)}}else if(Ph(R)){if(gn(w)){d+=2;let z=b0(w,R,g,{end:W});mo(R)&&K&&s.push(z)}else if($r(w)||vo(w)){let z=w.readable||w;d++,pn(z,R,g,{end:W})}else if(cr(w))d++,pn(w,R,g,{end:W});else throw new To("val",["Readable","Iterable","AsyncIterable","ReadableStream","TransformStream"],w);w=R}else if(c0(R)){if(gn(w))d++,Io(Ao(w),R,g,{end:W});else if(vo(w)||cr(w))d++,Io(w,R,g,{end:W});else if($r(w))d++,Io(w.readable,R,g,{end:W});else throw new To("val",["Readable","Iterable","AsyncIterable","ReadableStream","TransformStream"],w);w=R}else w=Bh.from(R)}return(n!=null&&n.aborted||o!=null&&o.aborted)&&bi.nextTick(a),w}function b0(t,e,r,{end:i}){let n=!1;if(e.on("close",()=>{n||r(new a0)}),t.pipe(e,{end:!1}),i){let s=function(){n=!0,e.end()};var o=s;h0(t)?bi.nextTick(s):t.once("end",s)}else r();return yn(t,{readable:!0,writable:!1},s=>{let a=t._readableState;s&&s.code==="ERR_STREAM_PREMATURE_CLOSE"&&a&&a.ended&&!a.errored&&!a.errorEmitted?t.once("end",r).once("error",r):r(s)}),yn(e,{readable:!1,writable:!0},r)}kh.exports={pipelineImpl:xh,pipeline:y0}});var Co=M((R2,Dh)=>{"use strict";_();v();m();var{pipeline:w0}=bn(),wn=nt(),{destroyer:_0}=tr(),{isNodeStream:_n,isReadable:Mh,isWritable:Lh,isWebStream:Ro,isTransformStream:hr,isWritableStream:Uh,isReadableStream:Nh}=tt(),{AbortError:m0,codes:{ERR_INVALID_ARG_VALUE:qh,ERR_MISSING_ARGS:v0}}=Se(),E0=mt();Dh.exports=function(...e){if(e.length===0)throw new v0("streams");if(e.length===1)return wn.from(e[0]);let r=[...e];if(typeof e[0]=="function"&&(e[0]=wn.from(e[0])),typeof e[e.length-1]=="function"){let y=e.length-1;e[y]=wn.from(e[y])}for(let y=0;y<e.length;++y)if(!(!_n(e[y])&&!Ro(e[y]))){if(y<e.length-1&&!(Mh(e[y])||Nh(e[y])||hr(e[y])))throw new qh(`streams[${y}]`,r[y],"must be readable");if(y>0&&!(Lh(e[y])||Uh(e[y])||hr(e[y])))throw new qh(`streams[${y}]`,r[y],"must be writable")}let i,n,o,s,a;function u(y){let w=s;s=null,w?w(y):y?a.destroy(y):!g&&!d&&a.destroy()}let c=e[0],h=w0(e,u),d=!!(Lh(c)||Uh(c)||hr(c)),g=!!(Mh(h)||Nh(h)||hr(h));if(a=new wn({writableObjectMode:!!(c!=null&&c.writableObjectMode),readableObjectMode:!!(h!=null&&h.writableObjectMode),writable:d,readable:g}),d){if(_n(c))a._write=function(w,E,S){c.write(w,E)?S():i=S},a._final=function(w){c.end(),n=w},c.on("drain",function(){if(i){let w=i;i=null,w()}});else if(Ro(c)){let E=(hr(c)?c.writable:c).getWriter();a._write=async function(S,I,C){try{await E.ready,E.write(S).catch(()=>{}),C()}catch(R){C(R)}},a._final=async function(S){try{await E.ready,E.close().catch(()=>{}),n=S}catch(I){S(I)}}}let y=hr(h)?h.readable:h;E0(y,()=>{if(n){let w=n;n=null,w()}})}if(g){if(_n(h))h.on("readable",function(){if(o){let y=o;o=null,y()}}),h.on("end",function(){a.push(null)}),a._read=function(){for(;;){let y=h.read();if(y===null){o=a._read;return}if(!a.push(y))return}};else if(Ro(h)){let w=(hr(h)?h.readable:h).getReader();a._read=async function(){for(;;)try{let{value:E,done:S}=await w.read();if(!a.push(E))return;if(S){a.push(null);return}}catch{return}}}}return a._destroy=function(y,w){!y&&s!==null&&(y=new m0),o=null,i=null,n=null,s===null?w(y):(s=w,_n(h)&&_0(h,y))},a}});var Kh=M((M2,Oo)=>{"use strict";_();v();m();var $h=globalThis.AbortController||Fi().AbortController,{codes:{ERR_INVALID_ARG_VALUE:S0,ERR_INVALID_ARG_TYPE:wi,ERR_MISSING_ARGS:A0,ERR_OUT_OF_RANGE:I0},AbortError:st}=Se(),{validateAbortSignal:dr,validateInteger:T0,validateObject:pr}=ui(),R0=ce().Symbol("kWeak"),{finished:C0}=mt(),B0=Co(),{addAbortSignalNoValidate:P0}=fi(),{isWritable:O0,isNodeStream:x0}=tt(),{ArrayPrototypePush:k0,MathFloor:M0,Number:L0,NumberIsNaN:U0,Promise:jh,PromiseReject:Fh,PromisePrototypeThen:N0,Symbol:Hh}=ce(),mn=Hh("kEmpty"),Wh=Hh("kEof");function q0(t,e){if(e!=null&&pr(e,"options"),e?.signal!=null&&dr(e.signal,"options.signal"),x0(t)&&!O0(t))throw new S0("stream",t,"must be writable");let r=B0(this,t);return e!=null&&e.signal&&P0(e.signal,r),r}function vn(t,e){if(typeof t!="function")throw new wi("fn",["Function","AsyncFunction"],t);e!=null&&pr(e,"options"),e?.signal!=null&&dr(e.signal,"options.signal");let r=1;return e?.concurrency!=null&&(r=M0(e.concurrency)),T0(r,"concurrency",1),async function*(){var n,o;let s=new $h,a=this,u=[],c=s.signal,h={signal:c},d=()=>s.abort();e!=null&&(n=e.signal)!==null&&n!==void 0&&n.aborted&&d(),e==null||(o=e.signal)===null||o===void 0||o.addEventListener("abort",d);let g,y,w=!1;function E(){w=!0}async function S(){try{for await(let R of a){var I;if(w)return;if(c.aborted)throw new st;try{R=t(R,h)}catch(U){R=Fh(U)}R!==mn&&(typeof((I=R)===null||I===void 0?void 0:I.catch)=="function"&&R.catch(E),u.push(R),g&&(g(),g=null),!w&&u.length&&u.length>=r&&await new jh(U=>{y=U}))}u.push(Wh)}catch(R){let U=Fh(R);N0(U,void 0,E),u.push(U)}finally{var C;w=!0,g&&(g(),g=null),e==null||(C=e.signal)===null||C===void 0||C.removeEventListener("abort",d)}}S();try{for(;;){for(;u.length>0;){let I=await u[0];if(I===Wh)return;if(c.aborted)throw new st;I!==mn&&(yield I),u.shift(),y&&(y(),y=null)}await new jh(I=>{g=I})}}finally{s.abort(),w=!0,y&&(y(),y=null)}}.call(this)}function D0(t=void 0){return t!=null&&pr(t,"options"),t?.signal!=null&&dr(t.signal,"options.signal"),async function*(){let r=0;for await(let n of this){var i;if(t!=null&&(i=t.signal)!==null&&i!==void 0&&i.aborted)throw new st({cause:t.signal.reason});yield[r++,n]}}.call(this)}async function Vh(t,e=void 0){for await(let r of Po.call(this,t,e))return!0;return!1}async function j0(t,e=void 0){if(typeof t!="function")throw new wi("fn",["Function","AsyncFunction"],t);return!await Vh.call(this,async(...r)=>!await t(...r),e)}async function F0(t,e){for await(let r of Po.call(this,t,e))return r}async function W0(t,e){if(typeof t!="function")throw new wi("fn",["Function","AsyncFunction"],t);async function r(i,n){return await t(i,n),mn}for await(let i of vn.call(this,r,e));}function Po(t,e){if(typeof t!="function")throw new wi("fn",["Function","AsyncFunction"],t);async function r(i,n){return await t(i,n)?i:mn}return vn.call(this,r,e)}var Bo=class extends A0{constructor(){super("reduce"),this.message="Reduce of an empty stream requires an initial value"}};async function $0(t,e,r){var i;if(typeof t!="function")throw new wi("reducer",["Function","AsyncFunction"],t);r!=null&&pr(r,"options"),r?.signal!=null&&dr(r.signal,"options.signal");let n=arguments.length>1;if(r!=null&&(i=r.signal)!==null&&i!==void 0&&i.aborted){let c=new st(void 0,{cause:r.signal.reason});throw this.once("error",()=>{}),await C0(this.destroy(c)),c}let o=new $h,s=o.signal;if(r!=null&&r.signal){let c={once:!0,[R0]:this};r.signal.addEventListener("abort",()=>o.abort(),c)}let a=!1;try{for await(let c of this){var u;if(a=!0,r!=null&&(u=r.signal)!==null&&u!==void 0&&u.aborted)throw new st;n?e=await t(e,c,{signal:s}):(e=c,n=!0)}if(!a&&!n)throw new Bo}finally{o.abort()}return e}async function H0(t){t!=null&&pr(t,"options"),t?.signal!=null&&dr(t.signal,"options.signal");let e=[];for await(let i of this){var r;if(t!=null&&(r=t.signal)!==null&&r!==void 0&&r.aborted)throw new st(void 0,{cause:t.signal.reason});k0(e,i)}return e}function V0(t,e){let r=vn.call(this,t,e);return async function*(){for await(let n of r)yield*n}.call(this)}function zh(t){if(t=L0(t),U0(t))return 0;if(t<0)throw new I0("number",">= 0",t);return t}function z0(t,e=void 0){return e!=null&&pr(e,"options"),e?.signal!=null&&dr(e.signal,"options.signal"),t=zh(t),async function*(){var i;if(e!=null&&(i=e.signal)!==null&&i!==void 0&&i.aborted)throw new st;for await(let o of this){var n;if(e!=null&&(n=e.signal)!==null&&n!==void 0&&n.aborted)throw new st;t--<=0&&(yield o)}}.call(this)}function K0(t,e=void 0){return e!=null&&pr(e,"options"),e?.signal!=null&&dr(e.signal,"options.signal"),t=zh(t),async function*(){var i;if(e!=null&&(i=e.signal)!==null&&i!==void 0&&i.aborted)throw new st;for await(let o of this){var n;if(e!=null&&(n=e.signal)!==null&&n!==void 0&&n.aborted)throw new st;if(t-- >0)yield o;else return}}.call(this)}Oo.exports.streamReturningOperators={asIndexedPairs:D0,drop:z0,filter:Po,flatMap:V0,map:vn,take:K0,compose:q0};Oo.exports.promiseReturningOperators={every:j0,forEach:W0,reduce:$0,toArray:H0,some:Vh,find:F0}});var xo=M((F2,Gh)=>{"use strict";_();v();m();var{ArrayPrototypePop:G0,Promise:Q0}=ce(),{isIterable:Y0,isNodeStream:J0,isWebStream:X0}=tt(),{pipelineImpl:Z0}=bn(),{finished:em}=mt();ko();function tm(...t){return new Q0((e,r)=>{let i,n,o=t[t.length-1];if(o&&typeof o=="object"&&!J0(o)&&!Y0(o)&&!X0(o)){let s=G0(t);i=s.signal,n=s.end}Z0(t,(s,a)=>{s?r(s):e(a)},{signal:i,end:n})})}Gh.exports={finished:em,pipeline:tm}});var ko=M((G2,id)=>{_();v();m();var{Buffer:rm}=(we(),Z(ve)),{ObjectDefineProperty:Tt,ObjectKeys:Jh,ReflectApply:Xh}=ce(),{promisify:{custom:Zh}}=Je(),{streamReturningOperators:Qh,promiseReturningOperators:Yh}=Kh(),{codes:{ERR_ILLEGAL_CONSTRUCTOR:ed}}=Se(),im=Co(),{pipeline:td}=bn(),{destroyer:nm}=tr(),rd=mt(),Mo=xo(),Lo=tt(),le=id.exports=Xi().Stream;le.isDisturbed=Lo.isDisturbed;le.isErrored=Lo.isErrored;le.isReadable=Lo.isReadable;le.Readable=hi();for(let t of Jh(Qh)){let r=function(...i){if(new.target)throw ed();return le.Readable.from(Xh(e,this,i))};Uo=r;let e=Qh[t];Tt(r,"name",{__proto__:null,value:e.name}),Tt(r,"length",{__proto__:null,value:e.length}),Tt(le.Readable.prototype,t,{__proto__:null,value:r,enumerable:!1,configurable:!0,writable:!0})}var Uo;for(let t of Jh(Yh)){let r=function(...n){if(new.target)throw ed();return Xh(e,this,n)};Uo=r;let e=Yh[t];Tt(r,"name",{__proto__:null,value:e.name}),Tt(r,"length",{__proto__:null,value:e.length}),Tt(le.Readable.prototype,t,{__proto__:null,value:r,enumerable:!1,configurable:!0,writable:!0})}var Uo;le.Writable=lo();le.Duplex=nt();le.Transform=yo();le.PassThrough=wo();le.pipeline=td;var{addAbortSignal:sm}=fi();le.addAbortSignal=sm;le.finished=rd;le.destroy=nm;le.compose=im;Tt(le,"promises",{__proto__:null,configurable:!0,enumerable:!0,get(){return Mo}});Tt(td,Zh,{__proto__:null,enumerable:!0,get(){return Mo.pipeline}});Tt(rd,Zh,{__proto__:null,enumerable:!0,get(){return Mo.finished}});le.Stream=le;le._isUint8Array=function(e){return e instanceof Uint8Array};le._uint8ArrayToBuffer=function(e){return rm.from(e.buffer,e.byteOffset,e.byteLength)}});var Dt=M((tR,ue)=>{"use strict";_();v();m();var he=ko(),om=xo(),am=he.Readable.destroy;ue.exports=he.Readable;ue.exports._uint8ArrayToBuffer=he._uint8ArrayToBuffer;ue.exports._isUint8Array=he._isUint8Array;ue.exports.isDisturbed=he.isDisturbed;ue.exports.isErrored=he.isErrored;ue.exports.isReadable=he.isReadable;ue.exports.Readable=he.Readable;ue.exports.Writable=he.Writable;ue.exports.Duplex=he.Duplex;ue.exports.Transform=he.Transform;ue.exports.PassThrough=he.PassThrough;ue.exports.addAbortSignal=he.addAbortSignal;ue.exports.finished=he.finished;ue.exports.destroy=he.destroy;ue.exports.destroy=am;ue.exports.pipeline=he.pipeline;ue.exports.compose=he.compose;Object.defineProperty(he,"promises",{configurable:!0,enumerable:!0,get(){return om}});ue.exports.Stream=he.Stream;ue.exports.default=ue.exports});var nd=M((lR,No)=>{_();v();m();typeof Object.create=="function"?No.exports=function(e,r){r&&(e.super_=r,e.prototype=Object.create(r.prototype,{constructor:{value:e,enumerable:!1,writable:!0,configurable:!0}}))}:No.exports=function(e,r){if(r){e.super_=r;var i=function(){};i.prototype=r.prototype,e.prototype=new i,e.prototype.constructor=e}}});var ad=M((gR,od)=>{"use strict";_();v();m();var{Buffer:ze}=(we(),Z(ve)),sd=Symbol.for("BufferList");function ee(t){if(!(this instanceof ee))return new ee(t);ee._init.call(this,t)}ee._init=function(e){Object.defineProperty(this,sd,{value:!0}),this._bufs=[],this.length=0,e&&this.append(e)};ee.prototype._new=function(e){return new ee(e)};ee.prototype._offset=function(e){if(e===0)return[0,0];let r=0;for(let i=0;i<this._bufs.length;i++){let n=r+this._bufs[i].length;if(e<n||i===this._bufs.length-1)return[i,e-r];r=n}};ee.prototype._reverseOffset=function(t){let e=t[0],r=t[1];for(let i=0;i<e;i++)r+=this._bufs[i].length;return r};ee.prototype.get=function(e){if(e>this.length||e<0)return;let r=this._offset(e);return this._bufs[r[0]][r[1]]};ee.prototype.slice=function(e,r){return typeof e=="number"&&e<0&&(e+=this.length),typeof r=="number"&&r<0&&(r+=this.length),this.copy(null,0,e,r)};ee.prototype.copy=function(e,r,i,n){if((typeof i!="number"||i<0)&&(i=0),(typeof n!="number"||n>this.length)&&(n=this.length),i>=this.length||n<=0)return e||ze.alloc(0);let o=!!e,s=this._offset(i),a=n-i,u=a,c=o&&r||0,h=s[1];if(i===0&&n===this.length){if(!o)return this._bufs.length===1?this._bufs[0]:ze.concat(this._bufs,this.length);for(let d=0;d<this._bufs.length;d++)this._bufs[d].copy(e,c),c+=this._bufs[d].length;return e}if(u<=this._bufs[s[0]].length-h)return o?this._bufs[s[0]].copy(e,r,h,h+u):this._bufs[s[0]].slice(h,h+u);o||(e=ze.allocUnsafe(a));for(let d=s[0];d<this._bufs.length;d++){let g=this._bufs[d].length-h;if(u>g)this._bufs[d].copy(e,c,h),c+=g;else{this._bufs[d].copy(e,c,h,h+u),c+=g;break}u-=g,h&&(h=0)}return e.length>c?e.slice(0,c):e};ee.prototype.shallowSlice=function(e,r){if(e=e||0,r=typeof r!="number"?this.length:r,e<0&&(e+=this.length),r<0&&(r+=this.length),e===r)return this._new();let i=this._offset(e),n=this._offset(r),o=this._bufs.slice(i[0],n[0]+1);return n[1]===0?o.pop():o[o.length-1]=o[o.length-1].slice(0,n[1]),i[1]!==0&&(o[0]=o[0].slice(i[1])),this._new(o)};ee.prototype.toString=function(e,r,i){return this.slice(r,i).toString(e)};ee.prototype.consume=function(e){if(e=Math.trunc(e),Number.isNaN(e)||e<=0)return this;for(;this._bufs.length;)if(e>=this._bufs[0].length)e-=this._bufs[0].length,this.length-=this._bufs[0].length,this._bufs.shift();else{this._bufs[0]=this._bufs[0].slice(e),this.length-=e;break}return this};ee.prototype.duplicate=function(){let e=this._new();for(let r=0;r<this._bufs.length;r++)e.append(this._bufs[r]);return e};ee.prototype.append=function(e){if(e==null)return this;if(e.buffer)this._appendBuffer(ze.from(e.buffer,e.byteOffset,e.byteLength));else if(Array.isArray(e))for(let r=0;r<e.length;r++)this.append(e[r]);else if(this._isBufferList(e))for(let r=0;r<e._bufs.length;r++)this.append(e._bufs[r]);else typeof e=="number"&&(e=e.toString()),this._appendBuffer(ze.from(e));return this};ee.prototype._appendBuffer=function(e){this._bufs.push(e),this.length+=e.length};ee.prototype.indexOf=function(t,e,r){if(r===void 0&&typeof e=="string"&&(r=e,e=void 0),typeof t=="function"||Array.isArray(t))throw new TypeError('The "value" argument must be one of type string, Buffer, BufferList, or Uint8Array.');if(typeof t=="number"?t=ze.from([t]):typeof t=="string"?t=ze.from(t,r):this._isBufferList(t)?t=t.slice():Array.isArray(t.buffer)?t=ze.from(t.buffer,t.byteOffset,t.byteLength):ze.isBuffer(t)||(t=ze.from(t)),e=Number(e||0),isNaN(e)&&(e=0),e<0&&(e=this.length+e),e<0&&(e=0),t.length===0)return e>this.length?this.length:e;let i=this._offset(e),n=i[0],o=i[1];for(;n<this._bufs.length;n++){let s=this._bufs[n];for(;o<s.length;)if(s.length-o>=t.length){let u=s.indexOf(t,o);if(u!==-1)return this._reverseOffset([n,u]);o=s.length-t.length+1}else{let u=this._reverseOffset([n,o]);if(this._match(u,t))return u;o++}o=0}return-1};ee.prototype._match=function(t,e){if(this.length-t<e.length)return!1;for(let r=0;r<e.length;r++)if(this.get(t+r)!==e[r])return!1;return!0};(function(){let t={readDoubleBE:8,readDoubleLE:8,readFloatBE:4,readFloatLE:4,readBigInt64BE:8,readBigInt64LE:8,readBigUInt64BE:8,readBigUInt64LE:8,readInt32BE:4,readInt32LE:4,readUInt32BE:4,readUInt32LE:4,readInt16BE:2,readInt16LE:2,readUInt16BE:2,readUInt16LE:2,readInt8:1,readUInt8:1,readIntBE:null,readIntLE:null,readUIntBE:null,readUIntLE:null};for(let e in t)(function(r){t[r]===null?ee.prototype[r]=function(i,n){return this.slice(i,i+n)[r](0,n)}:ee.prototype[r]=function(i=0){return this.slice(i,i+t[r])[r](0)}})(e)})();ee.prototype._isBufferList=function(e){return e instanceof ee||ee.isBufferList(e)};ee.isBufferList=function(e){return e!=null&&e[sd]};od.exports=ee});var ld=M((ER,En)=>{"use strict";_();v();m();var qo=Dt().Duplex,lm=nd(),_i=ad();function Ee(t){if(!(this instanceof Ee))return new Ee(t);if(typeof t=="function"){this._callback=t;let e=function(i){this._callback&&(this._callback(i),this._callback=null)}.bind(this);this.on("pipe",function(i){i.on("error",e)}),this.on("unpipe",function(i){i.removeListener("error",e)}),t=null}_i._init.call(this,t),qo.call(this)}lm(Ee,qo);Object.assign(Ee.prototype,_i.prototype);Ee.prototype._new=function(e){return new Ee(e)};Ee.prototype._write=function(e,r,i){this._appendBuffer(e),typeof i=="function"&&i()};Ee.prototype._read=function(e){if(!this.length)return this.push(null);e=Math.min(e,this.length),this.push(this.slice(0,e)),this.consume(e)};Ee.prototype.end=function(e){qo.prototype.end.call(this,e),this._callback&&(this._callback(null,this.slice()),this._callback=null)};Ee.prototype._destroy=function(e,r){this._bufs.length=0,this.length=0,r(e)};Ee.prototype._isBufferList=function(e){return e instanceof Ee||e instanceof _i||Ee.isBufferList(e)};Ee.isBufferList=_i.isBufferList;En.exports=Ee;En.exports.BufferListStream=Ee;En.exports.BufferList=_i});var fd=M((BR,ud)=>{_();v();m();var Do=class{constructor(){this.cmd=null,this.retain=!1,this.qos=0,this.dup=!1,this.length=-1,this.topic=null,this.payload=null}};ud.exports=Do});var jo=M((UR,cd)=>{_();v();m();var L=cd.exports,{Buffer:Oe}=(we(),Z(ve));L.types={0:"reserved",1:"connect",2:"connack",3:"publish",4:"puback",5:"pubrec",6:"pubrel",7:"pubcomp",8:"subscribe",9:"suback",10:"unsubscribe",11:"unsuback",12:"pingreq",13:"pingresp",14:"disconnect",15:"auth"};L.requiredHeaderFlags={1:0,2:0,4:0,5:0,6:2,7:0,8:2,9:0,10:2,11:0,12:0,13:0,14:0,15:0};L.requiredHeaderFlagsErrors={};for(let t in L.requiredHeaderFlags){let e=L.requiredHeaderFlags[t];L.requiredHeaderFlagsErrors[t]="Invalid header flag bits, must be 0x"+e.toString(16)+" for "+L.types[t]+" packet"}L.codes={};for(let t in L.types){let e=L.types[t];L.codes[e]=t}L.CMD_SHIFT=4;L.CMD_MASK=240;L.DUP_MASK=8;L.QOS_MASK=3;L.QOS_SHIFT=1;L.RETAIN_MASK=1;L.VARBYTEINT_MASK=127;L.VARBYTEINT_FIN_MASK=128;L.VARBYTEINT_MAX=268435455;L.SESSIONPRESENT_MASK=1;L.SESSIONPRESENT_HEADER=Oe.from([L.SESSIONPRESENT_MASK]);L.CONNACK_HEADER=Oe.from([L.codes.connack<<L.CMD_SHIFT]);L.USERNAME_MASK=128;L.PASSWORD_MASK=64;L.WILL_RETAIN_MASK=32;L.WILL_QOS_MASK=24;L.WILL_QOS_SHIFT=3;L.WILL_FLAG_MASK=4;L.CLEAN_SESSION_MASK=2;L.CONNECT_HEADER=Oe.from([L.codes.connect<<L.CMD_SHIFT]);L.properties={sessionExpiryInterval:17,willDelayInterval:24,receiveMaximum:33,maximumPacketSize:39,topicAliasMaximum:34,requestResponseInformation:25,requestProblemInformation:23,userProperties:38,authenticationMethod:21,authenticationData:22,payloadFormatIndicator:1,messageExpiryInterval:2,contentType:3,responseTopic:8,correlationData:9,maximumQoS:36,retainAvailable:37,assignedClientIdentifier:18,reasonString:31,wildcardSubscriptionAvailable:40,subscriptionIdentifiersAvailable:41,sharedSubscriptionAvailable:42,serverKeepAlive:19,responseInformation:26,serverReference:28,topicAlias:35,subscriptionIdentifier:11};L.propertiesCodes={};for(let t in L.properties){let e=L.properties[t];L.propertiesCodes[e]=t}L.propertiesTypes={sessionExpiryInterval:"int32",willDelayInterval:"int32",receiveMaximum:"int16",maximumPacketSize:"int32",topicAliasMaximum:"int16",requestResponseInformation:"byte",requestProblemInformation:"byte",userProperties:"pair",authenticationMethod:"string",authenticationData:"binary",payloadFormatIndicator:"byte",messageExpiryInterval:"int32",contentType:"string",responseTopic:"string",correlationData:"binary",maximumQoS:"int8",retainAvailable:"byte",assignedClientIdentifier:"string",reasonString:"string",wildcardSubscriptionAvailable:"byte",subscriptionIdentifiersAvailable:"byte",sharedSubscriptionAvailable:"byte",serverKeepAlive:"int16",responseInformation:"string",serverReference:"string",topicAlias:"int16",subscriptionIdentifier:"var"};function jt(t){return[0,1,2].map(e=>[0,1].map(r=>[0,1].map(i=>{let n=Oe.alloc(1);return n.writeUInt8(L.codes[t]<<L.CMD_SHIFT|(r?L.DUP_MASK:0)|e<<L.QOS_SHIFT|i,0,!0),n})))}L.PUBLISH_HEADER=jt("publish");L.SUBSCRIBE_HEADER=jt("subscribe");L.SUBSCRIBE_OPTIONS_QOS_MASK=3;L.SUBSCRIBE_OPTIONS_NL_MASK=1;L.SUBSCRIBE_OPTIONS_NL_SHIFT=2;L.SUBSCRIBE_OPTIONS_RAP_MASK=1;L.SUBSCRIBE_OPTIONS_RAP_SHIFT=3;L.SUBSCRIBE_OPTIONS_RH_MASK=3;L.SUBSCRIBE_OPTIONS_RH_SHIFT=4;L.SUBSCRIBE_OPTIONS_RH=[0,16,32];L.SUBSCRIBE_OPTIONS_NL=4;L.SUBSCRIBE_OPTIONS_RAP=8;L.SUBSCRIBE_OPTIONS_QOS=[0,1,2];L.UNSUBSCRIBE_HEADER=jt("unsubscribe");L.ACKS={unsuback:jt("unsuback"),puback:jt("puback"),pubcomp:jt("pubcomp"),pubrel:jt("pubrel"),pubrec:jt("pubrec")};L.SUBACK_HEADER=Oe.from([L.codes.suback<<L.CMD_SHIFT]);L.VERSION3=Oe.from([3]);L.VERSION4=Oe.from([4]);L.VERSION5=Oe.from([5]);L.VERSION131=Oe.from([131]);L.VERSION132=Oe.from([132]);L.QOS=[0,1,2].map(t=>Oe.from([t]));L.EMPTY={pingreq:Oe.from([L.codes.pingreq<<4,0]),pingresp:Oe.from([L.codes.pingresp<<4,0]),disconnect:Oe.from([L.codes.disconnect<<4,0])};L.MQTT5_PUBACK_PUBREC_CODES={0:"Success",16:"No matching subscribers",128:"Unspecified error",131:"Implementation specific error",135:"Not authorized",144:"Topic Name invalid",145:"Packet identifier in use",151:"Quota exceeded",153:"Payload format invalid"};L.MQTT5_PUBREL_PUBCOMP_CODES={0:"Success",146:"Packet Identifier not found"};L.MQTT5_SUBACK_CODES={0:"Granted QoS 0",1:"Granted QoS 1",2:"Granted QoS 2",128:"Unspecified error",131:"Implementation specific error",135:"Not authorized",143:"Topic Filter invalid",145:"Packet Identifier in use",151:"Quota exceeded",158:"Shared Subscriptions not supported",161:"Subscription Identifiers not supported",162:"Wildcard Subscriptions not supported"};L.MQTT5_UNSUBACK_CODES={0:"Success",17:"No subscription existed",128:"Unspecified error",131:"Implementation specific error",135:"Not authorized",143:"Topic Filter invalid",145:"Packet Identifier in use"};L.MQTT5_DISCONNECT_CODES={0:"Normal disconnection",4:"Disconnect with Will Message",128:"Unspecified error",129:"Malformed Packet",130:"Protocol Error",131:"Implementation specific error",135:"Not authorized",137:"Server busy",139:"Server shutting down",141:"Keep Alive timeout",142:"Session taken over",143:"Topic Filter invalid",144:"Topic Name invalid",147:"Receive Maximum exceeded",148:"Topic Alias invalid",149:"Packet too large",150:"Message rate too high",151:"Quota exceeded",152:"Administrative action",153:"Payload format invalid",154:"Retain not supported",155:"QoS not supported",156:"Use another server",157:"Server moved",158:"Shared Subscriptions not supported",159:"Connection rate exceeded",160:"Maximum connect time",161:"Subscription Identifiers not supported",162:"Wildcard Subscriptions not supported"};L.MQTT5_AUTH_CODES={0:"Success",24:"Continue authentication",25:"Re-authenticate"}});var dd=M(($R,hd)=>{_();v();m();var Hr=1e3,Vr=Hr*60,zr=Vr*60,gr=zr*24,um=gr*7,fm=gr*365.25;hd.exports=function(t,e){e=e||{};var r=typeof t;if(r==="string"&&t.length>0)return cm(t);if(r==="number"&&isFinite(t))return e.long?dm(t):hm(t);throw new Error("val is not a non-empty string or a valid number. val="+JSON.stringify(t))};function cm(t){if(t=String(t),!(t.length>100)){var e=/^(-?(?:\d+)?\.?\d+) *(milliseconds?|msecs?|ms|seconds?|secs?|s|minutes?|mins?|m|hours?|hrs?|h|days?|d|weeks?|w|years?|yrs?|y)?$/i.exec(t);if(e){var r=parseFloat(e[1]),i=(e[2]||"ms").toLowerCase();switch(i){case"years":case"year":case"yrs":case"yr":case"y":return r*fm;case"weeks":case"week":case"w":return r*um;case"days":case"day":case"d":return r*gr;case"hours":case"hour":case"hrs":case"hr":case"h":return r*zr;case"minutes":case"minute":case"mins":case"min":case"m":return r*Vr;case"seconds":case"second":case"secs":case"sec":case"s":return r*Hr;case"milliseconds":case"millisecond":case"msecs":case"msec":case"ms":return r;default:return}}}}function hm(t){var e=Math.abs(t);return e>=gr?Math.round(t/gr)+"d":e>=zr?Math.round(t/zr)+"h":e>=Vr?Math.round(t/Vr)+"m":e>=Hr?Math.round(t/Hr)+"s":t+"ms"}function dm(t){var e=Math.abs(t);return e>=gr?Sn(t,e,gr,"day"):e>=zr?Sn(t,e,zr,"hour"):e>=Vr?Sn(t,e,Vr,"minute"):e>=Hr?Sn(t,e,Hr,"second"):t+" ms"}function Sn(t,e,r,i){var n=e>=r*1.5;return Math.round(t/r)+" "+i+(n?"s":"")}});var gd=M((YR,pd)=>{_();v();m();function pm(t){r.debug=r,r.default=r,r.coerce=u,r.disable=o,r.enable=n,r.enabled=s,r.humanize=dd(),r.destroy=c,Object.keys(t).forEach(h=>{r[h]=t[h]}),r.names=[],r.skips=[],r.formatters={};function e(h){let d=0;for(let g=0;g<h.length;g++)d=(d<<5)-d+h.charCodeAt(g),d|=0;return r.colors[Math.abs(d)%r.colors.length]}r.selectColor=e;function r(h){let d,g=null,y,w;function E(...S){if(!E.enabled)return;let I=E,C=Number(new Date),R=C-(d||C);I.diff=R,I.prev=d,I.curr=C,d=C,S[0]=r.coerce(S[0]),typeof S[0]!="string"&&S.unshift("%O");let U=0;S[0]=S[0].replace(/%([a-zA-Z%])/g,(W,K)=>{if(W==="%%")return"%";U++;let z=r.formatters[K];if(typeof z=="function"){let G=S[U];W=z.call(I,G),S.splice(U,1),U--}return W}),r.formatArgs.call(I,S),(I.log||r.log).apply(I,S)}return E.namespace=h,E.useColors=r.useColors(),E.color=r.selectColor(h),E.extend=i,E.destroy=r.destroy,Object.defineProperty(E,"enabled",{enumerable:!0,configurable:!1,get:()=>g!==null?g:(y!==r.namespaces&&(y=r.namespaces,w=r.enabled(h)),w),set:S=>{g=S}}),typeof r.init=="function"&&r.init(E),E}function i(h,d){let g=r(this.namespace+(typeof d>"u"?":":d)+h);return g.log=this.log,g}function n(h){r.save(h),r.namespaces=h,r.names=[],r.skips=[];let d,g=(typeof h=="string"?h:"").split(/[\s,]+/),y=g.length;for(d=0;d<y;d++)g[d]&&(h=g[d].replace(/\*/g,".*?"),h[0]==="-"?r.skips.push(new RegExp("^"+h.slice(1)+"$")):r.names.push(new RegExp("^"+h+"$")))}function o(){let h=[...r.names.map(a),...r.skips.map(a).map(d=>"-"+d)].join(",");return r.enable(""),h}function s(h){if(h[h.length-1]==="*")return!0;let d,g;for(d=0,g=r.skips.length;d<g;d++)if(r.skips[d].test(h))return!1;for(d=0,g=r.names.length;d<g;d++)if(r.names[d].test(h))return!0;return!1}function a(h){return h.toString().substring(2,h.toString().length-2).replace(/\.\*\?$/,"*")}function u(h){return h instanceof Error?h.stack||h.message:h}function c(){console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`.")}return r.enable(r.load()),r}pd.exports=pm});var ot=M((ke,An)=>{_();v();m();ke.formatArgs=ym;ke.save=bm;ke.load=wm;ke.useColors=gm;ke.storage=_m();ke.destroy=(()=>{let t=!1;return()=>{t||(t=!0,console.warn("Instance method `debug.destroy()` is deprecated and no longer does anything. It will be removed in the next major version of `debug`."))}})();ke.colors=["#0000CC","#0000FF","#0033CC","#0033FF","#0066CC","#0066FF","#0099CC","#0099FF","#00CC00","#00CC33","#00CC66","#00CC99","#00CCCC","#00CCFF","#3300CC","#3300FF","#3333CC","#3333FF","#3366CC","#3366FF","#3399CC","#3399FF","#33CC00","#33CC33","#33CC66","#33CC99","#33CCCC","#33CCFF","#6600CC","#6600FF","#6633CC","#6633FF","#66CC00","#66CC33","#9900CC","#9900FF","#9933CC","#9933FF","#99CC00","#99CC33","#CC0000","#CC0033","#CC0066","#CC0099","#CC00CC","#CC00FF","#CC3300","#CC3333","#CC3366","#CC3399","#CC33CC","#CC33FF","#CC6600","#CC6633","#CC9900","#CC9933","#CCCC00","#CCCC33","#FF0000","#FF0033","#FF0066","#FF0099","#FF00CC","#FF00FF","#FF3300","#FF3333","#FF3366","#FF3399","#FF33CC","#FF33FF","#FF6600","#FF6633","#FF9900","#FF9933","#FFCC00","#FFCC33"];function gm(){return typeof window<"u"&&window.process&&(window.process.type==="renderer"||window.process.__nwjs)?!0:typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/(edge|trident)\/(\d+)/)?!1:typeof document<"u"&&document.documentElement&&document.documentElement.style&&document.documentElement.style.WebkitAppearance||typeof window<"u"&&window.console&&(window.console.firebug||window.console.exception&&window.console.table)||typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/firefox\/(\d+)/)&&parseInt(RegExp.$1,10)>=31||typeof navigator<"u"&&navigator.userAgent&&navigator.userAgent.toLowerCase().match(/applewebkit\/(\d+)/)}function ym(t){if(t[0]=(this.useColors?"%c":"")+this.namespace+(this.useColors?" %c":" ")+t[0]+(this.useColors?"%c ":" ")+"+"+An.exports.humanize(this.diff),!this.useColors)return;let e="color: "+this.color;t.splice(1,0,e,"color: inherit");let r=0,i=0;t[0].replace(/%[a-zA-Z%]/g,n=>{n!=="%%"&&(r++,n==="%c"&&(i=r))}),t.splice(i,0,e)}ke.log=console.debug||console.log||(()=>{});function bm(t){try{t?ke.storage.setItem("debug",t):ke.storage.removeItem("debug")}catch{}}function wm(){let t;try{t=ke.storage.getItem("debug")}catch{}return!t&&typeof B<"u"&&"env"in B&&(t=B.env.DEBUG),t}function _m(){try{return localStorage}catch{}}An.exports=gd()(ke);var{formatters:mm}=An.exports;mm.j=function(t){try{return JSON.stringify(t)}catch(e){return"[UnexpectedJSONParseError]: "+e.message}}});var wd=M((uC,bd)=>{_();v();m();var vm=ld(),{EventEmitter:Em}=(ir(),Z(rr)),yd=fd(),V=jo(),D=ot()("mqtt-packet:parser"),Fo=class t extends Em{constructor(){super(),this.parser=this.constructor.parser}static parser(e){return this instanceof t?(this.settings=e||{},this._states=["_parseHeader","_parseLength","_parsePayload","_newPacket"],this._resetState(),this):new t().parser(e)}_resetState(){D("_resetState: resetting packet, error, _list, and _stateCounter"),this.packet=new yd,this.error=null,this._list=vm(),this._stateCounter=0}parse(e){for(this.error&&this._resetState(),this._list.append(e),D("parse: current state: %s",this._states[this._stateCounter]);(this.packet.length!==-1||this._list.length>0)&&this[this._states[this._stateCounter]]()&&!this.error;)this._stateCounter++,D("parse: state complete. _stateCounter is now: %d",this._stateCounter),D("parse: packet.length: %d, buffer list length: %d",this.packet.length,this._list.length),this._stateCounter>=this._states.length&&(this._stateCounter=0);return D("parse: exited while loop. packet: %d, buffer list length: %d",this.packet.length,this._list.length),this._list.length}_parseHeader(){let e=this._list.readUInt8(0),r=e>>V.CMD_SHIFT;this.packet.cmd=V.types[r];let i=e&15,n=V.requiredHeaderFlags[r];return n!=null&&i!==n?this._emitError(new Error(V.requiredHeaderFlagsErrors[r])):(this.packet.retain=(e&V.RETAIN_MASK)!==0,this.packet.qos=e>>V.QOS_SHIFT&V.QOS_MASK,this.packet.qos>2?this._emitError(new Error("Packet must not have both QoS bits set to 1")):(this.packet.dup=(e&V.DUP_MASK)!==0,D("_parseHeader: packet: %o",this.packet),this._list.consume(1),!0))}_parseLength(){let e=this._parseVarByteNum(!0);return e&&(this.packet.length=e.value,this._list.consume(e.bytes)),D("_parseLength %d",e.value),!!e}_parsePayload(){D("_parsePayload: payload %O",this._list);let e=!1;if(this.packet.length===0||this._list.length>=this.packet.length){switch(this._pos=0,this.packet.cmd){case"connect":this._parseConnect();break;case"connack":this._parseConnack();break;case"publish":this._parsePublish();break;case"puback":case"pubrec":case"pubrel":case"pubcomp":this._parseConfirmation();break;case"subscribe":this._parseSubscribe();break;case"suback":this._parseSuback();break;case"unsubscribe":this._parseUnsubscribe();break;case"unsuback":this._parseUnsuback();break;case"pingreq":case"pingresp":break;case"disconnect":this._parseDisconnect();break;case"auth":this._parseAuth();break;default:this._emitError(new Error("Not supported"))}e=!0}return D("_parsePayload complete result: %s",e),e}_parseConnect(){D("_parseConnect");let e,r,i,n,o={},s=this.packet,a=this._parseString();if(a===null)return this._emitError(new Error("Cannot parse protocolId"));if(a!=="MQTT"&&a!=="MQIsdp")return this._emitError(new Error("Invalid protocolId"));if(s.protocolId=a,this._pos>=this._list.length)return this._emitError(new Error("Packet too short"));if(s.protocolVersion=this._list.readUInt8(this._pos),s.protocolVersion>=128&&(s.bridgeMode=!0,s.protocolVersion=s.protocolVersion-128),s.protocolVersion!==3&&s.protocolVersion!==4&&s.protocolVersion!==5)return this._emitError(new Error("Invalid protocol version"));if(this._pos++,this._pos>=this._list.length)return this._emitError(new Error("Packet too short"));if(this._list.readUInt8(this._pos)&1)return this._emitError(new Error("Connect flag bit 0 must be 0, but got 1"));o.username=this._list.readUInt8(this._pos)&V.USERNAME_MASK,o.password=this._list.readUInt8(this._pos)&V.PASSWORD_MASK,o.will=this._list.readUInt8(this._pos)&V.WILL_FLAG_MASK;let u=!!(this._list.readUInt8(this._pos)&V.WILL_RETAIN_MASK),c=(this._list.readUInt8(this._pos)&V.WILL_QOS_MASK)>>V.WILL_QOS_SHIFT;if(o.will)s.will={},s.will.retain=u,s.will.qos=c;else{if(u)return this._emitError(new Error("Will Retain Flag must be set to zero when Will Flag is set to 0"));if(c)return this._emitError(new Error("Will QoS must be set to zero when Will Flag is set to 0"))}if(s.clean=(this._list.readUInt8(this._pos)&V.CLEAN_SESSION_MASK)!==0,this._pos++,s.keepalive=this._parseNum(),s.keepalive===-1)return this._emitError(new Error("Packet too short"));if(s.protocolVersion===5){let d=this._parseProperties();Object.getOwnPropertyNames(d).length&&(s.properties=d)}let h=this._parseString();if(h===null)return this._emitError(new Error("Packet too short"));if(s.clientId=h,D("_parseConnect: packet.clientId: %s",s.clientId),o.will){if(s.protocolVersion===5){let d=this._parseProperties();Object.getOwnPropertyNames(d).length&&(s.will.properties=d)}if(e=this._parseString(),e===null)return this._emitError(new Error("Cannot parse will topic"));if(s.will.topic=e,D("_parseConnect: packet.will.topic: %s",s.will.topic),r=this._parseBuffer(),r===null)return this._emitError(new Error("Cannot parse will payload"));s.will.payload=r,D("_parseConnect: packet.will.paylaod: %s",s.will.payload)}if(o.username){if(n=this._parseString(),n===null)return this._emitError(new Error("Cannot parse username"));s.username=n,D("_parseConnect: packet.username: %s",s.username)}if(o.password){if(i=this._parseBuffer(),i===null)return this._emitError(new Error("Cannot parse password"));s.password=i}return this.settings=s,D("_parseConnect: complete"),s}_parseConnack(){D("_parseConnack");let e=this.packet;if(this._list.length<1)return null;let r=this._list.readUInt8(this._pos++);if(r>1)return this._emitError(new Error("Invalid connack flags, bits 7-1 must be set to 0"));if(e.sessionPresent=!!(r&V.SESSIONPRESENT_MASK),this.settings.protocolVersion===5)this._list.length>=2?e.reasonCode=this._list.readUInt8(this._pos++):e.reasonCode=0;else{if(this._list.length<2)return null;e.returnCode=this._list.readUInt8(this._pos++)}if(e.returnCode===-1||e.reasonCode===-1)return this._emitError(new Error("Cannot parse return code"));if(this.settings.protocolVersion===5){let i=this._parseProperties();Object.getOwnPropertyNames(i).length&&(e.properties=i)}D("_parseConnack: complete")}_parsePublish(){D("_parsePublish");let e=this.packet;if(e.topic=this._parseString(),e.topic===null)return this._emitError(new Error("Cannot parse topic"));if(!(e.qos>0&&!this._parseMessageId())){if(this.settings.protocolVersion===5){let r=this._parseProperties();Object.getOwnPropertyNames(r).length&&(e.properties=r)}e.payload=this._list.slice(this._pos,e.length),D("_parsePublish: payload from buffer list: %o",e.payload)}}_parseSubscribe(){D("_parseSubscribe");let e=this.packet,r,i,n,o,s,a,u;if(e.subscriptions=[],!!this._parseMessageId()){if(this.settings.protocolVersion===5){let c=this._parseProperties();Object.getOwnPropertyNames(c).length&&(e.properties=c)}if(e.length<=0)return this._emitError(new Error("Malformed subscribe, no payload specified"));for(;this._pos<e.length;){if(r=this._parseString(),r===null)return this._emitError(new Error("Cannot parse topic"));if(this._pos>=e.length)return this._emitError(new Error("Malformed Subscribe Payload"));if(i=this._parseByte(),this.settings.protocolVersion===5){if(i&192)return this._emitError(new Error("Invalid subscribe topic flag bits, bits 7-6 must be 0"))}else if(i&252)return this._emitError(new Error("Invalid subscribe topic flag bits, bits 7-2 must be 0"));if(n=i&V.SUBSCRIBE_OPTIONS_QOS_MASK,n>2)return this._emitError(new Error("Invalid subscribe QoS, must be <= 2"));if(a=(i>>V.SUBSCRIBE_OPTIONS_NL_SHIFT&V.SUBSCRIBE_OPTIONS_NL_MASK)!==0,s=(i>>V.SUBSCRIBE_OPTIONS_RAP_SHIFT&V.SUBSCRIBE_OPTIONS_RAP_MASK)!==0,o=i>>V.SUBSCRIBE_OPTIONS_RH_SHIFT&V.SUBSCRIBE_OPTIONS_RH_MASK,o>2)return this._emitError(new Error("Invalid retain handling, must be <= 2"));u={topic:r,qos:n},this.settings.protocolVersion===5?(u.nl=a,u.rap=s,u.rh=o):this.settings.bridgeMode&&(u.rh=0,u.rap=!0,u.nl=!0),D("_parseSubscribe: push subscription `%s` to subscription",u),e.subscriptions.push(u)}}}_parseSuback(){D("_parseSuback");let e=this.packet;if(this.packet.granted=[],!!this._parseMessageId()){if(this.settings.protocolVersion===5){let r=this._parseProperties();Object.getOwnPropertyNames(r).length&&(e.properties=r)}if(e.length<=0)return this._emitError(new Error("Malformed suback, no payload specified"));for(;this._pos<this.packet.length;){let r=this._list.readUInt8(this._pos++);if(this.settings.protocolVersion===5){if(!V.MQTT5_SUBACK_CODES[r])return this._emitError(new Error("Invalid suback code"))}else if(r>2&&r!==128)return this._emitError(new Error("Invalid suback QoS, must be 0, 1, 2 or 128"));this.packet.granted.push(r)}}}_parseUnsubscribe(){D("_parseUnsubscribe");let e=this.packet;if(e.unsubscriptions=[],!!this._parseMessageId()){if(this.settings.protocolVersion===5){let r=this._parseProperties();Object.getOwnPropertyNames(r).length&&(e.properties=r)}if(e.length<=0)return this._emitError(new Error("Malformed unsubscribe, no payload specified"));for(;this._pos<e.length;){let r=this._parseString();if(r===null)return this._emitError(new Error("Cannot parse topic"));D("_parseUnsubscribe: push topic `%s` to unsubscriptions",r),e.unsubscriptions.push(r)}}}_parseUnsuback(){D("_parseUnsuback");let e=this.packet;if(!this._parseMessageId())return this._emitError(new Error("Cannot parse messageId"));if((this.settings.protocolVersion===3||this.settings.protocolVersion===4)&&e.length!==2)return this._emitError(new Error("Malformed unsuback, payload length must be 2"));if(e.length<=0)return this._emitError(new Error("Malformed unsuback, no payload specified"));if(this.settings.protocolVersion===5){let r=this._parseProperties();for(Object.getOwnPropertyNames(r).length&&(e.properties=r),e.granted=[];this._pos<this.packet.length;){let i=this._list.readUInt8(this._pos++);if(!V.MQTT5_UNSUBACK_CODES[i])return this._emitError(new Error("Invalid unsuback code"));this.packet.granted.push(i)}}}_parseConfirmation(){D("_parseConfirmation: packet.cmd: `%s`",this.packet.cmd);let e=this.packet;if(this._parseMessageId(),this.settings.protocolVersion===5){if(e.length>2){switch(e.reasonCode=this._parseByte(),this.packet.cmd){case"puback":case"pubrec":if(!V.MQTT5_PUBACK_PUBREC_CODES[e.reasonCode])return this._emitError(new Error("Invalid "+this.packet.cmd+" reason code"));break;case"pubrel":case"pubcomp":if(!V.MQTT5_PUBREL_PUBCOMP_CODES[e.reasonCode])return this._emitError(new Error("Invalid "+this.packet.cmd+" reason code"));break}D("_parseConfirmation: packet.reasonCode `%d`",e.reasonCode)}else e.reasonCode=0;if(e.length>3){let r=this._parseProperties();Object.getOwnPropertyNames(r).length&&(e.properties=r)}}return!0}_parseDisconnect(){let e=this.packet;if(D("_parseDisconnect"),this.settings.protocolVersion===5){this._list.length>0?(e.reasonCode=this._parseByte(),V.MQTT5_DISCONNECT_CODES[e.reasonCode]||this._emitError(new Error("Invalid disconnect reason code"))):e.reasonCode=0;let r=this._parseProperties();Object.getOwnPropertyNames(r).length&&(e.properties=r)}return D("_parseDisconnect result: true"),!0}_parseAuth(){D("_parseAuth");let e=this.packet;if(this.settings.protocolVersion!==5)return this._emitError(new Error("Not supported auth packet for this version MQTT"));if(e.reasonCode=this._parseByte(),!V.MQTT5_AUTH_CODES[e.reasonCode])return this._emitError(new Error("Invalid auth reason code"));let r=this._parseProperties();return Object.getOwnPropertyNames(r).length&&(e.properties=r),D("_parseAuth: result: true"),!0}_parseMessageId(){let e=this.packet;return e.messageId=this._parseNum(),e.messageId===null?(this._emitError(new Error("Cannot parse messageId")),!1):(D("_parseMessageId: packet.messageId %d",e.messageId),!0)}_parseString(e){let r=this._parseNum(),i=r+this._pos;if(r===-1||i>this._list.length||i>this.packet.length)return null;let n=this._list.toString("utf8",this._pos,i);return this._pos+=r,D("_parseString: result: %s",n),n}_parseStringPair(){return D("_parseStringPair"),{name:this._parseString(),value:this._parseString()}}_parseBuffer(){let e=this._parseNum(),r=e+this._pos;if(e===-1||r>this._list.length||r>this.packet.length)return null;let i=this._list.slice(this._pos,r);return this._pos+=e,D("_parseBuffer: result: %o",i),i}_parseNum(){if(this._list.length-this._pos<2)return-1;let e=this._list.readUInt16BE(this._pos);return this._pos+=2,D("_parseNum: result: %s",e),e}_parse4ByteNum(){if(this._list.length-this._pos<4)return-1;let e=this._list.readUInt32BE(this._pos);return this._pos+=4,D("_parse4ByteNum: result: %s",e),e}_parseVarByteNum(e){D("_parseVarByteNum");let r=4,i=0,n=1,o=0,s=!1,a,u=this._pos?this._pos:0;for(;i<r&&u+i<this._list.length;){if(a=this._list.readUInt8(u+i++),o+=n*(a&V.VARBYTEINT_MASK),n*=128,!(a&V.VARBYTEINT_FIN_MASK)){s=!0;break}if(this._list.length<=i)break}return!s&&i===r&&this._list.length>=i&&this._emitError(new Error("Invalid variable byte integer")),u&&(this._pos+=i),s?e?s={bytes:i,value:o}:s=o:s=!1,D("_parseVarByteNum: result: %o",s),s}_parseByte(){let e;return this._pos<this._list.length&&(e=this._list.readUInt8(this._pos),this._pos++),D("_parseByte: result: %o",e),e}_parseByType(e){switch(D("_parseByType: type: %s",e),e){case"byte":return this._parseByte()!==0;case"int8":return this._parseByte();case"int16":return this._parseNum();case"int32":return this._parse4ByteNum();case"var":return this._parseVarByteNum();case"string":return this._parseString();case"pair":return this._parseStringPair();case"binary":return this._parseBuffer()}}_parseProperties(){D("_parseProperties");let e=this._parseVarByteNum(),i=this._pos+e,n={};for(;this._pos<i;){let o=this._parseByte();if(!o)return this._emitError(new Error("Cannot parse property code type")),!1;let s=V.propertiesCodes[o];if(!s)return this._emitError(new Error("Unknown property")),!1;if(s==="userProperties"){n[s]||(n[s]=Object.create(null));let a=this._parseByType(V.propertiesTypes[s]);if(n[s][a.name])if(Array.isArray(n[s][a.name]))n[s][a.name].push(a.value);else{let u=n[s][a.name];n[s][a.name]=[u],n[s][a.name].push(a.value)}else n[s][a.name]=a.value;continue}n[s]?Array.isArray(n[s])?n[s].push(this._parseByType(V.propertiesTypes[s])):(n[s]=[n[s]],n[s].push(this._parseByType(V.propertiesTypes[s]))):n[s]=this._parseByType(V.propertiesTypes[s])}return n}_newPacket(){return D("_newPacket"),this.packet&&(this._list.consume(this.packet.length),D("_newPacket: parser emit packet: packet.cmd: %s, packet.payload: %s, packet.length: %d",this.packet.cmd,this.packet.payload,this.packet.length),this.emit("packet",this.packet)),D("_newPacket: new packet"),this.packet=new yd,this._pos=0,!0}_emitError(e){D("_emitError",e),this.error=e,this.emit("error",e)}};bd.exports=Fo});var Ed=M((yC,vd)=>{_();v();m();var{Buffer:mi}=(we(),Z(ve)),Sm=65536,_d={},Am=mi.isBuffer(mi.from([1,2]).subarray(0,1));function md(t){let e=mi.allocUnsafe(2);return e.writeUInt8(t>>8,0),e.writeUInt8(t&255,0+1),e}function Im(){for(let t=0;t<Sm;t++)_d[t]=md(t)}function Tm(t){let r=0,i=0,n=mi.allocUnsafe(4);do r=t%128|0,t=t/128|0,t>0&&(r=r|128),n.writeUInt8(r,i++);while(t>0&&i<4);return t>0&&(i=0),Am?n.subarray(0,i):n.slice(0,i)}function Rm(t){let e=mi.allocUnsafe(4);return e.writeUInt32BE(t,0),e}vd.exports={cache:_d,generateCache:Im,generateNumber:md,genBufVariableByteInt:Tm,generate4ByteBuffer:Rm}});var Sd=M((SC,Wo)=>{"use strict";_();v();m();typeof B>"u"||!B.version||B.version.indexOf("v0.")===0||B.version.indexOf("v1.")===0&&B.version.indexOf("v1.8.")!==0?Wo.exports={nextTick:Cm}:Wo.exports=B;function Cm(t,e,r,i){if(typeof t!="function")throw new TypeError('"callback" argument must be a function');var n=arguments.length,o,s;switch(n){case 0:case 1:return B.nextTick(t);case 2:return B.nextTick(function(){t.call(null,e)});case 3:return B.nextTick(function(){t.call(null,e,r)});case 4:return B.nextTick(function(){t.call(null,e,r,i)});default:for(o=new Array(n-1),s=0;s<o.length;)o[s++]=arguments[s];return B.nextTick(function(){t.apply(null,o)})}}});var Vo=M((PC,Od)=>{_();v();m();var j=jo(),{Buffer:q}=(we(),Z(ve)),Bm=q.allocUnsafe(0),Pm=q.from([0]),vi=Ed(),Om=Sd().nextTick,qe=ot()("mqtt-packet:writeToStream"),In=vi.cache,xm=vi.generateNumber,km=vi.generateCache,$o=vi.genBufVariableByteInt,Mm=vi.generate4ByteBuffer,Ie=Ho,Tn=!0;function Bd(t,e,r){switch(qe("generate called"),e.cork&&(e.cork(),Om(Lm,e)),Tn&&(Tn=!1,km()),qe("generate: packet.cmd: %s",t.cmd),t.cmd){case"connect":return Um(t,e,r);case"connack":return Nm(t,e,r);case"publish":return qm(t,e,r);case"puback":case"pubrec":case"pubrel":case"pubcomp":return Dm(t,e,r);case"subscribe":return jm(t,e,r);case"suback":return Fm(t,e,r);case"unsubscribe":return Wm(t,e,r);case"unsuback":return $m(t,e,r);case"pingreq":case"pingresp":return Hm(t,e,r);case"disconnect":return Vm(t,e,r);case"auth":return zm(t,e,r);default:return e.destroy(new Error("Unknown command")),!1}}Object.defineProperty(Bd,"cacheNumbers",{get(){return Ie===Ho},set(t){t?((!In||Object.keys(In).length===0)&&(Tn=!0),Ie=Ho):(Tn=!1,Ie=Km)}});function Lm(t){t.uncork()}function Um(t,e,r){let i=t||{},n=i.protocolId||"MQTT",o=i.protocolVersion||4,s=i.will,a=i.clean,u=i.keepalive||0,c=i.clientId||"",h=i.username,d=i.password,g=i.properties;a===void 0&&(a=!0);let y=0;if(!n||typeof n!="string"&&!q.isBuffer(n))return e.destroy(new Error("Invalid protocolId")),!1;if(y+=n.length+2,o!==3&&o!==4&&o!==5)return e.destroy(new Error("Invalid protocol version")),!1;if(y+=1,(typeof c=="string"||q.isBuffer(c))&&(c||o>=4)&&(c||a))y+=q.byteLength(c)+2;else{if(o<4)return e.destroy(new Error("clientId must be supplied before 3.1.1")),!1;if(a*1===0)return e.destroy(new Error("clientId must be given if cleanSession set to 0")),!1}if(typeof u!="number"||u<0||u>65535||u%1!==0)return e.destroy(new Error("Invalid keepalive")),!1;y+=2,y+=1;let w,E;if(o===5){if(w=Ft(e,g),!w)return!1;y+=w.length}if(s){if(typeof s!="object")return e.destroy(new Error("Invalid will")),!1;if(!s.topic||typeof s.topic!="string")return e.destroy(new Error("Invalid will topic")),!1;if(y+=q.byteLength(s.topic)+2,y+=2,s.payload)if(s.payload.length>=0)typeof s.payload=="string"?y+=q.byteLength(s.payload):y+=s.payload.length;else return e.destroy(new Error("Invalid will payload")),!1;if(E={},o===5){if(E=Ft(e,s.properties),!E)return!1;y+=E.length}}let S=!1;if(h!=null)if(Cd(h))S=!0,y+=q.byteLength(h)+2;else return e.destroy(new Error("Invalid username")),!1;if(d!=null){if(!S)return e.destroy(new Error("Username is required to use password")),!1;if(Cd(d))y+=Pd(d)+2;else return e.destroy(new Error("Invalid password")),!1}e.write(j.CONNECT_HEADER),De(e,y),Kr(e,n),i.bridgeMode&&(o+=128),e.write(o===131?j.VERSION131:o===132?j.VERSION132:o===4?j.VERSION4:o===5?j.VERSION5:j.VERSION3);let I=0;return I|=h!=null?j.USERNAME_MASK:0,I|=d!=null?j.PASSWORD_MASK:0,I|=s&&s.retain?j.WILL_RETAIN_MASK:0,I|=s&&s.qos?s.qos<<j.WILL_QOS_SHIFT:0,I|=s?j.WILL_FLAG_MASK:0,I|=a?j.CLEAN_SESSION_MASK:0,e.write(q.from([I])),Ie(e,u),o===5&&w.write(),Kr(e,c),s&&(o===5&&E.write(),yr(e,s.topic),Kr(e,s.payload)),h!=null&&Kr(e,h),d!=null&&Kr(e,d),!0}function Nm(t,e,r){let i=r?r.protocolVersion:4,n=t||{},o=i===5?n.reasonCode:n.returnCode,s=n.properties,a=2;if(typeof o!="number")return e.destroy(new Error("Invalid return code")),!1;let u=null;if(i===5){if(u=Ft(e,s),!u)return!1;a+=u.length}return e.write(j.CONNACK_HEADER),De(e,a),e.write(n.sessionPresent?j.SESSIONPRESENT_HEADER:Pm),e.write(q.from([o])),u?.write(),!0}function qm(t,e,r){qe("publish: packet: %o",t);let i=r?r.protocolVersion:4,n=t||{},o=n.qos||0,s=n.retain?j.RETAIN_MASK:0,a=n.topic,u=n.payload||Bm,c=n.messageId,h=n.properties,d=0;if(typeof a=="string")d+=q.byteLength(a)+2;else if(q.isBuffer(a))d+=a.length+2;else return e.destroy(new Error("Invalid topic")),!1;if(q.isBuffer(u)?d+=u.length:d+=q.byteLength(u),o&&typeof c!="number")return e.destroy(new Error("Invalid messageId")),!1;o&&(d+=2);let g=null;if(i===5){if(g=Ft(e,h),!g)return!1;d+=g.length}return e.write(j.PUBLISH_HEADER[o][n.dup?1:0][s?1:0]),De(e,d),Ie(e,Pd(a)),e.write(a),o>0&&Ie(e,c),g?.write(),qe("publish: payload: %o",u),e.write(u)}function Dm(t,e,r){let i=r?r.protocolVersion:4,n=t||{},o=n.cmd||"puback",s=n.messageId,a=n.dup&&o==="pubrel"?j.DUP_MASK:0,u=0,c=n.reasonCode,h=n.properties,d=i===5?3:2;if(o==="pubrel"&&(u=1),typeof s!="number")return e.destroy(new Error("Invalid messageId")),!1;let g=null;if(i===5&&typeof h=="object"){if(g=Ei(e,h,r,d),!g)return!1;d+=g.length}return e.write(j.ACKS[o][u][a][0]),d===3&&(d+=c!==0?1:-1),De(e,d),Ie(e,s),i===5&&d!==2&&e.write(q.from([c])),g!==null?g.write():d===4&&e.write(q.from([0])),!0}function jm(t,e,r){qe("subscribe: packet: ");let i=r?r.protocolVersion:4,n=t||{},o=n.dup?j.DUP_MASK:0,s=n.messageId,a=n.subscriptions,u=n.properties,c=0;if(typeof s!="number")return e.destroy(new Error("Invalid messageId")),!1;c+=2;let h=null;if(i===5){if(h=Ft(e,u),!h)return!1;c+=h.length}if(typeof a=="object"&&a.length)for(let g=0;g<a.length;g+=1){let y=a[g].topic,w=a[g].qos;if(typeof y!="string")return e.destroy(new Error("Invalid subscriptions - invalid topic")),!1;if(typeof w!="number")return e.destroy(new Error("Invalid subscriptions - invalid qos")),!1;if(i===5){if(typeof(a[g].nl||!1)!="boolean")return e.destroy(new Error("Invalid subscriptions - invalid No Local")),!1;if(typeof(a[g].rap||!1)!="boolean")return e.destroy(new Error("Invalid subscriptions - invalid Retain as Published")),!1;let I=a[g].rh||0;if(typeof I!="number"||I>2)return e.destroy(new Error("Invalid subscriptions - invalid Retain Handling")),!1}c+=q.byteLength(y)+2+1}else return e.destroy(new Error("Invalid subscriptions")),!1;qe("subscribe: writing to stream: %o",j.SUBSCRIBE_HEADER),e.write(j.SUBSCRIBE_HEADER[1][o?1:0][0]),De(e,c),Ie(e,s),h!==null&&h.write();let d=!0;for(let g of a){let y=g.topic,w=g.qos,E=+g.nl,S=+g.rap,I=g.rh,C;yr(e,y),C=j.SUBSCRIBE_OPTIONS_QOS[w],i===5&&(C|=E?j.SUBSCRIBE_OPTIONS_NL:0,C|=S?j.SUBSCRIBE_OPTIONS_RAP:0,C|=I?j.SUBSCRIBE_OPTIONS_RH[I]:0),d=e.write(q.from([C]))}return d}function Fm(t,e,r){let i=r?r.protocolVersion:4,n=t||{},o=n.messageId,s=n.granted,a=n.properties,u=0;if(typeof o!="number")return e.destroy(new Error("Invalid messageId")),!1;if(u+=2,typeof s=="object"&&s.length)for(let h=0;h<s.length;h+=1){if(typeof s[h]!="number")return e.destroy(new Error("Invalid qos vector")),!1;u+=1}else return e.destroy(new Error("Invalid qos vector")),!1;let c=null;if(i===5){if(c=Ei(e,a,r,u),!c)return!1;u+=c.length}return e.write(j.SUBACK_HEADER),De(e,u),Ie(e,o),c!==null&&c.write(),e.write(q.from(s))}function Wm(t,e,r){let i=r?r.protocolVersion:4,n=t||{},o=n.messageId,s=n.dup?j.DUP_MASK:0,a=n.unsubscriptions,u=n.properties,c=0;if(typeof o!="number")return e.destroy(new Error("Invalid messageId")),!1;if(c+=2,typeof a=="object"&&a.length)for(let g=0;g<a.length;g+=1){if(typeof a[g]!="string")return e.destroy(new Error("Invalid unsubscriptions")),!1;c+=q.byteLength(a[g])+2}else return e.destroy(new Error("Invalid unsubscriptions")),!1;let h=null;if(i===5){if(h=Ft(e,u),!h)return!1;c+=h.length}e.write(j.UNSUBSCRIBE_HEADER[1][s?1:0][0]),De(e,c),Ie(e,o),h!==null&&h.write();let d=!0;for(let g=0;g<a.length;g++)d=yr(e,a[g]);return d}function $m(t,e,r){let i=r?r.protocolVersion:4,n=t||{},o=n.messageId,s=n.dup?j.DUP_MASK:0,a=n.granted,u=n.properties,c=n.cmd,h=0,d=2;if(typeof o!="number")return e.destroy(new Error("Invalid messageId")),!1;if(i===5)if(typeof a=="object"&&a.length)for(let y=0;y<a.length;y+=1){if(typeof a[y]!="number")return e.destroy(new Error("Invalid qos vector")),!1;d+=1}else return e.destroy(new Error("Invalid qos vector")),!1;let g=null;if(i===5){if(g=Ei(e,u,r,d),!g)return!1;d+=g.length}return e.write(j.ACKS[c][h][s][0]),De(e,d),Ie(e,o),g!==null&&g.write(),i===5&&e.write(q.from(a)),!0}function Hm(t,e,r){return e.write(j.EMPTY[t.cmd])}function Vm(t,e,r){let i=r?r.protocolVersion:4,n=t||{},o=n.reasonCode,s=n.properties,a=i===5?1:0,u=null;if(i===5){if(u=Ei(e,s,r,a),!u)return!1;a+=u.length}return e.write(q.from([j.codes.disconnect<<4])),De(e,a),i===5&&e.write(q.from([o])),u!==null&&u.write(),!0}function zm(t,e,r){let i=r?r.protocolVersion:4,n=t||{},o=n.reasonCode,s=n.properties,a=i===5?1:0;i!==5&&e.destroy(new Error("Invalid mqtt version for auth packet"));let u=Ei(e,s,r,a);return u?(a+=u.length,e.write(q.from([j.codes.auth<<4])),De(e,a),e.write(q.from([o])),u!==null&&u.write(),!0):!1}var Ad={};function De(t,e){if(e>j.VARBYTEINT_MAX)return t.destroy(new Error(`Invalid variable byte integer: ${e}`)),!1;let r=Ad[e];return r||(r=$o(e),e<16384&&(Ad[e]=r)),qe("writeVarByteInt: writing to stream: %o",r),t.write(r)}function yr(t,e){let r=q.byteLength(e);return Ie(t,r),qe("writeString: %s",e),t.write(e,"utf8")}function Id(t,e,r){yr(t,e),yr(t,r)}function Ho(t,e){return qe("writeNumberCached: number: %d",e),qe("writeNumberCached: %o",In[e]),t.write(In[e])}function Km(t,e){let r=xm(e);return qe("writeNumberGenerated: %o",r),t.write(r)}function Gm(t,e){let r=Mm(e);return qe("write4ByteNumber: %o",r),t.write(r)}function Kr(t,e){typeof e=="string"?yr(t,e):e?(Ie(t,e.length),t.write(e)):Ie(t,0)}function Ft(t,e){if(typeof e!="object"||e.length!=null)return{length:1,write(){Rd(t,{},0)}};let r=0;function i(o,s){let a=j.propertiesTypes[o],u=0;switch(a){case"byte":{if(typeof s!="boolean")return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=1+1;break}case"int8":{if(typeof s!="number"||s<0||s>255)return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=1+1;break}case"binary":{if(s&&s===null)return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=1+q.byteLength(s)+2;break}case"int16":{if(typeof s!="number"||s<0||s>65535)return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=1+2;break}case"int32":{if(typeof s!="number"||s<0||s>4294967295)return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=1+4;break}case"var":{if(typeof s!="number"||s<0||s>268435455)return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=1+q.byteLength($o(s));break}case"string":{if(typeof s!="string")return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=1+2+q.byteLength(s.toString());break}case"pair":{if(typeof s!="object")return t.destroy(new Error(`Invalid ${o}: ${s}`)),!1;u+=Object.getOwnPropertyNames(s).reduce((c,h)=>{let d=s[h];return Array.isArray(d)?c+=d.reduce((g,y)=>(g+=1+2+q.byteLength(h.toString())+2+q.byteLength(y.toString()),g),0):c+=1+2+q.byteLength(h.toString())+2+q.byteLength(s[h].toString()),c},0);break}default:return t.destroy(new Error(`Invalid property ${o}: ${s}`)),!1}return u}if(e)for(let o in e){let s=0,a=0,u=e[o];if(Array.isArray(u))for(let c=0;c<u.length;c++){if(a=i(o,u[c]),!a)return!1;s+=a}else{if(a=i(o,u),!a)return!1;s=a}if(!s)return!1;r+=s}return{length:q.byteLength($o(r))+r,write(){Rd(t,e,r)}}}function Ei(t,e,r,i){let n=["reasonString","userProperties"],o=r&&r.properties&&r.properties.maximumPacketSize?r.properties.maximumPacketSize:0,s=Ft(t,e);if(o)for(;i+s.length>o;){let a=n.shift();if(a&&e[a])delete e[a],s=Ft(t,e);else return!1}return s}function Td(t,e,r){switch(j.propertiesTypes[e]){case"byte":{t.write(q.from([j.properties[e]])),t.write(q.from([+r]));break}case"int8":{t.write(q.from([j.properties[e]])),t.write(q.from([r]));break}case"binary":{t.write(q.from([j.properties[e]])),Kr(t,r);break}case"int16":{t.write(q.from([j.properties[e]])),Ie(t,r);break}case"int32":{t.write(q.from([j.properties[e]])),Gm(t,r);break}case"var":{t.write(q.from([j.properties[e]])),De(t,r);break}case"string":{t.write(q.from([j.properties[e]])),yr(t,r);break}case"pair":{Object.getOwnPropertyNames(r).forEach(n=>{let o=r[n];Array.isArray(o)?o.forEach(s=>{t.write(q.from([j.properties[e]])),Id(t,n.toString(),s.toString())}):(t.write(q.from([j.properties[e]])),Id(t,n.toString(),o.toString()))});break}default:return t.destroy(new Error(`Invalid property ${e} value: ${r}`)),!1}}function Rd(t,e,r){De(t,r);for(let i in e)if(Object.prototype.hasOwnProperty.call(e,i)&&e[i]!==null){let n=e[i];if(Array.isArray(n))for(let o=0;o<n.length;o++)Td(t,i,n[o]);else Td(t,i,n)}}function Pd(t){return t?t instanceof q?t.length:q.byteLength(t):0}function Cd(t){return typeof t=="string"||t instanceof q}Od.exports=Bd});var Md=M((NC,kd)=>{_();v();m();var Qm=Vo(),{EventEmitter:Ym}=(ir(),Z(rr)),{Buffer:xd}=(we(),Z(ve));function Jm(t,e){let r=new zo;return Qm(t,r,e),r.concat()}var zo=class extends Ym{constructor(){super(),this._array=new Array(20),this._i=0}write(e){return this._array[this._i++]=e,!0}concat(){let e=0,r=new Array(this._array.length),i=this._array,n=0,o;for(o=0;o<i.length&&i[o]!==void 0;o++)typeof i[o]!="string"?r[o]=i[o].length:r[o]=xd.byteLength(i[o]),e+=r[o];let s=xd.allocUnsafe(e);for(o=0;o<i.length&&i[o]!==void 0;o++)typeof i[o]!="string"?(i[o].copy(s,n),n+=r[o]):(s.write(i[o],n),n+=r[o]);return s}destroy(e){e&&this.emit("error",e)}};kd.exports=Jm});var Ld=M(Rn=>{_();v();m();Rn.parser=wd().parser;Rn.generate=Md();Rn.writeToStream=Vo()});var Qo=M(Go=>{"use strict";_();v();m();Object.defineProperty(Go,"__esModule",{value:!0});var Ko=class{constructor(){this.nextId=Math.max(1,Math.floor(Math.random()*65535))}allocate(){let e=this.nextId++;return this.nextId===65536&&(this.nextId=1),e}getLastAllocated(){return this.nextId===1?65535:this.nextId-1}register(e){return!0}deallocate(e){}clear(){}};Go.default=Ko});var Nd=M((nB,Ud)=>{"use strict";_();v();m();Ud.exports=Xm;function Gr(t){return t instanceof x?x.from(t):new t.constructor(t.buffer.slice(),t.byteOffset,t.length)}function Xm(t){if(t=t||{},t.circles)return Zm(t);return t.proto?i:r;function e(n,o){for(var s=Object.keys(n),a=new Array(s.length),u=0;u<s.length;u++){var c=s[u],h=n[c];typeof h!="object"||h===null?a[c]=h:h instanceof Date?a[c]=new Date(h):ArrayBuffer.isView(h)?a[c]=Gr(h):a[c]=o(h)}return a}function r(n){if(typeof n!="object"||n===null)return n;if(n instanceof Date)return new Date(n);if(Array.isArray(n))return e(n,r);if(n instanceof Map)return new Map(e(Array.from(n),r));if(n instanceof Set)return new Set(e(Array.from(n),r));var o={};for(var s in n)if(Object.hasOwnProperty.call(n,s)!==!1){var a=n[s];typeof a!="object"||a===null?o[s]=a:a instanceof Date?o[s]=new Date(a):a instanceof Map?o[s]=new Map(e(Array.from(a),r)):a instanceof Set?o[s]=new Set(e(Array.from(a),r)):ArrayBuffer.isView(a)?o[s]=Gr(a):o[s]=r(a)}return o}function i(n){if(typeof n!="object"||n===null)return n;if(n instanceof Date)return new Date(n);if(Array.isArray(n))return e(n,i);if(n instanceof Map)return new Map(e(Array.from(n),i));if(n instanceof Set)return new Set(e(Array.from(n),i));var o={};for(var s in n){var a=n[s];typeof a!="object"||a===null?o[s]=a:a instanceof Date?o[s]=new Date(a):a instanceof Map?o[s]=new Map(e(Array.from(a),i)):a instanceof Set?o[s]=new Set(e(Array.from(a),i)):ArrayBuffer.isView(a)?o[s]=Gr(a):o[s]=i(a)}return o}}function Zm(t){var e=[],r=[];return t.proto?o:n;function i(s,a){for(var u=Object.keys(s),c=new Array(u.length),h=0;h<u.length;h++){var d=u[h],g=s[d];if(typeof g!="object"||g===null)c[d]=g;else if(g instanceof Date)c[d]=new Date(g);else if(ArrayBuffer.isView(g))c[d]=Gr(g);else{var y=e.indexOf(g);y!==-1?c[d]=r[y]:c[d]=a(g)}}return c}function n(s){if(typeof s!="object"||s===null)return s;if(s instanceof Date)return new Date(s);if(Array.isArray(s))return i(s,n);if(s instanceof Map)return new Map(i(Array.from(s),n));if(s instanceof Set)return new Set(i(Array.from(s),n));var a={};e.push(s),r.push(a);for(var u in s)if(Object.hasOwnProperty.call(s,u)!==!1){var c=s[u];if(typeof c!="object"||c===null)a[u]=c;else if(c instanceof Date)a[u]=new Date(c);else if(c instanceof Map)a[u]=new Map(i(Array.from(c),n));else if(c instanceof Set)a[u]=new Set(i(Array.from(c),n));else if(ArrayBuffer.isView(c))a[u]=Gr(c);else{var h=e.indexOf(c);h!==-1?a[u]=r[h]:a[u]=n(c)}}return e.pop(),r.pop(),a}function o(s){if(typeof s!="object"||s===null)return s;if(s instanceof Date)return new Date(s);if(Array.isArray(s))return i(s,o);if(s instanceof Map)return new Map(i(Array.from(s),o));if(s instanceof Set)return new Set(i(Array.from(s),o));var a={};e.push(s),r.push(a);for(var u in s){var c=s[u];if(typeof c!="object"||c===null)a[u]=c;else if(c instanceof Date)a[u]=new Date(c);else if(c instanceof Map)a[u]=new Map(i(Array.from(c),o));else if(c instanceof Set)a[u]=new Set(i(Array.from(c),o));else if(ArrayBuffer.isView(c))a[u]=Gr(c);else{var h=e.indexOf(c);h!==-1?a[u]=r[h]:a[u]=o(c)}}return e.pop(),r.pop(),a}}});var Dd=M((cB,qd)=>{"use strict";_();v();m();qd.exports=Nd()()});var Fd=M(Qr=>{"use strict";_();v();m();Object.defineProperty(Qr,"__esModule",{value:!0});Qr.validateTopics=Qr.validateTopic=void 0;function jd(t){let e=t.split("/");for(let r=0;r<e.length;r++)if(e[r]!=="+"){if(e[r]==="#")return r===e.length-1;if(e[r].indexOf("+")!==-1||e[r].indexOf("#")!==-1)return!1}return!0}Qr.validateTopic=jd;function e1(t){if(t.length===0)return"empty_topic_list";for(let e=0;e<t.length;e++)if(!jd(t[e]))return t[e];return null}Qr.validateTopics=e1});var Xo=M(Jo=>{"use strict";_();v();m();Object.defineProperty(Jo,"__esModule",{value:!0});var t1=Dt(),r1={objectMode:!0},i1={clean:!0},Yo=class{constructor(e){this.options=e||{},this.options=Object.assign(Object.assign({},i1),e),this._inflights=new Map}put(e,r){return this._inflights.set(e.messageId,e),r&&r(),this}createStream(){let e=new t1.Readable(r1),r=[],i=!1,n=0;return this._inflights.forEach((o,s)=>{r.push(o)}),e._read=()=>{!i&&n<r.length?e.push(r[n++]):e.push(null)},e.destroy=o=>{if(!i)return i=!0,setTimeout(()=>{e.emit("close")},0),e},e}del(e,r){let i=this._inflights.get(e.messageId);return i?(this._inflights.delete(e.messageId),r(null,i)):r&&r(new Error("missing packet")),this}get(e,r){let i=this._inflights.get(e.messageId);return i?r(null,i):r&&r(new Error("missing packet")),this}close(e){this.options.clean&&(this._inflights=null),e&&e()}};Jo.default=Yo});var $d=M(Zo=>{"use strict";_();v();m();Object.defineProperty(Zo,"__esModule",{value:!0});var Wd=[0,16,128,131,135,144,145,151,153],n1=(t,e,r)=>{t.log("handlePublish: packet %o",e),r=typeof r<"u"?r:t.noop;let i=e.topic.toString(),n=e.payload,{qos:o}=e,{messageId:s}=e,{options:a}=t;if(t.options.protocolVersion===5){let u;if(e.properties&&(u=e.properties.topicAlias),typeof u<"u")if(i.length===0)if(u>0&&u<=65535){let c=t.topicAliasRecv.getTopicByAlias(u);if(c)i=c,t.log("handlePublish :: topic complemented by alias. topic: %s - alias: %d",i,u);else{t.log("handlePublish :: unregistered topic alias. alias: %d",u),t.emit("error",new Error("Received unregistered Topic Alias"));return}}else{t.log("handlePublish :: topic alias out of range. alias: %d",u),t.emit("error",new Error("Received Topic Alias is out of range"));return}else if(t.topicAliasRecv.put(i,u))t.log("handlePublish :: registered topic: %s - alias: %d",i,u);else{t.log("handlePublish :: topic alias out of range. alias: %d",u),t.emit("error",new Error("Received Topic Alias is out of range"));return}}switch(t.log("handlePublish: qos %d",o),o){case 2:{a.customHandleAcks(i,n,e,(u,c)=>{if(typeof u=="number"&&(c=u,u=null),u)return t.emit("error",u);if(Wd.indexOf(c)===-1)return t.emit("error",new Error("Wrong reason code for pubrec"));c?t._sendPacket({cmd:"pubrec",messageId:s,reasonCode:c},r):t.incomingStore.put(e,()=>{t._sendPacket({cmd:"pubrec",messageId:s},r)})});break}case 1:{a.customHandleAcks(i,n,e,(u,c)=>{if(typeof u=="number"&&(c=u,u=null),u)return t.emit("error",u);if(Wd.indexOf(c)===-1)return t.emit("error",new Error("Wrong reason code for puback"));c||t.emit("message",i,n,e),t.handleMessage(e,h=>{if(h)return r&&r(h);t._sendPacket({cmd:"puback",messageId:s,reasonCode:c},r)})});break}case 0:t.emit("message",i,n,e),t.handleMessage(e,r);break;default:t.log("handlePublish: unknown QoS. Doing nothing.");break}};Zo.default=n1});var Yr=M(Wt=>{"use strict";_();v();m();Object.defineProperty(Wt,"__esModule",{value:!0});Wt.nextTick=Wt.applyMixin=Wt.ErrorWithReasonCode=void 0;var ea=class t extends Error{constructor(e,r){super(e),this.code=r,Object.setPrototypeOf(this,t.prototype),Object.getPrototypeOf(this).name="ErrorWithReasonCode"}};Wt.ErrorWithReasonCode=ea;function s1(t,e,r=!1){var i;let n=[e];for(;;){let o=n[0],s=Object.getPrototypeOf(o);if(s?.prototype)n.unshift(s);else break}for(let o of n)for(let s of Object.getOwnPropertyNames(o.prototype))(r||s!=="constructor")&&Object.defineProperty(t.prototype,s,(i=Object.getOwnPropertyDescriptor(o.prototype,s))!==null&&i!==void 0?i:Object.create(null))}Wt.applyMixin=s1;Wt.nextTick=B?B.nextTick:t=>{setTimeout(t,0)}});var Si=M(br=>{"use strict";_();v();m();Object.defineProperty(br,"__esModule",{value:!0});br.ReasonCodes=void 0;br.ReasonCodes={0:"",1:"Unacceptable protocol version",2:"Identifier rejected",3:"Server unavailable",4:"Bad username or password",5:"Not authorized",16:"No matching subscribers",17:"No subscription existed",128:"Unspecified error",129:"Malformed Packet",130:"Protocol Error",131:"Implementation specific error",132:"Unsupported Protocol Version",133:"Client Identifier not valid",134:"Bad User Name or Password",135:"Not authorized",136:"Server unavailable",137:"Server busy",138:"Banned",139:"Server shutting down",140:"Bad authentication method",141:"Keep Alive timeout",142:"Session taken over",143:"Topic Filter invalid",144:"Topic Name invalid",145:"Packet identifier in use",146:"Packet Identifier not found",147:"Receive Maximum exceeded",148:"Topic Alias invalid",149:"Packet too large",150:"Message rate too high",151:"Quota exceeded",152:"Administrative action",153:"Payload format invalid",154:"Retain not supported",155:"QoS not supported",156:"Use another server",157:"Server moved",158:"Shared Subscriptions not supported",159:"Connection rate exceeded",160:"Maximum connect time",161:"Subscription Identifiers not supported",162:"Wildcard Subscriptions not supported"};var o1=(t,e)=>{let{messageId:r}=e,i=e.cmd,n=null,o=t.outgoing[r]?t.outgoing[r].cb:null,s;if(!o){t.log("_handleAck :: Server sent an ack in error. Ignoring.");return}switch(t.log("_handleAck :: packet type",i),i){case"pubcomp":case"puback":{let a=e.reasonCode;a&&a>0&&a!==16?(s=new Error(`Publish error: ${br.ReasonCodes[a]}`),s.code=a,t._removeOutgoingAndStoreMessage(r,()=>{o(s,e)})):t._removeOutgoingAndStoreMessage(r,o);break}case"pubrec":{n={cmd:"pubrel",qos:2,messageId:r};let a=e.reasonCode;a&&a>0&&a!==16?(s=new Error(`Publish error: ${br.ReasonCodes[a]}`),s.code=a,t._removeOutgoingAndStoreMessage(r,()=>{o(s,e)})):t._sendPacket(n);break}case"suback":{delete t.outgoing[r],t.messageIdProvider.deallocate(r);let a=e.granted;for(let u=0;u<a.length;u++)if(a[u]&128){let c=t.messageIdToTopic[r];c&&c.forEach(h=>{delete t._resubscribeTopics[h]})}delete t.messageIdToTopic[r],t._invokeStoreProcessingQueue(),o(null,e);break}case"unsuback":{delete t.outgoing[r],t.messageIdProvider.deallocate(r),t._invokeStoreProcessingQueue(),o(null);break}default:t.emit("error",new Error("unrecognized packet type"))}t.disconnecting&&Object.keys(t.outgoing).length===0&&t.emit("outgoingEmpty")};br.default=o1});var Vd=M(ta=>{"use strict";_();v();m();Object.defineProperty(ta,"__esModule",{value:!0});var Hd=Yr(),a1=Si(),l1=(t,e)=>{let{options:r}=t,i=r.protocolVersion,n=i===5?e.reasonCode:e.returnCode;if(i!==5){let o=new Hd.ErrorWithReasonCode(`Protocol error: Auth packets are only supported in MQTT 5. Your version:${i}`,n);t.emit("error",o);return}t.handleAuth(e,(o,s)=>{if(o){t.emit("error",o);return}if(n===24)t.reconnecting=!1,t._sendPacket(s);else{let a=new Hd.ErrorWithReasonCode(`Connection refused: ${a1.ReasonCodes[n]}`,n);t.emit("error",a)}})};ta.default=l1});var Yd=M(Bn=>{"use strict";_();v();m();Object.defineProperty(Bn,"__esModule",{value:!0});Bn.LRUCache=void 0;var Ai=typeof performance=="object"&&performance&&typeof performance.now=="function"?performance:Date,Kd=new Set,ra=typeof B=="object"&&B?B:{},Gd=(t,e,r,i)=>{typeof ra.emitWarning=="function"?ra.emitWarning(t,e,r,i):console.error(`[${r}] ${e}: ${t}`)},Cn=globalThis.AbortController,zd=globalThis.AbortSignal;if(typeof Cn>"u"){zd=class{onabort;_onabort=[];reason;aborted=!1;addEventListener(i,n){this._onabort.push(n)}},Cn=class{constructor(){e()}signal=new zd;abort(i){if(!this.signal.aborted){this.signal.reason=i,this.signal.aborted=!0;for(let n of this.signal._onabort)n(i);this.signal.onabort?.(i)}}};let t=ra.env?.LRU_CACHE_IGNORE_AC_WARNING!=="1",e=()=>{t&&(t=!1,Gd("AbortController is not defined. If using lru-cache in node 14, load an AbortController polyfill from the `node-abort-controller` package. A minimal polyfill is provided for use by LRUCache.fetch(), but it should not be relied upon in other contexts (eg, passing it to other APIs that use AbortController/AbortSignal might have undesirable effects). You may disable this with LRU_CACHE_IGNORE_AC_WARNING=1 in the env.","NO_ABORT_CONTROLLER","ENOTSUP",e))}}var u1=t=>!Kd.has(t),lP=Symbol("type"),$t=t=>t&&t===Math.floor(t)&&t>0&&isFinite(t),Qd=t=>$t(t)?t<=Math.pow(2,8)?Uint8Array:t<=Math.pow(2,16)?Uint16Array:t<=Math.pow(2,32)?Uint32Array:t<=Number.MAX_SAFE_INTEGER?Jr:null:null,Jr=class extends Array{constructor(e){super(e),this.fill(0)}},ia=class t{heap;length;static#l=!1;static create(e){let r=Qd(e);if(!r)return[];t.#l=!0;let i=new t(e,r);return t.#l=!1,i}constructor(e,r){if(!t.#l)throw new TypeError("instantiate Stack using Stack.create(n)");this.heap=new r(e),this.length=0}push(e){this.heap[this.length++]=e}pop(){return this.heap[--this.length]}},na=class t{#l;#c;#p;#g;#B;ttl;ttlResolution;ttlAutopurge;updateAgeOnGet;updateAgeOnHas;allowStale;noDisposeOnSet;noUpdateTTL;maxEntrySize;sizeCalculation;noDeleteOnFetchRejection;noDeleteOnStaleGet;allowStaleOnFetchAbort;allowStaleOnFetchRejection;ignoreFetchAbort;#i;#y;#n;#r;#e;#u;#h;#a;#s;#b;#o;#E;#S;#w;#_;#I;#f;static unsafeExposeInternals(e){return{starts:e.#S,ttls:e.#w,sizes:e.#E,keyMap:e.#n,keyList:e.#r,valList:e.#e,next:e.#u,prev:e.#h,get head(){return e.#a},get tail(){return e.#s},free:e.#b,isBackgroundFetch:r=>e.#t(r),backgroundFetch:(r,i,n,o)=>e.#x(r,i,n,o),moveToTail:r=>e.#C(r),indexes:r=>e.#m(r),rindexes:r=>e.#v(r),isStale:r=>e.#d(r)}}get max(){return this.#l}get maxSize(){return this.#c}get calculatedSize(){return this.#y}get size(){return this.#i}get fetchMethod(){return this.#B}get dispose(){return this.#p}get disposeAfter(){return this.#g}constructor(e){let{max:r=0,ttl:i,ttlResolution:n=1,ttlAutopurge:o,updateAgeOnGet:s,updateAgeOnHas:a,allowStale:u,dispose:c,disposeAfter:h,noDisposeOnSet:d,noUpdateTTL:g,maxSize:y=0,maxEntrySize:w=0,sizeCalculation:E,fetchMethod:S,noDeleteOnFetchRejection:I,noDeleteOnStaleGet:C,allowStaleOnFetchRejection:R,allowStaleOnFetchAbort:U,ignoreFetchAbort:N}=e;if(r!==0&&!$t(r))throw new TypeError("max option must be a nonnegative integer");let W=r?Qd(r):Array;if(!W)throw new Error("invalid max value: "+r);if(this.#l=r,this.#c=y,this.maxEntrySize=w||this.#c,this.sizeCalculation=E,this.sizeCalculation){if(!this.#c&&!this.maxEntrySize)throw new TypeError("cannot set sizeCalculation without setting maxSize or maxEntrySize");if(typeof this.sizeCalculation!="function")throw new TypeError("sizeCalculation set to non-function")}if(S!==void 0&&typeof S!="function")throw new TypeError("fetchMethod must be a function if specified");if(this.#B=S,this.#I=!!S,this.#n=new Map,this.#r=new Array(r).fill(void 0),this.#e=new Array(r).fill(void 0),this.#u=new W(r),this.#h=new W(r),this.#a=0,this.#s=0,this.#b=ia.create(r),this.#i=0,this.#y=0,typeof c=="function"&&(this.#p=c),typeof h=="function"?(this.#g=h,this.#o=[]):(this.#g=void 0,this.#o=void 0),this.#_=!!this.#p,this.#f=!!this.#g,this.noDisposeOnSet=!!d,this.noUpdateTTL=!!g,this.noDeleteOnFetchRejection=!!I,this.allowStaleOnFetchRejection=!!R,this.allowStaleOnFetchAbort=!!U,this.ignoreFetchAbort=!!N,this.maxEntrySize!==0){if(this.#c!==0&&!$t(this.#c))throw new TypeError("maxSize must be a positive integer if specified");if(!$t(this.maxEntrySize))throw new TypeError("maxEntrySize must be a positive integer if specified");this.#q()}if(this.allowStale=!!u,this.noDeleteOnStaleGet=!!C,this.updateAgeOnGet=!!s,this.updateAgeOnHas=!!a,this.ttlResolution=$t(n)||n===0?n:1,this.ttlAutopurge=!!o,this.ttl=i||0,this.ttl){if(!$t(this.ttl))throw new TypeError("ttl must be a positive integer if specified");this.#k()}if(this.#l===0&&this.ttl===0&&this.#c===0)throw new TypeError("At least one of max, maxSize, or ttl is required");if(!this.ttlAutopurge&&!this.#l&&!this.#c){let K="LRU_CACHE_UNBOUNDED";u1(K)&&(Kd.add(K),Gd("TTL caching without ttlAutopurge, max, or maxSize can result in unbounded memory consumption.","UnboundedCacheWarning",K,t))}}getRemainingTTL(e){return this.#n.has(e)?1/0:0}#k(){let e=new Jr(this.#l),r=new Jr(this.#l);this.#w=e,this.#S=r,this.#M=(o,s,a=Ai.now())=>{if(r[o]=s!==0?a:0,e[o]=s,s!==0&&this.ttlAutopurge){let u=setTimeout(()=>{this.#d(o)&&this.delete(this.#r[o])},s+1);u.unref&&u.unref()}},this.#T=o=>{r[o]=e[o]!==0?Ai.now():0},this.#A=(o,s)=>{if(e[s]){let a=e[s],u=r[s];o.ttl=a,o.start=u,o.now=i||n();let c=o.now-u;o.remainingTTL=a-c}};let i=0,n=()=>{let o=Ai.now();if(this.ttlResolution>0){i=o;let s=setTimeout(()=>i=0,this.ttlResolution);s.unref&&s.unref()}return o};this.getRemainingTTL=o=>{let s=this.#n.get(o);if(s===void 0)return 0;let a=e[s],u=r[s];if(a===0||u===0)return 1/0;let c=(i||n())-u;return a-c},this.#d=o=>e[o]!==0&&r[o]!==0&&(i||n())-r[o]>e[o]}#T=()=>{};#A=()=>{};#M=()=>{};#d=()=>!1;#q(){let e=new Jr(this.#l);this.#y=0,this.#E=e,this.#R=r=>{this.#y-=e[r],e[r]=0},this.#L=(r,i,n,o)=>{if(this.#t(i))return 0;if(!$t(n))if(o){if(typeof o!="function")throw new TypeError("sizeCalculation must be a function");if(n=o(i,r),!$t(n))throw new TypeError("sizeCalculation return invalid (expect positive integer)")}else throw new TypeError("invalid size value (must be positive integer). When maxSize or maxEntrySize is used, sizeCalculation or size must be set.");return n},this.#P=(r,i,n)=>{if(e[r]=i,this.#c){let o=this.#c-e[r];for(;this.#y>o;)this.#O(!0)}this.#y+=e[r],n&&(n.entrySize=i,n.totalCalculatedSize=this.#y)}}#R=e=>{};#P=(e,r,i)=>{};#L=(e,r,i,n)=>{if(i||n)throw new TypeError("cannot set size without setting maxSize or maxEntrySize on cache");return 0};*#m({allowStale:e=this.allowStale}={}){if(this.#i)for(let r=this.#s;!(!this.#U(r)||((e||!this.#d(r))&&(yield r),r===this.#a));)r=this.#h[r]}*#v({allowStale:e=this.allowStale}={}){if(this.#i)for(let r=this.#a;!(!this.#U(r)||((e||!this.#d(r))&&(yield r),r===this.#s));)r=this.#u[r]}#U(e){return e!==void 0&&this.#n.get(this.#r[e])===e}*entries(){for(let e of this.#m())this.#e[e]!==void 0&&this.#r[e]!==void 0&&!this.#t(this.#e[e])&&(yield[this.#r[e],this.#e[e]])}*rentries(){for(let e of this.#v())this.#e[e]!==void 0&&this.#r[e]!==void 0&&!this.#t(this.#e[e])&&(yield[this.#r[e],this.#e[e]])}*keys(){for(let e of this.#m()){let r=this.#r[e];r!==void 0&&!this.#t(this.#e[e])&&(yield r)}}*rkeys(){for(let e of this.#v()){let r=this.#r[e];r!==void 0&&!this.#t(this.#e[e])&&(yield r)}}*values(){for(let e of this.#m())this.#e[e]!==void 0&&!this.#t(this.#e[e])&&(yield this.#e[e])}*rvalues(){for(let e of this.#v())this.#e[e]!==void 0&&!this.#t(this.#e[e])&&(yield this.#e[e])}[Symbol.iterator](){return this.entries()}find(e,r={}){for(let i of this.#m()){let n=this.#e[i],o=this.#t(n)?n.__staleWhileFetching:n;if(o!==void 0&&e(o,this.#r[i],this))return this.get(this.#r[i],r)}}forEach(e,r=this){for(let i of this.#m()){let n=this.#e[i],o=this.#t(n)?n.__staleWhileFetching:n;o!==void 0&&e.call(r,o,this.#r[i],this)}}rforEach(e,r=this){for(let i of this.#v()){let n=this.#e[i],o=this.#t(n)?n.__staleWhileFetching:n;o!==void 0&&e.call(r,o,this.#r[i],this)}}purgeStale(){let e=!1;for(let r of this.#v({allowStale:!0}))this.#d(r)&&(this.delete(this.#r[r]),e=!0);return e}dump(){let e=[];for(let r of this.#m({allowStale:!0})){let i=this.#r[r],n=this.#e[r],o=this.#t(n)?n.__staleWhileFetching:n;if(o===void 0||i===void 0)continue;let s={value:o};if(this.#w&&this.#S){s.ttl=this.#w[r];let a=Ai.now()-this.#S[r];s.start=Math.floor(Date.now()-a)}this.#E&&(s.size=this.#E[r]),e.unshift([i,s])}return e}load(e){this.clear();for(let[r,i]of e){if(i.start){let n=Date.now()-i.start;i.start=Ai.now()-n}this.set(r,i.value,i)}}set(e,r,i={}){if(r===void 0)return this.delete(e),this;let{ttl:n=this.ttl,start:o,noDisposeOnSet:s=this.noDisposeOnSet,sizeCalculation:a=this.sizeCalculation,status:u}=i,{noUpdateTTL:c=this.noUpdateTTL}=i,h=this.#L(e,r,i.size||0,a);if(this.maxEntrySize&&h>this.maxEntrySize)return u&&(u.set="miss",u.maxEntrySizeExceeded=!0),this.delete(e),this;let d=this.#i===0?void 0:this.#n.get(e);if(d===void 0)d=this.#i===0?this.#s:this.#b.length!==0?this.#b.pop():this.#i===this.#l?this.#O(!1):this.#i,this.#r[d]=e,this.#e[d]=r,this.#n.set(e,d),this.#u[this.#s]=d,this.#h[d]=this.#s,this.#s=d,this.#i++,this.#P(d,h,u),u&&(u.set="add"),c=!1;else{this.#C(d);let g=this.#e[d];if(r!==g){if(this.#I&&this.#t(g)){g.__abortController.abort(new Error("replaced"));let{__staleWhileFetching:y}=g;y!==void 0&&!s&&(this.#_&&this.#p?.(y,e,"set"),this.#f&&this.#o?.push([y,e,"set"]))}else s||(this.#_&&this.#p?.(g,e,"set"),this.#f&&this.#o?.push([g,e,"set"]));if(this.#R(d),this.#P(d,h,u),this.#e[d]=r,u){u.set="replace";let y=g&&this.#t(g)?g.__staleWhileFetching:g;y!==void 0&&(u.oldValue=y)}}else u&&(u.set="update")}if(n!==0&&!this.#w&&this.#k(),this.#w&&(c||this.#M(d,n,o),u&&this.#A(u,d)),!s&&this.#f&&this.#o){let g=this.#o,y;for(;y=g?.shift();)this.#g?.(...y)}return this}pop(){try{for(;this.#i;){let e=this.#e[this.#a];if(this.#O(!0),this.#t(e)){if(e.__staleWhileFetching)return e.__staleWhileFetching}else if(e!==void 0)return e}}finally{if(this.#f&&this.#o){let e=this.#o,r;for(;r=e?.shift();)this.#g?.(...r)}}}#O(e){let r=this.#a,i=this.#r[r],n=this.#e[r];return this.#I&&this.#t(n)?n.__abortController.abort(new Error("evicted")):(this.#_||this.#f)&&(this.#_&&this.#p?.(n,i,"evict"),this.#f&&this.#o?.push([n,i,"evict"])),this.#R(r),e&&(this.#r[r]=void 0,this.#e[r]=void 0,this.#b.push(r)),this.#i===1?(this.#a=this.#s=0,this.#b.length=0):this.#a=this.#u[r],this.#n.delete(i),this.#i--,r}has(e,r={}){let{updateAgeOnHas:i=this.updateAgeOnHas,status:n}=r,o=this.#n.get(e);if(o!==void 0){let s=this.#e[o];if(this.#t(s)&&s.__staleWhileFetching===void 0)return!1;if(this.#d(o))n&&(n.has="stale",this.#A(n,o));else return i&&this.#T(o),n&&(n.has="hit",this.#A(n,o)),!0}else n&&(n.has="miss");return!1}peek(e,r={}){let{allowStale:i=this.allowStale}=r,n=this.#n.get(e);if(n!==void 0&&(i||!this.#d(n))){let o=this.#e[n];return this.#t(o)?o.__staleWhileFetching:o}}#x(e,r,i,n){let o=r===void 0?void 0:this.#e[r];if(this.#t(o))return o;let s=new Cn,{signal:a}=i;a?.addEventListener("abort",()=>s.abort(a.reason),{signal:s.signal});let u={signal:s.signal,options:i,context:n},c=(E,S=!1)=>{let{aborted:I}=s.signal,C=i.ignoreFetchAbort&&E!==void 0;if(i.status&&(I&&!S?(i.status.fetchAborted=!0,i.status.fetchError=s.signal.reason,C&&(i.status.fetchAbortIgnored=!0)):i.status.fetchResolved=!0),I&&!C&&!S)return d(s.signal.reason);let R=y;return this.#e[r]===y&&(E===void 0?R.__staleWhileFetching?this.#e[r]=R.__staleWhileFetching:this.delete(e):(i.status&&(i.status.fetchUpdated=!0),this.set(e,E,u.options))),E},h=E=>(i.status&&(i.status.fetchRejected=!0,i.status.fetchError=E),d(E)),d=E=>{let{aborted:S}=s.signal,I=S&&i.allowStaleOnFetchAbort,C=I||i.allowStaleOnFetchRejection,R=C||i.noDeleteOnFetchRejection,U=y;if(this.#e[r]===y&&(!R||U.__staleWhileFetching===void 0?this.delete(e):I||(this.#e[r]=U.__staleWhileFetching)),C)return i.status&&U.__staleWhileFetching!==void 0&&(i.status.returnedStale=!0),U.__staleWhileFetching;if(U.__returned===U)throw E},g=(E,S)=>{let I=this.#B?.(e,o,u);I&&I instanceof Promise&&I.then(C=>E(C===void 0?void 0:C),S),s.signal.addEventListener("abort",()=>{(!i.ignoreFetchAbort||i.allowStaleOnFetchAbort)&&(E(void 0),i.allowStaleOnFetchAbort&&(E=C=>c(C,!0)))})};i.status&&(i.status.fetchDispatched=!0);let y=new Promise(g).then(c,h),w=Object.assign(y,{__abortController:s,__staleWhileFetching:o,__returned:void 0});return r===void 0?(this.set(e,w,{...u.options,status:void 0}),r=this.#n.get(e)):this.#e[r]=w,w}#t(e){if(!this.#I)return!1;let r=e;return!!r&&r instanceof Promise&&r.hasOwnProperty("__staleWhileFetching")&&r.__abortController instanceof Cn}async fetch(e,r={}){let{allowStale:i=this.allowStale,updateAgeOnGet:n=this.updateAgeOnGet,noDeleteOnStaleGet:o=this.noDeleteOnStaleGet,ttl:s=this.ttl,noDisposeOnSet:a=this.noDisposeOnSet,size:u=0,sizeCalculation:c=this.sizeCalculation,noUpdateTTL:h=this.noUpdateTTL,noDeleteOnFetchRejection:d=this.noDeleteOnFetchRejection,allowStaleOnFetchRejection:g=this.allowStaleOnFetchRejection,ignoreFetchAbort:y=this.ignoreFetchAbort,allowStaleOnFetchAbort:w=this.allowStaleOnFetchAbort,context:E,forceRefresh:S=!1,status:I,signal:C}=r;if(!this.#I)return I&&(I.fetch="get"),this.get(e,{allowStale:i,updateAgeOnGet:n,noDeleteOnStaleGet:o,status:I});let R={allowStale:i,updateAgeOnGet:n,noDeleteOnStaleGet:o,ttl:s,noDisposeOnSet:a,size:u,sizeCalculation:c,noUpdateTTL:h,noDeleteOnFetchRejection:d,allowStaleOnFetchRejection:g,allowStaleOnFetchAbort:w,ignoreFetchAbort:y,status:I,signal:C},U=this.#n.get(e);if(U===void 0){I&&(I.fetch="miss");let N=this.#x(e,U,R,E);return N.__returned=N}else{let N=this.#e[U];if(this.#t(N)){let de=i&&N.__staleWhileFetching!==void 0;return I&&(I.fetch="inflight",de&&(I.returnedStale=!0)),de?N.__staleWhileFetching:N.__returned=N}let W=this.#d(U);if(!S&&!W)return I&&(I.fetch="hit"),this.#C(U),n&&this.#T(U),I&&this.#A(I,U),N;let K=this.#x(e,U,R,E),G=K.__staleWhileFetching!==void 0&&i;return I&&(I.fetch=W?"stale":"refresh",G&&W&&(I.returnedStale=!0)),G?K.__staleWhileFetching:K.__returned=K}}get(e,r={}){let{allowStale:i=this.allowStale,updateAgeOnGet:n=this.updateAgeOnGet,noDeleteOnStaleGet:o=this.noDeleteOnStaleGet,status:s}=r,a=this.#n.get(e);if(a!==void 0){let u=this.#e[a],c=this.#t(u);return s&&this.#A(s,a),this.#d(a)?(s&&(s.get="stale"),c?(s&&i&&u.__staleWhileFetching!==void 0&&(s.returnedStale=!0),i?u.__staleWhileFetching:void 0):(o||this.delete(e),s&&i&&(s.returnedStale=!0),i?u:void 0)):(s&&(s.get="hit"),c?u.__staleWhileFetching:(this.#C(a),n&&this.#T(a),u))}else s&&(s.get="miss")}#N(e,r){this.#h[r]=e,this.#u[e]=r}#C(e){e!==this.#s&&(e===this.#a?this.#a=this.#u[e]:this.#N(this.#h[e],this.#u[e]),this.#N(this.#s,e),this.#s=e)}delete(e){let r=!1;if(this.#i!==0){let i=this.#n.get(e);if(i!==void 0)if(r=!0,this.#i===1)this.clear();else{this.#R(i);let n=this.#e[i];this.#t(n)?n.__abortController.abort(new Error("deleted")):(this.#_||this.#f)&&(this.#_&&this.#p?.(n,e,"delete"),this.#f&&this.#o?.push([n,e,"delete"])),this.#n.delete(e),this.#r[i]=void 0,this.#e[i]=void 0,i===this.#s?this.#s=this.#h[i]:i===this.#a?this.#a=this.#u[i]:(this.#u[this.#h[i]]=this.#u[i],this.#h[this.#u[i]]=this.#h[i]),this.#i--,this.#b.push(i)}}if(this.#f&&this.#o?.length){let i=this.#o,n;for(;n=i?.shift();)this.#g?.(...n)}return r}clear(){for(let e of this.#v({allowStale:!0})){let r=this.#e[e];if(this.#t(r))r.__abortController.abort(new Error("deleted"));else{let i=this.#r[e];this.#_&&this.#p?.(r,i,"delete"),this.#f&&this.#o?.push([r,i,"delete"])}}if(this.#n.clear(),this.#e.fill(void 0),this.#r.fill(void 0),this.#w&&this.#S&&(this.#w.fill(0),this.#S.fill(0)),this.#E&&this.#E.fill(0),this.#a=0,this.#s=0,this.#b.length=0,this.#y=0,this.#i=0,this.#f&&this.#o){let e=this.#o,r;for(;r=e?.shift();)this.#g?.(...r)}}};Bn.LRUCache=na});var at=M(Ht=>{"use strict";_();v();m();Object.defineProperty(Ht,"t",{value:!0});Ht.ContainerIterator=Ht.Container=Ht.Base=void 0;var sa=class{constructor(e=0){this.iteratorType=e}equals(e){return this.o===e.o}};Ht.ContainerIterator=sa;var Pn=class{constructor(){this.i=0}get length(){return this.i}size(){return this.i}empty(){return this.i===0}};Ht.Base=Pn;var oa=class extends Pn{};Ht.Container=oa});var Jd=M(On=>{"use strict";_();v();m();Object.defineProperty(On,"t",{value:!0});On.default=void 0;var f1=at(),aa=class extends f1.Base{constructor(e=[]){super(),this.S=[];let r=this;e.forEach(function(i){r.push(i)})}clear(){this.i=0,this.S=[]}push(e){return this.S.push(e),this.i+=1,this.i}pop(){if(this.i!==0)return this.i-=1,this.S.pop()}top(){return this.S[this.i-1]}},c1=aa;On.default=c1});var Xd=M(xn=>{"use strict";_();v();m();Object.defineProperty(xn,"t",{value:!0});xn.default=void 0;var h1=at(),la=class extends h1.Base{constructor(e=[]){super(),this.j=0,this.q=[];let r=this;e.forEach(function(i){r.push(i)})}clear(){this.q=[],this.i=this.j=0}push(e){let r=this.q.length;if(this.j/r>.5&&this.j+this.i>=r&&r>4096){let i=this.i;for(let n=0;n<i;++n)this.q[n]=this.q[this.j+n];this.j=0,this.q[this.i]=e}else this.q[this.j+this.i]=e;return++this.i}pop(){if(this.i===0)return;let e=this.q[this.j++];return this.i-=1,e}front(){if(this.i!==0)return this.q[this.j]}},d1=la;xn.default=d1});var Zd=M(kn=>{"use strict";_();v();m();Object.defineProperty(kn,"t",{value:!0});kn.default=void 0;var p1=at(),ua=class extends p1.Base{constructor(e=[],r=function(n,o){return n>o?-1:n<o?1:0},i=!0){if(super(),this.v=r,Array.isArray(e))this.C=i?[...e]:e;else{this.C=[];let o=this;e.forEach(function(s){o.C.push(s)})}this.i=this.C.length;let n=this.i>>1;for(let o=this.i-1>>1;o>=0;--o)this.k(o,n)}m(e){let r=this.C[e];for(;e>0;){let i=e-1>>1,n=this.C[i];if(this.v(n,r)<=0)break;this.C[e]=n,e=i}this.C[e]=r}k(e,r){let i=this.C[e];for(;e<r;){let n=e<<1|1,o=n+1,s=this.C[n];if(o<this.i&&this.v(s,this.C[o])>0&&(n=o,s=this.C[o]),this.v(s,i)>=0)break;this.C[e]=s,e=n}this.C[e]=i}clear(){this.i=0,this.C.length=0}push(e){this.C.push(e),this.m(this.i),this.i+=1}pop(){if(this.i===0)return;let e=this.C[0],r=this.C.pop();return this.i-=1,this.i&&(this.C[0]=r,this.k(0,this.i>>1)),e}top(){return this.C[0]}find(e){return this.C.indexOf(e)>=0}remove(e){let r=this.C.indexOf(e);return r<0?!1:(r===0?this.pop():r===this.i-1?(this.C.pop(),this.i-=1):(this.C.splice(r,1,this.C.pop()),this.i-=1,this.m(r),this.k(r,this.i>>1)),!0)}updateItem(e){let r=this.C.indexOf(e);return r<0?!1:(this.m(r),this.k(r,this.i>>1),!0)}toArray(){return[...this.C]}},g1=ua;kn.default=g1});var Ln=M(Mn=>{"use strict";_();v();m();Object.defineProperty(Mn,"t",{value:!0});Mn.default=void 0;var y1=at(),fa=class extends y1.Container{},b1=fa;Mn.default=b1});var lt=M(ca=>{"use strict";_();v();m();Object.defineProperty(ca,"t",{value:!0});ca.throwIteratorAccessError=w1;function w1(){throw new RangeError("Iterator access denied!")}});var da=M(Nn=>{"use strict";_();v();m();Object.defineProperty(Nn,"t",{value:!0});Nn.RandomIterator=void 0;var _1=at(),Un=lt(),ha=class extends _1.ContainerIterator{constructor(e,r){super(r),this.o=e,this.iteratorType===0?(this.pre=function(){return this.o===0&&(0,Un.throwIteratorAccessError)(),this.o-=1,this},this.next=function(){return this.o===this.container.size()&&(0,Un.throwIteratorAccessError)(),this.o+=1,this}):(this.pre=function(){return this.o===this.container.size()-1&&(0,Un.throwIteratorAccessError)(),this.o+=1,this},this.next=function(){return this.o===-1&&(0,Un.throwIteratorAccessError)(),this.o-=1,this})}get pointer(){return this.container.getElementByPos(this.o)}set pointer(e){this.container.setElementByPos(this.o,e)}};Nn.RandomIterator=ha});var ep=M(qn=>{"use strict";_();v();m();Object.defineProperty(qn,"t",{value:!0});qn.default=void 0;var m1=E1(Ln()),v1=da();function E1(t){return t&&t.t?t:{default:t}}var wr=class t extends v1.RandomIterator{constructor(e,r,i){super(e,i),this.container=r}copy(){return new t(this.o,this.container,this.iteratorType)}},pa=class extends m1.default{constructor(e=[],r=!0){if(super(),Array.isArray(e))this.J=r?[...e]:e,this.i=e.length;else{this.J=[];let i=this;e.forEach(function(n){i.pushBack(n)})}}clear(){this.i=0,this.J.length=0}begin(){return new wr(0,this)}end(){return new wr(this.i,this)}rBegin(){return new wr(this.i-1,this,1)}rEnd(){return new wr(-1,this,1)}front(){return this.J[0]}back(){return this.J[this.i-1]}getElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;return this.J[e]}eraseElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;return this.J.splice(e,1),this.i-=1,this.i}eraseElementByValue(e){let r=0;for(let i=0;i<this.i;++i)this.J[i]!==e&&(this.J[r++]=this.J[i]);return this.i=this.J.length=r,this.i}eraseElementByIterator(e){let r=e.o;return e=e.next(),this.eraseElementByPos(r),e}pushBack(e){return this.J.push(e),this.i+=1,this.i}popBack(){if(this.i!==0)return this.i-=1,this.J.pop()}setElementByPos(e,r){if(e<0||e>this.i-1)throw new RangeError;this.J[e]=r}insert(e,r,i=1){if(e<0||e>this.i)throw new RangeError;return this.J.splice(e,0,...new Array(i).fill(r)),this.i+=i,this.i}find(e){for(let r=0;r<this.i;++r)if(this.J[r]===e)return new wr(r,this);return this.end()}reverse(){this.J.reverse()}unique(){let e=1;for(let r=1;r<this.i;++r)this.J[r]!==this.J[r-1]&&(this.J[e++]=this.J[r]);return this.i=this.J.length=e,this.i}sort(e){this.J.sort(e)}forEach(e){for(let r=0;r<this.i;++r)e(this.J[r],r,this)}[Symbol.iterator](){return function*(){yield*this.J}.bind(this)()}},S1=pa;qn.default=S1});var tp=M(Dn=>{"use strict";_();v();m();Object.defineProperty(Dn,"t",{value:!0});Dn.default=void 0;var A1=T1(Ln()),I1=at(),_r=lt();function T1(t){return t&&t.t?t:{default:t}}var mr=class t extends I1.ContainerIterator{constructor(e,r,i,n){super(n),this.o=e,this.h=r,this.container=i,this.iteratorType===0?(this.pre=function(){return this.o.L===this.h&&(0,_r.throwIteratorAccessError)(),this.o=this.o.L,this},this.next=function(){return this.o===this.h&&(0,_r.throwIteratorAccessError)(),this.o=this.o.B,this}):(this.pre=function(){return this.o.B===this.h&&(0,_r.throwIteratorAccessError)(),this.o=this.o.B,this},this.next=function(){return this.o===this.h&&(0,_r.throwIteratorAccessError)(),this.o=this.o.L,this})}get pointer(){return this.o===this.h&&(0,_r.throwIteratorAccessError)(),this.o.l}set pointer(e){this.o===this.h&&(0,_r.throwIteratorAccessError)(),this.o.l=e}copy(){return new t(this.o,this.h,this.container,this.iteratorType)}},ga=class extends A1.default{constructor(e=[]){super(),this.h={},this.p=this._=this.h.L=this.h.B=this.h;let r=this;e.forEach(function(i){r.pushBack(i)})}V(e){let{L:r,B:i}=e;r.B=i,i.L=r,e===this.p&&(this.p=i),e===this._&&(this._=r),this.i-=1}G(e,r){let i=r.B,n={l:e,L:r,B:i};r.B=n,i.L=n,r===this.h&&(this.p=n),i===this.h&&(this._=n),this.i+=1}clear(){this.i=0,this.p=this._=this.h.L=this.h.B=this.h}begin(){return new mr(this.p,this.h,this)}end(){return new mr(this.h,this.h,this)}rBegin(){return new mr(this._,this.h,this,1)}rEnd(){return new mr(this.h,this.h,this,1)}front(){return this.p.l}back(){return this._.l}getElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let r=this.p;for(;e--;)r=r.B;return r.l}eraseElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let r=this.p;for(;e--;)r=r.B;return this.V(r),this.i}eraseElementByValue(e){let r=this.p;for(;r!==this.h;)r.l===e&&this.V(r),r=r.B;return this.i}eraseElementByIterator(e){let r=e.o;return r===this.h&&(0,_r.throwIteratorAccessError)(),e=e.next(),this.V(r),e}pushBack(e){return this.G(e,this._),this.i}popBack(){if(this.i===0)return;let e=this._.l;return this.V(this._),e}pushFront(e){return this.G(e,this.h),this.i}popFront(){if(this.i===0)return;let e=this.p.l;return this.V(this.p),e}setElementByPos(e,r){if(e<0||e>this.i-1)throw new RangeError;let i=this.p;for(;e--;)i=i.B;i.l=r}insert(e,r,i=1){if(e<0||e>this.i)throw new RangeError;if(i<=0)return this.i;if(e===0)for(;i--;)this.pushFront(r);else if(e===this.i)for(;i--;)this.pushBack(r);else{let n=this.p;for(let s=1;s<e;++s)n=n.B;let o=n.B;for(this.i+=i;i--;)n.B={l:r,L:n},n.B.L=n,n=n.B;n.B=o,o.L=n}return this.i}find(e){let r=this.p;for(;r!==this.h;){if(r.l===e)return new mr(r,this.h,this);r=r.B}return this.end()}reverse(){if(this.i<=1)return;let e=this.p,r=this._,i=0;for(;i<<1<this.i;){let n=e.l;e.l=r.l,r.l=n,e=e.B,r=r.L,i+=1}}unique(){if(this.i<=1)return this.i;let e=this.p;for(;e!==this.h;){let r=e;for(;r.B!==this.h&&r.l===r.B.l;)r=r.B,this.i-=1;e.B=r.B,e.B.L=e,e=e.B}return this.i}sort(e){if(this.i<=1)return;let r=[];this.forEach(function(n){r.push(n)}),r.sort(e);let i=this.p;r.forEach(function(n){i.l=n,i=i.B})}merge(e){let r=this;if(this.i===0)e.forEach(function(i){r.pushBack(i)});else{let i=this.p;e.forEach(function(n){for(;i!==r.h&&i.l<=n;)i=i.B;r.G(n,i.L)})}return this.i}forEach(e){let r=this.p,i=0;for(;r!==this.h;)e(r.l,i++,this),r=r.B}[Symbol.iterator](){return function*(){if(this.i===0)return;let e=this.p;for(;e!==this.h;)yield e.l,e=e.B}.bind(this)()}},R1=ga;Dn.default=R1});var rp=M(jn=>{"use strict";_();v();m();Object.defineProperty(jn,"t",{value:!0});jn.default=void 0;var C1=P1(Ln()),B1=da();function P1(t){return t&&t.t?t:{default:t}}var vr=class t extends B1.RandomIterator{constructor(e,r,i){super(e,i),this.container=r}copy(){return new t(this.o,this.container,this.iteratorType)}},ya=class extends C1.default{constructor(e=[],r=4096){super(),this.j=0,this.D=0,this.R=0,this.N=0,this.P=0,this.A=[];let i=(()=>{if(typeof e.length=="number")return e.length;if(typeof e.size=="number")return e.size;if(typeof e.size=="function")return e.size();throw new TypeError("Cannot get the length or size of the container")})();this.F=r,this.P=Math.max(Math.ceil(i/this.F),1);for(let s=0;s<this.P;++s)this.A.push(new Array(this.F));let n=Math.ceil(i/this.F);this.j=this.R=(this.P>>1)-(n>>1),this.D=this.N=this.F-i%this.F>>1;let o=this;e.forEach(function(s){o.pushBack(s)})}T(){let e=[],r=Math.max(this.P>>1,1);for(let i=0;i<r;++i)e[i]=new Array(this.F);for(let i=this.j;i<this.P;++i)e[e.length]=this.A[i];for(let i=0;i<this.R;++i)e[e.length]=this.A[i];e[e.length]=[...this.A[this.R]],this.j=r,this.R=e.length-1;for(let i=0;i<r;++i)e[e.length]=new Array(this.F);this.A=e,this.P=e.length}O(e){let r=this.D+e+1,i=r%this.F,n=i-1,o=this.j+(r-i)/this.F;return i===0&&(o-=1),o%=this.P,n<0&&(n+=this.F),{curNodeBucketIndex:o,curNodePointerIndex:n}}clear(){this.A=[new Array(this.F)],this.P=1,this.j=this.R=this.i=0,this.D=this.N=this.F>>1}begin(){return new vr(0,this)}end(){return new vr(this.i,this)}rBegin(){return new vr(this.i-1,this,1)}rEnd(){return new vr(-1,this,1)}front(){if(this.i!==0)return this.A[this.j][this.D]}back(){if(this.i!==0)return this.A[this.R][this.N]}pushBack(e){return this.i&&(this.N<this.F-1?this.N+=1:this.R<this.P-1?(this.R+=1,this.N=0):(this.R=0,this.N=0),this.R===this.j&&this.N===this.D&&this.T()),this.i+=1,this.A[this.R][this.N]=e,this.i}popBack(){if(this.i===0)return;let e=this.A[this.R][this.N];return this.i!==1&&(this.N>0?this.N-=1:this.R>0?(this.R-=1,this.N=this.F-1):(this.R=this.P-1,this.N=this.F-1)),this.i-=1,e}pushFront(e){return this.i&&(this.D>0?this.D-=1:this.j>0?(this.j-=1,this.D=this.F-1):(this.j=this.P-1,this.D=this.F-1),this.j===this.R&&this.D===this.N&&this.T()),this.i+=1,this.A[this.j][this.D]=e,this.i}popFront(){if(this.i===0)return;let e=this.A[this.j][this.D];return this.i!==1&&(this.D<this.F-1?this.D+=1:this.j<this.P-1?(this.j+=1,this.D=0):(this.j=0,this.D=0)),this.i-=1,e}getElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let{curNodeBucketIndex:r,curNodePointerIndex:i}=this.O(e);return this.A[r][i]}setElementByPos(e,r){if(e<0||e>this.i-1)throw new RangeError;let{curNodeBucketIndex:i,curNodePointerIndex:n}=this.O(e);this.A[i][n]=r}insert(e,r,i=1){if(e<0||e>this.i)throw new RangeError;if(e===0)for(;i--;)this.pushFront(r);else if(e===this.i)for(;i--;)this.pushBack(r);else{let n=[];for(let o=e;o<this.i;++o)n.push(this.getElementByPos(o));this.cut(e-1);for(let o=0;o<i;++o)this.pushBack(r);for(let o=0;o<n.length;++o)this.pushBack(n[o])}return this.i}cut(e){if(e<0)return this.clear(),0;let{curNodeBucketIndex:r,curNodePointerIndex:i}=this.O(e);return this.R=r,this.N=i,this.i=e+1,this.i}eraseElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;if(e===0)this.popFront();else if(e===this.i-1)this.popBack();else{let r=[];for(let n=e+1;n<this.i;++n)r.push(this.getElementByPos(n));this.cut(e),this.popBack();let i=this;r.forEach(function(n){i.pushBack(n)})}return this.i}eraseElementByValue(e){if(this.i===0)return 0;let r=[];for(let n=0;n<this.i;++n){let o=this.getElementByPos(n);o!==e&&r.push(o)}let i=r.length;for(let n=0;n<i;++n)this.setElementByPos(n,r[n]);return this.cut(i-1)}eraseElementByIterator(e){let r=e.o;return this.eraseElementByPos(r),e=e.next(),e}find(e){for(let r=0;r<this.i;++r)if(this.getElementByPos(r)===e)return new vr(r,this);return this.end()}reverse(){let e=0,r=this.i-1;for(;e<r;){let i=this.getElementByPos(e);this.setElementByPos(e,this.getElementByPos(r)),this.setElementByPos(r,i),e+=1,r-=1}}unique(){if(this.i<=1)return this.i;let e=1,r=this.getElementByPos(0);for(let i=1;i<this.i;++i){let n=this.getElementByPos(i);n!==r&&(r=n,this.setElementByPos(e++,n))}for(;this.i>e;)this.popBack();return this.i}sort(e){let r=[];for(let i=0;i<this.i;++i)r.push(this.getElementByPos(i));r.sort(e);for(let i=0;i<this.i;++i)this.setElementByPos(i,r[i])}shrinkToFit(){if(this.i===0)return;let e=[];this.forEach(function(r){e.push(r)}),this.P=Math.max(Math.ceil(this.i/this.F),1),this.i=this.j=this.R=this.D=this.N=0,this.A=[];for(let r=0;r<this.P;++r)this.A.push(new Array(this.F));for(let r=0;r<e.length;++r)this.pushBack(e[r])}forEach(e){for(let r=0;r<this.i;++r)e(this.getElementByPos(r),r,this)}[Symbol.iterator](){return function*(){for(let e=0;e<this.i;++e)yield this.getElementByPos(e)}.bind(this)()}},O1=ya;jn.default=O1});var ip=M(Xr=>{"use strict";_();v();m();Object.defineProperty(Xr,"t",{value:!0});Xr.TreeNodeEnableIndex=Xr.TreeNode=void 0;var Fn=class{constructor(e,r){this.ee=1,this.u=void 0,this.l=void 0,this.U=void 0,this.W=void 0,this.tt=void 0,this.u=e,this.l=r}L(){let e=this;if(e.ee===1&&e.tt.tt===e)e=e.W;else if(e.U)for(e=e.U;e.W;)e=e.W;else{let r=e.tt;for(;r.U===e;)e=r,r=e.tt;e=r}return e}B(){let e=this;if(e.W){for(e=e.W;e.U;)e=e.U;return e}else{let r=e.tt;for(;r.W===e;)e=r,r=e.tt;return e.W!==r?r:e}}te(){let e=this.tt,r=this.W,i=r.U;return e.tt===this?e.tt=r:e.U===this?e.U=r:e.W=r,r.tt=e,r.U=this,this.tt=r,this.W=i,i&&(i.tt=this),r}se(){let e=this.tt,r=this.U,i=r.W;return e.tt===this?e.tt=r:e.U===this?e.U=r:e.W=r,r.tt=e,r.W=this,this.tt=r,this.U=i,i&&(i.tt=this),r}};Xr.TreeNode=Fn;var ba=class extends Fn{constructor(){super(...arguments),this.rt=1}te(){let e=super.te();return this.ie(),e.ie(),e}se(){let e=super.se();return this.ie(),e.ie(),e}ie(){this.rt=1,this.U&&(this.rt+=this.U.rt),this.W&&(this.rt+=this.W.rt)}};Xr.TreeNodeEnableIndex=ba});var _a=M(Wn=>{"use strict";_();v();m();Object.defineProperty(Wn,"t",{value:!0});Wn.default=void 0;var np=ip(),x1=at(),sp=lt(),wa=class extends x1.Container{constructor(e=function(i,n){return i<n?-1:i>n?1:0},r=!1){super(),this.Y=void 0,this.v=e,r?(this.re=np.TreeNodeEnableIndex,this.M=function(i,n,o){let s=this.ne(i,n,o);if(s){let a=s.tt;for(;a!==this.h;)a.rt+=1,a=a.tt;let u=this.he(s);if(u){let{parentNode:c,grandParent:h,curNode:d}=u;c.ie(),h.ie(),d.ie()}}return this.i},this.V=function(i){let n=this.fe(i);for(;n!==this.h;)n.rt-=1,n=n.tt}):(this.re=np.TreeNode,this.M=function(i,n,o){let s=this.ne(i,n,o);return s&&this.he(s),this.i},this.V=this.fe),this.h=new this.re}X(e,r){let i=this.h;for(;e;){let n=this.v(e.u,r);if(n<0)e=e.W;else if(n>0)i=e,e=e.U;else return e}return i}Z(e,r){let i=this.h;for(;e;)this.v(e.u,r)<=0?e=e.W:(i=e,e=e.U);return i}$(e,r){let i=this.h;for(;e;){let n=this.v(e.u,r);if(n<0)i=e,e=e.W;else if(n>0)e=e.U;else return e}return i}rr(e,r){let i=this.h;for(;e;)this.v(e.u,r)<0?(i=e,e=e.W):e=e.U;return i}ue(e){for(;;){let r=e.tt;if(r===this.h)return;if(e.ee===1){e.ee=0;return}if(e===r.U){let i=r.W;if(i.ee===1)i.ee=0,r.ee=1,r===this.Y?this.Y=r.te():r.te();else if(i.W&&i.W.ee===1){i.ee=r.ee,r.ee=0,i.W.ee=0,r===this.Y?this.Y=r.te():r.te();return}else i.U&&i.U.ee===1?(i.ee=1,i.U.ee=0,i.se()):(i.ee=1,e=r)}else{let i=r.U;if(i.ee===1)i.ee=0,r.ee=1,r===this.Y?this.Y=r.se():r.se();else if(i.U&&i.U.ee===1){i.ee=r.ee,r.ee=0,i.U.ee=0,r===this.Y?this.Y=r.se():r.se();return}else i.W&&i.W.ee===1?(i.ee=1,i.W.ee=0,i.te()):(i.ee=1,e=r)}}}fe(e){if(this.i===1)return this.clear(),this.h;let r=e;for(;r.U||r.W;){if(r.W)for(r=r.W;r.U;)r=r.U;else r=r.U;[e.u,r.u]=[r.u,e.u],[e.l,r.l]=[r.l,e.l],e=r}this.h.U===r?this.h.U=r.tt:this.h.W===r&&(this.h.W=r.tt),this.ue(r);let i=r.tt;return r===i.U?i.U=void 0:i.W=void 0,this.i-=1,this.Y.ee=0,i}oe(e,r){return e===void 0?!1:this.oe(e.U,r)||r(e)?!0:this.oe(e.W,r)}he(e){for(;;){let r=e.tt;if(r.ee===0)return;let i=r.tt;if(r===i.U){let n=i.W;if(n&&n.ee===1){if(n.ee=r.ee=0,i===this.Y)return;i.ee=1,e=i;continue}else if(e===r.W){if(e.ee=0,e.U&&(e.U.tt=r),e.W&&(e.W.tt=i),r.W=e.U,i.U=e.W,e.U=r,e.W=i,i===this.Y)this.Y=e,this.h.tt=e;else{let o=i.tt;o.U===i?o.U=e:o.W=e}return e.tt=i.tt,r.tt=e,i.tt=e,i.ee=1,{parentNode:r,grandParent:i,curNode:e}}else r.ee=0,i===this.Y?this.Y=i.se():i.se(),i.ee=1}else{let n=i.U;if(n&&n.ee===1){if(n.ee=r.ee=0,i===this.Y)return;i.ee=1,e=i;continue}else if(e===r.U){if(e.ee=0,e.U&&(e.U.tt=i),e.W&&(e.W.tt=r),i.W=e.U,r.U=e.W,e.U=i,e.W=r,i===this.Y)this.Y=e,this.h.tt=e;else{let o=i.tt;o.U===i?o.U=e:o.W=e}return e.tt=i.tt,r.tt=e,i.tt=e,i.ee=1,{parentNode:r,grandParent:i,curNode:e}}else r.ee=0,i===this.Y?this.Y=i.te():i.te(),i.ee=1}return}}ne(e,r,i){if(this.Y===void 0){this.i+=1,this.Y=new this.re(e,r),this.Y.ee=0,this.Y.tt=this.h,this.h.tt=this.Y,this.h.U=this.Y,this.h.W=this.Y;return}let n,o=this.h.U,s=this.v(o.u,e);if(s===0){o.l=r;return}else if(s>0)o.U=new this.re(e,r),o.U.tt=o,n=o.U,this.h.U=n;else{let a=this.h.W,u=this.v(a.u,e);if(u===0){a.l=r;return}else if(u<0)a.W=new this.re(e,r),a.W.tt=a,n=a.W,this.h.W=n;else{if(i!==void 0){let c=i.o;if(c!==this.h){let h=this.v(c.u,e);if(h===0){c.l=r;return}else if(h>0){let d=c.L(),g=this.v(d.u,e);if(g===0){d.l=r;return}else g<0&&(n=new this.re(e,r),d.W===void 0?(d.W=n,n.tt=d):(c.U=n,n.tt=c))}}}if(n===void 0)for(n=this.Y;;){let c=this.v(n.u,e);if(c>0){if(n.U===void 0){n.U=new this.re(e,r),n.U.tt=n,n=n.U;break}n=n.U}else if(c<0){if(n.W===void 0){n.W=new this.re(e,r),n.W.tt=n,n=n.W;break}n=n.W}else{n.l=r;return}}}}return this.i+=1,n}I(e,r){for(;e;){let i=this.v(e.u,r);if(i<0)e=e.W;else if(i>0)e=e.U;else return e}return e||this.h}clear(){this.i=0,this.Y=void 0,this.h.tt=void 0,this.h.U=this.h.W=void 0}updateKeyByIterator(e,r){let i=e.o;if(i===this.h&&(0,sp.throwIteratorAccessError)(),this.i===1)return i.u=r,!0;if(i===this.h.U)return this.v(i.B().u,r)>0?(i.u=r,!0):!1;if(i===this.h.W)return this.v(i.L().u,r)<0?(i.u=r,!0):!1;let n=i.L().u;if(this.v(n,r)>=0)return!1;let o=i.B().u;return this.v(o,r)<=0?!1:(i.u=r,!0)}eraseElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let r=0,i=this;return this.oe(this.Y,function(n){return e===r?(i.V(n),!0):(r+=1,!1)}),this.i}eraseElementByKey(e){if(this.i===0)return!1;let r=this.I(this.Y,e);return r===this.h?!1:(this.V(r),!0)}eraseElementByIterator(e){let r=e.o;r===this.h&&(0,sp.throwIteratorAccessError)();let i=r.W===void 0;return e.iteratorType===0?i&&e.next():(!i||r.U===void 0)&&e.next(),this.V(r),e}forEach(e){let r=0;for(let i of this)e(i,r++,this)}getElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let r,i=0;for(let n of this){if(i===e){r=n;break}i+=1}return r}getHeight(){if(this.i===0)return 0;let e=function(r){return r?Math.max(e(r.U),e(r.W))+1:0};return e(this.Y)}},k1=wa;Wn.default=k1});var va=M(Hn=>{"use strict";_();v();m();Object.defineProperty(Hn,"t",{value:!0});Hn.default=void 0;var M1=at(),$n=lt(),ma=class extends M1.ContainerIterator{constructor(e,r,i){super(i),this.o=e,this.h=r,this.iteratorType===0?(this.pre=function(){return this.o===this.h.U&&(0,$n.throwIteratorAccessError)(),this.o=this.o.L(),this},this.next=function(){return this.o===this.h&&(0,$n.throwIteratorAccessError)(),this.o=this.o.B(),this}):(this.pre=function(){return this.o===this.h.W&&(0,$n.throwIteratorAccessError)(),this.o=this.o.B(),this},this.next=function(){return this.o===this.h&&(0,$n.throwIteratorAccessError)(),this.o=this.o.L(),this})}get index(){let e=this.o,r=this.h.tt;if(e===this.h)return r?r.rt-1:0;let i=0;for(e.U&&(i+=e.U.rt);e!==r;){let n=e.tt;e===n.W&&(i+=1,n.U&&(i+=n.U.rt)),e=n}return i}},L1=ma;Hn.default=L1});var ap=M(Vn=>{"use strict";_();v();m();Object.defineProperty(Vn,"t",{value:!0});Vn.default=void 0;var U1=op(_a()),N1=op(va()),q1=lt();function op(t){return t&&t.t?t:{default:t}}var Ke=class t extends N1.default{constructor(e,r,i,n){super(e,r,n),this.container=i}get pointer(){return this.o===this.h&&(0,q1.throwIteratorAccessError)(),this.o.u}copy(){return new t(this.o,this.h,this.container,this.iteratorType)}},Ea=class extends U1.default{constructor(e=[],r,i){super(r,i);let n=this;e.forEach(function(o){n.insert(o)})}*K(e){e!==void 0&&(yield*this.K(e.U),yield e.u,yield*this.K(e.W))}begin(){return new Ke(this.h.U||this.h,this.h,this)}end(){return new Ke(this.h,this.h,this)}rBegin(){return new Ke(this.h.W||this.h,this.h,this,1)}rEnd(){return new Ke(this.h,this.h,this,1)}front(){return this.h.U?this.h.U.u:void 0}back(){return this.h.W?this.h.W.u:void 0}insert(e,r){return this.M(e,void 0,r)}find(e){let r=this.I(this.Y,e);return new Ke(r,this.h,this)}lowerBound(e){let r=this.X(this.Y,e);return new Ke(r,this.h,this)}upperBound(e){let r=this.Z(this.Y,e);return new Ke(r,this.h,this)}reverseLowerBound(e){let r=this.$(this.Y,e);return new Ke(r,this.h,this)}reverseUpperBound(e){let r=this.rr(this.Y,e);return new Ke(r,this.h,this)}union(e){let r=this;return e.forEach(function(i){r.insert(i)}),this.i}[Symbol.iterator](){return this.K(this.Y)}},D1=Ea;Vn.default=D1});var up=M(zn=>{"use strict";_();v();m();Object.defineProperty(zn,"t",{value:!0});zn.default=void 0;var j1=lp(_a()),F1=lp(va()),W1=lt();function lp(t){return t&&t.t?t:{default:t}}var Ge=class t extends F1.default{constructor(e,r,i,n){super(e,r,n),this.container=i}get pointer(){this.o===this.h&&(0,W1.throwIteratorAccessError)();let e=this;return new Proxy([],{get(r,i){if(i==="0")return e.o.u;if(i==="1")return e.o.l},set(r,i,n){if(i!=="1")throw new TypeError("props must be 1");return e.o.l=n,!0}})}copy(){return new t(this.o,this.h,this.container,this.iteratorType)}},Sa=class extends j1.default{constructor(e=[],r,i){super(r,i);let n=this;e.forEach(function(o){n.setElement(o[0],o[1])})}*K(e){e!==void 0&&(yield*this.K(e.U),yield[e.u,e.l],yield*this.K(e.W))}begin(){return new Ge(this.h.U||this.h,this.h,this)}end(){return new Ge(this.h,this.h,this)}rBegin(){return new Ge(this.h.W||this.h,this.h,this,1)}rEnd(){return new Ge(this.h,this.h,this,1)}front(){if(this.i===0)return;let e=this.h.U;return[e.u,e.l]}back(){if(this.i===0)return;let e=this.h.W;return[e.u,e.l]}lowerBound(e){let r=this.X(this.Y,e);return new Ge(r,this.h,this)}upperBound(e){let r=this.Z(this.Y,e);return new Ge(r,this.h,this)}reverseLowerBound(e){let r=this.$(this.Y,e);return new Ge(r,this.h,this)}reverseUpperBound(e){let r=this.rr(this.Y,e);return new Ge(r,this.h,this)}setElement(e,r,i){return this.M(e,r,i)}find(e){let r=this.I(this.Y,e);return new Ge(r,this.h,this)}getElementByKey(e){return this.I(this.Y,e).l}union(e){let r=this;return e.forEach(function(i){r.setElement(i[0],i[1])}),this.i}[Symbol.iterator](){return this.K(this.Y)}},$1=Sa;zn.default=$1});var Ia=M(Aa=>{"use strict";_();v();m();Object.defineProperty(Aa,"t",{value:!0});Aa.default=H1;function H1(t){let e=typeof t;return e==="object"&&t!==null||e==="function"}});var Ba=M(Zr=>{"use strict";_();v();m();Object.defineProperty(Zr,"t",{value:!0});Zr.HashContainerIterator=Zr.HashContainer=void 0;var fp=at(),Ta=V1(Ia()),Ii=lt();function V1(t){return t&&t.t?t:{default:t}}var Ra=class extends fp.ContainerIterator{constructor(e,r,i){super(i),this.o=e,this.h=r,this.iteratorType===0?(this.pre=function(){return this.o.L===this.h&&(0,Ii.throwIteratorAccessError)(),this.o=this.o.L,this},this.next=function(){return this.o===this.h&&(0,Ii.throwIteratorAccessError)(),this.o=this.o.B,this}):(this.pre=function(){return this.o.B===this.h&&(0,Ii.throwIteratorAccessError)(),this.o=this.o.B,this},this.next=function(){return this.o===this.h&&(0,Ii.throwIteratorAccessError)(),this.o=this.o.L,this})}};Zr.HashContainerIterator=Ra;var Ca=class extends fp.Container{constructor(){super(),this.H=[],this.g={},this.HASH_TAG=Symbol("@@HASH_TAG"),Object.setPrototypeOf(this.g,null),this.h={},this.h.L=this.h.B=this.p=this._=this.h}V(e){let{L:r,B:i}=e;r.B=i,i.L=r,e===this.p&&(this.p=i),e===this._&&(this._=r),this.i-=1}M(e,r,i){i===void 0&&(i=(0,Ta.default)(e));let n;if(i){let o=e[this.HASH_TAG];if(o!==void 0)return this.H[o].l=r,this.i;Object.defineProperty(e,this.HASH_TAG,{value:this.H.length,configurable:!0}),n={u:e,l:r,L:this._,B:this.h},this.H.push(n)}else{let o=this.g[e];if(o)return o.l=r,this.i;n={u:e,l:r,L:this._,B:this.h},this.g[e]=n}return this.i===0?(this.p=n,this.h.B=n):this._.B=n,this._=n,this.h.L=n,++this.i}I(e,r){if(r===void 0&&(r=(0,Ta.default)(e)),r){let i=e[this.HASH_TAG];return i===void 0?this.h:this.H[i]}else return this.g[e]||this.h}clear(){let e=this.HASH_TAG;this.H.forEach(function(r){delete r.u[e]}),this.H=[],this.g={},Object.setPrototypeOf(this.g,null),this.i=0,this.p=this._=this.h.L=this.h.B=this.h}eraseElementByKey(e,r){let i;if(r===void 0&&(r=(0,Ta.default)(e)),r){let n=e[this.HASH_TAG];if(n===void 0)return!1;delete e[this.HASH_TAG],i=this.H[n],delete this.H[n]}else{if(i=this.g[e],i===void 0)return!1;delete this.g[e]}return this.V(i),!0}eraseElementByIterator(e){let r=e.o;return r===this.h&&(0,Ii.throwIteratorAccessError)(),this.V(r),e.next()}eraseElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let r=this.p;for(;e--;)r=r.B;return this.V(r),this.i}};Zr.HashContainer=Ca});var hp=M(Kn=>{"use strict";_();v();m();Object.defineProperty(Kn,"t",{value:!0});Kn.default=void 0;var cp=Ba(),z1=lt(),Er=class t extends cp.HashContainerIterator{constructor(e,r,i,n){super(e,r,n),this.container=i}get pointer(){return this.o===this.h&&(0,z1.throwIteratorAccessError)(),this.o.u}copy(){return new t(this.o,this.h,this.container,this.iteratorType)}},Pa=class extends cp.HashContainer{constructor(e=[]){super();let r=this;e.forEach(function(i){r.insert(i)})}begin(){return new Er(this.p,this.h,this)}end(){return new Er(this.h,this.h,this)}rBegin(){return new Er(this._,this.h,this,1)}rEnd(){return new Er(this.h,this.h,this,1)}front(){return this.p.u}back(){return this._.u}insert(e,r){return this.M(e,void 0,r)}getElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let r=this.p;for(;e--;)r=r.B;return r.u}find(e,r){let i=this.I(e,r);return new Er(i,this.h,this)}forEach(e){let r=0,i=this.p;for(;i!==this.h;)e(i.u,r++,this),i=i.B}[Symbol.iterator](){return function*(){let e=this.p;for(;e!==this.h;)yield e.u,e=e.B}.bind(this)()}},K1=Pa;Kn.default=K1});var pp=M(Gn=>{"use strict";_();v();m();Object.defineProperty(Gn,"t",{value:!0});Gn.default=void 0;var dp=Ba(),G1=Y1(Ia()),Q1=lt();function Y1(t){return t&&t.t?t:{default:t}}var Sr=class t extends dp.HashContainerIterator{constructor(e,r,i,n){super(e,r,n),this.container=i}get pointer(){this.o===this.h&&(0,Q1.throwIteratorAccessError)();let e=this;return new Proxy([],{get(r,i){if(i==="0")return e.o.u;if(i==="1")return e.o.l},set(r,i,n){if(i!=="1")throw new TypeError("props must be 1");return e.o.l=n,!0}})}copy(){return new t(this.o,this.h,this.container,this.iteratorType)}},Oa=class extends dp.HashContainer{constructor(e=[]){super();let r=this;e.forEach(function(i){r.setElement(i[0],i[1])})}begin(){return new Sr(this.p,this.h,this)}end(){return new Sr(this.h,this.h,this)}rBegin(){return new Sr(this._,this.h,this,1)}rEnd(){return new Sr(this.h,this.h,this,1)}front(){if(this.i!==0)return[this.p.u,this.p.l]}back(){if(this.i!==0)return[this._.u,this._.l]}setElement(e,r,i){return this.M(e,r,i)}getElementByKey(e,r){if(r===void 0&&(r=(0,G1.default)(e)),r){let n=e[this.HASH_TAG];return n!==void 0?this.H[n].l:void 0}let i=this.g[e];return i?i.l:void 0}getElementByPos(e){if(e<0||e>this.i-1)throw new RangeError;let r=this.p;for(;e--;)r=r.B;return[r.u,r.l]}find(e,r){let i=this.I(e,r);return new Sr(i,this.h,this)}forEach(e){let r=0,i=this.p;for(;i!==this.h;)e([i.u,i.l],r++,this),i=i.B}[Symbol.iterator](){return function*(){let e=this.p;for(;e!==this.h;)yield[e.u,e.l],e=e.B}.bind(this)()}},J1=Oa;Gn.default=J1});var gp=M(je=>{"use strict";_();v();m();Object.defineProperty(je,"t",{value:!0});Object.defineProperty(je,"Deque",{enumerable:!0,get:function(){return iv.default}});Object.defineProperty(je,"HashMap",{enumerable:!0,get:function(){return av.default}});Object.defineProperty(je,"HashSet",{enumerable:!0,get:function(){return ov.default}});Object.defineProperty(je,"LinkList",{enumerable:!0,get:function(){return rv.default}});Object.defineProperty(je,"OrderedMap",{enumerable:!0,get:function(){return sv.default}});Object.defineProperty(je,"OrderedSet",{enumerable:!0,get:function(){return nv.default}});Object.defineProperty(je,"PriorityQueue",{enumerable:!0,get:function(){return ev.default}});Object.defineProperty(je,"Queue",{enumerable:!0,get:function(){return Z1.default}});Object.defineProperty(je,"Stack",{enumerable:!0,get:function(){return X1.default}});Object.defineProperty(je,"Vector",{enumerable:!0,get:function(){return tv.default}});var X1=ut(Jd()),Z1=ut(Xd()),ev=ut(Zd()),tv=ut(ep()),rv=ut(tp()),iv=ut(rp()),nv=ut(ap()),sv=ut(up()),ov=ut(hp()),av=ut(pp());function ut(t){return t&&t.t?t:{default:t}}});var bp=M((Qx,yp)=>{"use strict";_();v();m();var lv=gp().OrderedSet,ft=ot()("number-allocator:trace"),uv=ot()("number-allocator:error");function Te(t,e){this.low=t,this.high=e}Te.prototype.equals=function(t){return this.low===t.low&&this.high===t.high};Te.prototype.compare=function(t){return this.low<t.low&&this.high<t.low?-1:t.low<this.low&&t.high<this.low?1:0};function ct(t,e){if(!(this instanceof ct))return new ct(t,e);this.min=t,this.max=e,this.ss=new lv([],(r,i)=>r.compare(i)),ft("Create"),this.clear()}ct.prototype.firstVacant=function(){return this.ss.size()===0?null:this.ss.front().low};ct.prototype.alloc=function(){if(this.ss.size()===0)return ft("alloc():empty"),null;let t=this.ss.begin(),e=t.pointer.low,r=t.pointer.high,i=e;return i+1<=r?this.ss.updateKeyByIterator(t,new Te(e+1,r)):this.ss.eraseElementByPos(0),ft("alloc():"+i),i};ct.prototype.use=function(t){let e=new Te(t,t),r=this.ss.lowerBound(e);if(!r.equals(this.ss.end())){let i=r.pointer.low,n=r.pointer.high;return r.pointer.equals(e)?(this.ss.eraseElementByIterator(r),ft("use():"+t),!0):i>t?!1:i===t?(this.ss.updateKeyByIterator(r,new Te(i+1,n)),ft("use():"+t),!0):n===t?(this.ss.updateKeyByIterator(r,new Te(i,n-1)),ft("use():"+t),!0):(this.ss.updateKeyByIterator(r,new Te(t+1,n)),this.ss.insert(new Te(i,t-1)),ft("use():"+t),!0)}return ft("use():failed"),!1};ct.prototype.free=function(t){if(t<this.min||t>this.max){uv("free():"+t+" is out of range");return}let e=new Te(t,t),r=this.ss.upperBound(e);if(r.equals(this.ss.end())){if(r.equals(this.ss.begin())){this.ss.insert(e);return}r.pre();let i=r.pointer.high;r.pointer.high+1===t?this.ss.updateKeyByIterator(r,new Te(i,t)):this.ss.insert(e)}else if(r.equals(this.ss.begin()))if(t+1===r.pointer.low){let i=r.pointer.high;this.ss.updateKeyByIterator(r,new Te(t,i))}else this.ss.insert(e);else{let i=r.pointer.low,n=r.pointer.high;r.pre();let o=r.pointer.low;r.pointer.high+1===t?t+1===i?(this.ss.eraseElementByIterator(r),this.ss.updateKeyByIterator(r,new Te(o,n))):this.ss.updateKeyByIterator(r,new Te(o,t)):t+1===i?(this.ss.eraseElementByIterator(r.next()),this.ss.insert(new Te(t,n))):this.ss.insert(e)}ft("free():"+t)};ct.prototype.clear=function(){ft("clear()"),this.ss.clear(),this.ss.insert(new Te(this.min,this.max))};ct.prototype.intervalCount=function(){return this.ss.size()};ct.prototype.dump=function(){console.log("length:"+this.ss.size());for(let t of this.ss)console.log(t)};yp.exports=ct});var xa=M((rk,wp)=>{_();v();m();var fv=bp();wp.exports.NumberAllocator=fv});var _p=M(Ma=>{"use strict";_();v();m();Object.defineProperty(Ma,"__esModule",{value:!0});var cv=Yd(),hv=xa(),ka=class{constructor(e){e>0&&(this.aliasToTopic=new cv.LRUCache({max:e}),this.topicToAlias={},this.numberAllocator=new hv.NumberAllocator(1,e),this.max=e,this.length=0)}put(e,r){if(r===0||r>this.max)return!1;let i=this.aliasToTopic.get(r);return i&&delete this.topicToAlias[i],this.aliasToTopic.set(r,e),this.topicToAlias[e]=r,this.numberAllocator.use(r),this.length=this.aliasToTopic.size,!0}getTopicByAlias(e){return this.aliasToTopic.get(e)}getAliasByTopic(e){let r=this.topicToAlias[e];return typeof r<"u"&&this.aliasToTopic.get(r),r}clear(){this.aliasToTopic.clear(),this.topicToAlias={},this.numberAllocator.clear(),this.length=0}getLruAlias(){let e=this.numberAllocator.firstVacant();return e||[...this.aliasToTopic.keys()][this.aliasToTopic.size-1]}};Ma.default=ka});var mp=M(Ti=>{"use strict";_();v();m();var dv=Ti&&Ti.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(Ti,"__esModule",{value:!0});var pv=Si(),gv=dv(_p()),yv=Yr(),bv=(t,e)=>{t.log("_handleConnack");let{options:r}=t,n=r.protocolVersion===5?e.reasonCode:e.returnCode;if(clearTimeout(t.connackTimer),delete t.topicAliasSend,e.properties){if(e.properties.topicAliasMaximum){if(e.properties.topicAliasMaximum>65535){t.emit("error",new Error("topicAliasMaximum from broker is out of range"));return}e.properties.topicAliasMaximum>0&&(t.topicAliasSend=new gv.default(e.properties.topicAliasMaximum))}e.properties.serverKeepAlive&&r.keepalive&&(r.keepalive=e.properties.serverKeepAlive,t._shiftPingInterval()),e.properties.maximumPacketSize&&(r.properties||(r.properties={}),r.properties.maximumPacketSize=e.properties.maximumPacketSize)}if(n===0)t.reconnecting=!1,t._onConnect(e);else if(n>0){let o=new yv.ErrorWithReasonCode(`Connection refused: ${pv.ReasonCodes[n]}`,n);t.emit("error",o)}};Ti.default=bv});var vp=M(La=>{"use strict";_();v();m();Object.defineProperty(La,"__esModule",{value:!0});var wv=(t,e,r)=>{t.log("handling pubrel packet");let i=typeof r<"u"?r:t.noop,{messageId:n}=e,o={cmd:"pubcomp",messageId:n};t.incomingStore.get(e,(s,a)=>{s?t._sendPacket(o,i):(t.emit("message",a.topic,a.payload,a),t.handleMessage(a,u=>{if(u)return i(u);t.incomingStore.del(a,t.noop),t._sendPacket(o,i)}))})};La.default=wv});var Ep=M(Ri=>{"use strict";_();v();m();var Ci=Ri&&Ri.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(Ri,"__esModule",{value:!0});var _v=Ci($d()),mv=Ci(Vd()),vv=Ci(mp()),Ev=Ci(Si()),Sv=Ci(vp()),Av=(t,e,r)=>{let{options:i}=t;if(i.protocolVersion===5&&i.properties&&i.properties.maximumPacketSize&&i.properties.maximumPacketSize<e.length)return t.emit("error",new Error(`exceeding packets size ${e.cmd}`)),t.end({reasonCode:149,properties:{reasonString:"Maximum packet size was exceeded"}}),t;switch(t.log("_handlePacket :: emitting packetreceive"),t.emit("packetreceive",e),e.cmd){case"publish":(0,_v.default)(t,e,r);break;case"puback":case"pubrec":case"pubcomp":case"suback":case"unsuback":(0,Ev.default)(t,e),r();break;case"pubrel":(0,Sv.default)(t,e,r);break;case"connack":(0,vv.default)(t,e),r();break;case"auth":(0,mv.default)(t,e),r();break;case"pingresp":t.pingResp=!0,r();break;case"disconnect":t.emit("disconnect",e),r();break;default:t.log("_handlePacket :: unknown command"),r();break}};Ri.default=Av});var Sp=M(ei=>{"use strict";_();v();m();var Iv=ei&&ei.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(ei,"__esModule",{value:!0});ei.TypedEventEmitter=void 0;var Tv=Iv((ir(),Z(rr))),Rv=Yr(),Qn=class{};ei.TypedEventEmitter=Qn;(0,Rv.applyMixin)(Qn,Tv.default)});var Ip=M((Yn,Ap)=>{_();v();m();(function(t,e){typeof Yn=="object"&&typeof Ap<"u"?e(Yn):typeof define=="function"&&define.amd?define(["exports"],e):(t=typeof globalThis<"u"?globalThis:t||self,e(t.fastUniqueNumbers={}))})(Yn,function(t){"use strict";var e=function(g){return function(y){var w=g(y);return y.add(w),w}},r=function(g){return function(y,w){return g.set(y,w),w}},i=Number.MAX_SAFE_INTEGER===void 0?9007199254740991:Number.MAX_SAFE_INTEGER,n=536870912,o=n*2,s=function(g,y){return function(w){var E=y.get(w),S=E===void 0?w.size:E<o?E+1:0;if(!w.has(S))return g(w,S);if(w.size<n){for(;w.has(S);)S=Math.floor(Math.random()*o);return g(w,S)}if(w.size>i)throw new Error("Congratulations, you created a collection of unique numbers which uses all available integers!");for(;w.has(S);)S=Math.floor(Math.random()*i);return g(w,S)}},a=new WeakMap,u=r(a),c=s(u,a),h=e(c);t.addUniqueNumber=h,t.generateUniqueNumber=c})});var Rp=M((Jn,Tp)=>{_();v();m();(function(t,e){typeof Jn=="object"&&typeof Tp<"u"?e(Jn,Ip()):typeof define=="function"&&define.amd?define(["exports","fast-unique-numbers"],e):(t=typeof globalThis<"u"?globalThis:t||self,e(t.workerTimersBroker={},t.fastUniqueNumbers))})(Jn,function(t,e){"use strict";var r=function(s){return s.method!==void 0&&s.method==="call"},i=function(s){return s.error===null&&typeof s.id=="number"},n=function(s){var a=new Map([[0,function(){}]]),u=new Map([[0,function(){}]]),c=new Map,h=new Worker(s);h.addEventListener("message",function(E){var S=E.data;if(r(S)){var I=S.params,C=I.timerId,R=I.timerType;if(R==="interval"){var U=a.get(C);if(typeof U=="number"){var N=c.get(U);if(N===void 0||N.timerId!==C||N.timerType!==R)throw new Error("The timer is in an undefined state.")}else if(typeof U<"u")U();else throw new Error("The timer is in an undefined state.")}else if(R==="timeout"){var W=u.get(C);if(typeof W=="number"){var K=c.get(W);if(K===void 0||K.timerId!==C||K.timerType!==R)throw new Error("The timer is in an undefined state.")}else if(typeof W<"u")W(),u.delete(C);else throw new Error("The timer is in an undefined state.")}}else if(i(S)){var z=S.id,G=c.get(z);if(G===void 0)throw new Error("The timer is in an undefined state.");var de=G.timerId,Gt=G.timerType;c.delete(z),Gt==="interval"?a.delete(de):u.delete(de)}else{var pe=S.error.message;throw new Error(pe)}});var d=function(S){var I=e.generateUniqueNumber(c);c.set(I,{timerId:S,timerType:"interval"}),a.set(S,I),h.postMessage({id:I,method:"clear",params:{timerId:S,timerType:"interval"}})},g=function(S){var I=e.generateUniqueNumber(c);c.set(I,{timerId:S,timerType:"timeout"}),u.set(S,I),h.postMessage({id:I,method:"clear",params:{timerId:S,timerType:"timeout"}})},y=function(S,I){var C=e.generateUniqueNumber(a);return a.set(C,function(){S(),typeof a.get(C)=="function"&&h.postMessage({id:null,method:"set",params:{delay:I,now:performance.now(),timerId:C,timerType:"interval"}})}),h.postMessage({id:null,method:"set",params:{delay:I,now:performance.now(),timerId:C,timerType:"interval"}}),C},w=function(S,I){var C=e.generateUniqueNumber(u);return u.set(C,S),h.postMessage({id:null,method:"set",params:{delay:I,now:performance.now(),timerId:C,timerType:"timeout"}}),C};return{clearInterval:d,clearTimeout:g,setInterval:y,setTimeout:w}};t.load=n})});var Bp=M((Xn,Cp)=>{_();v();m();(function(t,e){typeof Xn=="object"&&typeof Cp<"u"?e(Xn,Rp()):typeof define=="function"&&define.amd?define(["exports","worker-timers-broker"],e):(t=typeof globalThis<"u"?globalThis:t||self,e(t.workerTimers={},t.workerTimersBroker))})(Xn,function(t,e){"use strict";var r=function(h,d){var g=null;return function(){if(g!==null)return g;var y=new Blob([d],{type:"application/javascript; charset=utf-8"}),w=URL.createObjectURL(y);return g=h(w),setTimeout(function(){return URL.revokeObjectURL(w)}),g}},i=`(()=>{var e={67:(e,t,r)=>{var o,i;void 0===(i="function"==typeof(o=function(){"use strict";var e=new Map,t=new Map,r=function(t){var r=e.get(t);if(void 0===r)throw new Error('There is no interval scheduled with the given id "'.concat(t,'".'));clearTimeout(r),e.delete(t)},o=function(e){var r=t.get(e);if(void 0===r)throw new Error('There is no timeout scheduled with the given id "'.concat(e,'".'));clearTimeout(r),t.delete(e)},i=function(e,t){var r,o=performance.now();return{expected:o+(r=e-Math.max(0,o-t)),remainingDelay:r}},n=function e(t,r,o,i){var n=performance.now();n>o?postMessage({id:null,method:"call",params:{timerId:r,timerType:i}}):t.set(r,setTimeout(e,o-n,t,r,o,i))},a=function(t,r,o){var a=i(t,o),s=a.expected,d=a.remainingDelay;e.set(r,setTimeout(n,d,e,r,s,"interval"))},s=function(e,r,o){var a=i(e,o),s=a.expected,d=a.remainingDelay;t.set(r,setTimeout(n,d,t,r,s,"timeout"))};addEventListener("message",(function(e){var t=e.data;try{if("clear"===t.method){var i=t.id,n=t.params,d=n.timerId,c=n.timerType;if("interval"===c)r(d),postMessage({error:null,id:i});else{if("timeout"!==c)throw new Error('The given type "'.concat(c,'" is not supported'));o(d),postMessage({error:null,id:i})}}else{if("set"!==t.method)throw new Error('The given method "'.concat(t.method,'" is not supported'));var u=t.params,l=u.delay,p=u.now,m=u.timerId,v=u.timerType;if("interval"===v)a(l,m,p);else{if("timeout"!==v)throw new Error('The given type "'.concat(v,'" is not supported'));s(l,m,p)}}}catch(e){postMessage({error:{message:e.message},id:t.id,result:null})}}))})?o.call(t,r,t,e):o)||(e.exports=i)}},t={};function r(o){var i=t[o];if(void 0!==i)return i.exports;var n=t[o]={exports:{}};return e[o](n,n.exports,r),n.exports}r.n=e=>{var t=e&&e.__esModule?()=>e.default:()=>e;return r.d(t,{a:t}),t},r.d=(e,t)=>{for(var o in t)r.o(t,o)&&!r.o(e,o)&&Object.defineProperty(e,o,{enumerable:!0,get:t[o]})},r.o=(e,t)=>Object.prototype.hasOwnProperty.call(e,t),(()=>{"use strict";r(67)})()})();`,n=r(e.load,i),o=function(h){return n().clearInterval(h)},s=function(h){return n().clearTimeout(h)},a=function(h,d){return n().setInterval(h,d)},u=function(h,d){return n().setTimeout(h,d)};t.clearInterval=o,t.clearTimeout=s,t.setInterval=a,t.setTimeout=u})});var Zn=M(Bi=>{"use strict";_();v();m();Object.defineProperty(Bi,"__esModule",{value:!0});Bi.isWebWorker=void 0;var Cv=()=>typeof window<"u"&&typeof window.document<"u",Pp=()=>{var t,e;return!!(typeof self=="object"&&(!((e=(t=self?.constructor)===null||t===void 0?void 0:t.name)===null||e===void 0)&&e.includes("WorkerGlobalScope")))},Bv=()=>typeof navigator<"u"&&navigator.product==="ReactNative",Pv=Cv()||Pp()||Bv();Bi.isWebWorker=Pp();Bi.default=Pv});var xp=M(Rt=>{"use strict";_();v();m();var Ov=Rt&&Rt.__createBinding||(Object.create?function(t,e,r,i){i===void 0&&(i=r);var n=Object.getOwnPropertyDescriptor(e,r);(!n||("get"in n?!e.__esModule:n.writable||n.configurable))&&(n={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,i,n)}:function(t,e,r,i){i===void 0&&(i=r),t[i]=e[r]}),xv=Rt&&Rt.__setModuleDefault||(Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}:function(t,e){t.default=e}),kv=Rt&&Rt.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(t!=null)for(var r in t)r!=="default"&&Object.prototype.hasOwnProperty.call(t,r)&&Ov(e,t,r);return xv(e,t),e};Object.defineProperty(Rt,"__esModule",{value:!0});var Op=Bp(),es=kv(Zn()),Ua=class{constructor(e,r){this._setTimeout=es.default&&!es.isWebWorker?Op.setTimeout:(i,n)=>setTimeout(i,n),this._clearTimeout=es.default&&!es.isWebWorker?Op.clearTimeout:i=>clearTimeout(i),this.keepalive=e*1e3,this.checkPing=r,this.reschedule()}clear(){this.timer&&(this._clearTimeout(this.timer),this.timer=null)}reschedule(){this.clear(),this.timer=this._setTimeout(()=>{this.checkPing(),this.timer&&this.reschedule()},this.keepalive)}};Rt.default=Ua});var rs=M(Qe=>{"use strict";_();v();m();var Mv=Qe&&Qe.__createBinding||(Object.create?function(t,e,r,i){i===void 0&&(i=r);var n=Object.getOwnPropertyDescriptor(e,r);(!n||("get"in n?!e.__esModule:n.writable||n.configurable))&&(n={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,i,n)}:function(t,e,r,i){i===void 0&&(i=r),t[i]=e[r]}),Lv=Qe&&Qe.__setModuleDefault||(Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}:function(t,e){t.default=e}),Uv=Qe&&Qe.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(t!=null)for(var r in t)r!=="default"&&Object.prototype.hasOwnProperty.call(t,r)&&Mv(e,t,r);return Lv(e,t),e},Vt=Qe&&Qe.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(Qe,"__esModule",{value:!0});var Nv=Vt(zu()),Na=Vt(Ld()),qv=Vt(Qo()),Dv=Dt(),kp=Vt(Dd()),Mp=Uv(Fd()),jv=Vt(ot()),ts=Vt(Xo()),Fv=Vt(Ep()),Da=Yr(),Wv=Sp(),$v=Vt(xp()),qa=globalThis.setImmediate||((...t)=>{let e=t.shift();(0,Da.nextTick)(()=>{e(...t)})}),Lp={keepalive:60,reschedulePings:!0,protocolId:"MQTT",protocolVersion:4,reconnectPeriod:1e3,connectTimeout:30*1e3,clean:!0,resubscribe:!0,writeCache:!0},ja=class t extends Wv.TypedEventEmitter{static defaultId(){return`mqttjs_${Math.random().toString(16).substr(2,8)}`}constructor(e,r){super(),this.options=r||{};for(let i in Lp)typeof this.options[i]>"u"?this.options[i]=Lp[i]:this.options[i]=r[i];this.log=this.options.log||(0,jv.default)("mqttjs:client"),this.noop=this._noop.bind(this),this.log("MqttClient :: options.protocol",r.protocol),this.log("MqttClient :: options.protocolVersion",r.protocolVersion),this.log("MqttClient :: options.username",r.username),this.log("MqttClient :: options.keepalive",r.keepalive),this.log("MqttClient :: options.reconnectPeriod",r.reconnectPeriod),this.log("MqttClient :: options.rejectUnauthorized",r.rejectUnauthorized),this.log("MqttClient :: options.properties.topicAliasMaximum",r.properties?r.properties.topicAliasMaximum:void 0),this.options.clientId=typeof r.clientId=="string"?r.clientId:t.defaultId(),this.log("MqttClient :: clientId",this.options.clientId),this.options.customHandleAcks=r.protocolVersion===5&&r.customHandleAcks?r.customHandleAcks:(...i)=>{i[3](null,0)},this.options.writeCache||(Na.default.writeToStream.cacheNumbers=!1),this.streamBuilder=e,this.messageIdProvider=typeof this.options.messageIdProvider>"u"?new qv.default:this.options.messageIdProvider,this.outgoingStore=r.outgoingStore||new ts.default,this.incomingStore=r.incomingStore||new ts.default,this.queueQoSZero=r.queueQoSZero===void 0?!0:r.queueQoSZero,this._resubscribeTopics={},this.messageIdToTopic={},this.pingTimer=null,this.connected=!1,this.disconnecting=!1,this.reconnecting=!1,this.queue=[],this.connackTimer=null,this.reconnectTimer=null,this._storeProcessing=!1,this._packetIdsDuringStoreProcessing={},this._storeProcessingQueue=[],this.outgoing={},this._firstConnection=!0,r.properties&&r.properties.topicAliasMaximum>0&&(r.properties.topicAliasMaximum>65535?this.log("MqttClient :: options.properties.topicAliasMaximum is out of range"):this.topicAliasRecv=new Nv.default(r.properties.topicAliasMaximum)),this.on("connect",()=>{let{queue:i}=this,n=()=>{let o=i.shift();this.log("deliver :: entry %o",o);let s=null;if(!o){this._resubscribe();return}s=o.packet,this.log("deliver :: call _sendPacket for %o",s);let a=!0;s.messageId&&s.messageId!==0&&(this.messageIdProvider.register(s.messageId)||(a=!1)),a?this._sendPacket(s,u=>{o.cb&&o.cb(u),n()}):(this.log("messageId: %d has already used. The message is skipped and removed.",s.messageId),n())};this.log("connect :: sending queued packets"),n()}),this.on("close",()=>{this.log("close :: connected set to `false`"),this.connected=!1,this.log("close :: clearing connackTimer"),clearTimeout(this.connackTimer),this.log("close :: clearing ping timer"),this.pingTimer&&(this.pingTimer.clear(),this.pingTimer=null),this.topicAliasRecv&&this.topicAliasRecv.clear(),this.log("close :: calling _setupReconnect"),this._setupReconnect()}),this.options.manualConnect||(this.log("MqttClient :: setting up stream"),this.connect())}handleAuth(e,r){r()}handleMessage(e,r){r()}_nextId(){return this.messageIdProvider.allocate()}getLastMessageId(){return this.messageIdProvider.getLastAllocated()}connect(){var e;let r=new Dv.Writable,i=Na.default.parser(this.options),n=null,o=[];this.log("connect :: calling method to clear reconnect"),this._clearReconnect(),this.log("connect :: using streamBuilder provided to client to create stream"),this.stream=this.streamBuilder(this),i.on("packet",h=>{this.log("parser :: on packet push to packets array."),o.push(h)});let s=()=>{this.log("work :: getting next packet in queue");let h=o.shift();if(h)this.log("work :: packet pulled from queue"),(0,Fv.default)(this,h,a);else{this.log("work :: no packets in queue");let d=n;n=null,this.log("work :: done flag is %s",!!d),d&&d()}},a=()=>{if(o.length)(0,Da.nextTick)(s);else{let h=n;n=null,h()}};r._write=(h,d,g)=>{n=g,this.log("writable stream :: parsing buffer"),i.parse(h),s()};let u=h=>{this.log("streamErrorHandler :: error",h.message),h.code?(this.log("streamErrorHandler :: emitting error"),this.emit("error",h)):this.noop(h)};this.log("connect :: pipe stream to writable stream"),this.stream.pipe(r),this.stream.on("error",u),this.stream.on("close",()=>{this.log("(%s)stream :: on close",this.options.clientId),this._flushVolatile(),this.log("stream: emit close to MqttClient"),this.emit("close")}),this.log("connect: sending packet `connect`");let c={cmd:"connect",protocolId:this.options.protocolId,protocolVersion:this.options.protocolVersion,clean:this.options.clean,clientId:this.options.clientId,keepalive:this.options.keepalive,username:this.options.username,password:this.options.password,properties:this.options.properties};if(this.options.will&&(c.will=Object.assign(Object.assign({},this.options.will),{payload:(e=this.options.will)===null||e===void 0?void 0:e.payload})),this.topicAliasRecv&&(c.properties||(c.properties={}),this.topicAliasRecv&&(c.properties.topicAliasMaximum=this.topicAliasRecv.max)),this._writePacket(c),i.on("error",this.emit.bind(this,"error")),this.options.properties){if(!this.options.properties.authenticationMethod&&this.options.properties.authenticationData)return this.end(()=>this.emit("error",new Error("Packet has no Authentication Method"))),this;if(this.options.properties.authenticationMethod&&this.options.authPacket&&typeof this.options.authPacket=="object"){let h=Object.assign({cmd:"auth",reasonCode:0},this.options.authPacket);this._writePacket(h)}}return this.stream.setMaxListeners(1e3),clearTimeout(this.connackTimer),this.connackTimer=setTimeout(()=>{this.log("!!connectTimeout hit!! Calling _cleanUp with force `true`"),this._cleanUp(!0)},this.options.connectTimeout),this}publish(e,r,i,n){this.log("publish :: message `%s` to topic `%s`",r,e);let{options:o}=this;typeof i=="function"&&(n=i,i=null),i=i||{},i=Object.assign(Object.assign({},{qos:0,retain:!1,dup:!1}),i);let{qos:a,retain:u,dup:c,properties:h,cbStorePut:d}=i;if(this._checkDisconnecting(n))return this;let g=()=>{let y=0;if((a===1||a===2)&&(y=this._nextId(),y===null))return this.log("No messageId left"),!1;let w={cmd:"publish",topic:e,payload:r,qos:a,retain:u,messageId:y,dup:c};switch(o.protocolVersion===5&&(w.properties=h),this.log("publish :: qos",a),a){case 1:case 2:this.outgoing[w.messageId]={volatile:!1,cb:n||this.noop},this.log("MqttClient:publish: packet cmd: %s",w.cmd),this._sendPacket(w,void 0,d);break;default:this.log("MqttClient:publish: packet cmd: %s",w.cmd),this._sendPacket(w,n,d);break}return!0};return(this._storeProcessing||this._storeProcessingQueue.length>0||!g())&&this._storeProcessingQueue.push({invoke:g,cbStorePut:i.cbStorePut,callback:n}),this}publishAsync(e,r,i){return new Promise((n,o)=>{this.publish(e,r,i,(s,a)=>{s?o(s):n(a)})})}subscribe(e,r,i){let n=this.options.protocolVersion;typeof r=="function"&&(i=r),i=i||this.noop;let o=!1,s=[];typeof e=="string"?(e=[e],s=e):Array.isArray(e)?s=e:typeof e=="object"&&(o=e.resubscribe,delete e.resubscribe,s=Object.keys(e));let a=Mp.validateTopics(s);if(a!==null)return qa(i,new Error(`Invalid topic ${a}`)),this;if(this._checkDisconnecting(i))return this.log("subscribe: discconecting true"),this;let u={qos:0};n===5&&(u.nl=!1,u.rap=!1,u.rh=0),r=Object.assign(Object.assign({},u),r);let c=r.properties,h=[],d=(y,w)=>{if(w=w||r,!Object.prototype.hasOwnProperty.call(this._resubscribeTopics,y)||this._resubscribeTopics[y].qos<w.qos||o){let E={topic:y,qos:w.qos};n===5&&(E.nl=w.nl,E.rap=w.rap,E.rh=w.rh,E.properties=c),this.log("subscribe: pushing topic `%s` and qos `%s` to subs list",E.topic,E.qos),h.push(E)}};if(Array.isArray(e)?e.forEach(y=>{this.log("subscribe: array topic %s",y),d(y)}):Object.keys(e).forEach(y=>{this.log("subscribe: object topic %s, %o",y,e[y]),d(y,e[y])}),!h.length)return i(null,[]),this;let g=()=>{let y=this._nextId();if(y===null)return this.log("No messageId left"),!1;let w={cmd:"subscribe",subscriptions:h,messageId:y};if(c&&(w.properties=c),this.options.resubscribe){this.log("subscribe :: resubscribe true");let E=[];h.forEach(S=>{if(this.options.reconnectPeriod>0){let I={qos:S.qos};n===5&&(I.nl=S.nl||!1,I.rap=S.rap||!1,I.rh=S.rh||0,I.properties=S.properties),this._resubscribeTopics[S.topic]=I,E.push(S.topic)}}),this.messageIdToTopic[w.messageId]=E}return this.outgoing[w.messageId]={volatile:!0,cb(E,S){if(!E){let{granted:I}=S;for(let C=0;C<I.length;C+=1)h[C].qos=I[C]}i(E,h)}},this.log("subscribe :: call _sendPacket"),this._sendPacket(w),!0};return(this._storeProcessing||this._storeProcessingQueue.length>0||!g())&&this._storeProcessingQueue.push({invoke:g,callback:i}),this}subscribeAsync(e,r){return new Promise((i,n)=>{this.subscribe(e,r,(o,s)=>{o?n(o):i(s)})})}unsubscribe(e,r,i){typeof e=="string"&&(e=[e]),typeof r=="function"&&(i=r),i=i||this.noop;let n=Mp.validateTopics(e);if(n!==null)return qa(i,new Error(`Invalid topic ${n}`)),this;if(this._checkDisconnecting(i))return this;let o=()=>{let s=this._nextId();if(s===null)return this.log("No messageId left"),!1;let a={cmd:"unsubscribe",messageId:s,unsubscriptions:[]};return typeof e=="string"?a.unsubscriptions=[e]:Array.isArray(e)&&(a.unsubscriptions=e),this.options.resubscribe&&a.unsubscriptions.forEach(u=>{delete this._resubscribeTopics[u]}),typeof r=="object"&&r.properties&&(a.properties=r.properties),this.outgoing[a.messageId]={volatile:!0,cb:i},this.log("unsubscribe: call _sendPacket"),this._sendPacket(a),!0};return(this._storeProcessing||this._storeProcessingQueue.length>0||!o())&&this._storeProcessingQueue.push({invoke:o,callback:i}),this}unsubscribeAsync(e,r){return new Promise((i,n)=>{this.unsubscribe(e,r,(o,s)=>{o?n(o):i(s)})})}end(e,r,i){this.log("end :: (%s)",this.options.clientId),(e==null||typeof e!="boolean")&&(i=i||r,r=e,e=!1),typeof r!="object"&&(i=i||r,r=null),this.log("end :: cb? %s",!!i),(!i||typeof i!="function")&&(i=this.noop);let n=()=>{this.log("end :: closeStores: closing incoming and outgoing stores"),this.disconnected=!0,this.incomingStore.close(s=>{this.outgoingStore.close(a=>{if(this.log("end :: closeStores: emitting end"),this.emit("end"),i){let u=s||a;this.log("end :: closeStores: invoking callback with args"),i(u)}})}),this._deferredReconnect&&this._deferredReconnect()},o=()=>{this.log("end :: (%s) :: finish :: calling _cleanUp with force %s",this.options.clientId,e),this._cleanUp(e,()=>{this.log("end :: finish :: calling process.nextTick on closeStores"),(0,Da.nextTick)(n)},r)};return this.disconnecting?(i(),this):(this._clearReconnect(),this.disconnecting=!0,!e&&Object.keys(this.outgoing).length>0?(this.log("end :: (%s) :: calling finish in 10ms once outgoing is empty",this.options.clientId),this.once("outgoingEmpty",setTimeout.bind(null,o,10))):(this.log("end :: (%s) :: immediately calling finish",this.options.clientId),o()),this)}endAsync(e,r){return new Promise((i,n)=>{this.end(e,r,o=>{o?n(o):i()})})}removeOutgoingMessage(e){if(this.outgoing[e]){let{cb:r}=this.outgoing[e];this._removeOutgoingAndStoreMessage(e,()=>{r(new Error("Message removed"))})}return this}reconnect(e){this.log("client reconnect");let r=()=>{e?(this.options.incomingStore=e.incomingStore,this.options.outgoingStore=e.outgoingStore):(this.options.incomingStore=null,this.options.outgoingStore=null),this.incomingStore=this.options.incomingStore||new ts.default,this.outgoingStore=this.options.outgoingStore||new ts.default,this.disconnecting=!1,this.disconnected=!1,this._deferredReconnect=null,this._reconnect()};return this.disconnecting&&!this.disconnected?this._deferredReconnect=r:r(),this}_flushVolatile(){this.outgoing&&(this.log("_flushVolatile :: deleting volatile messages from the queue and setting their callbacks as error function"),Object.keys(this.outgoing).forEach(e=>{this.outgoing[e].volatile&&typeof this.outgoing[e].cb=="function"&&(this.outgoing[e].cb(new Error("Connection closed")),delete this.outgoing[e])}))}_flush(){this.outgoing&&(this.log("_flush: queue exists? %b",!!this.outgoing),Object.keys(this.outgoing).forEach(e=>{typeof this.outgoing[e].cb=="function"&&(this.outgoing[e].cb(new Error("Connection closed")),delete this.outgoing[e])}))}_removeTopicAliasAndRecoverTopicName(e){let r;e.properties&&(r=e.properties.topicAlias);let i=e.topic.toString();if(this.log("_removeTopicAliasAndRecoverTopicName :: alias %d, topic %o",r,i),i.length===0){if(typeof r>"u")return new Error("Unregistered Topic Alias");if(i=this.topicAliasSend.getTopicByAlias(r),typeof i>"u")return new Error("Unregistered Topic Alias");e.topic=i}r&&delete e.properties.topicAlias}_checkDisconnecting(e){return this.disconnecting&&(e&&e!==this.noop?e(new Error("client disconnecting")):this.emit("error",new Error("client disconnecting"))),this.disconnecting}_reconnect(){this.log("_reconnect: emitting reconnect to client"),this.emit("reconnect"),this.connected?(this.end(()=>{this.connect()}),this.log("client already connected. disconnecting first.")):(this.log("_reconnect: calling connect"),this.connect())}_setupReconnect(){!this.disconnecting&&!this.reconnectTimer&&this.options.reconnectPeriod>0?(this.reconnecting||(this.log("_setupReconnect :: emit `offline` state"),this.emit("offline"),this.log("_setupReconnect :: set `reconnecting` to `true`"),this.reconnecting=!0),this.log("_setupReconnect :: setting reconnectTimer for %d ms",this.options.reconnectPeriod),this.reconnectTimer=setInterval(()=>{this.log("reconnectTimer :: reconnect triggered!"),this._reconnect()},this.options.reconnectPeriod)):this.log("_setupReconnect :: doing nothing...")}_clearReconnect(){this.log("_clearReconnect : clearing reconnect timer"),this.reconnectTimer&&(clearInterval(this.reconnectTimer),this.reconnectTimer=null)}_cleanUp(e,r,i={}){if(r&&(this.log("_cleanUp :: done callback provided for on stream close"),this.stream.on("close",r)),this.log("_cleanUp :: forced? %s",e),e)this.options.reconnectPeriod===0&&this.options.clean&&this._flush(),this.log("_cleanUp :: (%s) :: destroying stream",this.options.clientId),this.stream.destroy();else{let n=Object.assign({cmd:"disconnect"},i);this.log("_cleanUp :: (%s) :: call _sendPacket with disconnect packet",this.options.clientId),this._sendPacket(n,()=>{this.log("_cleanUp :: (%s) :: destroying stream",this.options.clientId),qa(()=>{this.stream.end(()=>{this.log("_cleanUp :: (%s) :: stream destroyed",this.options.clientId)})})})}!this.disconnecting&&!this.reconnecting&&(this.log("_cleanUp :: client not disconnecting/reconnecting. Clearing and resetting reconnect."),this._clearReconnect(),this._setupReconnect()),this.pingTimer&&(this.log("_cleanUp :: clearing pingTimer"),this.pingTimer.clear(),this.pingTimer=null),r&&!this.connected&&(this.log("_cleanUp :: (%s) :: removing stream `done` callback `close` listener",this.options.clientId),this.stream.removeListener("close",r),r())}_storeAndSend(e,r,i){this.log("storeAndSend :: store packet with cmd %s to outgoingStore",e.cmd);let n=e,o;if(n.cmd==="publish"&&(n=(0,kp.default)(e),o=this._removeTopicAliasAndRecoverTopicName(n),o))return r&&r(o);this.outgoingStore.put(n,s=>{if(s)return r&&r(s);i(),this._writePacket(e,r)})}_applyTopicAlias(e){if(this.options.protocolVersion===5&&e.cmd==="publish"){let r;e.properties&&(r=e.properties.topicAlias);let i=e.topic.toString();if(this.topicAliasSend)if(r){if(i.length!==0&&(this.log("applyTopicAlias :: register topic: %s - alias: %d",i,r),!this.topicAliasSend.put(i,r)))return this.log("applyTopicAlias :: error out of range. topic: %s - alias: %d",i,r),new Error("Sending Topic Alias out of range")}else i.length!==0&&(this.options.autoAssignTopicAlias?(r=this.topicAliasSend.getAliasByTopic(i),r?(e.topic="",e.properties=Object.assign(Object.assign({},e.properties),{topicAlias:r}),this.log("applyTopicAlias :: auto assign(use) topic: %s - alias: %d",i,r)):(r=this.topicAliasSend.getLruAlias(),this.topicAliasSend.put(i,r),e.properties=Object.assign(Object.assign({},e.properties),{topicAlias:r}),this.log("applyTopicAlias :: auto assign topic: %s - alias: %d",i,r))):this.options.autoUseTopicAlias&&(r=this.topicAliasSend.getAliasByTopic(i),r&&(e.topic="",e.properties=Object.assign(Object.assign({},e.properties),{topicAlias:r}),this.log("applyTopicAlias :: auto use topic: %s - alias: %d",i,r))));else if(r)return this.log("applyTopicAlias :: error out of range. topic: %s - alias: %d",i,r),new Error("Sending Topic Alias out of range")}}_noop(e){this.log("noop ::",e)}_writePacket(e,r){this.log("_writePacket :: packet: %O",e),this.log("_writePacket :: emitting `packetsend`"),this.emit("packetsend",e),this._shiftPingInterval(),this.log("_writePacket :: writing to stream");let i=Na.default.writeToStream(e,this.stream,this.options);this.log("_writePacket :: writeToStream result %s",i),!i&&r&&r!==this.noop?(this.log("_writePacket :: handle events on `drain` once through callback."),this.stream.once("drain",r)):r&&(this.log("_writePacket :: invoking cb"),r())}_sendPacket(e,r,i,n){this.log("_sendPacket :: (%s) ::  start",this.options.clientId),i=i||this.noop,r=r||this.noop;let o=this._applyTopicAlias(e);if(o){r(o);return}if(!this.connected){if(e.cmd==="auth"){this._writePacket(e,r);return}this.log("_sendPacket :: client not connected. Storing packet offline."),this._storePacket(e,r,i);return}if(n){this._writePacket(e,r);return}switch(e.cmd){case"publish":break;case"pubrel":this._storeAndSend(e,r,i);return;default:this._writePacket(e,r);return}switch(e.qos){case 2:case 1:this._storeAndSend(e,r,i);break;case 0:default:this._writePacket(e,r);break}this.log("_sendPacket :: (%s) ::  end",this.options.clientId)}_storePacket(e,r,i){this.log("_storePacket :: packet: %o",e),this.log("_storePacket :: cb? %s",!!r),i=i||this.noop;let n=e;if(n.cmd==="publish"){n=(0,kp.default)(e);let s=this._removeTopicAliasAndRecoverTopicName(n);if(s)return r&&r(s)}let o=n.qos||0;o===0&&this.queueQoSZero||n.cmd!=="publish"?this.queue.push({packet:n,cb:r}):o>0?(r=this.outgoing[n.messageId]?this.outgoing[n.messageId].cb:null,this.outgoingStore.put(n,s=>{if(s)return r&&r(s);i()})):r&&r(new Error("No connection to broker"))}_setupPingTimer(){this.log("_setupPingTimer :: keepalive %d (seconds)",this.options.keepalive),!this.pingTimer&&this.options.keepalive&&(this.pingResp=!0,this.pingTimer=new $v.default(this.options.keepalive,()=>{this._checkPing()}))}_shiftPingInterval(){this.pingTimer&&this.options.keepalive&&this.options.reschedulePings&&this.pingTimer.reschedule()}_checkPing(){this.log("_checkPing :: checking ping..."),this.pingResp?(this.log("_checkPing :: ping response received. Clearing flag and sending `pingreq`"),this.pingResp=!1,this._sendPacket({cmd:"pingreq"})):(this.log("_checkPing :: calling _cleanUp with force true"),this._cleanUp(!0))}_resubscribe(){this.log("_resubscribe");let e=Object.keys(this._resubscribeTopics);if(!this._firstConnection&&(this.options.clean||this.options.protocolVersion>=4&&!this.connackPacket.sessionPresent)&&e.length>0)if(this.options.resubscribe)if(this.options.protocolVersion===5){this.log("_resubscribe: protocolVersion 5");for(let r=0;r<e.length;r++){let i={};i[e[r]]=this._resubscribeTopics[e[r]],i.resubscribe=!0,this.subscribe(i,{properties:i[e[r]].properties})}}else this._resubscribeTopics.resubscribe=!0,this.subscribe(this._resubscribeTopics);else this._resubscribeTopics={};this._firstConnection=!1}_onConnect(e){if(this.disconnected){this.emit("connect",e);return}this.connackPacket=e,this.messageIdProvider.clear(),this._setupPingTimer(),this.connected=!0;let r=()=>{let i=this.outgoingStore.createStream(),n=()=>{i.destroy(),i=null,this._flushStoreProcessingQueue(),o()},o=()=>{this._storeProcessing=!1,this._packetIdsDuringStoreProcessing={}};this.once("close",n),i.on("error",a=>{o(),this._flushStoreProcessingQueue(),this.removeListener("close",n),this.emit("error",a)});let s=()=>{if(!i)return;let a=i.read(1),u;if(!a){i.once("readable",s);return}if(this._storeProcessing=!0,this._packetIdsDuringStoreProcessing[a.messageId]){s();return}!this.disconnecting&&!this.reconnectTimer?(u=this.outgoing[a.messageId]?this.outgoing[a.messageId].cb:null,this.outgoing[a.messageId]={volatile:!1,cb(c,h){u&&u(c,h),s()}},this._packetIdsDuringStoreProcessing[a.messageId]=!0,this.messageIdProvider.register(a.messageId)?this._sendPacket(a,void 0,void 0,!0):this.log("messageId: %d has already used.",a.messageId)):i.destroy&&i.destroy()};i.on("end",()=>{let a=!0;for(let u in this._packetIdsDuringStoreProcessing)if(!this._packetIdsDuringStoreProcessing[u]){a=!1;break}this.removeListener("close",n),a?(o(),this._invokeAllStoreProcessingQueue(),this.emit("connect",e)):r()}),s()};r()}_invokeStoreProcessingQueue(){if(!this._storeProcessing&&this._storeProcessingQueue.length>0){let e=this._storeProcessingQueue[0];if(e&&e.invoke())return this._storeProcessingQueue.shift(),!0}return!1}_invokeAllStoreProcessingQueue(){for(;this._invokeStoreProcessingQueue(););}_flushStoreProcessingQueue(){for(let e of this._storeProcessingQueue)e.cbStorePut&&e.cbStorePut(new Error("Connection closed")),e.callback&&e.callback(new Error("Connection closed"));this._storeProcessingQueue.splice(0)}_removeOutgoingAndStoreMessage(e,r){delete this.outgoing[e],this.outgoingStore.del({messageId:e},(i,n)=>{r(i,n),this.messageIdProvider.deallocate(e),this._invokeStoreProcessingQueue()})}};Qe.default=ja});var Up=M(Wa=>{"use strict";_();v();m();Object.defineProperty(Wa,"__esModule",{value:!0});var Hv=xa(),Fa=class{constructor(){this.numberAllocator=new Hv.NumberAllocator(1,65535)}allocate(){return this.lastId=this.numberAllocator.alloc(),this.lastId}getLastAllocated(){return this.lastId}register(e){return this.numberAllocator.use(e)}deallocate(e){this.numberAllocator.free(e)}clear(){this.numberAllocator.clear()}};Wa.default=Fa});function Ar(t){throw new RangeError(Gv[t])}function Np(t,e){let r=t.split("@"),i="";r.length>1&&(i=r[0]+"@",t=r[1]);let n=function(o,s){let a=[],u=o.length;for(;u--;)a[u]=s(o[u]);return a}((t=t.replace(Kv,".")).split("."),e).join(".");return i+n}function Fp(t){let e=[],r=0,i=t.length;for(;r<i;){let n=t.charCodeAt(r++);if(n>=55296&&n<=56319&&r<i){let o=t.charCodeAt(r++);(64512&o)==56320?e.push(((1023&n)<<10)+(1023&o)+65536):(e.push(n),r--)}else e.push(n)}return e}var Vv,zv,Kv,Gv,ht,$a,qp,Wp,Dp,jp,zt,$p=be(()=>{_();v();m();Vv=/^xn--/,zv=/[^\0-\x7E]/,Kv=/[\x2E\u3002\uFF0E\uFF61]/g,Gv={overflow:"Overflow: input needs wider integers to process","not-basic":"Illegal input >= 0x80 (not a basic code point)","invalid-input":"Invalid input"},ht=Math.floor,$a=String.fromCharCode;qp=function(t,e){return t+22+75*(t<26)-((e!=0)<<5)},Wp=function(t,e,r){let i=0;for(t=r?ht(t/700):t>>1,t+=ht(t/e);t>455;i+=36)t=ht(t/35);return ht(i+36*t/(t+38))},Dp=function(t){let e=[],r=t.length,i=0,n=128,o=72,s=t.lastIndexOf("-");s<0&&(s=0);for(let u=0;u<s;++u)t.charCodeAt(u)>=128&&Ar("not-basic"),e.push(t.charCodeAt(u));for(let u=s>0?s+1:0;u<r;){let c=i;for(let d=1,g=36;;g+=36){u>=r&&Ar("invalid-input");let y=(a=t.charCodeAt(u++))-48<10?a-22:a-65<26?a-65:a-97<26?a-97:36;(y>=36||y>ht((2147483647-i)/d))&&Ar("overflow"),i+=y*d;let w=g<=o?1:g>=o+26?26:g-o;if(y<w)break;let E=36-w;d>ht(2147483647/E)&&Ar("overflow"),d*=E}let h=e.length+1;o=Wp(i-c,h,c==0),ht(i/h)>2147483647-n&&Ar("overflow"),n+=ht(i/h),i%=h,e.splice(i++,0,n)}var a;return String.fromCodePoint(...e)},jp=function(t){let e=[],r=(t=Fp(t)).length,i=128,n=0,o=72;for(let u of t)u<128&&e.push($a(u));let s=e.length,a=s;for(s&&e.push("-");a<r;){let u=2147483647;for(let h of t)h>=i&&h<u&&(u=h);let c=a+1;u-i>ht((2147483647-n)/c)&&Ar("overflow"),n+=(u-i)*c,i=u;for(let h of t)if(h<i&&++n>2147483647&&Ar("overflow"),h==i){let d=n;for(let g=36;;g+=36){let y=g<=o?1:g>=o+26?26:g-o;if(d<y)break;let w=d-y,E=36-y;e.push($a(qp(y+w%E,0))),d=ht(w/E)}e.push($a(qp(d,0))),o=Wp(n,c,a==s),n=0,++a}++n,++i}return e.join("")},zt={version:"2.1.0",ucs2:{decode:Fp,encode:t=>String.fromCodePoint(...t)},decode:Dp,encode:jp,toASCII:function(t){return Np(t,function(e){return zv.test(e)?"xn--"+jp(e):e})},toUnicode:function(t){return Np(t,function(e){return Vv.test(e)?Dp(e.slice(4).toLowerCase()):e})}};zt.decode;zt.encode;zt.toASCII;zt.toUnicode;zt.ucs2;zt.version});function Qv(t,e){return Object.prototype.hasOwnProperty.call(t,e)}var Yv,Pi,Jv,dt,Hp=be(()=>{_();v();m();Yv=function(t,e,r,i){e=e||"&",r=r||"=";var n={};if(typeof t!="string"||t.length===0)return n;var o=/\+/g;t=t.split(e);var s=1e3;i&&typeof i.maxKeys=="number"&&(s=i.maxKeys);var a=t.length;s>0&&a>s&&(a=s);for(var u=0;u<a;++u){var c,h,d,g,y=t[u].replace(o,"%20"),w=y.indexOf(r);w>=0?(c=y.substr(0,w),h=y.substr(w+1)):(c=y,h=""),d=decodeURIComponent(c),g=decodeURIComponent(h),Qv(n,d)?Array.isArray(n[d])?n[d].push(g):n[d]=[n[d],g]:n[d]=g}return n},Pi=function(t){switch(typeof t){case"string":return t;case"boolean":return t?"true":"false";case"number":return isFinite(t)?t:"";default:return""}},Jv=function(t,e,r,i){return e=e||"&",r=r||"=",t===null&&(t=void 0),typeof t=="object"?Object.keys(t).map(function(n){var o=encodeURIComponent(Pi(n))+r;return Array.isArray(t[n])?t[n].map(function(s){return o+encodeURIComponent(Pi(s))}).join(e):o+encodeURIComponent(Pi(t[n]))}).join(e):i?encodeURIComponent(Pi(i))+r+encodeURIComponent(Pi(t)):""},dt={};dt.decode=dt.parse=Yv,dt.encode=dt.stringify=Jv;dt.decode;dt.encode;dt.parse;dt.stringify});function Ha(){throw new Error("setTimeout has not been defined")}function Va(){throw new Error("clearTimeout has not been defined")}function Kp(t){if(Bt===setTimeout)return setTimeout(t,0);if((Bt===Ha||!Bt)&&setTimeout)return Bt=setTimeout,setTimeout(t,0);try{return Bt(t,0)}catch{try{return Bt.call(null,t,0)}catch{return Bt.call(this||ri,t,0)}}}function Xv(){ti&&Ir&&(ti=!1,Ir.length?Ot=Ir.concat(Ot):is=-1,Ot.length&&Gp())}function Gp(){if(!ti){var t=Kp(Xv);ti=!0;for(var e=Ot.length;e;){for(Ir=Ot,Ot=[];++is<e;)Ir&&Ir[is].run();is=-1,e=Ot.length}Ir=null,ti=!1,function(r){if(Pt===clearTimeout)return clearTimeout(r);if((Pt===Va||!Pt)&&clearTimeout)return Pt=clearTimeout,clearTimeout(r);try{Pt(r)}catch{try{return Pt.call(null,r)}catch{return Pt.call(this||ri,r)}}}(t)}}function Vp(t,e){(this||ri).fun=t,(this||ri).array=e}function Ct(){}var zp,Bt,Pt,ri,fe,Ir,Ot,ti,is,ne,Qp=be(()=>{_();v();m();ri=typeof globalThis<"u"?globalThis:typeof self<"u"?self:global,fe=zp={};(function(){try{Bt=typeof setTimeout=="function"?setTimeout:Ha}catch{Bt=Ha}try{Pt=typeof clearTimeout=="function"?clearTimeout:Va}catch{Pt=Va}})();Ot=[],ti=!1,is=-1;fe.nextTick=function(t){var e=new Array(arguments.length-1);if(arguments.length>1)for(var r=1;r<arguments.length;r++)e[r-1]=arguments[r];Ot.push(new Vp(t,e)),Ot.length!==1||ti||Kp(Gp)},Vp.prototype.run=function(){(this||ri).fun.apply(null,(this||ri).array)},fe.title="browser",fe.browser=!0,fe.env={},fe.argv=[],fe.version="",fe.versions={},fe.on=Ct,fe.addListener=Ct,fe.once=Ct,fe.off=Ct,fe.removeListener=Ct,fe.removeAllListeners=Ct,fe.emit=Ct,fe.prependListener=Ct,fe.prependOnceListener=Ct,fe.listeners=function(t){return[]},fe.binding=function(t){throw new Error("process.binding is not supported")},fe.cwd=function(){return"/"},fe.chdir=function(t){throw new Error("process.chdir is not supported")},fe.umask=function(){return 0};ne=zp;ne.addListener;ne.argv;ne.binding;ne.browser;ne.chdir;ne.cwd;ne.emit;ne.env;ne.listeners;ne.nextTick;ne.off;ne.on;ne.once;ne.prependListener;ne.prependOnceListener;ne.removeAllListeners;ne.removeListener;ne.title;ne.umask;ne.version;ne.versions});function Zv(){if(Yp)return za;Yp=!0;var t=za={},e,r;function i(){throw new Error("setTimeout has not been defined")}function n(){throw new Error("clearTimeout has not been defined")}(function(){try{typeof setTimeout=="function"?e=setTimeout:e=i}catch{e=i}try{typeof clearTimeout=="function"?r=clearTimeout:r=n}catch{r=n}})();function o(E){if(e===setTimeout)return setTimeout(E,0);if((e===i||!e)&&setTimeout)return e=setTimeout,setTimeout(E,0);try{return e(E,0)}catch{try{return e.call(null,E,0)}catch{return e.call(this||ii,E,0)}}}function s(E){if(r===clearTimeout)return clearTimeout(E);if((r===n||!r)&&clearTimeout)return r=clearTimeout,clearTimeout(E);try{return r(E)}catch{try{return r.call(null,E)}catch{return r.call(this||ii,E)}}}var a=[],u=!1,c,h=-1;function d(){!u||!c||(u=!1,c.length?a=c.concat(a):h=-1,a.length&&g())}function g(){if(!u){var E=o(d);u=!0;for(var S=a.length;S;){for(c=a,a=[];++h<S;)c&&c[h].run();h=-1,S=a.length}c=null,u=!1,s(E)}}t.nextTick=function(E){var S=new Array(arguments.length-1);if(arguments.length>1)for(var I=1;I<arguments.length;I++)S[I-1]=arguments[I];a.push(new y(E,S)),a.length===1&&!u&&o(g)};function y(E,S){(this||ii).fun=E,(this||ii).array=S}y.prototype.run=function(){(this||ii).fun.apply(null,(this||ii).array)},t.title="browser",t.browser=!0,t.env={},t.argv=[],t.version="",t.versions={};function w(){}return t.on=w,t.addListener=w,t.once=w,t.off=w,t.removeListener=w,t.removeAllListeners=w,t.emit=w,t.prependListener=w,t.prependOnceListener=w,t.listeners=function(E){return[]},t.binding=function(E){throw new Error("process.binding is not supported")},t.cwd=function(){return"/"},t.chdir=function(E){throw new Error("process.chdir is not supported")},t.umask=function(){return 0},za}var za,Yp,ii,re,Ka=be(()=>{_();v();m();za={},Yp=!1,ii=typeof globalThis<"u"?globalThis:typeof self<"u"?self:global;re=Zv();re.platform="browser";re.addListener;re.argv;re.binding;re.browser;re.chdir;re.cwd;re.emit;re.env;re.listeners;re.nextTick;re.off;re.on;re.once;re.prependListener;re.prependOnceListener;re.removeAllListeners;re.removeListener;re.title;re.umask;re.version;re.versions});function eE(){if(Jp)return Ga;Jp=!0;var t=re;function e(o){if(typeof o!="string")throw new TypeError("Path must be a string. Received "+JSON.stringify(o))}function r(o,s){for(var a="",u=0,c=-1,h=0,d,g=0;g<=o.length;++g){if(g<o.length)d=o.charCodeAt(g);else{if(d===47)break;d=47}if(d===47){if(!(c===g-1||h===1))if(c!==g-1&&h===2){if(a.length<2||u!==2||a.charCodeAt(a.length-1)!==46||a.charCodeAt(a.length-2)!==46){if(a.length>2){var y=a.lastIndexOf("/");if(y!==a.length-1){y===-1?(a="",u=0):(a=a.slice(0,y),u=a.length-1-a.lastIndexOf("/")),c=g,h=0;continue}}else if(a.length===2||a.length===1){a="",u=0,c=g,h=0;continue}}s&&(a.length>0?a+="/..":a="..",u=2)}else a.length>0?a+="/"+o.slice(c+1,g):a=o.slice(c+1,g),u=g-c-1;c=g,h=0}else d===46&&h!==-1?++h:h=-1}return a}function i(o,s){var a=s.dir||s.root,u=s.base||(s.name||"")+(s.ext||"");return a?a===s.root?a+u:a+o+u:u}var n={resolve:function(){for(var s="",a=!1,u,c=arguments.length-1;c>=-1&&!a;c--){var h;c>=0?h=arguments[c]:(u===void 0&&(u=t.cwd()),h=u),e(h),h.length!==0&&(s=h+"/"+s,a=h.charCodeAt(0)===47)}return s=r(s,!a),a?s.length>0?"/"+s:"/":s.length>0?s:"."},normalize:function(s){if(e(s),s.length===0)return".";var a=s.charCodeAt(0)===47,u=s.charCodeAt(s.length-1)===47;return s=r(s,!a),s.length===0&&!a&&(s="."),s.length>0&&u&&(s+="/"),a?"/"+s:s},isAbsolute:function(s){return e(s),s.length>0&&s.charCodeAt(0)===47},join:function(){if(arguments.length===0)return".";for(var s,a=0;a<arguments.length;++a){var u=arguments[a];e(u),u.length>0&&(s===void 0?s=u:s+="/"+u)}return s===void 0?".":n.normalize(s)},relative:function(s,a){if(e(s),e(a),s===a||(s=n.resolve(s),a=n.resolve(a),s===a))return"";for(var u=1;u<s.length&&s.charCodeAt(u)===47;++u);for(var c=s.length,h=c-u,d=1;d<a.length&&a.charCodeAt(d)===47;++d);for(var g=a.length,y=g-d,w=h<y?h:y,E=-1,S=0;S<=w;++S){if(S===w){if(y>w){if(a.charCodeAt(d+S)===47)return a.slice(d+S+1);if(S===0)return a.slice(d+S)}else h>w&&(s.charCodeAt(u+S)===47?E=S:S===0&&(E=0));break}var I=s.charCodeAt(u+S),C=a.charCodeAt(d+S);if(I!==C)break;I===47&&(E=S)}var R="";for(S=u+E+1;S<=c;++S)(S===c||s.charCodeAt(S)===47)&&(R.length===0?R+="..":R+="/..");return R.length>0?R+a.slice(d+E):(d+=E,a.charCodeAt(d)===47&&++d,a.slice(d))},_makeLong:function(s){return s},dirname:function(s){if(e(s),s.length===0)return".";for(var a=s.charCodeAt(0),u=a===47,c=-1,h=!0,d=s.length-1;d>=1;--d)if(a=s.charCodeAt(d),a===47){if(!h){c=d;break}}else h=!1;return c===-1?u?"/":".":u&&c===1?"//":s.slice(0,c)},basename:function(s,a){if(a!==void 0&&typeof a!="string")throw new TypeError('"ext" argument must be a string');e(s);var u=0,c=-1,h=!0,d;if(a!==void 0&&a.length>0&&a.length<=s.length){if(a.length===s.length&&a===s)return"";var g=a.length-1,y=-1;for(d=s.length-1;d>=0;--d){var w=s.charCodeAt(d);if(w===47){if(!h){u=d+1;break}}else y===-1&&(h=!1,y=d+1),g>=0&&(w===a.charCodeAt(g)?--g===-1&&(c=d):(g=-1,c=y))}return u===c?c=y:c===-1&&(c=s.length),s.slice(u,c)}else{for(d=s.length-1;d>=0;--d)if(s.charCodeAt(d)===47){if(!h){u=d+1;break}}else c===-1&&(h=!1,c=d+1);return c===-1?"":s.slice(u,c)}},extname:function(s){e(s);for(var a=-1,u=0,c=-1,h=!0,d=0,g=s.length-1;g>=0;--g){var y=s.charCodeAt(g);if(y===47){if(!h){u=g+1;break}continue}c===-1&&(h=!1,c=g+1),y===46?a===-1?a=g:d!==1&&(d=1):a!==-1&&(d=-1)}return a===-1||c===-1||d===0||d===1&&a===c-1&&a===u+1?"":s.slice(a,c)},format:function(s){if(s===null||typeof s!="object")throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof s);return i("/",s)},parse:function(s){e(s);var a={root:"",dir:"",base:"",ext:"",name:""};if(s.length===0)return a;var u=s.charCodeAt(0),c=u===47,h;c?(a.root="/",h=1):h=0;for(var d=-1,g=0,y=-1,w=!0,E=s.length-1,S=0;E>=h;--E){if(u=s.charCodeAt(E),u===47){if(!w){g=E+1;break}continue}y===-1&&(w=!1,y=E+1),u===46?d===-1?d=E:S!==1&&(S=1):d!==-1&&(S=-1)}return d===-1||y===-1||S===0||S===1&&d===y-1&&d===g+1?y!==-1&&(g===0&&c?a.base=a.name=s.slice(1,y):a.base=a.name=s.slice(g,y)):(g===0&&c?(a.name=s.slice(1,d),a.base=s.slice(1,y)):(a.name=s.slice(g,d),a.base=s.slice(g,y)),a.ext=s.slice(d,y)),g>0?a.dir=s.slice(0,g-1):c&&(a.dir="/"),a},sep:"/",delimiter:":",win32:null,posix:null};return n.posix=n,Ga=n,Ga}var Ga,Jp,Qa,Xp=be(()=>{_();v();m();Ka();Ga={},Jp=!1;Qa=eE()});var og={};Qt(og,{URL:()=>PE,Url:()=>IE,default:()=>X,fileURLToPath:()=>ng,format:()=>TE,parse:()=>BE,pathToFileURL:()=>sg,resolve:()=>RE,resolveObject:()=>CE});function Fe(){this.protocol=null,this.slashes=null,this.auth=null,this.host=null,this.port=null,this.hostname=null,this.hash=null,this.search=null,this.query=null,this.pathname=null,this.path=null,this.href=null}function Oi(t,e,r){if(t&&pt.isObject(t)&&t instanceof Fe)return t;var i=new Fe;return i.parse(t,e,r),i}function lE(){if(rg)return Xa;rg=!0;var t=ne;function e(o){if(typeof o!="string")throw new TypeError("Path must be a string. Received "+JSON.stringify(o))}function r(o,s){for(var a="",u=0,c=-1,h=0,d,g=0;g<=o.length;++g){if(g<o.length)d=o.charCodeAt(g);else{if(d===47)break;d=47}if(d===47){if(!(c===g-1||h===1))if(c!==g-1&&h===2){if(a.length<2||u!==2||a.charCodeAt(a.length-1)!==46||a.charCodeAt(a.length-2)!==46){if(a.length>2){var y=a.lastIndexOf("/");if(y!==a.length-1){y===-1?(a="",u=0):(a=a.slice(0,y),u=a.length-1-a.lastIndexOf("/")),c=g,h=0;continue}}else if(a.length===2||a.length===1){a="",u=0,c=g,h=0;continue}}s&&(a.length>0?a+="/..":a="..",u=2)}else a.length>0?a+="/"+o.slice(c+1,g):a=o.slice(c+1,g),u=g-c-1;c=g,h=0}else d===46&&h!==-1?++h:h=-1}return a}function i(o,s){var a=s.dir||s.root,u=s.base||(s.name||"")+(s.ext||"");return a?a===s.root?a+u:a+o+u:u}var n={resolve:function(){for(var s="",a=!1,u,c=arguments.length-1;c>=-1&&!a;c--){var h;c>=0?h=arguments[c]:(u===void 0&&(u=t.cwd()),h=u),e(h),h.length!==0&&(s=h+"/"+s,a=h.charCodeAt(0)===47)}return s=r(s,!a),a?s.length>0?"/"+s:"/":s.length>0?s:"."},normalize:function(s){if(e(s),s.length===0)return".";var a=s.charCodeAt(0)===47,u=s.charCodeAt(s.length-1)===47;return s=r(s,!a),s.length===0&&!a&&(s="."),s.length>0&&u&&(s+="/"),a?"/"+s:s},isAbsolute:function(s){return e(s),s.length>0&&s.charCodeAt(0)===47},join:function(){if(arguments.length===0)return".";for(var s,a=0;a<arguments.length;++a){var u=arguments[a];e(u),u.length>0&&(s===void 0?s=u:s+="/"+u)}return s===void 0?".":n.normalize(s)},relative:function(s,a){if(e(s),e(a),s===a||(s=n.resolve(s),a=n.resolve(a),s===a))return"";for(var u=1;u<s.length&&s.charCodeAt(u)===47;++u);for(var c=s.length,h=c-u,d=1;d<a.length&&a.charCodeAt(d)===47;++d);for(var g=a.length,y=g-d,w=h<y?h:y,E=-1,S=0;S<=w;++S){if(S===w){if(y>w){if(a.charCodeAt(d+S)===47)return a.slice(d+S+1);if(S===0)return a.slice(d+S)}else h>w&&(s.charCodeAt(u+S)===47?E=S:S===0&&(E=0));break}var I=s.charCodeAt(u+S),C=a.charCodeAt(d+S);if(I!==C)break;I===47&&(E=S)}var R="";for(S=u+E+1;S<=c;++S)(S===c||s.charCodeAt(S)===47)&&(R.length===0?R+="..":R+="/..");return R.length>0?R+a.slice(d+E):(d+=E,a.charCodeAt(d)===47&&++d,a.slice(d))},_makeLong:function(s){return s},dirname:function(s){if(e(s),s.length===0)return".";for(var a=s.charCodeAt(0),u=a===47,c=-1,h=!0,d=s.length-1;d>=1;--d)if(a=s.charCodeAt(d),a===47){if(!h){c=d;break}}else h=!1;return c===-1?u?"/":".":u&&c===1?"//":s.slice(0,c)},basename:function(s,a){if(a!==void 0&&typeof a!="string")throw new TypeError('"ext" argument must be a string');e(s);var u=0,c=-1,h=!0,d;if(a!==void 0&&a.length>0&&a.length<=s.length){if(a.length===s.length&&a===s)return"";var g=a.length-1,y=-1;for(d=s.length-1;d>=0;--d){var w=s.charCodeAt(d);if(w===47){if(!h){u=d+1;break}}else y===-1&&(h=!1,y=d+1),g>=0&&(w===a.charCodeAt(g)?--g===-1&&(c=d):(g=-1,c=y))}return u===c?c=y:c===-1&&(c=s.length),s.slice(u,c)}else{for(d=s.length-1;d>=0;--d)if(s.charCodeAt(d)===47){if(!h){u=d+1;break}}else c===-1&&(h=!1,c=d+1);return c===-1?"":s.slice(u,c)}},extname:function(s){e(s);for(var a=-1,u=0,c=-1,h=!0,d=0,g=s.length-1;g>=0;--g){var y=s.charCodeAt(g);if(y===47){if(!h){u=g+1;break}continue}c===-1&&(h=!1,c=g+1),y===46?a===-1?a=g:d!==1&&(d=1):a!==-1&&(d=-1)}return a===-1||c===-1||d===0||d===1&&a===c-1&&a===u+1?"":s.slice(a,c)},format:function(s){if(s===null||typeof s!="object")throw new TypeError('The "pathObject" argument must be of type Object. Received type '+typeof s);return i("/",s)},parse:function(s){e(s);var a={root:"",dir:"",base:"",ext:"",name:""};if(s.length===0)return a;var u=s.charCodeAt(0),c=u===47,h;c?(a.root="/",h=1):h=0;for(var d=-1,g=0,y=-1,w=!0,E=s.length-1,S=0;E>=h;--E){if(u=s.charCodeAt(E),u===47){if(!w){g=E+1;break}continue}y===-1&&(w=!1,y=E+1),u===46?d===-1?d=E:S!==1&&(S=1):d!==-1&&(S=-1)}return d===-1||y===-1||S===0||S===1&&d===y-1&&d===g+1?y!==-1&&(g===0&&c?a.base=a.name=s.slice(1,y):a.base=a.name=s.slice(g,y)):(g===0&&c?(a.name=s.slice(1,d),a.base=s.slice(1,y)):(a.name=s.slice(g,d),a.base=s.slice(g,y)),a.ext=s.slice(d,y)),g>0?a.dir=s.slice(0,g-1):c&&(a.dir="/"),a},sep:"/",delimiter:":",win32:null,posix:null};return n.posix=n,Xa=n,Xa}function mE(t){if(typeof t=="string")t=new URL(t);else if(!(t instanceof URL))throw new Deno.errors.InvalidData("invalid argument path , must be a string or URL");if(t.protocol!=="file:")throw new Deno.errors.InvalidData("invalid url scheme");return el?vE(t):EE(t)}function vE(t){let e=t.hostname,r=t.pathname;for(let i=0;i<r.length;i++)if(r[i]==="%"){let n=r.codePointAt(i+2)||32;if(r[i+1]==="2"&&n===102||r[i+1]==="5"&&n===99)throw new Deno.errors.InvalidData("must not include encoded \\ or / characters")}if(r=r.replace(pE,"\\"),r=decodeURIComponent(r),e!=="")return`\\\\${e}${r}`;{let i=r.codePointAt(1)|32,n=r[2];if(i<hE||i>dE||n!==":")throw new Deno.errors.InvalidData("file url path must be absolute");return r.slice(1)}}function EE(t){if(t.hostname!=="")throw new Deno.errors.InvalidData("invalid file url hostname");let e=t.pathname;for(let r=0;r<e.length;r++)if(e[r]==="%"){let i=e.codePointAt(r+2)||32;if(e[r+1]==="2"&&i===102)throw new Deno.errors.InvalidData("must not include encoded / characters")}return decodeURIComponent(e)}function SE(t){let e=ig.resolve(t),r=t.charCodeAt(t.length-1);(r===cE||el&&r===fE)&&e[e.length-1]!==ig.sep&&(e+="/");let i=new URL("file://");return e.includes("%")&&(e=e.replace(gE,"%25")),!el&&e.includes("\\")&&(e=e.replace(yE,"%5C")),e.includes(`
`)&&(e=e.replace(bE,"%0A")),e.includes("\r")&&(e=e.replace(wE,"%0D")),e.includes("	")&&(e=e.replace(_E,"%09")),i.pathname=e,i}function ng(t){if(typeof t=="string")t=new URL(t);else if(!(t instanceof URL))throw new Deno.errors.InvalidData("invalid argument path , must be a string or URL");if(t.protocol!=="file:")throw new Deno.errors.InvalidData("invalid url scheme");return tl?FE(t):WE(t)}function FE(t){let e=t.hostname,r=t.pathname;for(let i=0;i<r.length;i++)if(r[i]==="%"){let n=r.codePointAt(i+2)||32;if(r[i+1]==="2"&&n===102||r[i+1]==="5"&&n===99)throw new Deno.errors.InvalidData("must not include encoded \\ or / characters")}if(r=r.replace(LE,"\\"),r=decodeURIComponent(r),e!=="")return`\\\\${e}${r}`;{let i=r.codePointAt(1)|32,n=r[2];if(i<kE||i>ME||n!==":")throw new Deno.errors.InvalidData("file url path must be absolute");return r.slice(1)}}function WE(t){if(t.hostname!=="")throw new Deno.errors.InvalidData("invalid file url hostname");let e=t.pathname;for(let r=0;r<e.length;r++)if(e[r]==="%"){let i=e.codePointAt(r+2)||32;if(e[r+1]==="2"&&i===102)throw new Deno.errors.InvalidData("must not include encoded / characters")}return decodeURIComponent(e)}function sg(t){let e=Qa.resolve(t),r=t.charCodeAt(t.length-1);(r===xE||tl&&r===OE)&&e[e.length-1]!==Qa.sep&&(e+="/");let i=new URL("file://");return e.includes("%")&&(e=e.replace(UE,"%25")),!tl&&e.includes("\\")&&(e=e.replace(NE,"%5C")),e.includes(`
`)&&(e=e.replace(qE,"%0A")),e.includes("\r")&&(e=e.replace(DE,"%0D")),e.includes("	")&&(e=e.replace(jE,"%09")),i.pathname=e,i}var X,tE,pt,rE,iE,nE,sE,Za,Zp,eg,tg,oE,aE,Ya,ni,Ja,Xa,rg,ig,uE,fE,cE,hE,dE,el,pE,gE,yE,bE,wE,_E,AE,IE,TE,RE,CE,BE,PE,OE,xE,kE,ME,tl,LE,UE,NE,qE,DE,jE,ag=be(()=>{_();v();m();$p();Hp();Qp();Xp();Ka();X={},tE=zt,pt={isString:function(t){return typeof t=="string"},isObject:function(t){return typeof t=="object"&&t!==null},isNull:function(t){return t===null},isNullOrUndefined:function(t){return t==null}};X.parse=Oi,X.resolve=function(t,e){return Oi(t,!1,!0).resolve(e)},X.resolveObject=function(t,e){return t?Oi(t,!1,!0).resolveObject(e):e},X.format=function(t){return pt.isString(t)&&(t=Oi(t)),t instanceof Fe?t.format():Fe.prototype.format.call(t)},X.Url=Fe;rE=/^([a-z0-9.+-]+:)/i,iE=/:[0-9]*$/,nE=/^(\/\/?(?!\/)[^\?\s]*)(\?[^\s]*)?$/,sE=["{","}","|","\\","^","`"].concat(["<",">",'"',"`"," ","\r",`
`,"	"]),Za=["'"].concat(sE),Zp=["%","/","?",";","#"].concat(Za),eg=["/","?","#"],tg=/^[+a-z0-9A-Z_-]{0,63}$/,oE=/^([+a-z0-9A-Z_-]{0,63})(.*)$/,aE={javascript:!0,"javascript:":!0},Ya={javascript:!0,"javascript:":!0},ni={http:!0,https:!0,ftp:!0,gopher:!0,file:!0,"http:":!0,"https:":!0,"ftp:":!0,"gopher:":!0,"file:":!0},Ja=dt;Fe.prototype.parse=function(t,e,r){if(!pt.isString(t))throw new TypeError("Parameter 'url' must be a string, not "+typeof t);var i=t.indexOf("?"),n=i!==-1&&i<t.indexOf("#")?"?":"#",o=t.split(n);o[0]=o[0].replace(/\\/g,"/");var s=t=o.join(n);if(s=s.trim(),!r&&t.split("#").length===1){var a=nE.exec(s);if(a)return this.path=s,this.href=s,this.pathname=a[1],a[2]?(this.search=a[2],this.query=e?Ja.parse(this.search.substr(1)):this.search.substr(1)):e&&(this.search="",this.query={}),this}var u=rE.exec(s);if(u){var c=(u=u[0]).toLowerCase();this.protocol=c,s=s.substr(u.length)}if(r||u||s.match(/^\/\/[^@\/]+@[^@\/]+/)){var h=s.substr(0,2)==="//";!h||u&&Ya[u]||(s=s.substr(2),this.slashes=!0)}if(!Ya[u]&&(h||u&&!ni[u])){for(var d,g,y=-1,w=0;w<eg.length;w++)(E=s.indexOf(eg[w]))!==-1&&(y===-1||E<y)&&(y=E);for((g=y===-1?s.lastIndexOf("@"):s.lastIndexOf("@",y))!==-1&&(d=s.slice(0,g),s=s.slice(g+1),this.auth=decodeURIComponent(d)),y=-1,w=0;w<Zp.length;w++){var E;(E=s.indexOf(Zp[w]))!==-1&&(y===-1||E<y)&&(y=E)}y===-1&&(y=s.length),this.host=s.slice(0,y),s=s.slice(y),this.parseHost(),this.hostname=this.hostname||"";var S=this.hostname[0]==="["&&this.hostname[this.hostname.length-1]==="]";if(!S)for(var I=this.hostname.split(/\./),C=(w=0,I.length);w<C;w++){var R=I[w];if(R&&!R.match(tg)){for(var U="",N=0,W=R.length;N<W;N++)R.charCodeAt(N)>127?U+="x":U+=R[N];if(!U.match(tg)){var K=I.slice(0,w),z=I.slice(w+1),G=R.match(oE);G&&(K.push(G[1]),z.unshift(G[2])),z.length&&(s="/"+z.join(".")+s),this.hostname=K.join(".");break}}}this.hostname.length>255?this.hostname="":this.hostname=this.hostname.toLowerCase(),S||(this.hostname=tE.toASCII(this.hostname));var de=this.port?":"+this.port:"",Gt=this.hostname||"";this.host=Gt+de,this.href+=this.host,S&&(this.hostname=this.hostname.substr(1,this.hostname.length-2),s[0]!=="/"&&(s="/"+s))}if(!aE[c])for(w=0,C=Za.length;w<C;w++){var pe=Za[w];if(s.indexOf(pe)!==-1){var Rr=encodeURIComponent(pe);Rr===pe&&(Rr=escape(pe)),s=s.split(pe).join(Rr)}}var Cr=s.indexOf("#");Cr!==-1&&(this.hash=s.substr(Cr),s=s.slice(0,Cr));var Br=s.indexOf("?");if(Br!==-1?(this.search=s.substr(Br),this.query=s.substr(Br+1),e&&(this.query=Ja.parse(this.query)),s=s.slice(0,Br)):e&&(this.search="",this.query={}),s&&(this.pathname=s),ni[c]&&this.hostname&&!this.pathname&&(this.pathname="/"),this.pathname||this.search){de=this.pathname||"";var ls=this.search||"";this.path=de+ls}return this.href=this.format(),this},Fe.prototype.format=function(){var t=this.auth||"";t&&(t=(t=encodeURIComponent(t)).replace(/%3A/i,":"),t+="@");var e=this.protocol||"",r=this.pathname||"",i=this.hash||"",n=!1,o="";this.host?n=t+this.host:this.hostname&&(n=t+(this.hostname.indexOf(":")===-1?this.hostname:"["+this.hostname+"]"),this.port&&(n+=":"+this.port)),this.query&&pt.isObject(this.query)&&Object.keys(this.query).length&&(o=Ja.stringify(this.query));var s=this.search||o&&"?"+o||"";return e&&e.substr(-1)!==":"&&(e+=":"),this.slashes||(!e||ni[e])&&n!==!1?(n="//"+(n||""),r&&r.charAt(0)!=="/"&&(r="/"+r)):n||(n=""),i&&i.charAt(0)!=="#"&&(i="#"+i),s&&s.charAt(0)!=="?"&&(s="?"+s),e+n+(r=r.replace(/[?#]/g,function(a){return encodeURIComponent(a)}))+(s=s.replace("#","%23"))+i},Fe.prototype.resolve=function(t){return this.resolveObject(Oi(t,!1,!0)).format()},Fe.prototype.resolveObject=function(t){if(pt.isString(t)){var e=new Fe;e.parse(t,!1,!0),t=e}for(var r=new Fe,i=Object.keys(this),n=0;n<i.length;n++){var o=i[n];r[o]=this[o]}if(r.hash=t.hash,t.href==="")return r.href=r.format(),r;if(t.slashes&&!t.protocol){for(var s=Object.keys(t),a=0;a<s.length;a++){var u=s[a];u!=="protocol"&&(r[u]=t[u])}return ni[r.protocol]&&r.hostname&&!r.pathname&&(r.path=r.pathname="/"),r.href=r.format(),r}if(t.protocol&&t.protocol!==r.protocol){if(!ni[t.protocol]){for(var c=Object.keys(t),h=0;h<c.length;h++){var d=c[h];r[d]=t[d]}return r.href=r.format(),r}if(r.protocol=t.protocol,t.host||Ya[t.protocol])r.pathname=t.pathname;else{for(var g=(t.pathname||"").split("/");g.length&&!(t.host=g.shift()););t.host||(t.host=""),t.hostname||(t.hostname=""),g[0]!==""&&g.unshift(""),g.length<2&&g.unshift(""),r.pathname=g.join("/")}if(r.search=t.search,r.query=t.query,r.host=t.host||"",r.auth=t.auth,r.hostname=t.hostname||t.host,r.port=t.port,r.pathname||r.search){var y=r.pathname||"",w=r.search||"";r.path=y+w}return r.slashes=r.slashes||t.slashes,r.href=r.format(),r}var E=r.pathname&&r.pathname.charAt(0)==="/",S=t.host||t.pathname&&t.pathname.charAt(0)==="/",I=S||E||r.host&&t.pathname,C=I,R=r.pathname&&r.pathname.split("/")||[],U=(g=t.pathname&&t.pathname.split("/")||[],r.protocol&&!ni[r.protocol]);if(U&&(r.hostname="",r.port=null,r.host&&(R[0]===""?R[0]=r.host:R.unshift(r.host)),r.host="",t.protocol&&(t.hostname=null,t.port=null,t.host&&(g[0]===""?g[0]=t.host:g.unshift(t.host)),t.host=null),I=I&&(g[0]===""||R[0]==="")),S)r.host=t.host||t.host===""?t.host:r.host,r.hostname=t.hostname||t.hostname===""?t.hostname:r.hostname,r.search=t.search,r.query=t.query,R=g;else if(g.length)R||(R=[]),R.pop(),R=R.concat(g),r.search=t.search,r.query=t.query;else if(!pt.isNullOrUndefined(t.search))return U&&(r.hostname=r.host=R.shift(),(G=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@"))&&(r.auth=G.shift(),r.host=r.hostname=G.shift())),r.search=t.search,r.query=t.query,pt.isNull(r.pathname)&&pt.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.href=r.format(),r;if(!R.length)return r.pathname=null,r.search?r.path="/"+r.search:r.path=null,r.href=r.format(),r;for(var N=R.slice(-1)[0],W=(r.host||t.host||R.length>1)&&(N==="."||N==="..")||N==="",K=0,z=R.length;z>=0;z--)(N=R[z])==="."?R.splice(z,1):N===".."?(R.splice(z,1),K++):K&&(R.splice(z,1),K--);if(!I&&!C)for(;K--;K)R.unshift("..");!I||R[0]===""||R[0]&&R[0].charAt(0)==="/"||R.unshift(""),W&&R.join("/").substr(-1)!=="/"&&R.push("");var G,de=R[0]===""||R[0]&&R[0].charAt(0)==="/";return U&&(r.hostname=r.host=de?"":R.length?R.shift():"",(G=!!(r.host&&r.host.indexOf("@")>0)&&r.host.split("@"))&&(r.auth=G.shift(),r.host=r.hostname=G.shift())),(I=I||r.host&&R.length)&&!de&&R.unshift(""),R.length?r.pathname=R.join("/"):(r.pathname=null,r.path=null),pt.isNull(r.pathname)&&pt.isNull(r.search)||(r.path=(r.pathname?r.pathname:"")+(r.search?r.search:"")),r.auth=t.auth||r.auth,r.slashes=r.slashes||t.slashes,r.href=r.format(),r},Fe.prototype.parseHost=function(){var t=this.host,e=iE.exec(t);e&&((e=e[0])!==":"&&(this.port=e.substr(1)),t=t.substr(0,t.length-e.length)),t&&(this.hostname=t)};X.Url;X.format;X.resolve;X.resolveObject;Xa={},rg=!1;ig=lE(),uE=typeof Deno<"u"?Deno.build.os==="windows"?"win32":Deno.build.os:void 0;X.URL=typeof URL<"u"?URL:null;X.pathToFileURL=SE;X.fileURLToPath=mE;X.Url;X.format;X.resolve;X.resolveObject;X.URL;fE=92,cE=47,hE=97,dE=122,el=uE==="win32",pE=/\//g,gE=/%/g,yE=/\\/g,bE=/\n/g,wE=/\r/g,_E=/\t/g;AE=typeof Deno<"u"?Deno.build.os==="windows"?"win32":Deno.build.os:void 0;X.URL=typeof URL<"u"?URL:null;X.pathToFileURL=sg;X.fileURLToPath=ng;IE=X.Url,TE=X.format,RE=X.resolve,CE=X.resolveObject,BE=X.parse,PE=X.URL,OE=92,xE=47,kE=97,ME=122,tl=AE==="win32",LE=/\//g,UE=/%/g,NE=/\\/g,qE=/\n/g,DE=/\r/g,jE=/\t/g});var rl={};Qt(rl,{Server:()=>Me,Socket:()=>Me,Stream:()=>Me,_createServerHandle:()=>Me,_normalizeArgs:()=>Me,_setSimultaneousAccepts:()=>Me,connect:()=>Me,createConnection:()=>Me,createServer:()=>Me,default:()=>$E,isIP:()=>Me,isIPv4:()=>Me,isIPv6:()=>Me});function Me(){throw new Error("Node.js net module is not supported by JSPM core outside of Node.js")}var $E,il=be(()=>{_();v();m();$E={_createServerHandle:Me,_normalizeArgs:Me,_setSimultaneousAccepts:Me,connect:Me,createConnection:Me,createServer:Me,isIP:Me,isIPv4:Me,isIPv6:Me,Server:Me,Socket:Me,Stream:Me}});var nl=M(xi=>{"use strict";_();v();m();var lg=xi&&xi.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(xi,"__esModule",{value:!0});var HE=lg((il(),Z(rl))),VE=lg(ot()),zE=(0,VE.default)("mqttjs:tcp"),KE=(t,e)=>{e.port=e.port||1883,e.hostname=e.hostname||e.host||"localhost";let{port:r}=e,i=e.hostname;return zE("port %d and host %s",r,i),HE.default.createConnection(r,i)};xi.default=KE});var ug={};Qt(ug,{default:()=>GE});var GE,fg=be(()=>{_();v();m();GE={}});var ol=M(ki=>{"use strict";_();v();m();var sl=ki&&ki.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(ki,"__esModule",{value:!0});var QE=sl((fg(),Z(ug))),YE=sl((il(),Z(rl))),JE=sl(ot()),XE=(0,JE.default)("mqttjs:tls"),ZE=(t,e)=>{e.port=e.port||8883,e.host=e.hostname||e.host||"localhost",YE.default.isIP(e.host)===0&&(e.servername=e.host),e.rejectUnauthorized=e.rejectUnauthorized!==!1,delete e.path,XE("port %d host %s rejectUnauthorized %b",e.port,e.host,e.rejectUnauthorized);let r=QE.default.connect(e);r.on("secureConnect",()=>{e.rejectUnauthorized&&!r.authorized?r.emit("error",new Error("TLS not authorized")):r.removeListener("error",i)});function i(n){e.rejectUnauthorized&&t.emit("error",n),r.end()}return r.on("error",i),r};ki.default=ZE});var ns=M(si=>{"use strict";_();v();m();Object.defineProperty(si,"__esModule",{value:!0});si.BufferedDuplex=si.writev=void 0;var eS=Dt();function cg(t,e){let r=new Array(t.length);for(let i=0;i<t.length;i++)typeof t[i].chunk=="string"?r[i]=x.from(t[i].chunk,"utf8"):r[i]=t[i].chunk;this._write(x.concat(r),"binary",e)}si.writev=cg;var al=class extends eS.Duplex{constructor(e,r,i){super({objectMode:!0}),this.proxy=r,this.socket=i,this.writeQueue=[],e.objectMode||(this._writev=cg.bind(this)),this.isSocketOpen=!1,this.proxy.on("data",n=>{this.push(n)})}_read(e){this.proxy.read(e)}_write(e,r,i){this.isSocketOpen?this.writeToProxy(e,r,i):this.writeQueue.push({chunk:e,encoding:r,cb:i})}_final(e){this.writeQueue=[],this.proxy.end(e)}socketReady(){this.emit("connect"),this.isSocketOpen=!0,this.processWriteQueue()}writeToProxy(e,r,i){this.proxy.write(e,r)===!1?this.proxy.once("drain",i):i()}processWriteQueue(){for(;this.writeQueue.length>0;){let{chunk:e,encoding:r,cb:i}=this.writeQueue.shift();this.writeToProxy(e,r,i)}}};si.BufferedDuplex=al});var fl=M(ul=>{"use strict";_();v();m();Object.defineProperty(ul,"__esModule",{value:!0});var hg=(we(),Z(ve)),tS=Dt(),rS=ns(),gt,ll,Le;function iS(){let t=new tS.Transform;return t._write=(e,r,i)=>{gt.send({data:e.buffer,success(){i()},fail(n){i(new Error(n))}})},t._flush=e=>{gt.close({success(){e()}})},t}function nS(t){t.hostname||(t.hostname="localhost"),t.path||(t.path="/"),t.wsOptions||(t.wsOptions={})}function sS(t,e){let r=t.protocol==="wxs"?"wss":"ws",i=`${r}://${t.hostname}${t.path}`;return t.port&&t.port!==80&&t.port!==443&&(i=`${r}://${t.hostname}:${t.port}${t.path}`),typeof t.transformWsUrl=="function"&&(i=t.transformWsUrl(i,t,e)),i}function oS(){gt.onOpen(()=>{Le.socketReady()}),gt.onMessage(t=>{let{data:e}=t;e instanceof ArrayBuffer?e=hg.Buffer.from(e):e=hg.Buffer.from(e,"utf8"),ll.push(e)}),gt.onClose(()=>{Le.emit("close"),Le.end(),Le.destroy()}),gt.onError(t=>{let e=new Error(t.errMsg);Le.destroy(e)})}var aS=(t,e)=>{if(e.hostname=e.hostname||e.host,!e.hostname)throw new Error("Could not determine host. Specify host manually.");let r=e.protocolId==="MQIsdp"&&e.protocolVersion===3?"mqttv3.1":"mqtt";nS(e);let i=sS(e,t);gt=wx.connectSocket({url:i,protocols:[r]}),ll=iS(),Le=new rS.BufferedDuplex(e,ll,gt),Le._destroy=(o,s)=>{gt.close({success(){s&&s(o)}})};let n=Le.destroy;return Le.destroy=(o,s)=>(Le.destroy=n,setTimeout(()=>{gt.close({fail(){Le._destroy(o,s)}})},0),Le),oS(),Le};ul.default=aS});var dl=M(hl=>{"use strict";_();v();m();Object.defineProperty(hl,"__esModule",{value:!0});var cl=(we(),Z(ve)),lS=Dt(),uS=ns(),xt,ss,oi,dg=!1;function fS(){let t=new lS.Transform;return t._write=(e,r,i)=>{xt.sendSocketMessage({data:e.buffer,success(){i()},fail(){i(new Error)}})},t._flush=e=>{xt.closeSocket({success(){e()}})},t}function cS(t){t.hostname||(t.hostname="localhost"),t.path||(t.path="/"),t.wsOptions||(t.wsOptions={})}function hS(t,e){let r=t.protocol==="alis"?"wss":"ws",i=`${r}://${t.hostname}${t.path}`;return t.port&&t.port!==80&&t.port!==443&&(i=`${r}://${t.hostname}:${t.port}${t.path}`),typeof t.transformWsUrl=="function"&&(i=t.transformWsUrl(i,t,e)),i}function dS(){dg||(dg=!0,xt.onSocketOpen(()=>{oi.socketReady()}),xt.onSocketMessage(t=>{if(typeof t.data=="string"){let e=cl.Buffer.from(t.data,"base64");ss.push(e)}else{let e=new FileReader;e.addEventListener("load",()=>{let r=e.result;r instanceof ArrayBuffer?r=cl.Buffer.from(r):r=cl.Buffer.from(r,"utf8"),ss.push(r)}),e.readAsArrayBuffer(t.data)}}),xt.onSocketClose(()=>{oi.end(),oi.destroy()}),xt.onSocketError(t=>{oi.destroy(t)}))}var pS=(t,e)=>{if(e.hostname=e.hostname||e.host,!e.hostname)throw new Error("Could not determine host. Specify host manually.");let r=e.protocolId==="MQIsdp"&&e.protocolVersion===3?"mqttv3.1":"mqtt";cS(e);let i=hS(e,t);return xt=e.my,xt.connectSocket({url:i,protocols:r}),ss=fS(),oi=new uS.BufferedDuplex(e,ss,xt),dS(),oi};hl.default=pS});var gg=M((EU,pg)=>{"use strict";_();v();m();pg.exports=function(){throw new Error("ws does not work in the browser. Browser clients must use the native WebSocket object")}});var bl=M(Mi=>{"use strict";_();v();m();var yl=Mi&&Mi.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(Mi,"__esModule",{value:!0});var pl=(we(),Z(ve)),yg=yl(gg()),gS=yl(ot()),yS=Dt(),bg=yl(Zn()),gl=ns(),Kt=(0,gS.default)("mqttjs:ws"),bS=["rejectUnauthorized","ca","cert","key","pfx","passphrase"];function wg(t,e){let r=`${t.protocol}://${t.hostname}:${t.port}${t.path}`;return typeof t.transformWsUrl=="function"&&(r=t.transformWsUrl(r,t,e)),r}function _g(t){let e=t;return t.hostname||(e.hostname="localhost"),t.port||(t.protocol==="wss"?e.port=443:e.port=80),t.path||(e.path="/"),t.wsOptions||(e.wsOptions={}),!bg.default&&t.protocol==="wss"&&bS.forEach(r=>{Object.prototype.hasOwnProperty.call(t,r)&&!Object.prototype.hasOwnProperty.call(t.wsOptions,r)&&(e.wsOptions[r]=t[r])}),e}function wS(t){let e=_g(t);if(e.hostname||(e.hostname=e.host),!e.hostname){if(typeof document>"u")throw new Error("Could not determine host. Specify host manually.");let r=new URL(document.URL);e.hostname=r.hostname,e.port||(e.port=Number(r.port))}return e.objectMode===void 0&&(e.objectMode=!(e.binary===!0||e.binary===void 0)),e}function _S(t,e,r){Kt("createWebSocket"),Kt(`protocol: ${r.protocolId} ${r.protocolVersion}`);let i=r.protocolId==="MQIsdp"&&r.protocolVersion===3?"mqttv3.1":"mqtt";Kt(`creating new Websocket for url: ${e} and protocol: ${i}`);let n;return r.createWebsocket?n=r.createWebsocket(e,[i],r):n=new yg.default(e,[i],r.wsOptions),n}function mS(t,e){let r=e.protocolId==="MQIsdp"&&e.protocolVersion===3?"mqttv3.1":"mqtt",i=wg(e,t),n;return e.createWebsocket?n=e.createWebsocket(i,[r],e):n=new WebSocket(i,[r]),n.binaryType="arraybuffer",n}var vS=(t,e)=>{Kt("streamBuilder");let r=_g(e),i=wg(r,t),n=_S(t,i,r),o=yg.default.createWebSocketStream(n,r.wsOptions);return o.url=i,n.on("close",()=>{o.destroy()}),o},ES=(t,e)=>{Kt("browserStreamBuilder");let r,n=wS(e).browserBufferSize||1024*512,o=e.browserBufferTimeout||1e3,s=!e.objectMode,a=mS(t,e),u=h(e,E,S);e.objectMode||(u._writev=gl.writev.bind(u)),u.on("close",()=>{a.close()});let c=typeof a.addEventListener<"u";a.readyState===a.OPEN?(r=u,r.socket=a):(r=new gl.BufferedDuplex(e,u,a),c?a.addEventListener("open",d):a.onopen=d),c?(a.addEventListener("close",g),a.addEventListener("error",y),a.addEventListener("message",w)):(a.onclose=g,a.onerror=y,a.onmessage=w);function h(I,C,R){let U=new yS.Transform({objectMode:I.objectMode});return U._write=C,U._flush=R,U}function d(){Kt("WebSocket onOpen"),r instanceof gl.BufferedDuplex&&r.socketReady()}function g(I){Kt("WebSocket onClose",I),r.end(),r.destroy()}function y(I){Kt("WebSocket onError",I);let C=new Error("WebSocket error");C.event=I,r.destroy(C)}function w(I){let{data:C}=I;C instanceof ArrayBuffer?C=pl.Buffer.from(C):C=pl.Buffer.from(C,"utf8"),u.push(C)}function E(I,C,R){if(a.bufferedAmount>n){setTimeout(E,o,I,C,R);return}s&&typeof I=="string"&&(I=pl.Buffer.from(I,"utf8"));try{a.send(I)}catch(U){return R(U)}R()}function S(I){a.close(),I()}return r};Mi.default=bg.default?ES:vS});var Eg=M(Tr=>{"use strict";_();v();m();var os=Tr&&Tr.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(Tr,"__esModule",{value:!0});Tr.connectAsync=void 0;var SS=os(ot()),AS=os((ag(),Z(og))),IS=os(rs()),TS=os(Zn()),mg=(0,SS.default)("mqttjs"),Re={};TS.default?(Re.wx=fl().default,Re.wxs=fl().default,Re.ali=dl().default,Re.alis=dl().default):(Re.mqtt=nl().default,Re.tcp=nl().default,Re.ssl=ol().default,Re.tls=Re.ssl,Re.mqtts=ol().default);Re.ws=bl().default;Re.wss=bl().default;function RS(t){let e;t.auth&&(e=t.auth.match(/^(.+):(.+)$/),e?(t.username=e[1],t.password=e[2]):t.username=t.auth)}function vg(t,e){if(mg("connecting to an MQTT broker..."),typeof t=="object"&&!e&&(e=t,t=""),e=e||{},t&&typeof t=="string"){let n=AS.default.parse(t,!0);if(n.port!=null&&(n.port=Number(n.port)),e=Object.assign(Object.assign({},n),e),e.protocol===null)throw new Error("Missing protocol");e.protocol=e.protocol.replace(/:$/,"")}if(RS(e),e.query&&typeof e.query.clientId=="string"&&(e.clientId=e.query.clientId),e.cert&&e.key)if(e.protocol){if(["mqtts","wss","wxs","alis"].indexOf(e.protocol)===-1)switch(e.protocol){case"mqtt":e.protocol="mqtts";break;case"ws":e.protocol="wss";break;case"wx":e.protocol="wxs";break;case"ali":e.protocol="alis";break;default:throw new Error(`Unknown protocol for secure connection: "${e.protocol}"!`)}}else throw new Error("Missing secure protocol key");if(!Re[e.protocol]){let n=["mqtts","wss"].indexOf(e.protocol)!==-1;e.protocol=["mqtt","mqtts","ws","wss","wx","wxs","ali","alis"].filter((o,s)=>n&&s%2===0?!1:typeof Re[o]=="function")[0]}if(e.clean===!1&&!e.clientId)throw new Error("Missing clientId for unclean clients");e.protocol&&(e.defaultProtocol=e.protocol);function r(n){return e.servers&&((!n._reconnectCount||n._reconnectCount===e.servers.length)&&(n._reconnectCount=0),e.host=e.servers[n._reconnectCount].host,e.port=e.servers[n._reconnectCount].port,e.protocol=e.servers[n._reconnectCount].protocol?e.servers[n._reconnectCount].protocol:e.defaultProtocol,e.hostname=e.host,n._reconnectCount++),mg("calling streambuilder for",e.protocol),Re[e.protocol](n,e)}let i=new IS.default(r,e);return i.on("error",()=>{}),i}function CS(t,e,r=!0){return new Promise((i,n)=>{let o=vg(t,e),s={connect:u=>{a(),i(o)},end:()=>{a(),i(o)},error:u=>{a(),o.end(),n(u)}};r===!1&&(s.close=()=>{s.error(new Error("Couldn't connect to server"))});function a(){Object.keys(s).forEach(u=>{o.off(u,s[u])})}Object.keys(s).forEach(u=>{o.on(u,s[u])})})}Tr.connectAsync=CS;Tr.default=vg});var wl=M(Q=>{"use strict";_();v();m();var Sg=Q&&Q.__createBinding||(Object.create?function(t,e,r,i){i===void 0&&(i=r);var n=Object.getOwnPropertyDescriptor(e,r);(!n||("get"in n?!e.__esModule:n.writable||n.configurable))&&(n={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,i,n)}:function(t,e,r,i){i===void 0&&(i=r),t[i]=e[r]}),BS=Q&&Q.__setModuleDefault||(Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}:function(t,e){t.default=e}),PS=Q&&Q.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(t!=null)for(var r in t)r!=="default"&&Object.prototype.hasOwnProperty.call(t,r)&&Sg(e,t,r);return BS(e,t),e},Ag=Q&&Q.__exportStar||function(t,e){for(var r in t)r!=="default"&&!Object.prototype.hasOwnProperty.call(e,r)&&Sg(e,t,r)},as=Q&&Q.__importDefault||function(t){return t&&t.__esModule?t:{default:t}};Object.defineProperty(Q,"__esModule",{value:!0});Q.ReasonCodes=Q.UniqueMessageIdProvider=Q.DefaultMessageIdProvider=Q.Store=Q.MqttClient=Q.connectAsync=Q.connect=Q.Client=void 0;var Ig=as(rs());Q.MqttClient=Ig.default;var OS=as(Qo());Q.DefaultMessageIdProvider=OS.default;var xS=as(Up());Q.UniqueMessageIdProvider=xS.default;var kS=as(Xo());Q.Store=kS.default;var Tg=PS(Eg());Q.connect=Tg.default;Object.defineProperty(Q,"connectAsync",{enumerable:!0,get:function(){return Tg.connectAsync}});Q.Client=Ig.default;Ag(rs(),Q);Ag(Yr(),Q);var MS=Si();Object.defineProperty(Q,"ReasonCodes",{enumerable:!0,get:function(){return MS.ReasonCodes}})});var DS=M(We=>{_();v();m();var Rg=We&&We.__createBinding||(Object.create?function(t,e,r,i){i===void 0&&(i=r);var n=Object.getOwnPropertyDescriptor(e,r);(!n||("get"in n?!e.__esModule:n.writable||n.configurable))&&(n={enumerable:!0,get:function(){return e[r]}}),Object.defineProperty(t,i,n)}:function(t,e,r,i){i===void 0&&(i=r),t[i]=e[r]}),LS=We&&We.__setModuleDefault||(Object.create?function(t,e){Object.defineProperty(t,"default",{enumerable:!0,value:e})}:function(t,e){t.default=e}),US=We&&We.__importStar||function(t){if(t&&t.__esModule)return t;var e={};if(t!=null)for(var r in t)r!=="default"&&Object.prototype.hasOwnProperty.call(t,r)&&Rg(e,t,r);return LS(e,t),e},NS=We&&We.__exportStar||function(t,e){for(var r in t)r!=="default"&&!Object.prototype.hasOwnProperty.call(e,r)&&Rg(e,t,r)};Object.defineProperty(We,"__esModule",{value:!0});var qS=US(wl());We.default=qS;NS(wl(),We)});return DS();})();
/*! Bundled license information:

@jspm/core/nodelibs/browser/buffer.js:
  (*! ieee754. BSD-3-Clause License. Feross Aboukhadijeh <https://feross.org/opensource> *)
*/
