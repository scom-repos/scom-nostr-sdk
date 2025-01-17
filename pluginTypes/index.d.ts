/// <amd-module name="@scom/scom-social-sdk/core/hashes/_assert.ts" />
declare module "@scom/scom-social-sdk/core/hashes/_assert.ts" {
    function number(n: number): void;
    function bool(b: boolean): void;
    function bytes(b: Uint8Array | undefined, ...lengths: number[]): void;
    type Hash = {
        (data: Uint8Array): Uint8Array;
        blockLen: number;
        outputLen: number;
        create: any;
    };
    function hash(hash: Hash): void;
    function exists(instance: any, checkFinished?: boolean): void;
    function output(out: any, instance: any): void;
    export { number, bool, bytes, hash, exists, output };
    const assert: {
        number: typeof number;
        bool: typeof bool;
        bytes: typeof bytes;
        hash: typeof hash;
        exists: typeof exists;
        output: typeof output;
    };
    export default assert;
}
/// <amd-module name="@scom/scom-social-sdk/core/hashes/utils.ts" />
declare module "@scom/scom-social-sdk/core/hashes/utils.ts" {
    /*! noble-hashes - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    export type TypedArray = Int8Array | Uint8ClampedArray | Uint8Array | Uint16Array | Int16Array | Uint32Array | Int32Array;
    export const createView: (arr: TypedArray) => DataView;
    export const rotr: (word: number, shift: number) => number;
    /**
     * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
     */
    export function bytesToHex(bytes: Uint8Array): string;
    /**
     * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
     */
    export function hexToBytes(hex: string): Uint8Array;
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    export function utf8ToBytes(str: string): Uint8Array;
    export type Input = Uint8Array | string;
    /**
     * Normalizes (non-hex) string or Uint8Array to Uint8Array.
     * Warning: when Uint8Array is passed, it would NOT get copied.
     * Keep in mind for future mutable operations.
     */
    export function toBytes(data: Input): Uint8Array;
    /**
     * Copies several Uint8Arrays into one.
     */
    export function concatBytes(...arrays: Uint8Array[]): Uint8Array;
    export abstract class Hash<T extends Hash<T>> {
        abstract blockLen: number;
        abstract outputLen: number;
        abstract update(buf: Input): this;
        abstract digestInto(buf: Uint8Array): void;
        abstract digest(): Uint8Array;
        /**
         * Resets internal state. Makes Hash instance unusable.
         * Reset is impossible for keyed hashes if key is consumed into state. If digest is not consumed
         * by user, they will need to manually call `destroy()` when zeroing is necessary.
         */
        abstract destroy(): void;
        /**
         * Clones hash instance. Unsafe: doesn't check whether `to` is valid. Can be used as `clone()`
         * when no options are passed.
         * Reasons to use `_cloneInto` instead of clone: 1) performance 2) reuse instance => all internal
         * buffers are overwritten => causes buffer overwrite which is used for digest in some cases.
         * There are no guarantees for clean-up because it's impossible in JS.
         */
        abstract _cloneInto(to?: T): T;
        clone(): T;
    }
    export type CHash = ReturnType<typeof wrapConstructor>;
    export function wrapConstructor<T extends Hash<T>>(hashCons: () => Hash<T>): {
        (msg: Input): Uint8Array;
        outputLen: number;
        blockLen: number;
        create(): Hash<T>;
    };
    export function randomBytes(bytesLength?: number): Uint8Array;
}
/// <amd-module name="@scom/scom-social-sdk/core/hashes/_sha2.ts" />
declare module "@scom/scom-social-sdk/core/hashes/_sha2.ts" {
    import { Hash, Input } from "@scom/scom-social-sdk/core/hashes/utils.ts";
    export abstract class SHA2<T extends SHA2<T>> extends Hash<T> {
        readonly blockLen: number;
        outputLen: number;
        readonly padOffset: number;
        readonly isLE: boolean;
        protected abstract process(buf: DataView, offset: number): void;
        protected abstract get(): number[];
        protected abstract set(...args: number[]): void;
        abstract destroy(): void;
        protected abstract roundClean(): void;
        protected buffer: Uint8Array;
        protected view: DataView;
        protected finished: boolean;
        protected length: number;
        protected pos: number;
        protected destroyed: boolean;
        constructor(blockLen: number, outputLen: number, padOffset: number, isLE: boolean);
        update(data: Input): this;
        digestInto(out: Uint8Array): void;
        digest(): Uint8Array;
        _cloneInto(to?: T): T;
    }
}
/// <amd-module name="@scom/scom-social-sdk/core/hashes/sha256.ts" />
declare module "@scom/scom-social-sdk/core/hashes/sha256.ts" {
    import { SHA2 } from "@scom/scom-social-sdk/core/hashes/_sha2.ts";
    class SHA256 extends SHA2<SHA256> {
        A: number;
        B: number;
        C: number;
        D: number;
        E: number;
        F: number;
        G: number;
        H: number;
        constructor();
        protected get(): [number, number, number, number, number, number, number, number];
        protected set(A: number, B: number, C: number, D: number, E: number, F: number, G: number, H: number): void;
        protected process(view: DataView, offset: number): void;
        protected roundClean(): void;
        destroy(): void;
    }
    /**
     * SHA2-256 hash function
     * @param message - data that would be hashed
     */
    export const sha256: {
        (msg: import("@scom/scom-social-sdk/core/hashes/utils.ts").Input): Uint8Array;
        outputLen: number;
        blockLen: number;
        create(): import("@scom/scom-social-sdk/core/hashes/utils.ts").Hash<SHA256>;
    };
    export const sha224: {
        (msg: import("@scom/scom-social-sdk/core/hashes/utils.ts").Input): Uint8Array;
        outputLen: number;
        blockLen: number;
        create(): import("@scom/scom-social-sdk/core/hashes/utils.ts").Hash<SHA256>;
    };
}
/// <amd-module name="@scom/scom-social-sdk/core/curves/abstract/utils.ts" />
declare module "@scom/scom-social-sdk/core/curves/abstract/utils.ts" {
    export type Hex = Uint8Array | string;
    export type PrivKey = Hex | bigint;
    export type CHash = {
        (message: Uint8Array | string): Uint8Array;
        blockLen: number;
        outputLen: number;
        create(opts?: {
            dkLen?: number;
        }): any;
    };
    export type FHash = (message: Uint8Array | string) => Uint8Array;
    /**
     * @example bytesToHex(Uint8Array.from([0xca, 0xfe, 0x01, 0x23])) // 'cafe0123'
     */
    export function bytesToHex(bytes: Uint8Array): string;
    export function numberToHexUnpadded(num: number | bigint): string;
    export function hexToNumber(hex: string): bigint;
    /**
     * @example hexToBytes('cafe0123') // Uint8Array.from([0xca, 0xfe, 0x01, 0x23])
     */
    export function hexToBytes(hex: string): Uint8Array;
    export function bytesToNumberBE(bytes: Uint8Array): bigint;
    export function bytesToNumberLE(bytes: Uint8Array): bigint;
    export function numberToBytesBE(n: number | bigint, len: number): Uint8Array;
    export function numberToBytesLE(n: number | bigint, len: number): Uint8Array;
    export function numberToVarBytesBE(n: number | bigint): Uint8Array;
    /**
     * Takes hex string or Uint8Array, converts to Uint8Array.
     * Validates output length.
     * Will throw error for other types.
     * @param title descriptive title for an error e.g. 'private key'
     * @param hex hex string or Uint8Array
     * @param expectedLength optional, will compare to result array's length
     * @returns
     */
    export function ensureBytes(title: string, hex: Hex, expectedLength?: number): Uint8Array;
    /**
     * Copies several Uint8Arrays into one.
     */
    export function concatBytes(...arrays: Uint8Array[]): Uint8Array;
    export function equalBytes(b1: Uint8Array, b2: Uint8Array): boolean;
    /**
     * @example utf8ToBytes('abc') // new Uint8Array([97, 98, 99])
     */
    export function utf8ToBytes(str: string): Uint8Array;
    /**
     * Calculates amount of bits in a bigint.
     * Same as `n.toString(2).length`
     */
    export function bitLen(n: bigint): any;
    /**
     * Gets single bit at position.
     * NOTE: first bit position is 0 (same as arrays)
     * Same as `!!+Array.from(n.toString(2)).reverse()[pos]`
     */
    export function bitGet(n: bigint, pos: number): bigint;
    /**
     * Sets single bit at position.
     */
    export const bitSet: (n: bigint, pos: number, value: boolean) => bigint;
    /**
     * Calculate mask for N bits. Not using ** operator with bigints because of old engines.
     * Same as BigInt(`0b${Array(i).fill('1').join('')}`)
     */
    export const bitMask: (n: number) => bigint;
    type Pred<T> = (v: Uint8Array) => T | undefined;
    /**
     * Minimal HMAC-DRBG from NIST 800-90 for RFC6979 sigs.
     * @returns function that will call DRBG until 2nd arg returns something meaningful
     * @example
     *   const drbg = createHmacDRBG<Key>(32, 32, hmac);
     *   drbg(seed, bytesToKey); // bytesToKey must return Key or undefined
     */
    export function createHmacDrbg<T>(hashLen: number, qByteLen: number, hmacFn: (key: Uint8Array, ...messages: Uint8Array[]) => Uint8Array): (seed: Uint8Array, predicate: Pred<T>) => T;
    const validatorFns: {
        readonly bigint: (val: any) => boolean;
        readonly function: (val: any) => boolean;
        readonly boolean: (val: any) => boolean;
        readonly string: (val: any) => boolean;
        readonly stringOrUint8Array: (val: any) => boolean;
        readonly isSafeInteger: (val: any) => boolean;
        readonly array: (val: any) => boolean;
        readonly field: (val: any, object: any) => any;
        readonly hash: (val: any) => boolean;
    };
    type Validator = keyof typeof validatorFns;
    type ValMap<T extends Record<string, any>> = {
        [K in keyof T]?: Validator;
    };
    export function validateObject<T extends Record<string, any>>(object: T, validators: ValMap<T>, optValidators?: ValMap<T>): T;
}
/// <amd-module name="@scom/scom-social-sdk/core/curves/abstract/modular.ts" />
declare module "@scom/scom-social-sdk/core/curves/abstract/modular.ts" {
    export function mod(a: bigint, b: bigint): bigint;
    /**
     * Efficiently raise num to power and do modular division.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     * @example
     * pow(2n, 6n, 11n) // 64n % 11n == 9n
     */
    export function pow(num: bigint, power: bigint, modulo: bigint): bigint;
    export function pow2(x: bigint, power: bigint, modulo: bigint): bigint;
    export function invert(number: bigint, modulo: bigint): bigint;
    /**
     * Tonelli-Shanks square root search algorithm.
     * 1. https://eprint.iacr.org/2012/685.pdf (page 12)
     * 2. Square Roots from 1; 24, 51, 10 to Dan Shanks
     * Will start an infinite loop if field order P is not prime.
     * @param P field order
     * @returns function that takes field Fp (created from P) and number n
     */
    export function tonelliShanks(P: bigint): <T>(Fp: IField<T>, n: T) => T;
    export function FpSqrt(P: bigint): <T>(Fp: IField<T>, n: T) => T;
    export const isNegativeLE: (num: bigint, modulo: bigint) => boolean;
    export interface IField<T> {
        ORDER: bigint;
        BYTES: number;
        BITS: number;
        MASK: bigint;
        ZERO: T;
        ONE: T;
        create: (num: T) => T;
        isValid: (num: T) => boolean;
        is0: (num: T) => boolean;
        neg(num: T): T;
        inv(num: T): T;
        sqrt(num: T): T;
        sqr(num: T): T;
        eql(lhs: T, rhs: T): boolean;
        add(lhs: T, rhs: T): T;
        sub(lhs: T, rhs: T): T;
        mul(lhs: T, rhs: T | bigint): T;
        pow(lhs: T, power: bigint): T;
        div(lhs: T, rhs: T | bigint): T;
        addN(lhs: T, rhs: T): T;
        subN(lhs: T, rhs: T): T;
        mulN(lhs: T, rhs: T | bigint): T;
        sqrN(num: T): T;
        isOdd?(num: T): boolean;
        pow(lhs: T, power: bigint): T;
        invertBatch: (lst: T[]) => T[];
        toBytes(num: T): Uint8Array;
        fromBytes(bytes: Uint8Array): T;
        cmov(a: T, b: T, c: boolean): T;
    }
    export function validateField<T>(field: IField<T>): IField<T>;
    /**
     * Same as `pow` but for Fp: non-constant-time.
     * Unsafe in some contexts: uses ladder, so can expose bigint bits.
     */
    export function FpPow<T>(f: IField<T>, num: T, power: bigint): T;
    /**
     * Efficiently invert an array of Field elements.
     * `inv(0)` will return `undefined` here: make sure to throw an error.
     */
    export function FpInvertBatch<T>(f: IField<T>, nums: T[]): T[];
    export function FpDiv<T>(f: IField<T>, lhs: T, rhs: T | bigint): T;
    export function FpIsSquare<T>(f: IField<T>): (x: T) => boolean;
    export function nLength(n: bigint, nBitLength?: number): {
        nBitLength: number;
        nByteLength: number;
    };
    type FpField = IField<bigint> & Required<Pick<IField<bigint>, 'isOdd'>>;
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
    export function Field(ORDER: bigint, bitLen?: number, isLE?: boolean, redef?: Partial<IField<bigint>>): Readonly<FpField>;
    export function FpSqrtOdd<T>(Fp: IField<T>, elm: T): T;
    export function FpSqrtEven<T>(Fp: IField<T>, elm: T): T;
    /**
     * "Constant-time" private key generation utility.
     * Same as mapKeyToField, but accepts less bytes (40 instead of 48 for 32-byte field).
     * Which makes it slightly more biased, less secure.
     * @deprecated use mapKeyToField instead
     */
    export function hashToPrivateScalar(hash: string | Uint8Array, groupOrder: bigint, isLE?: boolean): bigint;
    /**
     * Returns total number of bytes consumed by the field element.
     * For example, 32 bytes for usual 256-bit weierstrass curve.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of field
     */
    export function getFieldBytesLength(fieldOrder: bigint): number;
    /**
     * Returns minimal amount of bytes that can be safely reduced
     * by field order.
     * Should be 2^-128 for 128-bit curve such as P256.
     * @param fieldOrder number of field elements, usually CURVE.n
     * @returns byte length of target hash
     */
    export function getMinHashLength(fieldOrder: bigint): number;
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
    export function mapHashToField(key: Uint8Array, fieldOrder: bigint, isLE?: boolean): Uint8Array;
}
/// <amd-module name="@scom/scom-social-sdk/core/curves/abstract/curve.ts" />
declare module "@scom/scom-social-sdk/core/curves/abstract/curve.ts" {
    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    import { IField } from "@scom/scom-social-sdk/core/curves/abstract/modular.ts";
    export type AffinePoint<T> = {
        x: T;
        y: T;
    } & {
        z?: never;
        t?: never;
    };
    export interface Group<T extends Group<T>> {
        double(): T;
        negate(): T;
        add(other: T): T;
        subtract(other: T): T;
        equals(other: T): boolean;
        multiply(scalar: bigint): T;
    }
    export type GroupConstructor<T> = {
        BASE: T;
        ZERO: T;
    };
    export type Mapper<T> = (i: T[]) => T[];
    export function wNAF<T extends Group<T>>(c: GroupConstructor<T>, bits: number): {
        constTimeNegate: (condition: boolean, item: T) => T;
        unsafeLadder(elm: T, n: bigint): T;
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
        precomputeWindow(elm: T, W: number): Group<T>[];
        /**
         * Implements ec multiplication using precomputed tables and w-ary non-adjacent form.
         * @param W window size
         * @param precomputes precomputed tables
         * @param n scalar (we don't check here, but should be less than curve order)
         * @returns real and fake (for const-time) points
         */
        wNAF(W: number, precomputes: T[], n: bigint): {
            p: T;
            f: T;
        };
        wNAFCached(P: T, precomputesMap: Map<T, T[]>, n: bigint, transform: Mapper<T>): {
            p: T;
            f: T;
        };
    };
    export type BasicCurve<T> = {
        Fp: IField<T>;
        n: bigint;
        nBitLength?: number;
        nByteLength?: number;
        h: bigint;
        hEff?: bigint;
        Gx: T;
        Gy: T;
        allowInfinityPoint?: boolean;
    };
    export function validateBasic<FP, T>(curve: BasicCurve<FP> & T): Readonly<{
        readonly nBitLength: number;
        readonly nByteLength: number;
    } & BasicCurve<FP> & T & {
        p: bigint;
    }>;
}
/// <amd-module name="@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts" />
declare module "@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts" {
    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    import * as mod from "@scom/scom-social-sdk/core/curves/abstract/modular.ts";
    import * as ut from "@scom/scom-social-sdk/core/curves/abstract/utils.ts";
    import { CHash, Hex, PrivKey } from "@scom/scom-social-sdk/core/curves/abstract/utils.ts";
    import { Group, GroupConstructor, BasicCurve, AffinePoint } from "@scom/scom-social-sdk/core/curves/abstract/curve.ts";
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
    /**
     * ### Design rationale for types
     *
     * * Interaction between classes from different curves should fail:
     *   `k256.Point.BASE.add(p256.Point.BASE)`
     * * For this purpose we want to use `instanceof` operator, which is fast and works during runtime
     * * Different calls of `curve()` would return different classes -
     *   `curve(params) !== curve(params)`: if somebody decided to monkey-patch their curve,
     *   it won't affect others
     *
     * TypeScript can't infer types for classes created inside a function. Classes is one instance of nominative types in TypeScript and interfaces only check for shape, so it's hard to create unique type for every function call.
     *
     * We can use generic types via some param, like curve opts, but that would:
     *     1. Enable interaction between `curve(params)` and `curve(params)` (curves of same params)
     *     which is hard to debug.
     *     2. Params can be generic and we can't enforce them to be constant value:
     *     if somebody creates curve from non-constant params,
     *     it would be allowed to interact with other curves with non-constant params
     *
     * TODO: https://www.typescriptlang.org/docs/handbook/release-notes/typescript-2-7.html#unique-symbol
     */
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
    export const DER: {
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
    export function weierstrassPoints<T>(opts: CurvePointsType<T>): {
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
    function validateOpts(curve: CurveType): Readonly<{
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
    export function weierstrass(curveDef: CurveType): CurveFn;
    /**
     * Implementation of the Shallue and van de Woestijne method for any weierstrass curve.
     * TODO: check if there is a way to merge this with uvRatio in Edwards; move to modular.
     * b = True and y = sqrt(u / v) if (u / v) is square in F, and
     * b = False and y = sqrt(Z * (u / v)) otherwise.
     * @param Fp
     * @param Z
     * @returns
     */
    export function SWUFpSqrtRatio<T>(Fp: mod.IField<T>, Z: T): (u: T, v: T) => {
        isValid: boolean;
        value: T;
    };
    /**
     * Simplified Shallue-van de Woestijne-Ulas Method
     * https://www.rfc-editor.org/rfc/rfc9380#section-6.6.2
     */
    export function mapToCurveSimpleSWU<T>(Fp: mod.IField<T>, opts: {
        A: T;
        B: T;
        Z: T;
    }): (u: T) => {
        x: T;
        y: T;
    };
}
/// <amd-module name="@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts" />
declare module "@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts" {
    /*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
    import type { Group, GroupConstructor, AffinePoint } from "@scom/scom-social-sdk/core/curves/abstract/curve.ts";
    import { IField } from "@scom/scom-social-sdk/core/curves/abstract/modular.ts";
    import { CHash } from "@scom/scom-social-sdk/core/curves/abstract/utils.ts";
    /**
     * * `DST` is a domain separation tag, defined in section 2.2.5
     * * `p` characteristic of F, where F is a finite field of characteristic p and order q = p^m
     * * `m` is extension degree (1 for prime fields)
     * * `k` is the target security target in bits (e.g. 128), from section 5.1
     * * `expand` is `xmd` (SHA2, SHA3, BLAKE) or `xof` (SHAKE, BLAKE-XOF)
     * * `hash` conforming to `utils.CHash` interface, with `outputLen` / `blockLen` props
     */
    type UnicodeOrBytes = string | Uint8Array;
    export type Opts = {
        DST: UnicodeOrBytes;
        p: bigint;
        m: number;
        k: number;
        expand: 'xmd' | 'xof';
        hash: CHash;
    };
    export function expand_message_xmd(msg: Uint8Array, DST: Uint8Array, lenInBytes: number, H: CHash): Uint8Array;
    export function expand_message_xof(msg: Uint8Array, DST: Uint8Array, lenInBytes: number, k: number, H: CHash): Uint8Array;
    /**
     * Hashes arbitrary-length byte strings to a list of one or more elements of a finite field F
     * https://www.rfc-editor.org/rfc/rfc9380#section-5.2
     * @param msg a byte string containing the message to hash
     * @param count the number of elements of F to output
     * @param options `{DST: string, p: bigint, m: number, k: number, expand: 'xmd' | 'xof', hash: H}`, see above
     * @returns [u_0, ..., u_(count - 1)], a list of field elements.
     */
    export function hash_to_field(msg: Uint8Array, count: number, options: Opts): bigint[][];
    export function isogenyMap<T, F extends IField<T>>(field: F, map: [T[], T[], T[], T[]]): (x: T, y: T) => {
        x: T;
        y: T;
    };
    export interface H2CPoint<T> extends Group<H2CPoint<T>> {
        add(rhs: H2CPoint<T>): H2CPoint<T>;
        toAffine(iz?: bigint): AffinePoint<T>;
        clearCofactor(): H2CPoint<T>;
        assertValidity(): void;
    }
    export interface H2CPointConstructor<T> extends GroupConstructor<H2CPoint<T>> {
        fromAffine(ap: AffinePoint<T>): H2CPoint<T>;
    }
    export type MapToCurve<T> = (scalar: bigint[]) => AffinePoint<T>;
    export type htfBasicOpts = {
        DST: UnicodeOrBytes;
    };
    export function createHasher<T>(Point: H2CPointConstructor<T>, mapToCurve: MapToCurve<T>, def: Opts & {
        encodeDST?: UnicodeOrBytes;
    }): {
        hashToCurve(msg: Uint8Array, options?: htfBasicOpts): H2CPoint<T>;
        encodeToCurve(msg: Uint8Array, options?: htfBasicOpts): H2CPoint<T>;
    };
}
/// <amd-module name="@scom/scom-social-sdk/core/hashes/hmac.ts" />
declare module "@scom/scom-social-sdk/core/hashes/hmac.ts" {
    import { Hash, CHash, Input } from "@scom/scom-social-sdk/core/hashes/utils.ts";
    export class HMAC<T extends Hash<T>> extends Hash<HMAC<T>> {
        oHash: T;
        iHash: T;
        blockLen: number;
        outputLen: number;
        private finished;
        private destroyed;
        constructor(hash: CHash, _key: Input);
        update(buf: Input): this;
        digestInto(out: Uint8Array): void;
        digest(): Uint8Array;
        _cloneInto(to?: HMAC<T>): HMAC<T>;
        destroy(): void;
    }
    /**
     * HMAC: RFC2104 message authentication code.
     * @param hash - function that would be used e.g. sha256
     * @param key - message key
     * @param message - message data
     */
    export const hmac: {
        (hash: CHash, key: Input, message: Input): Uint8Array;
        create(hash: CHash, key: Input): HMAC<any>;
    };
}
/// <amd-module name="@scom/scom-social-sdk/core/curves/_shortw_utils.ts" />
declare module "@scom/scom-social-sdk/core/curves/_shortw_utils.ts" {
    import { randomBytes } from "@scom/scom-social-sdk/core/hashes/utils.ts";
    import { CurveType } from "@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts";
    import { CHash } from "@scom/scom-social-sdk/core/curves/abstract/utils.ts";
    export function getHash(hash: CHash): {
        hash: CHash;
        hmac: (key: Uint8Array, ...msgs: Uint8Array[]) => Uint8Array;
        randomBytes: typeof randomBytes;
    };
    type CurveDef = Readonly<Omit<CurveType, 'hash' | 'hmac' | 'randomBytes'>>;
    export function createCurve(curveDef: CurveDef, defHash: CHash): Readonly<{
        create: (hash: CHash) => import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").CurveFn;
        CURVE: Readonly<{
            readonly nBitLength: number;
            readonly nByteLength: number;
            readonly Fp: import("@scom/scom-social-sdk/core/curves/abstract/modular.ts").IField<bigint>;
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
            readonly isTorsionFree?: (c: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjConstructor<bigint>, point: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjPointType<bigint>) => boolean;
            readonly clearCofactor?: (c: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjConstructor<bigint>, point: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjPointType<bigint>) => import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjPointType<bigint>;
            readonly hash: CHash;
            readonly hmac: (key: Uint8Array, ...messages: Uint8Array[]) => Uint8Array;
            readonly randomBytes: (bytesLength?: number) => Uint8Array;
            lowS: boolean;
            readonly bits2int?: (bytes: Uint8Array) => bigint;
            readonly bits2int_modN?: (bytes: Uint8Array) => bigint;
            readonly p: bigint;
        }>;
        getPublicKey: (privateKey: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").PrivKey, isCompressed?: boolean) => Uint8Array;
        getSharedSecret: (privateA: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").PrivKey, publicB: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").Hex, isCompressed?: boolean) => Uint8Array;
        sign: (msgHash: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").Hex, privKey: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").PrivKey, opts?: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").SignOpts) => import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").RecoveredSignatureType;
        verify: (signature: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").Hex | {
            r: bigint;
            s: bigint;
        }, msgHash: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").Hex, publicKey: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").Hex, opts?: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").VerOpts) => boolean;
        ProjectivePoint: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjConstructor<bigint>;
        Signature: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").SignatureConstructor;
        utils: {
            normPrivateKeyToScalar: (key: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").PrivKey) => bigint;
            isValidPrivateKey(privateKey: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").PrivKey): boolean;
            randomPrivateKey: () => Uint8Array;
            precompute: (windowSize?: number, point?: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjPointType<bigint>) => import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjPointType<bigint>;
        };
    }>;
}
/// <amd-module name="@scom/scom-social-sdk/core/curves/secp256k1.ts" />
declare module "@scom/scom-social-sdk/core/curves/secp256k1.ts" {
    import { mod } from "@scom/scom-social-sdk/core/curves/abstract/modular.ts";
    import { ProjPointType as PointType } from "@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts";
    import type { Hex, PrivKey } from "@scom/scom-social-sdk/core/curves/abstract/utils.ts";
    import { bytesToNumberBE, numberToBytesBE } from "@scom/scom-social-sdk/core/curves/abstract/utils.ts";
    export const secp256k1: Readonly<{
        create: (hash: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").CHash) => import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").CurveFn;
        CURVE: Readonly<{
            readonly nBitLength: number;
            readonly nByteLength: number;
            readonly Fp: import("@scom/scom-social-sdk/core/curves/abstract/modular.ts").IField<bigint>;
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
            readonly isTorsionFree?: (c: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjConstructor<bigint>, point: PointType<bigint>) => boolean;
            readonly clearCofactor?: (c: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjConstructor<bigint>, point: PointType<bigint>) => PointType<bigint>;
            readonly hash: import("@scom/scom-social-sdk/core/curves/abstract/utils.ts").CHash;
            readonly hmac: (key: Uint8Array, ...messages: Uint8Array[]) => Uint8Array;
            readonly randomBytes: (bytesLength?: number) => Uint8Array;
            lowS: boolean;
            readonly bits2int?: (bytes: Uint8Array) => bigint;
            readonly bits2int_modN?: (bytes: Uint8Array) => bigint;
            readonly p: bigint;
        }>;
        getPublicKey: (privateKey: PrivKey, isCompressed?: boolean) => Uint8Array;
        getSharedSecret: (privateA: PrivKey, publicB: Hex, isCompressed?: boolean) => Uint8Array;
        sign: (msgHash: Hex, privKey: PrivKey, opts?: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").SignOpts) => import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").RecoveredSignatureType;
        verify: (signature: Hex | {
            r: bigint;
            s: bigint;
        }, msgHash: Hex, publicKey: Hex, opts?: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").VerOpts) => boolean;
        ProjectivePoint: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").ProjConstructor<bigint>;
        Signature: import("@scom/scom-social-sdk/core/curves/abstract/weierstrass.ts").SignatureConstructor;
        utils: {
            normPrivateKeyToScalar: (key: PrivKey) => bigint;
            isValidPrivateKey(privateKey: PrivKey): boolean;
            randomPrivateKey: () => Uint8Array;
            precompute: (windowSize?: number, point?: PointType<bigint>) => PointType<bigint>;
        };
    }>;
    function taggedHash(tag: string, ...messages: Uint8Array[]): Uint8Array;
    /**
     * lift_x from BIP340. Convert 32-byte x coordinate to elliptic curve point.
     * @returns valid point checked for being on-curve
     */
    function lift_x(x: bigint): PointType<bigint>;
    /**
     * Schnorr public key is just `x` coordinate of Point as per BIP340.
     */
    function schnorrGetPublicKey(privateKey: Hex): Uint8Array;
    /**
     * Creates Schnorr signature as per BIP340. Verifies itself before returning anything.
     * auxRand is optional and is not the sole source of k generation: bad CSPRNG won't be dangerous.
     */
    function schnorrSign(message: Hex, privateKey: PrivKey, auxRand?: Hex): Uint8Array;
    /**
     * Verifies Schnorr signature.
     * Will swallow errors & return false except for initial type validation of arguments.
     */
    function schnorrVerify(signature: Hex, message: Hex, publicKey: Hex): boolean;
    export const schnorr: {
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
    export const hashToCurve: (msg: Uint8Array, options?: import("@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts").htfBasicOpts) => import("@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts").H2CPoint<bigint>;
    export const encodeToCurve: (msg: Uint8Array, options?: import("@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts").htfBasicOpts) => import("@scom/scom-social-sdk/core/curves/abstract/hash-to-curve.ts").H2CPoint<bigint>;
    export function schnorrGetExtPubKeyY(priv: PrivKey): Uint8Array;
}
/// <amd-module name="@scom/scom-social-sdk/core/nostr/keys.ts" />
declare module "@scom/scom-social-sdk/core/nostr/keys.ts" {
    export function generatePrivateKey(): string;
    export function getPublicKey(privateKey: string): string;
    export function getPublicKeyY(privateKey: string): string;
    export function getSharedSecret(privateKey: string, publicKey: string): string;
    export function decompressPublicKey(publicKey: string): string;
}
/// <amd-module name="@scom/scom-social-sdk/core/nostr/event.ts" />
declare module "@scom/scom-social-sdk/core/nostr/event.ts" {
    export const utf8Encoder: TextEncoder;
    /** Designates a verified event signature. */
    export const verifiedSymbol: unique symbol;
    /** @deprecated Use numbers instead. */
    export enum Kind {
        Metadata = 0,
        Text = 1,
        RecommendRelay = 2,
        Contacts = 3,
        EncryptedDirectMessage = 4,
        EventDeletion = 5,
        Repost = 6,
        Reaction = 7,
        BadgeAward = 8,
        ChannelCreation = 40,
        ChannelMetadata = 41,
        ChannelMessage = 42,
        ChannelHideMessage = 43,
        ChannelMuteUser = 44,
        Blank = 255,
        Report = 1984,
        ZapRequest = 9734,
        Zap = 9735,
        RelayList = 10002,
        ClientAuth = 22242,
        NwcRequest = 23194,
        HttpAuth = 27235,
        ProfileBadge = 30008,
        BadgeDefinition = 30009,
        Article = 30023,
        FileMetadata = 1063
    }
    export interface Event<K extends number = number> {
        kind: K;
        tags: string[][];
        content: string;
        created_at: number;
        pubkey: string;
        id: string;
        sig: string;
        [verifiedSymbol]?: boolean;
    }
    export type EventTemplate<K extends number = number> = Pick<Event<K>, 'kind' | 'tags' | 'content' | 'created_at'>;
    export type UnsignedEvent<K extends number = number> = Pick<Event<K>, 'kind' | 'tags' | 'content' | 'created_at' | 'pubkey'>;
    /** An event whose signature has been verified. */
    export interface VerifiedEvent<K extends number = number> extends Event<K> {
        [verifiedSymbol]: true;
    }
    export function getBlankEvent(): EventTemplate<Kind.Blank>;
    export function getBlankEvent<K extends number>(kind: K): EventTemplate<K>;
    export function finishEvent<K extends number = number>(t: EventTemplate<K>, privateKey: string): VerifiedEvent<K>;
    export function serializeEvent(evt: UnsignedEvent<number>): string;
    export function getEventHash(event: UnsignedEvent<number>): string;
    export function validateEvent<T>(event: T): event is T & UnsignedEvent<number>;
    /** Verify the event's signature. This function mutates the event with a `verified` symbol, making it idempotent. */
    export function verifySignature<K extends number>(event: Event<K>): event is VerifiedEvent<K>;
    /** @deprecated Use `getSignature` instead. */
    export function signEvent(event: UnsignedEvent<number>, key: string): string;
    /** Calculate the signature for an event. */
    export function getSignature(event: UnsignedEvent<number>, key: string): string;
    export function getPaymentRequestHash(paymentRequest: string): string;
}
/// <amd-module name="@scom/scom-social-sdk/core/bech32.ts" />
declare module "@scom/scom-social-sdk/core/bech32.ts" {
    /**
     * @__NO_SIDE_EFFECTS__
     */
    export function assertNumber(n: number): void;
    export interface Coder<F, T> {
        encode(from: F): T;
        decode(to: T): F;
    }
    export interface Bech32Decoded<Prefix extends string = string> {
        prefix: Prefix;
        words: number[];
    }
    export interface Bech32DecodedWithArray<Prefix extends string = string> {
        prefix: Prefix;
        words: number[];
        bytes: Uint8Array;
    }
    export const bech32: {
        encode: <Prefix extends string>(prefix: Prefix, words: number[] | Uint8Array, limit?: number | false) => `${Prefix}1${string}`;
        decode: {
            <Prefix_1 extends string>(str: `${Prefix_1}1${string}`, limit?: number | false): Bech32Decoded<Prefix_1>;
            (str: string, limit?: number | false): Bech32Decoded;
        };
        decodeToBytes: (str: string) => Bech32DecodedWithArray;
        decodeUnsafe: (str: string, limit?: number | false) => void | Bech32Decoded<string>;
        fromWords: (to: number[]) => Uint8Array;
        fromWordsUnsafe: (to: number[]) => void | Uint8Array;
        toWords: (from: Uint8Array) => number[];
    };
    export const bech32m: {
        encode: <Prefix extends string>(prefix: Prefix, words: number[] | Uint8Array, limit?: number | false) => `${Prefix}1${string}`;
        decode: {
            <Prefix_1 extends string>(str: `${Prefix_1}1${string}`, limit?: number | false): Bech32Decoded<Prefix_1>;
            (str: string, limit?: number | false): Bech32Decoded;
        };
        decodeToBytes: (str: string) => Bech32DecodedWithArray;
        decodeUnsafe: (str: string, limit?: number | false) => void | Bech32Decoded<string>;
        fromWords: (to: number[]) => Uint8Array;
        fromWordsUnsafe: (to: number[]) => void | Uint8Array;
        toWords: (from: Uint8Array) => number[];
    };
}
/// <amd-module name="@scom/scom-social-sdk/core/nostr/nip19.ts" />
declare module "@scom/scom-social-sdk/core/nostr/nip19.ts" {
    export const utf8Decoder: TextDecoder;
    export const utf8Encoder: TextEncoder;
    /**
     * Bech32 regex.
     * @see https://github.com/bitcoin/bips/blob/master/bip-0173.mediawiki#bech32
     */
    export const BECH32_REGEX: RegExp;
    export type ProfilePointer = {
        pubkey: string;
        relays?: string[];
    };
    export type EventPointer = {
        id: string;
        relays?: string[];
        author?: string;
        kind?: number;
    };
    export type AddressPointer = {
        identifier: string;
        pubkey: string;
        kind: number;
        relays?: string[];
    };
    type Prefixes = {
        nprofile: ProfilePointer;
        nrelay: string;
        nevent: EventPointer;
        naddr: AddressPointer;
        nsec: string;
        npub: string;
        note: string;
    };
    type DecodeValue<Prefix extends keyof Prefixes> = {
        type: Prefix;
        data: Prefixes[Prefix];
    };
    export type DecodeResult = {
        [P in keyof Prefixes]: DecodeValue<P>;
    }[keyof Prefixes];
    export function decode<Prefix extends keyof Prefixes>(nip19: `${Lowercase<Prefix>}1${string}`): DecodeValue<Prefix>;
    export function decode(nip19: string): DecodeResult;
    export function nsecEncode(hex: string): `nsec1${string}`;
    export function npubEncode(hex: string): `npub1${string}`;
    export function noteEncode(hex: string): `note1${string}`;
    export function nprofileEncode(profile: ProfilePointer): `nprofile1${string}`;
    export function neventEncode(event: EventPointer): `nevent1${string}`;
    export function naddrEncode(addr: AddressPointer): `naddr1${string}`;
    export function nrelayEncode(url: string): `nrelay1${string}`;
}
/// <amd-module name="@scom/scom-social-sdk/core/index.ts" />
declare module "@scom/scom-social-sdk/core/index.ts" {
    export * as Event from "@scom/scom-social-sdk/core/nostr/event.ts";
    export * as Keys from "@scom/scom-social-sdk/core/nostr/keys.ts";
    export * as Nip19 from "@scom/scom-social-sdk/core/nostr/nip19.ts";
    export * as Bech32 from "@scom/scom-social-sdk/core/bech32.ts";
    export { secp256k1, schnorr } from "@scom/scom-social-sdk/core/curves/secp256k1.ts";
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/common.ts" />
declare module "@scom/scom-social-sdk/interfaces/common.ts" {
    import { Event } from "@scom/scom-social-sdk/core/index.ts";
    export interface INostrEvent {
        id: string;
        pubkey: string;
        created_at: number;
        kind: number;
        tags: string[][];
        content: string;
        sig: string;
    }
    export interface INostrMetadataContent {
        name: string;
        display_name: string;
        displayName?: string;
        username?: string;
        website?: string;
        picture?: string;
        about?: string;
        banner?: string;
        lud16?: string;
        nip05?: string;
        eth_wallet?: string;
        telegram_account?: string;
    }
    export interface INostrMetadata {
        id: string;
        pubkey: string;
        created_at: number;
        kind: number;
        tags: string[][];
        sig: string;
        content: INostrMetadataContent;
    }
    export interface IConversationPath {
        noteIds: string[];
        authorIds: string[];
    }
    export interface IPostStats {
        replies?: number;
        reposts?: number;
        upvotes?: number;
        downvotes?: number;
        views?: number;
        satszapped?: number;
        status?: string;
    }
    export interface INoteActions {
        liked?: boolean;
        replied?: boolean;
        reposted?: boolean;
        zapped?: boolean;
        bookmarked?: boolean;
    }
    export interface INoteInfo {
        eventData: INostrEvent;
        stats?: IPostStats;
        actions?: INoteActions;
    }
    export interface IMqttClientOptions {
        username: string;
        password: string;
    }
    export interface INostrSubmitResponse {
        relay: string;
        success: boolean;
        message?: string;
    }
    export interface INostrFetchEventsResponse {
        error?: string;
        events?: INostrEvent[];
        data?: any;
        requestId?: string;
    }
    export interface INostrCommunicationManager {
        url: string;
        fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
        fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
        submitEvent(event: Event.VerifiedEvent<number>, authHeader?: string): Promise<INostrSubmitResponse>;
    }
    export interface INostrRestAPIManager extends INostrCommunicationManager {
        fetchEventsFromAPI(endpoint: string, msg: any, authHeader?: string): Promise<INostrFetchEventsResponse>;
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/community.ts" />
declare module "@scom/scom-social-sdk/interfaces/community.ts" {
    import { IConversationPath, INostrEvent, INoteInfo } from "@scom/scom-social-sdk/interfaces/common.ts";
    export enum MembershipType {
        Open = "Open",
        Protected = "Protected"
    }
    export enum ProtectedMembershipPolicyType {
        TokenExclusive = "TokenExclusive",
        Whitelist = "Whitelist"
    }
    export enum PaymentModel {
        OneTimePurchase = "OneTimePurchase",
        Subscription = "Subscription"
    }
    export enum PaymentMethod {
        EVM = "EVM",
        TON = "TON",
        Telegram = "Telegram"
    }
    export enum NftType {
        ERC721 = "ERC721",
        ERC1155 = "ERC1155"
    }
    export enum TokenType {
        ERC20 = "ERC20",
        ERC721 = "ERC721",
        ERC1155 = "ERC1155"
    }
    export enum CampaignActivityType {
        LuckySpin = "LuckySpin",
        Quest = "Quest",
        BlindBox = "BlindBox",
        Quiz = "Quiz"
    }
    export enum SubscriptionBundleType {
        NoDiscount = "NoDiscount",
        MinimumDuration = "MinimumDuration",
        ValidityPeriod = "ValidityPeriod"
    }
    export interface ISubscriptionDiscountRule {
        id: number;
        name: string;
        isDisplayAsTitle: boolean;
        bundleType: SubscriptionBundleType;
        startTime: number;
        endTime: number;
        minDuration?: number;
        discountType?: 'Percentage' | 'FixedAmount';
        discountPercentage?: number;
        fixedPrice?: number;
        discountApplication: number;
    }
    export interface IProtectedMembershipPolicy {
        policyType: ProtectedMembershipPolicyType;
        name?: string;
        isExistingNFT?: boolean;
        paymentModel?: PaymentModel;
        paymentMethod?: PaymentMethod;
        chainId?: number;
        tokenAddress?: string;
        tokenType?: TokenType;
        tokenId?: number;
        tokenAmount?: string;
        currency?: string;
        durationInDays?: number;
        memberIds?: string[];
        discountRules?: ISubscriptionDiscountRule[];
        commissionRate?: number;
        affiliates?: string[];
        recipient?: string;
    }
    export interface ICommunityScpData {
        publicKey?: string;
        encryptedKey?: string;
        gatekeeperPublicKey?: string;
        channelEventId?: string;
    }
    export interface ICommunityPostScpData {
        communityUri: string;
        encryptedKey?: string;
    }
    export enum CommunityRole {
        Creator = "creator",
        Moderator = "moderator",
        GeneralMember = "generalMember",
        None = "none"
    }
    export interface ICommunityMember {
        id?: string;
        name?: string;
        profileImageUrl?: string;
        username?: string;
        internetIdentifier?: string;
        role: CommunityRole;
    }
    export interface ICommunityBasicInfo {
        creatorId: string;
        communityId: string;
    }
    export interface ICommunityPointSystem {
        createPost: number;
        reply: number;
        like: number;
        repost: number;
    }
    interface ICommunityCollectibleAction {
        mint?: boolean;
        redeem?: boolean;
    }
    export interface ICommunityCollectible {
        name: string;
        image?: string;
        description?: string;
        link?: string;
        requiredPoints: number;
        actions?: ICommunityCollectibleAction;
    }
    export interface ICommunityPostStatusOption {
        status: string;
        isDefault?: boolean;
    }
    export interface ICommunityCampaign {
        name: string;
        bannerImgUrl?: string;
        startTime?: number;
        endTime?: number;
        activities?: Array<ILuckySpin>;
    }
    export interface IQuest {
        title: string;
        link: string;
        isCompleted?: boolean;
        point: number;
    }
    export interface ICommunityCampaignActivity {
        type?: CampaignActivityType;
    }
    export interface ILuckySpin extends ICommunityCampaignActivity {
        rewards?: ILuckySpinReward[];
        startTime?: number;
        endTime?: number;
        cost?: number;
        currency?: string;
    }
    export interface ILuckySpinReward {
        name: string;
        icon?: string;
        weight?: number;
    }
    export interface ICampaignQuest extends ICommunityCampaignActivity {
        quests?: IQuest[];
        startTime?: number;
        endTime?: number;
    }
    export interface ICommunityInfo extends ICommunityBasicInfo {
        communityUri: string;
        description?: string;
        rules?: string;
        bannerImgUrl?: string;
        avatarImgUrl?: string;
        scpData?: ICommunityScpData;
        moderatorIds?: string[];
        eventData?: INostrEvent;
        membershipType: MembershipType;
        telegramBotUsername?: string;
        memberKeyMap?: Record<string, string>;
        privateRelay?: string;
        gatekeeperNpub?: string;
        policies?: IProtectedMembershipPolicy[];
        pointSystem?: ICommunityPointSystem;
        collectibles?: ICommunityCollectible[];
        enableLeaderboard?: boolean;
        parentCommunityUri?: string;
        postStatusOptions?: ICommunityPostStatusOption[];
        campaigns?: ICommunityCampaign[];
    }
    export interface ICommunityLeaderboard {
        npub: string;
        username: string;
        displayName?: string;
        avatar?: string;
        internetIdentifier?: string;
        point: number;
    }
    export interface INewCommunityInfo {
        name: string;
        description?: string;
        bannerImgUrl?: string;
        avatarImgUrl?: string;
        moderatorIds?: string[];
        rules?: string;
        scpData?: ICommunityScpData;
        membershipType: MembershipType;
        telegramBotUsername?: string;
        privateRelay?: string;
        gatekeeperNpub?: string;
        policies?: IProtectedMembershipPolicy[];
        pointSystem?: ICommunityPointSystem;
        collectibles?: ICommunityCollectible[];
        enableLeaderboard?: boolean;
        parentCommunityUri?: string;
    }
    export interface ICommunity extends ICommunityInfo {
        members: ICommunityMember[];
        memberCount?: number;
    }
    export interface ITrendingCommunityInfo extends ICommunityInfo {
        memberCount: number;
    }
    export interface INoteCommunity {
        communityUri?: string;
        creatorId?: string;
        communityId?: string;
        photoUrl?: string;
        privateRelay?: string;
        parentCommunityUri?: string;
        isExclusive?: boolean;
        isWhitelist?: boolean;
        policies?: IProtectedMembershipPolicy[];
    }
    export interface INoteCommunityInfo {
        eventData: INostrEvent;
        communityUri?: string;
        creatorId?: string;
        communityId?: string;
    }
    export interface ICommunityStats {
        notesCount: number;
        subcommunitiesCount: number;
        membersCount: number;
        productsCount: number;
    }
    export interface ICommunityDetailMetadata {
        info: ICommunityInfo;
        stats: ICommunityStats;
    }
    export interface IDecryptPostPrivateKeyForCommunityOptions {
        event: INostrEvent;
        selfPubkey?: string;
        communityUri: string;
        communityPublicKey?: string;
        communityPrivateKey: string;
    }
    export interface INftSubscription {
        nftId: number;
        startTime: number;
        endTime: number;
    }
    export interface ICommunitySubscription {
        start: number;
        end: number;
        currency: string;
        chainId?: string;
        nftAddress?: string;
        nftId?: number;
        txHash?: string;
    }
    export interface IUpdateCommunitySubscription {
        communityCreatorId: string;
        communityId: string;
        start: number;
        end: number;
        chainId?: string;
        currency: string;
        txHash: string;
    }
    export interface INewCommunityPostInfo {
        community: ICommunityInfo;
        message: string;
        timestamp?: number;
        conversationPath?: IConversationPath;
        scpData?: ICommunityPostScpData;
        alt?: string;
    }
    export interface IRetrieveCommunityPostKeysOptions {
        communityInfo: ICommunityInfo;
        noteInfoList: INoteInfo[];
        policies?: IProtectedMembershipPolicy[];
        gatekeeperUrl?: string;
        message?: string;
        signature?: string;
        since?: number;
        until?: number;
    }
    export interface ICommunityGatekeeperInfo {
        name: string;
        npub: string;
        url: string;
    }
    export interface IRetrieveCommunityPostKeysByNoteEventsOptions {
        notes: INostrEvent[];
        pubKey: string;
        message: string;
        getSignature: (message: string) => Promise<string>;
        gatekeeperUrl?: string;
    }
    export interface IRetrieveCommunityThreadPostKeysOptions {
        communityInfo: ICommunityInfo;
        noteInfoList: INoteInfo[];
        focusedNoteId: string;
        gatekeeperUrl?: string;
        message?: string;
        signature?: string;
    }
    export interface ICheckIfUserHasAccessToCommunityOptions {
        communityInfo: ICommunityInfo;
        gatekeeperUrl: string;
        walletAddresses: string[];
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/channel.ts" />
declare module "@scom/scom-social-sdk/interfaces/channel.ts" {
    import { INostrEvent, IConversationPath } from "@scom/scom-social-sdk/interfaces/common.ts";
    import { ICommunityInfo } from "@scom/scom-social-sdk/interfaces/community.ts";
    export interface IChannelScpData {
        communityUri?: string;
        publicKey?: string;
    }
    export interface IChannelMessageScpData {
        channelId: string;
        encryptedKey?: string;
    }
    export interface INewChannelMessageInfo {
        channelId: string;
        message: string;
        conversationPath?: IConversationPath;
        scpData?: IChannelMessageScpData;
    }
    export interface IChannelInfo {
        id?: string;
        name: string;
        about?: string;
        picture?: string;
        scpData?: IChannelScpData;
        eventData?: INostrEvent;
        communityInfo?: ICommunityInfo;
    }
    export interface IAllUserRelatedChannels {
        channels: IChannelInfo[];
        channelMetadataMap: Record<string, IChannelInfo>;
        channelIdToCommunityMap: Record<string, ICommunityInfo>;
    }
    export interface IRetrieveChannelMessageKeysOptions {
        creatorId: string;
        channelId: string;
        privateKey?: string;
        gatekeeperUrl?: string;
        message?: string;
        signature?: string;
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/misc.ts" />
declare module "@scom/scom-social-sdk/interfaces/misc.ts" {
    import { IChannelInfo } from "@scom/scom-social-sdk/interfaces/channel.ts";
    import { IConversationPath, INostrEvent, INostrMetadata, INoteInfo } from "@scom/scom-social-sdk/interfaces/common.ts";
    import { INoteCommunity } from "@scom/scom-social-sdk/interfaces/community.ts";
    export interface IUserProfile {
        id: string;
        username: string;
        description: string;
        avatar: string;
        npub: string;
        pubkey: string;
        displayName?: string;
        website?: string;
        banner?: string;
        internetIdentifier: string;
        followers?: number;
        lud16?: string;
        ethWallet?: string;
        telegramAccount?: string;
        metadata?: INostrMetadata;
    }
    export interface IUserActivityStats {
        notes: number;
        replies: number;
        followers: number;
        following: number;
        relays: number;
        timeJoined: number;
    }
    export interface IAuthor {
        id: string;
        username: string;
        description: string;
        avatar: string;
        pubKey?: string;
        displayName?: string;
        internetIdentifier: string;
    }
    export interface INoteInfoExtended extends INoteInfo {
        parentAuthor?: IAuthor;
        repost?: IAuthor;
        community?: INoteCommunity;
    }
    export enum ScpStandardId {
        Community = "1",
        CommunityPost = "2",
        Channel = "3",
        ChannelMessage = "4",
        GroupKeys = "5",
        CommerceStall = "6",
        CommerceOrder = "7"
    }
    export interface IMessageContactInfo {
        id: string;
        pubKey: string;
        creatorId: string;
        username: string;
        displayName: string;
        avatar?: string;
        banner?: string;
        latestAt?: number;
        cnt?: number;
        isGroup?: boolean;
        channelInfo?: IChannelInfo;
    }
    export enum CalendarEventType {
        DateBased = "dateBased",
        TimeBased = "timeBased"
    }
    export interface ICalendarEventBasicInfo {
        id: string;
        title: string;
        description: string;
        start: number;
        end?: number;
        startTzid?: string;
        endTzid?: string;
        type: CalendarEventType;
        location?: string;
        latitude?: number;
        longitude?: number;
        city?: string;
        image?: string;
    }
    export interface ICalendarEventInfo extends ICalendarEventBasicInfo {
        naddr: string;
        eventData?: INostrEvent;
        geohash?: string;
    }
    export interface IUpdateCalendarEventInfo extends ICalendarEventBasicInfo {
        geohash?: string;
        hostIds?: string[];
    }
    export interface ICalendarEventHost {
        pubkey: string;
        userProfile?: IUserProfile;
    }
    export interface ICalendarEventAttendee {
        pubkey: string;
        userProfile?: IUserProfile;
        rsvpEventData?: INostrEvent;
    }
    export interface ICalendarEventDetailInfo extends ICalendarEventInfo {
        hosts?: ICalendarEventHost[];
        attendees?: ICalendarEventAttendee[];
        notes?: INoteInfo[];
    }
    export interface INewCalendarEventPostInfo {
        calendarEventUri: string;
        message: string;
        conversationPath?: IConversationPath;
    }
    export interface ILocationCoordinates {
        latitude: number;
        longitude: number;
    }
    export interface ILongFormContentInfo {
        id: string;
        content: string;
        markdownContent: string;
        title?: string;
        image?: string;
        summary?: string;
        createdAt?: number;
        publishedAt?: number;
        eventData?: INostrEvent;
        hashtags?: string[];
    }
    export interface IRelayConfig {
        read: boolean;
        write: boolean;
    }
    export interface IPaymentActivity {
        paymentHash: string;
        sender: string;
        recipient: string;
        amount: string;
        status: string;
        createdAt: number;
    }
    export interface IPaymentActivityV2 {
        id: string;
        sender: string;
        recipient: string;
        amount: string;
        currencyCode: string;
        networkCode?: string;
        stallId?: string;
        stallName?: string;
        orderId?: string;
        paymentMethod?: "Stripe" | "EVM";
        referenceId?: string;
        createdAt?: number;
    }
    export interface IEthWalletAccountsInfo {
        masterWalletSignature: string;
        socialWalletSignature: string;
        encryptedKey: string;
        masterWalletHash: string;
        eventData?: INostrEvent;
    }
    export interface ISendTempMessageOptions {
        receiverId: string;
        message: string;
        replyToEventId?: string;
        widgetId?: string;
    }
    export interface IFetchPaymentActivitiesOptions {
        pubkey: string;
        stallId?: string;
        since?: number;
        until?: number;
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/marketplace.ts" />
declare module "@scom/scom-social-sdk/interfaces/marketplace.ts" {
    import { INostrEvent } from "@scom/scom-social-sdk/interfaces/common.ts";
    import { IPaymentActivityV2, IUserProfile } from "@scom/scom-social-sdk/interfaces/misc.ts";
    export enum MarketplaceProductType {
        Physical = "Physical",
        Digital = "Digital",
        Course = "Course",
        Ebook = "Ebook",
        Membership = "Membership",
        Bundle = "Bundle",
        Reservation = "Reservation"
    }
    export interface IMarketplaceStallShipping {
        id: string;
        name?: string;
        cost: number;
        regions?: string[];
        amountWithOthers?: number;
    }
    export interface ICryptoPayoutOption {
        cryptoCode: string;
        networkCode: string;
        tokenAddress?: string;
        walletAddress: string;
    }
    export interface IPayoutSettings {
        cryptoOptions: ICryptoPayoutOption[];
        stripeAccountId?: string;
    }
    export interface IMarketplaceStallBasicInfo {
        merchantId: string;
        stallId: string;
    }
    export interface IMarketplaceStall {
        id: string;
        name: string;
        description?: string;
        currency: string;
        shipping?: IMarketplaceStallShipping[];
        payout?: IPayoutSettings;
        stallPublicKey?: string;
        encryptedStallSecret?: string;
        gatekeeperPubkey?: string;
    }
    export interface IMarketplaceProduct {
        id: string;
        stallId: string;
        productType: MarketplaceProductType;
        name: string;
        description?: string;
        images?: string[];
        thumbnail?: string;
        currency: string;
        price: number;
        quantity: number;
        specs?: string[][];
        shipping?: IMarketplaceStallShipping[];
        postPurchaseContent?: string;
        gatekeeperPubkey?: string;
        encryptedContentKey?: string;
        reservations?: IMarketplaceReservation[];
    }
    export interface IMarketplaceReservation {
        id: string;
        time: number;
        providerName: string;
        serviceName: string;
        duration: number;
        durationUnit: string;
        available: boolean;
    }
    export interface IMarketplaceWorkingHours {
        checked?: boolean;
        startTime?: number;
        endTime?: number;
    }
    export interface IMarketplaceService {
        id: string;
        name: string;
        duration: number;
        durationUnit: string;
        price: number;
        currency: string;
        capacity?: number;
    }
    export interface IMarketplaceReservationV0 {
        workingHours: {
            [key: string]: IMarketplaceWorkingHours;
        };
        providers: {
            id: string;
            name: string;
        }[];
        services: IMarketplaceService[];
    }
    export interface ICommunityStallInfo extends IMarketplaceStall {
        communityUri?: string;
        eventData?: INostrEvent;
    }
    export interface ICommunityProductInfo extends IMarketplaceProduct {
        communityUri?: string;
        stallUri?: string;
        eventData?: INostrEvent;
    }
    export interface IRegion {
        code: string;
        name: string;
    }
    export interface ICurrency {
        code: string;
        name: string;
    }
    export interface ICryptocurrency {
        cryptoCode: string;
        networkCode: string;
        cryptoName: string;
        networkName: string;
        chainId?: string;
        tokenAddress?: string;
        tokenDecimals?: number;
    }
    export interface IMarketplaceOrderItem {
        productId: string;
        productName?: string;
        quantity: number;
        price?: number;
    }
    export interface IMarketplaceOrder {
        id: string;
        name?: string;
        address?: string;
        message?: string;
        contact: {
            nostr: string;
            phone?: string;
            email?: string;
        };
        items: IMarketplaceOrderItem[];
        currency?: string;
        shippingId?: string;
        shippingCost?: number;
        totalAmount?: number;
    }
    export interface IRetrievedMarketplaceOrder extends IMarketplaceOrder {
        stallId?: string;
        stallName?: string;
        createdAt: number;
        orderStatus?: SellerOrderStatus;
        items: IMarketplaceOrderItem[];
        userProfile?: IUserProfile;
        paymentActivity?: IPaymentActivityV2;
    }
    export interface IRetrievedBuyerOrder extends IRetrievedMarketplaceOrder {
        status: BuyerOrderStatus;
        productDetails?: ICommunityProductInfo[];
    }
    export interface IMarketplaceOrderPaymentOption {
        type: string;
        link: string;
    }
    export interface IMarketplaceOrderPaymentRequest {
        id: string;
        message?: string;
        paymentOptions: IMarketplaceOrderPaymentOption[];
    }
    export interface IMarketplaceOrderUpdateInfo {
        id: string;
        message?: string;
        status: SellerOrderStatus;
        shippingDetails?: {
            carrier?: string;
            trackingNumber?: string;
            estimatedDeliveryDate?: number;
        };
        cancellationDetails?: {
            reason: string;
            refundedAmount?: number;
        };
    }
    export enum SellerOrderStatus {
        Pending = "pending",
        Processing = "processing",
        Shipped = "shipped",
        Delivered = "delivered",
        Canceled = "canceled"
    }
    export enum BuyerOrderStatus {
        Unpaid = "unpaid",
        Paid = "paid",
        Shipped = "shipped",
        Delivered = "delivered",
        Canceled = "canceled"
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/eventManagerRead.ts" />
declare module "@scom/scom-social-sdk/interfaces/eventManagerRead.ts" {
    import { IFetchPaymentActivitiesOptions, IPaymentActivity } from "@scom/scom-social-sdk/interfaces/misc.ts";
    import { Nip19 } from "@scom/scom-social-sdk/core/index.ts";
    import { ICommunityBasicInfo, ICommunityInfo, ICommunityMember } from "@scom/scom-social-sdk/interfaces/community.ts";
    import { IAllUserRelatedChannels } from "@scom/scom-social-sdk/interfaces/channel.ts";
    import { INostrCommunicationManager, INostrRestAPIManager, INostrEvent } from "@scom/scom-social-sdk/interfaces/common.ts";
    import { BuyerOrderStatus, SellerOrderStatus } from "@scom/scom-social-sdk/interfaces/marketplace.ts";
    export interface IFetchNotesOptions {
        authors?: string[];
        ids?: string[];
    }
    export namespace SocialEventManagerReadOptions {
        interface IFetchThreadCacheEvents {
            id: string;
            pubKey?: string;
        }
        interface IFetchTrendingCacheEvents {
            pubKey?: string;
        }
        interface IFetchProfileFeedCacheEvents {
            userPubkey: string;
            pubKey: string;
            since?: number;
            until?: number;
        }
        interface IFetchProfileRepliesCacheEvents {
            userPubkey: string;
            pubKey: string;
            since?: number;
            until?: number;
        }
        interface IFetchHomeFeedCacheEvents {
            pubKey?: string;
            since?: number;
            until?: number;
        }
        interface IFetchUserProfileCacheEvents {
            pubKeys: string[];
        }
        interface IFetchUserProfileDetailEvents {
            pubKey?: string;
            telegramAccount?: string;
        }
        interface IFetchContactListCacheEvents {
            pubKey: string;
            detailIncluded?: boolean;
        }
        interface IFetchUserRelays {
            pubKey: string;
        }
        interface IFetchFollowersCacheEvents {
            pubKey: string;
        }
        interface IFetchCommunities {
            pubkeyToCommunityIdsMap?: Record<string, string[]>;
            query?: string;
        }
        interface IFetchAllUserRelatedCommunities {
            pubKey: string;
        }
        interface IFetchAllUserRelatedCommunitiesFeed {
            pubKey: string;
            since?: number;
            until?: number;
        }
        interface IFetchUserBookmarkedCommunities {
            pubKey: string;
            excludedCommunity?: ICommunityInfo;
        }
        interface IFetchCommunity extends ICommunityBasicInfo {
        }
        interface IFetchCommunityFeed {
            communityUri: string;
            since?: number;
            until?: number;
        }
        interface IFetchCommunitiesFeed {
            communityUriArr: string[];
            since?: number;
            until?: number;
        }
        interface IFetchCommunityDetailMetadata {
            communityCreatorId: string;
            communityName: string;
        }
        interface IFetchCommunitiesGeneralMembers {
            communities: ICommunityBasicInfo[];
        }
        interface IFetchNotes {
            options: IFetchNotesOptions;
        }
        interface IFetchEventsByIds {
            ids: string[];
        }
        interface IFetchTempEvents {
            ids: string[];
        }
        interface IFetchAllUserRelatedChannels {
            pubKey: string;
        }
        interface IFetchUserBookmarkedChannelEventIds {
            pubKey: string;
        }
        interface IFetchChannelMessages {
            channelId: string;
            since?: number;
            until?: number;
        }
        interface IFetchChannelInfoMessages {
            channelId: string;
        }
        interface IFetchMessageContactsCacheEvents {
            pubKey: string;
        }
        interface IFetchDirectMessages {
            pubKey: string;
            sender: string;
            since?: number;
            until?: number;
        }
        interface IResetMessageCount {
            pubKey: string;
            sender: string;
        }
        interface IFetchGroupKeys {
            identifiers: string[];
        }
        interface IFetchUserGroupInvitations {
            groupKinds: number[];
            pubKey: string;
        }
        interface IFetchCalendarEventPosts {
            calendarEventUri: string;
        }
        interface IFetchCalendarEvents {
            start: number;
            end?: number;
            limit?: number;
            previousEventId?: string;
        }
        interface IFetchCalendarEvent {
            address: Nip19.AddressPointer;
        }
        interface IFetchCalendarEventRSVPs {
            calendarEventUri: string;
            pubkey?: string;
        }
        interface IFetchLongFormContentEvents {
            pubKey?: string;
            since?: number;
            until?: number;
        }
        interface ISearchUsers {
            query: string;
        }
        interface IFetchPaymentRequestEvent {
            paymentRequest: string;
        }
        interface IFetchPaymentReceiptEvent {
            requestEventId: string;
        }
        interface IFetchPaymentActivitiesForRecipient {
            pubkey: string;
            since?: number;
            until?: number;
        }
        interface IFetchPaymentActivitiesForSender {
            pubkey: string;
            since?: number;
            until?: number;
        }
        interface IFetchUserFollowingFeed {
            pubKey: string;
            until?: number;
        }
        interface IFetchCommunityPinnedNotesEvents extends ICommunityBasicInfo {
        }
        interface IFetchCommunityPinnedNoteIds extends ICommunityBasicInfo {
        }
        interface IFetchUserPinnedNotes {
            pubKey: string;
        }
        interface IFetchUserBookmarks {
            pubKey: string;
        }
        interface IFetchUserEthWalletAccountsInfo {
            walletHash?: string;
            pubKey?: string;
        }
        interface IFetchSubcommunites {
            communityCreatorId: string;
            communityName: string;
        }
        interface IFetchCommunityStalls extends ICommunityBasicInfo {
        }
        interface IFetchCommunityProducts extends ICommunityBasicInfo {
            stallId?: string;
        }
        interface IFetchCommunityOrders extends ICommunityBasicInfo {
            stallId?: string;
            since?: number;
            until?: number;
            status?: SellerOrderStatus;
        }
        interface IFetchBuyerOrders {
            pubkey: string;
            since?: number;
            until?: number;
            status?: BuyerOrderStatus;
        }
        interface IFetchMarketplaceOrderDetails {
            orderId: string;
        }
        interface IFetchMarketplaceProductDetails {
            stallId: string;
            productIds: string[];
        }
        interface IFetchPaymentActivities extends IFetchPaymentActivitiesOptions {
        }
        interface IFetchMarketplaceProductKey {
            sellerPubkey: string;
            productId: string;
        }
        interface IFetchProductPurchaseStatus {
            sellerPubkey: string;
            productId: string;
        }
    }
    export interface ISocialEventManagerReadResult {
        error?: string;
        events?: INostrEvent[];
        data?: any;
    }
    export interface ISocialEventManagerRead {
        nostrCommunicationManager: INostrCommunicationManager | INostrRestAPIManager;
        privateKey: string;
        fetchThreadCacheEvents(options: SocialEventManagerReadOptions.IFetchThreadCacheEvents): Promise<INostrEvent[]>;
        fetchTrendingCacheEvents(options: SocialEventManagerReadOptions.IFetchTrendingCacheEvents): Promise<INostrEvent[]>;
        fetchProfileFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileFeedCacheEvents): Promise<INostrEvent[]>;
        fetchProfileRepliesCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileRepliesCacheEvents): Promise<INostrEvent[]>;
        fetchHomeFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchHomeFeedCacheEvents): Promise<INostrEvent[]>;
        fetchUserProfileCacheEvents(options: SocialEventManagerReadOptions.IFetchUserProfileCacheEvents): Promise<INostrEvent[]>;
        fetchUserProfileDetailEvents(options: SocialEventManagerReadOptions.IFetchUserProfileDetailEvents): Promise<INostrEvent[]>;
        fetchContactListCacheEvents(options: SocialEventManagerReadOptions.IFetchContactListCacheEvents): Promise<INostrEvent[]>;
        fetchUserRelays(options: SocialEventManagerReadOptions.IFetchUserRelays): Promise<INostrEvent[]>;
        fetchFollowersCacheEvents(options: SocialEventManagerReadOptions.IFetchFollowersCacheEvents): Promise<INostrEvent[]>;
        fetchCommunities(options: SocialEventManagerReadOptions.IFetchCommunities): Promise<INostrEvent[]>;
        fetchAllUserRelatedCommunities(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunities): Promise<INostrEvent[]>;
        fetchAllUserRelatedCommunitiesFeed(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunitiesFeed): Promise<INostrEvent[]>;
        fetchUserBookmarkedCommunities(options: SocialEventManagerReadOptions.IFetchUserBookmarkedCommunities): Promise<ICommunityBasicInfo[]>;
        fetchCommunity(options: SocialEventManagerReadOptions.IFetchCommunity): Promise<INostrEvent[]>;
        fetchCommunityFeed(options: SocialEventManagerReadOptions.IFetchCommunityFeed): Promise<INostrEvent[]>;
        fetchCommunityDetailMetadata(options: SocialEventManagerReadOptions.IFetchCommunityDetailMetadata): Promise<INostrEvent[]>;
        fetchEventsByIds(options: SocialEventManagerReadOptions.IFetchEventsByIds): Promise<INostrEvent[]>;
        fetchTempEvents(options: SocialEventManagerReadOptions.IFetchTempEvents): Promise<INostrEvent[]>;
        fetchAllUserRelatedChannels(options: SocialEventManagerReadOptions.IFetchAllUserRelatedChannels): Promise<IAllUserRelatedChannels>;
        fetchUserBookmarkedChannelEventIds(options: SocialEventManagerReadOptions.IFetchUserBookmarkedChannelEventIds): Promise<string[]>;
        fetchChannelMessages(options: SocialEventManagerReadOptions.IFetchChannelMessages): Promise<INostrEvent[]>;
        fetchChannelInfoMessages(options: SocialEventManagerReadOptions.IFetchChannelInfoMessages): Promise<INostrEvent[]>;
        fetchMessageContactsCacheEvents(options: SocialEventManagerReadOptions.IFetchMessageContactsCacheEvents): Promise<INostrEvent[]>;
        fetchDirectMessages(options: SocialEventManagerReadOptions.IFetchDirectMessages): Promise<INostrEvent[]>;
        resetMessageCount(options: SocialEventManagerReadOptions.IResetMessageCount): Promise<void>;
        fetchGroupKeys(options: SocialEventManagerReadOptions.IFetchGroupKeys): Promise<INostrEvent[]>;
        fetchUserGroupInvitations(options: SocialEventManagerReadOptions.IFetchUserGroupInvitations): Promise<INostrEvent[]>;
        fetchCalendarEventPosts(options: SocialEventManagerReadOptions.IFetchCalendarEventPosts): Promise<INostrEvent[]>;
        fetchCalendarEvents(options: SocialEventManagerReadOptions.IFetchCalendarEvents): Promise<ISocialEventManagerReadResult>;
        fetchCalendarEvent(options: SocialEventManagerReadOptions.IFetchCalendarEvent): Promise<INostrEvent | null>;
        fetchCalendarEventRSVPs(options: SocialEventManagerReadOptions.IFetchCalendarEventRSVPs): Promise<INostrEvent[]>;
        fetchLongFormContentEvents(options: SocialEventManagerReadOptions.IFetchLongFormContentEvents): Promise<INostrEvent[]>;
        searchUsers(options: SocialEventManagerReadOptions.ISearchUsers): Promise<INostrEvent[]>;
        fetchPaymentRequestEvent(options: SocialEventManagerReadOptions.IFetchPaymentRequestEvent): Promise<INostrEvent>;
        fetchPaymentReceiptEvent(options: SocialEventManagerReadOptions.IFetchPaymentReceiptEvent): Promise<INostrEvent>;
        fetchPaymentActivitiesForRecipient(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForRecipient): Promise<IPaymentActivity[]>;
        fetchPaymentActivitiesForSender(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForSender): Promise<IPaymentActivity[]>;
        fetchUserFollowingFeed(options: SocialEventManagerReadOptions.IFetchUserFollowingFeed): Promise<INostrEvent[]>;
        fetchCommunityPinnedNotesEvents(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNotesEvents): Promise<INostrEvent[]>;
        fetchCommunityPinnedNoteIds(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNoteIds): Promise<string[]>;
        fetchUserPinnedNotes(options: SocialEventManagerReadOptions.IFetchUserPinnedNotes): Promise<INostrEvent>;
        fetchUserBookmarks(options: SocialEventManagerReadOptions.IFetchUserBookmarks): Promise<INostrEvent>;
        fetchTrendingCommunities(): Promise<INostrEvent[]>;
        fetchUserEthWalletAccountsInfo(options: SocialEventManagerReadOptions.IFetchUserEthWalletAccountsInfo): Promise<INostrEvent>;
        fetchSubcommunites(options: SocialEventManagerReadOptions.IFetchSubcommunites): Promise<INostrEvent[]>;
        getCommunityUriToMembersMap(communities: ICommunityInfo[]): Promise<Record<string, ICommunityMember[]>>;
        fetchCommunityStalls(options: SocialEventManagerReadOptions.IFetchCommunityStalls): Promise<INostrEvent[]>;
        fetchCommunityProducts(options: SocialEventManagerReadOptions.IFetchCommunityProducts): Promise<INostrEvent[]>;
        fetchCommunityOrders(options: SocialEventManagerReadOptions.IFetchCommunityOrders): Promise<INostrEvent[]>;
        fetchBuyerOrders(options: SocialEventManagerReadOptions.IFetchBuyerOrders): Promise<INostrEvent[]>;
        fetchMarketplaceOrderDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceOrderDetails): Promise<INostrEvent[]>;
        fetchMarketplaceProductDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceProductDetails): Promise<INostrEvent[]>;
        fetchPaymentActivities(options: SocialEventManagerReadOptions.IFetchPaymentActivities): Promise<INostrEvent[]>;
        fetchMarketplaceProductKey(options: SocialEventManagerReadOptions.IFetchMarketplaceProductKey): Promise<string>;
        fetchProductPurchaseStatus(options: SocialEventManagerReadOptions.IFetchProductPurchaseStatus): Promise<boolean>;
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/dataManager.ts" />
declare module "@scom/scom-social-sdk/interfaces/dataManager.ts" {
    import { IMqttClientOptions } from "@scom/scom-social-sdk/interfaces/common.ts";
    import { ISocialEventManagerRead } from "@scom/scom-social-sdk/interfaces/eventManagerRead.ts";
    import { IMarketplaceOrder } from "@scom/scom-social-sdk/interfaces/marketplace.ts";
    export namespace SocialDataManagerOptions {
        interface IFetchUserEthWalletAccountsInfo {
            walletHash?: string;
            pubKey?: string;
        }
        interface IPlaceMarketplaceOrder {
            merchantId: string;
            stallId: string;
            stallPublicKey: string;
            order: IMarketplaceOrder;
        }
        interface IFetchProductPostPurchaseContent {
            sellerPubkey: string;
            productId: string;
            postPurchaseContent: string;
            gatekeeperPubkey?: string;
            encryptedContentKey?: string;
        }
        interface IFetchProductPurchaseStatus {
            sellerPubkey: string;
            productId: string;
        }
        interface IFetchCommunityProducts {
            creatorId: string;
            communityId: string;
            stallId?: string;
            decryptPostPurchaseContent?: boolean;
        }
        interface IFetchMarketplaceProductDetails {
            stallId: string;
            productIds: string[];
            decryptPostPurchaseContent?: boolean;
        }
    }
    export interface ISocialDataManagerConfig {
        version?: 1 | 1.5 | 2;
        writeRelays?: string[];
        readRelay?: string;
        readManager?: ISocialEventManagerRead;
        publicIndexingRelay?: string;
        apiBaseUrl?: string;
        ipLocationServiceBaseUrl?: string;
        ipLocationServiceApiKey?: string;
        mqttBrokerUrl?: string;
        mqttClientOptions?: IMqttClientOptions;
        mqttSubscriptions?: string[];
        mqttMessageCallback?: (topic: string, message: string) => void;
        enableLightningWallet?: boolean;
    }
    export interface ICheckRelayStatusResult {
        success: boolean;
        error?: string;
        npub?: string;
        userProfileExists?: boolean;
        isPrivate?: boolean;
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/eventManagerWrite.ts" />
declare module "@scom/scom-social-sdk/interfaces/eventManagerWrite.ts" {
    import { IUpdateCalendarEventInfo, INewCalendarEventPostInfo, ILongFormContentInfo, IRelayConfig, IPaymentActivityV2 } from "@scom/scom-social-sdk/interfaces/misc.ts";
    import { IMarketplaceOrder, IMarketplaceOrderPaymentRequest, IMarketplaceOrderUpdateInfo, IMarketplaceProduct, IMarketplaceStall } from "@scom/scom-social-sdk/interfaces/marketplace.ts";
    import { ICommunityBasicInfo, ICommunityInfo, INewCommunityPostInfo } from "@scom/scom-social-sdk/interfaces/community.ts";
    import { IChannelInfo, INewChannelMessageInfo } from "@scom/scom-social-sdk/interfaces/channel.ts";
    import { INostrMetadataContent, INostrCommunicationManager, IConversationPath, INostrEvent, INostrSubmitResponse } from "@scom/scom-social-sdk/interfaces/common.ts";
    export namespace SocialEventManagerWriteOptions {
        interface IUpdateUserEthWalletAccountsInfo {
            masterWalletSignature: string;
            socialWalletSignature: string;
            encryptedKey: string;
            masterWalletHash: string;
        }
        interface ISendMessage {
            receiver: string;
            encryptedMessage: string;
            replyToEventId?: string;
        }
        interface ISendTempMessage extends ISendMessage {
            widgetId?: string;
        }
        interface IPlaceMarketplaceOrder {
            merchantId: string;
            stallId: string;
            stallPublicKey: string;
            order: IMarketplaceOrder;
            replyToEventId?: string;
        }
        interface IRequestMarketplaceOrderPayment {
            customerId: string;
            merchantId: string;
            stallId: string;
            paymentRequest: IMarketplaceOrderPaymentRequest;
            replyToEventId?: string;
        }
        interface IUpdatetMarketplaceOrderStatus {
            customerId: string;
            merchantId: string;
            stallId: string;
            updateInfo: IMarketplaceOrderUpdateInfo;
            replyToEventId?: string;
        }
        interface IRecordPaymentActivity extends IPaymentActivityV2 {
            replyToEventId?: string;
        }
    }
    export interface ISocialEventManagerWriteResult {
        relayResponse: INostrSubmitResponse;
        event: INostrEvent;
    }
    export interface ISocialEventManagerWrite {
        nostrCommunicationManagers: INostrCommunicationManager[];
        privateKey: string;
        updateContactList(content: string, contactPubKeys: string[]): Promise<ISocialEventManagerWriteResult>;
        postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<ISocialEventManagerWriteResult>;
        deleteEvents(eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
        updateCommunity(info: ICommunityInfo): Promise<ISocialEventManagerWriteResult>;
        updateChannel(info: IChannelInfo): Promise<ISocialEventManagerWriteResult>;
        updateUserBookmarkedChannels(channelEventIds: string[]): Promise<ISocialEventManagerWriteResult>;
        submitChannelMessage(info: INewChannelMessageInfo): Promise<ISocialEventManagerWriteResult>;
        updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<ISocialEventManagerWriteResult>;
        submitCommunityPost(info: INewCommunityPostInfo): Promise<ISocialEventManagerWriteResult>;
        updateUserProfile(content: INostrMetadataContent): Promise<ISocialEventManagerWriteResult>;
        sendMessage(options: SocialEventManagerWriteOptions.ISendMessage): Promise<ISocialEventManagerWriteResult>;
        sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage): Promise<ISocialEventManagerWriteResult>;
        updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<ISocialEventManagerWriteResult>;
        updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<ISocialEventManagerWriteResult>;
        createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<ISocialEventManagerWriteResult>;
        submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<ISocialEventManagerWriteResult>;
        submitLongFormContentEvents(info: ILongFormContentInfo): Promise<ISocialEventManagerWriteResult>;
        submitLike(tags: string[][]): Promise<ISocialEventManagerWriteResult>;
        submitRepost(content: string, tags: string[][]): Promise<ISocialEventManagerWriteResult>;
        updateRelayList(relays: Record<string, IRelayConfig>): Promise<ISocialEventManagerWriteResult>;
        createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<ISocialEventManagerWriteResult>;
        createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<ISocialEventManagerWriteResult>;
        updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
        updateUserPinnedNotes(eventIds: string[]): Promise<ISocialEventManagerWriteResult>;
        updateUserBookmarks(tags: string[][]): Promise<ISocialEventManagerWriteResult>;
        updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<ISocialEventManagerWriteResult>;
        updateNoteStatus(noteId: string, status: string): Promise<ISocialEventManagerWriteResult>;
        updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<ISocialEventManagerWriteResult>;
        updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<ISocialEventManagerWriteResult>;
        placeMarketplaceOrder(options: SocialEventManagerWriteOptions.IPlaceMarketplaceOrder): Promise<ISocialEventManagerWriteResult>;
        requestMarketplaceOrderPayment(options: SocialEventManagerWriteOptions.IRequestMarketplaceOrderPayment): Promise<ISocialEventManagerWriteResult>;
        updateMarketplaceOrderStatus(options: SocialEventManagerWriteOptions.IUpdatetMarketplaceOrderStatus): Promise<ISocialEventManagerWriteResult>;
        recordPaymentActivity(options: SocialEventManagerWriteOptions.IRecordPaymentActivity): Promise<ISocialEventManagerWriteResult>;
    }
}
/// <amd-module name="@scom/scom-social-sdk/interfaces/index.ts" />
declare module "@scom/scom-social-sdk/interfaces/index.ts" {
    export * from "@scom/scom-social-sdk/interfaces/common.ts";
    export * from "@scom/scom-social-sdk/interfaces/community.ts";
    export * from "@scom/scom-social-sdk/interfaces/channel.ts";
    export * from "@scom/scom-social-sdk/interfaces/marketplace.ts";
    export * from "@scom/scom-social-sdk/interfaces/misc.ts";
    export * from "@scom/scom-social-sdk/interfaces/dataManager.ts";
    export * from "@scom/scom-social-sdk/interfaces/eventManagerRead.ts";
    export * from "@scom/scom-social-sdk/interfaces/eventManagerWrite.ts";
}
/// <amd-module name="@scom/scom-social-sdk/utils/geohash.ts" />
declare module "@scom/scom-social-sdk/utils/geohash.ts" {
    const Geohash: {
        ENCODE_AUTO: string;
        encode: (latitude: number | string, longitude: number | string, numberOfChars?: number | 'auto') => string;
        encode_uint64: (latitude: number, longitude: number, bitDepth?: number) => number;
        encode_int: (latitude: number, longitude: number, bitDepth?: number) => number;
        decode: (hashString: string) => {
            latitude: number;
            longitude: number;
            error: {
                latitude: number;
                longitude: number;
            };
        };
        decode_int: (hashInt: number, bitDepth?: number) => {
            latitude: number;
            longitude: number;
            error: {
                latitude: number;
                longitude: number;
            };
        };
        decode_uint64: (hashInt: number, bitDepth?: number) => {
            latitude: number;
            longitude: number;
            error: {
                latitude: number;
                longitude: number;
            };
        };
        decode_bbox: (hashString: string) => number[];
        decode_bbox_uint64: (hashInt: number, bitDepth?: number) => number[];
        decode_bbox_int: (hashInt: number, bitDepth?: number) => number[];
        neighbor: (hashString: string, direction: [number, number]) => string;
        neighbor_int: (hashInt: number, direction: [number, number], bitDepth?: number) => number;
        neighbors: (hashString: string) => string[];
        neighbors_int: (hashInt: number, bitDepth?: number) => number[];
        bboxes: (minLat: number, minLon: number, maxLat: number, maxLon: number, numberOfChars: number) => string[];
        bboxes_int: (minLat: number, minLon: number, maxLat: number, maxLon: number, bitDepth: number) => any[];
    };
    export default Geohash;
}
/// <amd-module name="@scom/scom-social-sdk/managers/utilsManager.ts" />
declare module "@scom/scom-social-sdk/managers/utilsManager.ts" {
    import { ICalendarEventInfo, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, ICommunityProductInfo, ICommunityStallInfo, IMarketplaceStallBasicInfo, INostrEvent, INostrMetadata, IPaymentActivityV2, IRetrievedMarketplaceOrder, IUserProfile } from "@scom/scom-social-sdk/interfaces/index.ts";
    class SocialUtilsManager {
        static hexStringToUint8Array(hexString: string): Uint8Array;
        static base64ToUtf8(base64: string): string;
        static utf8ToBase64(utf8: string): string;
        static convertPrivateKeyToPubkey(privateKey: string): string;
        static encryptMessage(ourPrivateKey: string, theirPublicKey: string, text: string): Promise<string>;
        static decryptMessage(ourPrivateKey: string, theirPublicKey: string, encryptedData: string): Promise<string>;
        static encryptMessageWithGeneratedKey(privateKey: string, theirPublicKey: string, message: string): Promise<{
            encryptedMessage: string;
            encryptedMessageKey: string;
        }>;
        private static pad;
        static getGMTOffset(timezone: string): string;
        static exponentialBackoffRetry<T>(fn: () => Promise<T>, // Function to retry
        retries: number, // Maximum number of retries
        delay: number, // Initial delay duration in milliseconds
        maxDelay: number, // Maximum delay duration in milliseconds
        factor: number, // Exponential backoff factor
        stopCondition?: (data: T) => boolean): Promise<T>;
        static getCommunityUri(creatorId: string, communityId: string): string;
        static getMarketplaceStallUri(merchantId: string, stallId: string): string;
        static getCommunityBasicInfoFromUri(communityUri: string): ICommunityBasicInfo;
        static getMarketplaceStallBasicInfoFromUri(stallUri: string): IMarketplaceStallBasicInfo;
        static extractCommunityInfo(event: INostrEvent): ICommunityInfo;
        static extractCommunityStallInfo(event: INostrEvent): ICommunityStallInfo;
        static extractCommunityProductInfo(event: INostrEvent): ICommunityProductInfo;
        static extractBookmarkedCommunities(event: INostrEvent, excludedCommunity?: ICommunityInfo): ICommunityBasicInfo[];
        static extractBookmarkedChannels(event: INostrEvent): string[];
        static extractScpData(event: INostrEvent, standardId: string): any;
        static parseContent(content: string): any;
        static extractChannelInfo(event: INostrEvent): IChannelInfo;
        static constructAuthHeader(privateKey: string): string;
        static constructUserProfile(metadata: INostrMetadata, followersCountMap?: Record<string, number>): IUserProfile;
        static extractCalendarEventInfo(event: INostrEvent): ICalendarEventInfo;
        static extractMarketplaceOrder(privateKey: string, event: INostrEvent, stallInfo: ICommunityStallInfo): Promise<IRetrievedMarketplaceOrder>;
        static extractPaymentActivity(privateKey: string, event: INostrEvent): Promise<IPaymentActivityV2>;
        static flatMap<T, U>(array: T[], callback: (item: T) => U[]): U[];
        static getPollResult(readRelay: string, requestId: string, authHeader?: string): Promise<any>;
    }
    export { SocialUtilsManager };
}
/// <amd-module name="@scom/scom-social-sdk/managers/communication.ts" />
declare module "@scom/scom-social-sdk/managers/communication.ts" {
    import { Event } from "@scom/scom-social-sdk/core/index.ts";
    import { INostrFetchEventsResponse, INostrSubmitResponse, INostrCommunicationManager, INostrRestAPIManager } from "@scom/scom-social-sdk/interfaces/index.ts";
    class EventRetrievalCacheManager {
        private cache;
        constructor();
        protected generateCacheKey(endpoint: string, msg: any): string;
        protected fetchWithCache(cacheKey: string, fetchFunction: () => Promise<INostrFetchEventsResponse>, cacheDuration?: number): Promise<INostrFetchEventsResponse>;
    }
    class NostrRestAPIManager extends EventRetrievalCacheManager implements INostrRestAPIManager {
        protected _url: string;
        protected requestCallbackMap: Record<string, (response: any) => void>;
        constructor(url: string);
        get url(): string;
        set url(url: string);
        fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
        fetchEventsFromAPI(endpoint: string, msg: any, authHeader?: string): Promise<INostrFetchEventsResponse>;
        fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
        submitEvent(event: any, authHeader?: string): Promise<any>;
    }
    class NostrWebSocketManager implements INostrCommunicationManager {
        protected _url: string;
        protected ws: any;
        protected requestCallbackMap: Record<string, (message: any) => void>;
        protected messageListenerBound: any;
        constructor(url: any);
        get url(): string;
        set url(url: string);
        generateRandomNumber(): string;
        messageListener(event: any): void;
        establishConnection(requestId: string, cb: (message: any) => void): Promise<{
            ws: any;
            error: any;
        }>;
        fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
        fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
        submitEvent(event: Event.VerifiedEvent<number>): Promise<INostrSubmitResponse>;
    }
    export { INostrCommunicationManager, EventRetrievalCacheManager, INostrRestAPIManager, NostrRestAPIManager, NostrWebSocketManager };
}
/// <amd-module name="@scom/scom-social-sdk/managers/eventManagerWrite.ts" />
declare module "@scom/scom-social-sdk/managers/eventManagerWrite.ts" {
    import { Event } from "@scom/scom-social-sdk/core/index.ts";
    import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, ILongFormContentInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityPostInfo, INostrMetadataContent, INostrRestAPIManager, IRelayConfig, ISocialEventManagerWrite, IMarketplaceStall, IUpdateCalendarEventInfo, SocialEventManagerWriteOptions, IMarketplaceProduct } from "@scom/scom-social-sdk/interfaces/index.ts";
    import { INostrCommunicationManager } from "@scom/scom-social-sdk/managers/communication.ts";
    class NostrEventManagerWrite implements ISocialEventManagerWrite {
        protected _nostrCommunicationManagers: INostrCommunicationManager[];
        protected _privateKey: string;
        protected _mainNostrRestAPIManager: INostrRestAPIManager;
        constructor(managers: INostrCommunicationManager[], mainRelay: string);
        set nostrCommunicationManagers(managers: INostrCommunicationManager[]);
        set privateKey(privateKey: string);
        protected calculateConversationPathTags(conversationPath: IConversationPath): string[][];
        private handleEventSubmission;
        updateContactList(content: string, contactPubKeys: string[]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        postNote(content: string, conversationPath?: IConversationPath, createdAt?: number): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        deleteEvents(eventIds: string[]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateChannel(info: IChannelInfo): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateUserBookmarkedChannels(channelEventIds: string[]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateCommunity(info: ICommunityInfo): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        submitCommunityPost(info: INewCommunityPostInfo): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        submitChannelMessage(info: INewChannelMessageInfo): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateUserProfile(content: INostrMetadataContent): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        sendMessage(options: SocialEventManagerWriteOptions.ISendMessage): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        sendTempMessage(options: SocialEventManagerWriteOptions.ISendTempMessage): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        submitLongFormContentEvents(info: ILongFormContentInfo): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        submitLike(tags: string[][]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        submitRepost(content: string, tags: string[][]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateRelayList(relays: Record<string, IRelayConfig>): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateCommunityPinnedNotes(creatorId: string, communityId: string, eventIds: string[]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateUserPinnedNotes(eventIds: string[]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateUserBookmarks(tags: string[][]): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateUserEthWalletAccountsInfo(options: SocialEventManagerWriteOptions.IUpdateUserEthWalletAccountsInfo, privateKey?: string): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateNoteStatus(noteId: string, status: string): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        placeMarketplaceOrder(options: SocialEventManagerWriteOptions.IPlaceMarketplaceOrder): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        requestMarketplaceOrderPayment(options: SocialEventManagerWriteOptions.IRequestMarketplaceOrderPayment): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        updateMarketplaceOrderStatus(options: SocialEventManagerWriteOptions.IUpdatetMarketplaceOrderStatus): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
        recordPaymentActivity(options: SocialEventManagerWriteOptions.IRecordPaymentActivity): Promise<{
            event: Event.VerifiedEvent<number>;
            relayResponse: import("@scom/scom-social-sdk/interfaces/common.ts").INostrSubmitResponse;
        }>;
    }
    export { NostrEventManagerWrite };
}
/// <amd-module name="@scom/scom-social-sdk/managers/eventManagerRead.ts" />
declare module "@scom/scom-social-sdk/managers/eventManagerRead.ts" {
    import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, ICommunityMember, INostrEvent, IPaymentActivity, ISocialEventManagerRead, SocialEventManagerReadOptions } from "@scom/scom-social-sdk/interfaces/index.ts";
    import { INostrCommunicationManager } from "@scom/scom-social-sdk/managers/communication.ts";
    class NostrEventManagerRead implements ISocialEventManagerRead {
        protected _nostrCommunicationManager: INostrCommunicationManager;
        protected _privateKey: string;
        constructor(manager: INostrCommunicationManager);
        set nostrCommunicationManager(manager: INostrCommunicationManager);
        set privateKey(privateKey: string);
        fetchThreadCacheEvents(options: SocialEventManagerReadOptions.IFetchThreadCacheEvents): Promise<INostrEvent[]>;
        fetchTrendingCacheEvents(options: SocialEventManagerReadOptions.IFetchTrendingCacheEvents): Promise<INostrEvent[]>;
        fetchProfileFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileFeedCacheEvents): Promise<INostrEvent[]>;
        fetchProfileRepliesCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileRepliesCacheEvents): Promise<INostrEvent[]>;
        fetchHomeFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchHomeFeedCacheEvents): Promise<INostrEvent[]>;
        fetchUserProfileCacheEvents(options: SocialEventManagerReadOptions.IFetchUserProfileCacheEvents): Promise<INostrEvent[]>;
        fetchUserProfileDetailEvents(options: SocialEventManagerReadOptions.IFetchUserProfileDetailEvents): Promise<INostrEvent[]>;
        fetchContactListCacheEvents(options: SocialEventManagerReadOptions.IFetchContactListCacheEvents): Promise<INostrEvent[]>;
        fetchUserRelays(options: SocialEventManagerReadOptions.IFetchUserRelays): Promise<INostrEvent[]>;
        fetchFollowersCacheEvents(options: SocialEventManagerReadOptions.IFetchFollowersCacheEvents): Promise<INostrEvent[]>;
        fetchCommunities(options: SocialEventManagerReadOptions.IFetchCommunities): Promise<any>;
        fetchAllUserRelatedCommunities(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunities): Promise<INostrEvent[]>;
        fetchAllUserRelatedCommunitiesFeed(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunitiesFeed): Promise<INostrEvent[]>;
        fetchUserBookmarkedCommunities(options: SocialEventManagerReadOptions.IFetchUserBookmarkedCommunities): Promise<ICommunityBasicInfo[]>;
        fetchCommunity(options: SocialEventManagerReadOptions.IFetchCommunity): Promise<INostrEvent[]>;
        fetchCommunityFeed(options: SocialEventManagerReadOptions.IFetchCommunityFeed): Promise<INostrEvent[]>;
        private fetchCommunitiesFeed;
        private fetchCommunitiesGeneralMembers;
        fetchAllUserRelatedChannels(options: SocialEventManagerReadOptions.IFetchAllUserRelatedChannels): Promise<{
            channels: IChannelInfo[];
            channelMetadataMap: Record<string, IChannelInfo>;
            channelIdToCommunityMap: Record<string, ICommunityInfo>;
        }>;
        fetchUserBookmarkedChannelEventIds(options: SocialEventManagerReadOptions.IFetchUserBookmarkedChannelEventIds): Promise<string[]>;
        fetchEventsByIds(options: SocialEventManagerReadOptions.IFetchEventsByIds): Promise<INostrEvent[]>;
        fetchTempEvents(options: SocialEventManagerReadOptions.IFetchTempEvents): Promise<any[]>;
        fetchChannelMessages(options: SocialEventManagerReadOptions.IFetchChannelMessages): Promise<INostrEvent[]>;
        fetchChannelInfoMessages(options: SocialEventManagerReadOptions.IFetchChannelInfoMessages): Promise<INostrEvent[]>;
        fetchMessageContactsCacheEvents(options: SocialEventManagerReadOptions.IFetchMessageContactsCacheEvents): Promise<INostrEvent[]>;
        fetchDirectMessages(options: SocialEventManagerReadOptions.IFetchDirectMessages): Promise<INostrEvent[]>;
        resetMessageCount(options: SocialEventManagerReadOptions.IResetMessageCount): Promise<void>;
        fetchGroupKeys(options: SocialEventManagerReadOptions.IFetchGroupKeys): Promise<INostrEvent[]>;
        fetchUserGroupInvitations(options: SocialEventManagerReadOptions.IFetchUserGroupInvitations): Promise<INostrEvent[]>;
        fetchCalendarEvents(options: SocialEventManagerReadOptions.IFetchCalendarEvents): Promise<{
            events: INostrEvent[];
            data: any;
        }>;
        fetchCalendarEvent(options: SocialEventManagerReadOptions.IFetchCalendarEvent): Promise<INostrEvent>;
        fetchCalendarEventPosts(options: SocialEventManagerReadOptions.IFetchCalendarEventPosts): Promise<INostrEvent[]>;
        fetchCalendarEventRSVPs(options: SocialEventManagerReadOptions.IFetchCalendarEventRSVPs): Promise<INostrEvent[]>;
        fetchLongFormContentEvents(options: SocialEventManagerReadOptions.IFetchLongFormContentEvents): Promise<INostrEvent[]>;
        searchUsers(options: SocialEventManagerReadOptions.ISearchUsers): Promise<INostrEvent[]>;
        fetchPaymentRequestEvent(options: SocialEventManagerReadOptions.IFetchPaymentRequestEvent): Promise<INostrEvent>;
        fetchPaymentReceiptEvent(options: SocialEventManagerReadOptions.IFetchPaymentReceiptEvent): Promise<INostrEvent>;
        private getPaymentHash;
        fetchPaymentActivitiesForRecipient(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForRecipient): Promise<IPaymentActivity[]>;
        fetchPaymentActivitiesForSender(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForSender): Promise<IPaymentActivity[]>;
        fetchUserFollowingFeed(options: SocialEventManagerReadOptions.IFetchUserFollowingFeed): Promise<INostrEvent[]>;
        fetchCommunityPinnedNotesEvents(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNotesEvents): Promise<INostrEvent[]>;
        fetchCommunityPinnedNoteIds(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNoteIds): Promise<string[]>;
        fetchUserPinnedNotes(options: SocialEventManagerReadOptions.IFetchUserPinnedNotes): Promise<INostrEvent>;
        fetchUserBookmarks(options: SocialEventManagerReadOptions.IFetchUserBookmarks): Promise<INostrEvent>;
        fetchTrendingCommunities(): Promise<any>;
        fetchUserEthWalletAccountsInfo(options: SocialEventManagerReadOptions.IFetchUserEthWalletAccountsInfo): Promise<INostrEvent>;
        fetchSubcommunites(options: SocialEventManagerReadOptions.IFetchSubcommunites): Promise<any[]>;
        fetchCommunityDetailMetadata(options: SocialEventManagerReadOptions.IFetchCommunityDetailMetadata): Promise<INostrEvent[]>;
        getCommunityUriToMembersMap(communities: ICommunityInfo[]): Promise<Record<string, ICommunityMember[]>>;
        fetchCommunityStalls(options: SocialEventManagerReadOptions.IFetchCommunityStalls): Promise<INostrEvent[]>;
        fetchCommunityProducts(options: SocialEventManagerReadOptions.IFetchCommunityProducts): Promise<INostrEvent[]>;
        fetchCommunityOrders(options: SocialEventManagerReadOptions.IFetchCommunityOrders): Promise<any[]>;
        fetchBuyerOrders(options: SocialEventManagerReadOptions.IFetchBuyerOrders): Promise<any[]>;
        fetchMarketplaceOrderDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceOrderDetails): Promise<any[]>;
        fetchMarketplaceProductDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceProductDetails): Promise<any[]>;
        fetchPaymentActivities(options: SocialEventManagerReadOptions.IFetchPaymentActivities): Promise<any[]>;
        fetchMarketplaceProductKey(options: SocialEventManagerReadOptions.IFetchMarketplaceProductKey): Promise<any>;
        fetchProductPurchaseStatus(options: SocialEventManagerReadOptions.IFetchProductPurchaseStatus): Promise<any>;
    }
    export { NostrEventManagerRead };
}
/// <amd-module name="@scom/scom-social-sdk/managers/eventManagerReadV1o5.ts" />
declare module "@scom/scom-social-sdk/managers/eventManagerReadV1o5.ts" {
    import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, ICommunityMember, IPaymentActivity, ISocialEventManagerRead, SocialEventManagerReadOptions } from "@scom/scom-social-sdk/interfaces/index.ts";
    import { INostrRestAPIManager } from "@scom/scom-social-sdk/managers/communication.ts";
    class NostrEventManagerReadV1o5 implements ISocialEventManagerRead {
        protected _nostrCommunicationManager: INostrRestAPIManager;
        protected _privateKey: string;
        constructor(manager: INostrRestAPIManager);
        set nostrCommunicationManager(manager: INostrRestAPIManager);
        set privateKey(privateKey: string);
        fetchEventsFromAPIWithAuth(endpoint: string, msg: any): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrFetchEventsResponse>;
        fetchThreadCacheEvents(options: SocialEventManagerReadOptions.IFetchThreadCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchTrendingCacheEvents(options: SocialEventManagerReadOptions.IFetchTrendingCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchProfileFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileFeedCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchProfileRepliesCacheEvents(options: SocialEventManagerReadOptions.IFetchProfileRepliesCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchHomeFeedCacheEvents(options: SocialEventManagerReadOptions.IFetchHomeFeedCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchUserProfileCacheEvents(options: SocialEventManagerReadOptions.IFetchUserProfileCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchUserProfileDetailEvents(options: SocialEventManagerReadOptions.IFetchUserProfileDetailEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchContactListCacheEvents(options: SocialEventManagerReadOptions.IFetchContactListCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchUserRelays(options: SocialEventManagerReadOptions.IFetchUserRelays): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchFollowersCacheEvents(options: SocialEventManagerReadOptions.IFetchFollowersCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCommunities(options: SocialEventManagerReadOptions.IFetchCommunities): Promise<any>;
        fetchAllUserRelatedCommunities(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunities): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchAllUserRelatedCommunitiesFeed(options: SocialEventManagerReadOptions.IFetchAllUserRelatedCommunitiesFeed): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchUserBookmarkedCommunities(options: SocialEventManagerReadOptions.IFetchUserBookmarkedCommunities): Promise<ICommunityBasicInfo[]>;
        fetchCommunity(options: SocialEventManagerReadOptions.IFetchCommunity): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCommunityFeed(options: SocialEventManagerReadOptions.IFetchCommunityFeed): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchAllUserRelatedChannels(options: SocialEventManagerReadOptions.IFetchAllUserRelatedChannels): Promise<{
            channels: IChannelInfo[];
            channelMetadataMap: Record<string, IChannelInfo>;
            channelIdToCommunityMap: Record<string, ICommunityInfo>;
        }>;
        fetchUserBookmarkedChannelEventIds(options: SocialEventManagerReadOptions.IFetchUserBookmarkedChannelEventIds): Promise<any>;
        fetchEventsByIds(options: SocialEventManagerReadOptions.IFetchEventsByIds): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchTempEvents(options: SocialEventManagerReadOptions.IFetchTempEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchChannelMessages(options: SocialEventManagerReadOptions.IFetchChannelMessages): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchChannelInfoMessages(options: SocialEventManagerReadOptions.IFetchChannelInfoMessages): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchMessageContactsCacheEvents(options: SocialEventManagerReadOptions.IFetchMessageContactsCacheEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchDirectMessages(options: SocialEventManagerReadOptions.IFetchDirectMessages): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        resetMessageCount(options: SocialEventManagerReadOptions.IResetMessageCount): Promise<void>;
        fetchGroupKeys(options: SocialEventManagerReadOptions.IFetchGroupKeys): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchUserGroupInvitations(options: SocialEventManagerReadOptions.IFetchUserGroupInvitations): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCalendarEvents(options: SocialEventManagerReadOptions.IFetchCalendarEvents): Promise<{
            events: import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[];
            data: any;
        }>;
        fetchCalendarEvent(options: SocialEventManagerReadOptions.IFetchCalendarEvent): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent>;
        fetchCalendarEventPosts(options: SocialEventManagerReadOptions.IFetchCalendarEventPosts): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCalendarEventRSVPs(options: SocialEventManagerReadOptions.IFetchCalendarEventRSVPs): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchLongFormContentEvents(options: SocialEventManagerReadOptions.IFetchLongFormContentEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        searchUsers(options: SocialEventManagerReadOptions.ISearchUsers): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchPaymentRequestEvent(options: SocialEventManagerReadOptions.IFetchPaymentRequestEvent): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent>;
        fetchPaymentReceiptEvent(options: SocialEventManagerReadOptions.IFetchPaymentReceiptEvent): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent>;
        private getPaymentHash;
        fetchPaymentActivitiesForRecipient(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForRecipient): Promise<IPaymentActivity[]>;
        fetchPaymentActivitiesForSender(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForSender): Promise<IPaymentActivity[]>;
        fetchUserFollowingFeed(options: SocialEventManagerReadOptions.IFetchUserFollowingFeed): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCommunityPinnedNotesEvents(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNotesEvents): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCommunityPinnedNoteIds(options: SocialEventManagerReadOptions.IFetchCommunityPinnedNoteIds): Promise<any>;
        fetchUserPinnedNotes(options: SocialEventManagerReadOptions.IFetchUserPinnedNotes): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent>;
        fetchUserBookmarks(options: SocialEventManagerReadOptions.IFetchUserBookmarks): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent>;
        fetchTrendingCommunities(): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchUserEthWalletAccountsInfo(options: SocialEventManagerReadOptions.IFetchUserEthWalletAccountsInfo): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent>;
        fetchSubcommunites(options: SocialEventManagerReadOptions.IFetchSubcommunites): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCommunityDetailMetadata(options: SocialEventManagerReadOptions.IFetchCommunityDetailMetadata): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        getCommunityUriToMembersMap(communities: ICommunityInfo[]): Promise<Record<string, ICommunityMember[]>>;
        fetchCommunityStalls(options: SocialEventManagerReadOptions.IFetchCommunityStalls): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCommunityProducts(options: SocialEventManagerReadOptions.IFetchCommunityProducts): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchCommunityOrders(options: SocialEventManagerReadOptions.IFetchCommunityOrders): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchBuyerOrders(options: SocialEventManagerReadOptions.IFetchBuyerOrders): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchMarketplaceOrderDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceOrderDetails): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchMarketplaceProductDetails(options: SocialEventManagerReadOptions.IFetchMarketplaceProductDetails): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchPaymentActivities(options: SocialEventManagerReadOptions.IFetchPaymentActivities): Promise<import("@scom/scom-social-sdk/interfaces/common.ts").INostrEvent[]>;
        fetchMarketplaceProductKey(options: SocialEventManagerReadOptions.IFetchMarketplaceProductKey): Promise<any>;
        fetchProductPurchaseStatus(options: SocialEventManagerReadOptions.IFetchProductPurchaseStatus): Promise<any>;
    }
    export { NostrEventManagerReadV1o5 };
}
/// <amd-module name="@scom/scom-social-sdk/managers/eventManagerReadV2.ts" />
declare module "@scom/scom-social-sdk/managers/eventManagerReadV2.ts" {
    import { ISocialEventManagerRead, SocialEventManagerReadOptions } from "@scom/scom-social-sdk/interfaces/index.ts";
    import { INostrRestAPIManager } from "@scom/scom-social-sdk/managers/communication.ts";
    import { NostrEventManagerReadV1o5 } from "@scom/scom-social-sdk/managers/eventManagerReadV1o5.ts";
    class NostrEventManagerReadV2 extends NostrEventManagerReadV1o5 implements ISocialEventManagerRead {
        protected _nostrCommunicationManager: INostrRestAPIManager;
        constructor(manager: INostrRestAPIManager);
        set nostrCommunicationManager(manager: INostrRestAPIManager);
        searchUsers(options: SocialEventManagerReadOptions.ISearchUsers): Promise<any[]>;
        fetchPaymentRequestEvent(options: SocialEventManagerReadOptions.IFetchPaymentRequestEvent): Promise<any>;
        fetchPaymentActivitiesForRecipient(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForRecipient): Promise<any[]>;
        fetchPaymentActivitiesForSender(options: SocialEventManagerReadOptions.IFetchPaymentActivitiesForSender): Promise<any[]>;
        fetchUserFollowingFeed(options: SocialEventManagerReadOptions.IFetchUserFollowingFeed): Promise<any[]>;
    }
    export { NostrEventManagerReadV2 };
}
/// <amd-module name="@scom/scom-social-sdk/utils/lightningWallet.ts" />
declare module "@scom/scom-social-sdk/utils/lightningWallet.ts" {
    type LNURLResponse = {
        status: "OK";
    } | {
        status: "ERROR";
        reason: string;
    };
    export type LnurlStep3Response = LNURLResponse & {
        callback: string;
        minSendable: number;
        maxSendable: number;
        nostrPubkey: string;
        allowsNostr: boolean;
        commentAllowed: number;
    };
    export type LnurlStep6Response = LNURLResponse & {
        pr: string;
        routes: string[];
    };
    export class LightningWalletManager {
        private _privateKey;
        private webln;
        constructor();
        set privateKey(privateKey: string);
        isAvailable(): boolean;
        makeZapInvoice(recipient: string, lnAddress: string, amount: number, comment: string, relays: string[], eventId?: string): Promise<string>;
        makeInvoice(amount: number, comment: string): Promise<string>;
        sendPayment(paymentRequest: string): Promise<string>;
        private createNip57Event;
        private getZapEndpoint;
        zap(recipient: string, lnAddress: string, amount: number, comment: string, relays: string[], eventId?: string): Promise<any>;
        getBalance(): Promise<any>;
    }
}
/// <amd-module name="@scom/scom-social-sdk/managers/dataManager/system.ts" />
declare module "@scom/scom-social-sdk/managers/dataManager/system.ts" {
    import { ICryptocurrency, ICurrency, IRegion } from "@scom/scom-social-sdk/interfaces/index.ts";
    export class SystemDataManager {
        private _publicIndexingRelay;
        private _privateKey;
        constructor(publicIndexingRelay: string);
        get privateKey(): string;
        set privateKey(privateKey: string);
        private fetchListOfValues;
        fetchRegions(): Promise<IRegion[]>;
        fetchCurrencies(): Promise<ICurrency[]>;
        fetchCryptocurrencies(): Promise<ICryptocurrency[]>;
    }
}
/// <amd-module name="@scom/scom-social-sdk/managers/dataManager/index.ts" />
declare module "@scom/scom-social-sdk/managers/dataManager/index.ts" {
    import { BuyerOrderStatus, CommunityRole, ICalendarEventDetailInfo, ICalendarEventInfo, IChannelInfo, ICheckIfUserHasAccessToCommunityOptions, ICheckRelayStatusResult, ICommunity, ICommunityDetailMetadata, ICommunityInfo, ICommunityLeaderboard, ICommunityMember, ICommunityPostScpData, ICommunityProductInfo, ICommunityStallInfo, ICommunitySubscription, IConversationPath, ICurrency, IDecryptPostPrivateKeyForCommunityOptions, IEthWalletAccountsInfo, IFetchPaymentActivitiesOptions, ILocationCoordinates, ILongFormContentInfo, IMarketplaceOrderUpdateInfo, IMarketplaceProduct, IMarketplaceStall, IMessageContactInfo, INewCommunityInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INoteActions, INoteCommunityInfo, INoteInfo, INoteInfoExtended, IPaymentActivityV2, IPostStats, IRegion, IRetrieveChannelMessageKeysOptions, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, IRetrievedBuyerOrder, IRetrievedMarketplaceOrder, ISendTempMessageOptions, ISocialDataManagerConfig, ISocialEventManagerRead, ISocialEventManagerWrite, ITrendingCommunityInfo, IUpdateCalendarEventInfo, IUpdateCommunitySubscription, IUserActivityStats, IUserProfile, SellerOrderStatus, SocialDataManagerOptions } from "@scom/scom-social-sdk/interfaces/index.ts";
    class SocialDataManager {
        private _writeRelays;
        private _publicIndexingRelay;
        private _apiBaseUrl;
        private _ipLocationServiceBaseUrl;
        private _socialEventManagerRead;
        private _socialEventManagerWrite;
        private _privateKey;
        private _selfPubkey;
        private mqttManager;
        private lightningWalletManager;
        private systemDataManager;
        constructor(config: ISocialDataManagerConfig);
        dispose(): Promise<void>;
        set privateKey(privateKey: string);
        get socialEventManagerRead(): ISocialEventManagerRead;
        get socialEventManagerWrite(): ISocialEventManagerWrite;
        set relays(value: string[]);
        get privateKey(): string;
        get selfPubkey(): string;
        private _initializeWriteRelaysManagers;
        subscribeToMqttTopics(topics: string[]): void;
        unsubscribeFromMqttTopics(topics: string[]): void;
        publishToMqttTopic(topic: string, message: string): void;
        fetchCommunityFeedInfo(creatorId: string, communityId: string, since?: number, until?: number): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            quotedNotesMap: Record<string, INoteInfo>;
        }>;
        retrieveCommunityUri(noteEvent: INostrEvent, scpData: ICommunityPostScpData): string;
        retrievePostPrivateKey(event: INostrEvent, communityUri: string, communityPrivateKey: string): Promise<string>;
        decryptPostPrivateKeyForCommunity(options: IDecryptPostPrivateKeyForCommunityOptions): Promise<string>;
        retrieveChannelMessagePrivateKey(event: INostrEvent, channelId: string, communityPrivateKey: string): Promise<string>;
        retrieveCommunityPrivateKey(communityInfo: ICommunityInfo, selfPrivateKey: string): Promise<string>;
        private constructCommunityNoteIdToPrivateKeyMap;
        retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions): Promise<Record<string, string>>;
        retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions): Promise<Record<string, string>>;
        retrieveCommunityPostKeysByNoteEvents(options: IRetrieveCommunityPostKeysByNoteEventsOptions): Promise<Record<string, string>>;
        checkIfUserHasAccessToCommunity(options: ICheckIfUserHasAccessToCommunityOptions): Promise<{
            hasAccess: boolean;
            subscriptions: ICommunitySubscription[];
            isWhiteListed: boolean;
        }>;
        constructMetadataByPubKeyMap(notes: INostrEvent[]): Promise<Record<string, INostrMetadata>>;
        fetchUserProfiles(pubKeys: string[]): Promise<IUserProfile[]>;
        updateUserProfile(content: INostrMetadataContent): Promise<void>;
        updateUserProfileV2(profile: Partial<IUserProfile>): Promise<void>;
        fetchTrendingNotesInfo(): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
        }>;
        private constructNoteCommunity;
        fetchProfileFeedInfo(pubKey: string, since?: number, until?: number): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            quotedNotesMap: Record<string, INoteInfo>;
            earliest: number;
        }>;
        fetchProfileRepliesInfo(pubKey: string, since?: number, until?: number): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            quotedNotesMap: Record<string, INoteInfo>;
            earliest: number;
        }>;
        fetchEventsByIds(ids: string[]): Promise<INostrEvent[]>;
        fetchNotesByIds(ids: string[]): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            quotedNotesMap: Record<string, INoteInfo>;
        }>;
        fetchTempEvents(ids: string[]): Promise<INostrEvent[]>;
        private getEarliestEventTimestamp;
        fetchHomeFeedInfo(pubKey: string, since?: number, until?: number): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            quotedNotesMap: Record<string, INoteInfo>;
            earliest: number;
        }>;
        fetchUserFollowingFeedInfo(pubKey: string, until?: number): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            quotedNotesMap: Record<string, INoteInfo>;
            earliest: number;
        }>;
        createNoteEventMappings(events: INostrEvent[], parentAuthorsInfo?: boolean): {
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            quotedNotesMap: Record<string, INoteInfo>;
            noteToParentAuthorIdMap: Record<string, string>;
            noteStatsMap: Record<string, IPostStats>;
            noteToRepostIdMap: Record<string, string>;
            noteActionsMap: Record<string, INoteActions>;
            pubkeyToCommunityIdsMap: Record<string, string[]>;
        };
        fetchCommunityInfo(creatorId: string, communityId: string): Promise<ICommunityInfo>;
        private getRandomInt;
        private constructLeaderboard;
        fetchCommunityLeaderboard(community: ICommunityInfo): Promise<{
            allTime: ICommunityLeaderboard[];
            monthly: ICommunityLeaderboard[];
            weekly: ICommunityLeaderboard[];
        }>;
        fetchUserRelatedCommunityFeedInfo(pubKey: string, since?: number, until?: number): Promise<INoteInfoExtended[]>;
        fetchThreadNotesInfo(focusedNoteId: string): Promise<{
            focusedNote: INoteInfo;
            ancestorNotes: INoteInfo[];
            replies: INoteInfo[];
            quotedNotesMap: Record<string, INoteInfo>;
            metadataByPubKeyMap: Record<string, INostrMetadata>;
            childReplyEventTagIds: string[];
            communityInfo: ICommunityInfo;
        }>;
        createNoteCommunityMappings(notes: INostrEvent[]): Promise<{
            noteCommunityInfoList: INoteCommunityInfo[];
            communityInfoList: ICommunityInfo[];
        }>;
        retrieveUserProfileDetail(options: {
            pubKey?: string;
            telegramAccount?: string;
        }): Promise<{
            userProfile: IUserProfile;
            stats: IUserActivityStats;
        }>;
        fetchUserContactList(pubKey: string): Promise<IUserProfile[]>;
        fetchUserFollowersList(pubKey: string): Promise<IUserProfile[]>;
        fetchUserRelayList(pubKey: string): Promise<string[]>;
        followUser(userPubKey: string): Promise<void>;
        unfollowUser(userPubKey: string): Promise<void>;
        generateGroupKeys(privateKey: string, encryptionPublicKeys: string[]): Promise<{
            groupPrivateKey: string;
            groupPublicKey: string;
            encryptedGroupKeys: Record<string, string>;
        }>;
        createCommunity(newInfo: INewCommunityInfo, creatorId: string): Promise<ICommunityInfo>;
        updateCommunity(info: ICommunityInfo): Promise<ICommunityInfo>;
        updateCommunityChannel(communityInfo: ICommunityInfo): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        createChannel(channelInfo: IChannelInfo, memberIds: string[]): Promise<IChannelInfo>;
        updateChannel(channelInfo: IChannelInfo): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        fetchCommunitiesMembers(communities: ICommunityInfo[]): Promise<Record<string, ICommunityMember[]>>;
        private getEventIdToMemberMap;
        fetchCommunities(query?: string): Promise<ICommunity[]>;
        fetchMyCommunities(pubKey: string): Promise<ICommunity[]>;
        fetchUserRoleInCommunity(community: ICommunityInfo, pubKey: string): Promise<CommunityRole>;
        joinCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
        leaveCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
        private encryptMessageWithGeneratedKey;
        submitCommunityPost(message: string, info: ICommunityInfo, conversationPath?: IConversationPath, timestamp?: number, alt?: string, isPublicPost?: boolean): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        fetchAllUserRelatedChannels(pubKey: string): Promise<IChannelInfo[]>;
        retrieveChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
        retrieveChannelEvents(creatorId: string, channelId: string): Promise<{
            messageEvents: INostrEvent[];
            info: IChannelInfo;
        }>;
        retrieveChannelMessageKeys(options: IRetrieveChannelMessageKeysOptions): Promise<Record<string, string>>;
        submitChannelMessage(message: string, channelId: string, communityPublicKey: string, conversationPath?: IConversationPath): Promise<void>;
        fetchDirectMessagesBySender(selfPubKey: string, senderPubKey: string, since?: number, until?: number): Promise<{
            decodedSenderPubKey: string;
            encryptedMessages: any[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
        }>;
        sendDirectMessage(chatId: string, message: string, replyToEventId?: string): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        sendTempMessage(options: ISendTempMessageOptions): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        resetMessageCount(selfPubKey: string, senderPubKey: string): Promise<void>;
        fetchMessageContacts(pubKey: string): Promise<IMessageContactInfo[]>;
        fetchUserGroupInvitations(pubKey: string): Promise<string[]>;
        updateCalendarEvent(updateCalendarEventInfo: IUpdateCalendarEventInfo): Promise<string>;
        retrieveCalendarEventsByDateRange(start: number, end?: number, limit?: number, previousEventId?: string): Promise<{
            calendarEventInfoList: ICalendarEventInfo[];
            startDates: number[];
        }>;
        retrieveCalendarEvent(naddr: string): Promise<ICalendarEventDetailInfo>;
        acceptCalendarEvent(rsvpId: string, naddr: string): Promise<void>;
        declineCalendarEvent(rsvpId: string, naddr: string): Promise<void>;
        submitCalendarEventPost(naddr: string, message: string, conversationPath?: IConversationPath): Promise<any>;
        fetchTimezones(): Promise<any[]>;
        fetchCitiesByKeyword(keyword: string): Promise<any[]>;
        fetchCitiesByCoordinates(latitude: number, longitude: number): Promise<any[]>;
        fetchLocationInfoFromIP(): Promise<ILocationCoordinates>;
        getAccountBalance(walletAddress: string): Promise<any>;
        getNFTsByOwner(walletAddress: string): Promise<any>;
        submitMessage(message: string, conversationPath?: IConversationPath, createdAt?: number): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        submitLongFormContent(info: ILongFormContentInfo): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        submitLike(postEventData: INostrEvent): Promise<void>;
        submitRepost(postEventData: INostrEvent): Promise<void>;
        sendPingRequest(pubkey: string, relayUrl?: string): Promise<any>;
        checkRelayStatus(pubkey: string, relayUrl?: string): Promise<ICheckRelayStatusResult>;
        searchUsers(query: string): Promise<IUserProfile[]>;
        addRelay(url: string): Promise<void>;
        removeRelay(url: string): Promise<void>;
        updateRelays(add: string[], remove: string[], defaultRelays: string[]): Promise<string[]>;
        makeInvoice(amount: string, comment: string): Promise<string>;
        createPaymentRequest(chainId: number, token: any, amount: string, to: string, comment: string): Promise<string>;
        parsePaymentRequest(paymentRequest: string): any;
        private sendToken;
        private isLightningInvoice;
        sendPayment(paymentRequest: string, comment: string): Promise<string>;
        zap(pubkey: string, lud16: string, amount: string, noteId: string): Promise<any>;
        fetchUserPaymentActivities(pubkey: string, since?: number, until?: number): Promise<import("@scom/scom-social-sdk/interfaces/misc.ts").IPaymentActivity[]>;
        fetchPaymentReceiptInfo(paymentRequest: string): Promise<{
            status: 'pending' | 'completed';
            preimage?: string;
            tx?: string;
        }>;
        getLightningBalance(): Promise<any>;
        isLightningAvailable(): boolean;
        getBitcoinPrice(): Promise<any>;
        fetchUserPrivateRelay(pubkey: string): Promise<any>;
        fetchApps(keyword?: string): Promise<any>;
        fetchApp(pubkey: string, id: string): Promise<any>;
        fetchInstalledByPubKey(pubkey: string): Promise<any>;
        fetchInstalledApps(pubkey: string): Promise<any>;
        installApp(pubkey: string, appId: string, appVersionId: string): Promise<any>;
        fetchCommunityPinnedNotes(creatorId: string, communityId: string): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
        }>;
        pinCommunityNote(creatorId: string, communityId: string, noteId: string): Promise<void>;
        unpinCommunityNote(creatorId: string, communityId: string, noteId: string): Promise<void>;
        fetchUserPinnedNotes(pubKey: string): Promise<INostrEvent[]>;
        pinUserNote(pubKey: string, noteId: string): Promise<void>;
        unpinUserNote(pubKey: string, noteId: string): Promise<void>;
        fetchUserBookmarks(pubKey: string): Promise<string[]>;
        addBookmark(pubKey: string, eventId: string, isArticle?: boolean): Promise<void>;
        removeBookmark(pubKey: string, eventId: string, isArticle?: boolean): Promise<void>;
        deleteEvents(eventIds: string[]): Promise<void>;
        fetchTrendingCommunities(): Promise<ITrendingCommunityInfo[]>;
        fetchUserEthWalletAccountsInfo(options: SocialDataManagerOptions.IFetchUserEthWalletAccountsInfo): Promise<IEthWalletAccountsInfo>;
        updateUserEthWalletAccountsInfo(info: IEthWalletAccountsInfo, privateKey?: string): Promise<any>;
        fetchSubCommunities(creatorId: string, communityId: string): Promise<ICommunityInfo[]>;
        fetchCommunityDetailMetadata(creatorId: string, communityId: string): Promise<ICommunityDetailMetadata>;
        updateNoteStatus(noteId: string, status: string): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        updateCommunitySubscription(options: IUpdateCommunitySubscription): Promise<any>;
        fetchCommunityStalls(creatorId: string, communityId: string): Promise<ICommunityStallInfo[]>;
        fetchCommunityProducts(options: SocialDataManagerOptions.IFetchCommunityProducts): Promise<ICommunityProductInfo[]>;
        updateCommunityStall(creatorId: string, communityId: string, stall: IMarketplaceStall): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        updateCommunityProduct(creatorId: string, communityId: string, product: IMarketplaceProduct): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        placeMarketplaceOrder(options: SocialDataManagerOptions.IPlaceMarketplaceOrder): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        recordPaymentActivity(paymentActivity: IPaymentActivityV2): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        updateMarketplaceOrderStatus(merchantId: string, stallId: string, updateInfo: IMarketplaceOrderUpdateInfo): Promise<import("@scom/scom-social-sdk/interfaces/eventManagerWrite.ts").ISocialEventManagerWriteResult>;
        fetchPaymentActivities(options: IFetchPaymentActivitiesOptions): Promise<IPaymentActivityV2[]>;
        fetchCommunityOrders(creatorId: string, communityId: string, stallId?: string, status?: SellerOrderStatus): Promise<IRetrievedMarketplaceOrder[]>;
        fetchBuyerOrders(pubkey: string, status?: BuyerOrderStatus): Promise<IRetrievedBuyerOrder[]>;
        fetchMarketplaceOrderDetails(orderId: string): Promise<IRetrievedBuyerOrder>;
        fetchMarketplaceProductDetails(options: SocialDataManagerOptions.IFetchMarketplaceProductDetails): Promise<ICommunityProductInfo[]>;
        fetchProductPostPurchaseContent(options: SocialDataManagerOptions.IFetchProductPostPurchaseContent): Promise<any>;
        fetchProductPurchaseStatus(options: SocialDataManagerOptions.IFetchProductPurchaseStatus): Promise<boolean>;
        fetchRegions(): Promise<IRegion[]>;
        fetchCurrencies(): Promise<ICurrency[]>;
        fetchCryptocurrencies(): Promise<import("@scom/scom-social-sdk/interfaces/marketplace.ts").ICryptocurrency[]>;
    }
    export { SocialDataManager };
}
/// <amd-module name="@scom/scom-social-sdk/managers/index.ts" />
declare module "@scom/scom-social-sdk/managers/index.ts" {
    import { INostrCommunicationManager, INostrRestAPIManager, NostrRestAPIManager, NostrWebSocketManager } from "@scom/scom-social-sdk/managers/communication.ts";
    import { SocialUtilsManager } from "@scom/scom-social-sdk/managers/utilsManager.ts";
    import { NostrEventManagerWrite } from "@scom/scom-social-sdk/managers/eventManagerWrite.ts";
    import { NostrEventManagerRead } from "@scom/scom-social-sdk/managers/eventManagerRead.ts";
    import { NostrEventManagerReadV2 } from "@scom/scom-social-sdk/managers/eventManagerReadV2.ts";
    import { SocialDataManager } from "@scom/scom-social-sdk/managers/dataManager/index.ts";
    export { NostrEventManagerRead, NostrEventManagerReadV2, NostrEventManagerWrite, SocialUtilsManager, SocialDataManager, NostrRestAPIManager, NostrWebSocketManager, INostrCommunicationManager, INostrRestAPIManager };
}
/// <amd-module name="@scom/scom-social-sdk" />
declare module "@scom/scom-social-sdk" {
    export { Event, Keys, Nip19, Bech32, secp256k1, schnorr } from "@scom/scom-social-sdk/core/index.ts";
    export * from "@scom/scom-social-sdk/interfaces/index.ts";
    export { NostrEventManagerRead, NostrEventManagerReadV2, NostrEventManagerWrite, SocialUtilsManager, SocialDataManager, NostrWebSocketManager, NostrRestAPIManager, INostrCommunicationManager, INostrRestAPIManager } from "@scom/scom-social-sdk/managers/index.ts";
}
