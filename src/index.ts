import 'dotenv/config';
import path from 'path';
import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } from 'discord.js';
import { cleanEnv, str } from 'envalid';
import ObjectsToCsv from 'objects-to-csv';
import fs from 'fs/promises';
import express from 'express';

console.log('Current working directory:', process.cwd());
console.log('Looking for .env file at:', path.resolve(process.cwd(), '.env'));
console.log('Environment variables loaded:', {
    CLIENT_TOKEN: process.env.CLIENT_TOKEN ? '***' : undefined,
    APPLICATION_ID: process.env.APPLICATION_ID ? '***' : undefined,
    PUBLIC_KEY: process.env.PUBLIC_KEY ? '***' : undefined
});

const env = cleanEnv(process.env, {
    CLIENT_TOKEN: str(),
    APPLICATION_ID: str(),
    PUBLIC_KEY: str()
});

// Convert port to number to satisfy TypeScript
const port = Number(process.env.PORT) || 8888;

// Express app setup
const app = express();

// Basic route for health check
app.get('/', (req, res) => {
    res.send('Discord Bot Service is running!');
});

class Logger {
    private logFile: string;

    constructor() {
        this.logFile = path.join(__dirname, '../logs/error.log');
        
        fs.mkdir(path.dirname(this.logFile), { recursive: true }).catch(console.error);
    }

    async error(message: string, error?: Error) {
        const timestamp = new Date().toISOString();
        const logMessage = `[${timestamp}] ERROR: ${message}\n${error?.stack || ''}\n\n`;
        await fs.writeFile(this.logFile, logMessage).catch(console.error);
        console.error(logMessage);
    }

    info(message: string) {
        const timestamp = new Date().toISOString();
        console.log(`[${timestamp}] INFO: ${message}`);
    }
}

const logger = new Logger();

const generateFileName = (prefix: string): string => {
    const outputDir = path.join(__dirname, '../output');
    return path.join(outputDir, `${prefix}_${Date.now()}_${Math.random().toString(36).slice(2)}.csv`);
};

const cleanupFile = async (filePath: string): Promise<void> => {
    try {
        await fs.unlink(filePath);
    } catch (error) {
        if (error instanceof Error) {
            await logger.error('Error cleaning up file:', error);
        }
    }
};

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

const ensureOutputDir = async () => {
    const outputDir = path.join(__dirname, '../output');
    await fs.mkdir(outputDir, { recursive: true }).catch(console.error);
};

const registerCommands = async () => {
    const commands = [
        new SlashCommandBuilder()
            .setName("members")
            .setDescription("Export server members to a CSV file")
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .toJSON(),
        new SlashCommandBuilder()
            .setName("rolemembers")
            .setDescription("Export members of a specific role to a CSV file")
            .addRoleOption((option) => 
                option.setName("role")
                    .setDescription("The role to export members of")
                    .setRequired(true)
            )
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .toJSON(),
    ];

    const rest = new REST({ version: "10" }).setToken(env.CLIENT_TOKEN);

    try {
        logger.info('Registering slash commands...');
        await rest.put(
            Routes.applicationCommands(env.APPLICATION_ID),
            { body: commands }
        );
        logger.info('Slash commands registered successfully');
    } catch (error) {
        if (error instanceof Error) {
            await logger.error('Error registering slash commands:', error);
        }
    }
};

interface MemberData {
    id: string;
    username: string;
    joinDate: string;
    roles: string;
}

client.once("ready", () => {
    logger.info(`Logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    try {
        if (commandName === 'members') {
            if (!interaction.guild) {
                await interaction.reply('This command can only be used in a server.');
                return;
            }

            const guild = interaction.guild;
            const members = await guild.members.fetch();

            const csvObj: MemberData[] = members.map((member) => ({
                id: member.id,
                username: member.user.tag,
                joinDate: member.joinedAt?.toISOString().split('T')[0] || 'Unknown',
                roles: member.roles.cache.map((role) => role.name).join(', ')
            }));

            const fileName = generateFileName('members');
            const csv = new ObjectsToCsv(csvObj);
            
            await csv.toDisk(fileName, {
                append: false,
                bom: false,
                allColumns: true
            });

            await interaction.reply({
                content: `Here's a list of all ${guild.memberCount} server members!`,
                files: [fileName]
            });

            setTimeout(() => cleanupFile(fileName), 5000);
        }
        else if (commandName === 'rolemembers') {
            if (!interaction.guild) {
                await interaction.reply('This command can only be used in a server.');
                return;
            }

            const guild = interaction.guild;
            const requestedRole = interaction.options.getRole('role');
            
            if (!requestedRole) {
                await interaction.reply('Role not found.');
                return;
            }

            const members = await guild.members.fetch();
            const roleMembers = members.filter(member => member.roles.cache.has(requestedRole.id));

            const csvObj: MemberData[] = roleMembers.map((member) => ({
                id: member.id,
                username: member.user.tag,
                joinDate: member.joinedAt?.toISOString().split('T')[0] || 'Unknown',
                roles: member.roles.cache.map((role) => role.name).join(', ')
            }));

            const fileName = generateFileName('members_role');
            const csv = new ObjectsToCsv(csvObj);
            
            await csv.toDisk(fileName, {
                append: false,
                bom: false,
                allColumns: true
            });

            await interaction.reply({
                content: `Here's a list of all ${csvObj.length} members of role ${requestedRole.name}!`,
                files: [fileName]
            });

            setTimeout(() => cleanupFile(fileName), 5000);
        }
    } catch (error) {
        if (error instanceof Error) {
            await logger.error(`Error in command ${commandName}:`, error);
            if (!interaction.replied) {
                await interaction.reply('An error occurred while executing this command.');
            }
        }
    }
});

const start = async () => {
    try {
        // Start Express server
        app.listen(port, '0.0.0.0', () => {
            logger.info(`HTTP server listening on port ${port}`);
        });

        await ensureOutputDir();
        await client.login(env.CLIENT_TOKEN);
        await registerCommands();
    } catch (error) {
        if (error instanceof Error) {
            await logger.error('Error starting bot:', error);
            process.exit(1);
        }
    }
};

start();