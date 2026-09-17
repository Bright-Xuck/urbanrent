// ============================================================
// PAGINATION
// ============================================================
// Prev/Next controls with a "Page x of y" readout. The parent owns the
// page number; this component only reports the intent.
// ============================================================

import { ChevronLeft, ChevronRight } from "lucide-react";

type PaginationProps = {
  page: number;
  totalPages: number;
  onPrevious: () => void;
  onNext: () => void;
};

export default function Pagination({
  page,
  totalPages,
  onPrevious,
  onNext,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="mt-8 flex items-center justify-between border-t border-line pt-6 text-sm">
      <button
        type="button"
        disabled={page <= 1}
        onClick={onPrevious}
        className="inline-flex items-center gap-1 border border-line px-4 py-2 text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
      </button>

      <span className="text-ink-soft">
        Page {page} of {totalPages}
      </span>

      <button
        type="button"
        disabled={page >= totalPages}
        onClick={onNext}
        className="inline-flex items-center gap-1 border border-line px-4 py-2 text-ink hover:border-ink disabled:cursor-not-allowed disabled:opacity-40"
      >
        Next <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </div>
  );
}