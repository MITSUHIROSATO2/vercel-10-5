// English Text to Phoneme Converter for High-Quality Lip Sync
// Using CMU Pronouncing Dictionary patterns and linguistic rules

interface PhonemeSequence {
  phoneme: string;
  duration: number; // relative duration (0-1)
  stress?: number; // stress level (0-2)
}

// Common English word to phoneme mappings (simplified CMU dict)
const WORD_TO_PHONEMES: { [word: string]: string[] } = {
  // Articles
  'the': ['DH', 'AH'],
  'a': ['AH'],
  'an': ['AE', 'N'],

  // Pronouns
  'i': ['AY'],
  "i'm": ['AY', 'M'],
  'you': ['Y', 'UW'],
  'he': ['HH', 'IY'],
  'she': ['SH', 'IY'],
  'it': ['IH', 'T'],
  'we': ['W', 'IY'],
  'they': ['DH', 'EY'],
  'me': ['M', 'IY'],
  'my': ['M', 'AY'],
  'your': ['Y', 'UH', 'R'],
  'his': ['HH', 'IH', 'Z'],
  'her': ['HH', 'ER'],
  'our': ['AW', 'ER'],
  'their': ['DH', 'EH', 'R'],

  // Common verbs
  'is': ['IH', 'Z'],
  'are': ['AA', 'R'],
  'am': ['AE', 'M'],
  'was': ['W', 'AA', 'Z'],
  'were': ['W', 'ER'],
  'be': ['B', 'IY'],
  'been': ['B', 'IH', 'N'],
  'being': ['B', 'IY', 'IH', 'NG'],
  'have': ['HH', 'AE', 'V'],
  'has': ['HH', 'AE', 'Z'],
  'had': ['HH', 'AE', 'D'],
  'do': ['D', 'UW'],
  'does': ['D', 'AH', 'Z'],
  'did': ['D', 'IH', 'D'],
  'will': ['W', 'IH', 'L'],
  'would': ['W', 'UH', 'D'],
  'could': ['K', 'UH', 'D'],
  'should': ['SH', 'UH', 'D'],
  'can': ['K', 'AE', 'N'],
  "can't": ['K', 'AE', 'N', 'T'],
  'cannot': ['K', 'AE', 'N', 'AA', 'T'],
  'may': ['M', 'EY'],
  'might': ['M', 'AY', 'T'],
  'must': ['M', 'AH', 'S', 'T'],
  'shall': ['SH', 'AE', 'L'],
  'go': ['G', 'OW'],
  'going': ['G', 'OW', 'IH', 'NG'],
  'come': ['K', 'AH', 'M'],
  'coming': ['K', 'AH', 'M', 'IH', 'NG'],
  'make': ['M', 'EY', 'K'],
  'made': ['M', 'EY', 'D'],
  'take': ['T', 'EY', 'K'],
  'took': ['T', 'UH', 'K'],
  'give': ['G', 'IH', 'V'],
  'gave': ['G', 'EY', 'V'],
  'get': ['G', 'EH', 'T'],
  'got': ['G', 'AA', 'T'],
  'say': ['S', 'EY'],
  'said': ['S', 'EH', 'D'],
  'see': ['S', 'IY'],
  'saw': ['S', 'AO'],
  'know': ['N', 'OW'],
  'knew': ['N', 'UW'],
  'think': ['TH', 'IH', 'NG', 'K'],
  'thought': ['TH', 'AO', 'T'],
  'want': ['W', 'AA', 'N', 'T'],
  'need': ['N', 'IY', 'D'],
  'feel': ['F', 'IY', 'L'],
  'tell': ['T', 'EH', 'L'],
  'told': ['T', 'OW', 'L', 'D'],
  'ask': ['AE', 'S', 'K'],
  'work': ['W', 'ER', 'K'],
  'seem': ['S', 'IY', 'M'],
  'let': ['L', 'EH', 'T'],
  'try': ['T', 'R', 'AY'],
  'call': ['K', 'AO', 'L'],
  'use': ['Y', 'UW', 'Z'],
  'find': ['F', 'AY', 'N', 'D'],
  'keep': ['K', 'IY', 'P'],
  'help': ['HH', 'EH', 'L', 'P'],

  // Common nouns
  'time': ['T', 'AY', 'M'],
  'day': ['D', 'EY'],
  'year': ['Y', 'IH', 'R'],
  'way': ['W', 'EY'],
  'man': ['M', 'AE', 'N'],
  'woman': ['W', 'UH', 'M', 'AH', 'N'],
  'child': ['CH', 'AY', 'L', 'D'],
  'world': ['W', 'ER', 'L', 'D'],
  'life': ['L', 'AY', 'F'],
  'hand': ['HH', 'AE', 'N', 'D'],
  'part': ['P', 'AA', 'R', 'T'],
  'place': ['P', 'L', 'EY', 'S'],
  'case': ['K', 'EY', 'S'],
  'week': ['W', 'IY', 'K'],
  'number': ['N', 'AH', 'M', 'B', 'ER'],
  'group': ['G', 'R', 'UW', 'P'],
  'problem': ['P', 'R', 'AA', 'B', 'L', 'AH', 'M'],
  'fact': ['F', 'AE', 'K', 'T'],

  // Medical/Dental terms
  'pain': ['P', 'EY', 'N'],
  'tooth': ['T', 'UW', 'TH'],
  'teeth': ['T', 'IY', 'TH'],
  'dental': ['D', 'EH', 'N', 'T', 'AH', 'L'],
  'doctor': ['D', 'AA', 'K', 'T', 'ER'],
  'patient': ['P', 'EY', 'SH', 'AH', 'N', 'T'],
  'treatment': ['T', 'R', 'IY', 'T', 'M', 'AH', 'N', 'T'],
  'medicine': ['M', 'EH', 'D', 'IH', 'S', 'IH', 'N'],
  'health': ['HH', 'EH', 'L', 'TH'],
  'symptom': ['S', 'IH', 'M', 'P', 'T', 'AH', 'M'],
  'diagnosis': ['D', 'AY', 'AH', 'G', 'N', 'OW', 'S', 'IH', 'S'],
  'examination': ['IH', 'G', 'Z', 'AE', 'M', 'IH', 'N', 'EY', 'SH', 'AH', 'N'],
  'cavity': ['K', 'AE', 'V', 'IH', 'T', 'IY'],
  'gum': ['G', 'AH', 'M'],
  'mouth': ['M', 'AW', 'TH'],
  'jaw': ['JH', 'AO'],

  // Common adjectives
  'good': ['G', 'UH', 'D'],
  'bad': ['B', 'AE', 'D'],
  'new': ['N', 'UW'],
  'old': ['OW', 'L', 'D'],
  'great': ['G', 'R', 'EY', 'T'],
  'big': ['B', 'IH', 'G'],
  'small': ['S', 'M', 'AO', 'L'],
  'long': ['L', 'AO', 'NG'],
  'short': ['SH', 'AO', 'R', 'T'],
  'high': ['HH', 'AY'],
  'low': ['L', 'OW'],
  'right': ['R', 'AY', 'T'],
  'left': ['L', 'EH', 'F', 'T'],
  'same': ['S', 'EY', 'M'],
  'different': ['D', 'IH', 'F', 'ER', 'AH', 'N', 'T'],

  // Greetings and common phrases
  'hello': ['HH', 'AH', 'L', 'OW'],
  'hi': ['HH', 'AY'],
  'goodbye': ['G', 'UH', 'D', 'B', 'AY'],
  'please': ['P', 'L', 'IY', 'Z'],
  'thank': ['TH', 'AE', 'NG', 'K'],
  'thanks': ['TH', 'AE', 'NG', 'K', 'S'],
  'sorry': ['S', 'AA', 'R', 'IY'],
  'excuse': ['IH', 'K', 'S', 'K', 'Y', 'UW', 'Z'],
  'yes': ['Y', 'EH', 'S'],
  'no': ['N', 'OW'],
  'okay': ['OW', 'K', 'EY'],
  'alright': ['AO', 'L', 'R', 'AY', 'T'],
  'sure': ['SH', 'UH', 'R'],

  // Question words
  'what': ['W', 'AH', 'T'],
  'when': ['W', 'EH', 'N'],
  'where': ['W', 'EH', 'R'],
  'who': ['HH', 'UW'],
  'why': ['W', 'AY'],
  'how': ['HH', 'AW'],
  'which': ['W', 'IH', 'CH']
};

// Letter to phoneme rules for unknown words
const LETTER_TO_PHONEME_RULES: { [pattern: string]: string[] } = {
  // Consonants
  'b': ['B'],
  'c': ['K'], // default to K sound
  'ch': ['CH'],
  'ck': ['K'],
  'd': ['D'],
  'f': ['F'],
  'g': ['G'],
  'gh': ['F'], // as in laugh
  'h': ['HH'],
  'j': ['JH'],
  'k': ['K'],
  'l': ['L'],
  'm': ['M'],
  'n': ['N'],
  'ng': ['NG'],
  'p': ['P'],
  'ph': ['F'],
  'qu': ['K', 'W'],
  'r': ['R'],
  's': ['S'],
  'sh': ['SH'],
  't': ['T'],
  'th': ['TH'],
  'v': ['V'],
  'w': ['W'],
  'wh': ['W'],
  'x': ['K', 'S'],
  'y': ['Y'],
  'z': ['Z'],

  // Vowels and diphthongs
  'a': ['AE'],
  'ai': ['EY'],
  'ay': ['EY'],
  'e': ['EH'],
  'ea': ['IY'],
  'ee': ['IY'],
  'i': ['IH'],
  'ie': ['AY'],
  'o': ['AA'],
  'oa': ['OW'],
  'oo': ['UW'],
  'ou': ['AW'],
  'ow': ['OW'],
  'oy': ['OY'],
  'u': ['AH'],
  'ue': ['UW'],
  'y': ['IY'] // when used as vowel
};

// Convert text to phoneme sequence
export function textToPhonemes(text: string): PhonemeSequence[] {
  const words = text.toLowerCase()
    .replace(/[.,!?;:'"]/g, '') // Remove punctuation
    .split(/\s+/)
    .filter(w => w.length > 0);

  const phonemeSequences: PhonemeSequence[] = [];

  for (const word of words) {
    // Check if word exists in dictionary
    if (WORD_TO_PHONEMES[word]) {
      const phonemes = WORD_TO_PHONEMES[word];
      phonemes.forEach((phoneme, index) => {
        // Adjust duration based on phoneme type
        let duration = 0.5;
        if (isVowelPhoneme(phoneme)) {
          duration = 0.7; // Vowels are longer
        } else if (isPlosivePhoneme(phoneme)) {
          duration = 0.3; // Plosives are shorter
        }

        phonemeSequences.push({
          phoneme,
          duration,
          stress: index === 0 ? 1 : 0 // Primary stress on first phoneme
        });
      });
    } else {
      // Fallback to letter-by-letter conversion
      const phonemes = convertWordToPhonemes(word);
      phonemes.forEach(p => phonemeSequences.push(p));
    }

    // Add short pause between words
    phonemeSequences.push({
      phoneme: 'PAUSE',
      duration: 0.2
    });
  }

  return phonemeSequences;
}

// Convert unknown word to phonemes using rules
function convertWordToPhonemes(word: string): PhonemeSequence[] {
  const phonemes: PhonemeSequence[] = [];
  let i = 0;

  while (i < word.length) {
    let matched = false;

    // Try two-letter combinations first
    if (i < word.length - 1) {
      const twoLetters = word.substring(i, i + 2);
      if (LETTER_TO_PHONEME_RULES[twoLetters]) {
        LETTER_TO_PHONEME_RULES[twoLetters].forEach(p => {
          phonemes.push({
            phoneme: p,
            duration: isVowelPhoneme(p) ? 0.6 : 0.4
          });
        });
        i += 2;
        matched = true;
      }
    }

    // Try single letter
    if (!matched) {
      const letter = word[i];
      if (LETTER_TO_PHONEME_RULES[letter]) {
        LETTER_TO_PHONEME_RULES[letter].forEach(p => {
          phonemes.push({
            phoneme: p,
            duration: isVowelPhoneme(p) ? 0.6 : 0.4
          });
        });
      } else {
        // Default to neutral vowel for unknown
        phonemes.push({
          phoneme: 'AH',
          duration: 0.5
        });
      }
      i++;
    }
  }

  return phonemes;
}

// Check if phoneme is a vowel
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

// Check if phoneme is a plosive
function isPlosivePhoneme(phoneme: string): boolean {
  const plosivePhonemes = ['B', 'P', 'D', 'T', 'G', 'K'];
  return plosivePhonemes.includes(phoneme);
}

// Get viseme for phoneme (simplified viseme groups)
export function phonemeToViseme(phoneme: string): string {
  const visemeMap: { [key: string]: string } = {
    // Silence/neutral
    'PAUSE': 'neutral',

    // Bilabial (lips together)
    'B': 'bilabial',
    'P': 'bilabial',
    'M': 'bilabial',

    // Labiodental (teeth on lip)
    'F': 'labiodental',
    'V': 'labiodental',

    // Dental (tongue between teeth)
    'TH': 'dental',
    'DH': 'dental',

    // Alveolar (tongue to ridge)
    'T': 'alveolar',
    'D': 'alveolar',
    'S': 'alveolar',
    'Z': 'alveolar',
    'N': 'alveolar',
    'L': 'alveolar',

    // Postalveolar (tongue behind ridge)
    'SH': 'postalveolar',
    'ZH': 'postalveolar',
    'CH': 'postalveolar',
    'JH': 'postalveolar',
    'R': 'postalveolar',

    // Velar (back of tongue)
    'K': 'velar',
    'G': 'velar',
    'NG': 'velar',

    // Glottal
    'HH': 'glottal',

    // Approximants
    'W': 'rounded',
    'Y': 'spread',

    // Vowels - grouped by mouth shape
    'AA': 'open', // father
    'AE': 'open_mid', // cat
    'AH': 'mid', // but
    'AO': 'open_rounded', // dog
    'AW': 'open_rounded', // how
    'AY': 'open_to_close', // hide
    'EH': 'mid_spread', // bed
    'ER': 'mid_rounded', // her
    'EY': 'close_spread', // take
    'IH': 'close_spread', // it
    'IY': 'close_spread', // eat
    'OW': 'close_rounded', // go
    'OY': 'rounded_to_spread', // toy
    'UH': 'close_rounded', // hood
    'UW': 'close_rounded', // two
  };

  return visemeMap[phoneme] || 'neutral';
}

// Calculate smooth transition between visemes
export function calculateVisemeBlend(
  fromViseme: string,
  toViseme: string,
  progress: number
): { [morphTarget: string]: number } {
  // This would return interpolated morph target values
  // Implementation depends on your morph target structure
  return {};
}

// Export for use in components
export default {
  textToPhonemes,
  phonemeToViseme,
  calculateVisemeBlend
};