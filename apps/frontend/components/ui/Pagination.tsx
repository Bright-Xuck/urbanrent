// ============================================================
// PAGINATION
// ============================================================
// Prev/Next controls with a "Page x of y" readout. The parent owns the
// page number; this component only reports the intent.
// ============================================================

import { ChevronLeft, ChevronRight } from "lucide-react";

// The bar is `.pagination` + `.page-btn` in globals.css — the same look the
// demo uses under its listing grid.

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
    <nav className="pagination" aria-label="Pagination">
      <button type="button" disabled={page <= 1} onClick={onPrevious} className="page-btn">
        <ChevronLeft className="h-4 w-4" aria-hidden /> Previous
      </button>

      <span>
        Page {page} of {totalPages}
      </span>

      <button type="button" disabled={page >= totalPages} onClick={onNext} className="page-btn">
        Next <ChevronRight className="h-4 w-4" aria-hidden />
      </button>
    </nav>
  );
}