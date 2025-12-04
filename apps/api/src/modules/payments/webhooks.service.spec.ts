import { BadRequestException } from '@nestjs/common';
import { DeepMockProxy, mockDeep } from 'jest-mock-extended';
import { PaymentsWebhooksService } from './webhooks.service';
import { PrismaService } from '../prisma/prisma.service';
import { EmailService } from '../email/email.service';

describe('PaymentsWebhooksService', () => {
    let prisma: DeepMockProxy<PrismaService>;
    let email: DeepMockProxy<EmailService>;
    let service: PaymentsWebhooksService;

    beforeEach(() => {
        prisma = mockDeep<PrismaService>();
        email = mockDeep<EmailService>();
        prisma.$transaction.mockImplementation(async (fn: any) => fn(prisma));
        service = new PaymentsWebhooksService(prisma, email);
    });

    it('logs and processes approved Mercado Pago payment', async () => {
        const payload = {
            type: 'payment',
            data: {
                id: 123456789,
                status: 'approved',
            },
            external_reference: 'order-123',
        };

        prisma.order.findUnique.mockResolvedValue({
            id: 'order-123',
            items: [
                { templateId: 'tpl-1', quantity: 2 },
            ],
        } as any);

        await service.handleMercadopagoWebhook(payload, 'signature-placeholder');

        expect(prisma.webhookLog.create).toHaveBeenCalledTimes(1);
        const logArgs = prisma.webhookLog.create.mock.calls[0][0].data;
        expect(logArgs.gateway).toBe('mercadopago');
        expect(logArgs.event).toBe('payment');
        expect(logArgs.orderId).toBe('order-123');

        expect(prisma.order.update).toHaveBeenCalledWith({
            where: { id: 'order-123' },
            data: { status: 'PAID', paidAt: expect.any(Date) },
        });

        expect(prisma.payment.updateMany).toHaveBeenCalledWith({
            where: { orderId: 'order-123' },
            data: { status: 'COMPLETED', gatewayTransactionId: String(payload.data.id) },
        });

        expect(prisma.ticket.create).toHaveBeenCalledTimes(2);
        expect(prisma.ticketTemplate.update).toHaveBeenCalledWith({
            where: { id: 'tpl-1' },
            data: { sold: { increment: 2 } },
        });

        expect(email.sendTicketsEmail).toHaveBeenCalledWith('order-123');
    });

    it('logs OpenPay webhook and rejects when signature invalid', async () => {
        const payload = {
            type: 'charge.succeeded',
            transaction: {
                id: 'ch_123',
                order_id: 'order-xyz',
            },
        };

        process.env.OPENPAY_WEBHOOK_SECRET = 'secret';

        await expect(
            service.handleOpenpayWebhook(payload, 'invalid-signature'),
        ).rejects.toBeInstanceOf(BadRequestException);

        expect(prisma.webhookLog.create).toHaveBeenCalledTimes(1);
        const logArgs = prisma.webhookLog.create.mock.calls[0][0].data;
        expect(logArgs.gateway).toBe('openpay');
        expect(logArgs.event).toBe('charge.succeeded');
        expect(logArgs.orderId).toBe('order-xyz');
        expect(logArgs.verified).toBe(false);
    });
});
