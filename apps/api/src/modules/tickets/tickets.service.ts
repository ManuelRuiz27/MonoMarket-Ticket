import { BadRequestException, ForbiddenException, Injectable, NotFoundException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { PdfGeneratorService } from './pdf-generator.service';
import { Readable } from 'stream';
import { ActiveStaffSession } from '../staff/staff.types';
import { createHash } from 'crypto';

type TicketStatusResponse =
    | 'VALID'
    | 'USED'
    | 'CANCELLED'
    | 'UNPAID'
    | 'EXPIRED'
    | 'RESERVED';

@Injectable()
export class TicketsService {
    constructor(
        private readonly prisma: PrismaService,
        private readonly pdfGenerator: PdfGeneratorService,
    ) { }

    async generateTicketPdf(ticketId: string): Promise<{ stream: Readable; filename: string }> {
        const pdfBuffer = await this.pdfGenerator.generateTicketPdf(ticketId);
        const stream = new Readable();
        stream.push(pdfBuffer);
        stream.push(null);

        return {
            stream,
            filename: `ticket-${ticketId}.pdf`,
        };
    }

    async verifyTicketToken(token: string, session: ActiveStaffSession) {
        const payload = this.pdfGenerator.verifyTicketQR(token);
        const ticket = await this.prisma.ticket.findUnique({
            where: { id: payload.ticketId },
            include: {
                template: {
                    select: { name: true },
                },
                order: {
                    include: {
                        event: true,
                        buyer: {
                            select: {
                                name: true,
                                email: true,
                            },
                        },
                    },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        if (ticket.order.eventId !== session.eventId) {
            throw new ForbiddenException('Ticket does not belong to this event');
        }

        const hashed = this.hashToken(token);
        if (ticket.qrJwtHash && ticket.qrJwtHash !== hashed) {
            throw new BadRequestException('QR token does not match current ticket');
        }

        if (!ticket.qrJwtHash) {
            await this.prisma.ticket.update({
                where: { id: ticket.id },
                data: { qrJwtHash: hashed },
            });
        }

        const status = this.computeTicketStatus(ticket, payload.exp);

        return {
            ticket: {
                id: ticket.id,
                qrCode: ticket.qrCode,
                status,
                usedAt: ticket.usedAt,
                template: ticket.template,
            },
            buyer: ticket.order.buyer,
            event: {
                id: ticket.order.event.id,
                title: ticket.order.event.title,
                startDate: ticket.order.event.startDate,
                venue: ticket.order.event.venue,
            },
            orderStatus: ticket.order.status,
            reservedUntil: ticket.order.reservedUntil,
        };
    }

    async checkInTicket(qrCode: string, session: ActiveStaffSession) {
        const ticket = await this.prisma.ticket.findUnique({
            where: { qrCode },
            include: {
                order: {
                    include: {
                        event: true,
                        buyer: {
                            select: { name: true, email: true },
                        },
                    },
                },
                template: {
                    select: { name: true },
                },
            },
        });

        if (!ticket) {
            throw new NotFoundException('Ticket not found');
        }

        if (ticket.order.eventId !== session.eventId) {
            throw new ForbiddenException('Ticket does not belong to this event');
        }

        if (ticket.status === 'USED') {
            throw new BadRequestException(`Ticket already used at ${ticket.usedAt?.toISOString()}`);
        }

        if (ticket.status === 'CANCELLED') {
            throw new BadRequestException('Ticket has been cancelled');
        }

        if (ticket.order.status !== 'PAID') {
            throw new BadRequestException('Order is not paid');
        }

        const [updatedTicket, updatedEvent] = await this.prisma.$transaction([
            this.prisma.ticket.update({
                where: { id: ticket.id },
                data: {
                    status: 'USED',
                    usedAt: new Date(),
                },
                include: {
                    order: {
                        include: {
                            event: {
                                select: {
                                    id: true,
                                    title: true,
                                    attendanceCount: true,
                                },
                            },
                            buyer: {
                                select: {
                                    name: true,
                                    email: true,
                                },
                            },
                        },
                    },
                    template: {
                        select: { name: true },
                    },
                },
            }),
            this.prisma.event.update({
                where: { id: ticket.order.eventId },
                data: {
                    attendanceCount: { increment: 1 },
                },
            }),
        ]);

        return {
            success: true,
            ticket: {
                id: updatedTicket.id,
                qrCode: updatedTicket.qrCode,
                status: updatedTicket.status,
                usedAt: updatedTicket.usedAt,
                buyer: updatedTicket.order.buyer,
                template: updatedTicket.template,
            },
            event: {
                id: updatedEvent.id,
                attendanceCount: updatedEvent.attendanceCount,
                title: updatedTicket.order.event.title,
            },
        };
    }

    async getEventAttendance(eventId: string, session: ActiveStaffSession) {
        if (session.eventId !== eventId) {
            throw new ForbiddenException('Access denied for this event');
        }

        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            select: {
                id: true,
                title: true,
                attendanceCount: true,
            },
        });

        if (!event) {
            throw new NotFoundException('Event not found');
        }

        const totalTickets = await this.prisma.ticket.count({
            where: {
                order: {
                    eventId,
                    status: 'PAID',
                },
            },
        });

        return {
            eventId: event.id,
            eventTitle: event.title,
            attendanceCount: event.attendanceCount,
            totalTickets,
            percentageAttended: totalTickets > 0 ? (event.attendanceCount / totalTickets) * 100 : 0,
        };
    }

    async getStaffEvents(session: ActiveStaffSession) {
        return [
            {
                id: session.event.id,
                title: session.event.title,
                startDate: session.event.startDate,
                venue: session.event.venue,
            },
        ];
    }

    private computeTicketStatus(ticket: any, tokenExpSeconds: number): TicketStatusResponse {
        if (ticket.status === 'USED') {
            return 'USED';
        }

        if (ticket.status === 'CANCELLED') {
            return 'CANCELLED';
        }

        if (ticket.order.status !== 'PAID') {
            return ticket.order.reservedUntil && ticket.order.reservedUntil > new Date()
                ? 'RESERVED'
                : 'UNPAID';
        }

        const tokenExpired = tokenExpSeconds && tokenExpSeconds * 1000 < Date.now();
        if (tokenExpired) {
            return 'EXPIRED';
        }

        return 'VALID';
    }

    private hashToken(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }
}
