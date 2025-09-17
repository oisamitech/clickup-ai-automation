export const envSchema = {
    type: 'object',
    required: [
        'CLICKUP_API_TOKEN',
        'CLICKUP_API_URL', 
        'CLICKUP_USER_ID',
        'GEMINI_API_KEY',
        'GEMINI_MODEL',
        'GOOGLE_CLOUD_PROJECT_ID',
        'GOOGLE_CLOUD_BUCKET_NAME',
        'GOOGLE_SERVICE_ACCOUNT_KEY'
    ],
    properties: {
        NODE_ENV: {
        type: 'string',
        default: 'development'
        },
        PORT: {
        type: 'integer',
        default: 3000
        },
        CLICKUP_API_TOKEN: { type: 'string' },
        CLICKUP_API_URL: { 
        type: 'string',
        default: 'https://api.clickup.com/api/v2'
        },
        CLICKUP_USER_ID: { type: 'string' },
        GEMINI_API_KEY: { type: 'string' },
        GEMINI_MODEL: { 
        type: 'string',
        default: 'gemini-1.5-flash'
        },
        GOOGLE_CLOUD_PROJECT_ID: { type: 'string' },
        GOOGLE_CLOUD_BUCKET_NAME: { type: 'string' },
        GOOGLE_SERVICE_ACCOUNT_KEY: { type: 'string' },
        GOOGLE_DRIVE_FOLDER_ID: { type: 'string' },
        REDIS_HOST: {
        type: 'string',
        default: 'localhost'
        },
        REDIS_PORT: {
        type: 'integer',
        default: 6379
        },
        REDIS_PASSWORD: { type: 'string' },
        REDIS_DB: {
        type: 'integer',
        default: 0
        },
        REDIS_TTL_SECONDS: {
        type: 'integer',
        default: 300
        }
    }
};
  
export const envOptions = {
    confKey: 'config',
    schema: envSchema,
    dotenv: true
};