import { Dimensions, Platform, PixelRatio } from 'react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const scale = SCREEN_WIDTH / 375;
const verticalScale = SCREEN_HEIGHT / 667;

export const isTablet = () => {
  const pixelDensity = PixelRatio.get();
  const adjustedWidth = SCREEN_WIDTH * pixelDensity;
  const adjustedHeight = SCREEN_HEIGHT * pixelDensity;

  if (pixelDensity < 2 && (adjustedWidth >= 1000 || adjustedHeight >= 1000)) {
    return true;
  }

  return (
    (SCREEN_WIDTH >= 768 && SCREEN_HEIGHT >= 1024) ||
    (SCREEN_WIDTH >= 1024 && SCREEN_HEIGHT >= 768)
  );
};

export const isSmallDevice = () => {
  return SCREEN_WIDTH < 375 || SCREEN_HEIGHT < 667;
};

export const moderateScale = (size: number, factor = 0.5) => {
  return size + (scale - 1) * factor * size;
};

export const normalize = (size: number) => {
  const newSize = size * scale;
  if (Platform.OS === 'ios') {
    return Math.round(PixelRatio.roundToNearestPixel(newSize));
  }
  return Math.round(PixelRatio.roundToNearestPixel(newSize)) - 2;
};

export const wp = (percentage: number) => {
  return (percentage * SCREEN_WIDTH) / 100;
};

export const hp = (percentage: number) => {
  return (percentage * SCREEN_HEIGHT) / 100;
};

export const responsiveFontSize = (size: number) => {
  if (isTablet()) {
    return size * 1.2;
  }
  if (isSmallDevice()) {
    return size * 0.9;
  }
  return normalize(size);
};

export const responsiveHeight = (size: number) => {
  return verticalScale * size;
};

export const responsiveWidth = (size: number) => {
  return scale * size;
};

export const getResponsiveSpacing = () => {
  if (isTablet()) {
    return {
      xs: 6,
      sm: 12,
      md: 20,
      lg: 32,
      xl: 48,
    };
  }
  if (isSmallDevice()) {
    return {
      xs: 4,
      sm: 8,
      md: 12,
      lg: 16,
      xl: 24,
    };
  }
  return {
    xs: 4,
    sm: 8,
    md: 16,
    lg: 24,
    xl: 32,
  };
};

export const spacing = getResponsiveSpacing();

export const deviceInfo = {
  width: SCREEN_WIDTH,
  height: SCREEN_HEIGHT,
  isTablet: isTablet(),
  isSmallDevice: isSmallDevice(),
};

export const getResponsiveCardWidth = () => {
  if (isTablet()) {
    return wp(45);
  }
  return wp(90);
};

export const getResponsiveAvatarSize = () => {
  if (isTablet()) {
    return {
      small: 60,
      medium: 80,
      large: 140,
    };
  }
  if (isSmallDevice()) {
    return {
      small: 32,
      medium: 48,
      large: 80,
    };
  }
  return {
    small: 40,
    medium: 60,
    large: 100,
  };
};
