/**
 * ExportService.ts
 * 
 * PDF 보고서 생성 및 Excel 데이터 내보내기 서비스
 */

import jsPDF from 'jspdf';
import html2canvas from 'html2canvas';
import * as XLSX from 'xlsx';

// 한글 폰트 로드 함수
async function loadKoreanFont(doc: jsPDF): Promise<void> {
    try {
        // NanumGothic from jsDelivr (Corrected URL)
        const fontUrl = 'https://cdn.jsdelivr.net/gh/google/fonts@main/ofl/nanumgothic/NanumGothic-Regular.ttf';
        const response = await fetch(fontUrl);
        const blob = await response.blob();

        return new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.onloadend = () => {
                const base64data = reader.result?.toString().split(',')[1];
                if (base64data) {
                    doc.addFileToVFS('NanumGothic-Regular.ttf', base64data);
                    doc.addFont('NanumGothic-Regular.ttf', 'NanumGothic', 'normal');
                    doc.setFont('NanumGothic');
                    resolve();
                } else {
                    reject(new Error("Failed to parse font data"));
                }
            };
            reader.onerror = () => reject(new Error("Failed to read font file"));
            reader.readAsDataURL(blob);
        });
    } catch (error) {
        console.error("Font loading failed:", error);
        // Fallback or just continue (text might still be broken but process won't crash)
    }
}

// ============================================
// 1. PDF 보고서 생성
// ============================================

export interface PDFExportOptions {
    title: string;
    subtitle?: string;
    filename?: string;
    orientation?: 'portrait' | 'landscape';
}

/**
 * 특정 DOM 요소를 PDF로 내보내기
 */
export async function exportElementToPDF(
    elementId: string,
    options: PDFExportOptions
): Promise<void> {
    const element = document.getElementById(elementId);
    if (!element) {
        throw new Error(`Element with id "${elementId}" not found`);
    }

    // 캔버스로 변환
    const canvas = await html2canvas(element, {
        scale: 2,
        useCORS: true,
        logging: false,
        backgroundColor: '#ffffff'
    });

    const imgData = canvas.toDataURL('image/png');
    const imgWidth = canvas.width;
    const imgHeight = canvas.height;

    // PDF 생성
    const orientation = options.orientation || 'portrait';
    const pdf = new jsPDF({
        orientation,
        unit: 'mm',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // 헤더 추가
    pdf.setFontSize(18);
    pdf.text(options.title, pdfWidth / 2, 15, { align: 'center' });

    if (options.subtitle) {
        pdf.setFontSize(12);
        pdf.setTextColor(128);
        pdf.text(options.subtitle, pdfWidth / 2, 22, { align: 'center' });
    }

    // 이미지 크기 계산 (여백 고려)
    const margin = 15;
    const headerHeight = options.subtitle ? 30 : 22;
    const availableWidth = pdfWidth - margin * 2;
    const availableHeight = pdfHeight - headerHeight - margin;

    const ratio = Math.min(
        availableWidth / (imgWidth / 2),
        availableHeight / (imgHeight / 2)
    );

    const finalWidth = (imgWidth / 2) * ratio;
    const finalHeight = (imgHeight / 2) * ratio;

    // 이미지 추가
    pdf.addImage(
        imgData,
        'PNG',
        (pdfWidth - finalWidth) / 2,
        headerHeight + 5,
        finalWidth,
        finalHeight
    );

    // 다운로드
    const filename = options.filename || `${options.title.replace(/\s+/g, '_')}.pdf`;
    pdf.save(filename);
}

/**
 * 분석 결과 데이터를 PDF 보고서로 생성
 */
export async function exportAnalysisReportToPDF(
    analysisData: any,
    options: PDFExportOptions,
    customLabels?: Record<string, string>,
    chartImages?: { scoreDist?: string, categoryScore?: string }
): Promise<void> {
    const pdf = new jsPDF({
        orientation: options.orientation || 'portrait',
        unit: 'mm',
        format: 'a4'
    });

    const pdfWidth = pdf.internal.pageSize.getWidth();
    const pdfHeight = pdf.internal.pageSize.getHeight();

    // Helper: Get Label
    const getLabel = (id: string, original: string) => customLabels?.[id] || original;

    // 한글 폰트 로드
    await loadKoreanFont(pdf);

    let yPos = 20;

    // ---------------------------------------------------------
    // PAGE 1: Executive Summary
    // ---------------------------------------------------------

    // Title
    pdf.setFontSize(22);
    pdf.setTextColor(33, 37, 41);
    pdf.setFont('NanumGothic');
    pdf.text(options.title, pdfWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    if (options.subtitle) {
        pdf.setFontSize(11);
        pdf.setTextColor(108, 117, 125);
        pdf.text(options.subtitle, pdfWidth / 2, yPos, { align: 'center' });
        yPos += 20;
    }

    // Summary Stats
    const basic = analysisData.basic;
    if (basic) {
        pdf.setDrawColor(233, 236, 239);
        pdf.setFillColor(248, 249, 250);
        pdf.roundedRect(15, yPos, pdfWidth - 30, 25, 3, 3, 'FD');

        pdf.setFontSize(10);
        pdf.setTextColor(73, 80, 87);
        const statsY = yPos + 8;

        pdf.text("총 응답 수", 25, statsY);
        pdf.text("전체 평균", 75, statsY);
        pdf.text("분석 문항", 125, statsY);
        pdf.text("완료율", 175, statsY);

        pdf.setFontSize(16);
        pdf.setTextColor(33, 37, 41);
        const valY = statsY + 10;

        pdf.text(`${basic.totalResponses}건`, 25, valY);
        pdf.text(basic.overallMean?.toFixed(2) || '0.00', 75, valY);
        pdf.text(`${basic.questionStats.length}개`, 125, valY);
        pdf.text("100%", 175, valY);

        yPos += 35;
    }

    // Insights (Strengths & Weaknesses)
    if (basic?.questionStats) {
        const numericStats = basic.questionStats
            .filter((q: any) => q.stats.count > 0 && q.stats.mean > 0)
            .sort((a: any, b: any) => b.stats.mean - a.stats.mean);

        const strengths = numericStats.slice(0, 5);
        const weaknesses = numericStats
            .slice()
            .sort((a: any, b: any) => a.stats.mean - b.stats.mean)
            .slice(0, 5);

        // Section Title
        pdf.setFontSize(14);
        pdf.setTextColor(33, 37, 41);
        pdf.text("분석 요약 (Executive Summary)", 15, yPos);
        yPos += 10;

        // Two Columns
        const colWidth = (pdfWidth - 40) / 2;
        const leftX = 15;
        const rightX = 15 + colWidth + 10;
        const listStartY = yPos;

        // Strengths (Left)
        pdf.setFillColor(240, 253, 244); // Green-50
        pdf.rect(leftX, yPos, colWidth, 8, 'F');
        pdf.setFontSize(11);
        pdf.setTextColor(21, 128, 61); // Green-700
        pdf.text("✅ 현재 강점 (Top 5)", leftX + 2, yPos + 6);

        yPos += 12;
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        strengths.forEach((item: any, idx: number) => {
            const label = getLabel(item.questionId, item.questionLabel);
            const text = `${idx + 1}. ${label.length > 18 ? label.slice(0, 18) + '...' : label}`;
            pdf.text(text, leftX + 2, yPos);
            pdf.text(item.stats.mean.toFixed(2), leftX + colWidth - 5, yPos, { align: 'right' });
            yPos += 7;
        });

        // Weaknesses (Right)
        let rightY = listStartY;
        pdf.setFillColor(255, 247, 237); // Orange-50
        pdf.rect(rightX, rightY, colWidth, 8, 'F');
        pdf.setFontSize(11);
        pdf.setTextColor(194, 65, 12); // Orange-700
        pdf.text("⚠️ 집중 개선 필요 (Bottom 5)", rightX + 2, rightY + 6);

        rightY += 12;
        pdf.setFontSize(10);
        pdf.setTextColor(55, 65, 81);
        weaknesses.forEach((item: any, idx: number) => {
            const label = getLabel(item.questionId, item.questionLabel);
            const text = `${idx + 1}. ${label.length > 18 ? label.slice(0, 18) + '...' : label}`;
            pdf.text(text, rightX + 2, rightY);
            pdf.text(item.stats.mean.toFixed(2), rightX + colWidth - 5, rightY, { align: 'right' });
            rightY += 7;
        });

        yPos = Math.max(yPos, rightY) + 15;
    }

    // Charts
    if (chartImages) {
        if (chartImages.scoreDist) {
            // Check page break
            if (yPos + 80 > pdfHeight) { pdf.addPage(); yPos = 20; }

            pdf.setFontSize(12);
            pdf.setTextColor(33, 37, 41);
            pdf.text("1. 점수 분포", 15, yPos);
            yPos += 5;
            pdf.addImage(chartImages.scoreDist, 'PNG', 15, yPos, (pdfWidth - 30) / 2, 60);
        }

        if (chartImages.categoryScore) {
            const xPos = chartImages.scoreDist ? 15 + (pdfWidth - 30) / 2 + 5 : 15;
            if (!chartImages.scoreDist) {
                pdf.text("2. 항목별 점수", 15, yPos - 5);
            } else {
                pdf.text("2. 항목별 점수", xPos, yPos - 5);
            }
            pdf.addImage(chartImages.categoryScore, 'PNG', xPos, yPos, (pdfWidth - 30) / 2, 60);
        }
        yPos += 70;
    }

    // ---------------------------------------------------------
    // PAGE 2: Detailed Stats (Existing Table)
    // ---------------------------------------------------------
    pdf.addPage();
    yPos = 20;
    pdf.setFontSize(16);
    pdf.setTextColor(33, 37, 41);
    pdf.text("문항별 상세 분석", 15, yPos);
    yPos += 15;

    // Table Header
    pdf.setFillColor(241, 243, 245);
    pdf.rect(15, yPos, pdfWidth - 30, 10, 'F');
    pdf.setFontSize(10);
    pdf.text("문항", 20, yPos + 7);
    pdf.text("평균", 150, yPos + 7, { align: 'right' });
    pdf.text("표준편차", 180, yPos + 7, { align: 'right' });
    yPos += 10;

    // Table Rows
    if (basic?.questionStats) {
        basic.questionStats.forEach((stat: any) => {
            if (yPos > pdfHeight - 20) {
                pdf.addPage();
                yPos = 20;
            }

            const label = getLabel(stat.questionId, stat.questionLabel);
            const displayLabel = label.length > 35 ? label.slice(0, 35) + '...' : label;

            pdf.setFontSize(10);
            pdf.text(displayLabel, 20, yPos + 7);

            if (stat.stats.mean > 0) {
                pdf.text(stat.stats.mean.toFixed(2), 150, yPos + 7, { align: 'right' });
                pdf.text(stat.stats.stdDev.toFixed(2), 180, yPos + 7, { align: 'right' });
            } else {
                pdf.text("-", 150, yPos + 7, { align: 'right' });
                pdf.text("-", 180, yPos + 7, { align: 'right' });
            }

            pdf.setDrawColor(233, 236, 239);
            pdf.line(15, yPos + 10, pdfWidth - 15, yPos + 10);
            yPos += 12;
        });
    }

    // Add Additional Analysis Summaries (T-Test / IPA / Text)
    // t-검정 요약
    if (analysisData?.ttest?.length) {
        if (yPos + 40 > pdfHeight) { pdf.addPage(); yPos = 20; }
        else { yPos += 10; }

        pdf.setFontSize(14);
        pdf.setTextColor(33, 37, 41);
        pdf.text('t-검정 요약', 15, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        analysisData.ttest.slice(0, 10).forEach((item: any) => {
            if (yPos > pdfHeight - 20) { pdf.addPage(); yPos = 20; }
            const tValue = Number.isFinite(item.tStatistic) ? item.tStatistic.toFixed(3) : 'N/A';
            const pValue = Number.isFinite(item.pValue) ? item.pValue.toFixed(4) : 'N/A';
            pdf.text(
                `${item.questionALabel || item.questionAId} → ${item.questionBLabel || item.questionBId} | t=${tValue}, p=${pValue}`,
                20, yPos
            );
            yPos += 6;
        });
    }

    // IPA 요약
    if (analysisData?.ipa?.items?.length) {
        if (yPos + 40 > pdfHeight) { pdf.addPage(); yPos = 20; }
        else { yPos += 10; }

        pdf.setFontSize(14);
        pdf.text('IPA 요약', 15, yPos);
        yPos += 10;

        pdf.setFontSize(10);
        analysisData.ipa.items.slice(0, 10).forEach((item: any) => {
            if (yPos > pdfHeight - 20) { pdf.addPage(); yPos = 20; }
            const importance = Number.isFinite(item.importance) ? item.importance.toFixed(2) : 'N/A';
            const performance = Number.isFinite(item.performance) ? item.performance.toFixed(2) : 'N/A';
            pdf.text(`${item.label} | 중요도 ${importance}, 성과 ${performance}`, 20, yPos);
            yPos += 6;
        });
    }

    // Footer
    const pageCount = pdf.internal.pages.length - 1;
    for (let i = 1; i <= pageCount; i++) {
        pdf.setPage(i);
        pdf.setFontSize(9);
        pdf.setTextColor(128);
        pdf.text(
            `생성일: ${new Date().toLocaleDateString('ko-KR')} | 페이지 ${i}/${pageCount}`,
            pdfWidth / 2,
            pdf.internal.pageSize.getHeight() - 10,
            { align: 'center' }
        );
    }

    // Save
    pdf.save(options.filename || 'report.pdf');
}

// ============================================
// 2. Excel 내보내기
// ============================================

export interface ExcelExportOptions {
    filename?: string;
    sheetName?: string;
}

/**
 * 분석 결과를 Excel 파일로 내보내기
 */
export function exportAnalysisToExcel(
    analysisData: any,
    options: ExcelExportOptions = {}
): void {
    const workbook = XLSX.utils.book_new();

    // 요약 시트
    if (analysisData?.basic) {
        const summaryData = [
            ['분석 요약'],
            [''],
            ['항목', '값'],
            ['총 응답 수', analysisData.basic.totalResponses],
            ['분석 문항 수', analysisData.basic.totalQuestions],
            ['전체 평균', analysisData.basic.overallMean?.toFixed(2) || 'N/A'],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, '요약');
    }

    // 문항별 통계 시트
    if (analysisData?.basic?.questionStats) {
        const statsData = [
            ['문항ID', '문항명', '응답수', '평균', '중앙값', '표준편차', '최소', '최대']
        ];

        analysisData.basic.questionStats.forEach((q: any) => {
            statsData.push([
                q.questionId,
                q.questionLabel,
                q.stats.count,
                q.stats.mean?.toFixed(2),
                q.stats.median?.toFixed(2),
                q.stats.stdDev?.toFixed(2),
                q.stats.min,
                q.stats.max
            ]);
        });

        const statsSheet = XLSX.utils.aoa_to_sheet(statsData);
        XLSX.utils.book_append_sheet(workbook, statsSheet, '문항별통계');
    }

    // 상관관계 시트
    if (analysisData?.correlation) {
        const corrData = [[''].concat(analysisData.correlation.variables)];

        analysisData.correlation.variables.forEach((v: string, i: number) => {
            const row = [v];
            analysisData.correlation.matrix[i].forEach((val: number) => {
                row.push(val.toFixed(3));
            });
            corrData.push(row);
        });

        const corrSheet = XLSX.utils.aoa_to_sheet(corrData);
        XLSX.utils.book_append_sheet(workbook, corrSheet, '상관관계');
    }

    // t-검정 시트
    if (analysisData?.ttest && analysisData.ttest.length > 0) {
        const ttestData = [
            ['t-검정 결과'],
            [''],
            ['문항(전)', '문항(후)', 'N', '평균(전)', '평균(후)', '차이', 't', 'p', '유의']
        ];

        analysisData.ttest.forEach((item: any) => {
            ttestData.push([
                item.questionALabel || item.questionAId,
                item.questionBLabel || item.questionBId,
                item.n,
                Number.isFinite(item.meanA) ? item.meanA.toFixed(2) : 'N/A',
                Number.isFinite(item.meanB) ? item.meanB.toFixed(2) : 'N/A',
                Number.isFinite(item.meanDiff) ? item.meanDiff.toFixed(2) : 'N/A',
                Number.isFinite(item.tStatistic) ? item.tStatistic.toFixed(3) : 'N/A',
                Number.isFinite(item.pValue) ? item.pValue.toFixed(4) : 'N/A',
                item.significant ? '유의' : '비유의'
            ]);
        });

        const ttestSheet = XLSX.utils.aoa_to_sheet(ttestData);
        XLSX.utils.book_append_sheet(workbook, ttestSheet, 't-검정');
    }

    // IPA 시트
    if (analysisData?.ipa && analysisData.ipa.items?.length > 0) {
        const ipaData = [
            ['IPA 분석'],
            [''],
            ['문항ID', '문항명', '중요도', '성과', '사분면']
        ];

        analysisData.ipa.items.forEach((item: any) => {
            ipaData.push([
                item.questionId,
                item.label,
                Number.isFinite(item.importance) ? item.importance.toFixed(2) : 'N/A',
                Number.isFinite(item.performance) ? item.performance.toFixed(2) : 'N/A',
                item.quadrant
            ]);
        });

        const ipaSheet = XLSX.utils.aoa_to_sheet(ipaData);
        XLSX.utils.book_append_sheet(workbook, ipaSheet, 'IPA');
    }

    // 다운로드
    const filename = options.filename || 'analysis_report.xlsx';
    XLSX.writeFile(workbook, filename);
}

/**
 * 원천 데이터를 Excel 파일로 내보내기
 */
export function exportRawDataToExcel(
    data: any[],
    headers: string[],
    options: ExcelExportOptions = {}
): void {
    const worksheetData = [headers, ...data.map(row =>
        headers.map(h => row[h] ?? '')
    )];

    const workbook = XLSX.utils.book_new();
    const worksheet = XLSX.utils.aoa_to_sheet(worksheetData);
    XLSX.utils.book_append_sheet(workbook, worksheet, options.sheetName || 'Data');

    const filename = options.filename || 'data_export.xlsx';
    XLSX.writeFile(workbook, filename);
}

export default {
    exportElementToPDF,
    exportAnalysisReportToPDF,
    exportAnalysisToExcel,
    exportRawDataToExcel
};
