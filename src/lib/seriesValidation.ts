export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

export interface SeriesFormData {
  title: string;
  description?: string;
  eventType: string;
  skillLevelMin: number;
  skillLevelMax: number;
  pricePerSession: number;
  seriesDiscountPercentage?: number;
  maxParticipantsPerSession: number;
  courtIds: string[];
  defaultStartTime: string;
  defaultEndTime: string;
  allowPartialRegistration: boolean;
  enableWaitlist: boolean;
  registrationDeadlineHours: number;
}

export interface OccurrenceFormData {
  occurrenceDate: string;
  startTime: string;
  endTime: string;
  courtId: string;
  maxParticipants: number;
  customPrice?: number;
}

export function validateSeriesForm(data: Partial<SeriesFormData>): ValidationResult {
  const errors: string[] = [];

  if (!data.title || data.title.trim().length === 0) {
    errors.push('Title is required');
  } else if (data.title.trim().length < 3) {
    errors.push('Title must be at least 3 characters');
  } else if (data.title.trim().length > 100) {
    errors.push('Title must be less than 100 characters');
  }

  if (!data.eventType) {
    errors.push('Event type is required');
  }

  if (data.skillLevelMin !== undefined && data.skillLevelMax !== undefined) {
    if (data.skillLevelMin < 0 || data.skillLevelMin > 7) {
      errors.push('Minimum skill level must be between 0.0 and 7.0');
    }
    if (data.skillLevelMax < 0 || data.skillLevelMax > 7) {
      errors.push('Maximum skill level must be between 0.0 and 7.0');
    }
    if (data.skillLevelMin > data.skillLevelMax) {
      errors.push('Minimum skill level cannot be greater than maximum skill level');
    }
  }

  if (data.pricePerSession !== undefined) {
    if (data.pricePerSession < 0) {
      errors.push('Price per session cannot be negative');
    }
    if (data.pricePerSession > 10000) {
      errors.push('Price per session seems unusually high');
    }
  }

  if (data.seriesDiscountPercentage !== undefined) {
    if (data.seriesDiscountPercentage < 0 || data.seriesDiscountPercentage > 100) {
      errors.push('Discount percentage must be between 0 and 100');
    }
  }

  if (data.maxParticipantsPerSession !== undefined) {
    if (data.maxParticipantsPerSession < 1) {
      errors.push('Maximum participants must be at least 1');
    }
    if (data.maxParticipantsPerSession > 100) {
      errors.push('Maximum participants seems unusually high');
    }
  }

  if (data.courtIds && data.courtIds.length === 0) {
    errors.push('At least one court must be selected');
  }

  if (data.defaultStartTime && data.defaultEndTime) {
    if (!isValidTimeFormat(data.defaultStartTime)) {
      errors.push('Invalid start time format');
    }
    if (!isValidTimeFormat(data.defaultEndTime)) {
      errors.push('Invalid end time format');
    }
    if (data.defaultStartTime >= data.defaultEndTime) {
      errors.push('Start time must be before end time');
    }
  }

  if (data.registrationDeadlineHours !== undefined) {
    if (data.registrationDeadlineHours < 0) {
      errors.push('Registration deadline cannot be negative');
    }
    if (data.registrationDeadlineHours > 168) {
      errors.push('Registration deadline cannot exceed 1 week');
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateOccurrence(data: Partial<OccurrenceFormData>): ValidationResult {
  const errors: string[] = [];

  if (!data.occurrenceDate) {
    errors.push('Occurrence date is required');
  } else {
    const date = new Date(data.occurrenceDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (isNaN(date.getTime())) {
      errors.push('Invalid date format');
    } else if (date < today) {
      errors.push('Occurrence date cannot be in the past');
    }
  }

  if (!data.startTime) {
    errors.push('Start time is required');
  } else if (!isValidTimeFormat(data.startTime)) {
    errors.push('Invalid start time format');
  }

  if (!data.endTime) {
    errors.push('End time is required');
  } else if (!isValidTimeFormat(data.endTime)) {
    errors.push('Invalid end time format');
  }

  if (data.startTime && data.endTime && data.startTime >= data.endTime) {
    errors.push('Start time must be before end time');
  }

  if (!data.courtId) {
    errors.push('Court is required');
  }

  if (data.maxParticipants !== undefined) {
    if (data.maxParticipants < 1) {
      errors.push('Maximum participants must be at least 1');
    }
  }

  if (data.customPrice !== undefined && data.customPrice < 0) {
    errors.push('Custom price cannot be negative');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

export function validateOccurrenceDates(dates: Date[]): ValidationResult {
  const errors: string[] = [];

  if (dates.length === 0) {
    errors.push('At least one occurrence date is required');
  }

  if (dates.length > 100) {
    errors.push('Cannot create more than 100 occurrences at once');
  }

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const pastDates = dates.filter(d => d < today);
  if (pastDates.length > 0) {
    errors.push(`${pastDates.length} date(s) are in the past`);
  }

  const uniqueDates = new Set(dates.map(d => d.toISOString().split('T')[0]));
  if (uniqueDates.size !== dates.length) {
    errors.push('Duplicate dates detected');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
}

function isValidTimeFormat(time: string): boolean {
  const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
  return timeRegex.test(time);
}

export function validateSkillLevel(level: number): boolean {
  return level >= 0 && level <= 7 && Number.isFinite(level);
}

export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

export function sanitizeInput(input: string): string {
  return input.trim().replace(/[<>]/g, '');
}
