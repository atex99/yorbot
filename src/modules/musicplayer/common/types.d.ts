import { Collection, GuildTextBasedChannel } from 'discord.js';

declare module '@discordjs/voice' {
	interface VoiceConnection {
		player: AudioPlayer;
	}

	interface AudioPlayer {
		songQueue: Collection<string, any>;
		channel: GuildTextBasedChannel;
	}
}