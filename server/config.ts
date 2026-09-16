import dotenv from 'dotenv';

dotenv.config();

function parseOrigins(value: string): string | string[] {
  if (value === '*') return value;
  return value
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

export const config = {
  port: parseInt(process.env.PORT || '5000', 10),
  corsOrigin: parseOrigins(process.env.CORS_ORIGIN || '*'),
};