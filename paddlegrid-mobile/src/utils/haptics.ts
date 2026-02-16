/**
 * Cross-platform haptic feedback utility
 * Provides consistent haptic feedback for iOS and Android
 */

import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

export enum HapticFeedbackType {
  Light = 'light',
  Medium = 'medium',
  Heavy = 'heavy',
  Success = 'success',
  Warning = 'warning',
  Error = 'error',
  Selection = 'selection',
}

/**
 * Trigger haptic feedback
 * Works on both iOS and Android with appropriate fallbacks
 */
export const triggerHaptic = async (type: HapticFeedbackType = HapticFeedbackType.Light): Promise<void> => {
  try {
    switch (type) {
      case HapticFeedbackType.Light:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        break;
      case HapticFeedbackType.Medium:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
        break;
      case HapticFeedbackType.Heavy:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
        break;
      case HapticFeedbackType.Success:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
        break;
      case HapticFeedbackType.Warning:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
        break;
      case HapticFeedbackType.Error:
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        break;
      case HapticFeedbackType.Selection:
        await Haptics.selectionAsync();
        break;
      default:
        await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    }
  } catch (error) {
    // Haptics may not be supported on all devices, fail silently
    if (__DEV__) {
      console.warn('Haptic feedback not supported:', error);
    }
  }
};

/**
 * Haptic feedback for button presses
 */
export const buttonPress = () => triggerHaptic(HapticFeedbackType.Light);

/**
 * Haptic feedback for selection changes (tabs, segmented controls)
 */
export const selectionChange = () => triggerHaptic(HapticFeedbackType.Selection);

/**
 * Haptic feedback for successful actions
 */
export const actionSuccess = () => triggerHaptic(HapticFeedbackType.Success);

/**
 * Haptic feedback for errors
 */
export const actionError = () => triggerHaptic(HapticFeedbackType.Error);

/**
 * Haptic feedback for warnings
 */
export const actionWarning = () => triggerHaptic(HapticFeedbackType.Warning);

/**
 * Haptic feedback for navigation transitions
 */
export const navigationTransition = () => triggerHaptic(HapticFeedbackType.Light);
