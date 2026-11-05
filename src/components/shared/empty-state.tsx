import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyTitle,
} from "@/components/ui/empty";

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
  <Empty className={className}>
    <EmptyHeader>
      <EmptyTitle>{title}</EmptyTitle>
      <EmptyDescription>{description}</EmptyDescription>
    </EmptyHeader>
  </Empty>
);
