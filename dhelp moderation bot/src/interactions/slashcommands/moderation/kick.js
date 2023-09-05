import {EmbedBuilder, SlashCommandBuilder, ChatInputCommandInteraction, PermissionsBitField} from "discord.js";
import {DhelpClient} from "../../../structure/Client.js";

export default {
    data: new SlashCommandBuilder()
        .setName("kick")
        .setDescription("Expulser un membre.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.KickMembers)
        .addUserOption(
            opt => opt
                .setName("membre")
                .setDescription("Le membre que vous souhaitez expulser.")
                .setRequired(true)
        )
        .addStringOption(
            opt => opt
                .setName("raison")
                .setDescription("la raison du kick de ce membre")
                .setMaxLength(80)
        ),
    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    execute: async (client, interaction) => {
        const user = interaction.options.getUser("membre");
        /**
         * @type {GuildMember | null}
         */
        const member = await interaction.guild.members.fetch(user).catch(() => {});
        if (!member)return;
        const raison = interaction.options.getString("raison");

        if (!member.kickable)return interaction.reply({
            embeds: [embeds.hasNotEnoughPerm(user)],
            ephemeral: true
        });

        if (member.roles.highest.comparePositionTo(interaction.member.roles.highest) > 0) return interaction.reply({
            embeds: [embeds.hasBetterPerm(member)],
            ephemeral: true
        });

        member.kick(interaction.user.username + " | " + (raison ?? "Aucune raison"))
            .then(() => {
                client.log("Kick".yellow + ` - Kick de ${member.user.username}`)
                void interaction.reply({
                    embeds: [embeds.banned(member, client, interaction, raison)],
                });
            })
            .catch((reason) => {
                void interaction.reply({
                    embeds: [embeds.error(reason)],
                    ephemeral: true
                })
            })
    },
}

const embeds = {
    /**
     *
     * @param {User} user
     * @returns {EmbedBuilder}
     */
    hasNotEnoughPerm: (user) => new EmbedBuilder()
        .setColor('Red')
        .setTitle("Permission Insuffisante !")
        .setDescription(`> Je n'ai pas la permission d'expulser **${user.username}**.`),

    /**
     *
     * @param {GuildMember} member
     * @returns {EmbedBuilder}
     */
    hasBetterPerm: (member) => new EmbedBuilder()
        .setColor('Red')
        .setTitle("Permission Insuffisante !")
        .setDescription(`> Vous ne pouvez pas expulser le membre **${member.user.username}** puisqu'il a un rôle supérieur à vous.`),
    /**
     *
     * @param {GuildMember} member
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     * @param {string} reason
     * @returns {EmbedBuilder}
     */
    banned: (member, client, interaction, reason,) => new EmbedBuilder()
        .setColor(client.color)
        .setTitle("💥  Expulsion")
        .setDescription(
            `### Le membre **${member.user.username}** a été expulsé.\n` +
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