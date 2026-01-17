import { useMemo } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

interface TextInsightCardProps {
  questionLabel: string;
  responses: string[];
  keywords?: string[];
}

const TOKEN_REGEX = /[A-Za-z0-9\uAC00-\uD7A3]+/g;
const STOP_WORDS = new Set([
  "the",
  "and",
  "for",
  "with",
  "this",
  "that",
  "have",
  "from",
  "your",
  "you",
  "are",
  "was",
  "were",
  "what",
  "when",
  "where",
  "which",
  "into",
  "onto",
  "our",
  "their",
  "they",
  "them",
  "then",
  "than",
  "but",
  "not",
  "yes",
  "no",
  "ok",
  "okay",
  "very",
  "much",
  "more",
  "less",
]);

const extractKeywords = (values: string[], limit = 5): string[] => {
  const frequency = new Map<string, number>();
  values.forEach((value) => {
    const tokens = value.toLowerCase().match(TOKEN_REGEX) || [];
    tokens.forEach((token) => {
      const cleaned = token.replace(/_/g, "").trim();
      if (cleaned.length < 2) return;
      if (/^\d+$/.test(cleaned)) return;
      if (STOP_WORDS.has(cleaned)) return;
      frequency.set(cleaned, (frequency.get(cleaned) || 0) + 1);
    });
  });

  return Array.from(frequency.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, limit)
    .map(([token]) => token);
};

const truncate = (value: string, maxLength = 120) =>
  value.length > maxLength ? `${value.slice(0, maxLength)}...` : value;

export function TextInsightCard({ questionLabel, responses, keywords }: TextInsightCardProps) {
  const cleanedResponses = useMemo(
    () => responses.map((value) => value.trim()).filter((value) => value.length > 0),
    [responses]
  );

  const responseCount = cleanedResponses.length;
  const totalLength = cleanedResponses.reduce((sum, value) => sum + value.length, 0);
  const averageLength = responseCount > 0 ? Math.round(totalLength / responseCount) : 0;
  const topKeywords = keywords && keywords.length > 0 ? keywords : extractKeywords(cleanedResponses);
  const samples = cleanedResponses.slice(0, 2).map((value) => truncate(value));

  return (
    <Card>
      <CardHeader className="pb-3">
        <CardTitle className="text-base">{questionLabel}</CardTitle>
        <p className="text-xs text-muted-foreground">
          응답 {responseCount}건 · 평균 길이 {averageLength}자
        </p>
      </CardHeader>
      <CardContent>
        <div className="flex flex-wrap gap-1">
          {topKeywords.length > 0 ? (
            topKeywords.map((keyword) => (
              <Badge key={`${questionLabel}-${keyword}`} variant="secondary">
                {keyword}
              </Badge>
            ))
          ) : (
            <span className="text-xs text-muted-foreground">키워드 없음</span>
          )}
        </div>
        {samples.length > 0 && (
          <div className="mt-3 space-y-2 text-sm text-muted-foreground">
            {samples.map((sample, index) => (
              <div key={`${questionLabel}-sample-${index}`} className="rounded-md bg-muted/30 p-2">
                {sample}
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
