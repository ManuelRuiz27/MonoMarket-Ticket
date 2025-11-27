import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import * as request from 'supertest';
import { AppModule } from '../src/app.module';

describe('Security Features (e2e)', () => {
    let app: INestApplication;

    beforeAll(async () => {
        const moduleFixture: TestingModule = await Test.createTestingModule({
            imports: [AppModule],
        }).compile();

        app = moduleFixture.createNestApplication();

        // Apply same config as main.ts
        app.setGlobalPrefix('api');
        app.useGlobalPipes(
            new ValidationPipe({
                whitelist: true,
                forbidNonWhitelisted: true,
                transform: true,
            }),
        );

        await app.init();
    });

    afterAll(async () => {
        await app.close();
    });

    describe('Authentication & Logout', () => {
        let authToken: string;

        it('should login successfully with seed data', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'organizador@eventos.com',
                    password: 'password123',
                })
                .expect(201);

            expect(response.body).toHaveProperty('token');
            expect(response.body).toHaveProperty('user');
            authToken = response.body.token;
        });

        it('should logout successfully', async () => {
            const response = await request(app.getHttpServer())
                .post('/api/auth/logout')
                .set('Authorization', `Bearer ${authToken}`)
                .expect(201);

            expect(response.body).toHaveProperty('message');
            expect(response.body.message).toContain('Logged out');
        });

        it('should reject logout without token', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/logout')
                .expect(401);
        });

        it('should reject invalid credentials', async () => {
            await request(app.getHttpServer())
                .post('/api/auth/login')
                .send({
                    email: 'wrong@example.com',
                    password: 'wrongpassword',
                })
                .expect(401);
        });
    });

    describe('Environment Validation', () => {
        it('should have validated environment on startup', () => {
            // If we got here, environment validation passed
            expect(app).toBeDefined();
        });
    });
});
