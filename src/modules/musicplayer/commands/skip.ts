import { getVoiceConnection } from '@discordjs/voice';
import { CacheType, ChatInputCommandInteraction, EmbedBuilder, SlashCommandBuilder } from 'discord.js';

export const data = new SlashCommandBuilder()
	.setName('skip')
	.setDescription('Skips current song.');

export async function execute(interaction: ChatInputCommandInteraction<CacheType>) {
	if (!interaction.inCachedGuild()) return;

	const voiceChannel = interaction.member.voice.channel;
	if (!voiceChannel) {
		await interaction.reply({ content: 'You are not in voice channel', ephemeral: true });
		return;
	}

	const connection = getVoiceConnection(voiceChannel.guildId);
	if (connection == undefined) return;

	const embedResponse = new EmbedBuilder()
		.setTitle('Music Player')
		.setColor('#8A1E28');

	if (voiceChannel.id == connection.joinConfig.channelId) {
		connection.player.stop();
		embedResponse.setDescription('Skipped current song');
	}
	else {
		await interaction.reply({ content: 'You are in different voice channel', ephemeral: true });
	}

	await interaction.reply({ embeds: [embedResponse] });
}