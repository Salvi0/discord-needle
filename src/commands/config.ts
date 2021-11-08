import { codeBlock, SlashCommandBuilder } from "@discordjs/builders";
import { CommandInteraction } from "discord.js";
import { getConfig, removeInvalidConfigKeys, setConfig } from "../helpers/configHelpers";
import { messageReply, getCodeFromCodeBlock } from "../helpers/messageHelpers";
import { NeedleCommand } from "../types/needleCommand";

// TODO: PERMISSIONS!

export const command: NeedleCommand = {
	name: "config",
	shortHelpDescription: "Modify or view the configuration of Needle",

	async getSlashCommandBuilder() {
		return new SlashCommandBuilder()
			.setName("config")
			.setDescription("Modify or view the configuration of Needle")
			.addSubcommand(subcommand => {
				return subcommand
					.setName("set")
					.setDescription("Set the entire configuration at once by passing raw JSON data")
					.addStringOption(option => {
						return option
							.setName("json")
							.setDescription("The raw json data for the config")
							.setRequired(true);
					});
			})
			.addSubcommand(subcommand => {
				return subcommand
					.setName("get")
					.setDescription("Get the configuration");
			})
			.toJSON();
	},

	async execute(interaction: CommandInteraction): Promise<void> {
		if (interaction.options.getSubcommand() === "set") {
			return setConfigCommand(interaction);
		}

		if (interaction.options.getSubcommand() === "get") {
			return getConfigCommand(interaction);
		}
	},
};

async function getConfigCommand(interaction: CommandInteraction): Promise<void> {
	if (!interaction.guildId || !interaction.guild) {
		return messageReply(interaction, "ERR_ONLY_IN_SERVER");
	}

	const config = getConfig(interaction.guildId);
	const configJson = JSON.stringify(config, undefined, 4);
	return interaction.reply({
		content: `Current configuration for \`${interaction.guild.name}\`: ${codeBlock("json", configJson)}`,
		ephemeral: true,
	});
}

async function setConfigCommand(interaction: CommandInteraction): Promise<void> {
	if (!interaction.guildId) {
		return messageReply(interaction, "ERR_ONLY_IN_SERVER");
	}

	let configJson = interaction.options.getString("json");
	if (!configJson) {
		return messageReply(interaction, "ERR_JSON_MISSING");
	}

	configJson = getCodeFromCodeBlock(configJson);

	let parsedJson;
	try {
		parsedJson = JSON.parse(configJson);
		parsedJson = removeInvalidConfigKeys(parsedJson);
	}
	catch {
		return messageReply(interaction, "ERR_JSON_INVALID");
	}

	if (typeof parsedJson !== "object" || Object.keys(parsedJson).length === 0) {
		return messageReply(interaction, "ERR_CONFIG_INVALID");
	}

	const success = setConfig(interaction.guildId, parsedJson);
	await messageReply(interaction, success
		? "SUCCESS_SET_CONFIG"
		: "ERR_CONFIG_INVALID");
}
