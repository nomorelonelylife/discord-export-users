// src/commands/registerCommands.ts
import { REST, Routes, SlashCommandBuilder, PermissionFlagsBits } from 'discord.js';
import { Logger } from '../utils/Logger';
import { env } from '../config/env';

const logger = Logger.getInstance();

export const registerCommands = async () => {
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
