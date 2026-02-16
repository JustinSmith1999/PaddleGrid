import { Animated, Easing } from 'react-native';

export const createFadeInAnimation = (
  animatedValue: Animated.Value,
  duration: number = 300,
  delay: number = 0
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 1,
    duration,
    delay,
    easing: Easing.out(Easing.ease),
    useNativeDriver: true,
  });
};

export const createFadeOutAnimation = (
  animatedValue: Animated.Value,
  duration: number = 200
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue: 0,
    duration,
    easing: Easing.in(Easing.ease),
    useNativeDriver: true,
  });
};

export const createScaleAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 150
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 4,
    tension: 100,
    useNativeDriver: true,
  });
};

export const createSlideAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.out(Easing.cubic),
    useNativeDriver: true,
  });
};

export const createPressAnimation = (
  scaleValue: Animated.Value,
  onComplete?: () => void
): void => {
  Animated.sequence([
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      easing: Easing.out(Easing.ease),
      useNativeDriver: true,
    }),
    Animated.timing(scaleValue, {
      toValue: 1,
      duration: 100,
      easing: Easing.in(Easing.ease),
      useNativeDriver: true,
    }),
  ]).start(onComplete);
};

export const createStaggeredFadeIn = (
  items: Animated.Value[],
  staggerDelay: number = 100,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.stagger(
    staggerDelay,
    items.map((item) =>
      Animated.timing(item, {
        toValue: 1,
        duration,
        easing: Easing.out(Easing.ease),
        useNativeDriver: true,
      })
    )
  );
};

export const createBounceAnimation = (
  animatedValue: Animated.Value,
  toValue: number = 1
): Animated.CompositeAnimation => {
  return Animated.spring(animatedValue, {
    toValue,
    friction: 3,
    tension: 40,
    useNativeDriver: true,
  });
};

export const createRotateAnimation = (
  animatedValue: Animated.Value,
  toValue: number,
  duration: number = 300
): Animated.CompositeAnimation => {
  return Animated.timing(animatedValue, {
    toValue,
    duration,
    easing: Easing.linear,
    useNativeDriver: true,
  });
};

export const createShakeAnimation = (
  animatedValue: Animated.Value
): Animated.CompositeAnimation => {
  return Animated.sequence([
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: -10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 10,
      duration: 50,
      useNativeDriver: true,
    }),
    Animated.timing(animatedValue, {
      toValue: 0,
      duration: 50,
      useNativeDriver: true,
    }),
  ]);
};

export const interpolateRotation = (animatedValue: Animated.Value): Animated.AnimatedInterpolation<string | number> => {
  return animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: ['0deg', '360deg'],
  });
};

export const useFadeInOnMount = () => {
  const fadeAnim = new Animated.Value(0);

  React.useEffect(() => {
    createFadeInAnimation(fadeAnim).start();
  }, []);

  return fadeAnim;
};

export const useScaleOnPress = () => {
  const scaleValue = new Animated.Value(1);

  const onPressIn = () => {
    Animated.timing(scaleValue, {
      toValue: 0.95,
      duration: 100,
      useNativeDriver: true,
    }).start();
  };

  const onPressOut = () => {
    Animated.spring(scaleValue, {
      toValue: 1,
      friction: 3,
      tension: 40,
      useNativeDriver: true,
    }).start();
  };

  return { scaleValue, onPressIn, onPressOut };
};

import React from 'react';
