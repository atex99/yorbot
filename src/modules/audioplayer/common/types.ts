import { Collection, GuildTextBasedChannel } from 'discord.js';

declare module '@discordjs/voice' {
	export interface VoiceConnection {
		player: AudioPlayer;
	}

	export interface AudioPlayer {
		songQueue: Collection<string, any>;
		channel: GuildTextBasedChannel;
	}
}