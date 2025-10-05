// Improved English Lip Sync with Better Audio-Text Alignment
import { textToPhonemes, phonemeToViseme } from './englishPhonemeConverter';

export interface TimedPhoneme {
  phoneme: string;
  startTime: number;
  endTime: number;
  viseme: string;
  intensity: number;
}

export interface WordTiming {
  word: string;
  startTime: number;
  endTime: number;
  phonemes: TimedPhoneme[];
}

// Estimate word and phoneme durations based on linguistic rules
export function estimateWordTimings(text: string, totalDuration: number): WordTiming[] {
  const words = text.toLowerCase()
    .replace(/[.,!?;:'"]/g, '')
    .split(/\s+/)
    .filter(w => w.length > 0);

  if (words.length === 0) return [];

  // Calculate word weights based on syllable count and phoneme complexity
  const wordWeights = words.map(word => calculateWordWeight(word));
  const totalWeight = wordWeights.reduce((sum, w) => sum + w, 0);

  // Add pause weight between words (5% of total) - reduced for better sync
  const pauseWeight = totalWeight * 0.05;
  const adjustedTotalWeight = totalWeight + pauseWeight * (words.length - 1);

  // Reserve 5% of duration at the end for natural fade out
  const usableDuration = totalDuration * 0.95;

  const wordTimings: WordTiming[] = [];
  let currentTime = 0;

  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWeight = wordWeights[i];

    // Calculate word duration proportional to its weight (using usable duration)
    const wordDuration = (wordWeight / adjustedTotalWeight) * usableDuration;

    // Get phonemes for the word
    const phonemes = textToPhonemes(word);

    // Calculate phoneme timings within the word
    const timedPhonemes = calculatePhonemeTimings(
      phonemes,
      currentTime,
      currentTime + wordDuration
    );

    wordTimings.push({
      word,
      startTime: currentTime,
      endTime: currentTime + wordDuration,
      phonemes: timedPhonemes
    });

    currentTime += wordDuration;

    // Add pause between words
    if (i < words.length - 1) {
      const pauseDuration = (pauseWeight / adjustedTotalWeight) * usableDuration;
      currentTime += pauseDuration;
    }
  }

  return wordTimings;
}

// Calculate weight based on phonetic complexity
function calculateWordWeight(word: string): number {
  const phonemes = textToPhonemes(word);
  let weight = 0;

  for (const phoneme of phonemes) {
    // Vowels take longer than consonants
    if (isVowelPhoneme(phoneme.phoneme)) {
      weight += 1.2 * (phoneme.duration || 0.5);
    } else if (phoneme.phoneme === 'PAUSE') {
      weight += 0.2;
    } else {
      // Consonants
      weight += 0.6 * (phoneme.duration || 0.5);

      // Plosives are shorter
      if (['B', 'P', 'D', 'T', 'G', 'K'].includes(phoneme.phoneme)) {
        weight *= 0.8;
      }
      // Fricatives are longer
      else if (['F', 'V', 'TH', 'DH', 'S', 'Z', 'SH', 'ZH'].includes(phoneme.phoneme)) {
        weight *= 1.1;
      }
    }
  }

  // Adjust for word length (longer words are spoken faster per phoneme)
  if (word.length > 7) {
    weight *= 0.9;
  }

  return Math.max(weight, 0.5); // Minimum weight to avoid zero duration
}

// Calculate timing for each phoneme within a word
function calculatePhonemeTimings(
  phonemes: any[],
  startTime: number,
  endTime: number
): TimedPhoneme[] {
  const wordDuration = endTime - startTime;
  const timedPhonemes: TimedPhoneme[] = [];

  // Calculate relative durations
  const totalDuration = phonemes.reduce((sum, p) => sum + (p.duration || 0.5), 0);

  let currentTime = startTime;

  for (const phoneme of phonemes) {
    const relativeDuration = (phoneme.duration || 0.5) / totalDuration;
    const actualDuration = relativeDuration * wordDuration;

    const viseme = phonemeToViseme(phoneme.phoneme);
    const intensity = calculatePhonemeIntensity(phoneme.phoneme, phoneme.stress);

    timedPhonemes.push({
      phoneme: phoneme.phoneme,
      startTime: currentTime,
      endTime: currentTime + actualDuration,
      viseme,
      intensity
    });

    currentTime += actualDuration;
  }

  return timedPhonemes;
}

// Calculate phoneme intensity based on type and stress
function calculatePhonemeIntensity(phoneme: string, stress?: number): number {
  let baseIntensity = 0.5;

  // Vowels are more intense
  if (isVowelPhoneme(phoneme)) {
    baseIntensity = 0.7;

    // Open vowels are most intense
    if (['AA', 'AE', 'AW'].includes(phoneme)) {
      baseIntensity = 0.9;
    }
    // Mid vowels
    else if (['EH', 'AH', 'ER'].includes(phoneme)) {
      baseIntensity = 0.7;
    }
    // Close vowels
    else if (['IY', 'IH', 'UW', 'UH'].includes(phoneme)) {
      baseIntensity = 0.6;
    }
  }
  // Consonants
  else {
    // Plosives have brief intensity
    if (['B', 'P', 'D', 'T', 'G', 'K'].includes(phoneme)) {
      baseIntensity = 0.3;
    }
    // Nasals
    else if (['M', 'N', 'NG'].includes(phoneme)) {
      baseIntensity = 0.4;
    }
    // Fricatives
    else if (['F', 'V', 'TH', 'DH', 'S', 'Z', 'SH', 'ZH'].includes(phoneme)) {
      baseIntensity = 0.5;
    }
    // Liquids and glides
    else if (['L', 'R', 'W', 'Y'].includes(phoneme)) {
      baseIntensity = 0.6;
    }
  }

  // Apply stress modifier
  if (stress === 1) {
    baseIntensity *= 1.2; // Primary stress
  } else if (stress === 2) {
    baseIntensity *= 1.1; // Secondary stress
  }

  return Math.min(baseIntensity, 1.0);
}

// Get current phoneme based on audio time
export function getCurrentPhoneme(
  wordTimings: WordTiming[],
  currentTime: number
): { phoneme: string; viseme: string; intensity: number; progress: number } | null {
  // Find current word
  for (const wordTiming of wordTimings) {
    if (currentTime >= wordTiming.startTime && currentTime <= wordTiming.endTime) {
      // Find current phoneme within word
      for (const phoneme of wordTiming.phonemes) {
        if (currentTime >= phoneme.startTime && currentTime <= phoneme.endTime) {
          const phonemeDuration = phoneme.endTime - phoneme.startTime;
          const phonemeProgress = (currentTime - phoneme.startTime) / phonemeDuration;

          return {
            phoneme: phoneme.phoneme,
            viseme: phoneme.viseme,
            intensity: phoneme.intensity,
            progress: phonemeProgress
          };
        }
      }
    }
  }

  // Between words - return neutral
  return {
    phoneme: 'PAUSE',
    viseme: 'neutral',
    intensity: 0.1,
    progress: 0
  };
}

// Pre-process text for better alignment
export function preprocessTextForTiming(text: string): string {
  // Expand contractions for better timing
  const contractions: { [key: string]: string } = {
    "i'm": "i am",
    "i've": "i have",
    "i'll": "i will",
    "i'd": "i would",
    "you're": "you are",
    "you've": "you have",
    "you'll": "you will",
    "you'd": "you would",
    "he's": "he is",
    "he'll": "he will",
    "he'd": "he would",
    "she's": "she is",
    "she'll": "she will",
    "she'd": "she would",
    "it's": "it is",
    "it'll": "it will",
    "we're": "we are",
    "we've": "we have",
    "we'll": "we will",
    "we'd": "we would",
    "they're": "they are",
    "they've": "they have",
    "they'll": "they will",
    "they'd": "they would",
    "that's": "that is",
    "that'll": "that will",
    "there's": "there is",
    "there'll": "there will",
    "what's": "what is",
    "what'll": "what will",
    "who's": "who is",
    "who'll": "who will",
    "where's": "where is",
    "when's": "when is",
    "why's": "why is",
    "how's": "how is",
    "can't": "cannot",
    "won't": "will not",
    "didn't": "did not",
    "doesn't": "does not",
    "don't": "do not",
    "hasn't": "has not",
    "haven't": "have not",
    "hadn't": "had not",
    "isn't": "is not",
    "aren't": "are not",
    "wasn't": "was not",
    "weren't": "were not",
    "wouldn't": "would not",
    "couldn't": "could not",
    "shouldn't": "should not",
    "mustn't": "must not",
    "needn't": "need not"
  };

  let processedText = text.toLowerCase();

  // Replace contractions
  for (const [contraction, expanded] of Object.entries(contractions)) {
    const regex = new RegExp(`\\b${contraction}\\b`, 'gi');
    processedText = processedText.replace(regex, expanded);
  }

  return processedText;
}

// Helper function
function isVowelPhoneme(phoneme: string): boolean {
  const vowelPhonemes = [
    'AA', 'AE', 'AH', 'AO', 'AW', 'AY',
    'EH', 'ER', 'EY',
    'IH', 'IY',
    'OW', 'OY',
    'UH', 'UW'
  ];
  return vowelPhonemes.includes(phoneme);
}

// Smooth viseme transitions
export function blendVisemes(
  fromViseme: string,
  toViseme: string,
  progress: number
): { [morphTarget: string]: number } {
  // This would return interpolated morph target values
  // Implementation depends on your morph target structure
  const fromMorphs = getVisemeMorphTargets(fromViseme);
  const toMorphs = getVisemeMorphTargets(toViseme);

  const blended: { [key: string]: number } = {};

  // Blend all morph targets
  const allKeys = new Set([...Object.keys(fromMorphs), ...Object.keys(toMorphs)]);

  for (const key of allKeys) {
    const fromValue = fromMorphs[key] || 0;
    const toValue = toMorphs[key] || 0;
    blended[key] = fromValue + (toValue - fromValue) * progress;
  }

  return blended;
}

// Get morph targets for a viseme
function getVisemeMorphTargets(viseme: string): { [key: string]: number } {
  const visemeMap: { [key: string]: { [key: string]: number } } = {
    'neutral': { 'A25_Jaw_Open': 0.05 },
    'bilabial': { 'A37_Mouth_Close': 0.3, 'A48_Mouth_Press_Left': 0.2, 'A49_Mouth_Press_Right': 0.2 },
    'labiodental': { 'V_Dental_Lip': 0.5, 'Mouth_Bottom_Lip_Bite': 0.3 },
    'dental': { 'V_Dental_Lip': 0.4, 'V_Tongue_Out': 0.2, 'A25_Jaw_Open': 0.15 },
    'alveolar': { 'V_Tongue_up': 0.3, 'A25_Jaw_Open': 0.1 },
    'postalveolar': { 'V_Tongue_Raise': 0.3, 'A30_Mouth_Pucker': 0.2, 'A25_Jaw_Open': 0.15 },
    'velar': { 'V_Tongue_Lower': 0.2, 'A25_Jaw_Open': 0.15 },
    'glottal': { 'A25_Jaw_Open': 0.2, 'V_Open': 0.15 },
    'rounded': { 'A30_Mouth_Pucker': 0.15, 'A29_Mouth_Funnel': 0.1, 'V_Tight_O': 0.3 },
    'spread': { 'V_Wide': 0.15, 'A50_Mouth_Stretch_Left': 0.1, 'A51_Mouth_Stretch_Right': 0.1 },
    'open': { 'A25_Jaw_Open': 0.6, 'V_Open': 0.5, 'Mouth_Open': 0.4 },
    'open_mid': { 'A25_Jaw_Open': 0.5, 'V_Wide': 0.12, 'Mouth_Open': 0.35 },
    'mid': { 'A25_Jaw_Open': 0.35, 'V_Open': 0.3 },
    'open_rounded': { 'A25_Jaw_Open': 0.5, 'A30_Mouth_Pucker': 0.12, 'V_Tight_O': 0.3 },
    'open_to_close': { 'A25_Jaw_Open': 0.4, 'V_Wide': 0.15 },
    'mid_spread': { 'A25_Jaw_Open': 0.3, 'V_Wide': 0.1 },
    'mid_rounded': { 'A25_Jaw_Open': 0.25, 'A30_Mouth_Pucker': 0.12 },
    'close_spread': { 'A25_Jaw_Open': 0.15, 'V_Wide': 0.2, 'A50_Mouth_Stretch_Left': 0.15, 'A51_Mouth_Stretch_Right': 0.15 },
    'close_rounded': { 'A25_Jaw_Open': 0.2, 'A30_Mouth_Pucker': 0.2, 'A29_Mouth_Funnel': 0.15 },
    'rounded_to_spread': { 'A25_Jaw_Open': 0.35, 'A30_Mouth_Pucker': 0.08, 'V_Wide': 0.1 }
  };

  return visemeMap[viseme] || visemeMap['neutral'];
}

export default {
  estimateWordTimings,
  getCurrentPhoneme,
  preprocessTextForTiming,
  blendVisemes
};