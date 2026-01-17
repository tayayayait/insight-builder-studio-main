import { useState } from "react";
import { Save, RotateCcw, HelpCircle } from "lucide-react";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Slider } from "@/components/ui/slider";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Tooltip,
    TooltipContent,
    TooltipTrigger,
} from "@/components/ui/tooltip";
import { toast } from "@/hooks/use-toast";

interface SystemSettings {
    allowUnconfirmedAnalysis: boolean;
    confidenceThreshold: number;
    ocrLanguage: string;
    autoSaveInterval: number;
    maskingEnabled: boolean;
}

const DEFAULT_SETTINGS: SystemSettings = {
    allowUnconfirmedAnalysis: false,
    confidenceThreshold: 80,
    ocrLanguage: "ko",
    autoSaveInterval: 30,
    maskingEnabled: true,
};

export default function AdminSettings() {
    const [settings, setSettings] = useState<SystemSettings>(DEFAULT_SETTINGS);
    const [hasChanges, setHasChanges] = useState(false);

    const updateSetting = <K extends keyof SystemSettings>(key: K, value: SystemSettings[K]) => {
        setSettings((prev) => ({ ...prev, [key]: value }));
        setHasChanges(true);
    };

    const handleSave = () => {
        toast({
            title: "설정 저장됨",
            description: "시스템 설정이 성공적으로 저장되었습니다.",
        });
        setHasChanges(false);
    };

    const handleReset = () => {
        setSettings(DEFAULT_SETTINGS);
        toast({
            title: "설정 초기화",
            description: "기본 설정으로 복원되었습니다.",
        });
        setHasChanges(false);
    };

    return (
        <AppLayout>
            <PageHeader
                title="시스템 설정"
                description="검수 정책 및 시스템 옵션을 설정합니다."
                actions={
                    <div className="flex items-center gap-2">
                        <Button variant="outline" onClick={handleReset} disabled={!hasChanges}>
                            <RotateCcw className="w-4 h-4 mr-2" />
                            초기화
                        </Button>
                        <Button onClick={handleSave} disabled={!hasChanges}>
                            <Save className="w-4 h-4 mr-2" />
                            저장
                        </Button>
                    </div>
                }
            />

            <div className="space-y-6">
                {/* Validation Policy */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h3">검수 정책</CardTitle>
                        <CardDescription>OCR 결과 검수 및 분석 관련 정책을 설정합니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <div className="flex items-center gap-2">
                                    <Label>미확정 항목 포함 분석 허용</Label>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>활성화 시 미확정 항목이 있어도 통계 분석을 실행할 수 있습니다.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <p className="text-small text-muted-foreground">
                                    위험: 분석 결과의 정확도가 떨어질 수 있습니다.
                                </p>
                            </div>
                            <Switch
                                checked={settings.allowUnconfirmedAnalysis}
                                onCheckedChange={(v) => updateSetting("allowUnconfirmedAnalysis", v)}
                            />
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-2">
                                    <Label>OCR 신뢰도 임계값</Label>
                                    <Tooltip>
                                        <TooltipTrigger>
                                            <HelpCircle className="w-4 h-4 text-muted-foreground" />
                                        </TooltipTrigger>
                                        <TooltipContent>
                                            <p>이 값보다 낮은 신뢰도의 항목은 검수 대상이 됩니다.</p>
                                        </TooltipContent>
                                    </Tooltip>
                                </div>
                                <span className="font-mono-nums font-medium">{settings.confidenceThreshold}%</span>
                            </div>
                            <Slider
                                value={[settings.confidenceThreshold]}
                                min={50}
                                max={99}
                                step={1}
                                onValueChange={(v) => updateSetting("confidenceThreshold", v[0])}
                            />
                            <div className="flex justify-between text-xs text-muted-foreground">
                                <span>낮음 (검수 많음)</span>
                                <span>높음 (검수 적음)</span>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* OCR Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h3">OCR 설정</CardTitle>
                        <CardDescription>문서 인식 관련 기본 설정입니다.</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-6">
                        <div className="grid gap-4 sm:grid-cols-2">
                            <div className="space-y-2">
                                <Label>기본 OCR 언어</Label>
                                <Select
                                    value={settings.ocrLanguage}
                                    onValueChange={(v) => updateSetting("ocrLanguage", v)}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="ko">한국어</SelectItem>
                                        <SelectItem value="en">영어</SelectItem>
                                        <SelectItem value="ja">일본어</SelectItem>
                                        <SelectItem value="zh">중국어</SelectItem>
                                        <SelectItem value="mixed">혼합</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>

                            <div className="space-y-2">
                                <Label>자동 저장 간격</Label>
                                <Select
                                    value={String(settings.autoSaveInterval)}
                                    onValueChange={(v) => updateSetting("autoSaveInterval", Number(v))}
                                >
                                    <SelectTrigger>
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="10">10초</SelectItem>
                                        <SelectItem value="30">30초</SelectItem>
                                        <SelectItem value="60">1분</SelectItem>
                                        <SelectItem value="300">5분</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                    </CardContent>
                </Card>

                {/* Privacy Settings */}
                <Card>
                    <CardHeader>
                        <CardTitle className="text-h3">개인정보 보호</CardTitle>
                        <CardDescription>개인정보 처리 기본 정책을 설정합니다.</CardDescription>
                    </CardHeader>
                    <CardContent>
                        <div className="flex items-center justify-between">
                            <div className="space-y-0.5">
                                <Label>기본 마스킹 활성화</Label>
                                <p className="text-small text-muted-foreground">
                                    새 프로젝트 생성 시 개인정보 마스킹이 기본 활성화됩니다.
                                </p>
                            </div>
                            <Switch
                                checked={settings.maskingEnabled}
                                onCheckedChange={(v) => updateSetting("maskingEnabled", v)}
                            />
                        </div>
                    </CardContent>
                </Card>
            </div>
        </AppLayout>
    );
}
