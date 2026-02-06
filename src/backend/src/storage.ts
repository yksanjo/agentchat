/**
 * Storage Wrapper
 * Provides memory fallback for local development when R2 isn't available
 */

// In-memory storage for local development
const memoryStorage = new Map<string, string>();

export interface StorageAdapter {
  get(key: string): Promise<{ text(): Promise<string> } | null>;
  put(key: string, value: string): Promise<void>;
  list(options?: { prefix?: string }): Promise<{ objects: Array<{ key: string }> }>;
  delete(key: string): Promise<void>;
}

export function createStorage(bucket: R2Bucket | undefined): StorageAdapter {
  // If we have a real R2 bucket, use it
  if (bucket) {
    return {
      get: async (key: string) => bucket.get(key),
      put: async (key: string, value: string) => {
        await bucket.put(key, value);
      },
      list: async (options?: { prefix?: string }) => bucket.list(options),
      delete: async (key: string) => {
        await bucket.delete(key);
      },
    };
  }

  // Fallback to memory storage for local development
  console.log('[Storage] Using memory fallback for local development');
  
  return {
    get: async (key: string) => {
      const value = memoryStorage.get(key);
      if (!value) return null;
      return {
        text: async () => value,
      };
    },
    put: async (key: string, value: string) => {
      memoryStorage.set(key, value);
    },
    list: async (options?: { prefix?: string }) => {
      const prefix = options?.prefix || '';
      const objects: Array<{ key: string }> = [];
      
      for (const key of memoryStorage.keys()) {
        if (key.startsWith(prefix)) {
          objects.push({ key });
        }
      }
      
      return { objects };
    },
    delete: async (key: string) => {
      memoryStorage.delete(key);
    },
  };
}

// Helper to get storage from context
export function getStorage(c: { env: { AGENTCHAT_BUCKET?: R2Bucket } }): StorageAdapter {
  return createStorage(c.env.AGENTCHAT_BUCKET);
}
