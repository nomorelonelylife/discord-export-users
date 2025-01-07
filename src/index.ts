// src/index.ts
import { Client, GatewayIntentBits } from 'discord.js';
import { env } from './config/env';
import { Logger } from './utils/Logger';
import { ensureOutputDir } from './utils/file';
import { registerCommands } from './commands/registerCommands';
import { handleMembersCommand } from './commands/handlers/memberCommands';

const logger = Logger.getInstance();
const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds, 
        GatewayIntentBits.GuildMembers
    ]
});

client.once("ready", () => {
    logger.info(`Logged in as ${client.user?.tag}`);
});

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (!interaction.guild) {
        await interaction.reply('This command can only be used in a server.');
        return;
    }

    if (commandName === 'members') {
        await handleMembersCommand(interaction, interaction.guild);
    } else if (commandName === 'rolemembers') {
        const requestedRole = interaction.options.getRole('role');
        if (!requestedRole) {
            await interaction.reply('Role not found.');
            return;
        }
        await handleMembersCommand(interaction, interaction.guild, requestedRole.id);
    }
});

const start = async () => {
    try {
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