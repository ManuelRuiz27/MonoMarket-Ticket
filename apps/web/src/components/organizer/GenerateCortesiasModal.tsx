import { useState } from 'react';
import { Modal } from '../ui/Modal';
import { Button } from '../ui/Button';
import { apiClient } from '../../api/client';
import { useToast } from '../../hooks/useToast';

interface GenerateCortesiasModalProps {
    isOpen: boolean;
    onClose: () => void;
    eventId: string;
    eventTitle: string;
    onSuccess: () => void;
}

export function GenerateCortesiasModal({ isOpen, onClose, eventId, eventTitle, onSuccess }: GenerateCortesiasModalProps) {
    const toast = useToast();
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');
    const [form, setForm] = useState({
        quantity: 1,
        buyerName: '',
        buyerEmail: '',
        buyerPhone: '',
    });

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError('');

        try {
            await apiClient.generateCortesias(eventId, form);
            toast.success(`✅ ${form.quantity} cortesía(s) generada(s) correctamente`);
            onSuccess();
            onClose();
            setForm({ quantity: 1, buyerName: '', buyerEmail: '', buyerPhone: '' });
        } catch (err: any) {
            const errorMsg = err.message || 'Error al generar cortesías';
            setError(errorMsg);
            toast.error(errorMsg);
        } finally {
            setLoading(false);
        }
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            title={`Generar Cortesías - ${eventTitle}`}
            actions={
                <>
                    <Button
                        type="button"
                        variant="ghost"
                        onClick={onClose}
                    >
                        Cancelar
                    </Button>
                    <Button
                        type="submit"
                        form="cortesias-form"
                        isLoading={loading}
                        variant="primary"
                    >
                        Generar
                    </Button>
                </>
            }
        >
            <form id="cortesias-form" onSubmit={handleSubmit} className="space-y-4">
                {error && (
                    <div className="bg-red-50 text-red-700 p-3 rounded-lg text-sm">
                        {error}
                    </div>
                )}

                <div>
                    <label className="block text-sm font-medium text-gray-700">Cantidad</label>
                    <input
                        type="number"
                        min="1"
                        max="100"
                        required
                        value={form.quantity}
                        onChange={(e) => setForm({ ...form, quantity: parseInt(e.target.value) })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Nombre del Beneficiario</label>
                    <input
                        type="text"
                        required
                        value={form.buyerName}
                        onChange={(e) => setForm({ ...form, buyerName: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
                        placeholder="Ej. Juan Pérez"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <input
                        type="email"
                        required
                        value={form.buyerEmail}
                        onChange={(e) => setForm({ ...form, buyerEmail: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
                        placeholder="juan@ejemplo.com"
                    />
                </div>

                <div>
                    <label className="block text-sm font-medium text-gray-700">Teléfono (Opcional)</label>
                    <input
                        type="tel"
                        value={form.buyerPhone}
                        onChange={(e) => setForm({ ...form, buyerPhone: e.target.value })}
                        className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-primary-500 focus:ring-primary-500 sm:text-sm border px-3 py-2"
                    />
                </div>
            </form>
        </Modal>
    );
}
