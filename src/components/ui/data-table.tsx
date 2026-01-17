import { useState } from "react";
import { cn } from "@/lib/utils";
import { ChevronDown, ChevronUp, ChevronsUpDown } from "lucide-react";
import { Checkbox } from "@/components/ui/checkbox";
import { Skeleton } from "@/components/ui/skeleton";

export interface Column<T> {
  key: keyof T | string;
  header: string;
  width?: string;
  align?: "left" | "center" | "right";
  render?: (row: T) => React.ReactNode;
  sortable?: boolean;
}

interface DataTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyField: keyof T;
  selectable?: boolean;
  selectedRows?: T[];
  onSelectionChange?: (rows: T[]) => void;
  onRowClick?: (row: T) => void;
  loading?: boolean;
  emptyMessage?: string;
  className?: string;
}

export function DataTable<T>({
  columns,
  data,
  keyField,
  selectable,
  selectedRows = [],
  onSelectionChange,
  onRowClick,
  loading,
  emptyMessage = "데이터가 없습니다.",
  className,
}: DataTableProps<T>) {
  const [sortConfig, setSortConfig] = useState<{
    key: string;
    direction: "asc" | "desc";
  } | null>(null);

  const handleSort = (key: string) => {
    setSortConfig((prev) => {
      if (prev?.key === key) {
        return prev.direction === "asc"
          ? { key, direction: "desc" }
          : null;
      }
      return { key, direction: "asc" };
    });
  };

  const getSortIcon = (key: string) => {
    if (sortConfig?.key !== key) {
      return <ChevronsUpDown className="w-4 h-4 text-muted-foreground" />;
    }
    return sortConfig.direction === "asc" ? (
      <ChevronUp className="w-4 h-4" />
    ) : (
      <ChevronDown className="w-4 h-4" />
    );
  };

  const sortedData = [...data].sort((a, b) => {
    if (!sortConfig) return 0;
    const aValue = (a as Record<string, unknown>)[sortConfig.key];
    const bValue = (b as Record<string, unknown>)[sortConfig.key];
    
    if (aValue === bValue) return 0;
    if (aValue === null || aValue === undefined) return 1;
    if (bValue === null || bValue === undefined) return -1;
    
    const comparison = aValue < bValue ? -1 : 1;
    return sortConfig.direction === "asc" ? comparison : -comparison;
  });

  const isRowSelected = (row: T) =>
    selectedRows.some((r) => r[keyField] === row[keyField]);

  const handleSelectAll = (checked: boolean) => {
    onSelectionChange?.(checked ? [...data] : []);
  };

  const handleSelectRow = (row: T, checked: boolean) => {
    if (checked) {
      onSelectionChange?.([...selectedRows, row]);
    } else {
      onSelectionChange?.(selectedRows.filter((r) => r[keyField] !== row[keyField]));
    }
  };

  const allSelected = data.length > 0 && selectedRows.length === data.length;
  const someSelected = selectedRows.length > 0 && selectedRows.length < data.length;

  if (loading) {
    return (
      <div className={cn("surface-card overflow-hidden", className)}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="table-header">
                {selectable && (
                  <th className="table-cell w-12">
                    <Skeleton className="h-4 w-4" />
                  </th>
                )}
                {columns.map((col) => (
                  <th key={String(col.key)} className="table-cell">
                    <Skeleton className="h-4 w-20" />
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {[...Array(5)].map((_, i) => (
                <tr key={i} className="table-row">
                  {selectable && (
                    <td className="table-cell">
                      <Skeleton className="h-4 w-4" />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td key={String(col.key)} className="table-cell">
                      <Skeleton className="h-4 w-full max-w-32" />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    );
  }

  return (
    <div className={cn("surface-card overflow-hidden", className)}>
      <div className="overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="table-header">
              {selectable && (
                <th className="table-cell w-12">
                  <Checkbox
                    checked={allSelected}
                    ref={(el) => {
                      if (el) {
                        (el as HTMLButtonElement).dataset.state = someSelected
                          ? "indeterminate"
                          : allSelected
                          ? "checked"
                          : "unchecked";
                      }
                    }}
                    onCheckedChange={handleSelectAll}
                    aria-label="전체 선택"
                  />
                </th>
              )}
              {columns.map((col) => (
                <th
                  key={String(col.key)}
                  className={cn(
                    "table-cell text-small font-semibold text-muted-foreground",
                    col.align === "right" && "text-right",
                    col.align === "center" && "text-center",
                    col.sortable && "cursor-pointer select-none hover:text-foreground"
                  )}
                  style={{ width: col.width }}
                  onClick={() => col.sortable && handleSort(String(col.key))}
                >
                  <span className="inline-flex items-center gap-1">
                    {col.header}
                    {col.sortable && getSortIcon(String(col.key))}
                  </span>
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {sortedData.length === 0 ? (
              <tr>
                <td
                  colSpan={columns.length + (selectable ? 1 : 0)}
                  className="py-16 text-center text-muted-foreground"
                >
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              sortedData.map((row) => (
                <tr
                  key={String(row[keyField])}
                  className={cn(
                    "table-row",
                    onRowClick && "cursor-pointer",
                    isRowSelected(row) && "bg-primary-50"
                  )}
                  onClick={() => onRowClick?.(row)}
                >
                  {selectable && (
                    <td
                      className="table-cell"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <Checkbox
                        checked={isRowSelected(row)}
                        onCheckedChange={(checked) =>
                          handleSelectRow(row, checked as boolean)
                        }
                        aria-label="행 선택"
                      />
                    </td>
                  )}
                  {columns.map((col) => (
                    <td
                      key={String(col.key)}
                      className={cn(
                        "table-cell text-body",
                        col.align === "right" && "text-right font-mono-nums",
                        col.align === "center" && "text-center"
                      )}
                    >
                      {col.render
                        ? col.render(row)
                        : String((row as Record<string, unknown>)[String(col.key)] ?? "-")}
                    </td>
                  ))}
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
