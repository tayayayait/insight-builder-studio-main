/**
 * Project Store Service
 * Firestore에서 프로젝트 데이터를 관리합니다.
 */

import { db } from "./firestore";
import {
    collection,
    doc,
    getDoc,
    getDocs,
    setDoc,
    updateDoc,
    deleteDoc,
    query,
    orderBy,
    where,
    Timestamp
} from "firebase/firestore";

// Interfaces
export interface Project {
    id: string;
    name: string;
    description: string;
    status: "active" | "completed" | "archived";
    createdAt: string;
    updatedAt: string;
    jobCount: number;
    totalFiles: number;
    tags?: string[];
}

const COLLECTION_NAME = "projects";

const toMillis = (value: unknown) => {
    if (!value) return 0;
    if (value instanceof Timestamp) return value.toMillis();
    if (typeof value === "string") {
        const parsed = Date.parse(value);
        return Number.isNaN(parsed) ? 0 : parsed;
    }
    return 0;
};

export const projectStore = {
    // Get all projects
    getProjects: async (): Promise<Project[]> => {
        try {
            const q = query(collection(db, COLLECTION_NAME), orderBy("createdAt", "desc"));
            const querySnapshot = await getDocs(q);
            return querySnapshot.docs.map(doc => doc.data() as Project);
        } catch (error) {
            console.error("Error fetching projects:", error);
            return [];
        }
    },

    // Get active projects only
    getActiveProjects: async (): Promise<Project[]> => {
        try {
            const q = query(
                collection(db, COLLECTION_NAME),
                where("status", "==", "active")
            );
            const querySnapshot = await getDocs(q);
            const projects = querySnapshot.docs.map(doc => doc.data() as Project);
            return projects.sort((a, b) => toMillis(b.updatedAt) - toMillis(a.updatedAt));
        } catch (error) {
            console.error("Error fetching active projects:", error);
            // Fallback: get all and filter
            const all = await projectStore.getProjects();
            return all.filter(p => p.status === "active");
        }
    },

    // Get a single project by ID
    getProject: async (id: string): Promise<Project | undefined> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            const docSnap = await getDoc(docRef);
            if (docSnap.exists()) {
                return docSnap.data() as Project;
            }
            return undefined;
        } catch (error) {
            console.error("Error fetching project:", error);
            return undefined;
        }
    },

    // Create a new project
    createProject: async (data: Omit<Project, "id" | "createdAt" | "updatedAt" | "jobCount" | "totalFiles">): Promise<Project> => {
        const id = `project_${Date.now()}`;
        const now = new Date().toISOString();
        const newProject: Project = {
            ...data,
            id,
            createdAt: now,
            updatedAt: now,
            jobCount: 0,
            totalFiles: 0
        };

        try {
            await setDoc(doc(db, COLLECTION_NAME, id), newProject);
            return newProject;
        } catch (error) {
            console.error("Error creating project:", error);
            throw error;
        }
    },

    // Update a project
    updateProject: async (id: string, data: Partial<Project>): Promise<void> => {
        try {
            const docRef = doc(db, COLLECTION_NAME, id);
            await updateDoc(docRef, {
                ...data,
                updatedAt: new Date().toISOString()
            });
        } catch (error) {
            console.error("Error updating project:", error);
            throw error;
        }
    },

    // Delete a project
    deleteProject: async (id: string): Promise<void> => {
        try {
            await deleteDoc(doc(db, COLLECTION_NAME, id));
        } catch (error) {
            console.error("Error deleting project:", error);
            throw error;
        }
    },

    // Increment job count
    incrementJobCount: async (id: string, fileCount: number): Promise<void> => {
        try {
            const project = await projectStore.getProject(id);
            if (project) {
                await projectStore.updateProject(id, {
                    jobCount: project.jobCount + 1,
                    totalFiles: project.totalFiles + fileCount
                });
            }
        } catch (error) {
            console.error("Error incrementing job count:", error);
        }
    }
};
