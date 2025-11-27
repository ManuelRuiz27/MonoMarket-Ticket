import { ButtonHTMLAttributes, forwardRef } from 'react';
import { clsx } from 'clsx';

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
    variant?: 'primary' | 'secondary' | 'danger' | 'ghost' | 'outline';
    size?: 'sm' | 'md' | 'lg';
    isLoading?: boolean;
    leftIcon?: React.ReactNode;
    rightIcon?: React.ReactNode;
    fullWidth?: boolean;
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
    (
        {
            variant = 'primary',
            size = 'md',
            isLoading = false,
            leftIcon,
            rightIcon,
            fullWidth = false,
            className,
            children,
            disabled,
            ...props
        },
        ref
    ) => {
        const baseStyles = 'inline-flex items-center justify-center font-medium transition-smooth focus-ring rounded-lg disabled:opacity-50 disabled:cursor-not-allowed';

        const variants = {
            primary: 'bg-primary-600 text-white hover:bg-primary-700 active:bg-primary-800',
            secondary: 'bg-gray-200 text-gray-900 hover:bg-gray-300 active:bg-gray-400',
            danger: 'bg-red-600 text-white hover:bg-red-700 active:bg-red-800',
            ghost: 'bg-transparent text-gray-700 hover:bg-gray-100 active:bg-gray-200',
            outline: 'bg-transparent border-2 border-gray-300 text-gray-700 hover:bg-gray-50 active:bg-gray-100',
        };

        const sizes = {
            sm: 'px-3 py-1.5 text-sm gap-1.5',
            md: 'px-4 py-2 text-base gap-2',
            lg: 'px-6 py-3 text-lg gap-2.5',
        };

        return (
            <button
                ref={ref}
                className={clsx(
                    baseStyles,
                    variants[variant],
                    sizes[size],
                    fullWidth && 'w-full',
                    className
                )}
                disabled={disabled || isLoading}
                {...props}
            >
                {isLoading ? (
                    <>
                        <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                            <circle
                                className="opacity-25"
                                cx="12"
                                cy="12"
                                r="10"
                                stroke="currentColor"
                                strokeWidth="4"
                            />
                            <path
                                className="opacity-75"
                                fill="currentColor"
                                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            />
                        </svg>
                        <span>Cargando...</span>
                    </>
                ) : (
                    <>
                        {leftIcon && <span className="inline-flex">{leftIcon}</span>}
                        {children}
                        {rightIcon && <span className="inline-flex">{rightIcon}</span>}
                    </>
                )}
            </button>
        );
    }
);

Button.displayName = 'Button';
