import "dotenv/config";
import { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, PermissionFlagsBits } from "discord.js";
import ObjectsToCsv from "objects-to-csv";

const client = new Client({ 
    intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildMembers]
});

client.once("ready", () => {
    console.log(`Logged in as ${client.user?.tag}`);
})

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
            .addRoleOption((option) => option.setName("role").setDescription("The role to export members of").setRequired(true))
            .setDefaultMemberPermissions(PermissionFlagsBits.Administrator)
            .toJSON(),
    ]

    const rest = new REST({ version: "10" }).setToken(process.env.CLIENT_TOKEN!);

    try {
        console.log('Registering slash commands...');
        await rest.put(Routes.applicationCommands(process.env.APPLICATION_ID!), { body: commands})
        console.log('Slash commands registered successfully');
    } catch (error) {
        console.error('Error registering slash commands:', error);
    }
};

client.on('interactionCreate', async (interaction) => {
    if (!interaction.isChatInputCommand()) return;

    const { commandName } = interaction;

    if (commandName === 'members') {
        if (!interaction.guild) {
            await interaction.reply('This command can only be used in a server.');
            return;
        }

        const guild = interaction.guild;
        const members = await guild.members.fetch();

        const csvObj = members.map((member) => ({
            id: member.id,
            username: member.user.tag,
            joinDate: member.joinedAt?.toISOString().split('T')[0] || 'Unknown',
            roles: member.roles.cache.map((role) => role.name).join(', ')
        }));
        const csv = new ObjectsToCsv(csvObj);
        await csv.toDisk("./members.csv", {
            append: false,
            bom: false,
            allColumns: true
        }).then(() => {
            interaction.reply({
                content: `Here's a list of all ${guild.memberCount} server members!`,
                files: ["./members.csv"]
            })
        }).catch((err: any) => {
            console.log("Error getting a list of Discord guild members.", err)
            interaction.reply("Error getting the members of this server.")
        })
    }
    else if (commandName === 'rolemembers') {
        if (!interaction.guild) {
            await interaction.reply('This command can only be used in a server.');
            return;
        }

        const guild = interaction.guild;
        const requestedRole = interaction.options.getRole('role');
        const role = guild.roles.cache.find(r => r.name.toLowerCase() === requestedRole?.name.toLowerCase());
        if (!role) {
            await interaction.reply('Role not found.');
            return;
        }

        const roleMembers = await guild.members.fetch();
        roleMembers.filter(member => member.roles.cache.has(role.id));

        const csvObj = roleMembers.filter(member => member.roles.cache.has(role.id)).map((member) => ({
            id: member.id,
            username: member.user.tag,
            joinDate: member.joinedAt?.toISOString().split('T')[0] || 'Unknown',
            roles: member.roles.cache.map((role) => role.name).join(', ')
        }));
        const csv = new ObjectsToCsv(csvObj);
        await csv.toDisk("./members_role.csv", {
            append: false,
            bom: false,
            allColumns: true
        }).then(() => {
            interaction.reply({
                content: `Here's a list of all ${csvObj.length} members of role ${role.name}!`,
                files: ["./members_role.csv"]
            })
        }).catch((err: any) => {
            console.log("Error getting a list of role members.", err)
            interaction.reply("Error getting the members of this role.")
        })
    }
})

client.login(process.env.CLIENT_TOKEN!);
// uncomment this on commands change or on first run
// registerCommands();