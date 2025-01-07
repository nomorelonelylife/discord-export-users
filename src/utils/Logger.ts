// src/utils/Logger.ts
import path from 'path';
import fs from 'fs/promises';

export class Logger {
    private logFile: string;
    private static instance: Logger;

    private constructor() {
        this.logFile = path.join(__dirname, '../../logs/error.log');
        fs.mkdir(path.dirname(this.logFile), { recursive: true }).catch(console.error);
    }

    public static getInstance(): Logger {
        if (!Logger.instance) {
            Logger.instance = new Logger();
        }
        return Logger.instance;
    }

    async error(message: string, error?: Error) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}\n${error?.stack || ''}\n\n`;
        const stats = await fs.stat(this.logFile).catch(() => null);
        if (stats && stats.size > 10 * 1024 * 1024) {
            await fs.writeFile(this.logFile, '');
        }
        
        await fs.appendFile(this.logFile, logMessage).catch(console.error);
        console.error(logMessage);
    }

    info(message: string) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${message}`);
    }
}