import * as React from "react";
import { useState } from "react";
import { Settings, ChevronDown, HelpCircle } from "lucide-react";
import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Checkbox } from "@/components/ui/checkbox";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Collapsible,
    CollapsibleContent,
    CollapsibleTrigger,
} from "@/components/ui/collapsible";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";

export interface BatchSettings {
    batchName: string;
    dataTypes: ("pdf" | "image" | "excel")[];
    templateMatching: "auto" | "manual";
    ocrLanguage: string;
    checkboxEnhancement: boolean;
    handwritingRecognition: boolean;
    containsPrivateData: boolean;
    maskingEnabled: boolean;
}

interface BatchSettingsCardProps {
    projectName?: string;
    settings: BatchSettings;
    onSettingsChange: (settings: BatchSettings) => void;
    className?: string;
}

const DATA_TYPE_OPTIONS = [
    { value: "pdf", label: "PDF" },
    { value: "image", label: "이미지 (JPG/PNG)" },
    { value: "excel", label: "엑셀 (XLSX/CSV)" },
] as const;

const LANGUAGE_OPTIONS = [
    { value: "ko", label: "한국어" },
    { value: "en", label: "영어" },
    { value: "ja", label: "일본어" },
    { value: "zh", label: "중국어" },
    { value: "mixed", label: "혼합" },
];

export function BatchSettingsCard({
    projectName,
    settings,
    onSettingsChange,
    className,
}: BatchSettingsCardProps) {
    const [advancedOpen, setAdvancedOpen] = useState(false);

    const handleDataTypeToggle = (type: "pdf" | "image" | "excel") => {
        const currentTypes = settings.dataTypes;
        const newTypes = currentTypes.includes(type)
            ? currentTypes.filter((t) => t !== type)
            : [...currentTypes, type];

        if (newTypes.length === 0) return; // At least one type required

        onSettingsChange({ ...settings, dataTypes: newTypes });
    };

    // Generate default batch name
    const defaultBatchName = React.useMemo(() => {
        const now = new Date();
        const dateStr = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
        return projectName ? `${dateStr} ${projectName}` : dateStr;
    }, [projectName]);

    React.useEffect(() => {
        if (!settings.batchName) {
            onSettingsChange({ ...settings, batchName: defaultBatchName });
        }
    }, [defaultBatchName]);

    return (
        <Card className={cn("", className)}>
            <CardHeader className="pb-4">
                <CardTitle className="text-h3 flex items-center gap-2">
                    <Settings className="w-5 h-5" />
                    배치 설정
                </CardTitle>
            </CardHeader>
            <CardContent className="space-y-5">
                {/* Batch Name */}
                <div className="space-y-2">
                    <Label htmlFor="batchName">배치명</Label>
                    <Input
                        id="batchName"
                        value={settings.batchName}
                        onChange={(e) =>
                            onSettingsChange({ ...settings, batchName: e.target.value })
                        }
                        placeholder={defaultBatchName}
                    />
                    <p className="text-small text-muted-foreground">
                        기본값: 날짜 + 프로젝트명
                    </p>
                </div>

                {/* Data Types */}
                <div className="space-y-2">
                    <Label>데이터 유형</Label>
                    <div className="flex flex-wrap gap-3">
                        {DATA_TYPE_OPTIONS.map((option) => (
                            <label
                                key={option.value}
                                className="flex items-center gap-2 cursor-pointer"
                            >
                                <Checkbox
                                    checked={settings.dataTypes.includes(option.value)}
                                    onCheckedChange={() => handleDataTypeToggle(option.value)}
                                />
                                <span className="text-body">{option.label}</span>
                            </label>
                        ))}
                    </div>
                </div>

                {/* Template Matching */}
                <div className="space-y-2">
                    <div className="flex items-center gap-2">
                        <Label htmlFor="templateMatching">설문 템플릿 매칭</Label>
                        <Tooltip>
                            <TooltipTrigger>
                                <HelpCircle className="w-4 h-4 text-muted-foreground" />
                            </TooltipTrigger>
                            <TooltipContent>
                                <p>자동: AI가 템플릿을 자동으로 인식합니다.</p>
                                <p>수동: 사용자가 템플릿을 직접 선택합니다.</p>
                            </TooltipContent>
                        </Tooltip>
                    </div>
                    <Select
                        value={settings.templateMatching}
                        onValueChange={(value: "auto" | "manual") =>
                            onSettingsChange({ ...settings, templateMatching: value })
                        }
                    >
                        <SelectTrigger>
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="auto">자동 인식</SelectItem>
                            <SelectItem value="manual">수동 선택</SelectItem>
                        </SelectContent>
                    </Select>
                </div>

                {/* Advanced Options */}
                <Collapsible open={advancedOpen} onOpenChange={setAdvancedOpen}>
                    <CollapsibleTrigger className="flex items-center gap-2 text-body font-medium text-primary hover:underline">
                        <ChevronDown
                            className={cn(
                                "w-4 h-4 transition-transform",
                                advancedOpen && "rotate-180"
                            )}
                        />
                        OCR 고급 옵션
                    </CollapsibleTrigger>
                    <CollapsibleContent className="pt-4 space-y-4">
                        {/* Language */}
                        <div className="space-y-2">
                            <Label>OCR 언어</Label>
                            <Select
                                value={settings.ocrLanguage}
                                onValueChange={(value) =>
                                    onSettingsChange({ ...settings, ocrLanguage: value })
                                }
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {LANGUAGE_OPTIONS.map((option) => (
                                        <SelectItem key={option.value} value={option.value}>
                                            {option.label}
                                        </SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Checkboxes Enhancement */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>체크박스 인식 강화</Label>
                                <p className="text-small text-muted-foreground">
                                    설문지 체크박스 인식률을 높입니다.
                                </p>
                            </div>
                            <Switch
                                checked={settings.checkboxEnhancement}
                                onCheckedChange={(checked) =>
                                    onSettingsChange({ ...settings, checkboxEnhancement: checked })
                                }
                            />
                        </div>

                        {/* Handwriting */}
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>손글씨 인식</Label>
                                <p className="text-small text-muted-foreground">
                                    수기 응답 텍스트를 인식합니다.
                                </p>
                            </div>
                            <Switch
                                checked={settings.handwritingRecognition}
                                onCheckedChange={(checked) =>
                                    onSettingsChange({ ...settings, handwritingRecognition: checked })
                                }
                            />
                        </div>
                    </CollapsibleContent>
                </Collapsible>

                {/* Privacy Settings */}
                <div className="border-t border-border pt-5 space-y-4">
                    <div className="flex items-center justify-between">
                        <div className="space-y-0.5">
                            <Label>개인정보 포함 여부</Label>
                            <p className="text-small text-muted-foreground">
                                개인정보가 포함된 설문지입니다.
                            </p>
                        </div>
                        <Switch
                            checked={settings.containsPrivateData}
                            onCheckedChange={(checked) =>
                                onSettingsChange({
                                    ...settings,
                                    containsPrivateData: checked,
                                    maskingEnabled: checked ? settings.maskingEnabled : false,
                                })
                            }
                        />
                    </div>

                    {settings.containsPrivateData && (
                        <div className="flex items-center justify-between pl-4 border-l-2 border-primary-50">
                            <div className="space-y-0.5">
                                <Label>자동 마스킹</Label>
                                <p className="text-small text-muted-foreground">
                                    개인정보를 자동으로 마스킹 처리합니다.
                                </p>
                            </div>
                            <Switch
                                checked={settings.maskingEnabled}
                                onCheckedChange={(checked) =>
                                    onSettingsChange({ ...settings, maskingEnabled: checked })
                                }
                            />
                        </div>
                    )}
                </div>
            </CardContent>
        </Card>
    );
}
