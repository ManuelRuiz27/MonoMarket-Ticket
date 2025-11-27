import { ReactNode } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Button } from '../ui/Button';

interface DashboardLayoutProps {
    children: ReactNode;
    type: 'organizer' | 'director';
    user?: {
        email?: string;
        name?: string;
    };
}

export function DashboardLayout({ children, type, user }: DashboardLayoutProps) {
    const navigate = useNavigate();
    const location = useLocation();

    const navigation = {
        organizer: [
            { name: 'Dashboard', href: '/organizer/dashboard', icon: '📊' },
            { name: 'Eventos', href: '/organizer/events', icon: '🎫' },
            { name: 'Plantillas', href: '/organizer/templates', icon: '🎨' },
        ],
        director: [
            { name: 'Dashboard', href: '/director/dashboard', icon: '📊' },
            { name: 'Organizadores', href: '/director/organizers', icon: '👥' },
            { name: 'Órdenes', href: '/director/orders', icon: '📦' },
            { name: 'Fee Plans', href: '/director/fee-plans', icon: '💰' },
        ],
    };

    const brandColors = {
        organizer: {
            gradient: 'from-indigo-600 to-purple-600',
            text: 'text-indigo-600',
            bg: 'bg-indigo-50',
        },
        director: {
            gradient: 'from-purple-600 to-blue-600',
            text: 'text-purple-600',
            bg: 'bg-purple-50',
        },
    };

    const isActive = (path: string) => location.pathname === path;

    const handleLogout = () => {
        localStorage.removeItem('authToken');
        localStorage.removeItem('authUser');
        navigate(`/${type}/login`);
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Header */}
            <header className={`bg-gradient-to-r ${brandColors[type].gradient} text-white shadow-lg`}>
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <div className="flex items-center space-x-4">
                            <h1 className="text-2xl font-bold">MonoMarket</h1>
                            <span className="px-3 py-1 bg-white/20 rounded-full text-sm font-medium capitalize">
                                {type}
                            </span>
                        </div>
                        <div className="flex items-center space-x-4">
                            {user?.email && (
                                <div className="text-sm opacity-90 mobile-hide">
                                    {user.email}
                                </div>
                            )}
                            <Button variant="ghost" size="sm" onClick={handleLogout} className="text-white hover:bg-white/10">
                                Cerrar Sesión
                            </Button>
                        </div>
                    </div>
                </div>
            </header>

            {/* Navigation */}
            <nav className="bg-white border-b border-gray-200 mobile-hide">
                <div className="container mx-auto px-4">
                    <div className="flex space-x-1">
                        {navigation[type].map((item) => (
                            <button
                                key={item.href}
                                onClick={() => navigate(item.href)}
                                className={`px-4 py-3 text-sm font-medium transition-smooth border-b-2 ${isActive(item.href)
                                        ? `border-${type === 'organizer' ? 'indigo' : 'purple'}-600 ${brandColors[type].text}`
                                        : 'border-transparent text-gray-600 hover:text-gray-900 hover:border-gray-300'
                                    }`}
                            >
                                <span className="mr-2">{item.icon}</span>
                                {item.name}
                            </button>
                        ))}
                    </div>
                </div>
            </nav>

            {/* Mobile Bottom Navigation */}
            <nav className="mobile-only fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 px-4 py-2 z-50">
                <div className="flex justify-around">
                    {navigation[type].map((item) => (
                        <button
                            key={item.href}
                            onClick={() => navigate(item.href)}
                            className={`flex flex-col items-center px-3 py-2 text-xs font-medium transition-smooth ${isActive(item.href)
                                    ? brandColors[type].text
                                    : 'text-gray-600'
                                }`}
                        >
                            <span className="text-lg mb-1">{item.icon}</span>
                            {item.name}
                        </button>
                    ))}
                </div>
            </nav>

            {/* Main Content */}
            <main className="container mx-auto px-4 py-6 pb-20 md:pb-6">
                <div className="animate-fade-in">
                    {children}
                </div>
            </main>
        </div>
    );
}
