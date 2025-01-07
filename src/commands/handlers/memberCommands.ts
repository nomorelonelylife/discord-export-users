// src/commands/handlers/memberCommands.ts
import { CommandInteraction, Guild } from 'discord.js';
import ObjectsToCsv from 'objects-to-csv';
import { MemberData, validateMemberData } from '../../types/member';
import { generateFileName, cleanupFile } from '../../utils/file';
import { Logger } from '../../utils/Logger';

const logger = Logger.getInstance();

export async function handleMembersCommand(
    interaction: CommandInteraction,
    guild: Guild,
    roleId?: string
) {
    try {
        let members = await guild.members.fetch();

        if (roleId) {
            members = members.filter(member => member.roles.cache.has(roleId));
        }

        const csvObj: MemberData[] = members.map((member) => ({
            id: member.id,
            username: member.user.tag,
            joinDate: member.joinedAt?.toISOString().split('T')[0] || 'Unknown',
            roles: member.roles.cache.map((role) => role.name).join(', ')
        })).filter(validateMemberData);

        if (csvObj.length === 0) {
            await interaction.reply('No valid members found to export.');
            return;
        }

        const fileName = generateFileName(roleId ? 'members_role' : 'members');
        const csv = new ObjectsToCsv(csvObj);
        
        await csv.toDisk(fileName, {
            append: false,
            bom: false,
            allColumns: true
        });

        await interaction.reply({
            content: `Here's a list of ${csvObj.length} members!`,
            files: [fileName]
        });

        await interaction.fetchReply();
        await cleanupFile(fileName);
    } catch (error) {
        if (error instanceof Error) {
            await logger.error('Error handling members command:', error);
            if (!interaction.replied) {
                await interaction.reply('An error occurred while executing this command.');
            }
        }
    }
}