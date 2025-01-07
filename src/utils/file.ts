// src/utils/file.ts
import path from 'path';
import fs from 'fs/promises';
import crypto from 'crypto';
import { Logger } from './Logger';

const logger = Logger.getInstance();

export const generateFileName = (prefix: string): string => {
    const outputDir = path.join(__dirname, '../../output');
    const randomStr = crypto.randomBytes(8).toString('hex');
    return path.join(outputDir, `${prefix}_${Date.now()}_${randomStr}.csv`);
};

export const cleanupFile = async (filePath: string): Promise<void> => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error instanceof Error) {
            await logger.error('Error cleaning up file:', error);
        }
    }
};

export const ensureOutputDir = async () => {
    const outputDir = path.join(__dirname, '../../output');
    await fs.mkdir(outputDir, { recursive: true }).catch(console.error);
};