import { Collection, MongoClient } from "mongodb";
import type { MemoryStore } from "@daydreamsai/core";

export interface MongoMemoryOptions {
  uri: string;
  dbName?: string;
  collectionName?: string;
}

export class MongoMemoryStore implements MemoryStore {
  private client: MongoClient;
  private collection: Collection | null = null;
  private readonly dbName: string;
  private readonly collectionName: string;

  constructor(options: MongoMemoryOptions) {
    this.client = new MongoClient(options.uri);
    this.dbName = options.dbName || "dreams_memory";
    this.collectionName = options.collectionName || "conversations";
  }

  /**
   * Initialize the MongoDB connection
   */
  async initialize(): Promise<void> {
    console.log(
      `Initializing MongoDB connection to ${this.dbName}.${this.collectionName}`,
    );
    await this.client.connect();
    const db = this.client.db(this.dbName);
    this.collection = db.collection(this.collectionName);

    // Create index on key field for faster lookups
    await this.collection.createIndex({ key: 1 }, { unique: true });
    console.log(`MongoDB connection initialized successfully`);
  }

  /**
   * Retrieves a value from the store
   * @param key - Key to look up
   * @returns The stored value or null if not found
   */
  async get<T>(key: string): Promise<T | null> {
    if (!this.collection) throw new Error("MongoDB not initialized");
    console.log(`Getting item with key: ${key}`);

    // Store key in a dedicated field instead of using it as _id
    const doc = await this.collection.findOne({ key: key });
    if (!doc) {
      console.log(`Item with key ${key} not found`);
      return null;
    }

    console.log(`Retrieved item with key: ${key}`);
    return doc.value as T;
  }

  /**
   * Stores a value in the store
   * @param key - Key to store under
   * @param value - Value to store
   */
  async set(key: string, value: any): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");
    console.log(`Setting item with key: ${key}`);

    await this.collection.updateOne(
      { key: key }, // Use key field instead of _id
      { $set: { key, value, updatedAt: new Date() } },
      { upsert: true },
    );

    console.log(`Set item with key: ${key}`);
  }

  /**
   * Removes a specific entry from the store
   * @param key - Key to remove
   */
  async delete(key: string): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");
    console.log(`Deleting item with key: ${key}`);

    await this.collection.deleteOne({ key: key }); // Use key field instead of _id

    console.log(`Deleted item with key: ${key}`);
  }

  /**
   * Removes all entries from the store
   */
  async clear(): Promise<void> {
    if (!this.collection) throw new Error("MongoDB not initialized");
    console.log(`Clearing all items from collection`);

    await this.collection.deleteMany({});

    console.log(`Cleared all items from collection`);
  }

  /**
   * Close the MongoDB connection
   */
  async close(): Promise<void> {
    console.log(`Closing MongoDB connection`);
    await this.client.close();
    console.log(`MongoDB connection closed`);
  }
}

/**
 * Creates a new MongoDB-backed memory store
 * @param options - MongoDB connection options
 * @returns A MemoryStore implementation using MongoDB for storage
 */
export async function createMongoMemoryStore(
  options: MongoMemoryOptions,
): Promise<MemoryStore> {
  console.log(`Creating MongoDB memory store with URI: ${options.uri}`);
  const store = new MongoMemoryStore(options);
  await store.initialize();
  return store;
}
