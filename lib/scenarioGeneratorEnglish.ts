import type { PatientScenario } from './scenarioTypes';

// Random elements data for English
const firstNamesEn = ['John', 'Mary', 'Michael', 'Jennifer', 'David', 'Lisa', 'Robert', 'Susan', 'James', 'Karen'];
const lastNamesEn = ['Smith', 'Johnson', 'Williams', 'Brown', 'Jones', 'Garcia', 'Miller', 'Davis', 'Rodriguez', 'Martinez'];
const agesEn = ['25 years old', '32 years old', '38 years old', '45 years old', '52 years old', '58 years old', '65 years old', '70 years old'];
const gendersEn = ['Male', 'Female'];
const occupationsEn = ['Office Worker', 'Housewife', 'Self-employed', 'Public Servant', 'Teacher', 'Healthcare Worker', 'Student', 'Retiree', 'Freelancer'];

const complaintsEn = [
  'Back tooth hurts',
  'Gums are bleeding',
  'Sensitive to cold',
  'Tooth is loose',
  'Concerned about bad breath',
  'Tooth is chipped',
  'Jaw pain',
  'Filling fell out'
];

const locationsEn = [
  'Upper right 6th', 'Lower right 6th', 'Upper left 6th', 'Lower left 6th',
  'Upper right 4th', 'Lower right 4th', 'Front teeth', 'All back teeth'
];

const durationsEn = [
  'Since 3 days ago', 'Since 1 week ago', 'Since 2 weeks ago', 'Since 1 month ago',
  'Since 3 months ago', 'Since 6 months ago'
];

const naturesEn = [
  'Throbbing pain',
  'Aching pain',
  'Dull pain',
  'Severe pain',
  'Mild discomfort',
  'Occasional pain'
];

const severitiesEn = [
  'Reduced with painkillers',
  'Painkillers not effective',
  'Tolerable',
  'Can\'t sleep at night',
  'Interferes with daily life'
];

const progressesEn = [
  'Gradually worsening',
  'No change',
  'Getting better',
  'Comes and goes'
];

const triggersEn = [
  'Cold things',
  'Hot things',
  'When chewing',
  'Sweet things',
  'Nothing specific',
  'When brushing teeth'
];

const impactsEn = [
  'Can\'t eat',
  'Can\'t concentrate at work',
  'Worried about bad breath',
  'Can\'t smile',
  'Difficult to talk'
];

const medicationsEn = [
  'OTC painkillers',
  'None',
  'Prescribed antibiotics',
  'Mouth rinse'
];

const dentalVisitsEn = [
  'First visit',
  'Visited other clinic',
  'Regular patient',
  'Emergency visit'
];

const extractionsEn = [
  'Wisdom tooth extracted',
  'None',
  'Multiple extractions',
  'Baby teeth only'
];

const anesthesiasEn = [
  'Yes',
  'Yes (difficult to numb)',
  'No',
  'Don\'t remember'
];

const complicationsEn = [
  'None',
  'Swelling after extraction',
  'Prolonged bleeding',
  'Allergic reaction'
];

const diseasesEn = [
  'None',
  'Hypertension',
  'Diabetes',
  'Heart disease',
  'Hypertension and diabetes',
  'Asthma',
  'Thyroid disease'
];

const currentMedicationsEn = [
  'None',
  'Blood pressure medication',
  'Diabetes medication',
  'Blood thinner',
  'Multiple medications',
  'Thyroid medication'
];

const allergiesEn = [
  'None',
  'Penicillin allergy',
  'Local anesthetic allergy',
  'Metal allergy',
  'Multiple allergies'
];

const hygieneEn = [
  'Twice daily',
  'Once daily',
  'Three times daily',
  'Irregular',
  'After every meal'
];

const habitsEn = [
  'Coffee lover',
  'Smoker',
  'Sweet tooth',
  'Energy drinks',
  'Healthy diet',
  'Irregular eating'
];

const familiesEn = [
  'Living alone',
  'Living with spouse',
  'Living with family',
  'Living with spouse and children',
  'Living with parents'
];

const schedulesEn = [
  'Available anytime',
  'Weekends only',
  'Weekdays until 7pm',
  'Mornings only',
  'Flexible schedule'
];

const concernsEn = [
  'Afraid of pain',
  'Afraid of anesthesia',
  'Worried about cost',
  'Afraid of extraction',
  'Worried about appearance'
];

const requestsEn = [
  'Want painless treatment',
  'Want to keep the tooth',
  'Want quick treatment',
  'Want natural appearance',
  'Want affordable treatment'
];

// Generate random scenario in English
export function generateRandomScenarioEn(): PatientScenario {
  const id = `generated-${Date.now()}`;
  const firstName = firstNamesEn[Math.floor(Math.random() * firstNamesEn.length)];
  const lastName = lastNamesEn[Math.floor(Math.random() * lastNamesEn.length)];

  return {
    id,
    name: 'Generated Patient',
    basicInfo: {
      name: `${firstName} ${lastName}`,
      age: agesEn[Math.floor(Math.random() * agesEn.length)],
      gender: gendersEn[Math.floor(Math.random() * gendersEn.length)],
      occupation: occupationsEn[Math.floor(Math.random() * occupationsEn.length)]
    },
    chiefComplaint: {
      complaint: complaintsEn[Math.floor(Math.random() * complaintsEn.length)],
      location: locationsEn[Math.floor(Math.random() * locationsEn.length)],
      since: durationsEn[Math.floor(Math.random() * durationsEn.length)]
    },
    presentIllness: {
      nature: naturesEn[Math.floor(Math.random() * naturesEn.length)],
      severity: severitiesEn[Math.floor(Math.random() * severitiesEn.length)],
      progress: progressesEn[Math.floor(Math.random() * progressesEn.length)],
      trigger: triggersEn[Math.floor(Math.random() * triggersEn.length)],
      dailyImpact: impactsEn[Math.floor(Math.random() * impactsEn.length)],
      medication: medicationsEn[Math.floor(Math.random() * medicationsEn.length)],
      dentalVisit: dentalVisitsEn[Math.floor(Math.random() * dentalVisitsEn.length)]
    },
    dentalHistory: {
      extraction: extractionsEn[Math.floor(Math.random() * extractionsEn.length)],
      anesthesia: anesthesiasEn[Math.floor(Math.random() * anesthesiasEn.length)],
      complications: complicationsEn[Math.floor(Math.random() * complicationsEn.length)]
    },
    medicalHistory: {
      systemicDisease: diseasesEn[Math.floor(Math.random() * diseasesEn.length)],
      currentMedication: currentMedicationsEn[Math.floor(Math.random() * currentMedicationsEn.length)],
      allergies: allergiesEn[Math.floor(Math.random() * allergiesEn.length)]
    },
    lifestyle: {
      oralHygiene: hygieneEn[Math.floor(Math.random() * hygieneEn.length)],
      dietaryHabits: habitsEn[Math.floor(Math.random() * habitsEn.length)],
      familyStructure: familiesEn[Math.floor(Math.random() * familiesEn.length)],
      workSchedule: schedulesEn[Math.floor(Math.random() * schedulesEn.length)]
    },
    psychosocial: {
      concerns: concernsEn[Math.floor(Math.random() * concernsEn.length)],
      requests: requestsEn[Math.floor(Math.random() * requestsEn.length)]
    },
    interviewEvaluation: {
      summarization: 'Reconfirmation at interview end',
      additionalCheck: 'Anything else concerning you?'
    }
  };
}

// Generate themed scenario in English
export function generateThemedScenarioEn(theme: 'emergency' | 'periodontal' | 'aesthetic' | 'pediatric' | 'elderly'): PatientScenario {
  const baseScenario = generateRandomScenarioEn();

  switch(theme) {
    case 'emergency':
      return {
        ...baseScenario,
        name: 'Emergency Patient',
        chiefComplaint: {
          complaint: 'Severe tooth pain',
          location: locationsEn[Math.floor(Math.random() * 4)],
          since: 'Since yesterday'
        },
        presentIllness: {
          ...baseScenario.presentIllness,
          nature: 'Severe throbbing pain',
          severity: 'Painkillers not working',
          progress: 'Rapidly worsening',
          dailyImpact: 'Can\'t eat or sleep'
        }
      };

    case 'periodontal':
      return {
        ...baseScenario,
        name: 'Periodontal Disease Patient',
        basicInfo: {
          ...baseScenario.basicInfo,
          age: agesEn.slice(4)[Math.floor(Math.random() * 4)]
        },
        chiefComplaint: {
          complaint: 'Gums bleeding',
          location: 'Overall',
          since: 'Since several months ago'
        },
        presentIllness: {
          ...baseScenario.presentIllness,
          nature: 'Bleeding when brushing',
          severity: 'Bleeds easily',
          trigger: 'When brushing teeth',
          dailyImpact: 'Concerned about bad breath'
        }
      };

    case 'aesthetic':
      return {
        ...baseScenario,
        name: 'Aesthetic Patient',
        basicInfo: {
          ...baseScenario.basicInfo,
          age: agesEn.slice(0, 4)[Math.floor(Math.random() * 4)]
        },
        chiefComplaint: {
          complaint: 'Want whiter teeth',
          location: 'Front teeth',
          since: 'Long-standing concern'
        },
        presentIllness: {
          ...baseScenario.presentIllness,
          nature: 'Discoloration',
          severity: 'Noticeable in photos',
          progress: 'No change',
          trigger: 'N/A',
          dailyImpact: 'Hesitant to smile'
        }
      };

    case 'pediatric':
      return {
        ...baseScenario,
        name: 'Pediatric Patient',
        basicInfo: {
          name: `${firstNamesEn[Math.floor(Math.random() * firstNamesEn.length)]} ${lastNamesEn[Math.floor(Math.random() * lastNamesEn.length)]}`,
          age: '8 years old',
          gender: gendersEn[Math.floor(Math.random() * gendersEn.length)],
          occupation: 'Elementary School Student'
        },
        chiefComplaint: {
          complaint: 'Cavity',
          location: 'Back tooth',
          since: 'Found at school checkup'
        },
        psychosocial: {
          concerns: 'Very afraid of dentist',
          requests: 'Want gentle treatment'
        }
      };

    case 'elderly':
      return {
        ...baseScenario,
        name: 'Elderly Patient',
        basicInfo: {
          ...baseScenario.basicInfo,
          age: '75 years old',
          occupation: 'Retiree'
        },
        medicalHistory: {
          systemicDisease: 'Multiple conditions',
          currentMedication: 'Multiple medications',
          allergies: baseScenario.medicalHistory.allergies
        },
        lifestyle: {
          ...baseScenario.lifestyle,
          familyStructure: 'Living with family',
          workSchedule: 'Available anytime'
        }
      };

    default:
      return baseScenario;
  }
}