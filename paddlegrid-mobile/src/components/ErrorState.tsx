/**
 * Error state component with retry functionality
 */

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { AppError, ErrorType } from '../utils/errors';
import { buttonPress } from '../utils/haptics';

interface ErrorStateProps {
  error: AppError;
  onRetry?: () => void;
  onDismiss?: () => void;
}

export const ErrorState: React.FC<ErrorStateProps> = ({ error, onRetry, onDismiss }) => {
  const getIconName = (): keyof typeof Ionicons.glyphMap => {
    switch (error.type) {
      case ErrorType.Network:
        return 'cloud-offline-outline';
      case ErrorType.Server:
        return 'server-outline';
      case ErrorType.Timeout:
        return 'time-outline';
      case ErrorType.Authentication:
        return 'lock-closed-outline';
      case ErrorType.Permission:
        return 'shield-checkmark-outline';
      case ErrorType.NotFound:
        return 'search-outline';
      default:
        return 'alert-circle-outline';
    }
  };

  const handleRetry = () => {
    buttonPress();
    onRetry?.();
  };

  const handleDismiss = () => {
    buttonPress();
    onDismiss?.();
  };

  return (
    <View style={styles.container}>
      <Ionicons name={getIconName()} size={64} color="#9CA3AF" />
      <Text style={styles.message}>{error.message}</Text>

      {error.retryable && onRetry && (
        <TouchableOpacity
          style={styles.retryButton}
          onPress={handleRetry}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={20} color="#fff" />
          <Text style={styles.retryButtonText}>Try Again</Text>
        </TouchableOpacity>
      )}

      {onDismiss && (
        <TouchableOpacity
          style={styles.dismissButton}
          onPress={handleDismiss}
          activeOpacity={0.7}
        >
          <Text style={styles.dismissButtonText}>Dismiss</Text>
        </TouchableOpacity>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
    backgroundColor: '#F9FAFB',
  },
  message: {
    fontSize: 16,
    color: '#6B7280',
    textAlign: 'center',
    marginTop: 16,
    marginBottom: 24,
    lineHeight: 24,
  },
  retryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#10B981',
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 8,
    marginBottom: 12,
  },
  retryButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '600',
    marginLeft: 8,
  },
  dismissButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
  },
  dismissButtonText: {
    color: '#6B7280',
    fontSize: 14,
    fontWeight: '500',
  },
});
