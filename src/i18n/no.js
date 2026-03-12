// ─── Norsk (bokmål) ───────────────────────────────────────────────────────────
// Preliminary translation — corrections still to be made.

const no = {

  // ── Header ──────────────────────────────────────────────────────────────────
  appTitle:        '♩ METRONOMICON',
  appSubtitle:     'NOTESTYRT METRONOM',
  btnScore:        'NOTE',
  btnThemeDark:    '☀',
  btnThemeLight:   '🌙',
  btnThemeTitleToDaylight: 'Bytt til lyst tema',
  btnThemeTitleToNight:    'Bytt til mørkt tema',
  btnHelp:         '?',
  flashLabelMeas:  'TAKT',
  flashLabelBeat:  'SLAG',
  flashLabelUnit:  'DELSLAG',

  // ── Controls row 1 ──────────────────────────────────────────────────────────
  btnPlay:         '▶',
  btnStop:         '◼',
  labelNow:        'NÅ',
  labelMeasure:    'T.',
  labelMeasureShort: 't.',
  labelCountIn:    'OPPSLAG',
  labelOnRepeat:   'VED REPETISJON',
  countInDenom4:   '4-deler',
  countInDenom8:   '8-deler',

  // ── Controls row 2 ──────────────────────────────────────────────────────────
  labelSubdivide:  'UNDERDELING',
  subdivOptions: [
    'Bare pulsslag',
    '4-deler',
    '8-deler',
    '16-deler',
    '32-deler',
  ],
  labelTempo:      'TEMPO',
  labelBpm:        'slag/min',
  labelBt:         'BT',

  // ── Pattern visualiser ──────────────────────────────────────────────────────
  labelPattern:    'RYTME',
  patternClicks:   (n) => `${n} klikk`,

  // ── Start / loop row ────────────────────────────────────────────────────────
  labelStart:      'START',
  labelLoopEnd:    'SLUTT',
  btnClearLoop:    'SLETT SLØYFE',
  loopRange:       (s, e) => `↺ t.${s}–${e}`,
  startAt:         (m)    => `start t.${m}`,

  // ── Timeline ─────────────────────────────────────────────────────────────────
  timelineHintDesktop: 'TIDSLINJE · klikk = sett start · dra = sløyfe · shift-klikk = sett sløyfeslutt',
  timelineHintMobile:  'TIDSLINJE · trykk = sett start · hold+dra = sløyfe · dra = forskyv',


  // ── Eksempelnoter ───────────────────────────────────────────────────────
  defaultScore: `1| 4/4 1/4=90
5| 3/4
9| 7/8 (223)
12|  # Gjentas uten stans
# Klikk «?» for flere eksempler`,

  exampleRit: `1| 4/4 1/4=160
3| rit 1/4=60
7| 1/4=60 accel 1/4=160
8| 3/4
9| 7/8 (2+2+3)  # underdeling
10| 7/8 (322)   # kortform
11| 9/8
15| 3/4 1/4=160`,

  exampleTuplet: `1: 4/4 1/4=90
3: (1+1+2[3:111])          # trioler av 4-deler
5: (1+1+[3:111]+[3:111])   # trioler av 8-deler
7: (1+1+2[5:11111])        # kvintoler
9: ([3:21])                # swing-slag (gjentas ×4)
11: ([4:31])               # punktert 8-del + 16-del (×4)
13: ([8:71])               # dobbeltpunkert 8-del + 32-del (×4)
# mønstre med pauser
15: (1+1+[3:.11]+[3:.11])  # trioler med pause på første delslag
17: (1+1+[4:..11]+[4:..11])# 8-dels pause + to 16-deler
19: (1+1+[3:1.1]+[3:1.1])  # trioler med pause på midtre delslag
21: ([3:.11]+[4:.111]+[5:.1111]+[6:.11111])
# Et særlig krevende mønster
23: 6/4 ([2:11]+[3:.11]+[2:11]+[3:.11]+2)
25:`,

  exampleStructure: `1|: 4/4 1/4=90       # |: begynn en repetisjon
8:| [A]               # :| avslutt; prøvemerke A
9|: $ 7/8 (223)       # $ = segno; ny repetisjon, odde taktart
16:|| [B]              # :|| lukker repetisjon + dobbel taktlinje
17|: 4/4               # begynn ny repetisjon
24:| @                 # avslutt repetisjon; @ = coda-hoppunkt
25| [C] 1/4=120        # ny seksjon, raskere
32| DS al Coda         # tilbake til $; ved @ hopp til Coda
33| Coda               # coda-seksjonen starter her
36||                   # slutt på note`,

  // ── Parser warnings / errors ─────────────────────────────────────────────────
  warnGroupingNotDivisible: (mn, units, num, den) =>
    `t.${mn}: grupperingselement (${units} enhet${units !== 1 ? 'er' : ''}) går ikke opp i ${num}/${den} — gruppering ignorert`,
  warnRitNeedsTarget: (mn) =>
    `t.${mn}: 'rit'/'accel' krever et sluttempo, f.eks. rit 1/4=60`,
  warnRitNoTarget: (mn) =>
    `t.${mn}: 'rit'/'accel' mangler sluttempo og etterfølgende tempomarkering`,
  warnRitNoFollowing: (mn) =>
    `t.${mn}: 'rit'/'accel' har ingen etterfølgende tempomarkering eller 'a tempo'`,
  warnCloseRepeatNoOpen: (mn) =>
    `t.${mn}: slutt repetisjon ':|' mangler tilhørende start repetisjon`,
  warnDoubleBarNoOpen: (mn) =>
    `t.${mn}: ':||' mangler tilhørende start repetisjon — bruk '||' for å avslutte stykket`,

  // ── Help modal ───────────────────────────────────────────────────────────────
  helpTitle:       '♩ METRONOMICON — HJELP',
  helpClose:       '✕',
  helpCloseHint:   'Klikk utenfor dette panelet eller trykk ✕ for å lukke.',
  helpCredits: [
    'Konsept og design: Tom Grydeland <tom.grydeland@gmail.com>',
    'Implementasjon: Claude Sonnet 4.5 & 4.6 (Anthropic), dirigert av ovennevnte',
  ],
  helpBtnPlay:      '▶',
  helpBtnPlayTitle: 'Last inn og spill',
  helpBtnCopy:      '⧉',
  helpBtnCopyTitle: 'Kopier til utklippstavle',

  helpSections: [
    { h: 'Taktarter', body: [
      'Standard: 4/4  3/4  6/8  2/2  12/8',
      'Sammensatte takter (6/8, 12/8): pulsslag = punktert firedel automatisk.',
      'Odde taktarter: legg til gruppering, f.eks.  7/8 (2+2+3)  eller  5/8 (2+3)',
      'Grupperinger huskes per taktart gjennom hele stykket.',
    ]},
    { h: 'Tempo', body: [
      'Skrives som 1/note=BPM.  Eksempler:',
      '  1/4=120   firedel = 120 slag/min',
      '  1/4.=60   punktert firedel = 60 slag/min',
      'Tempo gjelder videre til neste tempomarkering.',
    ]},
    { h: 'Partiturformat', body: [
      'Hver linje: taktnummer taktskilletegn [merke] N/D (gruppering) 1/note=BPM',
      'Alle felt unntatt taktnummer og skilletegn er valgfrie.',
      '# eller // starter en kommentar — kan etterfølge innhold på samme linje.',
      'Taktnummer i hakeparenteser → lager et merke: [12]| 4/4',
    ]},
    { h: 'Øvingssløyfe (uten sluttmarkering)', body: [
      'Utelat det siste || og stykket blir gjentatt fra t.1 kontinuerlig.',
      'Raskeste måte å terpe på et kort avsnitt — list bare de taktene',
      'du vil ha og trykk spill.',
    ], exampleKey: 'practice' },
    { h: 'Taktskilletegn', body: [
      '  |  eller  :  Vanlig taktstrek (standard)',
      '  |:           Start repetisjon',
      ' :|            Slutt repetisjon (spilles to ganger)',
      '  |:|          Repetisjon av en enkelt takt',
      '  ||           Dobbel taktstrek; siste avslutter stykket',
      '  ||:          Dobbel taktstrek + start repetisjon',
      ' :||           Slutt repetisjon + dobbel taktstrek',
      'For å starte en ny repetisjon rett etter en lukket, bruk',
      '  :| på siste takt i første repetisjon, deretter',
      '  |: på første takt i neste repetisjon.',
      'Uten || gjentar stykket fra t.1 (øvingssløyfe).',
    ]},
    { h: 'DC / DS al Fine / al Coda', body: [
      'DC al Fine    Om igjen fra start; stopp ved Fine',
      'DC al Coda    Om igjen fra start; ved @ hopp til Coda',
      'DS al Fine    Om igjen fra $ (segno); stopp ved Fine',
      'DS al Coda    Om igjen fra til $; ved @ hopp til Coda',
      'Plasser $ (segno) og @ (coda-merke) på de aktuelle taktlinjene.',
      'Coda-seksjonen spilles ikke før repetisjon.',
    ], exampleKey: 'structure' },
    { h: 'Rit / Accel', body: [
      "Legg til 'rit' eller 'accel' med et sluttempo for en jevn",
      "tempokurve. Strekker seg til neste tempomarkering eller 'a tempo'.",
      '  4| rit 1/4=60         rit denne takten ned til 60 slag/min',
      '  5| a tempo            tilbake til forrige tempo',
      '  8| 1/4=100 rit 1/4=60 nytt grunntempo, deretter rit',
      ' 12| 1/4=60            ankomst; rit fordeles over t.8-11',
      'Tempo interpoleres jevnt på hvert slag.',
    ], exampleKey: 'rit' },
    { h: 'Tupletter og rytmemønstre', body: [
      'En tuplettgruppe strekker seg over N pulsslag og deler spennet',
      'i div like deler, som kombineres til noter og pauser:',
      '  N[div:slots]',
      '  N      = pulsslag som tupletten strekker seg over (standard: 1)',
      '  div    = antall like deler spennet deles i',
      '  slots  = hvordan delene kombineres: siffer og punktum summerer til div,',
      '           siffer = note (varighet i deler), . = pause (én del)',
      '',
      'Eksempler:',
      '  [3:21]        triol: lang + kort (swingfølelse)',
      '  [3:111]       åttendedelstriol over 1 slag',
      '  2[3:111]      firedelstriol over 2 slag',
      '  [3:.11]       triol med pause på første del',
      '  [5:11111]     kvintol',
      '',
      'Snarvei for enkelt element: en gruppering med bare ett element gjentas',
      'til å fylle takten hvis det går opp.',
      '  4/4 ([3:21])  → fire swing-trioler  ([3:21]+[3:21]+[3:21]+[3:21])',
      '  6/8 (2)       → tre grupper av to åttendedeler  (hemiolaeffekt)',
    ], exampleKey: 'tuplet' },
    { h: 'Avspillingskontroller', body: [
      '▶ / ◼  Spill og stopp.',
      'OPPSLAG  Legger til oppslag før avspilling; velg antall slag og noteverdi.',
      '  VED REPETISJON: legg også til oppslag ved hver løkke- eller stykkerepetisjon.',
      'UNDERDELING  Bare pulsslag, eller underdelt til 4-deler / 8-deler / 16-deler / 32-deler.',
      '  Underklikk legges bare til der et slag kan deles likt.',
      'TEMPO velg fra 10% til 150 % av angitt tempo.',
      '☀ / 🌙  Veksle mellom mørkt og lyst tema.',
    ]},
    { h: 'Tidslinje', body: [
      'Viser hele stykket med merker, taktarter og taktlinjer.',
      'Peker: klikk → sett start · dra → sløyfe · shift-klikk → sett sløyfeslutt.',
      'Trykkskjerm: trykk → sett start · hold og dra → sløyfe · dra → forskyv.',
      'Trykk eller klikk under avspilling for å hoppe til takt.',
    ]},
    { h: 'Sløyfe', body: [
      'Definer et avsnitt avspilles gjentatte ganger (oransje markering).',
      'Endepunkter er inklusive — t.6 til t.9 spiller t.6, 7, 8, 9 og gjentar.',
      'Repetisjoner helt innenfor en sløyfe respekteres (spilles to ganger per runde).',
      'Repetisjoner som krysser sløyfens grenser ignoreres.',
    ]},
    { h: 'Tastatursnarveier', body: [
      'Mellomrom    Spill / Stopp.',
      '← / →        Flytt startposisjon én takt av gangen.',
      'Shift+→      Start sløyfe fra markør, eller utvid sløyfe.',
      'Shift+←      Minsk sløyfe (eller start sløyfe som slutter før markør).',
      'Ignoreres mens du skriver i notefeltet.',
    ]},
  ],
};

export default no;
