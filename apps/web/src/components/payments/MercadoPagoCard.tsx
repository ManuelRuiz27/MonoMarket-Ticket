import { useEffect, useId, useMemo, useRef, useState } from 'react';
import { apiClient, CheckoutOrderSummary, PaymentResponse } from '../../api/client';
import { CardPaymentBrickController, getMercadoPagoInstance } from '../../lib/mercadoPago';

type UserData = {
    email: string;
    firstName?: string;
    lastName?: string;
    phone?: string;
    identificationType?: string;
    identificationNumber?: string;
};

type PaymentStatus = 'idle' | 'loading' | 'ready' | 'processing' | 'success' | 'error';

type Props = {
    orderId: string;
    user: UserData;
    onPaymentSuccess?: (payment: PaymentResponse) => void;
    onPaymentError?: (message: string) => void;
};

export function MercadoPagoCard({ orderId, user, onPaymentSuccess, onPaymentError }: Props) {
    const reactId = useId();
    const containerId = useMemo(() => `mp-card-${reactId.replace(/[:]/g, '')}`, [reactId]);
    const [status, setStatus] = useState<PaymentStatus>('idle');
    const [error, setError] = useState<string | null>(null);
    const [orderSummary, setOrderSummary] = useState<CheckoutOrderSummary | null>(null);
    const [paymentResult, setPaymentResult] = useState<PaymentResponse | null>(null);
    const controllerRef = useRef<CardPaymentBrickController | null>(null);
    const userRef = useRef(user);

    useEffect(() => {
        userRef.current = user;
    }, [user]);

    useEffect(() => {
        let active = true;
        setStatus('loading');
        setError(null);
        setPaymentResult(null);
        setOrderSummary(null);

        (async () => {
            try {
                const summary = await apiClient.getCheckoutOrder(orderId);
                if (!active) {
                    return;
                }
                setOrderSummary(summary);
            } catch (err: any) {
                if (!active) {
                    return;
                }
                const message = err?.message || 'No pudimos obtener el total de tu orden. Intenta nuevamente.';
                setError(message);
                setStatus('error');
                onPaymentError?.(message);
            }
        })();

        return () => {
            active = false;
        };
    }, [orderId, onPaymentError]);

    useEffect(() => {
        if (!orderSummary) {
            return undefined;
        }

        let cancelled = false;

        const renderBrick = async () => {
            setStatus('loading');
            setError(null);

            try {
                const mp = await getMercadoPagoInstance();
                const bricks = mp.bricks();

                if (controllerRef.current) {
                    controllerRef.current.destroy();
                    controllerRef.current = null;
                }

                const controller = await bricks.create('cardPayment', containerId, {
                    initialization: {
                        amount: Number(orderSummary.total),
                    },
                    callbacks: {
                        onReady: () => {
                            if (!cancelled) {
                                setStatus('ready');
                            }
                        },
                        onError: (brickError: any) => {
                            if (cancelled) {
                                return;
                            }
                            const message = brickError?.message || 'No pudimos mostrar el formulario de pago.';
                            setError(message);
                            setStatus('error');
                            onPaymentError?.(message);
                        },
                        onSubmit: async ({ formData }) => {
                            setStatus('processing');
                            setError(null);

                            try {
                                const result = await apiClient.createMercadoPagoPayment({
                                    orderId,
                                    token: formData.token,
                                    issuerId: formData.issuer_id,
                                    paymentMethodId: formData.payment_method_id,
                                    installments: formData.installments,
                                    payer: {
                                        email: userRef.current.email,
                                        firstName: userRef.current.firstName,
                                        lastName: userRef.current.lastName,
                                        phone: userRef.current.phone,
                                        identificationType: userRef.current.identificationType,
                                        identificationNumber: userRef.current.identificationNumber,
                                    },
                                });

                                if (cancelled) {
                                    return result;
                                }

                                setPaymentResult(result);
                                setStatus('success');
                                onPaymentSuccess?.(result);
                                return result;
                            } catch (submitError: any) {
                                if (cancelled) {
                                    return;
                                }
                                const message = submitError?.message || 'No pudimos procesar el pago. Intenta nuevamente.';
                                setError(message);
                                setStatus('error');
                                onPaymentError?.(message);
                                throw submitError;
                            }
                        },
                    },
                });

                if (cancelled) {
                    controller.destroy();
                    return;
                }

                controllerRef.current = controller;
            } catch (sdkError: any) {
                if (cancelled) {
                    return;
                }
                const message = sdkError?.message || 'No pudimos inicializar Mercado Pago.';
                setError(message);
                setStatus('error');
                onPaymentError?.(message);
            }
        };

        renderBrick();

        return () => {
            cancelled = true;
            if (controllerRef.current) {
                controllerRef.current.destroy();
                controllerRef.current = null;
            }
        };
    }, [containerId, onPaymentError, onPaymentSuccess, orderId, orderSummary]);

    const formattedTotal = useMemo(() => {
        if (!orderSummary) {
            return null;
        }
        try {
            return new Intl.NumberFormat('es-MX', {
                style: 'currency',
                currency: orderSummary.currency || 'MXN',
            }).format(orderSummary.total);
        } catch {
            return `${orderSummary.total} ${orderSummary.currency}`;
        }
    }, [orderSummary]);

    return (
        <div className="space-y-4">
            <div className="rounded-lg border border-gray-200 bg-white p-4 shadow-sm">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm text-gray-500">Orden</p>
                        <p className="font-semibold text-gray-900">{orderId}</p>
                    </div>
                    <div className="text-right">
                        <p className="text-sm text-gray-500">Total a pagar</p>
                        <p className="text-xl font-bold text-gray-900">
                            {formattedTotal ?? 'Cargando...'}
                        </p>
                    </div>
                </div>
                {orderSummary?.buyer?.email && (
                    <p className="mt-2 text-sm text-gray-500">
                        Pagando como <span className="font-medium text-gray-900">{orderSummary.buyer.email}</span>
                    </p>
                )}
            </div>

            {error && (
                <div className="rounded-md border border-red-200 bg-red-50 p-4 text-sm text-red-700">
                    {error}
                </div>
            )}

            {status === 'processing' && (
                <div className="rounded-md border border-blue-200 bg-blue-50 p-3 text-sm text-blue-700">
                    Procesando pago...
                </div>
            )}

            {status === 'success' && paymentResult && (
                <div className="rounded-md border border-green-200 bg-green-50 p-3 text-sm text-green-800">
                    Pago registrado. ID: <span className="font-semibold">{paymentResult.providerPaymentId}</span>
                </div>
            )}

            <div
                id={containerId}
                className={status === 'ready' || status === 'processing' || status === 'success' ? 'block' : 'opacity-50'}
            />
        </div>
    );
}
