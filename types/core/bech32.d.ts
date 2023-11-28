export declare function assertNumber(n: number): void;
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
export declare const bech32: {
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
export declare const bech32m: {
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
