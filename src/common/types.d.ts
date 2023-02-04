import { Collection } from 'discord.js';

declare module 'discord.js' {
	interface Client {
		slashCommands: Collection<string, any>;
	}
}