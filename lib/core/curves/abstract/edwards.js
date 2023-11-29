"use strict";
/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    Object.defineProperty(o, k2, { enumerable: true, get: function() { return m[k]; } });
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
exports.twistedEdwards = void 0;
const modular_1 = require("./modular");
const ut = __importStar(require("./utils"));
const utils_1 = require("./utils");
const curve_1 = require("./curve");
const _0n = BigInt(0), _1n = BigInt(1), _2n = BigInt(2), _8n = BigInt(8);
const VERIFY_DEFAULT = { zip215: true };
function validateOpts(curve) {
    const opts = curve_1.validateBasic(curve);
    ut.validateObject(curve, {
        hash: 'function',
        a: 'bigint',
        d: 'bigint',
        randomBytes: 'function',
    }, {
        adjustScalarBytes: 'function',
        domain: 'function',
        uvRatio: 'function',
        mapToCurve: 'function',
    });
    return Object.freeze(Object.assign({}, opts));
}
function twistedEdwards(curveDef) {
    const CURVE = validateOpts(curveDef);
    const { Fp, n: CURVE_ORDER, prehash: prehash, hash: cHash, randomBytes, nByteLength, h: cofactor, } = CURVE;
    const MASK = _2n << (BigInt(nByteLength * 8) - _1n);
    const modP = Fp.create;
    const uvRatio = CURVE.uvRatio ||
        ((u, v) => {
            try {
                return { isValid: true, value: Fp.sqrt(u * Fp.inv(v)) };
            }
            catch (e) {
                return { isValid: false, value: _0n };
            }
        });
    const adjustScalarBytes = CURVE.adjustScalarBytes || ((bytes) => bytes);
    const domain = CURVE.domain ||
        ((data, ctx, phflag) => {
            if (ctx.length || phflag)
                throw new Error('Contexts/pre-hash are not supported');
            return data;
        });
    const inBig = (n) => typeof n === 'bigint' && _0n < n;
    const inRange = (n, max) => inBig(n) && inBig(max) && n < max;
    const in0MaskRange = (n) => n === _0n || inRange(n, MASK);
    function assertInRange(n, max) {
        if (inRange(n, max))
            return n;
        throw new Error(`Expected valid scalar < ${max}, got ${typeof n} ${n}`);
    }
    function assertGE0(n) {
        return n === _0n ? n : assertInRange(n, CURVE_ORDER);
    }
    const pointPrecomputes = new Map();
    function isPoint(other) {
        if (!(other instanceof Point))
            throw new Error('ExtendedPoint expected');
    }
    class Point {
        constructor(ex, ey, ez, et) {
            this.ex = ex;
            this.ey = ey;
            this.ez = ez;
            this.et = et;
            if (!in0MaskRange(ex))
                throw new Error('x required');
            if (!in0MaskRange(ey))
                throw new Error('y required');
            if (!in0MaskRange(ez))
                throw new Error('z required');
            if (!in0MaskRange(et))
                throw new Error('t required');
        }
        get x() {
            return this.toAffine().x;
        }
        get y() {
            return this.toAffine().y;
        }
        static fromAffine(p) {
            if (p instanceof Point)
                throw new Error('extended point not allowed');
            const { x, y } = p || {};
            if (!in0MaskRange(x) || !in0MaskRange(y))
                throw new Error('invalid affine point');
            return new Point(x, y, _1n, modP(x * y));
        }
        static normalizeZ(points) {
            const toInv = Fp.invertBatch(points.map((p) => p.ez));
            return points.map((p, i) => p.toAffine(toInv[i])).map(Point.fromAffine);
        }
        _setWindowSize(windowSize) {
            this._WINDOW_SIZE = windowSize;
            pointPrecomputes.delete(this);
        }
        assertValidity() {
            const { a, d } = CURVE;
            if (this.is0())
                throw new Error('bad point: ZERO');
            const { ex: X, ey: Y, ez: Z, et: T } = this;
            const X2 = modP(X * X);
            const Y2 = modP(Y * Y);
            const Z2 = modP(Z * Z);
            const Z4 = modP(Z2 * Z2);
            const aX2 = modP(X2 * a);
            const left = modP(Z2 * modP(aX2 + Y2));
            const right = modP(Z4 + modP(d * modP(X2 * Y2)));
            if (left !== right)
                throw new Error('bad point: equation left != right (1)');
            const XY = modP(X * Y);
            const ZT = modP(Z * T);
            if (XY !== ZT)
                throw new Error('bad point: equation left != right (2)');
        }
        equals(other) {
            isPoint(other);
            const { ex: X1, ey: Y1, ez: Z1 } = this;
            const { ex: X2, ey: Y2, ez: Z2 } = other;
            const X1Z2 = modP(X1 * Z2);
            const X2Z1 = modP(X2 * Z1);
            const Y1Z2 = modP(Y1 * Z2);
            const Y2Z1 = modP(Y2 * Z1);
            return X1Z2 === X2Z1 && Y1Z2 === Y2Z1;
        }
        is0() {
            return this.equals(Point.ZERO);
        }
        negate() {
            return new Point(modP(-this.ex), this.ey, this.ez, modP(-this.et));
        }
        double() {
            const { a } = CURVE;
            const { ex: X1, ey: Y1, ez: Z1 } = this;
            const A = modP(X1 * X1);
            const B = modP(Y1 * Y1);
            const C = modP(_2n * modP(Z1 * Z1));
            const D = modP(a * A);
            const x1y1 = X1 + Y1;
            const E = modP(modP(x1y1 * x1y1) - A - B);
            const G = D + B;
            const F = G - C;
            const H = D - B;
            const X3 = modP(E * F);
            const Y3 = modP(G * H);
            const T3 = modP(E * H);
            const Z3 = modP(F * G);
            return new Point(X3, Y3, Z3, T3);
        }
        add(other) {
            isPoint(other);
            const { a, d } = CURVE;
            const { ex: X1, ey: Y1, ez: Z1, et: T1 } = this;
            const { ex: X2, ey: Y2, ez: Z2, et: T2 } = other;
            if (a === BigInt(-1)) {
                const A = modP((Y1 - X1) * (Y2 + X2));
                const B = modP((Y1 + X1) * (Y2 - X2));
                const F = modP(B - A);
                if (F === _0n)
                    return this.double();
                const C = modP(Z1 * _2n * T2);
                const D = modP(T1 * _2n * Z2);
                const E = D + C;
                const G = B + A;
                const H = D - C;
                const X3 = modP(E * F);
                const Y3 = modP(G * H);
                const T3 = modP(E * H);
                const Z3 = modP(F * G);
                return new Point(X3, Y3, Z3, T3);
            }
            const A = modP(X1 * X2);
            const B = modP(Y1 * Y2);
            const C = modP(T1 * d * T2);
            const D = modP(Z1 * Z2);
            const E = modP((X1 + Y1) * (X2 + Y2) - A - B);
            const F = D - C;
            const G = D + C;
            const H = modP(B - a * A);
            const X3 = modP(E * F);
            const Y3 = modP(G * H);
            const T3 = modP(E * H);
            const Z3 = modP(F * G);
            return new Point(X3, Y3, Z3, T3);
        }
        subtract(other) {
            return this.add(other.negate());
        }
        wNAF(n) {
            return wnaf.wNAFCached(this, pointPrecomputes, n, Point.normalizeZ);
        }
        multiply(scalar) {
            const { p, f } = this.wNAF(assertInRange(scalar, CURVE_ORDER));
            return Point.normalizeZ([p, f])[0];
        }
        multiplyUnsafe(scalar) {
            let n = assertGE0(scalar);
            if (n === _0n)
                return I;
            if (this.equals(I) || n === _1n)
                return this;
            if (this.equals(G))
                return this.wNAF(n).p;
            return wnaf.unsafeLadder(this, n);
        }
        isSmallOrder() {
            return this.multiplyUnsafe(cofactor).is0();
        }
        isTorsionFree() {
            return wnaf.unsafeLadder(this, CURVE_ORDER).is0();
        }
        toAffine(iz) {
            const { ex: x, ey: y, ez: z } = this;
            const is0 = this.is0();
            if (iz == null)
                iz = is0 ? _8n : Fp.inv(z);
            const ax = modP(x * iz);
            const ay = modP(y * iz);
            const zz = modP(z * iz);
            if (is0)
                return { x: _0n, y: _1n };
            if (zz !== _1n)
                throw new Error('invZ was invalid');
            return { x: ax, y: ay };
        }
        clearCofactor() {
            const { h: cofactor } = CURVE;
            if (cofactor === _1n)
                return this;
            return this.multiplyUnsafe(cofactor);
        }
        static fromHex(hex, zip215 = false) {
            const { d, a } = CURVE;
            const len = Fp.BYTES;
            hex = utils_1.ensureBytes('pointHex', hex, len);
            const normed = hex.slice();
            const lastByte = hex[len - 1];
            normed[len - 1] = lastByte & ~0x80;
            const y = ut.bytesToNumberLE(normed);
            if (y === _0n) {
            }
            else {
                if (zip215)
                    assertInRange(y, MASK);
                else
                    assertInRange(y, Fp.ORDER);
            }
            const y2 = modP(y * y);
            const u = modP(y2 - _1n);
            const v = modP(d * y2 - a);
            let { isValid, value: x } = uvRatio(u, v);
            if (!isValid)
                throw new Error('Point.fromHex: invalid y coordinate');
            const isXOdd = (x & _1n) === _1n;
            const isLastByteOdd = (lastByte & 0x80) !== 0;
            if (!zip215 && x === _0n && isLastByteOdd)
                throw new Error('Point.fromHex: x=0 and x_0=1');
            if (isLastByteOdd !== isXOdd)
                x = modP(-x);
            return Point.fromAffine({ x, y });
        }
        static fromPrivateKey(privKey) {
            return getExtendedPublicKey(privKey).point;
        }
        toRawBytes() {
            const { x, y } = this.toAffine();
            const bytes = ut.numberToBytesLE(y, Fp.BYTES);
            bytes[bytes.length - 1] |= x & _1n ? 0x80 : 0;
            return bytes;
        }
        toHex() {
            return ut.bytesToHex(this.toRawBytes());
        }
    }
    Point.BASE = new Point(CURVE.Gx, CURVE.Gy, _1n, modP(CURVE.Gx * CURVE.Gy));
    Point.ZERO = new Point(_0n, _1n, _1n, _0n);
    const { BASE: G, ZERO: I } = Point;
    const wnaf = curve_1.wNAF(Point, nByteLength * 8);
    function modN(a) {
        return modular_1.mod(a, CURVE_ORDER);
    }
    function modN_LE(hash) {
        return modN(ut.bytesToNumberLE(hash));
    }
    function getExtendedPublicKey(key) {
        const len = nByteLength;
        key = utils_1.ensureBytes('private key', key, len);
        const hashed = utils_1.ensureBytes('hashed private key', cHash(key), 2 * len);
        const head = adjustScalarBytes(hashed.slice(0, len));
        const prefix = hashed.slice(len, 2 * len);
        const scalar = modN_LE(head);
        const point = G.multiply(scalar);
        const pointBytes = point.toRawBytes();
        return { head, prefix, scalar, point, pointBytes };
    }
    function getPublicKey(privKey) {
        return getExtendedPublicKey(privKey).pointBytes;
    }
    function hashDomainToScalar(context = new Uint8Array(), ...msgs) {
        const msg = ut.concatBytes(...msgs);
        return modN_LE(cHash(domain(msg, utils_1.ensureBytes('context', context), !!prehash)));
    }
    function sign(msg, privKey, options = {}) {
        msg = utils_1.ensureBytes('message', msg);
        if (prehash)
            msg = prehash(msg);
        const { prefix, scalar, pointBytes } = getExtendedPublicKey(privKey);
        const r = hashDomainToScalar(options.context, prefix, msg);
        const R = G.multiply(r).toRawBytes();
        const k = hashDomainToScalar(options.context, R, pointBytes, msg);
        const s = modN(r + k * scalar);
        assertGE0(s);
        const res = ut.concatBytes(R, ut.numberToBytesLE(s, Fp.BYTES));
        return utils_1.ensureBytes('result', res, nByteLength * 2);
    }
    const verifyOpts = VERIFY_DEFAULT;
    function verify(sig, msg, publicKey, options = verifyOpts) {
        const { context, zip215 } = options;
        const len = Fp.BYTES;
        sig = utils_1.ensureBytes('signature', sig, 2 * len);
        msg = utils_1.ensureBytes('message', msg);
        if (prehash)
            msg = prehash(msg);
        const s = ut.bytesToNumberLE(sig.slice(len, 2 * len));
        let A, R, SB;
        try {
            A = Point.fromHex(publicKey, zip215);
            R = Point.fromHex(sig.slice(0, len), zip215);
            SB = G.multiplyUnsafe(s);
        }
        catch (error) {
            return false;
        }
        if (!zip215 && A.isSmallOrder())
            return false;
        const k = hashDomainToScalar(context, R.toRawBytes(), A.toRawBytes(), msg);
        const RkA = R.add(A.multiplyUnsafe(k));
        return RkA.subtract(SB).clearCofactor().equals(Point.ZERO);
    }
    G._setWindowSize(8);
    const utils = {
        getExtendedPublicKey,
        randomPrivateKey: () => randomBytes(Fp.BYTES),
        precompute(windowSize = 8, point = Point.BASE) {
            point._setWindowSize(windowSize);
            point.multiply(BigInt(3));
            return point;
        },
    };
    return {
        CURVE,
        getPublicKey,
        sign,
        verify,
        ExtendedPoint: Point,
        utils,
    };
}
exports.twistedEdwards = twistedEdwards;
