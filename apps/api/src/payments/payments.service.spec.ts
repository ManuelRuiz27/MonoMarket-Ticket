import { BadRequestException, NotFoundException } from '@nestjs/common';
import { PaymentStatus, Prisma } from '@prisma/client';
import { mockDeep, DeepMockProxy } from 'jest-mock-extended';
import { PaymentsService } from './payments.service';
import { PrismaService } from '../modules/prisma/prisma.service';
import { PaymentsConfigService } from './payments.config';

const mockMercadoPagoCreate = jest.fn();

jest.mock('mercadopago', () => ({
    MercadoPagoConfig: jest.fn().mockImplementation(() => ({})),
    Payment: jest.fn().mockImplementation(() => ({
        create: mockMercadoPagoCreate,
    })),
}));
describe('PaymentsService', () => {
    let prisma: DeepMockProxy<PrismaService>;
    let config: PaymentsConfigService;
    let service: PaymentsService;

    beforeEach(() => {
        jest.clearAllMocks();
        mockMercadoPagoCreate.mockReset();
        prisma = mockDeep<PrismaService>();
        config = {
            getMercadoPagoAccessToken: jest.fn().mockReturnValue('mp-token'),
            getMercadoPagoWebhookSecret: jest.fn().mockReturnValue('mp-hook'),
            getApiBaseUrl: jest.fn().mockReturnValue('https://api.local'),
            getMercadoPagoWebhookUrl: jest.fn().mockReturnValue('https://api.local/api/webhooks/mercadopago'),
            getMercadoPagoIntegratorId: jest.fn().mockReturnValue(undefined),
        } as unknown as PaymentsConfigService;
        service = new PaymentsService(prisma, config);
    });

    it('processes a Mercado Pago payment and stores transaction metadata', async () => {
        const feePlan = {
            id: 'fee-1',
            name: 'Default',
            description: null,
            platformFeePercent: new Prisma.Decimal(5),
            platformFeeFixed: new Prisma.Decimal(10),
            paymentGatewayFeePercent: new Prisma.Decimal(0),
            complementaryFee: new Prisma.Decimal(0),
            isDefault: true,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        };

        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'PENDING',
            total: new Prisma.Decimal(200),
            currency: 'MXN',
            payment: null,
            buyer: { id: 'buyer-1', name: 'Buyer', email: 'buyer@test.com', phone: '5512345678' },
            items: [
                {
                    templateId: 'tpl-1',
                    unitPrice: new Prisma.Decimal(200),
                    quantity: 1,
                    template: { name: 'VIP' },
                },
            ],
            eventId: 'event-1',
            event: {
                id: 'event-1',
                title: 'Gran show',
                organizer: {
                    id: 'org-1',
                    userId: 'user-1',
                    businessName: 'Organizer',
                    status: 'ACTIVE',
                    feePlan,
                },
            },
        } as any);
        prisma.payment.upsert.mockResolvedValue({ id: 'payment-1', status: PaymentStatus.PENDING } as any);
        mockMercadoPagoCreate.mockResolvedValue({
            body: {
                id: 'mp_txn_1',
                status: 'pending',
            },
        });

        const response = await service.processPayment({
            orderId: 'order-1',
            provider: 'mercadopago',
            method: 'card',
            token: 'tok_visa',
            issuerId: 'iss_123',
            paymentMethodId: 'visa',
            payer: {
                firstName: 'Buyer',
                lastName: 'Test',
                email: 'buyer@test.com',
                phone: '5512345678',
            },
        });

        expect(mockMercadoPagoCreate).toHaveBeenCalledTimes(1);
        const mpRequest = mockMercadoPagoCreate.mock.calls[0][0].body;
        expect(mpRequest.transaction_amount).toBe(200);
        expect(mpRequest.application_fee_amount).toBe(20);
        expect(mpRequest.payment_type_id).toBe('credit_card');
        expect(mpRequest.payment_method_id).toBe('visa');
        expect(mpRequest.issuer_id).toBe('iss_123');
        expect(mpRequest.metadata.orderId).toBe('order-1');
        expect(mpRequest.payer.first_name).toBe('Buyer');
        expect(mpRequest.payer.last_name).toBe('Test');
        expect(mpRequest.payer.phone.number).toBe('5512345678');

        expect(prisma.payment.upsert).toHaveBeenCalledTimes(1);
        expect(response).toEqual({
            paymentId: 'payment-1',
            providerPaymentId: 'mp_txn_1',
            status: PaymentStatus.PENDING,
            redirectUrl: undefined,
            instructions: undefined,
        });
    });

    it('processes a Mercado Pago SPEI payment and returns instructions', async () => {
        const feePlan = {
            id: 'fee-2',
            name: 'Default',
            description: null,
            platformFeePercent: new Prisma.Decimal(3),
            platformFeeFixed: new Prisma.Decimal(5),
            paymentGatewayFeePercent: new Prisma.Decimal(0),
            complementaryFee: new Prisma.Decimal(0),
            isDefault: true,
            createdAt: new Date('2025-01-01T00:00:00.000Z'),
            updatedAt: new Date('2025-01-01T00:00:00.000Z'),
        };

        prisma.order.findUnique.mockResolvedValue({
            id: 'order-99',
            status: 'PENDING',
            total: new Prisma.Decimal(500),
            currency: 'MXN',
            payment: null,
            buyer: { id: 'buyer', name: 'Buyer', email: 'buyer@test.com' },
            items: [],
            eventId: 'event-2',
            event: {
                id: 'event-2',
                title: 'Evento',
                organizer: {
                    id: 'org-2',
                    userId: 'user-2',
                    businessName: 'Organizer',
                    status: 'ACTIVE',
                    feePlan,
                },
            },
        } as any);
        prisma.payment.upsert.mockResolvedValue({ id: 'payment-99', status: PaymentStatus.PENDING } as any);
        mockMercadoPagoCreate.mockResolvedValue({
            body: {
                id: 'mp_txn_spei',
                status: 'pending',
                point_of_interaction: {
                    transaction_data: {
                        ticket_url: 'https://mercadopago.com/spei/ref',
                        reference: 'REF123',
                        bank_transfer_reference: 'SPEI123',
                    },
                },
            },
        });

        const result = await service.processPayment({
            orderId: 'order-99',
            provider: 'mercadopago',
            method: 'spei',
            token: 'token-spei',
            payer: {
                email: 'buyer@test.com',
            },
        });

        const mpRequest = mockMercadoPagoCreate.mock.calls[0][0].body;
        expect(mpRequest.payment_method_id).toBe('spei');
        expect(mpRequest.payment_type_id).toBe('bank_transfer');

        expect(result.redirectUrl).toBe('https://mercadopago.com/spei/ref');
        expect(result.instructions).toContain('Referencia bancaria: SPEI123');
        expect(result.providerPaymentId).toBe('mp_txn_spei');
        expect(result.status).toBe(PaymentStatus.PENDING);
    });

    it('throws when order is not found', async () => {
        prisma.order.findUnique.mockResolvedValue(null);

        await expect(
            service.processPayment({
                orderId: 'missing',
                provider: 'mercadopago',
                method: 'card',
                token: 'token',
            }),
        ).rejects.toThrow(NotFoundException);
    });

    it('throws when order is not pending', async () => {
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-1',
            status: 'PAID',
        } as any);

        await expect(
            service.processPayment({
                orderId: 'order-1',
                provider: 'mercadopago',
                method: 'card',
                token: 'token',
            }),
        ).rejects.toThrow(BadRequestException);
    });

    it('throws when order reservation is expired', async () => {
        prisma.order.findUnique.mockResolvedValue({
            id: 'order-2',
            status: 'PENDING',
            reservedUntil: new Date(Date.now() - 60_000),
        } as any);

        await expect(
            service.processPayment({
                orderId: 'order-2',
                provider: 'mercadopago',
                method: 'card',
                token: 'token',
            }),
        ).rejects.toThrow(BadRequestException);
    });
});
