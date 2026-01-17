
import { initializeApp } from "firebase/app";
import { getFirestore, collection, getDocs, deleteDoc, doc } from "firebase/firestore";
import dotenv from "dotenv";
import path from "path";

// Load environment variables from .env
dotenv.config({ path: path.resolve(process.cwd(), ".env") });

const firebaseConfig = {
    apiKey: process.env.VITE_FIREBASE_API_KEY,
    authDomain: process.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: process.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: process.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: process.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: process.env.VITE_FIREBASE_APP_ID,
};

// Validating config
if (!firebaseConfig.apiKey) {
    console.error("Error: Missing Firebase configuration. Please check your .env file.");
    process.exit(1);
}

const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

const COLLECTIONS = ["jobs", "projects", "analysisResults", "reports"];

async function clearCollection(collectionName: string) {
    console.log(`Checking collection: ${collectionName}...`);
    try {
        const colRef = collection(db, collectionName);
        const snapshot = await getDocs(colRef);

        if (snapshot.empty) {
            console.log(`  - Collection ${collectionName} is empty.`);
            return;
        }

        console.log(`  - Found ${snapshot.size} documents in ${collectionName}. Deleting...`);

        const deletePromises = snapshot.docs.map((docSnap) => {
            return deleteDoc(doc(db, collectionName, docSnap.id));
        });

        await Promise.all(deletePromises);
        console.log(`  - Successfully cleared ${collectionName}.`);
    } catch (error) {
        console.error(`  - Error clearing ${collectionName}:`, error);
    }
}

async function main() {
    console.log("Starting Firestore data cleanup...");

    for (const colName of COLLECTIONS) {
        await clearCollection(colName);
    }

    console.log("Cleanup complete!");
    process.exit(0);
}

main();
