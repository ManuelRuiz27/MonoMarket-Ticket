import { HTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
    variant?: 'default' | 'bordered' | 'elevated';
    padding?: 'none' | 'sm' | 'md' | 'lg';
    hover?: boolean;
}

export const Card = forwardRef<HTMLDivElement, CardProps>(
    ({ variant = 'default', padding = 'md', hover = false, className, children, ...props }, ref) => {
        const baseStyles = 'bg-white rounded-lg transition-smooth';

        const variants = {
            default: 'shadow-sm',
            bordered: 'border border-gray-200',
            elevated: 'shadow-md hover:shadow-lg',
        };

        const paddings = {
            none: '',
            sm: 'p-4',
            md: 'p-6',
            lg: 'p-8',
        };

        return (
            <div
                ref={ref}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    paddings[padding],
                    hover && 'hover:shadow-md cursor-pointer',
                    className
                )}
                {...props}
            >
                {children}
            </div>
        );
    }
);

Card.displayName = 'Card';
