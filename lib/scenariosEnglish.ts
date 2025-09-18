import type { PatientScenario } from './scenarioTypes';

// English translations for scenarios
export const scenarioTranslations: Record<string, Record<string, any>> = {
  'toothache-01': {
    name: 'Acute Toothache Patient',
    basicInfo: {
      name: 'Hiroki Tanaka',
      age: '43 years old',
      gender: 'Male',
      occupation: 'Sales'
    },
    chiefComplaint: {
      complaint: 'Throbbing pain in lower right back tooth',
      location: 'Lower right 6th tooth',
      since: 'Since 1 week ago'
    },
    presentIllness: {
      nature: 'Throbbing, aching pain',
      severity: 'Reduced with Loxonin',
      progress: 'Gradually worsening',
      trigger: 'Pain with cold things',
      dailyImpact: 'Difficult to eat',
      medication: 'OTC pain reliever (Loxonin)',
      dentalVisit: 'First visit'
    },
    dentalHistory: {
      extraction: 'Wisdom tooth extracted',
      anesthesia: 'Yes (difficult to numb)',
      complications: 'Swelling after extraction'
    },
    medicalHistory: {
      systemicDisease: 'Hypertension',
      currentMedication: 'Taking Amlodipine',
      allergies: 'Penicillin allergy'
    },
    lifestyle: {
      oralHygiene: 'Twice daily, rushed at night',
      dietaryHabits: 'Sweet coffee, smoker',
      familyStructure: 'Living with wife and 2 children',
      workSchedule: 'Available until 7pm weekdays, not at noon'
    },
    psychosocial: {
      concerns: 'Afraid of anesthesia, don\'t want extraction',
      requests: 'Hoping for painless treatment'
    },
    interviewEvaluation: {
      summarization: 'Reconfirmation at interview end',
      additionalCheck: 'Anything else concerning you?'
    }
  },
  'periodontal-01': {
    name: 'Periodontal Disease Patient',
    basicInfo: {
      name: 'Michiko Sato',
      age: '58 years old',
      gender: 'Female',
      occupation: 'Housewife'
    },
    chiefComplaint: {
      complaint: 'Gums are bleeding',
      location: 'Overall',
      since: 'Since 6 months ago'
    },
    presentIllness: {
      nature: 'Bleeding when brushing',
      severity: 'Bleeds every time',
      progress: 'No change',
      trigger: 'When brushing teeth',
      dailyImpact: 'Worried about bad breath',
      medication: 'None',
      dentalVisit: 'Previously visited other clinic'
    },
    dentalHistory: {
      extraction: 'None',
      anesthesia: 'Yes',
      complications: 'None'
    },
    medicalHistory: {
      systemicDisease: 'Diabetes',
      currentMedication: 'Taking Metformin',
      allergies: 'None'
    },
    lifestyle: {
      oralHygiene: 'Morning only',
      dietaryHabits: 'Frequent snacking',
      familyStructure: 'Living with husband',
      workSchedule: 'Available anytime'
    },
    psychosocial: {
      concerns: 'Afraid of losing teeth',
      requests: 'Want to keep my teeth'
    },
    interviewEvaluation: {
      summarization: 'Reconfirmation at interview end',
      additionalCheck: 'Anything else concerning you?'
    }
  },
  'wisdom-tooth-01': {
    name: 'Wisdom Tooth Pain',
    basicInfo: {
      name: 'Kenta Suzuki',
      age: '25 years old',
      gender: 'Male',
      occupation: 'IT Company Employee'
    },
    chiefComplaint: {
      complaint: 'Lower left wisdom tooth hurts',
      location: 'Lower left 8th tooth',
      since: 'Since 3 days ago'
    },
    presentIllness: {
      nature: 'Severe pain when biting',
      severity: 'Painkillers not effective',
      progress: 'Getting worse',
      trigger: 'When biting',
      dailyImpact: 'Can\'t concentrate at work',
      medication: 'Taking Bufferin',
      dentalVisit: 'First visit'
    },
    dentalHistory: {
      extraction: 'None',
      anesthesia: 'Yes',
      complications: 'None'
    },
    medicalHistory: {
      systemicDisease: 'None',
      currentMedication: 'None',
      allergies: 'None'
    },
    lifestyle: {
      oralHygiene: 'Twice daily',
      dietaryHabits: 'Regular energy drinks',
      familyStructure: 'Living alone',
      workSchedule: 'Mainly remote work'
    },
    psychosocial: {
      concerns: 'Afraid of extraction',
      requests: 'Want pain relief quickly'
    },
    interviewEvaluation: {
      summarization: 'Reconfirmation at interview end',
      additionalCheck: 'Anything else concerning you?'
    }
  },
  'dental-checkup-01': {
    name: 'Regular Checkup Patient',
    basicInfo: {
      name: 'Taro Yamada',
      age: '34 years old',
      gender: 'Male',
      occupation: 'Office Worker'
    },
    chiefComplaint: {
      complaint: 'Regular checkup',
      location: 'No specific area',
      since: 'Last visit 1 year ago'
    },
    presentIllness: {
      nature: 'No symptoms',
      severity: 'None',
      progress: 'N/A',
      trigger: 'N/A',
      dailyImpact: 'None',
      medication: 'None',
      dentalVisit: 'Annual checkup'
    },
    dentalHistory: {
      extraction: 'None',
      anesthesia: 'Yes',
      complications: 'None'
    },
    medicalHistory: {
      systemicDisease: 'None',
      currentMedication: 'None',
      allergies: 'None'
    },
    lifestyle: {
      oralHygiene: 'Twice daily',
      dietaryHabits: 'Balanced diet',
      familyStructure: 'Single',
      workSchedule: 'Weekends only'
    },
    psychosocial: {
      concerns: 'Prevention focused',
      requests: 'Maintain oral health'
    },
    interviewEvaluation: {
      summarization: 'Reconfirmation at interview end',
      additionalCheck: 'Any concerns since last visit?'
    }
  }
};

// Function to get translated scenario
export function getTranslatedScenario(scenario: PatientScenario, language: 'ja' | 'en'): PatientScenario {
  if (language === 'ja') {
    return scenario;
  }

  const translation = scenarioTranslations[scenario.id];
  if (!translation) {
    // If no translation available, return original
    return scenario;
  }

  // Deep merge translation with original scenario
  return {
    ...scenario,
    ...translation,
    basicInfo: {
      ...scenario.basicInfo,
      ...translation.basicInfo
    },
    chiefComplaint: {
      ...scenario.chiefComplaint,
      ...translation.chiefComplaint
    },
    presentIllness: {
      ...scenario.presentIllness,
      ...translation.presentIllness
    },
    dentalHistory: {
      ...scenario.dentalHistory,
      ...translation.dentalHistory
    },
    medicalHistory: {
      ...scenario.medicalHistory,
      ...translation.medicalHistory
    },
    lifestyle: {
      ...scenario.lifestyle,
      ...translation.lifestyle
    },
    psychosocial: {
      ...scenario.psychosocial,
      ...translation.psychosocial
    },
    interviewEvaluation: {
      ...scenario.interviewEvaluation,
      ...translation.interviewEvaluation
    }
  };
}