import {
    PermissionsBitField,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    Collection,
    ChannelType,
    CategoryChannel, EmbedBuilder, Colors
} from "discord.js";
import {DhelpClient} from "../../../structure/Client.js";

export default {
    data: new SlashCommandBuilder()
        .setName("mute")
        .setDescription("Rendre muet un membre.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.MuteMembers)
        .addUserOption(
            opt => opt
                .setName("membre")
                .setDescription("Le membre à rendre muet.")
                .setRequired(true)
        )
        .addStringOption(
            opt => opt
                .setName("raison")
                .setMaxLength(80)
                .setDescription("La raison du mute de ce membre.")
        ),
    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    execute: async (client, interaction) => {
        await interaction.deferReply();
        const user = interaction.options.getUser("membre");
        /**
         * @type {GuildMember}
         */
        const member = await interaction.guild.members.fetch(user).catch(() => {});
        if (!member)return;
        const reason = interaction.options.getString("raison");

        if (member.roles.highest.comparePositionTo(interaction.member.roles.highest) > 0) return interaction.editReply({
            embeds: [embeds.hasBetterPerm(member)],
            ephemeral: true
        });

        const role = await getOrCreateMuteRole();

        if (!role) return interaction.editReply({
            embeds: [embeds.hasNotEnoughPerm(member.user)],
            ephemeral: true
        });

        if (member.roles.cache.has(role))return interaction.reply({
            embeds: [embeds.alreadyMuted(member)],
            ephemeral: true
        });

        member.roles.add(role, interaction.user.username + " | " + reason)
            .then(() => {
                client.log("Mute".yellow + ` - Mute de ${member.user.username}`);
                void interaction.editReply({
                    embeds: [embeds.muted(member, client, interaction, reason)]
                })
            })
            .catch((reason) => {
                void interaction.editReply({
                    embeds: [embeds.error(reason)],
                    ephemeral: true
                })
            })


        /**
         *
         * @returns {Promise<Role|null>}
         */
        async function getOrCreateMuteRole() {
            /**
             * @type {Collection<string, Role>}
             */
            const roles = await interaction.guild.roles.fetch();
            const muteRole = roles.find(x => x.name === "Mute")
            if (muteRole) {
                return muteRole
            } else {
                return interaction.guild.roles.create({
                    name: "Mute",
                    color: Colors.DarkButNotBlack,
                    permissions: [],
                    reason: "Role pour la commande /mute",
                    position: 500
                })
                    .then(async role => {
                        /**
                         *
                         * @type {Collection<string, CategoryChannel>}
                         */
                        const channels = await interaction.guild.channels.fetch();
                        channels.forEach(x => {
                            x.permissionOverwrites.create(role, {
                                SendTTSMessages: false,
                                SendMessagesInThreads: false,
                                SendVoiceMessages: false,
                                SendMessages: false
                            });
                        });
                        return role
                    })
                    .catch(() => {})
            }
        }
    }
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
        .setDescription(`> Je n'ai pas la permission de mute **${user.username}**.`),
    /**
     *
     * @param {User} user
     * @returns {EmbedBuilder}
     */
    alreadyMuted: (user) => new EmbedBuilder()
        .setColor('Red')
        .setTitle("Membre déjà muet !")
        .setDescription(`> Le membre **${user.username}**. est déjà mute.`),

    /**
     *
     * @param {GuildMember} member
     * @returns {EmbedBuilder}
     */
    hasBetterPerm: (member) => new EmbedBuilder()
        .setColor('Red')
        .setTitle("Permission Insuffisante !")
        .setDescription(`> Vous ne pouvez pas mute le membre **${member.user.username}** puisqu'il a un rôle supérieur à vous.`),
    /**
     *
     * @param {GuildMember} member
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     * @param {string} reason
     * @returns {EmbedBuilder}
     */
    muted: (member, client, interaction, reason) => new EmbedBuilder()
        .setColor(client.color)
        .setTitle("🔇  Mute")
        .setDescription(
            `### Le membre **${member.user.username}** a été rendu muet.\n` +
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