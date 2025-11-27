import { Module } from '@nestjs/common';
import { JwtModule } from '@nestjs/jwt';
import { PassportModule } from '@nestjs/passport';
import { CacheModule } from '@nestjs/cache-manager';
import { AuthService } from './auth.service';
import { AuthController } from './auth.controller';
import { JwtStrategy } from './strategies/jwt.strategy';
import { getEnvVar } from '@monomarket/config';

@Module({
    imports: [
        PassportModule.register({ defaultStrategy: 'jwt' }),
        JwtModule.register({
            secret: getEnvVar('JWT_SECRET'),
            signOptions: {
                expiresIn: getEnvVar('JWT_EXPIRES_IN', '7d'),
            },
        }),
        CacheModule.register({
            ttl: 60 * 60 * 24 * 7, // 7 days default
        }),
    ],
    controllers: [AuthController],
    providers: [AuthService, JwtStrategy],
    exports: [AuthService, JwtStrategy, PassportModule],
})
export class AuthModule { }

