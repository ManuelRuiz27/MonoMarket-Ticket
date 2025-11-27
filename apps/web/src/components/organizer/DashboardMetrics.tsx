import React from 'react';

interface DashboardMetricsProps {
    stats: {
        totalEvents: number;
        activeEvents: number;
        totalOrders: number;
        totalRevenue: number;
    };
    cortesias: {
        used: number;
        totalAllowed: number;
        remaining: number;
    };
}

export const DashboardMetrics: React.FC<DashboardMetricsProps> = ({ stats, cortesias }) => {
    return (
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {/* Revenue Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Ingresos Totales</dt>
                                <dd>
                                    <div className="text-lg font-medium text-gray-900">
                                        ${stats.totalRevenue.toLocaleString('es-MX', { minimumFractionDigits: 2 })}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Tickets Sold Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Boletos Vendidos</dt>
                                <dd>
                                    <div className="text-lg font-medium text-gray-900">
                                        {stats.totalOrders}
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Active Events Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Eventos Activos</dt>
                                <dd>
                                    <div className="text-lg font-medium text-gray-900">
                                        {stats.activeEvents} <span className="text-gray-400 text-sm">/ {stats.totalEvents}</span>
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>

            {/* Cortesías Card */}
            <div className="bg-white overflow-hidden shadow rounded-lg">
                <div className="p-5">
                    <div className="flex items-center">
                        <div className="flex-shrink-0">
                            <svg className="h-6 w-6 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                            </svg>
                        </div>
                        <div className="ml-5 w-0 flex-1">
                            <dl>
                                <dt className="text-sm font-medium text-gray-500 truncate">Cortesías Usadas</dt>
                                <dd>
                                    <div className="text-lg font-medium text-gray-900">
                                        {cortesias.used} <span className="text-gray-400 text-sm">/ {cortesias.totalAllowed}</span>
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
