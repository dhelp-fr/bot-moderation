import {
    PermissionsBitField,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    GuildMember,
    EmbedBuilder
} from "discord.js";
import {DhelpClient} from "../../../structure/Client.js";

export default {
    data: new SlashCommandBuilder()
        .setName("ban")
        .setDescription("Bannir un membre.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.BanMembers)
        .addUserOption(
            opt => opt
                .setName("membre")
                .setDescription("le membre à bannir")
                .setRequired(true)
        )
        .addStringOption(
            opt => opt
                .setName("raison")
                .setDescription("la raison du bannissement")
                .setMaxLength(80)
                .setRequired(false)
        )
        .addIntegerOption(
            opt => opt
                .setName("suppresion-messages")
                .setDescription("la période de suppresion des messages du membre")
                .setRequired(false)
                .addChoices(
                    { name: "Ne pas supprimer", value: 0 },
                    { name: "La dernière heure", value: 60 * 60 },
                    { name: "Les 6 dernières heures", value: 60 * 60 * 6 },
                    { name: "Les 12 dernières heures", value: 60 * 60 * 12 },
                    { name: "Les 24 dernières heures", value: 60 * 60 * 24 },
                    { name: "Les 3 derniers jours", value: 60 * 60 * 24 * 3 },
                    { name: "Les 7 derniers jours", value: 60 * 60 * 24 * 7 },
                )
        ),

    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    execute: async (client, interaction) => {
        const user = interaction.options.getUser("membre");
        const member = await interaction.guild.members.fetch(user).catch(() => {});
        if (!member)return;
        const raison = interaction.options.getString("raison");
        const deletedMessage = interaction.options.getInteger("suppresion-messages");

        if (!member.bannable)return interaction.reply({
            embeds: [embeds.hasNotEnoughPerm(user)],
            ephemeral: true
        });

        if (member.roles.highest.comparePositionTo(interaction.member.roles.highest) > 0) return interaction.reply({
            embeds: [embeds.hasBetterPerm(member)],
            ephemeral: true
        });

        member.ban({
            reason: interaction.user.username + " | " + (raison ?? "Aucune raison"),
            deleteMessageSeconds: deletedMessage
        })
            .then(() => {
                client.log("Ban".red + ` - Bannissement de ${member.user.username}`)
                void interaction.reply({
                    embeds: [embeds.banned(member, client, interaction, raison, deletedMessage)],
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
    .setDescription(`> Je n'ai pas la permission de bannir **${user.username}**.`),

    /**
     *
     * @param {GuildMember} member
     * @returns {EmbedBuilder}
     */
    hasBetterPerm: (member) => new EmbedBuilder()
    .setColor('Red')
    .setTitle("Permission Insuffisante !")
    .setDescription(`> Vous ne pouvez pas bannir le membre **${member.user.username}** puisqu'il a un rôle supérieur à vous.`),
    /**
     *
     * @param {GuildMember} member
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     * @param {string} reason
     * @param {number} reason
     * @returns {EmbedBuilder}
     */
    banned: (member, client, interaction, reason, deletedMessage) => new EmbedBuilder()
        .setColor(client.color)
        .setTitle("🔨  Bannissement")
        .setDescription(
            `### Le membre **${member.user.username}** a été banni.\n` +
            `- **Modérateur :** ${interaction.user.username}\n` +
            (reason ? `- **Raison :** ${reason}\n` : "")+
            (deletedMessage ? `- **Suppresion des messages depuis le :** <t:${Math.round(Date.now() / 1000) - deletedMessage}>` : "")
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