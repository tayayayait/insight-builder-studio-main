import * as React from "react";
import { Search, X, ChevronDown, Filter } from "lucide-react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { format } from "date-fns";
import { ko } from "date-fns/locale";
import { DateRange } from "react-day-picker";

export interface FilterChip {
    id: string;
    label: string;
    value: string;
}

export interface FilterOption {
    value: string;
    label: string;
}

export interface FilterBarProps {
    searchValue?: string;
    onSearchChange?: (value: string) => void;
    searchPlaceholder?: string;

    statusOptions?: FilterOption[];
    statusValue?: string;
    onStatusChange?: (value: string) => void;

    dateRange?: DateRange;
    onDateRangeChange?: (range: DateRange | undefined) => void;

    chips?: FilterChip[];
    onChipRemove?: (id: string) => void;

    onAdvancedFilter?: () => void;
    showAdvancedFilter?: boolean;

    className?: string;
    children?: React.ReactNode;
}

export function FilterBar({
    searchValue = "",
    onSearchChange,
    searchPlaceholder = "검색...",
    statusOptions,
    statusValue,
    onStatusChange,
    dateRange,
    onDateRangeChange,
    chips = [],
    onChipRemove,
    onAdvancedFilter,
    showAdvancedFilter = false,
    className,
    children,
}: FilterBarProps) {
    const [datePickerOpen, setDatePickerOpen] = React.useState(false);

    const formatDateRange = (range: DateRange | undefined) => {
        if (!range?.from) return "기간 선택";
        if (!range.to) return format(range.from, "yyyy.MM.dd", { locale: ko });
        return `${format(range.from, "yyyy.MM.dd", { locale: ko })} - ${format(range.to, "yyyy.MM.dd", { locale: ko })}`;
    };

    return (
        <div className={cn("space-y-3", className)}>
            <div className="flex flex-wrap items-center gap-3 p-4 bg-card border border-border rounded-[var(--radius-md)]">
                {/* Search */}
                <div className="relative flex-1 min-w-[200px] max-w-sm">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                        value={searchValue}
                        onChange={(e) => onSearchChange?.(e.target.value)}
                        placeholder={searchPlaceholder}
                        className="pl-9"
                    />
                </div>

                {/* Date Range */}
                {onDateRangeChange && (
                    <Popover open={datePickerOpen} onOpenChange={setDatePickerOpen}>
                        <PopoverTrigger asChild>
                            <Button
                                variant="outline"
                                className={cn(
                                    "justify-start text-left font-normal min-w-[200px]",
                                    !dateRange?.from && "text-muted-foreground"
                                )}
                            >
                                <span className="truncate">{formatDateRange(dateRange)}</span>
                                <ChevronDown className="ml-auto h-4 w-4 opacity-50" />
                            </Button>
                        </PopoverTrigger>
                        <PopoverContent className="w-auto p-0" align="start">
                            <Calendar
                                initialFocus
                                mode="range"
                                defaultMonth={dateRange?.from}
                                selected={dateRange}
                                onSelect={(range) => {
                                    onDateRangeChange(range);
                                    if (range?.to) {
                                        setDatePickerOpen(false);
                                    }
                                }}
                                numberOfMonths={2}
                                locale={ko}
                            />
                        </PopoverContent>
                    </Popover>
                )}

                {/* Status Select */}
                {statusOptions && statusOptions.length > 0 && (
                    <Select value={statusValue} onValueChange={onStatusChange}>
                        <SelectTrigger className="w-[140px]">
                            <SelectValue placeholder="상태" />
                        </SelectTrigger>
                        <SelectContent>
                            {statusOptions.map((option) => (
                                <SelectItem key={option.value} value={option.value}>
                                    {option.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                )}

                {/* Custom children (additional filters) */}
                {children}

                {/* Advanced Filter */}
                {showAdvancedFilter && (
                    <Button variant="outline" onClick={onAdvancedFilter}>
                        <Filter className="w-4 h-4 mr-2" />
                        고급 필터
                    </Button>
                )}
            </div>

            {/* Filter Chips */}
            {chips.length > 0 && (
                <div className="flex flex-wrap gap-2">
                    {chips.map((chip) => (
                        <div
                            key={chip.id}
                            className="inline-flex items-center gap-1.5 h-7 px-2.5 bg-primary-50 text-primary text-small font-medium rounded-full"
                        >
                            <span>{chip.label}: {chip.value}</span>
                            {onChipRemove && (
                                <button
                                    onClick={() => onChipRemove(chip.id)}
                                    className="flex items-center justify-center w-4 h-4 rounded-full hover:bg-primary/20 transition-colors"
                                >
                                    <X className="w-3 h-3" />
                                </button>
                            )}
                        </div>
                    ))}
                    {chips.length > 0 && onChipRemove && (
                        <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => chips.forEach((chip) => onChipRemove(chip.id))}
                            className="h-7 text-muted-foreground hover:text-danger"
                        >
                            전체 해제
                        </Button>
                    )}
                </div>
            )}
        </div>
    );
}
