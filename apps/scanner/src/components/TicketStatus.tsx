import React from 'react';
import type { TicketVerificationResult } from '../services/api';

interface TicketStatusProps {
    ticket: TicketVerificationResult | null;
    onCheckIn?: () => void;
    checking?: boolean;
    className?: string;
}

const TicketStatus: React.FC<TicketStatusProps> = ({ ticket, onCheckIn, checking, className }) => {
    if (!ticket) return null;

    const status = ticket.ticket.status;
    const isValid = status === 'VALID';
    const isUsed = status === 'USED';
    const isCancelled = status === 'CANCELLED';
    const isExpired = status === 'EXPIRED';
    const isPending = status === 'RESERVED' || ticket.orderStatus === 'PENDING';
    const classes = ['ticket-status', isValid ? 'valid' : isUsed ? 'used' : 'invalid'];

    if (className) {
        classes.push(className);
    }

    const titleMap: Record<string, string> = {
        VALID: 'Boleto válido',
        USED: 'Marca como usado',
        CANCELLED: 'Boleto cancelado',
        EXPIRED: 'QR expirado',
        RESERVED: 'Reservado / Pago pendiente',
        UNPAID: 'Pago pendiente',
    };

    const title = titleMap[status] || 'Boleto';

    return (
        <div className={classes.join(' ')}>
            <div className="status-icon">
                {isValid ? '?' : '?'}
            </div>

            <div className="status-content">
                <h2 className="status-title">
                    {title}
                </h2>

                <div className="ticket-details">
                    <div className="detail-row">
                        <span className="label">Nombre:</span>
                        <span className="value">{ticket.buyer.name}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Evento:</span>
                        <span className="value">{ticket.event.title}</span>
                    </div>
                    <div className="detail-row">
                        <span className="label">Tipo:</span>
                        <span className="value">{ticket.ticket.template.name}</span>
                    </div>
                    {ticket.event.venue && (
                        <div className="detail-row">
                            <span className="label">Lugar:</span>
                            <span className="value">{ticket.event.venue}</span>
                        </div>
                    )}
                    {isUsed && ticket.ticket.usedAt && (
                        <div className="detail-row used-at">
                            <span className="label">Usado:</span>
                            <span className="value">{new Date(ticket.ticket.usedAt).toLocaleString()}</span>
                        </div>
                    )}
                    {isCancelled && (
                        <div className="detail-row error">
                            <span className="value">Este boleto fue cancelado</span>
                        </div>
                    )}
                    {isExpired && (
                        <div className="detail-row error">
                            <span className="value">El QR expiró, solicita reenvío</span>
                        </div>
                    )}
                    {isPending && (
                        <div className="detail-row error">
                            <span className="value">Pago pendiente o reserva vigente</span>
                        </div>
                    )}
                </div>

                {isValid && onCheckIn && (
                    <button
                        className="check-in-button"
                        onClick={onCheckIn}
                        disabled={checking}
                    >
                        {checking ? 'Registrando...' : 'Confirmar entrada'}
                    </button>
                )}
            </div>
        </div>
    );
};

export default TicketStatus;
