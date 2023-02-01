import { Client, Collection, REST, Routes } from 'discord.js';
import { join, extname } from 'node:path';
import { readdir, access } from 'fs/promises';
import { constants } from 'fs';
import { newSlashCommands } from '../config/commandsConfig.json';
const TOKEN = process.env.BOT_TOKEN!;
const CLIENT_ID = process.env.CLIENT_ID!;

const rest = new REST({ version: '10' }).setToken(TOKEN);

export async function LoadSlashCommands(client: Client) {
	const commands: string[] = [];
	client.slashCommands = new Collection();

	try {
		const modulesPath = join(__dirname, '../modules');
		const modulesDirectories = (await readdir(modulesPath, { withFileTypes: true }))
			.filter(dirent => dirent.isDirectory())
			.map(dirent => dirent.name);

		for (const module of modulesDirectories) {
			const commandsPath = join(modulesPath, module, './commands');
			await access(commandsPath, constants.R_OK | constants.W_OK);

			const commandsFiles = (await readdir(commandsPath)).filter(dirent => extname(dirent) == '.ts' || extname(dirent) == '.js');

			for (const cmdFile of commandsFiles) {
				const cmdPath = join(commandsPath, cmdFile);
				const cmdData = await import(cmdPath);

				if ('data' in cmdData && 'execute' in cmdData) {
					commands.push(cmdData.data.toJSON());
					client.slashCommands.set(cmdData.data.name, cmdData);
				}
				else {
					console.log(`[WARNING] The command at ${cmdPath} is missing a required "data" or "execute" property.`);
				}
			}
		}

		if (newSlashCommands == true) {
			RegisterSlashCommands(commands);
		}

	}
	catch (err) {
		console.log(err);
	}
}

async function RegisterSlashCommands(commands: string[]) {
	try {
		console.log(`Started refreshing ${commands.length} application (/) commands.`);

		await rest.put(Routes.applicationCommands(CLIENT_ID), { body: commands });

		console.log(`Successfully reloaded ${commands.length} application (/) commands.`);
	}
	catch (err) {
		console.log(err);
	}
}