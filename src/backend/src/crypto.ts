/**
 * AgentChat Cryptographic Utilities
 * End-to-end encryption using X25519 + XSalsa20-Poly1305 (NaCl box)
 */

import nacl from 'tweetnacl';

// ============================================================================
// KEY GENERATION
// ============================================================================

export async function generateKeyPair(): Promise<{ publicKey: string; privateKey: string }> {
  const keyPair = nacl.box.keyPair();
  return {
    publicKey: arrayBufferToBase64(keyPair.publicKey),
    privateKey: arrayBufferToBase64(keyPair.secretKey),
  };
}

export function generateId(prefix: string): string {
  const random = crypto.randomUUID().replace(/-/g, '').slice(0, 16);
  return `${prefix}_${random}`;
}

// ============================================================================
// ENCRYPTION / DECRYPTION
// ============================================================================

export interface EncryptedData {
  ciphertext: string;
  nonce: string;
}

export function encryptMessage(
  message: string,
  recipientPublicKey: string,
  senderPrivateKey: string
): EncryptedData {
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

// ============================================================================
// CHANNEL KEY MANAGEMENT
// ============================================================================

export async function generateChannelKey(): Promise<Uint8Array> {
  return nacl.randomBytes(nacl.secretbox.keyLength);
}

export function exportChannelKey(key: Uint8Array): string {
  return arrayBufferToBase64(key);
}

export function importChannelKey(keyBase64: string): Uint8Array {
  return base64ToUint8Array(keyBase64);
}

export function encryptChannelKeyForRecipient(
  channelKey: Uint8Array,
  recipientPublicKey: string,
  senderPrivateKey: string
): EncryptedData {
  const pubKey = base64ToUint8Array(recipientPublicKey);
  const privKey = base64ToUint8Array(senderPrivateKey);
  const nonce = nacl.randomBytes(nacl.box.nonceLength);
  
  const encrypted = nacl.box(channelKey, nonce, pubKey, privKey);
  
  return {
    ciphertext: arrayBufferToBase64(encrypted),
    nonce: arrayBufferToBase64(nonce),
  };
}

export function decryptChannelKey(
  encryptedKey: string,
  nonce: string,
  senderPublicKey: string,
  recipientPrivateKey: string
): Uint8Array | null {
  const cipherBytes = base64ToUint8Array(encryptedKey);
  const nonceBytes = base64ToUint8Array(nonce);
  const pubKey = base64ToUint8Array(senderPublicKey);
  const privKey = base64ToUint8Array(recipientPrivateKey);
  
  return nacl.box.open(cipherBytes, nonceBytes, pubKey, privKey);
}

// ============================================================================
// SIGNING (for authentication)
// ============================================================================

export function signMessage(message: string, privateKey: string): string {
  const privKey = base64ToUint8Array(privateKey);
  const messageBytes = new TextEncoder().encode(message);
  const signature = nacl.sign.detached(messageBytes, privKey);
  return arrayBufferToBase64(signature);
}

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

// ============================================================================
// UTILITIES
// ============================================================================

export function arrayBufferToBase64(buffer: Uint8Array): string {
  const bytes = new Uint8Array(buffer);
  let binary = '';
  for (let i = 0; i < bytes.byteLength; i++) {
    binary += String.fromCharCode(bytes[i]);
  }
  return btoa(binary);
}

export function base64ToUint8Array(base64: string): Uint8Array {
  const binary = atob(base64);
  const bytes = new Uint8Array(binary.length);
  for (let i = 0; i < binary.length; i++) {
    bytes[i] = binary.charCodeAt(i);
  }
  return bytes;
}

export async function sha256(message: string): Promise<string> {
  const msgBuffer = new TextEncoder().encode(message);
  const hashBuffer = await crypto.subtle.digest('SHA-256', msgBuffer);
  return arrayBufferToBase64(new Uint8Array(hashBuffer));
}

// ============================================================================
// NONCE GENERATION
// ============================================================================

export function generateNonce(): string {
  return arrayBufferToBase64(nacl.randomBytes(nacl.box.nonceLength));
}
