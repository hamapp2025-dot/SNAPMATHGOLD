import React, { useMemo, useState } from 'react';
import { ActivityIndicator, StyleSheet, View } from 'react-native';
import { WebView } from 'react-native-webview';

type CloudflareStreamPlayerProps = {
  streamId: string;
  accountHash?: string;
  autoplay?: boolean;
  muted?: boolean;
  poster?: string;
};

/**
 * Streams a lesson video from Cloudflare Stream.
 * Set accountHash via EXPO_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE or pass directly.
 */
export default function CloudflareStreamPlayer({
  streamId,
  accountHash = (process.env.EXPO_PUBLIC_CLOUDFLARE_STREAM_CUSTOMER_CODE ?? '').trim(),
  autoplay = false,
  muted = false,
  poster,
}: CloudflareStreamPlayerProps) {
  const [loading, setLoading] = useState(true);

  const embedUrl = useMemo(() => {
    if (!streamId || !accountHash) return null;
    const params = new URLSearchParams({
      autoplay: autoplay ? 'true' : 'false',
      muted: muted ? 'true' : 'false',
      preload: 'metadata',
    });
    if (poster) params.set('poster', poster);
    return `https://customer-${accountHash}.cloudflarestream.com/${streamId}/iframe?${params.toString()}`;
  }, [accountHash, autoplay, muted, poster, streamId]);

  if (!embedUrl) {
    return null;
  }

  return (
    <View style={styles.wrap}>
      {loading ? (
        <View style={styles.loader}>
          <ActivityIndicator color="#C9A84C" />
        </View>
      ) : null}
      <WebView
        source={{ uri: embedUrl }}
        style={styles.webview}
        allowsInlineMediaPlayback
        mediaPlaybackRequiresUserAction={!autoplay}
        onLoadEnd={() => setLoading(false)}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 16,
    overflow: 'hidden',
    backgroundColor: '#0B0B0B',
  },
  webview: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  loader: {
    ...StyleSheet.absoluteFillObject,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0B0B0B',
  },
});
