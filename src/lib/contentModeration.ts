const INAPPROPRIATE_TERMS = [
  // Explicit content
  'porn', 'xxx', 'nsfw', 'nude', 'naked', 'sex', 'sexual', 'explicit',
  // Slurs (racial)
  'nigger', 'nigga', 'chink', 'gook', 'wetback', 'spic', 'beaner',
  // Slurs (sexual orientation)
  'faggot', 'fag', 'dyke', 'tranny',
  // Slurs (religious)
  'kike', 'raghead',
  // Slurs (general)
  'retard', 'retarded',
  // Other inappropriate
  'fuck', 'shit', 'bitch', 'ass', 'dick', 'cock', 'pussy', 'cunt', 'whore', 'slut'
];

const PATTERN_VARIATIONS: Record<string, RegExp[]> = {
  letterSpacing: /(\w)\s+(\w)/g,
  specialChars: /[^a-z0-9\s]/gi,
  repeatedChars: /(.)\1{2,}/g,
  leet: /[0@]/g
};

function normalizeText(text: string): string {
  let normalized = text.toLowerCase();

  normalized = normalized.replace(PATTERN_VARIATIONS.letterSpacing, '$1$2');
  normalized = normalized.replace(PATTERN_VARIATIONS.specialChars, '');
  normalized = normalized.replace(PATTERN_VARIATIONS.repeatedChars, '$1');
  normalized = normalized.replace(/0/g, 'o').replace(/@/g, 'a');

  return normalized;
}

export interface ModerationResult {
  isClean: boolean;
  reason?: string;
  flaggedTerms?: string[];
}

export function moderateContent(content: string): ModerationResult {
  if (!content || content.trim().length === 0) {
    return { isClean: true };
  }

  const normalized = normalizeText(content);
  const words = normalized.split(/\s+/);
  const flaggedTerms: string[] = [];

  for (const term of INAPPROPRIATE_TERMS) {
    const regex = new RegExp(`\\b${term}\\b`, 'i');

    if (regex.test(normalized)) {
      flaggedTerms.push(term);
    }

    for (const word of words) {
      if (word.includes(term) || term.includes(word)) {
        if (word.length > 2 && term.length > 2) {
          const similarity = calculateSimilarity(word, term);
          if (similarity > 0.8) {
            flaggedTerms.push(term);
          }
        }
      }
    }
  }

  if (flaggedTerms.length > 0) {
    return {
      isClean: false,
      reason: 'Your post contains inappropriate language or content that violates our community guidelines.',
      flaggedTerms: [...new Set(flaggedTerms)]
    };
  }

  return { isClean: true };
}

function calculateSimilarity(str1: string, str2: string): number {
  const longer = str1.length > str2.length ? str1 : str2;
  const shorter = str1.length > str2.length ? str2 : str1;

  if (longer.length === 0) {
    return 1.0;
  }

  const editDistance = levenshteinDistance(longer, shorter);
  return (longer.length - editDistance) / longer.length;
}

function levenshteinDistance(str1: string, str2: string): number {
  const matrix: number[][] = [];

  for (let i = 0; i <= str2.length; i++) {
    matrix[i] = [i];
  }

  for (let j = 0; j <= str1.length; j++) {
    matrix[0][j] = j;
  }

  for (let i = 1; i <= str2.length; i++) {
    for (let j = 1; j <= str1.length; j++) {
      if (str2.charAt(i - 1) === str1.charAt(j - 1)) {
        matrix[i][j] = matrix[i - 1][j - 1];
      } else {
        matrix[i][j] = Math.min(
          matrix[i - 1][j - 1] + 1,
          matrix[i][j - 1] + 1,
          matrix[i - 1][j] + 1
        );
      }
    }
  }

  return matrix[str2.length][str1.length];
}
