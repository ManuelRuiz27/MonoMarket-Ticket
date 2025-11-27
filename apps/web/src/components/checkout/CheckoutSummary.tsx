import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface CheckoutSummaryProps {
    event: any;
    tickets: any[];
}

const CheckoutSummary: React.FC<CheckoutSummaryProps> = ({ event, tickets }) => {
    // Calculate totals
    const subtotal = tickets.reduce((acc, ticket) => acc + (ticket.price * ticket.quantity), 0);
    const serviceFee = subtotal * 0.10; // 10% service fee example
    const total = subtotal + serviceFee;

    return (
        <div className="bg-white shadow overflow-hidden sm:rounded-lg">
            <div className="px-4 py-5 sm:px-6">
                <h3 className="text-lg leading-6 font-medium text-gray-900">Resumen de Orden</h3>
            </div>
            <div className="border-t border-gray-200 px-4 py-5 sm:p-0">
                <dl className="sm:divide-y sm:divide-gray-200">
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Evento</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{event.title}</dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Fecha</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">
                            {format(event.date, 'PPP p', { locale: es })}
                        </dd>
                    </div>
                    <div className="py-4 sm:py-5 sm:grid sm:grid-cols-3 sm:gap-4 sm:px-6">
                        <dt className="text-sm font-medium text-gray-500">Lugar</dt>
                        <dd className="mt-1 text-sm text-gray-900 sm:mt-0 sm:col-span-2">{event.venue}</dd>
                    </div>

                    {/* Tickets List */}
                    <div className="py-4 sm:py-5 sm:px-6">
                        <h4 className="text-sm font-medium text-gray-900 mb-4">Boletos Seleccionados</h4>
                        {tickets.length === 0 ? (
                            <p className="text-sm text-gray-500 italic">No has seleccionado boletos.</p>
                        ) : (
                            <ul className="divide-y divide-gray-200">
                                {tickets.map((ticket, idx) => (
                                    <li key={idx} className="py-2 flex justify-between">
                                        <span className="text-sm text-gray-600">
                                            {ticket.quantity}x {ticket.name}
                                        </span>
                                        <span className="text-sm font-medium text-gray-900">
                                            ${(ticket.price * ticket.quantity).toFixed(2)}
                                        </span>
                                    </li>
                                ))}
                            </ul>
                        )}
                    </div>

                    {/* Totals */}
                    <div className="py-4 sm:py-5 sm:px-6 bg-gray-50">
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Subtotal</span>
                            <span className="font-medium text-gray-900">${subtotal.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-sm mb-2">
                            <span className="text-gray-600">Cargo por servicio</span>
                            <span className="font-medium text-gray-900">${serviceFee.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between text-base font-bold pt-2 border-t border-gray-200 mt-2">
                            <span className="text-gray-900">Total</span>
                            <span className="text-indigo-600">${total.toFixed(2)}</span>
                        </div>
                    </div>
                </dl>
            </div>
        </div>
    );
};

export default CheckoutSummary;
