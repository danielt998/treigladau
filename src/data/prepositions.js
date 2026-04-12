export const PREPOSITION_SETS = [
  {
    key: 'ar',
    label: 'ar',
    meaning: 'on',
    note: 'These are very common fixed chunks in spoken Welsh: arna i, arnat ti, arno fo, and so on.',
    forms: [
      { personKey: '1sg', personLabel: '1st person singular · me', englishPrompt: 'on me', answer: 'arna i', acceptedAnswers: ['arna i', 'arnaf i'] },
      { personKey: '2sg', personLabel: '2nd person singular · you', englishPrompt: 'on you', answer: 'arnat ti', acceptedAnswers: ['arnat ti'] },
      { personKey: '3msg', personLabel: '3rd person masculine · him', englishPrompt: 'on him', answer: 'arno fo', acceptedAnswers: ['arno fo', 'arno fe'] },
      { personKey: '3fsg', personLabel: '3rd person feminine · her', englishPrompt: 'on her', answer: 'arni hi', acceptedAnswers: ['arni hi'] },
      { personKey: '1pl', personLabel: '1st person plural · us', englishPrompt: 'on us', answer: 'arnon ni', acceptedAnswers: ['arnon ni'] },
      { personKey: '2pl', personLabel: '2nd person plural / formal · you', englishPrompt: 'on you (plural/formal)', answer: 'arnoch chi', acceptedAnswers: ['arnoch chi'] },
      { personKey: '3pl', personLabel: '3rd person plural · them', englishPrompt: 'on them', answer: 'arnyn nhw', acceptedAnswers: ['arnyn nhw'] },
    ],
  },
  {
    key: 'am',
    label: 'am',
    meaning: 'about',
    note: 'This pattern is useful for saying who or what something is about: amdana i, amdano fo, amdanyn nhw.',
    forms: [
      { personKey: '1sg', personLabel: '1st person singular · me', englishPrompt: 'about me', answer: 'amdana i', acceptedAnswers: ['amdana i', 'amdanaf i'] },
      { personKey: '2sg', personLabel: '2nd person singular · you', englishPrompt: 'about you', answer: 'amdanat ti', acceptedAnswers: ['amdanat ti'] },
      { personKey: '3msg', personLabel: '3rd person masculine · him', englishPrompt: 'about him', answer: 'amdano fo', acceptedAnswers: ['amdano fo', 'amdano fe'] },
      { personKey: '3fsg', personLabel: '3rd person feminine · her', englishPrompt: 'about her', answer: 'amdani hi', acceptedAnswers: ['amdani hi'] },
      { personKey: '1pl', personLabel: '1st person plural · us', englishPrompt: 'about us', answer: 'amdanon ni', acceptedAnswers: ['amdanon ni'] },
      { personKey: '2pl', personLabel: '2nd person plural / formal · you', englishPrompt: 'about you (plural/formal)', answer: 'amdanoch chi', acceptedAnswers: ['amdanoch chi'] },
      { personKey: '3pl', personLabel: '3rd person plural · them', englishPrompt: 'about them', answer: 'amdanyn nhw', acceptedAnswers: ['amdanyn nhw'] },
    ],
  },
  {
    key: 'at',
    label: 'at',
    meaning: 'to / at',
    note: 'These forms often show up when talking about movement or direction towards someone: ata i, ato fo, atyn nhw.',
    forms: [
      { personKey: '1sg', personLabel: '1st person singular · me', englishPrompt: 'to me', answer: 'ata i', acceptedAnswers: ['ata i'] },
      { personKey: '2sg', personLabel: '2nd person singular · you', englishPrompt: 'to you', answer: 'atat ti', acceptedAnswers: ['atat ti'] },
      { personKey: '3msg', personLabel: '3rd person masculine · him', englishPrompt: 'to him', answer: 'ato fo', acceptedAnswers: ['ato fo', 'ato fe'] },
      { personKey: '3fsg', personLabel: '3rd person feminine · her', englishPrompt: 'to her', answer: 'ati hi', acceptedAnswers: ['ati hi'] },
      { personKey: '1pl', personLabel: '1st person plural · us', englishPrompt: 'to us', answer: 'aton ni', acceptedAnswers: ['aton ni'] },
      { personKey: '2pl', personLabel: '2nd person plural / formal · you', englishPrompt: 'to you (plural/formal)', answer: 'atoch chi', acceptedAnswers: ['atoch chi'] },
      { personKey: '3pl', personLabel: '3rd person plural · them', englishPrompt: 'to them', answer: 'atyn nhw', acceptedAnswers: ['atyn nhw'] },
    ],
  },
  {
    key: 'i',
    label: 'i',
    meaning: 'to / for',
    note: 'In everyday Welsh, this set mixes simple pronoun forms like i fi / i ti with special forms like iddo fo / iddi hi / iddyn nhw.',
    forms: [
      { personKey: '1sg', personLabel: '1st person singular · me', englishPrompt: 'for me', answer: 'i fi', acceptedAnswers: ['i fi'] },
      { personKey: '2sg', personLabel: '2nd person singular · you', englishPrompt: 'for you', answer: 'i ti', acceptedAnswers: ['i ti'] },
      { personKey: '3msg', personLabel: '3rd person masculine · him', englishPrompt: 'for him', answer: 'iddo fo', acceptedAnswers: ['iddo fo', 'iddo fe'] },
      { personKey: '3fsg', personLabel: '3rd person feminine · her', englishPrompt: 'for her', answer: 'iddi hi', acceptedAnswers: ['iddi hi'] },
      { personKey: '1pl', personLabel: '1st person plural · us', englishPrompt: 'for us', answer: 'i ni', acceptedAnswers: ['i ni'] },
      { personKey: '2pl', personLabel: '2nd person plural / formal · you', englishPrompt: 'for you (plural/formal)', answer: 'i chi', acceptedAnswers: ['i chi'] },
      { personKey: '3pl', personLabel: '3rd person plural · them', englishPrompt: 'for them', answer: 'iddyn nhw', acceptedAnswers: ['iddyn nhw'] },
    ],
  },
]

export const PREPOSITION_ITEMS = PREPOSITION_SETS.flatMap(set =>
  set.forms.map(form => ({
    id: `${set.key}:${form.personKey}`,
    preposition: set.label,
    familyKey: set.key,
    familyLabel: `Preposition: ${set.label} · ${set.meaning}`,
    meaning: set.meaning,
    note: set.note,
    ...form,
  })),
)
