import type { Video } from './types';

const ABSOLUTE_SRC = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

export function resolvePublicAssetSrc(src: string | null | undefined): string | null {
  if (!src) return null;
  if (ABSOLUTE_SRC.test(src)) return src;

  const normalized = src.replace(/\\/g, '/');
  const withoutPublic = normalized.replace(/^\/?public\//, '');
  const withoutDotSlash = withoutPublic.replace(/^\.\//, '');
  const publicRelative = withoutDotSlash.startsWith('../out/')
    ? withoutDotSlash.replace(/^\.\.\//, '')
    : withoutDotSlash.replace(/^\/+/, '');

  return `/${publicRelative}`;
}

export function resolveVideoSrc(
  video: Pick<Video, 'videoUrl' | 'stage' | 'filename' | 'demosPath'>,
): string | null {
  if (video.videoUrl) return resolvePublicAssetSrc(video.videoUrl);
  if (video.stage === 'wip') return resolvePublicAssetSrc(`wip/${video.filename}`);
  return resolvePublicAssetSrc(video.demosPath);
}
