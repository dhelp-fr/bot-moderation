import {
    PermissionsBitField,
    SlashCommandBuilder,
    ChatInputCommandInteraction,
    TextChannel,
    NewsChannel,
    StageChannel,
    VoiceChannel, EmbedBuilder
} from "discord.js";
import {DhelpClient} from "../../../structure/Client.js";

export default {
    data: new SlashCommandBuilder()
        .setName("unlock")
        .setDescription("Permet de déverrouiller le channel")
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .setDMPermission(false)
        .addStringOption(
            opt => opt
                .setName("raison")
                .setDescription("La raison du déverrouillage du channel.")
                .setMaxLength(80)
        ),
    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     */
    execute: async (client, interaction) => {
        /**
         * @type {TextChannel | NewsChannel | StageChannel | PublicThreadChannel | PrivateThreadChannel | VoiceChannel}
         */
        const channel = await interaction.channel.fetch();
        const reason = interaction.options.getString("raison");

        channel.permissionOverwrites.create(interaction.guild.roles.everyone.id, {
            SendMessages: null,
            SendVoiceMessages: null,
            SendMessagesInThreads: null,
            SendTTSMessages: null,
            Speak: null,
        }, {
            reason: interaction.user.username + " | " + reason
        })
            .then(() => {
                client.log("Unlock".green + ` - Unlock de ${interaction.user.username}`)
                void interaction.reply({
                    embeds: [embeds.success(client, interaction, reason)],
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
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     * @param {string | null} reason
     * @returns {EmbedBuilder}
     */
    success: (client, interaction, reason) => new EmbedBuilder()
        .setColor(client.color)
        .setTitle("🔓  Salon Déverrouillé")
        .setDescription(
            `### Le membre **${interaction.user.username}** a déverrouillé le channel.\n` +
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