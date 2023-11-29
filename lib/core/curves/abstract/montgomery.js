"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.montgomery = void 0;
const modular_1 = require("./modular");
const utils_1 = require("./utils");
const _0n = BigInt(0);
const _1n = BigInt(1);
function validateOpts(curve) {
    utils_1.validateObject(curve, {
        a: 'bigint',
    }, {
        montgomeryBits: 'isSafeInteger',
        nByteLength: 'isSafeInteger',
        adjustScalarBytes: 'function',
        domain: 'function',
        powPminus2: 'function',
        Gu: 'bigint',
    });
    return Object.freeze(Object.assign({}, curve));
}
function montgomery(curveDef) {
    const CURVE = validateOpts(curveDef);
    const { P } = CURVE;
    const modP = (n) => modular_1.mod(n, P);
    const montgomeryBits = CURVE.montgomeryBits;
    const montgomeryBytes = Math.ceil(montgomeryBits / 8);
    const fieldLen = CURVE.nByteLength;
    const adjustScalarBytes = CURVE.adjustScalarBytes || ((bytes) => bytes);
    const powPminus2 = CURVE.powPminus2 || ((x) => modular_1.pow(x, P - BigInt(2), P));
    function cswap(swap, x_2, x_3) {
        const dummy = modP(swap * (x_2 - x_3));
        x_2 = modP(x_2 - dummy);
        x_3 = modP(x_3 + dummy);
        return [x_2, x_3];
    }
    function assertFieldElement(n) {
        if (typeof n === 'bigint' && _0n <= n && n < P)
            return n;
        throw new Error('Expected valid scalar 0 < scalar < CURVE.P');
    }
    const a24 = (CURVE.a - BigInt(2)) / BigInt(4);
    function montgomeryLadder(pointU, scalar) {
        const u = assertFieldElement(pointU);
        const k = assertFieldElement(scalar);
        const x_1 = u;
        let x_2 = _1n;
        let z_2 = _0n;
        let x_3 = u;
        let z_3 = _1n;
        let swap = _0n;
        let sw;
        for (let t = BigInt(montgomeryBits - 1); t >= _0n; t--) {
            const k_t = (k >> t) & _1n;
            swap ^= k_t;
            sw = cswap(swap, x_2, x_3);
            x_2 = sw[0];
            x_3 = sw[1];
            sw = cswap(swap, z_2, z_3);
            z_2 = sw[0];
            z_3 = sw[1];
            swap = k_t;
            const A = x_2 + z_2;
            const AA = modP(A * A);
            const B = x_2 - z_2;
            const BB = modP(B * B);
            const E = AA - BB;
            const C = x_3 + z_3;
            const D = x_3 - z_3;
            const DA = modP(D * A);
            const CB = modP(C * B);
            const dacb = DA + CB;
            const da_cb = DA - CB;
            x_3 = modP(dacb * dacb);
            z_3 = modP(x_1 * modP(da_cb * da_cb));
            x_2 = modP(AA * BB);
            z_2 = modP(E * (AA + modP(a24 * E)));
        }
        sw = cswap(swap, x_2, x_3);
        x_2 = sw[0];
        x_3 = sw[1];
        sw = cswap(swap, z_2, z_3);
        z_2 = sw[0];
        z_3 = sw[1];
        const z2 = powPminus2(z_2);
        return modP(x_2 * z2);
    }
    function encodeUCoordinate(u) {
        return utils_1.numberToBytesLE(modP(u), montgomeryBytes);
    }
    function decodeUCoordinate(uEnc) {
        const u = utils_1.ensureBytes('u coordinate', uEnc, montgomeryBytes);
        if (fieldLen === 32)
            u[31] &= 127;
        return utils_1.bytesToNumberLE(u);
    }
    function decodeScalar(n) {
        const bytes = utils_1.ensureBytes('scalar', n);
        const len = bytes.length;
        if (len !== montgomeryBytes && len !== fieldLen)
            throw new Error(`Expected ${montgomeryBytes} or ${fieldLen} bytes, got ${len}`);
        return utils_1.bytesToNumberLE(adjustScalarBytes(bytes));
    }
    function scalarMult(scalar, u) {
        const pointU = decodeUCoordinate(u);
        const _scalar = decodeScalar(scalar);
        const pu = montgomeryLadder(pointU, _scalar);
        if (pu === _0n)
            throw new Error('Invalid private or public key received');
        return encodeUCoordinate(pu);
    }
    const GuBytes = encodeUCoordinate(CURVE.Gu);
    function scalarMultBase(scalar) {
        return scalarMult(scalar, GuBytes);
    }
    return {
        scalarMult,
        scalarMultBase,
        getSharedSecret: (privateKey, publicKey) => scalarMult(privateKey, publicKey),
        getPublicKey: (privateKey) => scalarMultBase(privateKey),
        utils: { randomPrivateKey: () => CURVE.randomBytes(CURVE.nByteLength) },
        GuBytes: GuBytes,
    };
}
exports.montgomery = montgomery;
