import { Injectable, NestMiddleware } from '@nestjs/common';
import { Request, Response, NextFunction } from 'express';

/**
 * Middleware de Rate Limiting simple basado en IP
 * Para producción, usar @nestjs/throttler o Redis-based
 */
@Injectable()
export class RateLimitMiddleware implements NestMiddleware {
    private readonly requests = new Map<string, number[]>();
    private readonly WINDOW_MS = 60 * 1000; // 1 minuto
    private readonly MAX_REQUESTS = 100; // 100 requests por minuto

    use(req: Request, res: Response, next: NextFunction) {
        const identifier = this.getIdentifier(req);
        const now = Date.now();

        // Obtener timestamps de requests previos
        let timestamps = this.requests.get(identifier) || [];

        // Filtrar solo los que están dentro de la ventana
        timestamps = timestamps.filter(t => now - t < this.WINDOW_MS);

        // Verificar si excede el límite
        if (timestamps.length >= this.MAX_REQUESTS) {
            const oldestRequest = Math.min(...timestamps);
            const resetTime = oldestRequest + this.WINDOW_MS;
            const retryAfter = Math.ceil((resetTime - now) / 1000);

            res.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS.toString());
            res.setHeader('X-RateLimit-Remaining', '0');
            res.setHeader('X-RateLimit-Reset', resetTime.toString());
            res.setHeader('Retry-After', retryAfter.toString());

            return res.status(429).json({
                error: 'Too Many Requests',
                message: `Límite de ${this.MAX_REQUESTS} requests por minuto excedido`,
                retryAfter: `${retryAfter} segundos`,
            });
        }

        // Agregar timestamp actual
        timestamps.push(now);
        this.requests.set(identifier, timestamps);

        // Headers informativos
        res.setHeader('X-RateLimit-Limit', this.MAX_REQUESTS.toString());
        res.setHeader('X-RateLimit-Remaining', (this.MAX_REQUESTS - timestamps.length).toString());

        // Cleanup periódico
        if (Math.random() < 0.01) {
            this.cleanup();
        }

        next();
    }

    /**
     * Obtiene identificador del cliente (IP)
     */
    private getIdentifier(req: Request): string {
        return (
            (req.headers['x-forwarded-for'] as string)?.split(',')[0]?.trim() ||
            (req.headers['x-real-ip'] as string) ||
            req.socket.remoteAddress ||
            'unknown'
        );
    }

    /**
     * Limpia entradas antiguas
     */
    private cleanup(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [identifier, timestamps] of this.requests.entries()) {
            const validTimestamps = timestamps.filter(t => now - t < this.WINDOW_MS);

            if (validTimestamps.length === 0) {
                this.requests.delete(identifier);
                cleaned++;
            } else {
                this.requests.set(identifier, validTimestamps);
            }
        }

        if (cleaned > 0) {
            console.log(`[RateLimit] Limpiadas ${cleaned} entradas del cache`);
        }
    }
}
