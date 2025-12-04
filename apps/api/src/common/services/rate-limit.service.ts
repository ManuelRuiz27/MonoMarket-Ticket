import { Injectable } from '@nestjs/common';

interface Bucket {
    expiresAt: number;
    count: number;
}

@Injectable()
export class RateLimitService {
    private readonly buckets = new Map<string, Bucket>();

    consume(key: string, limit: number, ttlMs: number): boolean {
        const now = Date.now();
        const bucket = this.buckets.get(key);

        if (!bucket || bucket.expiresAt <= now) {
            this.buckets.set(key, {
                count: 1,
                expiresAt: now + ttlMs,
            });
            return true;
        }

        if (bucket.count >= limit) {
            return false;
        }

        bucket.count += 1;
        return true;
    }
}
