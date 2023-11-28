import { mod } from './abstract/modular';
import { ProjPointType as PointType } from './abstract/weierstrass';
import type { Hex, PrivKey } from './abstract/utils';
import { bytesToNumberBE, numberToBytesBE } from './abstract/utils';
export declare const secp256k1: Readonly<{
    create: (hash: import("./abstract/utils").CHash) => import("./abstract/weierstrass").CurveFn;
    CURVE: Readonly<{
        readonly nBitLength: number;
        readonly nByteLength: number;
        readonly Fp: import("./abstract/modular").IField<bigint>;
        readonly n: bigint;
        readonly h: bigint;
        readonly hEff?: bigint;
        readonly Gx: bigint;
        readonly Gy: bigint;
        readonly allowInfinityPoint?: boolean;
        readonly a: bigint;
        readonly b: bigint;
        readonly allowedPrivateKeyLengths?: readonly number[];
        readonly wrapPrivateKey?: boolean;
        readonly endo?: {
            beta: bigint;
            splitScalar: (k: bigint) => {
                k1neg: boolean;
                k1: bigint;
                k2neg: boolean;
                k2: bigint;
            };
        };
        readonly isTorsionFree?: (c: import("./abstract/weierstrass").ProjConstructor<bigint>, point: PointType<bigint>) => boolean;
        readonly clearCofactor?: (c: import("./abstract/weierstrass").ProjConstructor<bigint>, point: PointType<bigint>) => PointType<bigint>;
        readonly hash: import("./abstract/utils").CHash;
        readonly hmac: (key: Uint8Array, ...messages: Uint8Array[]) => Uint8Array;
        readonly randomBytes: (bytesLength?: number) => Uint8Array;
        lowS: boolean;
        readonly bits2int?: (bytes: Uint8Array) => bigint;
        readonly bits2int_modN?: (bytes: Uint8Array) => bigint;
        readonly p: bigint;
    }>;
    getPublicKey: (privateKey: PrivKey, isCompressed?: boolean) => Uint8Array;
    getSharedSecret: (privateA: PrivKey, publicB: Hex, isCompressed?: boolean) => Uint8Array;
    sign: (msgHash: Hex, privKey: PrivKey, opts?: import("./abstract/weierstrass").SignOpts) => import("./abstract/weierstrass").RecoveredSignatureType;
    verify: (signature: Hex | {
        r: bigint;
        s: bigint;
    }, msgHash: Hex, publicKey: Hex, opts?: import("./abstract/weierstrass").VerOpts) => boolean;
    ProjectivePoint: import("./abstract/weierstrass").ProjConstructor<bigint>;
    Signature: import("./abstract/weierstrass").SignatureConstructor;
    utils: {
        normPrivateKeyToScalar: (key: PrivKey) => bigint;
        isValidPrivateKey(privateKey: PrivKey): boolean;
        randomPrivateKey: () => Uint8Array;
        precompute: (windowSize?: number, point?: PointType<bigint>) => PointType<bigint>;
    };
}>;
declare function taggedHash(tag: string, ...messages: Uint8Array[]): Uint8Array;
declare function lift_x(x: bigint): PointType<bigint>;
declare function schnorrGetPublicKey(privateKey: Hex): Uint8Array;
declare function schnorrSign(message: Hex, privateKey: PrivKey, auxRand?: Hex): Uint8Array;
declare function schnorrVerify(signature: Hex, message: Hex, publicKey: Hex): boolean;
export declare const schnorr: {
    getPublicKey: typeof schnorrGetPublicKey;
    sign: typeof schnorrSign;
    verify: typeof schnorrVerify;
    utils: {
        randomPrivateKey: () => Uint8Array;
        lift_x: typeof lift_x;
        pointToBytes: (point: PointType<bigint>) => Uint8Array;
        numberToBytesBE: typeof numberToBytesBE;
        bytesToNumberBE: typeof bytesToNumberBE;
        taggedHash: typeof taggedHash;
        mod: typeof mod;
    };
};
export declare const hashToCurve: (msg: Uint8Array, options?: import("./abstract/hash-to-curve").htfBasicOpts) => import("./abstract/hash-to-curve").H2CPoint<bigint>;
export declare const encodeToCurve: (msg: Uint8Array, options?: import("./abstract/hash-to-curve").htfBasicOpts) => import("./abstract/hash-to-curve").H2CPoint<bigint>;
export declare function schnorrGetExtPubKeyY(priv: PrivKey): Uint8Array;
export {};
