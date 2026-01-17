import * as React from "react";
import { useCallback, useMemo, useState } from "react";
import { Upload, X, File, RefreshCw, CheckCircle2, AlertCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";

export interface UploadFile {
    id: string;
    file: File;
    progress: number;
    status: "pending" | "uploading" | "success" | "error";
    error?: string;
}

export interface FileUploaderProps {
    accept?: string;
    maxSize?: number; // in MB
    maxFiles?: number;
    onFilesChange?: (files: UploadFile[]) => void;
    onUpload?: (file: File) => Promise<void>;
    disabled?: boolean;
    className?: string;
}

const DEFAULT_ACCEPT = ".pdf,.jpg,.jpeg,.png,.xlsx,.csv";
const DEFAULT_MAX_SIZE = 50; // MB
const DEFAULT_MAX_FILES = 20;

export function FileUploader({
    accept = DEFAULT_ACCEPT,
    maxSize = DEFAULT_MAX_SIZE,
    maxFiles = DEFAULT_MAX_FILES,
    onFilesChange,
    onUpload,
    disabled = false,
    className,
}: FileUploaderProps) {
    const [files, setFiles] = useState<UploadFile[]>([]);
    const [isDragOver, setIsDragOver] = useState(false);
    const inputRef = React.useRef<HTMLInputElement>(null);
    const acceptLabel = useMemo(() => {
        const entries = accept
            .split(",")
            .map((entry) => entry.trim())
            .filter(Boolean)
            .map((entry) => entry.replace(".", "").toUpperCase());
        const unique = Array.from(new Set(entries));
        return unique.length > 0 ? unique.join(", ") : "파일";
    }, [accept]);

    const validateFile = useCallback(
        (file: File): string | null => {
            // Check file extension
            const extension = "." + file.name.split(".").pop()?.toLowerCase();
            const acceptedExtensions = accept.split(",").map((ext) => ext.trim().toLowerCase());
            if (!acceptedExtensions.includes(extension)) {
                return `허용되지 않는 파일 형식입니다: ${extension}`;
            }

            // Check file size
            const sizeMB = file.size / (1024 * 1024);
            if (sizeMB > maxSize) {
                return `파일 크기가 ${maxSize}MB를 초과합니다 (${sizeMB.toFixed(1)}MB)`;
            }

            return null;
        },
        [accept, maxSize]
    );

    const addFiles = useCallback(
        (newFiles: FileList | File[]) => {
            const fileArray = Array.from(newFiles);
            const remainingSlots = maxFiles - files.length;

            if (fileArray.length > remainingSlots) {
                console.warn(`최대 ${maxFiles}개까지만 업로드할 수 있습니다.`);
            }

            const filesToAdd = fileArray.slice(0, remainingSlots).map((file) => {
                const error = validateFile(file);
                return {
                    id: `${file.name}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
                    file,
                    progress: 0,
                    status: error ? "error" : "pending",
                    error: error || undefined,
                } as UploadFile;
            });

            const updatedFiles = [...files, ...filesToAdd];
            setFiles(updatedFiles);
            onFilesChange?.(updatedFiles);
        },
        [files, maxFiles, validateFile, onFilesChange]
    );

    const removeFile = useCallback(
        (id: string) => {
            const updatedFiles = files.filter((f) => f.id !== id);
            setFiles(updatedFiles);
            onFilesChange?.(updatedFiles);
        },
        [files, onFilesChange]
    );

    const retryFile = useCallback(
        async (id: string) => {
            const fileIndex = files.findIndex((f) => f.id === id);
            if (fileIndex === -1) return;

            const updatedFiles = [...files];
            updatedFiles[fileIndex] = {
                ...updatedFiles[fileIndex],
                status: "uploading",
                progress: 0,
                error: undefined,
            };
            setFiles(updatedFiles);

            try {
                if (onUpload) {
                    await onUpload(updatedFiles[fileIndex].file);
                }
                // Simulate progress for demo
                for (let i = 0; i <= 100; i += 10) {
                    await new Promise((r) => setTimeout(r, 100));
                    setFiles((prev) => {
                        const newFiles = [...prev];
                        const idx = newFiles.findIndex((f) => f.id === id);
                        if (idx !== -1) {
                            newFiles[idx] = { ...newFiles[idx], progress: i };
                        }
                        return newFiles;
                    });
                }
                setFiles((prev) => {
                    const newFiles = [...prev];
                    const idx = newFiles.findIndex((f) => f.id === id);
                    if (idx !== -1) {
                        newFiles[idx] = { ...newFiles[idx], status: "success", progress: 100 };
                    }
                    return newFiles;
                });
            } catch (error) {
                setFiles((prev) => {
                    const newFiles = [...prev];
                    const idx = newFiles.findIndex((f) => f.id === id);
                    if (idx !== -1) {
                        newFiles[idx] = {
                            ...newFiles[idx],
                            status: "error",
                            error: error instanceof Error ? error.message : "업로드 실패",
                        };
                    }
                    return newFiles;
                });
            }
        },
        [files, onUpload]
    );

    const handleDragOver = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(true);
    }, []);

    const handleDragLeave = useCallback((e: React.DragEvent) => {
        e.preventDefault();
        e.stopPropagation();
        setIsDragOver(false);
    }, []);

    const handleDrop = useCallback(
        (e: React.DragEvent) => {
            e.preventDefault();
            e.stopPropagation();
            setIsDragOver(false);

            if (disabled) return;

            const droppedFiles = e.dataTransfer.files;
            if (droppedFiles.length > 0) {
                addFiles(droppedFiles);
            }
        },
        [disabled, addFiles]
    );

    const handleClick = useCallback(() => {
        if (!disabled) {
            inputRef.current?.click();
        }
    }, [disabled]);

    const handleInputChange = useCallback(
        (e: React.ChangeEvent<HTMLInputElement>) => {
            const selectedFiles = e.target.files;
            if (selectedFiles && selectedFiles.length > 0) {
                addFiles(selectedFiles);
            }
            // Reset input to allow selecting the same file again
            e.target.value = "";
        },
        [addFiles]
    );

    const getFileIcon = (status: UploadFile["status"]) => {
        switch (status) {
            case "success":
                return <CheckCircle2 className="w-4 h-4 text-success" />;
            case "error":
                return <AlertCircle className="w-4 h-4 text-danger" />;
            default:
                return <File className="w-4 h-4 text-muted-foreground" />;
        }
    };

    const formatFileSize = (bytes: number) => {
        if (bytes < 1024) return `${bytes} B`;
        if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
        return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
    };

    return (
        <div className={cn("space-y-4", className)}>
            {/* Drop Zone */}
            <div
                onClick={handleClick}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                className={cn(
                    "relative flex flex-col items-center justify-center border-2 border-dashed rounded-[var(--radius-md)] transition-colors cursor-pointer",
                    "h-[160px] md:h-[160px] sm:h-[120px]",
                    isDragOver
                        ? "border-primary bg-primary-50"
                        : "border-border hover:border-primary/50 hover:bg-muted/50",
                    disabled && "opacity-50 cursor-not-allowed"
                )}
            >
                <input
                    ref={inputRef}
                    type="file"
                    accept={accept}
                    multiple
                    onChange={handleInputChange}
                    className="hidden"
                    disabled={disabled}
                />
                <Upload
                    className={cn(
                        "w-10 h-10 mb-3",
                        isDragOver ? "text-primary" : "text-muted-foreground"
                    )}
                />
                <p className="text-body font-medium text-foreground">
                    파일을 드래그하거나 클릭하여 업로드
                </p>
                <p className="text-small text-muted-foreground mt-1">
                    {acceptLabel} (최대 {maxSize}MB)
                </p>
            </div>

            {/* File List */}
            {files.length > 0 && (
                <div className="space-y-2">
                    <div className="flex items-center justify-between">
                        <span className="text-small font-medium text-foreground">
                            업로드 파일 ({files.length}/{maxFiles})
                        </span>
                        {files.length > 0 && (
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                    setFiles([]);
                                    onFilesChange?.([]);
                                }}
                                className="text-muted-foreground hover:text-danger"
                            >
                                전체 삭제
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2 max-h-[240px] overflow-y-auto">
                        {files.map((uploadFile) => (
                            <div
                                key={uploadFile.id}
                                className={cn(
                                    "flex items-center gap-3 p-3 rounded-[var(--radius-sm)] border",
                                    uploadFile.status === "error"
                                        ? "bg-danger-50 border-danger/30"
                                        : "bg-card border-border"
                                )}
                            >
                                {getFileIcon(uploadFile.status)}
                                <div className="flex-1 min-w-0">
                                    <p className="text-body font-medium text-foreground truncate">
                                        {uploadFile.file.name}
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <span className="text-small text-muted-foreground">
                                            {formatFileSize(uploadFile.file.size)}
                                        </span>
                                        {uploadFile.status === "uploading" && (
                                            <Progress value={uploadFile.progress} className="h-1.5 flex-1" />
                                        )}
                                        {uploadFile.error && (
                                            <span className="text-small text-danger">{uploadFile.error}</span>
                                        )}
                                    </div>
                                </div>
                                <div className="flex items-center gap-1">
                                    {uploadFile.status === "error" && (
                                        <Button
                                            variant="ghost"
                                            size="sm"
                                            onClick={() => retryFile(uploadFile.id)}
                                            className="h-8 w-8 p-0"
                                        >
                                            <RefreshCw className="w-4 h-4" />
                                        </Button>
                                    )}
                                    <Button
                                        variant="ghost"
                                        size="sm"
                                        onClick={() => removeFile(uploadFile.id)}
                                        className="h-8 w-8 p-0 text-muted-foreground hover:text-danger"
                                    >
                                        <X className="w-4 h-4" />
                                    </Button>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            )}
        </div>
    );
}
