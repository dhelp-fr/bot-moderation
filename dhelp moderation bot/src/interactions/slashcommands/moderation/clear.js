import {
    ChatInputCommandInteraction,
    PermissionsBitField,
    SlashCommandBuilder,
    TextChannel,
    NewsChannel,
    StageChannel,
    VoiceChannel, EmbedBuilder,
} from "discord.js";
import {DhelpClient} from "../../../structure/Client.js";

export default {
    data: new SlashCommandBuilder()
        .setName("clear")
        .setDescription("Vous permet de supprimer des messages.")
        .setDMPermission(false)
        .setDefaultMemberPermissions(PermissionsBitField.Flags.ManageChannels)
        .addSubcommand(
            sub => sub
                .setName("message")
                .setDescription("Supprime les derniers messages.")
                .addIntegerOption(
                    opt => opt
                        .setName("nombre")
                        .setDescription("Le nombre de message a supprimer.")
                        .setMaxValue(100)
                        .setMinValue(0)
                        .setRequired(true)
                )
        )
        .addSubcommand(
            sub => sub
                .setName("channel")
                .setDescription("Supprime puis re-créer le channel.")
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
        const channel = await interaction.channel.fetch()
        switch (interaction.options.getSubcommand()) {
            case "message" : {
                const number = interaction.options.getInteger("nombre");
                channel.bulkDelete(number)
                    .then(() => {
                        client.log("Clear".blue + ` - ${number} messages supprimés par ${interaction.user.username}`);
                        void interaction.reply({
                            embeds: [embeds.clearMessage(client, interaction, number)]
                        });
                    })
                    .catch((err) => {
                        void interaction.reply({
                            embeds: [embeds.error(err)],
                            ephemeral: true
                        })
                    })
            }break;
            case "channel" : {
                await interaction.reply("Veuillez patienter...")
                const newchannel = await channel.clone();
                await channel.delete(`Clear ${interaction.user.username}`);
                client.log("Clear".blue + ` - channel clear par ${interaction.user.username}`);
                void newchannel.send({
                    embeds: [embeds.clearChannel(client, interaction)]
                })
            }break;
        }
    }
}

const embeds = {
    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     * @param {number} number
     * @returns {EmbedBuilder}
     */
    clearMessage: (client, interaction, number) => new EmbedBuilder()
        .setColor(client.color)
        .setTitle("🧹  Suppresion de message")
        .setDescription(
            `### Le membre **${interaction.user.username}** a clear le chat.\n` +
            `- **Nombre de message :** ${number}\n`
        )
        .setTimestamp(),
    /**
     *
     * @param {DhelpClient} client
     * @param {ChatInputCommandInteraction} interaction
     * @returns {EmbedBuilder}
     */
    clearChannel: (client, interaction) => new EmbedBuilder()
        .setColor(client.color)
        .setTitle("🧹  Suppresion de channel")
        .setDescription(
            `### Le membre **${interaction.user.username}** a clear le channel.\n`
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