import React, { useState } from 'react';
import { View, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native';
import { Image, ImageContentFit, ImageTransition } from 'expo-image';
import { Ionicons } from '@expo/vector-icons';

interface OptimizedImageProps {
  source: string | { uri: string } | number;
  style?: ViewStyle | ViewStyle[];
  contentFit?: ImageContentFit;
  placeholder?: string;
  transition?: number | ImageTransition;
  cachePolicy?: 'memory' | 'disk' | 'memory-disk' | 'none';
  priority?: 'low' | 'normal' | 'high';
  recyclingKey?: string;
  alt?: string;
}

export const OptimizedImage: React.FC<OptimizedImageProps> = ({
  source,
  style,
  contentFit = 'cover',
  placeholder,
  transition = 200,
  cachePolicy = 'memory-disk',
  priority = 'normal',
  recyclingKey,
  alt,
}) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(false);

  const imageSource = typeof source === 'string' ? { uri: source } : source;

  const handleLoadStart = () => {
    setLoading(true);
    setError(false);
  };

  const handleLoadEnd = () => {
    setLoading(false);
  };

  const handleError = () => {
    setLoading(false);
    setError(true);
  };

  if (error) {
    return (
      <View style={[styles.container, style, styles.errorContainer]}>
        <Ionicons name="image-outline" size={32} color="#9CA3AF" />
      </View>
    );
  }

  return (
    <View style={[styles.container, style]}>
      <Image
        source={imageSource}
        style={[StyleSheet.absoluteFill]}
        contentFit={contentFit}
        placeholder={placeholder}
        transition={transition}
        cachePolicy={cachePolicy}
        priority={priority}
        recyclingKey={recyclingKey}
        accessible={true}
        accessibilityLabel={alt || 'Image'}
        onLoadStart={handleLoadStart}
        onLoadEnd={handleLoadEnd}
        onError={handleError}
      />
      {loading && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="small" color="#10B981" />
        </View>
      )}
    </View>
  );
};

export const AvatarImage: React.FC<{
  source?: string | null;
  size?: number;
  fallbackIcon?: keyof typeof Ionicons.glyphMap;
}> = ({ source, size = 40, fallbackIcon = 'person' }) => {
  const [imageError, setImageError] = useState(false);

  if (!source || imageError) {
    return (
      <View style={[styles.avatarFallback, { width: size, height: size, borderRadius: size / 2 }]}>
        <Ionicons name={fallbackIcon} size={size * 0.5} color="#fff" />
      </View>
    );
  }

  return (
    <OptimizedImage
      source={source}
      style={{ width: size, height: size, borderRadius: size / 2 }}
      contentFit="cover"
      cachePolicy="memory-disk"
      priority="normal"
      alt="Profile picture"
    />
  );
};

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#F3F4F6',
  },
  errorContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#F9FAFB',
  },
  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  avatarFallback: {
    backgroundColor: '#10B981',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
