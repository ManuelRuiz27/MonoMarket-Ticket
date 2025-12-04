import React, { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import QRScanner from '../components/QRScanner';
import TicketStatus from '../components/TicketStatus';
import AttendanceStats from '../components/AttendanceStats';
import apiService, { type TicketVerificationResult, type AttendanceStats as AttendanceStatsType } from '../services/api';

interface ScanHistoryEntry {
    id: string;
    status: string;
    timestamp: string;
    note?: string;
}

const HISTORY_LIMIT = 10;

const Scanner: React.FC = () => {
    const { eventId } = useParams<{ eventId: string }>();
    const navigate = useNavigate();

    const [currentTicket, setCurrentTicket] = useState<TicketVerificationResult | null>(null);
    const [attendance, setAttendance] = useState<AttendanceStatsType | null>(null);
    const [checking, setChecking] = useState(false);
    const [lastScanTime, setLastScanTime] = useState(0);
    const [statusMessage, setStatusMessage] = useState('');
    const [scannerPaused, setScannerPaused] = useState(false);
    const [overlayActive, setOverlayActive] = useState(false);
    const [usedAlert, setUsedAlert] = useState(false);
    const [scanHistory, setScanHistory] = useState<ScanHistoryEntry[]>([]);
    const overlayTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

    useEffect(() => {
        if (eventId) {
            loadAttendance();
        }
        return () => {
            if (overlayTimeoutRef.current) {
                clearTimeout(overlayTimeoutRef.current);
            }
        };
    }, [eventId]);

    const loadAttendance = async () => {
        if (!eventId) return;
        try {
            const stats = await apiService.getEventAttendance(eventId);
            setAttendance(stats);
        } catch (err: any) {
            setStatusMessage(err.response?.data?.message || 'No se pudo cargar la asistencia');
        }
    };

    const scheduleOverlayReset = useCallback(() => {
        if (overlayTimeoutRef.current) {
            clearTimeout(overlayTimeoutRef.current);
        }
        overlayTimeoutRef.current = setTimeout(() => {
            setOverlayActive(false);
            setScannerPaused(false);
        }, 2000);
    }, []);

    const pushHistory = useCallback((entry: ScanHistoryEntry) => {
        setScanHistory((prev) => [entry, ...prev].slice(0, HISTORY_LIMIT));
    }, []);

    const extractToken = (value: string): string | null => {
        if (!value) return null;
        if (value.includes('/tickets/verify/')) {
            const segment = value.split('/tickets/verify/').pop();
            return segment && segment.length > 0 ? segment : null;
        }
        try {
            const parsed = new URL(value);
            const last = parsed.pathname.split('/').filter(Boolean).pop();
            return last || null;
        } catch {
            return value;
        }
    };

    const handleScan = useCallback(async (rawValue: string) => {
        const now = Date.now();
        if (scannerPaused || now - lastScanTime < 2000) {
            return;
        }
        setLastScanTime(now);
        setScannerPaused(true);

        const token = extractToken(rawValue);
        if (!token) {
            setStatusMessage('QR no reconocido');
            setScannerPaused(false);
            pushHistory({ id: rawValue, status: 'ERROR', timestamp: new Date().toISOString(), note: 'Formato inválido' });
            return;
        }

        try {
            setStatusMessage('Validando...');
            const ticket = await apiService.validateTicket(token);
            setCurrentTicket(ticket);
            setStatusMessage('');
            pushHistory({ id: ticket.ticket.qrCode, status: ticket.ticket.status, timestamp: new Date().toISOString() });

            const alreadyUsed = ticket.ticket.status === 'USED';
            setUsedAlert(alreadyUsed);
            if (alreadyUsed && typeof navigator !== 'undefined' && 'vibrate' in navigator && typeof navigator.vibrate === 'function') {
                navigator.vibrate([120, 60, 120]);
            }

            setOverlayActive(true);
            scheduleOverlayReset();
        } catch (err: any) {
            const message = err.response?.data?.message || 'Ticket no encontrado';
            setStatusMessage(message);
            setCurrentTicket(null);
            setUsedAlert(false);
            setOverlayActive(false);
            setScannerPaused(false);
            pushHistory({ id: token, status: 'ERROR', timestamp: new Date().toISOString(), note: message });
            setTimeout(() => setStatusMessage(''), 3000);
        }
    }, [lastScanTime, scannerPaused, scheduleOverlayReset, pushHistory]);

    const handleCheckIn = async () => {
        if (!currentTicket) return;

        setChecking(true);
        try {
            const result = await apiService.checkInTicket(currentTicket.ticket.qrCode);
            setCurrentTicket({
                ...currentTicket,
                ticket: {
                    ...currentTicket.ticket,
                    status: 'USED',
                    usedAt: result.ticket.usedAt,
                },
            });

            if (attendance && result.event && eventId) {
                setAttendance({
                    ...attendance,
                    attendanceCount: result.event.attendanceCount,
                    percentageAttended: (result.event.attendanceCount / attendance.totalTickets) * 100,
                });
            }

            setStatusMessage('? Check-in exitoso');
            setUsedAlert(false);
            setTimeout(() => {
                setCurrentTicket(null);
                setStatusMessage('');
            }, 2000);
        } catch (err: any) {
            setStatusMessage(err.response?.data?.message || 'Error al registrar entrada');
            setTimeout(() => setStatusMessage(''), 3000);
        } finally {
            setChecking(false);
        }
    };

    const handleGoBack = () => {
        navigate('/events');
    };

    return (
        <div className={`scanner-page ${overlayActive ? 'overlay-active' : ''}`}>
            <div className="scanner-header">
                <button onClick={handleGoBack} className="back-button">
                    ? Eventos
                </button>
                <h1>{attendance?.eventTitle || 'Scanner'}</h1>
            </div>

            <AttendanceStats stats={attendance} />

            <div className="scanner-section">
                <QRScanner onScan={handleScan} disabled={checking || scannerPaused} />

                {statusMessage && (
                    <div className="status-message info">
                        {statusMessage}
                    </div>
                )}

                {!overlayActive && (
                    <TicketStatus
                        ticket={currentTicket}
                        onCheckIn={handleCheckIn}
                        checking={checking}
                        className={usedAlert ? 'used-alert' : ''}
                    />
                )}
            </div>

            {overlayActive && currentTicket && (
                <div className={`checkin-overlay ${usedAlert ? 'warning' : ''}`}>
                    <div className="overlay-spotlight"></div>
                    <div className="overlay-panel">
                        <TicketStatus
                            ticket={currentTicket}
                            onCheckIn={handleCheckIn}
                            checking={checking}
                            className={usedAlert ? 'used-alert' : ''}
                        />
                    </div>
                </div>
            )}

            <div className="history-panel">
                <h3>Historial reciente</h3>
                {scanHistory.length === 0 ? (
                    <p className="history-empty">Sin escaneos aún</p>
                ) : (
                    <ul>
                        {scanHistory.map((entry) => (
                            <li key={`${entry.id}-${entry.timestamp}`}>
                                <span className={`status-tag status-${entry.status.toLowerCase()}`}>{entry.status}</span>
                                <span className="history-ticket">{entry.id}</span>
                                <span className="history-time">{new Date(entry.timestamp).toLocaleTimeString()}</span>
                                {entry.note && <span className="history-note">{entry.note}</span>}
                            </li>
                        ))}
                    </ul>
                )}
            </div>
        </div>
    );
};

export default Scanner;
