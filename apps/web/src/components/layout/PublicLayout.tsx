import { ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';
import { Button } from '../ui/Button';

interface PublicLayoutProps {
    children: ReactNode;
}

export function PublicLayout({ children }: PublicLayoutProps) {
    const navigate = useNavigate();

    return (
        <div className="min-h-screen bg-gray-50">
            {/* Navbar */}
            <nav className="bg-white shadow-sm sticky top-0 z-40">
                <div className="container mx-auto px-4 py-4">
                    <div className="flex items-center justify-between">
                        <button
                            onClick={() => navigate('/')}
                            className="text-2xl font-bold text-primary-600 hover:text-primary-700 transition-smooth"
                        >
                            MonoMarket
                        </button>
                        <div className="flex items-center space-x-3">
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/organizer/login')}
                            >
                                Organizador
                            </Button>
                            <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => navigate('/director/login')}
                            >
                                Director
                            </Button>
                        </div>
                    </div>
                </div>
            </nav>

            {/* Main Content */}
            <main className="animate-fade-in">
                {children}
            </main>

            {/* Footer */}
            <footer className="bg-white border-t border-gray-200 mt-16">
                <div className="container mx-auto px-4 py-8">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div>
                            <h3 className="text-lg font-bold text-primary-600 mb-4">MonoMarket</h3>
                            <p className="text-sm text-gray-600">
                                La plataforma de venta de boletos más confiable de México.
                            </p>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-4">Enlaces</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="/" className="hover:text-primary-600 transition-smooth">Eventos</a></li>
                                <li><a href="/organizer/login" className="hover:text-primary-600 transition-smooth">Para Organizadores</a></li>
                            </ul>
                        </div>
                        <div>
                            <h4 className="font-medium text-gray-900 mb-4">Soporte</h4>
                            <ul className="space-y-2 text-sm text-gray-600">
                                <li><a href="#" className="hover:text-primary-600 transition-smooth">Ayuda</a></li>
                                <li><a href="#" className="hover:text-primary-600 transition-smooth">Contacto</a></li>
                            </ul>
                        </div>
                    </div>
                    <div className="mt-8 pt-8 border-t border-gray-200 text-center text-sm text-gray-500">
                        © {new Date().getFullYear()} MonoMarket. Todos los derechos reservados.
                    </div>
                </div>
            </footer>
        </div>
    );
}
