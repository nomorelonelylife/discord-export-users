// src/config/env.ts
import { cleanEnv, str } from 'envalid';
import 'dotenv/config';

export const env = cleanEnv(process.env, {
    CLIENT_TOKEN: str(),
    APPLICATION_ID: str(),
    PUBLIC_KEY: str()
});
