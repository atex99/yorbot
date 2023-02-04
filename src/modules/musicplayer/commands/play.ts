import { AudioPlayerStatus, createAudioPlayer, createAudioResource, generateDependencyReport, NoSubscriberBehavior } from '@discordjs/voice';
import { CacheType, ChatInputCommandInteraction, Collection, EmbedBuilder, SlashCommandBuilder } from 'discord.js';
import { validate, stream, search, attachListeners, video_basic_info, YouTubeVideo } from 'play-dl';
import CommandError from '../../../utils/commandError';
import createEmbed from '../../../utils/createEmbed';
import { getVoiceChannelToPlay } from '../audioplayer';

console.log(generateDependencyReport());

export const data = new SlashCommandBuilder()
	.setName('play')
	.setDescription('Play a song or add to the queue.')
	.addStringOption((option) => option
		.setName('query')
		.setDescription('Link to a song or playlist you want to listen to.')
		.setRequired(true),
	);

export async function execute(interaction: ChatInputCommandInteraction<CacheType>) {
	if (!interaction.inCachedGuild()) return;

	const voiceChannel = interaction.member.voice.channel;
	if (!voiceChannel) throw new CommandError('Music Player', 'You are not in the voice channel');

	let streamURL!: string;
	let songInfo!: YouTubeVideo;

	const query = interaction.options.getString('query')!;

	const embedResponse = createEmbed({ title: 'Music Player', description: `Searching for ${query}` });
	await interaction.reply({ embeds: [embedResponse] });

	const validatedQuery = await validate(query);

	if (validatedQuery == 'search') {
		const searched = await search(query, { source : { youtube : 'video' } });
		songInfo = searched[0];

		streamURL = songInfo.url;
	}
	else if (validatedQuery == 'yt_video') {
		songInfo = await (await video_basic_info(query)).video_details;

		streamURL = query;
	}
	else {
		embedResponse.setDescription(`${query} cannot be found`);
		await interaction.editReply({ embeds: [embedResponse] });
	}

	if (streamURL == undefined) throw new CommandError('Music Player');

	const streamAudio = await stream(streamURL);
	const resource = createAudioResource(streamAudio.stream, { inputType: streamAudio.type });

	const connection = getVoiceChannelToPlay(voiceChannel);
	let player = connection.player;

	if (player == undefined) {
		player = createAudioPlayer({
			behaviors: {
				noSubscriber: NoSubscriberBehavior.Pause,
			},
		});

		player.songQueue = new Collection();
		player.channel = interaction.channel!;

		connection.player = player;
		attachListeners(player, streamAudio);
		connection.subscribe(player);

		player.on('error', error => {
			console.error(`Error: ${error.message}`);
		});

		player.on(AudioPlayerStatus.Playing, () => {
			console.log('The audio player has started playing!');
		});

		player.on(AudioPlayerStatus.Idle, async () => {
			console.log('The audio player has stopped playing');

			if (player.songQueue.size == 0) return;

			const [nextSong] = player.songQueue.keys();
			const nextStreamAudio = await stream(nextSong);
			const nextResource = createAudioResource(nextStreamAudio.stream, { inputType: nextStreamAudio.type });
			player.play(nextResource);

			const nextSongInfo = player.songQueue.get(nextSong);

			const embedQueue = new EmbedBuilder()
				.setTitle('Music Player')
				.setColor('#8A1E28');

			embedQueue.setDescription(`Playing ${nextSongInfo.title}`)
				.addFields(
					{ name: 'Duration:', value: nextSongInfo.duration, inline: true },
					{ name: 'Queue', value: (player.songQueue.size - 1).toString(), inline: true },
				)
				.setThumbnail(nextSongInfo.thumbnail);

			player.songQueue.delete(nextSong);

			await player.channel.send({ embeds: [embedQueue] });
		});
	}

	if (player.state.status == AudioPlayerStatus.Idle) {
		player.play(resource);

		embedResponse.setDescription(`Playing ${songInfo.title}`)
			.addFields({ name: 'Duration:', value: songInfo.durationRaw })
			.setThumbnail(songInfo.thumbnails[0].url);
	}
	else {
		player.songQueue.set(streamURL, { title: songInfo.title, duration: songInfo.durationRaw, thumbnail: songInfo.thumbnails[0].url });

		embedResponse.setDescription(`Added to queue ${songInfo.title}`)
			.addFields(
				{ name: 'Duration:', value: songInfo.durationRaw, inline: true },
				{ name: 'Position in queue', value: player.songQueue.size.toString(), inline: true },
			)
			.setThumbnail(songInfo.thumbnails[0].url);
	}

	await interaction.editReply({ embeds: [embedResponse] });

}