import CryptoJS from 'crypto-js';

/**
 * Encryption Service
 * 
 * Provides end-to-end encryption for messages using the Web Crypto API
 * and CryptoJS for compatibility and ease of use.
 */
const encryptionService = {
  /**
   * Generate a new key pair for a user
   * 
   * @returns {Promise<Object>} Object containing public and private keys
   */
  generateKeyPair: async () => {
    try {
      // Generate RSA key pair
      const keyPair = await window.crypto.subtle.generateKey(
        {
          name: 'RSA-OAEP',
          modulusLength: 2048,
          publicExponent: new Uint8Array([1, 0, 1]),
          hash: 'SHA-256',
        },
        true, // extractable
        ['encrypt', 'decrypt']
      );

      // Export keys to JWK format
      const publicKey = await window.crypto.subtle.exportKey('jwk', keyPair.publicKey);
      const privateKey = await window.crypto.subtle.exportKey('jwk', keyPair.privateKey);

      return {
        publicKey: JSON.stringify(publicKey),
        privateKey: JSON.stringify(privateKey)
      };
    } catch (error) {
      console.error('Error generating key pair:', error);
      throw new Error('Failed to generate encryption keys');
    }
  },

  /**
   * Import a public key from JWK format
   * 
   * @param {string} jwkString - Public key in JWK format as a string
   * @returns {Promise<CryptoKey>} Imported public key
   */
  importPublicKey: async (jwkString) => {
    try {
      const jwk = JSON.parse(jwkString);
      return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['encrypt']
      );
    } catch (error) {
      console.error('Error importing public key:', error);
      throw new Error('Failed to import public key');
    }
  },

  /**
   * Import a private key from JWK format
   * 
   * @param {string} jwkString - Private key in JWK format as a string
   * @returns {Promise<CryptoKey>} Imported private key
   */
  importPrivateKey: async (jwkString) => {
    try {
      const jwk = JSON.parse(jwkString);
      return await window.crypto.subtle.importKey(
        'jwk',
        jwk,
        {
          name: 'RSA-OAEP',
          hash: 'SHA-256',
        },
        true,
        ['decrypt']
      );
    } catch (error) {
      console.error('Error importing private key:', error);
      throw new Error('Failed to import private key');
    }
  },

  /**
   * Generate a symmetric key for message encryption
   * 
   * @returns {Promise<CryptoKey>} Generated symmetric key
   */
  generateMessageKey: async () => {
    try {
      return await window.crypto.subtle.generateKey(
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error generating message key:', error);
      throw new Error('Failed to generate message key');
    }
  },

  /**
   * Export a symmetric key to raw format
   * 
   * @param {CryptoKey} key - Symmetric key to export
   * @returns {Promise<string>} Exported key as base64 string
   */
  exportMessageKey: async (key) => {
    try {
      const rawKey = await window.crypto.subtle.exportKey('raw', key);
      return btoa(String.fromCharCode(...new Uint8Array(rawKey)));
    } catch (error) {
      console.error('Error exporting message key:', error);
      throw new Error('Failed to export message key');
    }
  },

  /**
   * Import a symmetric key from raw format
   * 
   * @param {string} keyString - Symmetric key as base64 string
   * @returns {Promise<CryptoKey>} Imported symmetric key
   */
  importMessageKey: async (keyString) => {
    try {
      const rawKey = Uint8Array.from(atob(keyString), c => c.charCodeAt(0));
      return await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error importing message key:', error);
      throw new Error('Failed to import message key');
    }
  },

  /**
   * Encrypt a message key with a recipient's public key
   * 
   * @param {CryptoKey} messageKey - Symmetric message key
   * @param {CryptoKey} publicKey - Recipient's public key
   * @returns {Promise<string>} Encrypted message key as base64 string
   */
  encryptMessageKey: async (messageKey, publicKey) => {
    try {
      const rawKey = await window.crypto.subtle.exportKey('raw', messageKey);
      const encryptedKey = await window.crypto.subtle.encrypt(
        {
          name: 'RSA-OAEP',
        },
        publicKey,
        rawKey
      );
      return btoa(String.fromCharCode(...new Uint8Array(encryptedKey)));
    } catch (error) {
      console.error('Error encrypting message key:', error);
      throw new Error('Failed to encrypt message key');
    }
  },

  /**
   * Decrypt a message key with the user's private key
   * 
   * @param {string} encryptedKeyString - Encrypted message key as base64 string
   * @param {CryptoKey} privateKey - User's private key
   * @returns {Promise<CryptoKey>} Decrypted message key
   */
  decryptMessageKey: async (encryptedKeyString, privateKey) => {
    try {
      const encryptedKey = Uint8Array.from(atob(encryptedKeyString), c => c.charCodeAt(0));
      const rawKey = await window.crypto.subtle.decrypt(
        {
          name: 'RSA-OAEP',
        },
        privateKey,
        encryptedKey
      );
      return await window.crypto.subtle.importKey(
        'raw',
        rawKey,
        {
          name: 'AES-GCM',
          length: 256,
        },
        true,
        ['encrypt', 'decrypt']
      );
    } catch (error) {
      console.error('Error decrypting message key:', error);
      throw new Error('Failed to decrypt message key');
    }
  },

  /**
   * Encrypt a message with a symmetric key
   * 
   * @param {string} message - Message to encrypt
   * @param {CryptoKey} key - Symmetric key for encryption
   * @returns {Promise<Object>} Object containing encrypted message and IV
   */
  encryptMessage: async (message, key) => {
    try {
      // Generate a random initialization vector
      const iv = window.crypto.getRandomValues(new Uint8Array(12));
      
      // Convert message to ArrayBuffer
      const encoder = new TextEncoder();
      const messageBuffer = encoder.encode(message);
      
      // Encrypt the message
      const encryptedBuffer = await window.crypto.subtle.encrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        messageBuffer
      );
      
      // Convert to base64 strings
      const encryptedMessage = btoa(String.fromCharCode(...new Uint8Array(encryptedBuffer)));
      const ivString = btoa(String.fromCharCode(...iv));
      
      return {
        encryptedMessage,
        iv: ivString
      };
    } catch (error) {
      console.error('Error encrypting message:', error);
      throw new Error('Failed to encrypt message');
    }
  },

  /**
   * Decrypt a message with a symmetric key
   * 
   * @param {string} encryptedMessage - Encrypted message as base64 string
   * @param {string} ivString - Initialization vector as base64 string
   * @param {CryptoKey} key - Symmetric key for decryption
   * @returns {Promise<string>} Decrypted message
   */
  decryptMessage: async (encryptedMessage, ivString, key) => {
    try {
      // Convert from base64 strings
      const encryptedBuffer = Uint8Array.from(atob(encryptedMessage), c => c.charCodeAt(0));
      const iv = Uint8Array.from(atob(ivString), c => c.charCodeAt(0));
      
      // Decrypt the message
      const decryptedBuffer = await window.crypto.subtle.decrypt(
        {
          name: 'AES-GCM',
          iv,
        },
        key,
        encryptedBuffer
      );
      
      // Convert ArrayBuffer to string
      const decoder = new TextDecoder();
      return decoder.decode(decryptedBuffer);
    } catch (error) {
      console.error('Error decrypting message:', error);
      throw new Error('Failed to decrypt message');
    }
  },

  /**
   * Encrypt a message for multiple recipients
   * 
   * @param {string} message - Message to encrypt
   * @param {Array<Object>} recipients - Array of recipient objects with userId and publicKey
   * @returns {Promise<Object>} Object containing encrypted message data
   */
  encryptGroupMessage: async (message, recipients) => {
    try {
      // Generate a symmetric key for this message
      const messageKey = await encryptionService.generateMessageKey();
      
      // Encrypt the message with the symmetric key
      const { encryptedMessage, iv } = await encryptionService.encryptMessage(message, messageKey);
      
      // Encrypt the symmetric key for each recipient
      const recipientKeys = {};
      for (const recipient of recipients) {
        const publicKey = await encryptionService.importPublicKey(recipient.publicKey);
        recipientKeys[recipient.userId] = await encryptionService.encryptMessageKey(messageKey, publicKey);
      }
      
      return {
        encryptedMessage,
        iv,
        recipientKeys
      };
    } catch (error) {
      console.error('Error encrypting group message:', error);
      throw new Error('Failed to encrypt group message');
    }
  },

  /**
   * Decrypt a message intended for multiple recipients
   * 
   * @param {Object} encryptedData - Object containing encrypted message data
   * @param {string} userId - Current user's ID
   * @param {CryptoKey} privateKey - User's private key
   * @returns {Promise<string>} Decrypted message
   */
  decryptGroupMessage: async (encryptedData, userId, privateKey) => {
    try {
      // Extract the encrypted key for this user
      const encryptedKey = encryptedData.recipientKeys[userId];
      if (!encryptedKey) {
        throw new Error('No encrypted key found for this user');
      }
      
      // Decrypt the message key
      const messageKey = await encryptionService.decryptMessageKey(encryptedKey, privateKey);
      
      // Decrypt the message
      return await encryptionService.decryptMessage(
        encryptedData.encryptedMessage,
        encryptedData.iv,
        messageKey
      );
    } catch (error) {
      console.error('Error decrypting group message:', error);
      throw new Error('Failed to decrypt group message');
    }
  },

  /**
   * Fallback encryption using CryptoJS (for browsers without Web Crypto API)
   * 
   * @param {string} message - Message to encrypt
   * @param {string} password - Password for encryption
   * @returns {string} Encrypted message
   */
  encryptWithPassword: (message, password) => {
    try {
      return CryptoJS.AES.encrypt(message, password).toString();
    } catch (error) {
      console.error('Error encrypting with password:', error);
      throw new Error('Failed to encrypt message with password');
    }
  },

  /**
   * Fallback decryption using CryptoJS (for browsers without Web Crypto API)
   * 
   * @param {string} encryptedMessage - Encrypted message
   * @param {string} password - Password for decryption
   * @returns {string} Decrypted message
   */
  decryptWithPassword: (encryptedMessage, password) => {
    try {
      const bytes = CryptoJS.AES.decrypt(encryptedMessage, password);
      return bytes.toString(CryptoJS.enc.Utf8);
    } catch (error) {
      console.error('Error decrypting with password:', error);
      throw new Error('Failed to decrypt message with password');
    }
  },

  /**
   * Check if the Web Crypto API is available
   * 
   * @returns {boolean} True if Web Crypto API is available
   */
  isWebCryptoAvailable: () => {
    return typeof window !== 'undefined' && 
           window.crypto && 
           window.crypto.subtle && 
           typeof window.crypto.subtle.generateKey === 'function';
  }
};

export default encryptionService;
