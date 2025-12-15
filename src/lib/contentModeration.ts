const INAPPROPRIATE_TERMS = [
  // Explicit content
  'porn', 'pornography', 'xxx', 'nsfw', 'nude', 'nudes', 'naked', 'sex', 'sexual', 'explicit',
  'hentai', 'erotic', 'adult', 'cam', 'onlyfans', 'escort', 'hooker', 'prostitute',
  // Slurs (racial) - including common variations
  'nigger', 'nigga', 'nigg', 'n1gger', 'n1gga', 'niqqa', 'chink', 'gook', 'wetback', 'spic', 'beaner',
  'coon', 'jigaboo', 'porch monkey', 'towelhead',
  // Slurs (sexual orientation)
  'faggot', 'fag', 'fags', 'f4ggot', 'dyke', 'tranny', 'shemale', 'ladyboy',
  // Slurs (religious)
  'kike', 'raghead', 'sandnigger',
  // Slurs (general)
  'retard', 'retarded', 'r3tard', 'tard',
  // Profanity
  'fuck', 'fucking', 'fucked', 'fucker', 'fuk', 'fck', 'f*ck', 'f**k',
  'shit', 'shitting', 'shitty', 'sh1t', 'sht',
  'bitch', 'bitches', 'b1tch', 'biatch',
  'ass', 'asshole', 'arse', 'a$$',
  'dick', 'dickhead', 'd1ck',
  'cock', 'c0ck',
  'pussy', 'puss', 'pu$$y',
  'cunt', 'c*nt',
  'whore', 'wh0re',
  'slut', 'slutty', 'sl*t',
  'bastard', 'b@stard',
  'damn', 'dammit',
  'hell', 'bloody',
  'motherfucker', 'mofo',
  'piss', 'pissed',
  'bullshit', 'bs'
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
  normalized = normalized.replace(PATTERN_VARIATIONS.specialChars, ' ');
  normalized = normalized.replace(PATTERN_VARIATIONS.repeatedChars, '$1');
  normalized = normalized.replace(/0/g, 'o').replace(/@/g, 'a').replace(/1/g, 'i').replace(/3/g, 'e').replace(/4/g, 'a').replace(/5/g, 's').replace(/\$/g, 's').replace(/\*/g, '');

  return normalized.trim();
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
    const escapedTerm = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(`\\b${escapedTerm}\\b`, 'i');

    if (regex.test(normalized)) {
      flaggedTerms.push(term);
      continue;
    }

    if (normalized.includes(term)) {
      flaggedTerms.push(term);
      continue;
    }

    for (const word of words) {
      if (word.length > 3 && term.length > 3) {
        const similarity = calculateSimilarity(word, term);
        if (similarity > 0.85) {
          flaggedTerms.push(term);
          break;
        }
      }
    }
  }

  if (flaggedTerms.length > 0) {
    return {
      isClean: false,
      reason: 'Your post contains inappropriate language, profanity, slurs, or offensive content that violates our community guidelines. Please revise your content to be respectful and appropriate.',
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

export interface ImageModerationResult {
  isClean: boolean;
  reason?: string;
}

export function moderateImageFile(file: File): ImageModerationResult {
  const fileName = file.name.toLowerCase();
  const normalized = normalizeText(fileName);

  const explicitFileTerms = [
    'nude', 'naked', 'porn', 'xxx', 'nsfw', 'sex', 'explicit', 'adult',
    'dick', 'cock', 'pussy', 'boob', 'tit', 'ass', 'penis', 'vagina'
  ];

  for (const term of explicitFileTerms) {
    if (normalized.includes(term)) {
      return {
        isClean: false,
        reason: 'The image filename suggests inappropriate or explicit content. Please ensure your image is appropriate for our community.'
      };
    }
  }

  if (file.size > 15 * 1024 * 1024) {
    return {
      isClean: false,
      reason: 'Image file is too large. Maximum size is 15MB.'
    };
  }

  return { isClean: true };
}
