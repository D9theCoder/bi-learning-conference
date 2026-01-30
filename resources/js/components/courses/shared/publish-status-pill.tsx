interface PublishStatusPillProps {
  isPublished: boolean;
  publishedLabel?: string;
  draftLabel?: string;
}

export function PublishStatusPill({
  isPublished,
  publishedLabel = 'Published',
  draftLabel = 'Draft',
}: PublishStatusPillProps) {
  return (
    <span
      className={`rounded-full px-3 py-1 text-xs font-medium ${
        isPublished
          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
          : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'
      }`}
    >
      {isPublished ? publishedLabel : draftLabel}
    </span>
  );
}
