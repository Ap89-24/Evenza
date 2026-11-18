"use client";

import React from "react";
import { ChevronLeft, ChevronRight, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";

function getPageNumbers(currentPage, totalPages) {
  if (totalPages <= 7) {
    return Array.from({ length: totalPages }, (_, i) => i + 1);
  }

  const pages = [1];

  if (currentPage > 3) {
    pages.push("ellipsis-start");
  }

  const start = Math.max(2, currentPage - 1);
  const end = Math.min(totalPages - 1, currentPage + 1);

  for (let i = start; i <= end; i++) {
    pages.push(i);
  }

  if (currentPage < totalPages - 2) {
    pages.push("ellipsis-end");
  }

  pages.push(totalPages);
  return pages;
}

const Pagination = ({
  currentPage,
  totalPages,
  onPageChange,
  totalItems,
  pageSize,
  itemLabel = "events",
  className = "",
}) => {
  if (!totalPages || totalPages <= 1) {
    return null;
  }

  const pages = getPageNumbers(currentPage, totalPages);
  const showSummary = typeof totalItems === "number" && typeof pageSize === "number" && totalItems > 0;
  const startItem = showSummary ? (currentPage - 1) * pageSize + 1 : 0;
  const endItem = showSummary ? Math.min(currentPage * pageSize, totalItems) : 0;

  return (
    <div
      className={`mt-8 flex flex-col sm:flex-row items-center justify-between gap-4 border-t border-zinc-800/80 pt-6 ${className}`}
    >
      {showSummary ? (
        <p className="text-xs sm:text-sm text-muted-foreground">
          Showing <span className="font-medium text-foreground">{startItem}</span>–
          <span className="font-medium text-foreground">{endItem}</span> of{" "}
          <span className="font-medium text-foreground">{totalItems}</span> {itemLabel}
        </p>
      ) : (
        <p className="text-xs sm:text-sm text-muted-foreground">
          Page <span className="font-medium text-foreground">{currentPage}</span> of{" "}
          <span className="font-medium text-foreground">{totalPages}</span>
        </p>
      )}

      <nav aria-label="Pagination" className="flex items-center gap-1.5">
        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage <= 1}
          aria-label="Previous page"
          className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 gap-1 cursor-pointer"
        >
          <ChevronLeft className="w-4 h-4" />
          <span className="hidden sm:inline">Previous</span>
        </Button>

        <div className="flex items-center gap-1">
          {pages.map((page) => {
            if (typeof page === "string") {
              return (
                <span
                  key={page}
                  className="flex h-8 w-8 items-center justify-center text-muted-foreground"
                  aria-hidden="true"
                >
                  <MoreHorizontal className="w-4 h-4" />
                </span>
              );
            }

            const isActive = page === currentPage;

            return (
              <Button
                key={page}
                variant={isActive ? "default" : "outline"}
                size="sm"
                onClick={() => onPageChange(page)}
                aria-current={isActive ? "page" : undefined}
                className={
                  isActive
                    ? "h-8 min-w-8 px-2.5 bg-purple-600 hover:bg-purple-500 text-white border-purple-500 cursor-pointer"
                    : "h-8 min-w-8 px-2.5 border-zinc-800 bg-zinc-900/60 text-zinc-300 hover:bg-zinc-800 hover:text-white cursor-pointer"
                }
              >
                {page}
              </Button>
            );
          })}
        </div>

        <Button
          variant="outline"
          size="sm"
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage >= totalPages}
          aria-label="Next page"
          className="border-zinc-800 bg-zinc-900/60 hover:bg-zinc-800 gap-1 cursor-pointer"
        >
          <span className="hidden sm:inline">Next</span>
          <ChevronRight className="w-4 h-4" />
        </Button>
      </nav>
    </div>
  );
};

export default Pagination;
