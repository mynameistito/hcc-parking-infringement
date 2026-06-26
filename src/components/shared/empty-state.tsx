interface EmptyStateProps {
  title?: string;
  description: string;
  className?: string;
}

/** Centered empty placeholder for ranked lists and workbench panels. */
export const EmptyState = ({
  title = "No rows yet",
  description,
  className,
}: EmptyStateProps) => (
  <div
    className={
      className ?? "grid min-h-28 place-items-center px-4 py-6 text-center"
    }
  >
    <div>
      <p className="text-sm font-medium text-foreground">{title}</p>
      <p className="mt-1 text-sm text-muted-foreground">{description}</p>
    </div>
  </div>
);
