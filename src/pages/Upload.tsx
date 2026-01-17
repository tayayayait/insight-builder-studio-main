import { useState, useCallback, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Upload, ArrowRight, FolderKanban } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { FileUploader, UploadFile } from "@/components/ui/file-uploader";
import { BatchSettingsCard, BatchSettings } from "@/components/upload/BatchSettingsCard";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { googleVisionService } from "@/services/googleVisionService";
import { jobStore, PageItem, FieldData, BoundingBox } from "@/services/jobStore";
import { v4 as uuidv4 } from "uuid";
import { uploadImage } from "@/services/storageService";

type ProcessedFile = {
    base64: string;
    width: number;
    height: number;
};

// ProcessedFile represents a single page result


const isPdfFile = (file: File) => {
    const name = file.name.toLowerCase();
    return file.type === "application/pdf" || name.endsWith(".pdf");
};

const isImageFile = (file: File) => {
    if (file.type.startsWith("image/")) return true;
    const name = file.name.toLowerCase();
    return name.endsWith(".png") || name.endsWith(".jpg") || name.endsWith(".jpeg") || name.endsWith(".webp");
};

const processImageFile = (file: File): Promise<ProcessedFile[]> => {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e) => {
            const base64 = e.target?.result as string;
            if (!base64) {
                reject(new Error("Unable to read image data."));
                return;
            }
            const img = new Image();
            img.onload = () => {
                resolve([{ base64, width: img.naturalWidth, height: img.naturalHeight }]);
            };
            img.onerror = () => reject(new Error("Failed to load image."));
            img.src = base64;
        };
        reader.onerror = () => reject(new Error("Error reading image file."));
        reader.readAsDataURL(file);
    });
};

const processPdfFile = async (file: File): Promise<ProcessedFile[]> => {
    const [{ getDocument, GlobalWorkerOptions }, workerModule] = await Promise.all([
        import("pdfjs-dist"),
        import("pdfjs-dist/build/pdf.worker.min.mjs?url"),
    ]);

    const workerSrc = (workerModule as { default?: string }).default;
    if (!workerSrc) {
        throw new Error("Failed to load PDF worker.");
    }
    if (!GlobalWorkerOptions.workerSrc) {
        GlobalWorkerOptions.workerSrc = workerSrc;
    }

    const data = await file.arrayBuffer();
    const pdf = await getDocument({ data }).promise;
    const numPages = pdf.numPages;
    const results: ProcessedFile[] = [];

    for (let i = 1; i <= numPages; i++) {
        try {
            const page = await pdf.getPage(i);
            const viewport = page.getViewport({ scale: 2 });

            const canvas = document.createElement("canvas");
            const context = canvas.getContext("2d");
            if (!context) {
                console.warn(`Failed to create canvas context for page ${i}`);
                continue;
            }

            canvas.width = Math.ceil(viewport.width);
            canvas.height = Math.ceil(viewport.height);
            await page.render({ canvasContext: context, viewport, canvas } as any).promise;

            const base64 = canvas.toDataURL("image/png");
            results.push({ base64, width: canvas.width, height: canvas.height });

            page.cleanup();
        } catch (error) {
            console.error(`Error processing PDF page ${i}:`, error);
            // Continue to next page even if one fails
        }
    }

    pdf.destroy();
    return results;
};

// Helper to read file and get dimensions
const processFile = async (file: File): Promise<ProcessedFile[]> => {
    if (isPdfFile(file)) {
        return processPdfFile(file);
    }
    if (isImageFile(file)) {
        return processImageFile(file);
    }
    throw new Error("Unsupported file type. Please upload a PDF or image file.");
};

// Projects loaded from Firestore

const DEFAULT_SETTINGS: BatchSettings = {
    batchName: "",
    dataTypes: ["pdf"],
    templateMatching: "auto",
    ocrLanguage: "ko",
    checkboxEnhancement: true,
    handwritingRecognition: false,
    containsPrivateData: false,
    maskingEnabled: false,
};

export default function UploadPage() {
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const projectIdFromUrl = searchParams.get("project");

    const [selectedProjectId, setSelectedProjectId] = useState<string>(
        projectIdFromUrl || ""
    );
    const [projects, setProjects] = useState<{ id: string; name: string }[]>([]);
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [settings, setSettings] = useState<BatchSettings>(DEFAULT_SETTINGS);
    const [isUploading, setIsUploading] = useState(false);

    // Load projects from Firestore
    useEffect(() => {
        const loadProjects = async () => {
            const { projectStore } = await import("@/services/projectStore");
            const data = await projectStore.getActiveProjects();
            setProjects(data.map(p => ({ id: p.id, name: p.name })));
        };
        loadProjects();
    }, []);

    const selectedProject = projects.find((p) => p.id === selectedProjectId);

    const handleFilesChange = useCallback((newFiles: UploadFile[]) => {
        setFiles(newFiles);
    }, []);

    const handleStartUpload = async () => {
        // Validation checks
        if (!selectedProjectId) {
            toast({
                title: "프로젝트를 선택해주세요",
                description: "업로드하려면 먼저 프로젝트를 선택해야 합니다.",
                variant: "destructive",
            });
            return;
        }

        if (files.length === 0) {
            toast({
                title: "파일을 추가해주세요",
                description: "업로드할 파일이 없습니다.",
                variant: "destructive",
            });
            return;
        }

        const validFiles = files.filter((f) => f.status !== "error");
        if (validFiles.length === 0) {
            toast({
                title: "유효한 파일이 없습니다",
                description: "모든 파일에 오류가 있습니다. 파일을 확인해주세요.",
                variant: "destructive",
            });
            return;
        }

        setIsUploading(true);
        const jobName = `배치 #${new Date().toISOString().slice(0, 10)} - ${selectedProject?.name}`;

        try {
            // 1. Create Job
            const newJob = await jobStore.createJob(jobName, validFiles);
            const totalFiles = validFiles.length;

            // 2. Process each file
            let globalPageNumber = 1;

            for (let i = 0; i < totalFiles; i++) {
                const file = validFiles[i].file;

                try {
                    const processedPages = await processFile(file);

                    for (const pageData of processedPages) {
                        const pageId = uuidv4();
                        const { base64, width, height } = pageData;

                        // Upload to Firebase Storage
                        let imageUrl = base64; // fallback to base64 if storage fails
                        try {
                            const uploadResult = await uploadImage(base64, `${pageId}-${file.name}`);
                            imageUrl = uploadResult.url;
                        } catch (storageError) {
                            console.warn("Storage upload failed, using base64:", storageError);
                        }

                        // Analyze with Google Vision
                        const ocrResult = await googleVisionService.analyzeImage(base64);

                        // Map Pages
                        const pageItem: PageItem = {
                            id: pageId,
                            pageNumber: globalPageNumber++,
                            status: "valid",
                            thumbnailUrl: imageUrl,
                            imageUrl: imageUrl
                        };
                        newJob.pages.push(pageItem);

                        // Map Results (Blocks -> Fields)
                        const pageFields: FieldData[] = [];
                        const pageBoxes: BoundingBox[] = [];

                        const pages = ocrResult.responses[0]?.fullTextAnnotation?.pages || [];
                        if (pages.length > 0) {
                            const blocks = pages[0].blocks || [];

                            blocks.forEach((block, idx) => {
                                const blockText = block.paragraphs.map(p =>
                                    p.words.map(w => w.symbols.map(s => s.text).join("")).join(" ")
                                ).join("\n");

                                const vertices = block.boundingBox.vertices;
                                const xs = vertices.map(v => v.x || 0);
                                const ys = vertices.map(v => v.y || 0);
                                const minX = Math.min(...xs);
                                const maxX = Math.max(...xs);
                                const minY = Math.min(...ys);
                                const maxY = Math.max(...ys);

                                const boxX = (minX / width) * 100;
                                const boxY = (minY / height) * 100;
                                const boxW = ((maxX - minX) / width) * 100;
                                const boxH = ((maxY - minY) / height) * 100;

                                const fieldId = `field-${pageId}-${idx}`;
                                const confidence = block.confidence || 0.9;
                                const status = confidence > 0.8 ? "valid" : "warning";

                                pageFields.push({
                                    id: fieldId,
                                    label: `텍스트 영역 ${idx + 1}`,
                                    value: blockText,
                                    type: "text",
                                    confidence: confidence,
                                    status: status
                                });

                                pageBoxes.push({
                                    id: fieldId,
                                    x: boxX,
                                    y: boxY,
                                    width: boxW,
                                    height: boxH,
                                    status: status,
                                    confidence: confidence
                                });
                            });
                        }

                        newJob.results[pageId] = {
                            fields: pageFields,
                            boxes: pageBoxes
                        };
                    }

                    // Update progress (based on file completion)
                    newJob.progress = Math.round(((i + 1) / totalFiles) * 100);
                    jobStore.saveJob(newJob);

                } catch (fileError) {
                    console.error(`Failed to process file ${file.name}:`, fileError);
                    toast({
                        title: "파일 처리 실패",
                        description: `${file.name} 처리 중 오류가 발생했습니다.`,
                        variant: "destructive",
                    });
                }
            }

            newJob.status = "completed";
            jobStore.saveJob(newJob);

            toast({
                title: "업로드 및 분석 완료",
                description: `${validFiles.length}개 파일 처리 완료. 검수 페이지로 이동합니다.`,
            });

            // Navigate directly to validation to show results immediately
            navigate(`/validation/${newJob.id}`);

        } catch (error) {
            console.error("Upload error:", error);
            toast({
                title: "업로드 실패",
                description: error instanceof Error ? error.message : "알 수 없는 오류가 발생했습니다.",
                variant: "destructive",
            });
        } finally {
            setIsUploading(false);
        }
    };

    return (
        <AppLayout>
            <PageHeader
                title="데이터 업로드"
                description="설문지 파일을 업로드하고 OCR 처리를 시작합니다."
            />

            {/* Project Selection */}
            <Card className="mb-6">
                <CardHeader className="pb-4">
                    <CardTitle className="text-h3 flex items-center gap-2">
                        <FolderKanban className="w-5 h-5" />
                        프로젝트 선택
                    </CardTitle>
                </CardHeader>
                <CardContent>
                    <Select value={selectedProjectId} onValueChange={setSelectedProjectId}>
                        <SelectTrigger className="max-w-md">
                            <SelectValue placeholder="프로젝트를 선택하세요" />
                        </SelectTrigger>
                        <SelectContent>
                            {projects.map((project) => (
                                <SelectItem key={project.id} value={project.id}>
                                    {project.name}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {!selectedProjectId && (
                        <p className="text-small text-muted-foreground mt-2">
                            업로드하려면 프로젝트를 먼저 선택해야 합니다.
                        </p>
                    )}
                </CardContent>
            </Card>

            {/* Two Column Layout */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Left: File Uploader */}
                <Card>
                    <CardHeader className="pb-4">
                        <CardTitle className="text-h3 flex items-center gap-2">
                            <Upload className="w-5 h-5" />
                            파일 업로드
                        </CardTitle>
                    </CardHeader>
                    <CardContent>
                        <FileUploader
                            accept=".pdf,.jpg,.jpeg,.png"
                            onFilesChange={handleFilesChange}
                            disabled={!selectedProjectId}
                            maxFiles={50}
                            maxSize={50}
                        />
                    </CardContent>
                </Card>

                {/* Right: Batch Settings */}
                <BatchSettingsCard
                    projectName={selectedProject?.name}
                    settings={settings}
                    onSettingsChange={setSettings}
                />
            </div>

            {/* Submit Button */}
            <div className="flex justify-end mt-6">
                <Button
                    size="lg"
                    onClick={handleStartUpload}
                    disabled={!selectedProjectId || files.length === 0 || isUploading}
                >
                    {isUploading ? (
                        <>처리 중...</>
                    ) : (
                        <>
                            업로드 시작
                            <ArrowRight className="w-4 h-4 ml-2" />
                        </>
                    )}
                </Button>
            </div>
        </AppLayout>
    );
}
