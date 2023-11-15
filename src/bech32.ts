// adopted from https://github.com/paulmillr/scure-base
/**
 * @__NO_SIDE_EFFECTS__
 */
export function assertNumber(n: number) {
  if (!Number.isSafeInteger(n)) throw new Error(`Wrong integer: ${n}`);
}
export interface Coder<F, T> {
  encode(from: F): T;
  decode(to: T): F;
}
type Chain = [Coder<any, any>, ...Coder<any, any>[]];
// Extract info from Coder type
type Input<F> = F extends Coder<infer T, any> ? T : never;
type Output<F> = F extends Coder<any, infer T> ? T : never;
// Generic function for arrays
type First<T> = T extends [infer U, ...any[]] ? U : never;
type Last<T> = T extends [...any[], infer U] ? U : never;
type Tail<T> = T extends [any, ...infer U] ? U : never;
type AsChain<C extends Chain, Rest = Tail<C>> = {
  // C[K] = Coder<Input<C[K]>, Input<Rest[k]>>
  [K in keyof C]: Coder<Input<C[K]>, Input<K extends keyof Rest ? Rest[K] : any>>;
};
/**
 * @__NO_SIDE_EFFECTS__
 */
function chain<T extends Chain & AsChain<T>>(...args: T): Coder<Input<First<T>>, Output<Last<T>>> {
  // Wrap call in closure so JIT can inline calls
  const wrap = (a: any, b: any) => (c: any) => a(b(c));
  // Construct chain of args[-1].encode(args[-2].encode([...]))
  const encode = Array.from(args)
    .reverse()
    .reduce((acc, i: any) => (acc ? wrap(acc, i.encode) : i.encode), undefined) as any;
  // Construct chain of args[0].decode(args[1].decode(...))
  const decode = args.reduce(
    (acc, i: any) => (acc ? wrap(acc, i.decode) : i.decode),
    undefined
  ) as any;
  return { encode, decode };
}
type Alphabet = string[] | string;
/**
 * Encodes integer radix representation to array of strings using alphabet and back
 * @__NO_SIDE_EFFECTS__
 */
function alphabet(alphabet: Alphabet): Coder<number[], string[]> {
  return {
    encode: (digits: number[]) => {
      if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
        throw new Error('alphabet.encode input should be an array of numbers');
      return digits.map((i) => {
        assertNumber(i);
        if (i < 0 || i >= alphabet.length)
          throw new Error(`Digit index outside alphabet: ${i} (alphabet: ${alphabet.length})`);
        return alphabet[i]!;
      });
    },
    decode: (input: string[]) => {
      if (!Array.isArray(input) || (input.length && typeof input[0] !== 'string'))
        throw new Error('alphabet.decode input should be array of strings');
      return input.map((letter) => {
        if (typeof letter !== 'string')
          throw new Error(`alphabet.decode: not string element=${letter}`);
        const index = alphabet.indexOf(letter);
        if (index === -1) throw new Error(`Unknown letter: "${letter}". Allowed: ${alphabet}`);
        return index;
      });
    },
  };
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function join(separator = ''): Coder<string[], string> {
  if (typeof separator !== 'string') throw new Error('join separator should be string');
  return {
    encode: (from) => {
      if (!Array.isArray(from) || (from.length && typeof from[0] !== 'string'))
        throw new Error('join.encode input should be array of strings');
      for (let i of from)
        if (typeof i !== 'string') throw new Error(`join.encode: non-string input=${i}`);
      return from.join(separator);
    },
    decode: (to) => {
      if (typeof to !== 'string') throw new Error('join.decode input should be string');
      return to.split(separator);
    },
  };
}

const gcd = /* @__NO_SIDE_EFFECTS__ */ (a: number, b: number): number => (!b ? a : gcd(b, a % b));
const radix2carry = /*@__NO_SIDE_EFFECTS__ */ (from: number, to: number) =>
  from + (to - gcd(from, to));
/**
 * Implemented with numbers, because BigInt is 5x slower
 * @__NO_SIDE_EFFECTS__
 */
function convertRadix2(data: number[], from: number, to: number, padding: boolean): number[] {
  if (!Array.isArray(data)) throw new Error('convertRadix2: data should be array');
  if (from <= 0 || from > 32) throw new Error(`convertRadix2: wrong from=${from}`);
  if (to <= 0 || to > 32) throw new Error(`convertRadix2: wrong to=${to}`);
  if (radix2carry(from, to) > 32) {
    throw new Error(
      `convertRadix2: carry overflow from=${from} to=${to} carryBits=${radix2carry(from, to)}`
    );
  }
  let carry = 0;
  let pos = 0; // bitwise position in current element
  const mask = 2 ** to - 1;
  const res: number[] = [];
  for (const n of data) {
    assertNumber(n);
    if (n >= 2 ** from) throw new Error(`convertRadix2: invalid data word=${n} from=${from}`);
    carry = (carry << from) | n;
    if (pos + from > 32) throw new Error(`convertRadix2: carry overflow pos=${pos} from=${from}`);
    pos += from;
    for (; pos >= to; pos -= to) res.push(((carry >> (pos - to)) & mask) >>> 0);
    carry &= 2 ** pos - 1; // clean carry, otherwise it will cause overflow
  }
  carry = (carry << (to - pos)) & mask;
  if (!padding && pos >= from) throw new Error('Excess padding');
  if (!padding && carry) throw new Error(`Non-zero padding: ${carry}`);
  if (padding && pos > 0) res.push(carry >>> 0);
  return res;
}
/**
 * If both bases are power of same number (like `2**8 <-> 2**64`),
 * there is a linear algorithm. For now we have implementation for power-of-two bases only.
 * @__NO_SIDE_EFFECTS__
 */
function radix2(bits: number, revPadding = false): Coder<Uint8Array, number[]> {
  assertNumber(bits);
  if (bits <= 0 || bits > 32) throw new Error('radix2: bits should be in (0..32]');
  if (radix2carry(8, bits) > 32 || radix2carry(bits, 8) > 32)
    throw new Error('radix2: carry overflow');
  return {
    encode: (bytes: Uint8Array) => {
      if (!(bytes instanceof Uint8Array))
        throw new Error('radix2.encode input should be Uint8Array');
      return convertRadix2(Array.from(bytes), 8, bits, !revPadding);
    },
    decode: (digits: number[]) => {
      if (!Array.isArray(digits) || (digits.length && typeof digits[0] !== 'number'))
        throw new Error('radix2.decode input should be array of strings');
      return Uint8Array.from(convertRadix2(digits, bits, 8, revPadding));
    },
  };
}
type ArgumentTypes<F extends Function> = F extends (...args: infer A) => any ? A : never;
/**
 * @__NO_SIDE_EFFECTS__
 */
function unsafeWrapper<T extends (...args: any) => any>(fn: T) {
  if (typeof fn !== 'function') throw new Error('unsafeWrapper fn should be function');
  return function (...args: ArgumentTypes<T>): ReturnType<T> | void {
    try {
      return fn.apply(null, args);
    } catch (e) {}
  };
}
// Bech32 code
// -----------
export interface Bech32Decoded<Prefix extends string = string> {
  prefix: Prefix;
  words: number[];
}
export interface Bech32DecodedWithArray<Prefix extends string = string> {
  prefix: Prefix;
  words: number[];
  bytes: Uint8Array;
}
const BECH_ALPHABET: Coder<number[], string> = /* @__PURE__ */ chain(
  alphabet('qpzry9x8gf2tvdw0s3jn54khce6mua7l'),
  join('')
);
const POLYMOD_GENERATORS = [0x3b6a57b2, 0x26508e6d, 0x1ea119fa, 0x3d4233dd, 0x2a1462b3];
/**
 * @__NO_SIDE_EFFECTS__
 */
function bech32Polymod(pre: number): number {
  const b = pre >> 25;
  let chk = (pre & 0x1ffffff) << 5;
  for (let i = 0; i < POLYMOD_GENERATORS.length; i++) {
    if (((b >> i) & 1) === 1) chk ^= POLYMOD_GENERATORS[i]!;
  }
  return chk;
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function bechChecksum(prefix: string, words: number[], encodingConst = 1): string {
  const len = prefix.length;
  let chk = 1;
  for (let i = 0; i < len; i++) {
    const c = prefix.charCodeAt(i);
    if (c < 33 || c > 126) throw new Error(`Invalid prefix (${prefix})`);
    chk = bech32Polymod(chk) ^ (c >> 5);
  }
  chk = bech32Polymod(chk);
  for (let i = 0; i < len; i++) chk = bech32Polymod(chk) ^ (prefix.charCodeAt(i) & 0x1f);
  for (let v of words) chk = bech32Polymod(chk) ^ v;
  for (let i = 0; i < 6; i++) chk = bech32Polymod(chk);
  chk ^= encodingConst;
  return BECH_ALPHABET.encode(convertRadix2([chk % 2 ** 30], 30, 5, false));
}
/**
 * @__NO_SIDE_EFFECTS__
 */
function genBech32(encoding: 'bech32' | 'bech32m') {
  const ENCODING_CONST = encoding === 'bech32' ? 1 : 0x2bc830a3;
  const _words = radix2(5);
  const fromWords = _words.decode;
  const toWords = _words.encode;
  const fromWordsUnsafe = unsafeWrapper(fromWords);

  function encode<Prefix extends string>(
    prefix: Prefix,
    words: number[] | Uint8Array,
    limit: number | false = 90
  ): `${Lowercase<Prefix>}1${string}` {
    if (typeof prefix !== 'string')
      throw new Error(`bech32.encode prefix should be string, not ${typeof prefix}`);
    if (!Array.isArray(words) || (words.length && typeof words[0] !== 'number'))
      throw new Error(`bech32.encode words should be array of numbers, not ${typeof words}`);
    const actualLength = prefix.length + 7 + words.length;
    if (limit !== false && actualLength > limit)
      throw new TypeError(`Length ${actualLength} exceeds limit ${limit}`);
    const lowered = prefix.toLowerCase();
    const sum = bechChecksum(lowered, words, ENCODING_CONST);
    return `${lowered}1${BECH_ALPHABET.encode(words)}${sum}` as `${Lowercase<Prefix>}1${string}`;
  }

  function decode<Prefix extends string>(
    str: `${Prefix}1${string}`,
    limit?: number | false
  ): Bech32Decoded<Prefix>;
  function decode(str: string, limit?: number | false): Bech32Decoded;
  function decode(str: string, limit: number | false = 90): Bech32Decoded {
    if (typeof str !== 'string')
      throw new Error(`bech32.decode input should be string, not ${typeof str}`);
    if (str.length < 8 || (limit !== false && str.length > limit))
      throw new TypeError(`Wrong string length: ${str.length} (${str}). Expected (8..${limit})`);
    // don't allow mixed case
    const lowered = str.toLowerCase();
    if (str !== lowered && str !== str.toUpperCase())
      throw new Error(`String must be lowercase or uppercase`);
    str = lowered;
    const sepIndex = str.lastIndexOf('1');
    if (sepIndex === 0 || sepIndex === -1)
      throw new Error(`Letter "1" must be present between prefix and data only`);
    const prefix = str.slice(0, sepIndex);
    const _words = str.slice(sepIndex + 1);
    if (_words.length < 6) throw new Error('Data must be at least 6 characters long');
    const words = BECH_ALPHABET.decode(_words).slice(0, -6);
    const sum = bechChecksum(prefix, words, ENCODING_CONST);
    if (!_words.endsWith(sum)) throw new Error(`Invalid checksum in ${str}: expected "${sum}"`);
    return { prefix, words };
  }

  const decodeUnsafe = unsafeWrapper(decode);

  function decodeToBytes(str: string): Bech32DecodedWithArray {
    const { prefix, words } = decode(str, false);
    return { prefix, words, bytes: fromWords(words) };
  }

  return { encode, decode, decodeToBytes, decodeUnsafe, fromWords, fromWordsUnsafe, toWords };
}
export const bech32 = /* @__PURE__ */ genBech32('bech32');
export const bech32m = /* @__PURE__ */ genBech32('bech32m');
