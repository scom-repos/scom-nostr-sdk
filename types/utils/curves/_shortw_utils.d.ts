import { randomBytes } from '../hashes/utils';
import { CurveType } from './abstract/weierstrass';
import { CHash } from './abstract/utils';
export declare function getHash(hash: CHash): {
    hash: CHash;
    hmac: (key: Uint8Array, ...msgs: Uint8Array[]) => Uint8Array;
    randomBytes: typeof randomBytes;
};
type CurveDef = Readonly<Omit<CurveType, 'hash' | 'hmac' | 'randomBytes'>>;
export declare function createCurve(curveDef: CurveDef, defHash: CHash): Readonly<{
    create: (hash: CHash) => import("./abstract/weierstrass").CurveFn;
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
        readonly isTorsionFree?: (c: import("./abstract/weierstrass").ProjConstructor<bigint>, point: import("./abstract/weierstrass").ProjPointType<bigint>) => boolean;
        readonly clearCofactor?: (c: import("./abstract/weierstrass").ProjConstructor<bigint>, point: import("./abstract/weierstrass").ProjPointType<bigint>) => import("./abstract/weierstrass").ProjPointType<bigint>;
        readonly hash: CHash;
        readonly hmac: (key: Uint8Array, ...messages: Uint8Array[]) => Uint8Array;
        readonly randomBytes: (bytesLength?: number) => Uint8Array;
        lowS: boolean;
        readonly bits2int?: (bytes: Uint8Array) => bigint;
        readonly bits2int_modN?: (bytes: Uint8Array) => bigint;
        readonly p: bigint;
    }>;
    getPublicKey: (privateKey: import("./abstract/utils").PrivKey, isCompressed?: boolean) => Uint8Array;
    getSharedSecret: (privateA: import("./abstract/utils").PrivKey, publicB: import("./abstract/utils").Hex, isCompressed?: boolean) => Uint8Array;
    sign: (msgHash: import("./abstract/utils").Hex, privKey: import("./abstract/utils").PrivKey, opts?: import("./abstract/weierstrass").SignOpts) => import("./abstract/weierstrass").RecoveredSignatureType;
    verify: (signature: import("./abstract/utils").Hex | {
        r: bigint;
        s: bigint;
    }, msgHash: import("./abstract/utils").Hex, publicKey: import("./abstract/utils").Hex, opts?: import("./abstract/weierstrass").VerOpts) => boolean;
    ProjectivePoint: import("./abstract/weierstrass").ProjConstructor<bigint>;
    Signature: import("./abstract/weierstrass").SignatureConstructor;
    utils: {
        normPrivateKeyToScalar: (key: import("./abstract/utils").PrivKey) => bigint;
        isValidPrivateKey(privateKey: import("./abstract/utils").PrivKey): boolean;
        randomPrivateKey: () => Uint8Array;
        precompute: (windowSize?: number, point?: import("./abstract/weierstrass").ProjPointType<bigint>) => import("./abstract/weierstrass").ProjPointType<bigint>;
    };
}>;
export {};
