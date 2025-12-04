import { BadRequestException, Injectable, NotFoundException } from '@nestjs/common';
import { FeePlan, PaymentGateway, PaymentStatus, Prisma } from '@prisma/client';
import { MercadoPagoConfig, Payment } from 'mercadopago';
import { PrismaService } from '../modules/prisma/prisma.service';
import { PaymentsConfigService } from './payments.config';
import { ProcessPaymentDto } from './dto/process-payment.dto';

type CreateMercadoPagoPaymentDto = Pick<
    ProcessPaymentDto,
    'method' | 'token' | 'installments' | 'issuerId' | 'paymentMethodId' | 'payer'
>;

export interface PaymentResult {
    paymentId: string;
    providerPaymentId: string;
    status: PaymentStatus;
    redirectUrl?: string;
    instructions?: string;
}

type OrderWithRelations = Prisma.OrderGetPayload<{
    include: {
        payment: true;
        buyer: true;
        items: { include: { template: true } };
        event: {
            include: {
                organizer: {
                    include: {
                        feePlan: true;
                    };
                };
            };
        };
    };
}>;

@Injectable()
export class PaymentsService {
    private readonly mpPaymentClient: Payment;

    constructor(
        private readonly prisma: PrismaService,
        private readonly config: PaymentsConfigService,
    ) {
        const integratorId = this.config.getMercadoPagoIntegratorId();
        const client = new MercadoPagoConfig({
            accessToken: this.config.getMercadoPagoAccessToken(),
            options: integratorId ? { integratorId } : undefined,
        });

        this.mpPaymentClient = new Payment(client);
    }

    async processPayment(dto: ProcessPaymentDto): Promise<PaymentResult> {
        const order = await this.prisma.order.findUnique({
            where: { id: dto.orderId },
            include: {
                payment: true,
                buyer: true,
                items: {
                    include: {
                        template: true,
                    },
                },
                event: {
                    include: {
                        organizer: {
                            include: {
                                feePlan: true,
                            },
                        },
                    },
                },
            },
        });

        if (!order) {
            throw new NotFoundException('Order not found');
        }

        if (order.status !== 'PENDING') {
            throw new BadRequestException('Order is not pending payment');
        }

        if (order.reservedUntil && order.reservedUntil < new Date()) {
            throw new BadRequestException('Order reservation expired');
        }

        const feePlan = order.event?.organizer?.feePlan ?? undefined;

        return this.processMercadoPagoPayment(order, {
            method: dto.method,
            token: dto.token,
            installments: dto.installments,
            issuerId: dto.issuerId,
            paymentMethodId: dto.paymentMethodId,
            payer: dto.payer,
        }, feePlan);
    }

    private async processMercadoPagoPayment(
        order: OrderWithRelations,
        paymentData: CreateMercadoPagoPaymentDto,
        feePlan?: FeePlan | null,
    ): Promise<PaymentResult> {
        const platformFeeAmount = this.computePlatformFeeAmount(order.total, feePlan);
        const notificationUrl = this.config.getMercadoPagoWebhookUrl();

        const payerPayload = this.buildPayerPayload(order, paymentData.payer);

        const payload: Record<string, any> = {
            transaction_amount: Number(order.total),
            currency_id: order.currency,
            token: paymentData.token,
            description: order.event?.title ?? `Orden ${order.id}`,
            external_reference: order.id,
            installments: paymentData.installments ?? 1,
            payer: payerPayload,
            metadata: {
                orderId: order.id,
                eventId: order.eventId,
                buyerId: order.buyerId,
            },
            statement_descriptor: order.event?.title?.slice(0, 22),
            payment_type_id: this.mapMethodToPaymentTypeId(paymentData.method),
            notification_url: notificationUrl,
            application_fee_amount: platformFeeAmount,
        };

        const paymentMethodId = paymentData.paymentMethodId
            ?? this.mapMethodToPaymentMethodId(paymentData.method);
        if (paymentMethodId) {
            payload.payment_method_id = paymentMethodId;
        }

        if (paymentData.issuerId) {
            payload.issuer_id = paymentData.issuerId;
        }

        let response: any;
        try {
            response = await this.mpPaymentClient.create({ body: payload });
        } catch (error: any) {
            throw new BadRequestException(
                `No se pudo procesar el pago con Mercado Pago: ${error?.message ?? 'error desconocido'}`,
            );
        }

        const data = response?.body ?? response ?? {};
        const providerPaymentId = String(data.id ?? '');
        const paymentStatus = this.mapMercadoPagoStatus(data.status) ?? PaymentStatus.PENDING;

        const payment = await this.prisma.payment.upsert({
            where: { orderId: order.id },
            update: {
                gateway: PaymentGateway.MERCADOPAGO,
                amount: order.total,
                currency: order.currency,
                status: paymentStatus,
                gatewayTransactionId: providerPaymentId,
                paymentMethod: paymentData.method,
            },
            create: {
                orderId: order.id,
                gateway: PaymentGateway.MERCADOPAGO,
                amount: order.total,
                currency: order.currency,
                status: paymentStatus,
                gatewayTransactionId: providerPaymentId,
                paymentMethod: paymentData.method,
            },
        });

        const transactionData = data.point_of_interaction?.transaction_data;
        const redirectUrl = transactionData?.ticket_url
            ?? transactionData?.external_resource_url
            ?? transactionData?.url
            ?? undefined;
        const instructions = this.buildPointOfInteractionInstructions(transactionData);

        return {
            paymentId: payment.id,
            providerPaymentId,
            status: payment.status,
            redirectUrl,
            instructions,
        };
    }

    private computePlatformFeeAmount(total: Prisma.Decimal, feePlan?: FeePlan | null): number {
        const amount = Number(total);
        if (Number.isNaN(amount)) {
            return 0;
        }

        const percent = Number(feePlan?.platformFeePercent ?? 0);
        const fixed = Number(feePlan?.platformFeeFixed ?? 0);
        const fee = amount * (percent / 100) + fixed;
        return Number(fee.toFixed(2));
    }

    private mapMethodToPaymentTypeId(method: CreateMercadoPagoPaymentDto['method']): string {
        switch (method) {
            case 'spei':
                return 'bank_transfer';
            case 'oxxo':
                return 'ticket';
            case 'google_pay':
            case 'apple_pay':
                return 'digital_wallet';
            default:
                return 'credit_card';
        }
    }

    private mapMethodToPaymentMethodId(method: CreateMercadoPagoPaymentDto['method']): string | undefined {
        switch (method) {
            case 'spei':
                return 'spei';
            case 'oxxo':
                return 'oxxo';
            case 'google_pay':
                return 'google_pay';
            case 'apple_pay':
                return 'apple_pay';
            default:
                return undefined;
        }
    }

    private mapMercadoPagoStatus(status?: string): PaymentStatus | null {
        switch (status) {
            case 'approved':
                return PaymentStatus.COMPLETED;
            case 'pending':
            case 'authorized':
            case 'in_process':
                return PaymentStatus.PENDING;
            case 'rejected':
            case 'cancelled':
            case 'charged_back':
            case 'refunded':
                return PaymentStatus.FAILED;
            default:
                return null;
        }
    }

    private buildPointOfInteractionInstructions(transactionData?: Record<string, any>): string | undefined {
        if (!transactionData) {
            return undefined;
        }

        const parts: string[] = [];
        if (transactionData.reference) {
            parts.push(`Referencia: ${transactionData.reference}`);
        }
        if (transactionData.bank_transfer_reference) {
            parts.push(`Referencia bancaria: ${transactionData.bank_transfer_reference}`);
        }
        if (transactionData.clabe) {
            parts.push(`CLABE: ${transactionData.clabe}`);
        }
        if (transactionData.ticket_number) {
            parts.push(`Folio: ${transactionData.ticket_number}`);
        }

        if (!parts.length) {
            return undefined;
        }

        return parts.join(' | ');
    }

    private buildPayerPayload(
        order: OrderWithRelations,
        payerOverride?: ProcessPaymentDto['payer'],
    ) {
        const email = payerOverride?.email ?? order.buyer.email;
        const firstName = payerOverride?.firstName ?? order.buyer.name ?? undefined;
        const lastName = payerOverride?.lastName ?? undefined;
        const phoneNumber = payerOverride?.phone ?? order.buyer.phone ?? undefined;
        const identificationNumber = payerOverride?.identificationNumber;

        const payer: Record<string, any> = {
            email,
        };

        if (firstName) {
            payer.first_name = firstName;
        }

        if (lastName) {
            payer.last_name = lastName;
        }

        if (phoneNumber) {
            payer.phone = { number: phoneNumber };
        }

        if (identificationNumber) {
            payer.identification = {
                type: payerOverride?.identificationType ?? undefined,
                number: identificationNumber,
            };
        }

        return payer;
    }
}
