import { Controller, Post, Body, Headers } from '@nestjs/common';
import { PaymentsWebhooksService } from './webhooks.service';

/**
 * Controlador para recibir webhooks de payment gateways
 */
@Controller('webhooks')
export class PaymentsWebhooksController {
    constructor(private webhookHandler: PaymentsWebhooksService) { }

    /**
     * Webhook de OpenPay
     * POST /webhooks/openpay
     */
    @Post('openpay')
    async handleOpenpayWebhook(
        @Body() payload: any,
        @Headers('x-openpay-signature') signature?: string,
    ) {
        await this.webhookHandler.handleOpenpayWebhook(payload, signature);
        return { received: true };
    }

    /**
     * Webhook de MercadoPago
     * POST /webhooks/mercadopago
     */
    @Post('mercadopago')
    async handleMercadopagoWebhook(
        @Body() payload: any,
        @Headers('x-signature') signature?: string,
    ) {
        await this.webhookHandler.handleMercadopagoWebhook(payload, signature);
        return { received: true };
    }
}
