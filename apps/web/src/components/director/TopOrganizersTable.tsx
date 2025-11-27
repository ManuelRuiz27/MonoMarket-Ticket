interface TopOrganizersTableProps {
    organizers: {
        organizerId: string;
        businessName: string;
        totalRevenue: number;
        ticketsSold: number;
    }[];
}

export function TopOrganizersTable({ organizers }: TopOrganizersTableProps) {
    return (
        <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Top Organizadores</h3>
            </div>
            <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Organizador
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Boletos Vendidos
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                Ingresos Totales
                            </th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {organizers.length === 0 ? (
                            <tr>
                                <td colSpan={3} className="px-6 py-4 text-center text-sm text-gray-500">
                                    No hay datos disponibles
                                </td>
                            </tr>
                        ) : (
                            organizers.map((org, idx) => (
                                <tr key={org.organizerId} className="hover:bg-gray-50">
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="flex items-center">
                                            <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center">
                                                <span className="text-indigo-600 font-semibold text-sm">
                                                    #{idx + 1}
                                                </span>
                                            </div>
                                            <div className="ml-4">
                                                <div className="text-sm font-medium text-gray-900">
                                                    {org.businessName}
                                                </div>
                                                <div className="text-xs text-gray-500">
                                                    ID: {org.organizerId.slice(0, 8)}...
                                                </div>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-gray-900">
                                            {org.ticketsSold.toLocaleString('es-MX')}
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 whitespace-nowrap">
                                        <div className="text-sm font-semibold text-green-600">
                                            ${org.totalRevenue.toLocaleString('es-MX')} MXN
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
