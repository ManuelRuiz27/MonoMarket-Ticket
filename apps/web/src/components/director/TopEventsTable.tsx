interface TopEventsTableProps {
    events: {
        eventId: string;
        title: string;
        organizerId: string | null;
        organizerName: string | null;
        totalRevenue: number;
        ticketsSold: number;
    }[];
}

export function TopEventsTable({ events }: TopEventsTableProps) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Eventos</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Evento
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Organizador
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Boletos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ingresos
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {events.length === 0 ? (
                            <tr>
                                <td colSpan={4} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No hay datos disponibles
                                </td>
                            </tr>
                        ) : (
                            events.map((event) => (
                                <tr key={event.eventId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="text-sm font-medium text-gray-900">
                                            {event.title}
                                        </div>
                                        <div className="text-xs text-gray-500">
                                            ID: {event.eventId.slice(0, 8)}...
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm text-gray-900">
                                            {event.organizerName || 'N/A'}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {event.ticketsSold.toLocaleString('es-MX')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-green-600">
                                            ${event.totalRevenue.toLocaleString('es-MX')}
                                        </div>
                                    </td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}
