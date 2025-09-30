// English version of demo dialogues for medical interview evaluation

export interface DemoDialogue {
  speaker: 'doctor' | 'patient';
  text: string;
  delay?: number; // Delay before next utterance (milliseconds)
}

export const improvedDemoDialoguesEn: DemoDialogue[] = [
  // ===== Introduction =====
  // Greeting and self-introduction
  { speaker: 'doctor', text: 'Hello, I\'m Dr. Tanaka. I\'ll be taking care of you today.', delay: 3000 },
  { speaker: 'patient', text: 'Hello, nice to meet you.', delay: 2500 },

  // Identity verification (full name)
  { speaker: 'doctor', text: 'First, could you please tell me your full name?', delay: 2000 },
  { speaker: 'patient', text: 'I\'m Taro Yamada.', delay: 2000 },
  { speaker: 'doctor', text: 'Mr. Taro Yamada. Let me also confirm your date of birth.', delay: 2500 },
  { speaker: 'patient', text: 'May 15th, 1990.', delay: 2500 },

  // Interview overview and consent
  { speaker: 'doctor', text: 'I\'m going to ask you about your symptoms and then examine you. Is that alright?', delay: 3000 },
  { speaker: 'patient', text: 'Yes, please go ahead.', delay: 2000 },

  // ===== Medical Information / Chief Complaint =====
  { speaker: 'doctor', text: 'What brings you in today?', delay: 2500 },
  { speaker: 'patient', text: 'I have pain in my lower right back tooth.', delay: 2500 },

  // Topic transition
  { speaker: 'doctor', text: 'I\'m sorry to hear that. Can you tell me more about the pain?', delay: 3000 },
  { speaker: 'patient', text: 'Sure.', delay: 1500 },

  // ===== Present Illness (OPQRST) =====
  { speaker: 'doctor', text: 'When did the pain start?', delay: 2000 },
  { speaker: 'patient', text: 'Three days ago, on Thursday.', delay: 2000 },
  { speaker: 'doctor', text: 'Was there anything that triggered it?', delay: 2000 },
  { speaker: 'patient', text: 'During dinner, when I bit on something hard, it suddenly started hurting.', delay: 3000 },

  { speaker: 'doctor', text: 'When does it hurt?', delay: 2000 },
  { speaker: 'patient', text: 'It hurts when I drink cold things.', delay: 2500 },
  { speaker: 'doctor', text: 'Are there other times when it hurts?', delay: 2000 },
  { speaker: 'patient', text: 'When I bite down, and even when I\'m not doing anything.', delay: 2500 },

  { speaker: 'doctor', text: 'How would you describe the pain?', delay: 2500 },
  { speaker: 'patient', text: 'It\'s a throbbing, pulsating pain.', delay: 2500 },

  { speaker: 'doctor', text: 'Can you show me exactly where it hurts?', delay: 2000 },
  { speaker: 'patient', text: 'It\'s the very last tooth on the lower right.', delay: 2000 },
  { speaker: 'doctor', text: 'Does the pain spread to other areas?', delay: 2000 },
  { speaker: 'patient', text: 'It radiates to my right cheek and ear.', delay: 2500 },

  { speaker: 'doctor', text: 'On a scale of 1 to 10, how severe is the pain?', delay: 2500 },
  { speaker: 'patient', text: 'About an 8. I can\'t even sleep at night.', delay: 3000 },

  { speaker: 'doctor', text: 'Have you taken any pain medication?', delay: 2000 },
  { speaker: 'patient', text: 'I took over-the-counter Loxonin, but it didn\'t help much.', delay: 3000 },

  // Topic transition
  { speaker: 'doctor', text: 'I understand. Now let me ask about your dental history.', delay: 2500 },

  // ===== Dental History =====
  { speaker: 'doctor', text: 'Have you had dental treatment before?', delay: 2500 },
  { speaker: 'patient', text: 'I had my wisdom tooth extracted 10 years ago.', delay: 2500 },
  { speaker: 'doctor', text: 'Were there any problems with that treatment?', delay: 2500 },
  { speaker: 'patient', text: 'The anesthesia didn\'t work well, so they had to give me more.', delay: 2500 },
  { speaker: 'doctor', text: 'Any other dental treatments?', delay: 2000 },
  { speaker: 'patient', text: 'I had a cavity filled 5 years ago.', delay: 2000 },

  // Topic transition
  { speaker: 'doctor', text: 'Thank you. Now I\'d like to ask about your general health.', delay: 3000 },

  // ===== Medical History =====
  { speaker: 'doctor', text: 'Do you have any medical conditions currently being treated?', delay: 2000 },
  { speaker: 'patient', text: 'I have high blood pressure and diabetes.', delay: 2000 },

  { speaker: 'doctor', text: 'What medications are you taking?', delay: 2000 },
  { speaker: 'patient', text: 'I take Amlodipine and Metformin.', delay: 2500 },

  { speaker: 'doctor', text: 'Do you have any allergies?', delay: 2000 },
  { speaker: 'patient', text: 'I once had hives from Penicillin.', delay: 2500 },

  // Family history
  { speaker: 'doctor', text: 'Does anyone in your family have gum disease or lost their teeth early?', delay: 3000 },
  { speaker: 'patient', text: 'My father had gum disease and got dentures around age 60.', delay: 2500 },

  // Topic transition
  { speaker: 'doctor', text: 'I see. Now let me ask about your daily habits.', delay: 3000 },

  // ===== Lifestyle =====
  // Oral hygiene habits
  { speaker: 'doctor', text: 'How many times a day do you brush your teeth?', delay: 2000 },
  { speaker: 'patient', text: 'Twice, morning and night.', delay: 2000 },
  { speaker: 'doctor', text: 'Do you use floss or interdental brushes?', delay: 2500 },
  { speaker: 'patient', text: 'Only occasionally.', delay: 2000 },

  // Dietary habits
  { speaker: 'doctor', text: 'Do you eat sweets often?', delay: 2000 },
  { speaker: 'patient', text: 'I drink about 3 cups of coffee with sugar daily.', delay: 2500 },
  { speaker: 'doctor', text: 'Do you snack between meals?', delay: 2000 },
  { speaker: 'patient', text: 'I sometimes have snacks during work.', delay: 2500 },

  // Smoking and alcohol
  { speaker: 'doctor', text: 'Do you smoke?', delay: 2000 },
  { speaker: 'patient', text: 'I quit 2 years ago.', delay: 2000 },
  { speaker: 'doctor', text: 'How about alcohol?', delay: 2000 },
  { speaker: 'patient', text: 'A beer with dinner sometimes.', delay: 2000 },

  // Topic transition
  { speaker: 'doctor', text: 'Now I\'d like to understand your concerns and expectations.', delay: 3000 },

  // ===== Psychosocial Aspects =====
  // Ideas
  { speaker: 'doctor', text: 'What do you think is causing your tooth pain?', delay: 2500 },
  { speaker: 'patient', text: 'I think it might be a cavity.', delay: 2000 },

  // Concerns
  { speaker: 'doctor', text: 'What concerns you most about this?', delay: 2500 },
  { speaker: 'patient', text: 'I\'m worried I might lose the tooth.', delay: 2500 },

  // Expectations
  { speaker: 'doctor', text: 'What are your expectations for today\'s visit?', delay: 2500 },
  { speaker: 'patient', text: 'I hope you can stop the pain and save my tooth if possible.', delay: 3000 },

  // ===== Summary and Closing =====
  // Summary confirmation
  { speaker: 'doctor', text: 'Let me confirm what you\'ve told me. You have throbbing pain in your lower right back tooth that started 3 days ago, gets worse with cold and when biting, and rates 8 out of 10. Is that correct?', delay: 4000 },
  { speaker: 'patient', text: 'Yes, that\'s right.', delay: 2000 },

  // Check for additional concerns
  { speaker: 'doctor', text: 'Is there anything else you\'d like to tell me or ask?', delay: 2500 },
  { speaker: 'patient', text: 'No, I think that covers everything.', delay: 2000 },

  // Transition to examination
  { speaker: 'doctor', text: 'Thank you. Now let\'s proceed with the examination. I\'ll explain what I\'m doing as we go.', delay: 3000 },
  { speaker: 'patient', text: 'Okay, thank you.', delay: 2000 }
];

// Shortened version (for practice)
export const shortImprovedDemoDialoguesEn: DemoDialogue[] = [
  // Introduction
  { speaker: 'doctor', text: 'Hello. I\'m Dr. Tanaka.', delay: 2000 },
  { speaker: 'patient', text: 'Hello. Nice to meet you.', delay: 2000 },
  { speaker: 'doctor', text: 'May I confirm your name?', delay: 2000 },
  { speaker: 'patient', text: 'I\'m Taro Yamada.', delay: 2000 },
  { speaker: 'doctor', text: 'I\'m going to ask about your symptoms. Is that alright?', delay: 3000 },
  { speaker: 'patient', text: 'Yes.', delay: 1500 },

  // Chief complaint
  { speaker: 'doctor', text: 'What brings you in today?', delay: 2000 },
  { speaker: 'patient', text: 'I have a toothache.', delay: 2000 },
  { speaker: 'doctor', text: 'When did it start?', delay: 2000 },
  { speaker: 'patient', text: 'Three days ago.', delay: 2000 },

  // Lifestyle
  { speaker: 'doctor', text: 'How often do you brush your teeth?', delay: 2500 },
  { speaker: 'patient', text: 'Twice a day, morning and night.', delay: 2000 },

  // Psychosocial aspects
  { speaker: 'doctor', text: 'Do you have any preferences for treatment?', delay: 2500 },
  { speaker: 'patient', text: 'I\'d prefer to keep the tooth if possible.', delay: 2500 },

  // Summary
  { speaker: 'doctor', text: 'So you have pain in your tooth that started 3 days ago. Is that correct?', delay: 3000 },
  { speaker: 'patient', text: 'Yes, that\'s right.', delay: 2000 },
  { speaker: 'doctor', text: 'Let\'s proceed with the examination.', delay: 2500 },
  { speaker: 'patient', text: 'Thank you.', delay: 2000 }
];