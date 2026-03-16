import { Injectable, OnModuleInit } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { betterAuth } from 'better-auth';
import { Pool } from 'pg';

/** Better Auth instance wrapper — creates a dedicated pg.Pool for BA queries */
@Injectable()
export class AuthService implements OnModuleInit {
  // Exposed so controllers/guards can call auth.handler() and auth.api.*
  auth!: ReturnType<typeof betterAuth>;

  private pool!: Pool;

  constructor(private readonly config: ConfigService) {}

  onModuleInit(): void {
    const dbUrl = this.config.get<string>('database.url')!;
    const authSecret = this.config.get<string>('auth.secret')!;
    const authUrl = this.config.get<string>('auth.url')!;

    this.pool = new Pool({ connectionString: dbUrl });

    this.auth = betterAuth({
      database: this.pool,

      // Map BA internal model names to our plural table names
      user: {
        modelName: 'users',
        fields: {
          emailVerified: 'email_verified',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
      },
      session: {
        modelName: 'sessions',
        expiresIn: 30 * 24 * 60 * 60, // 30 days
        fields: {
          userId: 'user_id',
          expiresAt: 'expires_at',
          ipAddress: 'ip_address',
          userAgent: 'user_agent',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
      },
      account: {
        modelName: 'accounts',
        fields: {
          accountId: 'account_id',
          providerId: 'provider_id',
          userId: 'user_id',
          accessToken: 'access_token',
          refreshToken: 'refresh_token',
          idToken: 'id_token',
          accessTokenExpiresAt: 'access_token_expires_at',
          refreshTokenExpiresAt: 'refresh_token_expires_at',
          createdAt: 'created_at',
          updatedAt: 'updated_at',
        },
      },
      // 'verification' table uses camelCase columns — BA does not support field mapping here

      secret: authSecret,
      baseURL: authUrl,
      basePath: '/api/auth',

      emailAndPassword: {
        enabled: true,
        autoSignIn: true,
      },

      socialProviders: {
        google: {
          clientId: this.config.get<string>('auth.googleClientId') ?? '',
          clientSecret:
            this.config.get<string>('auth.googleClientSecret') ?? '',
          enabled: !!this.config.get<string>('auth.googleClientId'),
        },
        github: {
          clientId: this.config.get<string>('auth.githubClientId') ?? '',
          clientSecret:
            this.config.get<string>('auth.githubClientSecret') ?? '',
          enabled: !!this.config.get<string>('auth.githubClientId'),
        },
      },

      advanced: {
        defaultCookieAttributes: {
          sameSite: 'lax',
          secure: this.config.get<string>('app.nodeEnv') === 'production',
          httpOnly: true,
        },
      },
    } as Parameters<typeof betterAuth>[0]);
  }

  async onModuleDestroy(): Promise<void> {
    await this.pool.end();
  }
}
