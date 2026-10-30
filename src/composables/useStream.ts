import { useStorage } from "@vueuse/core";
import { ref } from "vue";
import { PRIMARY_COLOR } from '../config/brand';

interface MovieServer {
  serverIndex: number;
  type: 'movie' | 'tv';
  season: number;
  episode: number;
}

interface StreamData {
  movieServerMap: Record<string, MovieServer>;
}

export interface Server {
  name: string;
  urlTemplate: string;
}

const defaultStreamData: StreamData = {
  movieServerMap: {}
};

export const streamData = useStorage<StreamData>('streamData', defaultStreamData);

export const movieServers = ref<Server[]>([
  { name: 'VidSrcMe', urlTemplate: 'https://vidsrc.sh/embed/movie/{tmdbId}' },
  { name: 'Vidy', urlTemplate: 'https://www.vidy.st/movie/{tmdbId}?color=ff5a1f&autoplay=true' },
  { name: 'VidEasy', urlTemplate: 'https://player.videasy.net/movie/{tmdbId}?color=#4eb5ff' },
  { name: 'Cinemaos', urlTemplate: 'https://cinemaos.tech/player/{tmdbId}' },
  { name: 'VidSrc RU', urlTemplate: 'https://vidsrc-embed.ru/embed/movie/{tmdbId}' },
  { name: 'VidSrc SU', urlTemplate: 'https://vidsrc-embed.su/embed/movie/{tmdbId}' },
  { name: 'MultiEmbed', urlTemplate: 'https://multiembed.mov/?video_id={tmdbId}&tmdb=1' },
  { name: 'Rive', urlTemplate: 'https://www.rivestream.app/embed?type=movie&id={tmdbId}' },
  { name: 'VidLink', urlTemplate: 'https://vidlink.pro/movie/{tmdbId}' },
  { name: 'Vidrift', urlTemplate: 'https://embed.vidrift.net/embed/movie/{tmdbId}' },
  { name: 'VidFast', urlTemplate: 'https://vidfast.pro/movie/{tmdbId}' },
  { name: '111Movies', urlTemplate: 'https://player.vidlove.cc/embed/movie/{tmdbId}' },
  { name: 'CineSrc', urlTemplate: 'https://cinesrc.st/embed/movie/{tmdbId}?color=%23ff5a1f' },
  { name: 'Vidcore', urlTemplate: 'https://vidcore.io/movie/{tmdbId}?autoPlay=true&theme=ff5a1f' }
]);

export const tvServers = ref<Server[]>([
  { name: 'VidSrcMe', urlTemplate: 'https://vidsrc.sh/embed/tv/{externalId}/{season}/{episode}' },
  { name: 'Vidy', urlTemplate: 'https://www.vidy.st/tv/{externalId}/{season}/{episode}?color=ff5a1f&autoplay=true&nextEpisode=true&episodeSelector=true&autoplayNextEpisode=true' },
  { name: 'VidEasy', urlTemplate: 'https://player.videasy.net/tv/{externalId}/{season}/{episode}?color=#4eb5ff&nextEpisode=true&autoplayNextEpisode=true&episodeSelector=true' },
  { name: 'Cinemaos', urlTemplate: 'https://cinemaos.tech/player/{externalId}/{season}/{episode}' },
  { name: 'VidSrc RU', urlTemplate: 'https://vidsrc-embed.ru/embed/tv/{externalId}/{season}/{episode}' },
  { name: 'VidSrc SU', urlTemplate: 'https://vidsrc-embed.su/embed/tv/{externalId}/{season}/{episode}' },
  { name: 'MultiEmbed', urlTemplate: 'https://multiembed.mov/?video_id={externalId}&tmdb=1&s={season}&e={episode}' },
  { name: 'Rive', urlTemplate: 'https://www.rivestream.app/embed?type=tv&id={externalId}&season={season}&episode={episode}' },
  { name: 'Vidlink', urlTemplate: 'https://vidlink.pro/tv/{externalId}/{season}/{episode}' },
  { name: 'Vidrift', urlTemplate: 'https://embed.vidrift.net/embed/tv/{externalId}/{season}/{episode}' },
  { name: 'VidFast', urlTemplate: 'https://vidfast.pro/tv/{externalId}/{season}/{episode}' },
  { name: '111Movies', urlTemplate: 'https://player.vidlove.cc/embed/tv/{externalId}/{season}/{episode}' },
  { name: 'CineSrc', urlTemplate: 'https://cinesrc.st/embed/tv/{externalId}?s={season}&e={episode}&color=%23ff5a1f' },
  { name: 'Vidcore', urlTemplate: 'https://vidcore.io/tv/{externalId}/{season}/{episode}?autoPlay=true&theme=ff5a1f&nextButton=true&autoNext=true' }
]);

export const currentStreamData = ref({
  currentStreamId: 0,
  currentServer: 0,
  currentType: 'movie' as 'movie' | 'tv',
  currentSeason: 0,
  currentEpisode: 0
});

export function getPreferredStreamData(mediaId: number | string, type: 'movie' | 'tv' = 'movie'): MovieServer | null {
  const id = String(mediaId);

  if (!id) {
    console.warn('Invalid media ID provided');
    return null;
  }

  const savedData = streamData.value.movieServerMap[id];

  if (savedData) {
    currentStreamData.value = {
      currentStreamId: Number(id),
      currentServer: savedData.serverIndex,
      currentType: savedData.type,
      currentSeason: savedData.season,
      currentEpisode: savedData.episode
    };
    return savedData;
  }

  currentStreamData.value = {
    currentStreamId: Number(id),
    currentServer: 0,
    currentType: type,
    currentSeason: type === 'tv' ? 1 : 0,
    currentEpisode: type === 'tv' ? 1 : 0
  };

  return null;
}

export function savePreferredServer(mediaId: string | number, serverIndex: number, type: 'movie' | 'tv' = 'movie'): void {
  if (serverIndex < 0 || serverIndex >= (type === 'movie' ? movieServers.value : tvServers.value).length) {
    console.warn('Invalid server index');
    return;
  }

  const id = String(mediaId);

  streamData.value.movieServerMap[id] = {
    serverIndex,
    type,
    season: type === 'tv' ? (streamData.value.movieServerMap[id]?.season || 1) : 0,
    episode: type === 'tv' ? (streamData.value.movieServerMap[id]?.episode || 1) : 0
  };

  currentStreamData.value.currentServer = serverIndex;
  currentStreamData.value.currentType = type;
}

export function saveLastWatchedMetaData(
  mediaId: string | number,
  type: 'movie' | 'tv',
  meta: {
    season: number;
    episode: number;
  }
): void {
  if (type === 'tv' && (meta.season < 1 || meta.episode < 1)) {
    console.warn('Invalid season or episode number');
    return;
  }

  const id = String(mediaId);

  streamData.value.movieServerMap[id] = {
    serverIndex: streamData.value.movieServerMap[id]?.serverIndex || 0,
    type,
    season: meta.season,
    episode: meta.episode
  };

  currentStreamData.value.currentType = type;
  currentStreamData.value.currentSeason = meta.season;
  currentStreamData.value.currentEpisode = meta.episode;
}

export function getLastWatchedMetaData(mediaId: string | number): MovieServer | null {
  const id = String(mediaId);
  return streamData.value.movieServerMap[id] || null;
}

export function getServers(type: 'movie' | 'tv' = 'movie'): Server[] {
  return type === 'movie' ? movieServers.value : tvServers.value;
}

export function buildStreamUrl(
  mediaId: string | number,
  type: 'movie' | 'tv' = 'movie',
  serverIndex: number = 0,
  season: number = 1,
  episode: number = 1,
  timestamp?: number
): string {
  const id = String(mediaId);
  const servers = getServers(type);

  if (serverIndex < 0 || serverIndex >= servers.length) {
    console.warn('Invalid server index, using default');
    serverIndex = 0;
  }

  const server = servers[serverIndex] || servers[0];
  let url: string;

  if (type === 'movie') {
    url = server.urlTemplate.replace('{tmdbId}', id);
  } else {
    url = server.urlTemplate
      .replace('{externalId}', id)
      .replace('{season}', String(Math.max(1, season)))
      .replace('{episode}', String(Math.max(1, episode)));
  }

  url = url.replace('{primaryColor}', PRIMARY_COLOR.value.slice(1));

  // Add timestamp parameter for sync functionality
  if (timestamp !== undefined && timestamp > 0) {
    const timestampSeconds = Math.floor(timestamp);
    const serverName = server.name.toLowerCase();

    // Different servers use different timestamp parameters
    if (serverName === 'vidy') {
      // Vidy uses 'progress' parameter
      const separator = url.includes('?') ? '&' : '?';
      url += `${separator}progress=${timestampSeconds}`;
    } else if (serverName === 'cinesrc') {
      url += `&t=${timestampSeconds}`;
    } else if (serverName === 'vidcore') {
      url += `&startAt=${timestampSeconds}`;
    } else if (serverName.includes('vidlink') || serverName.includes('vidfast')) {
      url += `?startAt=${timestampSeconds}`;
    }
  }

  return url;
}
