import * as Joi from 'joi';

export const validationSchema = Joi.object({
  PORT: Joi.number().default(3000),
  FRONTEND_URL: Joi.string().default('http://localhost:5173'),

  DB_HOST: Joi.string().required(),
  DB_PORT: Joi.number().default(5432),
  DB_USER: Joi.string().required(),
  DB_PASSWORD: Joi.string().required(),
  DB_NAME: Joi.string().required(),

  WHATSAPP_GATEWAY_URL: Joi.string().uri().required(),
  WHATSAPP_GATEWAY_TOKEN: Joi.string().required(),

  JWT_SECRET: Joi.string().min(16).required(),
  ADMIN_PASSWORD_HASH: Joi.string().required(),

  GOOGLE_CLIENT_ID: Joi.string().required(),
  GOOGLE_CLIENT_SECRET: Joi.string().required(),
  GOOGLE_REDIRECT_URI: Joi.string().uri().required(),
  GOOGLE_CALENDAR_ID: Joi.string().default('primary'),

  OTP_EXPIRES_SECONDS: Joi.number().default(300),
  OTP_MAX_ATTEMPTS: Joi.number().default(5),
  OTP_RATE_LIMIT_MAX: Joi.number().default(5),
  OTP_RATE_LIMIT_WINDOW_SECONDS: Joi.number().default(600),
});
