import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';

/**
 * ComplimentaryTicketsService handles cortesías (complimentary tickets)
 * MVP Rules:
 * - <2500 capacity: 5 free cortesías
 * - ≥2500 capacity: 330 free cortesías
 * - Extra cortesías pay director-defined service charge
 */
@Injectable()
export class ComplimentaryTicketsService {
    private readonly logger = new Logger(ComplimentaryTicketsService.name);

    constructor(private prisma: PrismaService) { }

    /**
     * Calculate allowed complimentary tickets for an event
     * @param eventCapacity Event capacity
     * @returns Number of free cortesías
     */
    calculateAllowedCortesias(eventCapacity: number): number {
        return eventCapacity >= 2500 ? 330 : 5;
    }

    /**
     * Generate complimentary tickets for an event
     * @param organizerId Organizer ID
     * @param eventId Event ID
     * @param quantity Number of cortesías to generate
     * @param buyerInfo Buyer information
     * @returns Created order with complimentary tickets
     */
    async generateComplimentaryTickets(
        organizerId: string,
        eventId: string,
        quantity: number,
        buyerInfo: { name: string; email: string; phone?: string },
    ) {
        // Get event and organizer info
        const event = await this.prisma.event.findUnique({
            where: { id: eventId },
            include: { organizer: { include: { feePlan: true } } },
        });

        if (!event || event.organizerId !== organizerId) {
            throw new BadRequestException('Event not found or unauthorized');
        }

        const allowedFree = this.calculateAllowedCortesias(event.capacity);
        const used = event.organizer.complementaryTicketsUsed || 0;
        const remainingFree = Math.max(0, allowedFree - used);
        const chargeableQuantity = Math.max(0, quantity - remainingFree);

        this.logger.log(`Cortesías: allowed=${allowedFree}, used=${used}, requested=${quantity}, chargeable=${chargeableQuantity}`);

        // Create or find buyer
        let buyer = await this.prisma.buyer.findFirst({
            where: { email: buyerInfo.email },
        });

        if (!buyer) {
            buyer = await this.prisma.buyer.create({
                data: buyerInfo,
            });
        }

        // Calculate charges (only for extra cortesías)
        const complementaryFee = event.organizer.feePlan?.complementaryFee?.toNumber() || 0;
        const totalCharge = chargeableQuantity * complementaryFee;

        // Create order
        const order = await this.prisma.order.create({
            data: {
                eventId,
                buyerId: buyer.id,
                status: 'PAID', // Cortesías are pre-approved
                total: totalCharge,
                currency: 'MXN',
                platformFeeAmount: totalCharge,
                organizerIncomeAmount: 0,
                paidAt: new Date(),
            },
        });

        // Create complimentary ticket template if doesn't exist
        let template = await this.prisma.ticketTemplate.findFirst({
            where: {
                eventId,
                isComplimentary: true,
            },
        });

        if (!template) {
            template = await this.prisma.ticketTemplate.create({
                data: {
                    organizerId,
                    eventId,
                    name: 'Cortesía',
                    description: 'Entrada cortesía',
                    price: 0,
                    quantity: 9999, // Unlimited for tracking
                    isComplimentary: true,
                },
            });
        }

        // Generate tickets
        const tickets = [];
        for (let i = 0; i < quantity; i++) {
            const qrCode = this.generateQRCode();
            const ticket = await this.prisma.ticket.create({
                data: {
                    orderId: order.id,
                    templateId: template.id,
                    qrCode,
                    status: 'VALID',
                },
            });
            tickets.push(ticket);
        }

        // Update organizer complimentary tickets count
        await this.prisma.organizer.update({
            where: { id: organizerId },
            data: {
                complementaryTicketsUsed: used + quantity,
            },
        });

        this.logger.log(`Generated ${quantity} cortesías for event ${eventId}, charged: $${totalCharge}`);

        return {
            order,
            tickets,
            charged: totalCharge,
            freeUsed: Math.min(quantity, remainingFree),
            paidExtra: chargeableQuantity,
        };
    }

    /**
     * Get complimentary tickets usage for an organizer
     * @param organizerId Organizer ID
     * @returns Usage statistics
     */
    async getUsageStats(organizerId: string) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { id: organizerId },
            include: {
                events: true,
            },
        });

        if (!organizer) {
            throw new BadRequestException('Organizer not found');
        }

        // Calculate total allowed based on events
        const totalAllowed = organizer.events.reduce((sum, event) => {
            return sum + this.calculateAllowedCortesias(event.capacity);
        }, 0);

        return {
            used: organizer.complementaryTicketsUsed || 0,
            totalAllowed,
            remaining: Math.max(0, totalAllowed - (organizer.complementaryTicketsUsed || 0)),
            eventBreakdown: organizer.events.map(event => ({
                eventId: event.id,
                eventTitle: event.title,
                capacity: event.capacity,
                allowed: this.calculateAllowedCortesias(event.capacity),
            })),
        };
    }

    /**
     * Generate unique QR code for ticket
     */
    private generateQRCode(): string {
        return `CORTESIA-${Date.now()}-${Math.random().toString(36).substring(7).toUpperCase()}`;
    }
}
