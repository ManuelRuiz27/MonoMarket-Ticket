import { Injectable, NotFoundException, ForbiddenException, UnauthorizedException } from '@nestjs/common';
import { PrismaService } from '../prisma/prisma.service';
import { CreateStaffSessionDto } from './dto/create-staff-session.dto';
import { ActiveStaffSession } from './staff.types';
import { randomBytes, createHash } from 'crypto';

const DEFAULT_EXPIRATION_HOURS = 12;
const MAX_FAILED_ATTEMPTS = 5;

@Injectable()
export class StaffService {
    constructor(private readonly prisma: PrismaService) { }

    async createSession(userId: string, dto: CreateStaffSessionDto) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });

        if (!organizer) {
            throw new NotFoundException('Organizer not found for this user');
        }

        const event = await this.prisma.event.findFirst({
            where: {
                id: dto.eventId,
                organizerId: organizer.id,
            },
            select: { id: true },
        });

        if (!event) {
            throw new ForbiddenException('Event does not belong to organizer');
        }

        const rawToken = this.generateToken();
        const tokenHash = this.hashToken(rawToken);
        const expiresInHours = dto.expiresInHours ?? DEFAULT_EXPIRATION_HOURS;
        const expiresAt = new Date(Date.now() + expiresInHours * 60 * 60 * 1000);

        const session = await this.prisma.staffSession.create({
            data: {
                organizerId: organizer.id,
                eventId: event.id,
                tokenHash,
                expiresAt,
            },
            include: {
                event: {
                    select: { id: true, title: true, startDate: true },
                },
            },
        });

        return {
            token: rawToken,
            session,
        };
    }

    async listOrganizerSessions(userId: string) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });

        if (!organizer) {
            throw new NotFoundException('Organizer not found for this user');
        }

        return this.prisma.staffSession.findMany({
            where: {
                organizerId: organizer.id,
                revoked: false,
            },
            orderBy: { createdAt: 'desc' },
            include: {
                event: {
                    select: { id: true, title: true, startDate: true, venue: true },
                },
            },
        });
    }

    async revokeSession(userId: string, sessionId: string) {
        const organizer = await this.prisma.organizer.findUnique({
            where: { userId },
        });

        if (!organizer) {
            throw new NotFoundException('Organizer not found for this user');
        }

        const session = await this.prisma.staffSession.findUnique({
            where: { id: sessionId },
        });

        if (!session || session.organizerId !== organizer.id) {
            throw new NotFoundException('Staff session not found');
        }

        await this.prisma.staffSession.update({
            where: { id: sessionId },
            data: {
                revoked: true,
                updatedAt: new Date(),
            },
        });

        return { revoked: true };
    }

    async verifyToken(token: string): Promise<ActiveStaffSession> {
        const tokenHash = this.hashToken(token);
        const session = await this.prisma.staffSession.findFirst({
            where: { tokenHash },
            include: {
                event: {
                    select: { id: true, title: true, startDate: true, venue: true },
                },
                organizer: {
                    select: { id: true, businessName: true },
                },
            },
        });

        if (!session) {
            throw new UnauthorizedException('Invalid staff token');
        }

        if (session.revoked) {
            await this.incrementFailedAttempts(session.id);
            throw new UnauthorizedException('Token has been revoked');
        }

        if (session.failedAttempts >= MAX_FAILED_ATTEMPTS) {
            throw new UnauthorizedException('Token locked due to repeated errors');
        }

        if (session.expiresAt.getTime() < Date.now()) {
            await this.incrementFailedAttempts(session.id);
            throw new UnauthorizedException('Token expired');
        }

        return session;
    }

    async incrementFailedAttempts(sessionId: string) {
        await this.prisma.staffSession.update({
            where: { id: sessionId },
            data: {
                failedAttempts: { increment: 1 },
            },
        });
    }

    async touchSession(sessionId: string) {
        await this.prisma.staffSession.update({
            where: { id: sessionId },
            data: {
                updatedAt: new Date(),
                failedAttempts: 0,
            },
        });
    }

    private generateToken() {
        return randomBytes(32).toString('hex');
    }

    private hashToken(token: string) {
        return createHash('sha256').update(token).digest('hex');
    }
}
