import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { LoadSlashCommands } from './handler/loadSlashCommands';
import CommandError from './utils/commandError';
import createEmbed from './utils/createEmbed';

const TOKEN = process.env.BOT_TOKEN!;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.on('ready', () => console.log(`${client.user?.tag} logged in`));

client.on(Events.InteractionCreate, async interaction => {
	if (!interaction.isChatInputCommand()) return;

	try {
		await client.slashCommands.get(interaction.commandName).execute(interaction);
	}
	catch (error) {
		console.error(error);
		if (error instanceof CommandError) {
			const embedError = createEmbed({ title: error.message, description: error.userMsg || 'There was an error while executing this command' });
			await interaction.reply({ embeds: [embedError], ephemeral: true });
		}
	}
});

async function main() {
	try {
		await LoadSlashCommands(client);

		client.login(TOKEN);
	}
	catch (err) {
		console.log(err);
	}
}

main();