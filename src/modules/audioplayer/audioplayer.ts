import { entersState, getVoiceConnection, joinVoiceChannel, VoiceConnection, VoiceConnectionStatus } from '@discordjs/voice';
import { VoiceBasedChannel } from 'discord.js';

export function getVoiceChannelToPlay(voiceChannel: VoiceBasedChannel): VoiceConnection {
	let connection = getVoiceConnection(voiceChannel.guildId);

	if (connection == undefined) {
		connection = joinVoiceChannel({
			channelId: voiceChannel.id,
			guildId: voiceChannel.guildId,
			adapterCreator: voiceChannel.guild.voiceAdapterCreator,
		});

		connection.on(VoiceConnectionStatus.Disconnected, async () => {
			try {
				await Promise.race([
					entersState(connection!, VoiceConnectionStatus.Signalling, 5_000),
					entersState(connection!, VoiceConnectionStatus.Connecting, 5_000),
				]);
			}
			catch (error) {
				connection!.destroy();
			}
		});
	}

	return connection;
}