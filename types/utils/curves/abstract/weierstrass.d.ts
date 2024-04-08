/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
import * as mod from './modular';
import * as ut from './utils';
import { CHash, Hex, PrivKey } from './utils';
import { Group, GroupConstructor, BasicCurve, AffinePoint } from './curve';
export type { AffinePoint };
type HmacFnSync = (key: Uint8Array, ...messages: Uint8Array[]) => Uint8Array;
type EndomorphismOpts = {
    beta: bigint;
    splitScalar: (k: bigint) => {
        k1neg: boolean;
        k1: bigint;
        k2neg: boolean;
        k2: bigint;
    };
};
export type BasicWCurve<T> = BasicCurve<T> & {
    a: T;
    b: T;
    allowedPrivateKeyLengths?: readonly number[];
    wrapPrivateKey?: boolean;
    endo?: EndomorphismOpts;
    isTorsionFree?: (c: ProjConstructor<T>, point: ProjPointType<T>) => boolean;
    clearCofactor?: (c: ProjConstructor<T>, point: ProjPointType<T>) => ProjPointType<T>;
};
type Entropy = Hex | true;
export type SignOpts = {
    lowS?: boolean;
    extraEntropy?: Entropy;
    prehash?: boolean;
};
export type VerOpts = {
    lowS?: boolean;
    prehash?: boolean;
};
export interface ProjPointType<T> extends Group<ProjPointType<T>> {
    readonly px: T;
    readonly py: T;
    readonly pz: T;
    readonly x: T;
    readonly y: T;
    multiply(scalar: bigint): ProjPointType<T>;
    toAffine(iz?: T): AffinePoint<T>;
    isTorsionFree(): boolean;
    clearCofactor(): ProjPointType<T>;
    assertValidity(): void;
    hasEvenY(): boolean;
    toRawBytes(isCompressed?: boolean): Uint8Array;
    toHex(isCompressed?: boolean): string;
    multiplyUnsafe(scalar: bigint): ProjPointType<T>;
    multiplyAndAddUnsafe(Q: ProjPointType<T>, a: bigint, b: bigint): ProjPointType<T> | undefined;
    _setWindowSize(windowSize: number): void;
}
export interface ProjConstructor<T> extends GroupConstructor<ProjPointType<T>> {
    new (x: T, y: T, z: T): ProjPointType<T>;
    fromAffine(p: AffinePoint<T>): ProjPointType<T>;
    fromHex(hex: Hex): ProjPointType<T>;
    fromPrivateKey(privateKey: PrivKey): ProjPointType<T>;
    normalizeZ(points: ProjPointType<T>[]): ProjPointType<T>[];
}
export type CurvePointsType<T> = BasicWCurve<T> & {
    fromBytes?: (bytes: Uint8Array) => AffinePoint<T>;
    toBytes?: (c: ProjConstructor<T>, point: ProjPointType<T>, isCompressed: boolean) => Uint8Array;
};
export type CurvePointsRes<T> = {
    ProjectivePoint: ProjConstructor<T>;
    normPrivateKeyToScalar: (key: PrivKey) => bigint;
    weierstrassEquation: (x: T) => T;
    isWithinCurveOrder: (num: bigint) => boolean;
};
export declare const DER: {
    Err: {
        new (m?: string): {
            name: string;
            message: string;
            stack?: string;
        };
    };
    _parseInt(data: Uint8Array): {
        d: bigint;
        l: Uint8Array;
    };
    toSig(hex: string | Uint8Array): {
        r: bigint;
        s: bigint;
    };
    hexFromSig(sig: {
        r: bigint;
        s: bigint;
    }): string;
};
export declare function weierstrassPoints<T>(opts: CurvePointsType<T>): {
    CURVE: Readonly<{
        readonly nBitLength: number;
        readonly nByteLength: number;
        readonly Fp: mod.IField<T>;
        readonly n: bigint;
        readonly h: bigint;
        readonly hEff?: bigint;
        readonly Gx: T;
        readonly Gy: T;
        readonly allowInfinityPoint?: boolean;
        readonly a: T;
        readonly b: T;
        readonly allowedPrivateKeyLengths?: readonly number[];
        readonly wrapPrivateKey?: boolean;
        readonly endo?: EndomorphismOpts;
        readonly isTorsionFree?: (c: ProjConstructor<T>, point: ProjPointType<T>) => boolean;
        readonly clearCofactor?: (c: ProjConstructor<T>, point: ProjPointType<T>) => ProjPointType<T>;
        readonly fromBytes?: (bytes: Uint8Array) => AffinePoint<T>;
        readonly toBytes?: (c: ProjConstructor<T>, point: ProjPointType<T>, isCompressed: boolean) => Uint8Array;
        readonly p: bigint;
    }>;
    ProjectivePoint: ProjConstructor<T>;
    normPrivateKeyToScalar: (key: PrivKey) => bigint;
    weierstrassEquation: (x: T) => T;
    isWithinCurveOrder: (num: bigint) => boolean;
};
export interface SignatureType {
    readonly r: bigint;
    readonly s: bigint;
    readonly recovery?: number;
    assertValidity(): void;
    addRecoveryBit(recovery: number): RecoveredSignatureType;
    hasHighS(): boolean;
    normalizeS(): SignatureType;
    recoverPublicKey(msgHash: Hex): ProjPointType<bigint>;
    toCompactRawBytes(): Uint8Array;
    toCompactHex(): string;
    toDERRawBytes(isCompressed?: boolean): Uint8Array;
    toDERHex(isCompressed?: boolean): string;
}
export type RecoveredSignatureType = SignatureType & {
    readonly recovery: number;
};
export type SignatureConstructor = {
    new (r: bigint, s: bigint): SignatureType;
    fromCompact(hex: Hex): SignatureType;
    fromDER(hex: Hex): SignatureType;
};
type SignatureLike = {
    r: bigint;
    s: bigint;
};
export type PubKey = Hex | ProjPointType<bigint>;
export type CurveType = BasicWCurve<bigint> & {
    hash: CHash;
    hmac: HmacFnSync;
    randomBytes: (bytesLength?: number) => Uint8Array;
    lowS?: boolean;
    bits2int?: (bytes: Uint8Array) => bigint;
    bits2int_modN?: (bytes: Uint8Array) => bigint;
};
declare function validateOpts(curve: CurveType): Readonly<{
    readonly nBitLength: number;
    readonly nByteLength: number;
    readonly Fp: mod.IField<bigint>;
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
    readonly endo?: EndomorphismOpts;
    readonly isTorsionFree?: (c: ProjConstructor<bigint>, point: ProjPointType<bigint>) => boolean;
    readonly clearCofactor?: (c: ProjConstructor<bigint>, point: ProjPointType<bigint>) => ProjPointType<bigint>;
    readonly hash: ut.CHash;
    readonly hmac: HmacFnSync;
    readonly randomBytes: (bytesLength?: number) => Uint8Array;
    lowS: boolean;
    readonly bits2int?: (bytes: Uint8Array) => bigint;
    readonly bits2int_modN?: (bytes: Uint8Array) => bigint;
    readonly p: bigint;
}>;
export type CurveFn = {
    CURVE: ReturnType<typeof validateOpts>;
    getPublicKey: (privateKey: PrivKey, isCompressed?: boolean) => Uint8Array;
    getSharedSecret: (privateA: PrivKey, publicB: Hex, isCompressed?: boolean) => Uint8Array;
    sign: (msgHash: Hex, privKey: PrivKey, opts?: SignOpts) => RecoveredSignatureType;
    verify: (signature: Hex | SignatureLike, msgHash: Hex, publicKey: Hex, opts?: VerOpts) => boolean;
    ProjectivePoint: ProjConstructor<bigint>;
    Signature: SignatureConstructor;
    utils: {
        normPrivateKeyToScalar: (key: PrivKey) => bigint;
        isValidPrivateKey(privateKey: PrivKey): boolean;
        randomPrivateKey: () => Uint8Array;
        precompute: (windowSize?: number, point?: ProjPointType<bigint>) => ProjPointType<bigint>;
    };
};
export declare function weierstrass(curveDef: CurveType): CurveFn;
export declare function SWUFpSqrtRatio<T>(Fp: mod.IField<T>, Z: T): (u: T, v: T) => {
    isValid: boolean;
    value: T;
};
export declare function mapToCurveSimpleSWU<T>(Fp: mod.IField<T>, opts: {
    A: T;
    B: T;
    Z: T;
}): (u: T) => {
    x: T;
    y: T;
};
