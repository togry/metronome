// ─── Norsk (bokmål) ───────────────────────────────────────────────────────────
// Preliminary translation — corrections still to be made.

const no = {

  // ── Header ──────────────────────────────────────────────────────────────────
  appTitle:        '♩ METRONOMICON',
  appSubtitle:     'NOTESTYRT METRONOM',
  tooltipReset:    'Nullstill partitur og innstillinger',
  confirmReset:    'Nullstille partituret og alle innstillinger? Det lagrede partituret blir forkastet.',
  btnScore:        'NOTE',
  btnThemeDark:    '☀',
  btnThemeLight:   '🌙',
  btnThemeTitleToDaylight: 'Bytt til lyst tema',
  btnThemeTitleToNight:    'Bytt til mørkt tema',
  btnScoreHelpTitle: 'Hjelp til partiturformatet',
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
    'Per takt',
    'Bare pulsslag',
    '4-deler',
    '8-deler',
    '16-deler',
    '32-deler',
  ],
  labelTempo:      'TEMPO',
  tooltipTempoReset: 'Tilbake til angitt tempo (100 %)',
  tooltipTempoCurve: 'Tempoet endrer seg — tallet er angitt tempo, ikke det som spilles',
  errClipboard:    'Kunne ikke lese utklippstavlen — lim inn manuelt og trykk PARSE',
  labelBpm:        'slag/min',
  labelBt:         'BT',
  labelBtAuto:     'auto',
  tooltipBtAuto:   'Bruk forsinkelsen enheten oppgir',

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

  exampleStructure: `1|: 4/4 1/4=90        # |: begynn en repetisjon
8:|                   # :| avslutt
9|: [A] $ 7/8 (223)   # $ = segno; ny repetisjon, ny taktart; prøvemerke A
16:|                  # slutt repetisjon
17||: [B] 4/4         # begynn ny repetisjon, dobbel taktstrek; prøvemerke B
24:|                  # slutt repetisjon
25| [C] 1/4=120       # prøvemerke C, nytt tempo
28| @                 # coda-hoppunkt
32| DS al Coda        # tilbake til $; ved @ hopp til Coda
33| Coda              # coda begynner her
36||                  # slutt på stykke`,

  // ── Parser warnings / errors ─────────────────────────────────────────────────
  errMeasureOrder: (line, mn, prev) =>
    `linje ${line}: t.${mn} kommer etter t.${prev} \u2014 taktnumrene m\u00E5 \u00F8ke nedover i partituret`,
  errTooManyMeasures: (mn, max) =>
    `t.${mn}: taktnummeret overstiger grensen på ${max} — se etter en skrivefeil`,
  warnGroupingInvalid: (mn) =>
    `t.${mn}: ugyldig gruppering — sifrene i en tuplett må summere til div; gruppering ignorert`,
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
  warnNestedRepeat: (mn, openMn) =>
    `t.${mn}: starter en repetisjon mens den fra t.${openMn} fortsatt er åpen — nøstede repetisjoner er ikke vanlig notasjon; bruk D.C./D.S. for repetisjon i større skala`,

  // ── Help modal ───────────────────────────────────────────────────────────────
  helpTitle:       '♩ METRONOMICON — HJELP',
  helpClose:       '✕',
  helpCloseHint:   'Klikk utenfor dette panelet eller trykk ✕ for å lukke.',
  helpCredits: [
    'Konsept og design: Tom Grydeland <tom.grydeland@gmail.com>',
    'Implementasjon: Claude (Anthropic) \u2014 Sonnet 4.5 & 4.6, deretter Opus 5,',
    '  dirigert av ovennevnte',
  ],
  helpBtnPlay:      '▶',
  helpBtnPlayTitle: 'Last inn og spill',
  helpBtnCopy:      '⧉',
  helpBtnCopyTitle: 'Kopier til utklippstavle',

  // ── Hovedhjelp (? i toppraden) ───────────────────────────────────────────────
  helpSections: [
    { h: 'Avspilling', body: [
      '\u25B6 / \u25FC  Spill og stopp.',
      'OPPSLAG  Legger til opptelling f\u00F8r avspilling; velg antall og noteverdi.',
      '  VED REPETISJON: ogs\u00E5 opptelling hver gang en sl\u00F8yfe gjentas.',
      'UNDERDELING  \u00C9n gang per takt, bare pulsslag, eller underdelt til',
      '  4-deler / 8-deler / 16-deler / 32-deler.',
      '  Underslag legges bare til der slaget deles j\u00E6vnt.',
      'TEMPO  10\u2013150 % av angitt tempo.',
      '  Trykk p\u00E5 prosenten for \u00E5 g\u00E5 tilbake til 100 %.',
      'BT  Forsinker blinkene slik at de passer med Bluetooth-lyden. Gr\u00F8nn',
      '  n\u00E5r verdien kommer fra enheten, bl\u00E5 n\u00E5r du setter den selv; \u21BA gir',
      '  den tilbake til enheten.',
      '\u2600 / \uD83C\uDF19  Veksle mellom m\u00F8rkt og lyst tema.',
      '',
      'Partituret og alle innstillinger huskes til neste gang.',
      '\u2669 METRONOMICON  Klikk p\u00E5 tittelen \u2014 eller hold den inne p\u00E5',
      '  ber\u00F8ringsskjerm \u2014 for \u00E5 nullstille partitur og innstillinger.',
    ]},
    { h: 'Visning', body: [
      'De tre prikkene blinker slaget: takt, pulsslag, underdeling.',
      'RYTME viser \u00E9n prikk per klikk i takten, st\u00F8rrelse etter vekt;',
      '  \u00E5pne prikker er pauser. Ved stopp vises takten mark\u00F8ren st\u00E5r p\u00E5,',
      '  s\u00E5 du kan bla gjennom stykket med piltastene.',
      'Taktvisningen viser takt, taktart og gjeldende pr\u00F8vemerke. \u2198 eller',
      '  \u2197 ved tempoet betyr at en tempokurve g\u00E5r, og at tallet er angitt',
      '  tempo, ikke det som spilles.',
    ]},
    { h: 'Tidslinje', body: [
      'Viser hele stykket med merker, taktarter og taktlinjer.',
      'Peker: klikk \u2192 sett start \u00B7 dra \u2192 sl\u00F8yfe \u00B7 shift-klikk \u2192 sl\u00F8yfeslutt.',
      'Ber\u00F8ring: trykk \u2192 sett start \u00B7 hold og dra \u2192 sl\u00F8yfe \u00B7 dra \u2192 forskyv.',
      'Trykk eller klikk under avspilling for \u00E5 hoppe umiddelbart.',
      'Mark\u00F8ren glir gjennom hver takt, og blir st\u00E5ende dempet der den',
      '  stoppet til du flytter startpunktet.',
    ]},
    { h: 'Sl\u00F8yfe', body: [
      'Merk et omr\u00E5de som skal gjentas under avspilling (oransje).',
      'Sluttakten er med \u2014 t.6 til t.9 spiller t.6, 7, 8, 9 og begynner p\u00E5 nytt.',
      'Repetisjoner helt inne i sl\u00F8yfen tas med (spilles to ganger per runde).',
      'Repetisjoner som krysser sl\u00F8yfegrensen ignoreres.',
    ]},
    { h: 'Hurtigtaster', body: [
      'Mellomrom    Spill / stopp.',
      '\u2190 / \u2192        Flytt startpunktet \u00E9n takt.',
      'Shift+\u2192      Start en sl\u00F8yfe fra mark\u00F8ren, eller utvid slutten.',
      'Shift+\u2190      Kort inn sl\u00F8yfen (eller start en som slutter f\u00F8r mark\u00F8ren).',
      'Ignoreres mens du skriver i partituret.',
    ]},
    { h: 'Partiturformat \u2014 det grunnleggende', body: [
      'Hver linje sier hva som endres i en takt. Bare taktnummeret og',
      'skilletegnet etter det m\u00E5 v\u00E6re med.',
      '  1| 4/4 1/4=90    # 4/4 med firedel = 90, fra t.1',
      '  5| 3/4           # ny taktart, samme tempo',
      '  9| 7/8 (2+2+3)   # odde taktart, gruppert 2+2+3',
      ' 12| 1/4=120       # nytt tempo, samme taktart',
      ' 16||              # slutt p\u00E5 stykket',
      'Sl\u00F8yf det siste || og stykket gjentas fra t.1 \u2014 den raskeste m\u00E5ten',
      '\u00E5 terpe et avsnitt p\u00E5.',
      '# eller // starter en kommentar.',
      '',
      'Repetisjoner, D.C./D.S., tempokurver og tupletter har egen',
      'notasjon: trykk ? over partituret for hele beskrivelsen.',
    ], exampleKey: 'practice' },
  ],

  // ── Hjelp for partiturformat (? over partituret) ─────────────────────────────
  scoreHelpTitle: '\u2669 PARTITURFORMAT',
  scoreHelpSections: [
    { h: 'Partiturformat', body: [
      'Hver linje: taktnummer taktskilletegn [merke] N/D (gruppering) 1/note=BPM',
      'Alle felt unntatt taktnummer og skilletegn er valgfrie.',
      'Det som endres gjelder videre til det endres igjen.',
      '# eller // starter en kommentar \u2014 kan etterf\u00F8lge innhold p\u00E5 samme linje.',
      'Taktnummer i hakeparenteser \u2192 lager et merke: [12]| 4/4',
      'Tekst som ikke kan tolkes, skyggelegges i partituret.',
    ]},
    { h: 'Taktarter', body: [
      'Standard: 4/4  3/4  2/2  6/8  9/8  12/8',
      'Sammensatte takter (6/8, 9/8, 12/8): pulsslag = punktert firedel automatisk.',
      'Odde taktarter: legg til gruppering, f.eks.  7/8 (2+2+3)  eller  5/8 (2+3)',
      'Grupperinger huskes per taktart gjennom hele stykket.',
    ]},
    { h: 'Tempo', body: [
      'Skrives som 1/note=BPM.  Eksempler:',
      '  1/4=120   # firedel = 120 slag/min',
      '  1/4.=60   # punktert firedel = 60 slag/min',
      'Tempo gjelder videre til neste tempomarkering.',
    ]},
    { h: '\u00D8vingssl\u00F8yfe (uten sluttmarkering)', body: [
      'Utelat det siste || og stykket blir gjentatt fra t.1 kontinuerlig.',
      'Raskeste m\u00E5te \u00E5 terpe p\u00E5 et kort avsnitt \u2014 list bare de taktene',
      'du vil ha og trykk spill.',
    ], exampleKey: 'practice' },
    { h: 'Taktskilletegn', body: [
      '  |  eller  :  # Vanlig taktstrek (standard)',
      '  |:           # Start repetisjon',
      ' :|            # Slutt repetisjon (spilles to ganger)',
      '  |:|          # Repetisjon av en enkelt takt',
      '  ||           # Dobbel taktstrek; siste avslutter stykket',
      '  ||:          # Dobbel taktstrek + start repetisjon',
      ' :||           # Slutt repetisjon + dobbel taktstrek',
      'For \u00E5 starte en ny repetisjon rett etter en lukket, bruk',
      '  :| p\u00E5 siste takt i f\u00F8rste repetisjon, deretter',
      '  |: p\u00E5 f\u00F8rste takt i neste repetisjon.',
      'Uten || gjentar stykket fra t.1 (\u00F8vingssl\u00F8yfe).',
    ]},
    { h: 'DC / DS al Fine / al Coda', body: [
      '  DC al Fine    # Om igjen fra start; stopp ved Fine',
      '  DC al Coda    # Om igjen fra start; ved @ hopp til Coda',
      '  DS al Fine    # Om igjen fra $ (segno); stopp ved Fine',
      '  DS al Coda    # Om igjen fra $; ved @ hopp til Coda',
      'Sett $ (segno) og @ (coda-hoppunkt) p\u00E5 sine taktlinjer.',
      'Coda-delen hoppes over f\u00F8rste gang.',
      'Repetisjoner tas ikke p\u00E5 veien tilbake (senza replica).',
    ], exampleKey: 'structure' },
    { h: 'Rit / Accel', body: [
      'Enkleste form: rit eller accel i takten der kurven begynner, og',
      'tempoet den ender p\u00E5 i en senere takt.',
      '  1| 4/4 1/4=120',
      '  3| rit                 # begynn \u00E5 sakne her',
      '  7| 1/4=60              # ankomst; ritardandoet dekker t.3-6',
      '',
      'Angi sluttempoet p\u00E5 samme linje n\u00E5r det ikke er tempoet som f\u00F8lger:',
      '  4| rit 1/4=60          # rit fra denne takten, ned til 60',
      '  5| a tempo             # tilbake til tempoet f\u00F8r ritardandoet',
      "Sluttempo m\u00E5 angis n\u00E5r 'a tempo' avslutter kurven, siden det da",
      'ikke finnes noen etterf\u00F8lgende tempomarkering \u00E5 hente det fra.',
      'Tempoet endres jevnt for hvert slag, ikke \u00E9n gang per takt.',
    ], exampleKey: 'rit' },
    { h: 'Tupletter og rytmem\u00F8nstre', body: [
      'En tuplettgruppe strekker seg over N pulsslag og deler spennet',
      'i div like deler, som kombineres til noter og pauser:',
      '  N[div:slots]',
      '  N      = pulsslag som tupletten strekker seg over (standard: 1)',
      '  div    = antall like deler spennet deles i',
      '  slots  = hvordan delene kombineres: siffer og punktum summerer til div,',
      '           siffer = note (varighet i deler), . = pause (\u00E9n del)',
      '',
      'Eksempler:',
      '  [3:21]        # triol: lang + kort (swingf\u00F8lelse)',
      '  [3:111]       # \u00E5ttendedelstriol over 1 slag',
      '  2[3:111]      # firedelstriol over 2 slag',
      '  [3:.11]       # triol med pause p\u00E5 f\u00F8rste del',
      '  [5:11111]     # kvintol',
      '',
      'Snarvei for enkelt element: en gruppering med bare ett element gjentas',
      'til den fyller takten, dersom den g\u00E5r opp.',
      '  4/4 ([3:21])  # \u2192 fire swing-slag  ([3:21]+[3:21]+[3:21]+[3:21])',
      '  6/8 (2)       # \u2192 tre grupper med to \u00E5ttedeler  (hemiol)',
      '',
      'Vekslende underdeling: list alternativene, s\u00E5 g\u00E5r de i sl\u00F8yfe fra',
      'takt til takt.',
      '  5/8 (23,32)   # t.1 = 2+3, t.2 = 3+2, t.3 = 2+3 ...',
      '  Det samme:    (2+3,3+2)   (23),(32)   (2+3),(3+2)',
      '  Fri lengde:   7/8 (223,232,322) gjentas hver tredje takt',
      'Sl\u00F8yfen telles fra takten der den st\u00E5r og l\u00F8per videre gjennom',
      'taktene etter; skriver du en gruppering igjen, starter den p\u00E5 nytt.',
    ], exampleKey: 'tuplet' },
  ],
};

export default no;
