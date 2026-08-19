import dotenv from "dotenv";

dotenv.config();

function required(name: string): string {
    const value = process.env[name];

    if (!value) {
        if (name === "DATABASE_URL") return "postgresql://postgres:postgres@localhost:5432/islamic_school_db?schema=public";
        return "dev-secret-key";
    }

    return value;
}

export const env = {
    NODE_ENV: process.env.NODE_ENV ?? "development",

    PORT: Number(process.env.PORT ?? 5000),

    DATABASE_URL: required("DATABASE_URL"),

    CLIENT_URL: process.env.CLIENT_URL ?? "http://localhost:5173",

    jwtAccessSecret: process.env.JWT_ACCESS_SECRET!,
    jwtRefreshSecret: process.env.JWT_REFRESH_SECRET!,
    jwtAccessExpires: process.env.JWT_ACCESS_EXPIRES_IN!,
    jwtRefreshExpires: process.env.JWT_REFRESH_EXPIRES_IN!,
    brevoApiKey: process.env.BREVO_API_KEY!,
    brevoSenderName: process.env.BREVO_SENDER_NAME!,
    brevoSenderEmail: process.env.BREVO_SENDER_EMAIL!,
    r2Endpoint: process.env.R2_ENDPOINT!,
    r2AccessKeyId: process.env.R2_ACCESS_KEY_ID!,
    r2SecretAccessKey: process.env.R2_SECRET_ACCESS_KEY!,
    r2BucketName: process.env.R2_BUCKET_NAME!,
    r2PublicUrl: process.env.R2_PUBLIC_URL!,
    r2AccessToken: process.env.R2_ACCESS_TOKEN!,
    telegramBotToken: process.env.TELEGRAM_BOT_TOKEN!,
    telegramBotUsername: process.env.TELEGRAM_BOT_USERNAME!,
    redisHost: process.env.REDIS_HOST ?? "localhost",
    redisPort: process.env.REDIS_PORT ?? "6379",
    redisUrl: process.env.REDIS_URL,
    redisToken: process.env.REDIS_TOKEN,
};