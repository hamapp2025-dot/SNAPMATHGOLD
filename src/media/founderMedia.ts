import type { ImageSourcePropType } from 'react-native';

import { runtimeConfig } from '../config/runtimeConfig';

export type AppVideoSource = number | { uri: string };

type FounderMediaSource = {
  founderImage: ImageSourcePropType | null;
  introVideo: AppVideoSource | null;
  welcomeVideo: AppVideoSource | null;
  welcomePoster: ImageSourcePropType | null;
};

const LOCAL_FOUNDER_MEDIA: FounderMediaSource = {
  founderImage: require('../../assets/media/founder/founder-portrait.jpg'),
  introVideo: require('../../assets/media/founder/founder-intro-v3.mp4'),
  welcomeVideo: require('../../assets/media/founder/founder-welcome.mp4'),
  welcomePoster: require('../../assets/media/founder/founder-welcome-poster-v3.jpg'),
};

function toRemoteVideoSource(url: string | null): AppVideoSource | null {
  return url ? { uri: url } : null;
}

function toRemoteImageSource(url: string | null): ImageSourcePropType | null {
  return url ? { uri: url } : null;
}

const introVideoSource = LOCAL_FOUNDER_MEDIA.introVideo ?? toRemoteVideoSource(runtimeConfig.introVideoUrl);
const founderImageSource = LOCAL_FOUNDER_MEDIA.founderImage ?? toRemoteImageSource(runtimeConfig.founderImageUrl);
const welcomePosterSource = LOCAL_FOUNDER_MEDIA.welcomePoster;
const welcomeVideoSource =
  LOCAL_FOUNDER_MEDIA.welcomeVideo ??
  toRemoteVideoSource(runtimeConfig.welcomeVideoUrl) ??
  introVideoSource;

export const founderMedia = {
  founderImageSource,
  introVideoSource,
  welcomeVideoSource,
  welcomePosterSource,
  usingSampleFounderImage: !founderImageSource,
  usingSampleIntroVideo: !introVideoSource,
  usingSampleWelcomeVideo: !welcomeVideoSource,
};
