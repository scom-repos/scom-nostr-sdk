/*! noble-curves - MIT License (c) 2022 Paul Miller (paulmillr.com) */
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
export declare function bytesToHex(bytes: Uint8Array): string;
export declare function numberToHexUnpadded(num: number | bigint): string;
export declare function hexToNumber(hex: string): bigint;
export declare function hexToBytes(hex: string): Uint8Array;
export declare function bytesToNumberBE(bytes: Uint8Array): bigint;
export declare function bytesToNumberLE(bytes: Uint8Array): bigint;
export declare function numberToBytesBE(n: number | bigint, len: number): Uint8Array;
export declare function numberToBytesLE(n: number | bigint, len: number): Uint8Array;
export declare function numberToVarBytesBE(n: number | bigint): Uint8Array;
export declare function ensureBytes(title: string, hex: Hex, expectedLength?: number): Uint8Array;
export declare function concatBytes(...arrays: Uint8Array[]): Uint8Array;
export declare function equalBytes(b1: Uint8Array, b2: Uint8Array): boolean;
export declare function utf8ToBytes(str: string): Uint8Array;
export declare function bitLen(n: bigint): any;
export declare function bitGet(n: bigint, pos: number): bigint;
export declare const bitSet: (n: bigint, pos: number, value: boolean) => bigint;
export declare const bitMask: (n: number) => bigint;
type Pred<T> = (v: Uint8Array) => T | undefined;
export declare function createHmacDrbg<T>(hashLen: number, qByteLen: number, hmacFn: (key: Uint8Array, ...messages: Uint8Array[]) => Uint8Array): (seed: Uint8Array, predicate: Pred<T>) => T;
declare const validatorFns: {
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
export declare function validateObject<T extends Record<string, any>>(object: T, validators: ValMap<T>, optValidators?: ValMap<T>): T;
export {};
