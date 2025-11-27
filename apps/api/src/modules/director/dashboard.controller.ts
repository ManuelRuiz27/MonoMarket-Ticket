import { Controller, Get, Post, Param, UseGuards, Req, Body } from '@nestjs/common';
import { OrganizerDashboardService } from './organizer-dashboard.service';
import { DirectorDashboardService } from './director-dashboard.service';
import { ComplimentaryTicketsService } from '../tickets/complimentary-tickets.service';
import { JwtAuthGuard } from '../auth/guards/jwt-auth.guard';
import { RolesGuard } from '../auth/guards/roles.guard';
import { Roles } from '../auth/decorators/roles.decorator';

/**
 * Controlador del panel del organizador (MVP Épica 4)
 */
@Controller('organizer')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('ORGANIZER')
export class OrganizerController {
    constructor(
        private dashboardService: OrganizerDashboardService,
        private cortesiasService: ComplimentaryTicketsService,
    ) { }

    /**
     * Resumen general del organizador
     * GET /organizer/dashboard
     */
    @Get('dashboard')
    async getDashboard(@Req() req: any) {
        return this.dashboardService.getOrganizerSummary(req.user.userId);
    }

    /**
     * Métricas de un evento específico
     * GET /organizer/events/:id/metrics
     */
    @Get('events/:id/metrics')
    async getEventMetrics(@Param('id') eventId: string, @Req() req: any) {
        return this.dashboardService.getEventMetrics(eventId, req.user.userId);
    }

    /**
     * Lista de órdenes de un evento
     * GET /organizer/events/:id/orders
     */
    @Get('events/:id/orders')
    async getEventOrders(@Param('id') eventId: string, @Req() req: any) {
        return this.dashboardService.getEventOrders(eventId, req.user.userId);
    }

    /**
     * Estadísticas de cortesías
     * GET /organizer/cortesias/stats
     */
    @Get('cortesias/stats')
    async getCortesiasStats(@Req() req: any) {
        const summary = await this.dashboardService.getOrganizerSummary(req.user.userId);
        return summary?.cortesias || null;
    }

    /**
     * Generar cortesías para un evento
     * POST /organizer/events/:id/cortesias
     */
    @Post('events/:id/cortesias')
    async generateCortesias(
        @Param('id') eventId: string,
        @Req() req: any,
        @Body() dto: {
            quantity: number;
            buyerName: string;
            buyerEmail: string;
            buyerPhone?: string;
        }
    ) {
        const summary = await this.dashboardService.getOrganizerSummary(req.user.userId);
        if (!summary) {
            throw new Error('Organizador no encontrado');
        }

        return this.cortesiasService.generateComplimentaryTickets(
            summary.organizerId,
            eventId,
            dto.quantity,
            {
                name: dto.buyerName,
                email: dto.buyerEmail,
                phone: dto.buyerPhone,
            }
        );
    }
}

/**
 * Controlador del panel del director (MVP Épica 5)
 */
@Controller('director')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles('DIRECTOR', 'ADMIN')
export class DirectorController {
    constructor(private dashboardService: DirectorDashboardService) { }

    /**
     * Métricas globales de la plataforma
     * GET /director/metrics
     */
    @Get('metrics')
    async getMetrics() {
        return this.dashboardService.getGlobalMetrics();
    }

    /**
     * Lista de organizadores
     * GET /director/organizers?status=PENDING
     */
    @Get('organizers')
    async listOrganizers(@Req() req: any) {
        const status = req.query.status;
        return this.dashboardService.listOrganizers(status);
    }

    /**
     * Aprobar organizador
     * POST /director/organizers/:id/approve
     */
    @Post('organizers/:id/approve')
    async approveOrganizer(@Param('id') organizerId: string) {
        return this.dashboardService.approveOrganizer(organizerId);
    }

    /**
     * Suspender organizador
     * POST /director/organizers/:id/suspend
     */
    @Post('organizers/:id/suspend')
    async suspendOrganizer(@Param('id') organizerId: string) {
        return this.dashboardService.suspendOrganizer(organizerId);
    }

    /**
     * Detalles completos de una orden
     * GET /director/orders/:id
     */
    @Get('orders/:id')
    async getOrderDetails(@Param('id') orderId: string) {
        return this.dashboardService.getOrderDetails(orderId);
    }

    /**
     * Reenviar tickets de una orden
     * POST /director/orders/:id/resend-tickets
     */
    @Post('orders/:id/resend-tickets')
    async resendTickets(@Param('id') orderId: string) {
        return this.dashboardService.resendTickets(orderId);
    }

    /**
     * Asignar fee plan a organizador
     * POST /director/organizers/:id/fee-plan
     */
    @Post('organizers/:id/fee-plan')
    async assignFeePlan(
        @Param('id') organizerId: string,
        @Body() dto: { feePlanId: string }
    ) {
        return this.dashboardService.assignFeePlan(organizerId, dto.feePlanId);
    }
}
