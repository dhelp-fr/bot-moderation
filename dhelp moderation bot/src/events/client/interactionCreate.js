import {BaseInteraction, Events} from "discord.js";
import {DhelpClient} from "../../structure/Client.js";
import {DHelpError} from "../../structure/Error.js";

export default {
    name: Events.InteractionCreate,
    /**
     *
     * @param {DhelpClient} client
     * @param {BaseInteraction} interaction
     */
    execute: (client, interaction) => {
        if (interaction.isChatInputCommand())
        {
            const command = client.handler.slashcommands.slashCommandList.get(interaction.commandName);
            try {
                command.execute(client, interaction);
            } catch (e) {
                throw new DHelpError(`ERREUR COMMANDE - ${interaction.commandName} | ` + e)
            }
        }
        else if (interaction.isAutocomplete())
        {
            const command = client.handler.slashcommands.slashCommandList.get(interaction.commandName);
            try {
                command.autocomplete(client, interaction);
            } catch (e) {
                throw new DHelpError(`ERREUR AUTOCOMPLETE - ${interaction.commandName} | ` + e)
            }
        }
    }
}