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
exports.bls = void 0;
const modular_1 = require("./modular");
const utils_1 = require("./utils");
const htf = __importStar(require("./hash-to-curve"));
const weierstrass_js_1 = require("./weierstrass.js");
const _2n = BigInt(2), _3n = BigInt(3);
class Wrapper {
    constructor() {
        this.createHasher = (a, b, c) => htf.createHasher(a, b, c);
    }
}
function bls(CURVE) {
    const { Fp, Fr, Fp2, Fp6, Fp12 } = CURVE.fields;
    const BLS_X_LEN = utils_1.bitLen(CURVE.params.x);
    function calcPairingPrecomputes(p) {
        const { x, y } = p;
        const Qx = x, Qy = y, Qz = Fp2.ONE;
        let Rx = Qx, Ry = Qy, Rz = Qz;
        let ell_coeff = [];
        for (let i = BLS_X_LEN - 2; i >= 0; i--) {
            let t0 = Fp2.sqr(Ry);
            let t1 = Fp2.sqr(Rz);
            let t2 = Fp2.multiplyByB(Fp2.mul(t1, _3n));
            let t3 = Fp2.mul(t2, _3n);
            let t4 = Fp2.sub(Fp2.sub(Fp2.sqr(Fp2.add(Ry, Rz)), t1), t0);
            ell_coeff.push([
                Fp2.sub(t2, t0),
                Fp2.mul(Fp2.sqr(Rx), _3n),
                Fp2.neg(t4),
            ]);
            Rx = Fp2.div(Fp2.mul(Fp2.mul(Fp2.sub(t0, t3), Rx), Ry), _2n);
            Ry = Fp2.sub(Fp2.sqr(Fp2.div(Fp2.add(t0, t3), _2n)), Fp2.mul(Fp2.sqr(t2), _3n));
            Rz = Fp2.mul(t0, t4);
            if (utils_1.bitGet(CURVE.params.x, i)) {
                let t0 = Fp2.sub(Ry, Fp2.mul(Qy, Rz));
                let t1 = Fp2.sub(Rx, Fp2.mul(Qx, Rz));
                ell_coeff.push([
                    Fp2.sub(Fp2.mul(t0, Qx), Fp2.mul(t1, Qy)),
                    Fp2.neg(t0),
                    t1,
                ]);
                let t2 = Fp2.sqr(t1);
                let t3 = Fp2.mul(t2, t1);
                let t4 = Fp2.mul(t2, Rx);
                let t5 = Fp2.add(Fp2.sub(t3, Fp2.mul(t4, _2n)), Fp2.mul(Fp2.sqr(t0), Rz));
                Rx = Fp2.mul(t1, t5);
                Ry = Fp2.sub(Fp2.mul(Fp2.sub(t4, t5), t0), Fp2.mul(t3, Ry));
                Rz = Fp2.mul(Rz, t3);
            }
        }
        return ell_coeff;
    }
    function millerLoop(ell, g1) {
        const { x } = CURVE.params;
        const Px = g1[0];
        const Py = g1[1];
        let f12 = Fp12.ONE;
        for (let j = 0, i = BLS_X_LEN - 2; i >= 0; i--, j++) {
            const E = ell[j];
            f12 = Fp12.multiplyBy014(f12, E[0], Fp2.mul(E[1], Px), Fp2.mul(E[2], Py));
            if (utils_1.bitGet(x, i)) {
                j += 1;
                const F = ell[j];
                f12 = Fp12.multiplyBy014(f12, F[0], Fp2.mul(F[1], Px), Fp2.mul(F[2], Py));
            }
            if (i !== 0)
                f12 = Fp12.sqr(f12);
        }
        return Fp12.conjugate(f12);
    }
    const utils = {
        randomPrivateKey: () => {
            const length = modular_1.getMinHashLength(Fr.ORDER);
            return modular_1.mapHashToField(CURVE.randomBytes(length), Fr.ORDER);
        },
        calcPairingPrecomputes,
    };
    const G1_ = weierstrass_js_1.weierstrassPoints(Object.assign({ n: Fr.ORDER }, CURVE.G1));
    const G1 = Object.assign(G1_, htf.createHasher(G1_.ProjectivePoint, CURVE.G1.mapToCurve, Object.assign(Object.assign({}, CURVE.htfDefaults), CURVE.G1.htfDefaults)));
    function pairingPrecomputes(point) {
        const p = point;
        if (p._PPRECOMPUTES)
            return p._PPRECOMPUTES;
        p._PPRECOMPUTES = calcPairingPrecomputes(point.toAffine());
        return p._PPRECOMPUTES;
    }
    const G2_ = weierstrass_js_1.weierstrassPoints(Object.assign({ n: Fr.ORDER }, CURVE.G2));
    const G2 = Object.assign(G2_, htf.createHasher(G2_.ProjectivePoint, CURVE.G2.mapToCurve, Object.assign(Object.assign({}, CURVE.htfDefaults), CURVE.G2.htfDefaults)));
    const { ShortSignature } = CURVE.G1;
    const { Signature } = CURVE.G2;
    function pairing(Q, P, withFinalExponent = true) {
        if (Q.equals(G1.ProjectivePoint.ZERO) || P.equals(G2.ProjectivePoint.ZERO))
            throw new Error('pairing is not available for ZERO point');
        Q.assertValidity();
        P.assertValidity();
        const Qa = Q.toAffine();
        const looped = millerLoop(pairingPrecomputes(P), [Qa.x, Qa.y]);
        return withFinalExponent ? Fp12.finalExponentiate(looped) : looped;
    }
    function normP1(point) {
        return point instanceof G1.ProjectivePoint ? point : G1.ProjectivePoint.fromHex(point);
    }
    function normP1Hash(point, htfOpts) {
        return point instanceof G1.ProjectivePoint
            ? point
            : G1.hashToCurve(utils_1.ensureBytes('point', point), htfOpts);
    }
    function normP2(point) {
        return point instanceof G2.ProjectivePoint ? point : Signature.fromHex(point);
    }
    function normP2Hash(point, htfOpts) {
        return point instanceof G2.ProjectivePoint
            ? point
            : G2.hashToCurve(utils_1.ensureBytes('point', point), htfOpts);
    }
    function getPublicKey(privateKey) {
        return G1.ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(true);
    }
    function getPublicKeyForShortSignatures(privateKey) {
        return G2.ProjectivePoint.fromPrivateKey(privateKey).toRawBytes(true);
    }
    function sign(message, privateKey, htfOpts) {
        const msgPoint = normP2Hash(message, htfOpts);
        msgPoint.assertValidity();
        const sigPoint = msgPoint.multiply(G1.normPrivateKeyToScalar(privateKey));
        if (message instanceof G2.ProjectivePoint)
            return sigPoint;
        return Signature.toRawBytes(sigPoint);
    }
    function signShortSignature(message, privateKey, htfOpts) {
        const msgPoint = normP1Hash(message, htfOpts);
        msgPoint.assertValidity();
        const sigPoint = msgPoint.multiply(G1.normPrivateKeyToScalar(privateKey));
        if (message instanceof G1.ProjectivePoint)
            return sigPoint;
        return ShortSignature.toRawBytes(sigPoint);
    }
    function verify(signature, message, publicKey, htfOpts) {
        const P = normP1(publicKey);
        const Hm = normP2Hash(message, htfOpts);
        const G = G1.ProjectivePoint.BASE;
        const S = normP2(signature);
        const ePHm = pairing(P.negate(), Hm, false);
        const eGS = pairing(G, S, false);
        const exp = Fp12.finalExponentiate(Fp12.mul(eGS, ePHm));
        return Fp12.eql(exp, Fp12.ONE);
    }
    function verifyShortSignature(signature, message, publicKey, htfOpts) {
        const P = normP2(publicKey);
        const Hm = normP1Hash(message, htfOpts);
        const G = G2.ProjectivePoint.BASE;
        const S = normP1(signature);
        const eHmP = pairing(Hm, P, false);
        const eSG = pairing(S, G.negate(), false);
        const exp = Fp12.finalExponentiate(Fp12.mul(eSG, eHmP));
        return Fp12.eql(exp, Fp12.ONE);
    }
    function aggregatePublicKeys(publicKeys) {
        if (!publicKeys.length)
            throw new Error('Expected non-empty array');
        const agg = publicKeys.map(normP1).reduce((sum, p) => sum.add(p), G1.ProjectivePoint.ZERO);
        const aggAffine = agg;
        if (publicKeys[0] instanceof G1.ProjectivePoint) {
            aggAffine.assertValidity();
            return aggAffine;
        }
        return aggAffine.toRawBytes(true);
    }
    function aggregateSignatures(signatures) {
        if (!signatures.length)
            throw new Error('Expected non-empty array');
        const agg = signatures.map(normP2).reduce((sum, s) => sum.add(s), G2.ProjectivePoint.ZERO);
        const aggAffine = agg;
        if (signatures[0] instanceof G2.ProjectivePoint) {
            aggAffine.assertValidity();
            return aggAffine;
        }
        return Signature.toRawBytes(aggAffine);
    }
    function aggregateShortSignatures(signatures) {
        if (!signatures.length)
            throw new Error('Expected non-empty array');
        const agg = signatures.map(normP1).reduce((sum, s) => sum.add(s), G1.ProjectivePoint.ZERO);
        const aggAffine = agg;
        if (signatures[0] instanceof G1.ProjectivePoint) {
            aggAffine.assertValidity();
            return aggAffine;
        }
        return ShortSignature.toRawBytes(aggAffine);
    }
    function verifyBatch(signature, messages, publicKeys, htfOpts) {
        if (!messages.length)
            throw new Error('Expected non-empty messages array');
        if (publicKeys.length !== messages.length)
            throw new Error('Pubkey count should equal msg count');
        const sig = normP2(signature);
        const nMessages = messages.map((i) => normP2Hash(i, htfOpts));
        const nPublicKeys = publicKeys.map(normP1);
        try {
            const paired = [];
            for (const message of new Set(nMessages)) {
                const groupPublicKey = nMessages.reduce((groupPublicKey, subMessage, i) => subMessage === message ? groupPublicKey.add(nPublicKeys[i]) : groupPublicKey, G1.ProjectivePoint.ZERO);
                paired.push(pairing(groupPublicKey, message, false));
            }
            paired.push(pairing(G1.ProjectivePoint.BASE.negate(), sig, false));
            const product = paired.reduce((a, b) => Fp12.mul(a, b), Fp12.ONE);
            const exp = Fp12.finalExponentiate(product);
            return Fp12.eql(exp, Fp12.ONE);
        }
        catch (_a) {
            return false;
        }
    }
    G1.ProjectivePoint.BASE._setWindowSize(4);
    return {
        getPublicKey,
        getPublicKeyForShortSignatures,
        sign,
        signShortSignature,
        verify,
        verifyBatch,
        verifyShortSignature,
        aggregatePublicKeys,
        aggregateSignatures,
        aggregateShortSignatures,
        millerLoop,
        pairing,
        G1,
        G2,
        Signature,
        ShortSignature,
        fields: {
            Fr,
            Fp,
            Fp2,
            Fp6,
            Fp12,
        },
        params: {
            x: CURVE.params.x,
            r: CURVE.params.r,
            G1b: CURVE.G1.b,
            G2b: CURVE.G2.b,
        },
        utils,
    };
}
exports.bls = bls;
