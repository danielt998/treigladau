export const MUTATION_TYPES = {
  soft: {
    label: 'Treiglad Meddal',
    english: 'Soft Mutation',
    color: '#2e7d32',
  },
  aspirate: {
    label: 'Treiglad Llaes',
    english: 'Aspirate Mutation',
    color: '#1565c0',
  },
  nasal: {
    label: 'Treiglad Trwynol',
    english: 'Nasal Mutation',
    color: '#6a1b9a',
  },
}

// Words are grouped by initial consonant.
// Each entry has: the base word, its English meaning, and whichever
// mutation forms apply (soft / aspirate / nasal).
export const words = [
  // ── b  →  soft: f   nasal: m ───────────────────────────────────────
  { word: 'bara',    meaning: 'bread',           mutations: { soft: 'fara',    nasal: 'mara' } },
  { word: 'bachgen', meaning: 'boy',             mutations: { soft: 'fachgen', nasal: 'machgen' } },
  { word: 'bwrdd',   meaning: 'table',           mutations: { soft: 'fwrdd',   nasal: 'mwrdd' } },
  { word: 'byw',     meaning: 'to live / alive', mutations: { soft: 'fyw',     nasal: 'myw' } },
  { word: 'bro',     meaning: 'region / vale',   mutations: { soft: 'fro',     nasal: 'mro' } },

  // ── c  →  soft: g   aspirate: ch   nasal: ngh ──────────────────────
  { word: 'cath',   meaning: 'cat',           mutations: { soft: 'gath',   aspirate: 'chath',   nasal: 'nghath' } },
  { word: 'car',    meaning: 'car',           mutations: { soft: 'gar',    aspirate: 'char',    nasal: 'nghar' } },
  { word: 'ci',     meaning: 'dog',           mutations: { soft: 'gi',     aspirate: 'chi',     nasal: 'nghi' } },
  { word: 'calon',  meaning: 'heart',         mutations: { soft: 'galon',  aspirate: 'chalon',  nasal: 'nghalon' } },
  { word: 'coed',   meaning: 'trees / wood',  mutations: { soft: 'goed',   aspirate: 'choed',   nasal: 'nghoed' } },
  { word: 'castell',meaning: 'castle',        mutations: { soft: 'gastell',aspirate: 'chastell',nasal: 'nghastell' } },

  // ── d  →  soft: dd   nasal: n ────────────────────────────────────────
  { word: 'dafad',  meaning: 'sheep',   mutations: { soft: 'ddafad', nasal: 'nafad' } },
  { word: 'du',     meaning: 'black',   mutations: { soft: 'ddu',    nasal: 'nu' } },
  { word: 'dyn',    meaning: 'man',     mutations: { soft: 'ddyn',   nasal: 'nyn' } },
  { word: 'drws',   meaning: 'door',    mutations: { soft: 'ddrws',  nasal: 'nrws' } },
  { word: 'dŵr',    meaning: 'water',   mutations: { soft: 'ddŵr',   nasal: 'nŵr' } },

  // ── g  →  soft: (disappears)   nasal: ng ───────────────────────────
  { word: 'gardd',  meaning: 'garden',          mutations: { soft: 'ardd',  nasal: 'ngardd' } },
  { word: 'gwin',   meaning: 'wine',            mutations: { soft: 'win',   nasal: 'ngwin' } },
  { word: 'gwlad',  meaning: 'country / land',  mutations: { soft: 'wlad',  nasal: 'ngwlad' } },
  { word: 'glas',   meaning: 'blue',            mutations: { soft: 'las',   nasal: 'nglas' } },
  { word: 'gair',   meaning: 'word',            mutations: { soft: 'air',   nasal: 'ngair' } },

  // ── ll  →  soft: l ────────────────────────────────────────────────────
  { word: 'llaeth', meaning: 'milk',           mutations: { soft: 'laeth' } },
  { word: 'llaw',   meaning: 'hand',           mutations: { soft: 'law' } },
  { word: 'llyfr',  meaning: 'book',           mutations: { soft: 'lyfr' } },
  { word: 'llun',   meaning: 'picture / photo',mutations: { soft: 'lun' } },
  { word: 'llais',  meaning: 'voice',          mutations: { soft: 'lais' } },
  { word: 'llong',  meaning: 'ship',           mutations: { soft: 'long' } },

  // ── m  →  soft: f ────────────────────────────────────────────────────
  { word: 'mam',    meaning: 'mother',     mutations: { soft: 'fam' } },
  { word: 'mawr',   meaning: 'big',        mutations: { soft: 'fawr' } },
  { word: 'menyw',  meaning: 'woman',      mutations: { soft: 'fenyw' } },
  { word: 'merch',  meaning: 'daughter / girl', mutations: { soft: 'ferch' } },
  { word: 'mynydd', meaning: 'mountain',   mutations: { soft: 'fynydd' } },
  { word: 'mis',    meaning: 'month',      mutations: { soft: 'fis' } },

  // ── p  →  soft: b   aspirate: ph   nasal: mh ─────────────────────────
  { word: 'pen',     meaning: 'head',    mutations: { soft: 'ben',     aspirate: 'phen',     nasal: 'mhen' } },
  { word: 'peth',    meaning: 'thing',   mutations: { soft: 'beth',    aspirate: 'pheth',    nasal: 'mheth' } },
  { word: 'pont',    meaning: 'bridge',  mutations: { soft: 'bont',    aspirate: 'phont',    nasal: 'mhont' } },
  { word: 'plentyn', meaning: 'child',   mutations: { soft: 'blentyn', aspirate: 'phlentyn', nasal: 'mhlentyn' } },
  { word: 'pysgod',  meaning: 'fish',    mutations: { soft: 'bysgod',  aspirate: 'physgod',  nasal: 'mhysgod' } },
  { word: 'pridd',   meaning: 'soil',    mutations: { soft: 'bridd',   aspirate: 'phridd',   nasal: 'mhridd' } },

  // ── rh  →  soft: r ────────────────────────────────────────────────────
  { word: 'rhan',    meaning: 'part',     mutations: { soft: 'ran' } },
  { word: 'rhad',    meaning: 'cheap',    mutations: { soft: 'rad' } },
  { word: 'rhif',    meaning: 'number',   mutations: { soft: 'rif' } },
  { word: 'rhieni',  meaning: 'parents',  mutations: { soft: 'rieni' } },
  { word: 'rhyfel',  meaning: 'war',      mutations: { soft: 'ryfel' } },

  // ── t  →  soft: d   aspirate: th   nasal: nh ─────────────────────────
  { word: 'tad',    meaning: 'father',   mutations: { soft: 'dad',    aspirate: 'thad',    nasal: 'nhad' } },
  { word: 'tref',   meaning: 'town',     mutations: { soft: 'dref',   aspirate: 'thref',   nasal: 'nhref' } },
  { word: 'tŷ',     meaning: 'house',    mutations: { soft: 'dy',     aspirate: 'thy',     nasal: 'nhy' } },
  { word: 'taith',  meaning: 'journey',  mutations: { soft: 'daith',  aspirate: 'thaith',  nasal: 'nhaith' } },
  { word: 'tri',    meaning: 'three',    mutations: { soft: 'dri',    aspirate: 'thri',    nasal: 'nhri' } },
  { word: 'tlawd',  meaning: 'poor',     mutations: { soft: 'dlawd',  aspirate: 'thlawd',  nasal: 'nhlawd' } },
]
