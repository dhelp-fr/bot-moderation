import {
    ChatInputCommandInteraction,
    AutocompleteInteraction,
    PermissionsBitField,
    SlashCommandBuilder,
    Guild,
    EmbedBuilder
} from "discord.js";
import {DhelpClient} from "../../../structure/Client.js";

export default {
    data: new SlashCommandBuilder()
        .setName("unmute")
        .setDescription("Rendre la parole à un membre")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .addStringOption(
            opt => opt
                .setName("membre")
                .setDescription("Le membre à unmute")
                .setRequired(true)
                .setAutocomplete(true)
        )
        .addStringOption(
            opt => opt
                .setName("raison")
                .setMaxLength(80)
                .setDescription("La raison de l'unmute de ce membre")
                .setRequired(false)
        ),
    /**
     *
     * @param {DhelpClient} client
     * @param {AutocompleteInteraction} interaction
     */
    autocomplete: async (client, interaction) => {
        const focused = interaction.options.getFocused();
        /**
         * @type {Guild}
         */
        await interaction.guild.members.fetch();
        const mutes = (await interaction.guild.roles.fetch()).find(x => x.name === "Mute").members ?? null;
        if (!mutes)return;
        const choices = mutes.map(x => ({name: x.user.username, value: x.user.id}));
        void interaction.respond(
            choices.filter(x => x.name.includes(focused)).slice(0, 25)
        )
    },
    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    execute: async (client, interaction) => {
        const memberId = interaction.options.getString("membre");
        const reason = interaction.options.getString("raison");
        /**
         *
         * @type {GuildMember | null}
         */
        const member = await interaction.guild.members.fetch(memberId).catch(() => {});
        if (!member)return;

        member.roles.remove((await interaction.guild.roles.fetch()).find(x => x.name === "Mute").id, interaction.user.username + " | " + (reason ?? "Aucune raison"))
            .then((x) => {
                client.log("Unmute".yellow + ` - Mute de ${x.user.username}`);
                void interaction.reply({
                    embeds: [embeds.success(x.user, client, interaction, reason)],
                });
            })
            .catch((reason) => {
                void interaction.reply({
                    embeds: [embeds.error(reason)],
                    ephemeral: true
                })
            })
    }
}

const embeds = {
    /**
     *
     * @param {User} member
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     * @param {string | null} reason
     * @returns {EmbedBuilder}
     */
    success: (member, client, interaction, reason) => new EmbedBuilder()
        .setColor(client.color)
        .setTitle("🔇  Unmute")
        .setDescription(
            `### Le membre **${member.username}** a retrouvé la parole.\n` +
            `- **Modérateur :** ${interaction.user.username}\n` +
            (reason ? `- **Raison :** ${reason}\n` : "")
        )
        .setTimestamp(),
    /**
     * param {string} reason
     */
    error: (reason) => new EmbedBuilder()
        .setColor("Red")
        .setTitle("Une erreur s'est produite !")
        .setDescription(`\`${reason}\``)
}