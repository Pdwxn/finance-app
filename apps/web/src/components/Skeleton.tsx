interface SkeletonProps {
  className?: string;
  count?: number;
}

export function Skeleton({ className = 'h-5 w-full', count = 1 }: SkeletonProps) {
  return (
    <>
      {Array.from({ length: count }).map((_, i) => (
        <div
          key={i}
          className={`rounded-xl animate-shimmer ${className}`}
        />
      ))}
    </>
  );
}
