import React from 'react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';

interface SalesChartProps {
    data: {
        name: string;
        sales: number;
    }[];
}

export const SalesChart: React.FC<SalesChartProps> = ({ data }) => {
    return (
        <div className="bg-white shadow rounded-lg p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">Ventas por Evento</h3>
            <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                    <BarChart
                        data={data}
                        margin={{
                            top: 5,
                            right: 30,
                            left: 20,
                            bottom: 5,
                        }}
                    >
                        <CartesianGrid strokeDasharray="3 3" vertical={false} />
                        <XAxis dataKey="name" />
                        <YAxis />
                        <Tooltip
                            formatter={(value: number) => [`$${value.toLocaleString()}`, 'Ventas']}
                        />
                        <Bar dataKey="sales" fill="#4F46E5" radius={[4, 4, 0, 0]} />
                    </BarChart>
                </ResponsiveContainer>
            </div>
        </div>
    );
};
