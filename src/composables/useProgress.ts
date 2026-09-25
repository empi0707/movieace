import { useStorage } from '@vueuse/core';
import { ref } from 'vue';
import { isInWatchlist, setWatched } from './useWatchlist';

export interface ProgressEntry {
  watched: number;
  duration: number;
  lastUpdated: number;
  type: 'movie' | 'tv';
  season?: number;
  episode?: number;
  completed?: boolean;
}

interface ProgressMap {
  [key: string]: ProgressEntry;
}

export const watchProgress = useStorage<ProgressMap>('watchProgress', {});

export const isTracking = ref(false);

const TRACKED_ORIGINS: Record<string, string> = {
  'vidlink.pro': 'vidlink',
  'www.vidy.st': 'vidy',
  'cinesrc.st': 'cinesrc',
  'embed.vidrift.net': 'vidrift',
  'player.videasy.net': 'videasy',
  'vidfast.pro': 'vidfast',
  'player.vidlove.cc': 'vidlove',
  'vidcore.io': 'vidcore',
  'vsembed.ru': 'vidsrc',
  'anyembed.xyz': 'anyembed'
};

// These players ignore start-time URL params and only seek when the parent asks.
const RESUME_MESSAGES: Record<string, (seconds: number) => unknown> = {
  vidlove: seconds => ({ type: 'seek', time: seconds }),
  vidrift: seconds => ({ type: 'vidrift:resume', currentTime: seconds })
};

function parseMessage(raw: unknown): Record<string, unknown> | null {
  if (typeof raw === 'object' && raw !== null) return raw as Record<string, unknown>;
  if (typeof raw === 'string') {
    try { return JSON.parse(raw); } catch { return null; }
  }
  return null;
}

function normalizeProgress(
  origin: string,
  data: Record<string, unknown>
): { watched: number; duration: number } | null {
  const source = TRACKED_ORIGINS[origin];
  if (!source) return null;

  switch (source) {
    case 'vidlink': {
      if (data.type === 'MEDIA_DATA') {
        const d = data.data as Record<string, unknown> | undefined;
        if (d) {
          const progress = d.progress as Record<string, number> | undefined;
          if (progress && progress.watched !== undefined && progress.duration !== undefined) {
            return { watched: progress.watched, duration: progress.duration };
          }
        }
      }
      if (data.type === 'PLAYER_EVENT') {
        const d = data.data as Record<string, unknown> | undefined;
        if (d && d.currentTime !== undefined && d.duration !== undefined) {
          return { watched: d.currentTime as number, duration: d.duration as number };
        }
      }
      break;
    }

    case 'vidy': {
      if (data.type === 'PLAYER_EVENT') {
        const d = data.data as Record<string, unknown> | undefined;
        if (d && d.timestamp !== undefined && d.duration !== undefined) {
          return { watched: d.timestamp as number, duration: d.duration as number };
        }
      }
      break;
    }

    case 'vidrift': {
      if (data.type === 'vidrift:progress' && data.currentTime !== undefined && data.duration !== undefined) {
        return { watched: data.currentTime as number, duration: data.duration as number };
      }
      break;
    }

    case 'cinesrc': {
      if (data.type === 'cinesrc:timeupdate' && data.currentTime !== undefined && data.duration !== undefined) {
        return { watched: data.currentTime as number, duration: data.duration as number };
      }
      break;
    }

    case 'videasy': {
      if (data.type === 'MEDIA_DATA') {
        const d = data.data as Record<string, unknown> | undefined;
        if (d) {
          const progress = d.progress as Record<string, number> | undefined;
          if (progress && progress.watched !== undefined && progress.duration !== undefined) {
            return { watched: progress.watched, duration: progress.duration };
          }
        }
      }
      break;
    }

    case 'vidfast': {
      if (data.type === 'MEDIA_DATA') {
        const d = data.data as Record<string, unknown> | undefined;
        if (d) {
          const progress = d.progress as Record<string, number> | undefined;
          if (progress && progress.watched !== undefined && progress.duration !== undefined) {
            return { watched: progress.watched, duration: progress.duration };
          }
        }
      }
      break;
    }

    case 'vidlove':
    case 'vidcore': {
      if (data.type === 'PLAYER_EVENT') {
        const d = data.data as Record<string, unknown> | undefined;
        if (d && d.event === 'timeupdate' && d.currentTime !== undefined && d.duration !== undefined) {
          return { watched: d.currentTime as number, duration: d.duration as number };
        }
      }
      break;
    }

    case 'vidsrc': {
      if (data.event === 'time') {
        const time = data.data as number | undefined;
        const duration = data.duration as number | undefined;
        if (time !== undefined && duration !== undefined && duration > 0) {
          return { watched: time, duration };
        }
      }
      break;
    }

    case 'anyembed': {
      if (data.type === 'PLAYER_EVENT') {
        const d = data.data as Record<string, unknown> | undefined;
        if (d && d.event === 'timeupdate' && d.currentTime !== undefined && d.duration !== undefined) {
          return { watched: d.currentTime as number, duration: d.duration as number };
        }
      }
      break;
    }
  }

  return null;
}

function buildKey(
  mediaId: string | number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): string {
  if (type === 'tv' && season && episode) {
    return `${mediaId}:tv:s${season}e${episode}`;
  }
  return `${mediaId}:${type}`;
}

export function saveProgress(
  mediaId: string | number,
  type: 'movie' | 'tv',
  watched: number,
  duration: number,
  season?: number,
  episode?: number
): void {
  if (duration <= 0 || watched < 0) return;

  const key = buildKey(mediaId, type, season, episode);
  const completed = (watched / duration) * 100 >= 95;

  if (completed && isInWatchlist(mediaId, type)) {
    setWatched(mediaId, type, true);
  }

  watchProgress.value[key] = {
    watched,
    duration,
    lastUpdated: Date.now(),
    type,
    season,
    episode,
    completed
  };
}

export function getProgress(
  mediaId: string | number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): ProgressEntry | null {
  const key = buildKey(mediaId, type, season, episode);
  return watchProgress.value[key] || null;
}

export function getProgressPercent(
  mediaId: string | number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): number {
  const entry = getProgress(mediaId, type, season, episode);
  if (!entry || entry.duration <= 0) return 0;
  return Math.min(Math.round((entry.watched / entry.duration) * 100), 100);
}

export function getResumeTimestamp(
  mediaId: string | number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): number {
  const entry = getProgress(mediaId, type, season, episode);
  if (!entry || entry.duration <= 0) return 0;
  const percent = (entry.watched / entry.duration) * 100;
  if (percent >= 95) return 0;
  return Math.floor(entry.watched);
}

export function getAllProgress(): ProgressMap {
  return watchProgress.value;
}

export type TitleProgress = ProgressEntry & { mediaId: string };

export function listProgress(): TitleProgress[] {
  return Object.entries(watchProgress.value).map(([key, entry]) => ({
    ...entry,
    mediaId: key.split(':')[0]
  }));
}

export function startProgressTracking(
  mediaId: string | number,
  type: 'movie' | 'tv',
  season?: number,
  episode?: number
): () => void {
  isTracking.value = true;

  const resumeAt = getResumeTimestamp(mediaId, type, season, episode);
  let resumePending = resumeAt > 0;

  const handler = (event: MessageEvent) => {
    const origin = event.origin?.replace(/^https?:\/\//, '') || '';
    if (!TRACKED_ORIGINS[origin]) return;

    const data = parseMessage(event.data);
    if (!data) return;

    const progress = normalizeProgress(origin, data);
    if (!progress) return;

    // Seek on the first progress report, when the player is known to be listening,
    // and skip saving that pre-seek position so it doesn't overwrite the resume point.
    const resumeMessage = RESUME_MESSAGES[TRACKED_ORIGINS[origin]];
    if (resumePending && resumeMessage) {
      resumePending = false;
      (event.source as Window | null)?.postMessage(resumeMessage(resumeAt), event.origin);
      return;
    }

    saveProgress(mediaId, type, progress.watched, progress.duration, season, episode);
  };

  window.addEventListener('message', handler);

  return () => {
    window.removeEventListener('message', handler);
    isTracking.value = false;
  };
}

export function useProgress() {
  return {
    watchProgress,
    isTracking,
    saveProgress,
    getProgress,
    getProgressPercent,
    getResumeTimestamp,
    getAllProgress,
    startProgressTracking
  };
}
