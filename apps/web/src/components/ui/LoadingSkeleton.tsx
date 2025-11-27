import { HTMLAttributes } from 'react';
import { clsx } from 'clsx';

interface LoadingSkeletonProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'text' | 'circular' | 'rectangular';
    width?: string | number;
    height?: string | number;
    count?: number;
}

export function LoadingSkeleton({
    variant = 'rectangular',
    width,
    height,
    count = 1,
    className,
    ...props
}: LoadingSkeletonProps) {
    const baseStyles = 'animate-pulse bg-gray-200';

    const variants = {
        text: 'rounded h-4',
        circular: 'rounded-full',
        rectangular: 'rounded-lg',
    };

    const skeleton = (
        <div
            className={clsx(baseStyles, variants[variant], className)}
            style={{ width, height }}
            {...props}
        />
    );

    if (count === 1) return skeleton;

    return (
        <div className="space-y-3">
            {Array.from({ length: count }).map((_, i) => (
                <div key={i}>{skeleton}</div>
            ))}
        </div>
    );
}
