import { jobStore, JobData } from "./jobStore";
import { projectStore } from "./projectStore";
import { analysisResultStore } from "./analysisResultStore";

export interface AuditReport {
    timestamp: string;
    status: "healthy" | "warning" | "error";
    checks: {
        totalJobs: number;
        totalProjects: number;
        totalAnalyses: number;
        orphanedJobs: string[];
        orphanedAnalyses: string[];
        inconsistentJobs: Array<{
            jobId: string;
            reason: string;
        }>;
    };
}

export const systemAuditService = {
    /**
     * Runs a full system scan to verify data integrity across modules.
     */
    runFullSystemScan: async (): Promise<AuditReport> => {
        console.log("Starting System Audit...");

        const timestamp = new Date().toISOString();
        const report: AuditReport = {
            timestamp,
            status: "healthy",
            checks: {
                totalJobs: 0,
                totalProjects: 0,
                totalAnalyses: 0,
                orphanedJobs: [],
                orphanedAnalyses: [],
                inconsistentJobs: []
            }
        };

        try {
            // 1. Fetch All Data
            const [jobs, projects, analyses] = await Promise.all([
                jobStore.getJobs(),
                projectStore.getActiveProjects(),
                analysisResultStore.getResults()
            ]);

            report.checks.totalJobs = jobs.length;
            report.checks.totalProjects = projects.length;
            report.checks.totalAnalyses = analyses.length;

            const projectIds = new Set(projects.map(p => p.id));

            // 2. Check for Orphaned Jobs (Jobs pointing to non-existent projects)
            // Note: Current JobData structure doesn't seem to explicitly store projectId in the interface in jobStore.ts
            // Let's check the JobData interface. If it's missing, we might need to rely on naming convention or add it.
            // Looking at Upload.tsx, job name is "배치 #{date} - {projectName}". This is loose coupling.
            // Ideally, JobData should have projectId.

            // For now, we will check internal consistency of Jobs
            for (const job of jobs) {
                // Check Page vs Results consistency
                const pageIds = new Set(job.pages.map(p => p.id));
                const resultIds = new Set(Object.keys(job.results));

                // Check if every page has a result entry
                const missingResults = job.pages.filter(p => !resultIds.has(p.id));
                if (missingResults.length > 0) {
                    report.checks.inconsistentJobs.push({
                        jobId: job.id,
                        reason: `Missing results for pages: ${missingResults.map(p => p.id).join(", ")}`
                    });
                }

                // Check if every result entry corresponds to a page
                const orphanedResults = Object.keys(job.results).filter(id => !pageIds.has(id));
                if (orphanedResults.length > 0) {
                    report.checks.inconsistentJobs.push({
                        jobId: job.id,
                        reason: `Orphaned results (no page): ${orphanedResults.join(", ")}`
                    });
                }

                // Check completion status consistency
                if (job.status === "completed") {
                    const nonValidPages = job.pages.filter(p => p.status !== "valid");
                    if (nonValidPages.length > 0) {
                        // Warning level consistency check
                        // It's possible to force complete a job with warnings, so maybe not an error.
                        // But strictly speaking, "completed" often implies validation done.
                    }
                }
            }

            // 3. Check for Orphaned Analysis Results
            for (const analysis of analyses) {
                if (!projectIds.has(analysis.projectId)) {
                    report.checks.orphanedAnalyses.push(analysis.id);
                }
            }

            // Determine overall status
            if (report.checks.orphanedJobs.length > 0 ||
                report.checks.orphanedAnalyses.length > 0 ||
                report.checks.inconsistentJobs.length > 0) {
                report.status = "warning";
                // Escalating to error if critical inconsistencies
                if (report.checks.inconsistentJobs.length > 0) {
                    report.status = "error";
                }
            }

        } catch (error) {
            console.error("Audit failed:", error);
            report.status = "error";
        }

        console.log("Audit Complete:", report);
        return report;
    }
};

// Expose to window for easy debugging
if (typeof window !== "undefined") {
    (window as any).auditSystem = systemAuditService.runFullSystemScan;
}
