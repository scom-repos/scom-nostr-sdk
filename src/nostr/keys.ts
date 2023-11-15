// adopted from https://github.com/nbd-wtf/nostr-tools
import { schnorr, schnorrGetExtPubKeyY } from '../curves/secp256k1'
import { bytesToHex } from '../hashes/utils'

export function generatePrivateKey(): string {
  return bytesToHex(schnorr.utils.randomPrivateKey())
}

export function getPublicKey(privateKey: string): string {
  return bytesToHex(schnorr.getPublicKey(privateKey))
}

export function getPublicKeyY(privateKey: string): string {
  return bytesToHex(schnorrGetExtPubKeyY(privateKey))
}
