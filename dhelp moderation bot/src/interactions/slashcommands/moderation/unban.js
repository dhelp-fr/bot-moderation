import {
    PermissionsBitField,
    SlashCommandBuilder,
    Collection,
    GuildBan,
    ChatInputCommandInteraction,
    EmbedBuilder
} from "discord.js";
import {DhelpClient} from "../../../structure/Client.js";
import {AutocompleteInteraction} from "discord.js";

export default {
    data: new SlashCommandBuilder()
        .setName("unban")
        .setDescription("Debannir un membre")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addStringOption(
            opt => opt
                .setName("membre")
                .setDescription("le membre à débannir")
                .setAutocomplete(true)
                .setRequired(true)
        )
        .addStringOption(
            opt => opt
                .setName("raison")
                .setDescription("la raison du débannissement")
                .setMaxLength(80)
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
         * @type {Collection<string, GuildBan>}
         */
        const bans = await interaction.guild.bans.fetch();
        const choices = bans.map(x => ({
            name: `${x.user.username} (${x.user.id}) - ${x.reason}`.slice(0, 50),
            value: x.user.id
        }));
        void interaction.respond(
            choices.filter(x => x.name.includes(focused)).slice(0, 25)
        )
    },
    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    execute: (client, interaction) => {
        const memberId = interaction.options.getString("membre");
        const reason = interaction.options.getString("raison");

        interaction.guild.bans.remove(memberId, interaction.user.username + " | " + (reason ?? "Aucune raison"))
            .then((x) => {
                client.log("Deban".red + ` - Débannissement de ${x.username}`)
                void interaction.reply({
                    embeds: [embeds.success(x, client, interaction, reason)],
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
        .setTitle("🔨  Débannissement")
        .setDescription(
            `### Le membre **${member.username}** a été débanni.\n` +
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