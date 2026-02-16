/**
 * Loading skeleton components for smooth loading states
 */

import React, { useEffect, useRef } from 'react';
import { View, Animated, StyleSheet } from 'react-native';

interface SkeletonProps {
  width?: number | string;
  height?: number;
  borderRadius?: number;
  style?: any;
}

export const SkeletonBox: React.FC<SkeletonProps> = ({
  width = '100%',
  height = 20,
  borderRadius = 4,
  style,
}) => {
  const opacity = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, {
          toValue: 1,
          duration: 800,
          useNativeDriver: true,
        }),
        Animated.timing(opacity, {
          toValue: 0.3,
          duration: 800,
          useNativeDriver: true,
        }),
      ])
    ).start();
  }, []);

  return (
    <Animated.View
      style={[
        styles.skeleton,
        {
          width,
          height,
          borderRadius,
          opacity,
        },
        style,
      ]}
    />
  );
};

export const PostCardSkeleton: React.FC = () => {
  return (
    <View style={styles.postCard}>
      <View style={styles.postHeader}>
        <SkeletonBox width={40} height={40} borderRadius={20} />
        <View style={styles.postHeaderText}>
          <SkeletonBox width="60%" height={16} />
          <SkeletonBox width="40%" height={12} style={{ marginTop: 4 }} />
        </View>
      </View>
      <SkeletonBox width="100%" height={200} style={{ marginTop: 12 }} />
      <View style={styles.postActions}>
        <SkeletonBox width={60} height={20} />
        <SkeletonBox width={60} height={20} />
        <SkeletonBox width={60} height={20} />
      </View>
    </View>
  );
};

export const BookingCardSkeleton: React.FC = () => {
  return (
    <View style={styles.bookingCard}>
      <View style={styles.bookingHeader}>
        <SkeletonBox width="70%" height={18} />
        <SkeletonBox width={80} height={24} borderRadius={12} />
      </View>
      <SkeletonBox width="50%" height={14} style={{ marginTop: 8 }} />
      <SkeletonBox width="40%" height={14} style={{ marginTop: 4 }} />
    </View>
  );
};

export const ClubCardSkeleton: React.FC = () => {
  return (
    <View style={styles.clubCard}>
      <SkeletonBox width="100%" height={120} borderRadius={8} />
      <SkeletonBox width="80%" height={18} style={{ marginTop: 12 }} />
      <SkeletonBox width="60%" height={14} style={{ marginTop: 4 }} />
      <View style={styles.clubCardFooter}>
        <SkeletonBox width={100} height={14} />
        <SkeletonBox width={80} height={14} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  skeleton: {
    backgroundColor: '#E1E9EE',
  },
  postCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  postHeader: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  postHeaderText: {
    marginLeft: 12,
    flex: 1,
  },
  postActions: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginTop: 12,
  },
  bookingCard: {
    backgroundColor: '#fff',
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 2,
  },
  bookingHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  clubCard: {
    backgroundColor: '#fff',
    borderRadius: 12,
    padding: 12,
    marginHorizontal: 16,
    marginVertical: 8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 3,
  },
  clubCardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: 8,
  },
});
