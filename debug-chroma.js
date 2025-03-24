import { ChromaClient } from 'chromadb';

const COLLECTION_NAME = "Maximus"; 

async function debugChroma() {
  try {
    console.log("Connecting to ChromaDB...");
    const client = new ChromaClient({
      path: "http://localhost:8000",
    });

    console.log("Getting collections...");
    const collections = await client.listCollections();
    console.log(`Found ${collections.length} collections:`);
    console.log(collections);

    // Try to get our specific collection
    try {
      console.log(`\nLooking for collection: ${COLLECTION_NAME}`);
      const collection = await client.getCollection({
        name: COLLECTION_NAME,
      });
      
      console.log("Collection found!");
      
      // Get all items from the collection
      console.log("\nGetting all items from collection...");
      const allItems = await collection.get({
        limit: 100 // Get up to 100 items
      });
      
      console.log(`Found ${allItems.ids.length} items in collection:`);
      
      // Print each item with its metadata
      for (let i = 0; i < allItems.ids.length; i++) {
        console.log(`\nItem ${i+1}:`);
        console.log(`  ID: ${allItems.ids[i]}`);
        console.log(`  Document: ${allItems.documents[i]}`);
        console.log(`  Metadata: ${JSON.stringify(allItems.metadatas[i], null, 2)}`);
      }
      
    } catch (error) {
      console.error(`Error getting collection ${COLLECTION_NAME}:`, error);
    }
  } catch (error) {
    console.error("Error connecting to ChromaDB:", error);
  }
}

debugChroma();