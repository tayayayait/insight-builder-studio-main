import { UploadFile } from "@/components/ui/file-uploader";
import { db } from "./firestore";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    query,
    orderBy,
    limit
} from "firebase/firestore";

// Interfaces (Shared)
export interface PageItem {
    id: string;
    pageNumber: number;
    status: "valid" | "warning" | "error";
    thumbnailUrl?: string;
    imageUrl?: string;
}

export interface BoundingBox {
    id: string;
    x: number;
    y: number;
    width: number;
    height: number;
    status: "valid" | "warning" | "error";
    confidence: number;
}

export interface FieldData {
    id: string;
    label: string;
    value: string | number | boolean;
    type: "text" | "number" | "checkbox";
    confidence: number;
    status: "valid" | "warning" | "error";
    isEdited?: boolean;
}

export interface JobData {
    id: string;
    name: string;
    status: "processing" | "completed" | "error";
    progress: number;
    createdAt: string;
    totalFiles: number;
    pages: PageItem[];
    results: {
        [pageId: string]: {
            fields: FieldData[];
            boxes: BoundingBox[];
        };
    };
}

const COLLECTION_NAME = "jobs";

export const jobStore = {
    // Get all jobs (ordered by date desc)
    getJobs: async (): Promise<JobData[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"), limit(20));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as JobData);
        } catch (error) {
            console.error("Error fetching jobs:", error);
            return [];
        }
    },

    // Get a single job by ID
    getJob: async (id: string): Promise<JobData | undefined> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as JobData;
            }
            return undefined;
        } catch (error) {
            console.error("Error fetching job:", error);
            return undefined;
        }
    },

    // Save or Update a job
    saveJob: async (job: JobData) => {
        try {
            // Use setDoc with merge to create or update
            await setDoc(doc(db, COLLECTION_NAME, job.id), job, { merge: true });
        } catch (error) {
            console.error("Error saving job:", error);
        }
    },

    // Create a new job
    createJob: async (name: string, files: UploadFile[]): Promise<JobData> => {
        const id = Date.now().toString(); // Use timestamp as ID or uuid
        const newJob: JobData = {
            id,
            name,
            status: "processing",
            progress: 0,
            createdAt: new Date().toISOString(),
            totalFiles: files.length,
            pages: [],
            results: {},
        };

        await jobStore.saveJob(newJob);
        return newJob;
    },

    // Update partial job data
    // Get dashboard stats
    getDashboardStats: async () => {
        try {
            // For a scalable solution, we would use count aggregations.
            // For now, fetching recent jobs gives us a reasonable approximation for the dashboard 
            // without reading the entire database every time. 
            // In a production app with thousands of jobs, use centralized counters.

            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"), limit(100));
            const querySnapshot = await getDocs(q);
            const jobs = querySnapshot.docs.map(doc => doc.data() as JobData);

            const today = new Date().toDateString();

            const todayUploads = jobs.filter(j => new Date(j.createdAt).toDateString() === today).length;
            const processing = jobs.filter(j => j.status === "processing").length;
            const errors = jobs.filter(j => j.status === "error").length;
            const totalReports = jobs.filter(j => j.status === "completed").length;

            return {
                todayUploads,
                processing,
                errors,
                totalReports,
                recentJobs: jobs.slice(0, 5)
            };
        } catch (error) {
            console.error("Error fetching dashboard stats:", error);
            return {
                todayUploads: 0,
                processing: 0,
                errors: 0,
                totalReports: 0,
                recentJobs: []
            };
        }
    },

    updateJob: async (id: string, updates: Partial<JobData>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, updates);
        } catch (error) {
            console.error("Error updating job:", error);
            throw error;
        }
    },

    clear: async () => {
        // Not implemented for Firestore to prevent wiping database accidentally
        console.warn("Clear is not implemented for Firestore");
    }
};

