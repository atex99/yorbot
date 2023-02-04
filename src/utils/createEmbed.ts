import { EmbedData, EmbedBuilder, APIEmbed } from 'discord.js';

export default function createEmbed(data: EmbedData | APIEmbed): EmbedBuilder {
	return new EmbedBuilder(data).setColor(0x8A1E28);
}