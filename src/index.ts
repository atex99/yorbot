import 'dotenv/config';
import { Client, Events, GatewayIntentBits } from 'discord.js';
import { LoadSlashCommands } from './handler/loadSlashCommands';

const TOKEN = process.env.BOT_TOKEN!;

const client = new Client({ intents: [GatewayIntentBits.Guilds, GatewayIntentBits.GuildVoiceStates] });

client.on('ready', () => console.log(`${client.user?.tag} logged in`));

client.on(Events.InteractionCreate, (interaction) => {
	if (interaction.isChatInputCommand()) {
		client.slashCommands.get(interaction.commandName).execute(interaction);
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