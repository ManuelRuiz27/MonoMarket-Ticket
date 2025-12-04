import { useLocation, useNavigate } from 'react-router-dom';

function useQuery() {
    const { search } = useLocation();
    return new URLSearchParams(search);
}

export function CheckoutSuccess() {
    const query = useQuery();
    const navigate = useNavigate();

    const orderId = query.get('orderId');
    const rawStatus = (query.get('status') || 'completed').toLowerCase();

    const isCompleted = rawStatus === 'completed' || rawStatus === 'approved';
    const isInReview = rawStatus === 'in_review' || rawStatus === 'pending' || rawStatus === 'in_process';
    const isFailed = rawStatus === 'failed' || rawStatus === 'rejected' || rawStatus === 'cancelled';

    let title = 'Compra completada';
    let message =
        'Tu pago fue aprobado. Recibirás tus boletos en minutos en el correo que registraste.';
    let iconBg = 'bg-green-100';
    let iconColor = 'text-green-600';

    if (isInReview) {
        title = 'Pago en revisión';
        message =
            'Estamos revisando tu pago. Te avisaremos por correo en cuanto se confirme. Esto puede tomar unos minutos.';
        iconBg = 'bg-yellow-100';
        iconColor = 'text-yellow-600';
    } else if (isFailed) {
        title = 'Pago no completado';
        message =
            'Tu pago no pudo completarse. Si ves un cargo en tu estado de cuenta, se revertirá automáticamente por Mercado Pago.';
        iconBg = 'bg-red-100';
        iconColor = 'text-red-600';
    }

    return (
        <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
            <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center">
                <div className={`w-20 h-20 ${iconBg} rounded-full flex items-center justify-center mx-auto mb-6`}>
                    <svg className={`w-10 h-10 ${iconColor}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        {isFailed ? (
                            <>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 6l12 12" />
                            </>
                        ) : isInReview ? (
                            <>
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 8v4l2 2m6-4a8 8 0 11-16 0 8 8 0 0116 0z"
                                />
                            </>
                        ) : (
                            <>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4" />
                                <path
                                    strokeLinecap="round"
                                    strokeLinejoin="round"
                                    strokeWidth={2}
                                    d="M12 22a10 10 0 100-20 10 10 0 000 20z"
                                />
                            </>
                        )}
                    </svg>
                </div>
                <h2 className="text-3xl font-bold text-gray-900 mb-4">{title}</h2>
                <p className="text-gray-600 mb-6">{message}</p>
                {orderId && (
                    <div className="bg-gray-50 rounded-xl p-6 text-left space-y-2 mb-8">
                        <p className="text-sm text-gray-500">Número de orden</p>
                        <p className="font-mono text-gray-900 text-lg break-all">{orderId}</p>
                        {isCompleted && (
                            <p className="text-xs text-gray-500 mt-2">
                                ¿No ves tus boletos? Revisa tu correo (y la carpeta de spam). Desde ese correo
                                podrás reenviar los tickets o contactar soporte.
                            </p>
                        )}
                        {isInReview && (
                            <p className="text-xs text-gray-500 mt-2">
                                Cuando el pago se confirme, te enviaremos automáticamente tus boletos al correo que
                                registraste.
                            </p>
                        )}
                        {isFailed && (
                            <p className="text-xs text-gray-500 mt-2">
                                Puedes intentar de nuevo desde la página del evento o usar otro método de pago.
                            </p>
                        )}
                    </div>
                )}
                <button
                    onClick={() => navigate('/')}
                    className="w-full bg-primary-600 text-white py-3 rounded-xl font-bold hover:bg-primary-700 transition-colors"
                >
                    Volver al inicio
                </button>
            </div>
        </div>
    );
}

