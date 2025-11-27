import toast, { Toaster as HotToaster } from 'react-hot-toast';

export { HotToaster as Toaster };

export const useToast = () => {
    return {
        success: (message: string) => {
            toast.success(message, {
                duration: 4000,
                position: 'top-right',
                style: {
                    background: '#10b981',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                },
            });
        },
        error: (message: string) => {
            toast.error(message, {
                duration: 5000,
                position: 'top-right',
                style: {
                    background: '#ef4444',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                },
            });
        },
        info: (message: string) => {
            toast(message, {
                duration: 4000,
                position: 'top-right',
                icon: 'ℹ️',
                style: {
                    background: '#3b82f6',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                },
            });
        },
        warning: (message: string) => {
            toast(message, {
                duration: 4000,
                position: 'top-right',
                icon: '⚠️',
                style: {
                    background: '#f59e0b',
                    color: '#fff',
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                },
            });
        },
        loading: (message: string) => {
            return toast.loading(message, {
                position: 'top-right',
                style: {
                    background: '#fff',
                    color: '#374151',
                    borderRadius: '0.5rem',
                    padding: '12px 16px',
                },
            });
        },
        dismiss: (toastId?: string) => {
            toast.dismiss(toastId);
        },
    };
};
