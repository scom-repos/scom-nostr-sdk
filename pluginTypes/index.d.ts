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
}
/// <amd-module name="@scom/scom-social-sdk/utils/interfaces.ts" />
declare module "@scom/scom-social-sdk/utils/interfaces.ts" {
    export interface IFetchNotesOptions {
        authors?: string[];
        ids?: string[];
    }
    export interface INostrEvent {
        id: string;
        pubkey: string;
        created_at: number;
        kind: number;
        tags: string[][];
        content: string;
        sig: string;
    }
    export interface INostrFetchEventsResponse {
        error?: string;
        events?: INostrEvent[];
        data?: any;
    }
    export interface INostrSubmitResponse {
        eventId: string;
        success: boolean;
        message?: string;
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
    export interface INoteInfo {
        eventData: INostrEvent;
        stats?: IPostStats;
        actions?: INoteActions;
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
        community?: Omit<INoteCommunityInfo, "eventData">;
    }
    export interface INoteCommunityInfo {
        eventData: INostrEvent;
        communityUri?: string;
        creatorId?: string;
        communityId?: string;
    }
    export enum NftType {
        ERC721 = "ERC721",
        ERC1155 = "ERC1155"
    }
    export enum ScpStandardId {
        Community = "1",
        CommunityPost = "2",
        Channel = "3",
        ChannelMessage = "4",
        GroupKeys = "5"
    }
    export enum MembershipType {
        Open = "Open",
        NFTExclusive = "NFTExclusive",
        InviteOnly = "InviteOnly"
    }
    export interface ICommunityScpData {
        chainId: number;
        nftAddress: string;
        nftType: NftType;
        nftId?: number;
        publicKey?: string;
        encryptedKey?: string;
        gatekeeperPublicKey?: string;
        channelEventId?: string;
    }
    export interface ICommunityPostScpData {
        communityUri: string;
        encryptedKey?: string;
    }
    export interface IChannelScpData {
        communityUri?: string;
        publicKey?: string;
    }
    export interface IChannelMessageScpData {
        channelId: string;
        encryptedKey?: string;
    }
    export interface ICommunityBasicInfo {
        creatorId: string;
        communityId: string;
    }
    export interface ICommunityInfo extends ICommunityBasicInfo {
        communityUri: string;
        description?: string;
        rules?: string;
        bannerImgUrl?: string;
        avatarImgUrl?: string;
        gatekeeperNpub?: string;
        scpData?: ICommunityScpData;
        moderatorIds?: string[];
        eventData?: INostrEvent;
        membershipType: MembershipType;
        memberIds?: string[];
        memberKeyMap?: Record<string, string>;
        privateRelay?: string;
    }
    export interface INewCommunityInfo {
        name: string;
        description?: string;
        bannerImgUrl?: string;
        avatarImgUrl?: string;
        moderatorIds?: string[];
        rules?: string;
        gatekeeperNpub?: string;
        scpData?: ICommunityScpData;
        membershipType: MembershipType;
        memberIds?: string[];
        privateRelay?: string;
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
    export interface INewChannelMessageInfo {
        channelId: string;
        message: string;
        conversationPath?: IConversationPath;
        scpData?: IChannelMessageScpData;
    }
    export interface IRetrieveChannelMessageKeysOptions {
        creatorId: string;
        channelId: string;
        privateKey?: string;
        gatekeeperUrl?: string;
        message?: string;
        signature?: string;
    }
    export interface IConversationPath {
        noteIds: string[];
        authorIds: string[];
    }
    export interface INewCommunityPostInfo {
        community: ICommunityInfo;
        message: string;
        conversationPath?: IConversationPath;
        scpData?: ICommunityPostScpData;
    }
    export interface IRetrieveCommunityPostKeysOptions {
        creatorId: string;
        communityId: string;
        gatekeeperUrl?: string;
        message?: string;
        signature?: string;
    }
    export interface ICommunityGatekeeperInfo {
        name: string;
        npub: string;
        url: string;
    }
    export interface IRetrieveCommunityPostKeysByNoteEventsOptions {
        notes: INostrEvent[];
        pubKey: string;
        getSignature: (message: string) => Promise<string>;
        gatekeepers: ICommunityGatekeeperInfo[];
    }
    export interface IRetrieveCommunityThreadPostKeysOptions {
        communityInfo: ICommunityInfo;
        noteEvents: INostrEvent[];
        focusedNoteId: string;
        gatekeeperUrl?: string;
        message?: string;
        signature?: string;
    }
    export interface IPostStats {
        replies?: number;
        reposts?: number;
        upvotes?: number;
        downvotes?: number;
        views?: number;
        satszapped?: number;
    }
    export interface INoteActions {
        liked?: boolean;
        replied?: boolean;
        reposted?: boolean;
        zapped?: boolean;
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
    export interface ICommunity extends ICommunityInfo {
        members: ICommunityMember[];
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
    export interface ISocialDataManagerConfig {
        version?: 1 | 2;
        writeRelays: string[];
        readRelay: string;
        publicIndexingRelay: string;
        apiBaseUrl: string;
        ipLocationServiceBaseUrl?: string;
        ipLocationServiceApiKey?: string;
        mqttBrokerUrl?: string;
        mqttSubscriptions?: string[];
        mqttMessageCallback?: (topic: string, message: string) => void;
        enableLightningWallet?: boolean;
    }
    export interface ILongFormContentInfo {
        id: string;
        content: string;
        title?: string;
        image?: string;
        summary?: string;
        publishedAt?: number;
        eventData?: INostrEvent;
    }
    export interface IAllUserRelatedChannels {
        channels: IChannelInfo[];
        channelMetadataMap: Record<string, IChannelInfo>;
        channelIdToCommunityMap: Record<string, ICommunityInfo>;
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
}
/// <amd-module name="@scom/scom-social-sdk/utils/mqtt.ts" />
declare module "@scom/scom-social-sdk/utils/mqtt.ts" {
    interface IMqttManagerConfig {
        brokerUrl: string;
        subscriptions?: string[];
        connectCallback?: () => void;
        errorCallback?: (error: any) => void;
        messageCallback?: (topic: string, message: string) => void;
    }
    class MqttManager {
        private config;
        private client;
        private subscriptions;
        constructor(config: IMqttManagerConfig);
        subscribe(topics: string[]): void;
        unsubscribe(topics: string[]): void;
        publish(topic: string, message: string): void;
        disconnect(): void;
    }
    export { MqttManager };
}
/// <amd-module name="@scom/scom-social-sdk/utils/index.ts" />
declare module "@scom/scom-social-sdk/utils/index.ts" {
    export { IFetchNotesOptions, INostrMetadataContent, INostrEvent, ICommunityBasicInfo, ICommunityInfo, ICommunityScpData, INoteInfo, INoteInfoExtended, INoteCommunityInfo, ICommunityGatekeeperInfo, IUserProfile, IUserActivityStats, IPostStats, IChannelInfo, IMessageContactInfo, INewCommunityInfo, MembershipType, CommunityRole, ICommunityMember, ICommunity, CalendarEventType, ICalendarEventInfo, IUpdateCalendarEventInfo, ICalendarEventHost, ICalendarEventAttendee, ICalendarEventDetailInfo, INewCalendarEventPostInfo, ILocationCoordinates, ISocialDataManagerConfig, INostrFetchEventsResponse, IPaymentActivity } from "@scom/scom-social-sdk/utils/interfaces.ts";
    export { MqttManager } from "@scom/scom-social-sdk/utils/mqtt.ts";
}
/// <amd-module name="@scom/scom-social-sdk/managers/communication.ts" />
declare module "@scom/scom-social-sdk/managers/communication.ts" {
    import { Event } from "@scom/scom-social-sdk/core/index.ts";
    import { INostrFetchEventsResponse, INostrSubmitResponse } from "@scom/scom-social-sdk/utils/interfaces.ts";
    interface INostrCommunicationManager {
        fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
        fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
        submitEvent(event: Event.VerifiedEvent<number>): Promise<INostrSubmitResponse>;
    }
    interface INostrRestAPIManager extends INostrCommunicationManager {
        fetchEventsFromAPI(endpoint: string, msg: any): Promise<INostrFetchEventsResponse>;
    }
    class NostrRestAPIManager implements INostrRestAPIManager {
        protected _url: string;
        protected requestCallbackMap: Record<string, (response: any) => void>;
        constructor(url: string);
        get url(): string;
        set url(url: string);
        fetchEvents(...requests: any): Promise<INostrFetchEventsResponse>;
        fetchEventsFromAPI(endpoint: string, msg: any): Promise<INostrFetchEventsResponse>;
        fetchCachedEvents(eventType: string, msg: any): Promise<INostrFetchEventsResponse>;
        submitEvent(event: any): Promise<any>;
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
    export { INostrCommunicationManager, INostrRestAPIManager, NostrRestAPIManager, NostrWebSocketManager };
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
/// <amd-module name="@scom/scom-social-sdk/managers/scraperManager.ts" />
declare module "@scom/scom-social-sdk/managers/scraperManager.ts" {
    interface IScraperManager {
        getUserIdByUserName: (username: string) => Promise<string>;
        getTweetsByUserName: (username: string) => Promise<string>;
    }
    interface ITweets {
        conversationId: string;
        id: string;
        hashtags: any[];
        likes: number;
        mentions: any[];
        name: string;
        permanentUrl: string;
        photos: any[];
        replies: number;
        retweets: number;
        text: string;
        thread: any[];
        urls: [];
        userId: string;
        username: string;
        videos: any[];
        isQuoted: boolean;
        isReply: boolean;
        isRetweet: boolean;
        isPin: boolean;
        sensitiveContent: boolean;
        timeParsed: Date;
        timestamp: number;
        html: string;
        views: number;
    }
    class ScraperManager {
        getUserIdByUserName(username: string): Promise<string>;
        getTweetsByUserName(username: string, maxTweets?: number): Promise<ITweets[]>;
        private getGuestToken;
        private reconstructTweetHtml;
        private parseVideo;
        private parseMediaGroups;
        private parseLegacyTweet;
        private parseAndPush;
        private parseTimelineEntryItemContentRaw;
        private parseResult;
        private parseTimelineTweetsV2;
    }
    export default ScraperManager;
    export { ITweets, IScraperManager };
}
/// <amd-module name="@scom/scom-social-sdk/managers/utilsManager.ts" />
declare module "@scom/scom-social-sdk/managers/utilsManager.ts" {
    import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, INostrEvent } from "@scom/scom-social-sdk/utils/interfaces.ts";
    class SocialUtilsManager {
        static hexStringToUint8Array(hexString: string): Uint8Array;
        static base64ToUtf8(base64: string): string;
        static utf8ToBase64(utf8: string): string;
        static convertPrivateKeyToPubkey(privateKey: string): string;
        static encryptMessage(ourPrivateKey: string, theirPublicKey: string, text: string): Promise<string>;
        static decryptMessage(ourPrivateKey: string, theirPublicKey: string, encryptedData: string): Promise<string>;
        private static pad;
        static getGMTOffset(timezone: string): string;
        static exponentialBackoffRetry<T>(fn: () => Promise<T>, // Function to retry
        retries: number, // Maximum number of retries
        delay: number, // Initial delay duration in milliseconds
        maxDelay: number, // Maximum delay duration in milliseconds
        factor: number): Promise<T>;
        static getCommunityUri(creatorId: string, communityId: string): string;
        static getCommunityBasicInfoFromUri(communityUri: string): ICommunityBasicInfo;
        static extractCommunityInfo(event: INostrEvent): ICommunityInfo;
        static extractBookmarkedCommunities(event: INostrEvent, excludedCommunity?: ICommunityInfo): ICommunityBasicInfo[];
        static extractBookmarkedChannels(event: INostrEvent): string[];
        static extractScpData(event: INostrEvent, standardId: string): any;
        static parseContent(content: string): any;
        static extractChannelInfo(event: INostrEvent): IChannelInfo;
        static augmentWithAuthInfo(obj: Record<string, any>, privateKey: string): Record<string, any>;
    }
    export { SocialUtilsManager };
}
/// <amd-module name="@scom/scom-social-sdk/managers/eventManagerWrite.ts" />
declare module "@scom/scom-social-sdk/managers/eventManagerWrite.ts" {
    import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IConversationPath, ILongFormContentInfo, INewCalendarEventPostInfo, INewChannelMessageInfo, INewCommunityPostInfo, INostrMetadataContent, INostrSubmitResponse, IRelayConfig, IUpdateCalendarEventInfo } from "@scom/scom-social-sdk/utils/interfaces.ts";
    import { INostrCommunicationManager } from "@scom/scom-social-sdk/managers/communication.ts";
    interface ISocialEventManagerWrite {
        nostrCommunicationManagers: INostrCommunicationManager[];
        privateKey: string;
        updateContactList(content: string, contactPubKeys: string[]): Promise<void>;
        postNote(content: string, conversationPath?: IConversationPath): Promise<string>;
        deleteEvents(eventIds: string[]): Promise<INostrSubmitResponse[]>;
        updateCommunity(info: ICommunityInfo): Promise<INostrSubmitResponse[]>;
        updateChannel(info: IChannelInfo): Promise<INostrSubmitResponse[]>;
        updateUserBookmarkedChannels(channelEventIds: string[]): Promise<void>;
        submitChannelMessage(info: INewChannelMessageInfo): Promise<void>;
        updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<void>;
        submitCommunityPost(info: INewCommunityPostInfo): Promise<void>;
        updateUserProfile(content: INostrMetadataContent): Promise<void>;
        sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<void>;
        updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<INostrSubmitResponse[]>;
        updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<INostrSubmitResponse[]>;
        createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<INostrSubmitResponse[]>;
        submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<INostrSubmitResponse[]>;
        submitLongFormContentEvents(info: ILongFormContentInfo): Promise<void>;
        submitLike(tags: string[][]): Promise<void>;
        submitRepost(content: string, tags: string[][]): Promise<void>;
        updateRelayList(relays: Record<string, IRelayConfig>): Promise<void>;
        createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<void>;
        createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<void>;
    }
    class NostrEventManagerWrite implements ISocialEventManagerWrite {
        protected _nostrCommunicationManagers: INostrCommunicationManager[];
        protected _privateKey: string;
        constructor(managers: INostrCommunicationManager[]);
        set nostrCommunicationManagers(managers: INostrCommunicationManager[]);
        set privateKey(privateKey: string);
        protected calculateConversationPathTags(conversationPath: IConversationPath): string[][];
        updateContactList(content: string, contactPubKeys: string[]): Promise<void>;
        postNote(content: string, conversationPath?: IConversationPath): Promise<string>;
        deleteEvents(eventIds: string[]): Promise<INostrSubmitResponse[]>;
        updateChannel(info: IChannelInfo): Promise<INostrSubmitResponse[]>;
        updateUserBookmarkedChannels(channelEventIds: string[]): Promise<void>;
        updateCommunity(info: ICommunityInfo): Promise<INostrSubmitResponse[]>;
        updateUserBookmarkedCommunities(communities: ICommunityBasicInfo[]): Promise<void>;
        submitCommunityPost(info: INewCommunityPostInfo): Promise<void>;
        submitChannelMessage(info: INewChannelMessageInfo): Promise<void>;
        updateUserProfile(content: INostrMetadataContent): Promise<void>;
        sendMessage(receiver: string, encryptedMessage: string, replyToEventId?: string): Promise<void>;
        updateGroupKeys(identifier: string, groupKind: number, keys: string, invitees: string[]): Promise<INostrSubmitResponse[]>;
        updateCalendarEvent(info: IUpdateCalendarEventInfo): Promise<INostrSubmitResponse[]>;
        createCalendarEventRSVP(rsvpId: string, calendarEventUri: string, accepted: boolean): Promise<INostrSubmitResponse[]>;
        submitCalendarEventPost(info: INewCalendarEventPostInfo): Promise<INostrSubmitResponse[]>;
        submitLongFormContentEvents(info: ILongFormContentInfo): Promise<void>;
        submitLike(tags: string[][]): Promise<void>;
        submitRepost(content: string, tags: string[][]): Promise<void>;
        updateRelayList(relays: Record<string, IRelayConfig>): Promise<void>;
        createPaymentRequestEvent(paymentRequest: string, amount: string, comment: string, isLightningInvoice?: boolean): Promise<void>;
        createPaymentReceiptEvent(requestEventId: string, recipient: string, comment: string, preimage?: string, tx?: string): Promise<void>;
    }
    export { NostrEventManagerWrite, ISocialEventManagerWrite };
}
/// <amd-module name="@scom/scom-social-sdk/managers/eventManagerRead.ts" />
declare module "@scom/scom-social-sdk/managers/eventManagerRead.ts" {
    import { Nip19 } from "@scom/scom-social-sdk/core/index.ts";
    import { IAllUserRelatedChannels, IChannelInfo, ICommunityBasicInfo, ICommunityInfo, IFetchNotesOptions, INostrEvent, IPaymentActivity } from "@scom/scom-social-sdk/utils/interfaces.ts";
    import { INostrCommunicationManager, INostrRestAPIManager } from "@scom/scom-social-sdk/managers/communication.ts";
    interface ISocialEventManagerRead {
        nostrCommunicationManager: INostrCommunicationManager | INostrRestAPIManager;
        privateKey: string;
        fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
        fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
        fetchProfileFeedCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchProfileRepliesCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchHomeFeedCacheEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
        fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchContactListCacheEvents(pubKey: string, detailIncluded?: boolean): Promise<INostrEvent[]>;
        fetchUserRelays(pubKey: string): Promise<INostrEvent[]>;
        fetchFollowersCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<INostrEvent[]>;
        fetchAllUserRelatedCommunities(pubKey: string): Promise<INostrEvent[]>;
        fetchUserBookmarkedCommunities(pubKey: string, excludedCommunity?: ICommunityInfo): Promise<ICommunityBasicInfo[]>;
        fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
        fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
        fetchCommunitiesFeed(communityUriArr: string[]): Promise<INostrEvent[]>;
        fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
        fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
        fetchEventsByIds(ids: string[]): Promise<INostrEvent[]>;
        fetchAllUserRelatedChannels(pubKey: string): Promise<IAllUserRelatedChannels>;
        fetchUserBookmarkedChannelEventIds(pubKey: string): Promise<string[]>;
        fetchChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchChannelInfoMessages(channelId: string): Promise<INostrEvent[]>;
        fetchMessageContactsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchDirectMessages(pubKey: string, sender: string, since?: number, until?: number): Promise<INostrEvent[]>;
        resetMessageCount(pubKey: string, sender: string): Promise<void>;
        fetchGroupKeys(identifier: string): Promise<INostrEvent>;
        fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
        fetchCalendarEventPosts(calendarEventUri: string): Promise<INostrEvent[]>;
        fetchCalendarEvents(start: number, end?: number, limit?: number): Promise<INostrEvent[]>;
        fetchCalendarEvent(address: Nip19.AddressPointer): Promise<INostrEvent | null>;
        fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string): Promise<INostrEvent[]>;
        fetchLongFormContentEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
        searchUsers(query: string): Promise<INostrEvent[]>;
        fetchPaymentRequestEvent(paymentRequest: string): Promise<INostrEvent>;
        fetchPaymentReceiptEvent(requestEventId: string): Promise<INostrEvent>;
        fetchPaymentActivitiesForRecipient(pubkey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
        fetchPaymentActivitiesForSender(pubKey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
        fetchUserFollowingFeed(pubKey: string, until?: number): Promise<INostrEvent[]>;
    }
    class NostrEventManagerRead implements ISocialEventManagerRead {
        protected _nostrCommunicationManager: INostrCommunicationManager;
        protected _privateKey: string;
        constructor(manager: INostrCommunicationManager);
        set nostrCommunicationManager(manager: INostrCommunicationManager);
        set privateKey(privateKey: string);
        fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
        fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
        fetchProfileFeedCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchProfileRepliesCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchHomeFeedCacheEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
        fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchContactListCacheEvents(pubKey: string, detailIncluded?: boolean): Promise<INostrEvent[]>;
        fetchUserRelays(pubKey: any): Promise<INostrEvent[]>;
        fetchFollowersCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<any>;
        fetchAllUserRelatedCommunities(pubKey: string): Promise<INostrEvent[]>;
        fetchUserBookmarkedCommunities(pubKey: string, excludedCommunity?: ICommunityInfo): Promise<ICommunityBasicInfo[]>;
        fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
        fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
        fetchCommunitiesFeed(communityUriArr: string[]): Promise<INostrEvent[]>;
        fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
        fetchNotes(options: IFetchNotesOptions): Promise<INostrEvent[]>;
        fetchAllUserRelatedChannels(pubKey: string): Promise<{
            channels: IChannelInfo[];
            channelMetadataMap: Record<string, IChannelInfo>;
            channelIdToCommunityMap: Record<string, ICommunityInfo>;
        }>;
        fetchUserBookmarkedChannelEventIds(pubKey: string): Promise<string[]>;
        fetchEventsByIds(ids: string[]): Promise<INostrEvent[]>;
        fetchChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchChannelInfoMessages(channelId: string): Promise<INostrEvent[]>;
        fetchMessageContactsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchDirectMessages(pubKey: string, sender: string, since?: number, until?: number): Promise<INostrEvent[]>;
        resetMessageCount(pubKey: string, sender: string): Promise<void>;
        fetchGroupKeys(identifier: string): Promise<INostrEvent>;
        fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
        fetchCalendarEvents(start: number, end?: number, limit?: number): Promise<INostrEvent[]>;
        fetchCalendarEvent(address: Nip19.AddressPointer): Promise<INostrEvent>;
        fetchCalendarEventPosts(calendarEventUri: string): Promise<INostrEvent[]>;
        fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string): Promise<INostrEvent[]>;
        fetchLongFormContentEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
        searchUsers(query: string): Promise<INostrEvent[]>;
        fetchPaymentRequestEvent(paymentRequest: string): Promise<INostrEvent>;
        fetchPaymentReceiptEvent(requestEventId: string): Promise<INostrEvent>;
        private getPaymentHash;
        fetchPaymentActivitiesForRecipient(pubkey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
        fetchPaymentActivitiesForSender(pubkey: string, since?: number, until?: number): Promise<IPaymentActivity[]>;
        fetchUserFollowingFeed(pubKey: string, until?: number): Promise<INostrEvent[]>;
    }
    export { NostrEventManagerRead, ISocialEventManagerRead };
}
/// <amd-module name="@scom/scom-social-sdk/managers/eventManagerReadV2.ts" />
declare module "@scom/scom-social-sdk/managers/eventManagerReadV2.ts" {
    import { Nip19 } from "@scom/scom-social-sdk/core/index.ts";
    import { IChannelInfo, ICommunityBasicInfo, ICommunityInfo, INostrEvent } from "@scom/scom-social-sdk/utils/interfaces.ts";
    import { INostrRestAPIManager } from "@scom/scom-social-sdk/managers/communication.ts";
    import { ISocialEventManagerRead, NostrEventManagerRead } from "@scom/scom-social-sdk/managers/eventManagerRead.ts";
    class NostrEventManagerReadV2 extends NostrEventManagerRead implements ISocialEventManagerRead {
        protected _nostrCommunicationManager: INostrRestAPIManager;
        constructor(manager: INostrRestAPIManager);
        set nostrCommunicationManager(manager: INostrRestAPIManager);
        protected augmentWithAuthInfo(obj: Record<string, any>): Record<string, any>;
        fetchThreadCacheEvents(id: string, pubKey?: string): Promise<INostrEvent[]>;
        fetchTrendingCacheEvents(pubKey?: string): Promise<INostrEvent[]>;
        fetchProfileFeedCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchProfileRepliesCacheEvents(userPubkey: string, pubKey: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchHomeFeedCacheEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchUserProfileCacheEvents(pubKeys: string[]): Promise<INostrEvent[]>;
        fetchUserProfileDetailCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchContactListCacheEvents(pubKey: string, detailIncluded?: boolean): Promise<INostrEvent[]>;
        fetchUserRelays(pubKey: string): Promise<INostrEvent[]>;
        fetchFollowersCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchCommunities(pubkeyToCommunityIdsMap?: Record<string, string[]>): Promise<any>;
        fetchAllUserRelatedCommunities(pubKey: string): Promise<INostrEvent[]>;
        fetchUserBookmarkedCommunities(pubKey: string, excludedCommunity?: ICommunityInfo): Promise<ICommunityBasicInfo[]>;
        fetchCommunity(creatorId: string, communityId: string): Promise<INostrEvent[]>;
        fetchCommunityFeed(creatorId: string, communityId: string): Promise<INostrEvent[]>;
        fetchCommunitiesGeneralMembers(communities: ICommunityBasicInfo[]): Promise<INostrEvent[]>;
        fetchAllUserRelatedChannels(pubKey: string): Promise<{
            channels: IChannelInfo[];
            channelMetadataMap: Record<string, IChannelInfo>;
            channelIdToCommunityMap: Record<string, ICommunityInfo>;
        }>;
        fetchUserBookmarkedChannelEventIds(pubKey: string): Promise<any>;
        fetchEventsByIds(ids: string[]): Promise<INostrEvent[]>;
        fetchChannelMessages(channelId: string, since?: number, until?: number): Promise<INostrEvent[]>;
        fetchChannelInfoMessages(channelId: string): Promise<INostrEvent[]>;
        fetchMessageContactsCacheEvents(pubKey: string): Promise<INostrEvent[]>;
        fetchDirectMessages(pubKey: string, sender: string, since?: number, until?: number): Promise<INostrEvent[]>;
        resetMessageCount(pubKey: string, sender: string): Promise<void>;
        fetchGroupKeys(identifier: string): Promise<INostrEvent>;
        fetchUserGroupInvitations(groupKinds: number[], pubKey: string): Promise<INostrEvent[]>;
        fetchCalendarEvents(start: number, end?: number, limit?: number): Promise<INostrEvent[]>;
        fetchCalendarEvent(address: Nip19.AddressPointer): Promise<INostrEvent>;
        fetchCalendarEventPosts(calendarEventUri: string): Promise<INostrEvent[]>;
        fetchCalendarEventRSVPs(calendarEventUri: string, pubkey?: string): Promise<INostrEvent[]>;
        fetchLongFormContentEvents(pubKey?: string, since?: number, until?: number): Promise<INostrEvent[]>;
        searchUsers(query: string): Promise<any[]>;
        fetchPaymentRequestEvent(paymentRequest: string): Promise<any>;
        fetchPaymentActivitiesForRecipient(pubkey: string, since?: number, until?: number): Promise<any[]>;
        fetchPaymentActivitiesForSender(pubkey: string, since?: number, until?: number): Promise<any[]>;
        fetchUserFollowingFeed(pubKey: string, until?: number): Promise<any[]>;
    }
    export { NostrEventManagerReadV2 };
}
/// <amd-module name="@scom/scom-social-sdk/managers/index.ts" />
declare module "@scom/scom-social-sdk/managers/index.ts" {
    import { ICalendarEventDetailInfo, ICalendarEventInfo, IChannelInfo, ICommunity, ICommunityInfo, ICommunityMember, ICommunityPostScpData, IConversationPath, ILocationCoordinates, ILongFormContentInfo, IMessageContactInfo, INewCommunityInfo, INostrEvent, INostrMetadata, INostrMetadataContent, INoteActions, INoteCommunityInfo, INoteInfo, IPostStats, IRetrieveChannelMessageKeysOptions, IRetrieveCommunityPostKeysByNoteEventsOptions, IRetrieveCommunityPostKeysOptions, IRetrieveCommunityThreadPostKeysOptions, ISocialDataManagerConfig, IUpdateCalendarEventInfo, IUserActivityStats, IUserProfile } from "@scom/scom-social-sdk/utils/interfaces.ts";
    import { NostrRestAPIManager, NostrWebSocketManager } from "@scom/scom-social-sdk/managers/communication.ts";
    import { ITweets } from "@scom/scom-social-sdk/managers/scraperManager.ts";
    import { SocialUtilsManager } from "@scom/scom-social-sdk/managers/utilsManager.ts";
    import { ISocialEventManagerWrite, NostrEventManagerWrite } from "@scom/scom-social-sdk/managers/eventManagerWrite.ts";
    import { ISocialEventManagerRead, NostrEventManagerRead } from "@scom/scom-social-sdk/managers/eventManagerRead.ts";
    import { NostrEventManagerReadV2 } from "@scom/scom-social-sdk/managers/eventManagerReadV2.ts";
    class SocialDataManager {
        private _writeRelays;
        private _publicIndexingRelay;
        private _apiBaseUrl;
        private _ipLocationServiceBaseUrl;
        private _socialEventManagerRead;
        private _socialEventManagerWrite;
        private _privateKey;
        private mqttManager;
        private lightningWalletManager;
        private scraperManager;
        constructor(config: ISocialDataManagerConfig);
        dispose(): Promise<void>;
        set privateKey(privateKey: string);
        get socialEventManagerRead(): ISocialEventManagerRead;
        get socialEventManagerWrite(): ISocialEventManagerWrite;
        set relays(value: string[]);
        private _setRelays;
        subscribeToMqttTopics(topics: string[]): void;
        unsubscribeFromMqttTopics(topics: string[]): void;
        publishToMqttTopic(topic: string, message: string): void;
        retrieveCommunityEvents(creatorId: string, communityId: string): Promise<{
            notes: INoteInfo[];
            info: ICommunityInfo;
        }>;
        retrieveCommunityUri(noteEvent: INostrEvent, scpData: ICommunityPostScpData): string;
        retrievePostPrivateKey(event: INostrEvent, communityUri: string, communityPrivateKey: string): Promise<string>;
        retrieveChannelMessagePrivateKey(event: INostrEvent, channelId: string, communityPrivateKey: string): Promise<string>;
        retrieveCommunityPrivateKey(communityInfo: ICommunityInfo, selfPrivateKey: string): Promise<string>;
        private retrieveInviteOnlyCommunityNotePrivateKeys;
        retrieveCommunityPostKeys(options: IRetrieveCommunityPostKeysOptions): Promise<Record<string, string>>;
        retrieveCommunityThreadPostKeys(options: IRetrieveCommunityThreadPostKeysOptions): Promise<Record<string, string>>;
        retrieveCommunityPostKeysByNoteEvents(options: IRetrieveCommunityPostKeysByNoteEventsOptions): Promise<Record<string, string>>;
        constructMetadataByPubKeyMap(notes: INostrEvent[]): Promise<Record<string, INostrMetadata>>;
        fetchUserProfiles(pubKeys: string[]): Promise<IUserProfile[]>;
        updateUserProfile(content: INostrMetadataContent): Promise<void>;
        fetchTrendingNotesInfo(): Promise<{
            notes: INoteInfo[];
            metadataByPubKeyMap: Record<string, INostrMetadata>;
        }>;
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
        fetchNotesByIds(ids: string[]): Promise<INostrEvent[]>;
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
        };
        fetchCommunityInfo(creatorId: string, communityId: string): Promise<ICommunityInfo>;
        fetchCommunityFeedInfo(): Promise<{
            info: ICommunityInfo;
            notes: INostrEvent[];
        }[]>;
        fetchUserRelatedCommunityFeedInfo(pubKey: string): Promise<{
            info: ICommunityInfo;
            notes: INostrEvent[];
        }[]>;
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
        retrieveUserProfileDetail(pubKey: string): Promise<{
            userProfile: IUserProfile;
            stats: IUserActivityStats;
        }>;
        private constructUserProfile;
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
        updateCommunityChannel(communityInfo: ICommunityInfo): Promise<import("@scom/scom-social-sdk/utils/interfaces.ts").INostrSubmitResponse[]>;
        createChannel(channelInfo: IChannelInfo, memberIds: string[]): Promise<IChannelInfo>;
        updateChannel(channelInfo: IChannelInfo): Promise<import("@scom/scom-social-sdk/utils/interfaces.ts").INostrSubmitResponse[]>;
        fetchCommunitiesMembers(communities: ICommunityInfo[]): Promise<Record<string, ICommunityMember[]>>;
        fetchCommunities(): Promise<ICommunity[]>;
        fetchMyCommunities(pubKey: string): Promise<ICommunity[]>;
        joinCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
        leaveCommunity(community: ICommunityInfo, pubKey: string): Promise<void>;
        private encryptGroupMessage;
        submitCommunityPost(message: string, info: ICommunityInfo, conversationPath?: IConversationPath): Promise<void>;
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
        sendDirectMessage(chatId: string, message: string, replyToEventId?: string): Promise<void>;
        resetMessageCount(selfPubKey: string, senderPubKey: string): Promise<void>;
        fetchMessageContacts(pubKey: string): Promise<IMessageContactInfo[]>;
        fetchUserGroupInvitations(pubKey: string): Promise<string[]>;
        private mapCommunityUriToMemberIdRoleCombo;
        private extractCalendarEventInfo;
        updateCalendarEvent(updateCalendarEventInfo: IUpdateCalendarEventInfo): Promise<string>;
        retrieveCalendarEventsByDateRange(start: number, end?: number, limit?: number): Promise<ICalendarEventInfo[]>;
        retrieveCalendarEvent(naddr: string): Promise<ICalendarEventDetailInfo>;
        acceptCalendarEvent(rsvpId: string, naddr: string): Promise<void>;
        declineCalendarEvent(rsvpId: string, naddr: string): Promise<void>;
        submitCalendarEventPost(naddr: string, message: string, conversationPath?: IConversationPath): Promise<string>;
        fetchTimezones(): Promise<any[]>;
        fetchCitiesByKeyword(keyword: string): Promise<any[]>;
        fetchCitiesByCoordinates(latitude: number, longitude: number): Promise<any[]>;
        fetchLocationInfoFromIP(): Promise<ILocationCoordinates>;
        private fetchEventMetadataFromIPFS;
        getAccountBalance(walletAddress: string): Promise<any>;
        getNFTsByOwner(walletAddress: string): Promise<any>;
        submitMessage(message: string, conversationPath?: IConversationPath): Promise<string>;
        submitLongFormContent(info: ILongFormContentInfo): Promise<void>;
        submitLike(postEventData: INostrEvent): Promise<void>;
        submitRepost(postEventData: INostrEvent): Promise<void>;
        sendPingRequest(pubkey: string, relayUrl?: string): Promise<any>;
        checkRelayStatus(pubkey: string, relayUrl?: string): Promise<any>;
        fetchUnreadMessageCounts(pubkey: string): Promise<any>;
        updateMessageLastReadReceipt(pubkey: string, walletAddress: string, signature: string, fromId: string): Promise<any>;
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
        fetchUserPaymentActivities(pubkey: string, since?: number, until?: number): Promise<import("@scom/scom-social-sdk/utils/interfaces.ts").IPaymentActivity[]>;
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
        fetchTwitterUserIdByUsername(username: string): Promise<string>;
        fetchTweetsByUsername(username: string, maxTweets?: number): Promise<ITweets[]>;
    }
    export { NostrEventManagerRead, NostrEventManagerReadV2, NostrEventManagerWrite, ISocialEventManagerRead, ISocialEventManagerWrite, SocialUtilsManager, SocialDataManager, NostrRestAPIManager, NostrWebSocketManager };
}
/// <amd-module name="@scom/scom-social-sdk" />
declare module "@scom/scom-social-sdk" {
    export { Event, Keys, Nip19, Bech32, } from "@scom/scom-social-sdk/core/index.ts";
    export { IFetchNotesOptions, INostrMetadataContent, INostrEvent, ICommunityBasicInfo, ICommunityInfo, ICommunityScpData, INoteInfo, INoteInfoExtended, INoteCommunityInfo, ICommunityGatekeeperInfo, IUserProfile, IUserActivityStats, IPostStats, IChannelInfo, IMessageContactInfo, INewCommunityInfo, MembershipType, CommunityRole, ICommunityMember, ICommunity, CalendarEventType, ICalendarEventInfo, IUpdateCalendarEventInfo, ICalendarEventHost, ICalendarEventAttendee, ICalendarEventDetailInfo, INewCalendarEventPostInfo, ILocationCoordinates, ISocialDataManagerConfig, IPaymentActivity, INostrFetchEventsResponse, MqttManager } from "@scom/scom-social-sdk/utils/index.ts";
    export { NostrEventManagerRead, NostrEventManagerReadV2, NostrEventManagerWrite, ISocialEventManagerRead, ISocialEventManagerWrite, SocialUtilsManager, SocialDataManager, NostrWebSocketManager, NostrRestAPIManager } from "@scom/scom-social-sdk/managers/index.ts";
}
