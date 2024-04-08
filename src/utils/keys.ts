// adopted from https://github.com/nbd-wtf/nostr-tools
import { schnorr, schnorrGetExtPubKeyY, secp256k1 } from './curves/secp256k1'
import { bytesToHex } from './hashes/utils'

export function generatePrivateKey(): string {
    return bytesToHex(schnorr.utils.randomPrivateKey())
};
export function getPublicKey(privateKey: string): string {
    return bytesToHex(schnorr.getPublicKey(privateKey))
};
export function getPublicKeyY(privateKey: string): string {
    return bytesToHex(schnorrGetExtPubKeyY(privateKey))
};
export function getSharedSecret(privateKey: string, publicKey: string): string {
    if (!publicKey.startsWith('02'))
        publicKey = '02' + publicKey;
    return bytesToHex(secp256k1.getSharedSecret(privateKey, publicKey))
};
export function decompressPublicKey(publicKey: string): string {
    const decompressedPublicKey = secp256k1.ProjectivePoint.fromHex(publicKey).toHex(false);
    return decompressedPublicKey;
};
