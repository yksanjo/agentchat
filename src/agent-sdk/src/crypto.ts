/**
 * AgentChat SDK Crypto Utilities
 * Helper functions for encryption/decryption
 */

import nacl from 'tweetnacl';

/**
 * Generate a new X25519 key pair
 */
export function generateKeyPair(): { publicKey: string; privateKey: string } {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: arrayBufferToBase64(keyPair.publicKey),
    privateKey: arrayBufferToBase64(keyPair.secretKey),
  };
}

/**
 * Encrypt a message for a recipient
 */
export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderPrivateKey: string
): { ciphertext: string; nonce: string } {
  const pubKey = base64ToUint8Array(recipientPublicKey);
  const privKey = base64ToUint8Array(senderPrivateKey);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  const messageBytes = new TextEncoder().encode(message);

  const encrypted = nacl.box(messageBytes, nonce, pubKey, privKey);

  return {
    ciphertext: arrayBufferToBase64(encrypted),
    nonce: arrayBufferToBase64(nonce),
  };
}

/**
 * Decrypt a message from a sender
 */
export function decryptMessage(
  ciphertext: string,
  nonce: string,
  senderPublicKey: string,
  recipientPrivateKey: string
): string | null {
  const cipherBytes = base64ToUint8Array(ciphertext);
  const nonceBytes = base64ToUint8Array(nonce);
  const pubKey = base64ToUint8Array(senderPublicKey);
  const privKey = base64ToUint8Array(recipientPrivateKey);

  const decrypted = nacl.box.open(cipherBytes, nonceBytes, pubKey, privKey);

  if (!decrypted) {
    return null;
  }

  return new TextDecoder().decode(decrypted);
}

/**
 * Sign a message with private key
 */
export function signMessage(message: string, privateKey: string): string {
  const privKey = base64ToUint8Array(privateKey);
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, privKey);
  return arrayBufferToBase64(signature);
}

/**
 * Verify a signature
 */
export function verifySignature(
  message: string,
  signature: string,
  publicKey: string
): boolean {
  const pubKey = base64ToUint8Array(publicKey);
  const sigBytes = base64ToUint8Array(signature);
  const messageBytes = new TextEncoder().encode(message);

  return nacl.sign.detached.verify(messageBytes, sigBytes, pubKey);
}

// Helpers
function arrayBufferToBase64(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}
