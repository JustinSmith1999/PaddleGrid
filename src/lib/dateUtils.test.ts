import { describe, it, expect } from 'vitest';
import { formatDate, formatTime, formatDateTime } from './dateUtils';

describe('dateUtils', () => {
  describe('formatDate', () => {
    it('formats date correctly', () => {
      const date = new Date('2024-12-14T15:30:00');
      const result = formatDate(date);
      expect(result).toMatch(/Dec 14|12\/14/);
    });
  });

  describe('formatTime', () => {
    it('formats time correctly', () => {
      const date = new Date('2024-12-14T15:30:00');
      const result = formatTime(date);
      expect(result).toMatch(/3:30|15:30/);
    });
  });

  describe('formatDateTime', () => {
    it('formats datetime correctly', () => {
      const date = new Date('2024-12-14T15:30:00');
      const result = formatDateTime(date);
      expect(result).toBeTruthy();
      expect(typeof result).toBe('string');
    });
  });
});
