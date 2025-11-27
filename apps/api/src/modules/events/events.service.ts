import { Injectable, NotFoundException, BadRequestException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { UploadPdfTemplateDto } from './dto/upload-pdf-template.dto';
import { EventFiltersDto } from './dto/event-filters.dto';
import { randomBytes } from 'crypto';

@Injectable()
export class EventsService {
    constructor(private prisma: PrismaService) { }

    /**
     * Obtiene todos los eventos públicos (sin filtros)
     */
    async findAllPublic() {
        return this.prisma.event.findMany({
            where: {
                status: 'PUBLISHED',
                isPublic: true,
                isUnlisted: false
            },
            include: {
                organizer: {
                    include: { user: true },
                },
                templates: true,
            },
            orderBy: {
                startDate: 'asc'
            }
        });
    }

    /**
     * Busca eventos públicos con filtros (MVP Épica 1)
     * @param filters Filtros de búsqueda
     */
    async findPublicWithFilters(filters: EventFiltersDto) {
        const where: any = {
            status: 'PUBLISHED',
            isPublic: true,
            isUnlisted: false,
        };

        // Filtro por categoría
        if (filters.category) {
            where.category = filters.category;
        }

        // Filtro por ciudad
        if (filters.city) {
            where.city = {
                contains: filters.city,
                mode: 'insensitive',
            };
        }

        // Filtro por rango de fechas
        if (filters.dateFrom || filters.dateTo) {
            where.startDate = {};
            if (filters.dateFrom) {
                where.startDate.gte = new Date(filters.dateFrom);
            }
            if (filters.dateTo) {
                where.startDate.lte = new Date(filters.dateTo);
            }
        }

        // Filtro por rango de precios
        if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
            where.price = {};
            if (filters.priceMin !== undefined) {
                where.price.gte = filters.priceMin;
            }
            if (filters.priceMax !== undefined) {
                where.price.lte = filters.priceMax;
            }
        }

        // Búsqueda por texto (título o descripción)
        if (filters.search) {
            where.OR = [
                { title: { contains: filters.search, mode: 'insensitive' } },
                { description: { contains: filters.search, mode: 'insensitive' } },
            ];
        }

        return this.prisma.event.findMany({
            where,
            include: {
                organizer: {
                    include: { user: true },
                },
                templates: true,
            },
            orderBy: {
                startDate: 'asc'
            }
        });
    }

    /**
     * Busca un evento por token de acceso (Modelo B - Unlisted)
     * @param token Token de acceso
     */
    async findByAccessToken(token: string) {
        const event = await this.prisma.event.findFirst({
            where: {
                accessToken: token,
                status: 'PUBLISHED',
                isUnlisted: true,
            },
            include: {
                organizer: {
                    include: { user: true },
                },
                templates: true,
            },
        });

        if (!event) {
            throw new NotFoundException('Evento no encontrado o token inválido');
        }

        return event;
    }

    /**
     * Genera un token único para evento unlisted
     * @param eventId ID del evento
     */
    async generateAccessToken(eventId: string): Promise<string> {
        // Genera token seguro y único
        const token = randomBytes(16).toString('hex');

        await this.prisma.event.update({
            where: { id: eventId },
            data: {
                isUnlisted: true,
                accessToken: token,
            },
        });

        return token;
    }

    async findAllByOrganizer(userId: string) {
        return this.prisma.event.findMany({
            where: {
                organizer: {
                    userId: userId
                }
            },
            include: {
                templates: true,
                organizer: true
            },
            orderBy: {
                startDate: 'asc'
            }
        });
    }

    async findAllForStaff(userId: string) {
        return this.prisma.event.findMany({
            where: {
                staff: {
                    some: {
                        userId: userId
                    }
                }
            },
            include: {
                templates: true,
                organizer: true
            },
            orderBy: {
                startDate: 'asc'
            }
        });
    }

    async findById(id: string) {
        return this.prisma.event.findUnique({
            where: { id },
            include: {
                organizer: {
                    include: { user: true },
                },
                templates: true,
            },
        });
    }

    async setPdfTemplate(
        eventId: string,
        filePath: string,
        config: UploadPdfTemplateDto,
    ) {
        return this.prisma.event.update({
            where: { id: eventId },
            data: {
                pdfTemplatePath: filePath,
                qrCodeX: config.qrCodeX,
                qrCodeY: config.qrCodeY,
                qrCodeWidth: config.qrCodeWidth,
            },
        });
    }
}
