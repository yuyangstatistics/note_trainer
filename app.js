const WHITE_NOTES = ["C", "D", "E", "F", "G", "A", "B"];
const NATURAL_SEMITONES = { C: 0, D: 2, E: 4, F: 5, G: 7, A: 9, B: 11 };
const WHITE_INDEX_TO_SEMITONE = [0, 2, 4, 5, 7, 9, 11];
const BLACK_POSITIONS = new Map([
  [0, 1],
  [1, 3],
  [3, 6],
  [4, 8],
  [5, 10],
]);

const PIANO_START_MIDI = 21;
const PIANO_END_MIDI = 108;
const FULL_WHITE_KEYS = buildFullWhiteKeys();
const FULL_BLACK_KEYS = buildFullBlackKeys();
const NOTATION_SYSTEMS = ["scientific", "helmholtz"];
const SUBSCRIPT_DIGITS = ["₀", "₁", "₂", "₃", "₄", "₅", "₆", "₇", "₈", "₉"];
const SUPERSCRIPT_DIGITS = ["⁰", "¹", "²", "³", "⁴", "⁵", "⁶", "⁷", "⁸", "⁹"];
const SOLFEGE_TONICS = ["C", "D", "E", "F", "G", "A", "B"];
const MAJOR_SCALE_INTERVALS = [0, 2, 4, 5, 7, 9, 11, 12];
const SOLFEGE_DEGREES = ["1", "2", "3", "4", "5", "6", "7", "i"];
const STAFF_RANGES = {
  high: { clefs: ["treble"], minMidi: 53, maxMidi: 88 },
  low: { clefs: ["bass"], minMidi: 33, maxMidi: 67 },
  both: { clefs: ["treble", "bass"], minMidi: 33, maxMidi: 88 },
};
const STAFF_MIN_STEP = -6;
const STAFF_MAX_STEP = 14;
const STAFF_CLEFS = {
  treble: {
    symbol: "𝄞",
    bottomLine: { letter: "E", octave: 4 },
    anchor: { letter: "G", octave: 4 },
    label: "treble clef",
  },
  bass: {
    symbol: "𝄢",
    bottomLine: { letter: "G", octave: 2 },
    anchor: { letter: "F", octave: 3 },
    label: "bass clef",
  },
};
const STAFF_WRITE_COUNT = 8;
const SMUFL_G_CLEF = "\uE050";
const SMUFL_F_CLEF = "\uE062";
const SMUFL_WHOLE_NOTE = "\uE0A2";
const SMUFL_STAFF_5_LINES_WIDE = "\uE01A";
const AUTO_ADVANCE_CORRECT_DELAY_MS = 500;
const AUTO_ADVANCE_WRONG_DELAY_MS = 1500;
const STAFF_OCTAVE_MARKS = [
  { label: "8va", shift: 12, placement: "above", clefs: ["treble"] },
  { label: "15ma", shift: 24, placement: "above", clefs: ["treble"] },
  { label: "8vb", shift: -12, placement: "below", clefs: ["bass"] },
  { label: "15mb", shift: -24, placement: "below", clefs: ["bass"] },
];

const state = {
  target: null,
  choices: [],
  acceptedInputs: [],
  intervalItems: [],
  staffItems: [],
  solfegeMap: null,
  answered: false,
  streak: 0,
  autoAdvanceTimer: null,
};

const el = {
  prompt: document.getElementById("prompt"),
  hint: document.getElementById("hint"),
  keyboard: document.getElementById("keyboard"),
  intervalQuiz: document.getElementById("intervalQuiz"),
  solfegeMap: document.getElementById("solfegeMap"),
  staffQuiz: document.getElementById("staffQuiz"),
  solfegePanel: document.getElementById("solfegePanel"),
  choices: document.getElementById("choices"),
  typedAnswer: document.getElementById("typedAnswer"),
  answerInput: document.getElementById("answerInput"),
  submitAnswer: document.getElementById("submitAnswer"),
  feedback: document.getElementById("feedback"),
  next: document.getElementById("nextButton"),
  streak: document.getElementById("streak"),
  advanced: document.getElementById("advancedToggle"),
  review: document.getElementById("reviewToggle"),
  octaveMarks: document.getElementById("octaveMarksToggle"),
  autoAdvance: document.getElementById("autoAdvanceToggle"),
};

function modulo(value, size) {
  return ((value % size) + size) % size;
}

function shuffle(items) {
  const result = [...items];
  for (let i = result.length - 1; i > 0; i -= 1) {
    const j = Math.floor(Math.random() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

function accidentalPrefix(offset) {
  if (offset === -2) return "bb";
  if (offset === -1) return "b";
  if (offset === 0) return "";
  if (offset === 1) return "#";
  return "x";
}

function accidentalOffset(name) {
  const accidental = name.slice(0, -1);
  if (accidental === "bb") return -2;
  if (accidental === "b") return -1;
  if (accidental === "#") return 1;
  if (accidental === "x") return 2;
  return 0;
}

function displayName(name) {
  const letter = name.at(-1);
  const accidental = name.slice(0, -1);
  if (accidental === "bb") return `𝄫${letter}`;
  if (accidental === "b") return `♭${letter}`;
  if (accidental === "#") return `♯${letter}`;
  if (accidental === "x") return `𝄪${letter}`;
  return letter;
}

function displayPitchName(name, letterCase = "upper") {
  const rawLetter = name.at(-1);
  const letter = letterCase === "lower" ? rawLetter.toLowerCase() : rawLetter;
  const accidental = name.slice(0, -1);
  if (accidental === "bb") return `𝄫${letter}`;
  if (accidental === "b") return `♭${letter}`;
  if (accidental === "#") return `♯${letter}`;
  if (accidental === "x") return `𝄪${letter}`;
  return letter;
}

function plainPitchName(name, letterCase = "upper") {
  const rawLetter = name.at(-1);
  const letter = letterCase === "lower" ? rawLetter.toLowerCase() : rawLetter;
  return `${name.slice(0, -1)}${letter}`;
}

function suffixPitchName(name, letterCase = "upper") {
  const rawLetter = name.at(-1);
  const letter = letterCase === "lower" ? rawLetter.toLowerCase() : rawLetter;
  return `${letter}${name.slice(0, -1)}`;
}

function digitString(value, digits) {
  return String(value).split("").map((digit) => digits[Number(digit)]).join("");
}

function displayList(names) {
  return names.map(displayName).join(", ");
}

function nameSemitone(name) {
  const letter = name.at(-1);
  return modulo(NATURAL_SEMITONES[letter] + accidentalOffset(name), 12);
}

function midiPitchClass(midi) {
  return modulo(midi, 12);
}

function spellingsForSemitone(semitone, advanced) {
  const offsets = advanced ? [-2, -1, 0, 1, 2] : [-1, 0, 1];
  const names = [];

  for (const letter of WHITE_NOTES) {
    for (const offset of offsets) {
      if (modulo(NATURAL_SEMITONES[letter] + offset, 12) === semitone) {
        names.push(`${accidentalPrefix(offset)}${letter}`);
      }
    }
  }

  return names.sort((a, b) => {
    const order = ["", "#", "b", "x", "bb"];
    const aPrefix = a.slice(0, -1);
    const bPrefix = b.slice(0, -1);
    return order.indexOf(aPrefix) - order.indexOf(bPrefix) || a.localeCompare(b);
  });
}

function keyInfo(index) {
  const semitone = index % 12;
  const whitePos = WHITE_INDEX_TO_SEMITONE.indexOf(semitone);

  if (whitePos >= 0) {
    return {
      index,
      semitone,
      isBlack: false,
      whiteIndex: Math.floor(index / 12) * 7 + whitePos,
    };
  }

  for (const [position, value] of BLACK_POSITIONS.entries()) {
    if (value === semitone) {
      return {
        index,
        semitone,
        isBlack: true,
        blackPosition: Math.floor(index / 12) * 7 + position,
      };
    }
  }

  return null;
}

function fullKeyInfo(midi) {
  const semitone = midiPitchClass(midi);
  const whiteIndex = FULL_WHITE_KEYS.findIndex((key) => key.midi === midi);
  if (whiteIndex >= 0) {
    return {
      midi,
      semitone,
      isBlack: false,
      whiteIndex,
    };
  }

  const blackIndex = FULL_BLACK_KEYS.findIndex((key) => key.midi === midi);
  return {
    midi,
    semitone,
    isBlack: true,
    blackIndex,
  };
}

function buildFullWhiteKeys() {
  const keys = [];
  for (let midi = PIANO_START_MIDI; midi <= PIANO_END_MIDI; midi += 1) {
    if (WHITE_INDEX_TO_SEMITONE.includes(midiPitchClass(midi))) {
      keys.push({ midi, semitone: midiPitchClass(midi) });
    }
  }
  return keys;
}

function buildFullBlackKeys() {
  const keys = [];
  for (let midi = PIANO_START_MIDI; midi <= PIANO_END_MIDI; midi += 1) {
    const semitone = midiPitchClass(midi);
    if (!WHITE_INDEX_TO_SEMITONE.includes(semitone)) {
      const previousWhiteIndex = FULL_WHITE_KEYS.findLastIndex((key) => key.midi < midi);
      keys.push({ midi, semitone, previousWhiteIndex });
    }
  }
  return keys;
}

function randomTarget() {
  const { practiceMode } = currentSettings();
  if (practiceMode === "group-name") return randomFullTarget();

  const pool = document.querySelector("input[name='keyPool']:checked").value;
  const white = [0, 2, 4, 5, 7, 9, 11, 12, 14, 16, 17, 19, 21, 23];
  const black = [1, 3, 6, 8, 10, 13, 15, 18, 20, 22];
  const values = pool === "white" ? white : pool === "black" ? black : [...white, ...black];
  return keyInfo(values[Math.floor(Math.random() * values.length)]);
}

function randomFullTarget() {
  const pool = document.querySelector("input[name='keyPool']:checked").value;
  const values = [];

  for (let midi = PIANO_START_MIDI; midi <= PIANO_END_MIDI; midi += 1) {
    const info = fullKeyInfo(midi);
    if (pool === "white" && info.isBlack) continue;
    if (pool === "black" && !info.isBlack) continue;
    values.push(midi);
  }

  return fullKeyInfo(values[Math.floor(Math.random() * values.length)]);
}

function makeChoices(correctName, targetSemitone, advanced) {
  const allNames = [];
  for (let semitone = 0; semitone < 12; semitone += 1) {
    allNames.push(...spellingsForSemitone(semitone, advanced));
  }

  const wrong = shuffle([...new Set(allNames)].filter((name) => nameSemitone(name) !== targetSemitone));
  return shuffle([correctName, ...wrong.slice(0, 3)].map((name) => ({ text: displayName(name), noteName: name })));
}

function scientificOctave(name, midi) {
  const letter = name.at(-1);
  const raw = midi - NATURAL_SEMITONES[letter] - accidentalOffset(name);
  if (raw % 12 !== 0) return null;

  const octave = raw / 12 - 1;
  return octave >= 0 && octave <= 8 ? octave : null;
}

function notationSystemsFor(notationSystem) {
  return notationSystem === "mixed" ? NOTATION_SYSTEMS : [notationSystem];
}

function answerTextFor(name, midi, notationSystem) {
  if (notationSystem === "mixed") {
    return answerTextFor(name, midi, shuffle(NOTATION_SYSTEMS)[0]);
  }

  const octave = scientificOctave(name, midi);
  if (octave === null) return null;

  if (notationSystem === "scientific") {
    return `${displayPitchName(name)}${octave}`;
  }

  return helmholtzName(name, octave);
}

function typedAnswerTextFor(name, midi, notationSystem, formatter = plainPitchName) {
  if (notationSystem === "mixed") {
    return typedAnswerTextFor(name, midi, shuffle(NOTATION_SYSTEMS)[0], formatter);
  }

  const octave = scientificOctave(name, midi);
  if (octave === null) return null;

  if (notationSystem === "scientific") {
    return `${formatter(name)}${octave}`;
  }

  return helmholtzNameWithFormatter(name, octave, formatter);
}

function helmholtzName(name, octave) {
  return helmholtzNameWithFormatter(name, octave, displayPitchName);
}

function helmholtzNameWithFormatter(name, octave, formatter) {
  if (octave <= 1) {
    return `${formatter(name)}${digitString(2 - octave, SUBSCRIPT_DIGITS)}`;
  }

  if (octave === 2) return formatter(name);
  if (octave === 3) return formatter(name, "lower");

  return `${formatter(name, "lower")}${digitString(octave - 3, SUPERSCRIPT_DIGITS)}`;
}

function answerPoolForMidi(midi, advanced, notationSystem) {
  const answers = [];

  for (const system of notationSystemsFor(notationSystem)) {
    for (const name of spellingsForSemitone(midiPitchClass(midi), advanced)) {
      const text = answerTextFor(name, midi, system);
      if (text) answers.push({ text, noteName: name, notationSystem: system });
    }
  }

  return answers.filter((answer, index) => answers.findIndex((candidate) => candidate.text === answer.text) === index);
}

function randomAnswerForMidi(midi, advanced, notationSystem) {
  return shuffle(answerPoolForMidi(midi, advanced, notationSystem))[0];
}

function normalizeTypedAnswer(value) {
  const superscripts = new Map(SUPERSCRIPT_DIGITS.map((digit, index) => [digit, String(index)]));
  const subscripts = new Map(SUBSCRIPT_DIGITS.map((digit, index) => [digit, String(index)]));

  return [...value.trim()]
    .map((char) => {
      if (char === "♭") return "b";
      if (char === "♯") return "#";
      if (char === "𝄫") return "bb";
      if (char === "𝄪") return "x";
      if (superscripts.has(char)) return superscripts.get(char);
      if (subscripts.has(char)) return subscripts.get(char);
      return char;
    })
    .join("")
    .replace(/\s+/g, "");
}

function nameInputVariants(name) {
  return [
    displayName(name),
    plainPitchName(name),
    suffixPitchName(name),
  ];
}

function groupInputVariants(name, midi, notationSystem) {
  return notationSystemsFor(notationSystem).flatMap((system) => [
    answerTextFor(name, midi, system),
    typedAnswerTextFor(name, midi, system, plainPitchName),
    typedAnswerTextFor(name, midi, system, suffixPitchName),
  ]).filter(Boolean);
}

function acceptedInputsForMidi(midi, advanced, notationSystem) {
  return [...new Set(notationSystemsFor(notationSystem).flatMap((system) => {
    const answers = answerPoolForMidi(midi, advanced, system);
    return uniqueNormalizedAnswers(
      answers.flatMap((answer) => groupInputVariants(answer.noteName, midi, system)),
      system === "helmholtz",
    );
  }))];
}

function uniqueNormalizedAnswers(values, preserveCase = false) {
  return [...new Set(values.flatMap((value) => {
    const normalized = normalizeTypedAnswer(value);
    return preserveCase ? [normalized] : [normalized, normalized.toUpperCase(), normalized.toLowerCase()];
  }))];
}

function typedInputMatches(typed, accepted) {
  return accepted.includes(typed);
}

function solfegeNoteForDegree(tonic, degreeIndex) {
  const tonicLetterIndex = WHITE_NOTES.indexOf(tonic);
  const letter = WHITE_NOTES[(tonicLetterIndex + degreeIndex) % WHITE_NOTES.length];
  const targetSemitone = modulo(NATURAL_SEMITONES[tonic] + MAJOR_SCALE_INTERVALS[degreeIndex], 12);
  let offset = targetSemitone - NATURAL_SEMITONES[letter];

  while (offset > 6) offset -= 12;
  while (offset < -6) offset += 12;

  return `${accidentalPrefix(offset)}${letter}`;
}

function solfegeScaleForTonic(tonic) {
  return SOLFEGE_DEGREES.map((degree, index) => ({
    degree,
    noteName: solfegeNoteForDegree(tonic, index),
  }));
}

function solfegeDisplayName(name) {
  return plainPitchName(name);
}

function makeSolfegeMapQuestion(mode) {
  const tonic = shuffle(SOLFEGE_TONICS)[0];
  const scale = solfegeScaleForTonic(tonic);
  const index = Math.floor(Math.random() * 7);
  const item = scale[index];

  if (mode === "note-number") {
    return {
      mode,
      tonic,
      scale,
      prompt: `What number is ${solfegeDisplayName(item.noteName)} when 1=${tonic}?`,
      acceptedInputs: [item.degree],
      displayAnswer: item.degree,
    };
  }

  if (mode === "sequence") {
    return {
      mode,
      tonic,
      scale,
      prompt: `Fill the full sequence when 1=${tonic}.`,
      acceptedInputs: [],
      displayAnswer: scale.map((entry) => solfegeDisplayName(entry.noteName)).join(", "),
    };
  }

  return {
    mode,
    tonic,
    scale,
    prompt: `What note is ${item.degree} when 1=${tonic}?`,
    acceptedInputs: uniqueNormalizedAnswers([solfegeDisplayName(item.noteName), displayName(item.noteName)]),
    displayAnswer: solfegeDisplayName(item.noteName),
  };
}

function makeGroupChoices(target, advanced, notationSystem) {
  const correctAnswers = answerPoolForMidi(target.midi, advanced, notationSystem);
  const correct = shuffle(correctAnswers)[0];
  const allWrong = [];

  for (let midi = PIANO_START_MIDI; midi <= PIANO_END_MIDI; midi += 1) {
    if (midi === target.midi) continue;
    allWrong.push(...answerPoolForMidi(midi, advanced, notationSystem));
  }

  const wrong = shuffle(allWrong.filter((answer) => answer.text !== correct.text));
  target.correctTexts = new Set(correctAnswers.map((answer) => answer.text));
  target.correctDisplay = correctAnswers.map((answer) => answer.text);

  return shuffle([correct, ...wrong.slice(0, 3)]);
}

function makeIntervalItems(advanced, notationSystem) {
  const configs = [
    { kind: "half", label: "half step", semitones: 1 },
    { kind: "whole", label: "whole step", semitones: 2 },
  ];
  const items = [];

  for (const config of configs) {
    const candidates = [];
    for (let midi = PIANO_START_MIDI + config.semitones; midi <= PIANO_END_MIDI - config.semitones; midi += 1) {
      candidates.push(midi);
    }

    for (const midi of shuffle(candidates).slice(0, 6)) {
      const promptAnswer = randomAnswerForMidi(midi, advanced, notationSystem);
      items.push({
        id: `${config.kind}-${midi}-${items.length}`,
        kind: config.kind,
        label: config.label,
        midi,
        prompt: promptAnswer.text,
        aboveMidi: midi + config.semitones,
        belowMidi: midi - config.semitones,
        aboveAccepted: acceptedInputsForMidi(midi + config.semitones, advanced, notationSystem),
        belowAccepted: acceptedInputsForMidi(midi - config.semitones, advanced, notationSystem),
        aboveDisplay: answerPoolForMidi(midi + config.semitones, advanced, notationSystem).map((answer) => answer.text),
        belowDisplay: answerPoolForMidi(midi - config.semitones, advanced, notationSystem).map((answer) => answer.text),
      });
    }
  }

  return items;
}


function letterStep(letter, octave) {
  return octave * WHITE_NOTES.length + WHITE_NOTES.indexOf(letter);
}

function staffStepFor(name, midi, clef) {
  const octave = scientificOctave(name, midi);
  if (octave === null) return null;

  const clefInfo = STAFF_CLEFS[clef];
  const bottom = letterStep(clefInfo.bottomLine.letter, clefInfo.bottomLine.octave);
  return letterStep(name.at(-1), octave) - bottom;
}

function commonStaffSpellings(midi, includeAccidentals) {
  const semitone = midiPitchClass(midi);
  const naturalName = spellingsForSemitone(semitone, false).find((name) => accidentalOffset(name) === 0);
  if (naturalName) return [naturalName];
  if (!includeAccidentals) return [];

  return spellingsForSemitone(semitone, false).filter((name) => Math.abs(accidentalOffset(name)) === 1);
}

function staffCandidatesFor(clef, includeAccidentals) {
  const range = clef === "treble" ? STAFF_RANGES.high : STAFF_RANGES.low;
  const candidates = [];

  for (let midi = range.minMidi; midi <= range.maxMidi; midi += 1) {
    for (const name of commonStaffSpellings(midi, includeAccidentals)) {
      const step = staffStepFor(name, midi, clef);
      if (step !== null && step >= STAFF_MIN_STEP && step <= STAFF_MAX_STEP) {
        candidates.push({ midi, noteName: name, clef });
      }
    }
  }

  return candidates;
}

function applyOctaveMark(candidate, mark) {
  if (!mark) return { ...candidate, writtenMidi: candidate.midi, writtenNoteName: candidate.noteName, octaveMark: null };

  const midi = candidate.midi + mark.shift;
  if (midi < PIANO_START_MIDI || midi > PIANO_END_MIDI) return null;

  return {
    ...candidate,
    midi,
    writtenMidi: candidate.midi,
    writtenNoteName: candidate.noteName,
    octaveMark: mark,
  };
}

function staffExerciseCandidatesFor(clef, includeAccidentals, includeOctaveMarks) {
  const writtenCandidates = staffCandidatesFor(clef, includeAccidentals);
  const candidates = writtenCandidates.map((candidate) => applyOctaveMark(candidate, null));

  if (includeOctaveMarks) {
    const marks = STAFF_OCTAVE_MARKS.filter((mark) => mark.clefs.includes(clef));
    for (const candidate of writtenCandidates) {
      for (const mark of marks) {
        const marked = applyOctaveMark(candidate, mark);
        if (marked) candidates.push(marked);
      }
    }
  }

  return candidates;
}

function makeStaffItems(count, range, includeAccidentals, includeOctaveMarks = false) {
  const clefs = STAFF_RANGES[range].clefs;
  if (range === "both" && count > 1) {
    return clefs.flatMap((clef) => shuffle(staffExerciseCandidatesFor(clef, includeAccidentals, includeOctaveMarks)).slice(0, Math.ceil(count / 2))).slice(0, count);
  }

  const candidates = clefs.flatMap((clef) => staffExerciseCandidatesFor(clef, includeAccidentals, includeOctaveMarks));
  return shuffle(candidates).slice(0, count);
}
function makeStaffReviewItems(range) {
  return STAFF_RANGES[range].clefs.flatMap((clef) => {
    return staffCandidatesFor(clef, false)
      .filter((item) => accidentalOffset(item.noteName) === 0)
      .sort((a, b) => a.midi - b.midi || a.noteName.localeCompare(b.noteName));
  });
}


function staffAnswerText(item, notationSystem) {
  return answerTextFor(item.noteName, item.midi, notationSystem);
}

function staffAcceptedInputs(item, notationSystem) {
  return [...new Set(notationSystemsFor(notationSystem).flatMap((system) => {
    return uniqueNormalizedAnswers(groupInputVariants(item.noteName, item.midi, system), system === "helmholtz");
  }))];
}

function makeStaffChoices(item, notationSystem, includeAccidentals) {
  const correct = staffAnswerText(item, notationSystem === "mixed" ? shuffle(NOTATION_SYSTEMS)[0] : notationSystem);
  const wrongCandidates = shuffle(staffExerciseCandidatesFor(item.clef, includeAccidentals, Boolean(item.octaveMark)).filter((candidate) => {
    return candidate.midi !== item.midi || candidate.noteName !== item.noteName;
  }));
  const wrong = [];

  for (const candidate of wrongCandidates) {
    const text = staffAnswerText(candidate, notationSystem === "mixed" ? shuffle(NOTATION_SYSTEMS)[0] : notationSystem);
    if (text && text !== correct && !wrong.includes(text)) wrong.push(text);
    if (wrong.length === 3) break;
  }

  item.correctTexts = new Set(notationSystemsFor(notationSystem).map((system) => staffAnswerText(item, system)).filter(Boolean));
  item.correctDisplay = [...item.correctTexts];
  return shuffle([correct, ...wrong].map((text) => ({ text })));
}

function staffLayoutForItems(items, options = {}) {
  const review = options.review ?? false;
  const single = items.length === 1;
  const hasOctaveMarks = items.some((item) => item.octaveMark);
  const width = review ? Math.max(980, items.length * 82 + 210) : single ? 560 : 920;
  const height = review ? 260 : single ? 250 : hasOctaveMarks ? 270 : 230;
  const topLineY = single ? 80 : hasOctaveMarks ? 78 : 58;
  const lineGap = 18;
  const bottomLineY = topLineY + lineGap * 4;
  const noteStartX = review ? 150 : single ? 270 : 150;
  const noteGap = single ? 0 : Math.max(review ? 82 : 74, (width - noteStartX - 94) / Math.max(items.length - 1, 1));

  return { review, single, hasOctaveMarks, width, height, topLineY, lineGap, bottomLineY, noteStartX, noteGap };
}

function staffXForIndex(index, layout) {
  return layout.noteStartX + index * layout.noteGap;
}

function renderBravuraStaff(width, bottomLineY) {
  return `<text class="staff-lines-glyph" x="56" y="${bottomLineY}" textLength="${width - 100}" lengthAdjust="spacingAndGlyphs">${SMUFL_STAFF_5_LINES_WIDE}</text>`;
}

function staffLineYFor(clef, letter, octave, bottomLineY, lineGap) {
  const midi = 12 * (octave + 1) + NATURAL_SEMITONES[letter];
  const step = staffStepFor(letter, midi, clef);
  return bottomLineY - step * (lineGap / 2);
}

function renderClef(clef, bottomLineY, lineGap) {
  const clefInfo = STAFF_CLEFS[clef];
  const anchorY = staffLineYFor(clef, clefInfo.anchor.letter, clefInfo.anchor.octave, bottomLineY, lineGap);

  if (clef === "treble") {
    return `<text class="staff-clef staff-clef-treble" x="90" y="${anchorY}">${SMUFL_G_CLEF}</text>`;
  }

  return `<text class="staff-clef staff-clef-bass" x="90" y="${anchorY}">${SMUFL_F_CLEF}</text>`;
}

function ledgerStepsFor(step) {
  const steps = [];
  const firstBelowStep = step % 2 === 0 ? step : step + 1;
  for (let ledgerStep = firstBelowStep; ledgerStep <= -2; ledgerStep += 2) {
    steps.push(ledgerStep);
  }
  const lastAboveStep = step % 2 === 0 ? step : step - 1;
  for (let ledgerStep = 10; ledgerStep <= lastAboveStep; ledgerStep += 2) {
    steps.push(ledgerStep);
  }
  return steps;
}

function renderVisibleStaffLineThroughNote(x, y) {
  return `<line class="staff-note-line" x1="${x - 16}" y1="${y}" x2="${x + 16}" y2="${y}"></line>`;
}

function renderOctaveMark(mark, x, y, topLineY, bottomLineY) {
  if (!mark) return "";

  const above = mark.placement === "above";
  const labelY = above ? Math.min(topLineY - 24, y - 34) : Math.max(bottomLineY + 40, y + 44);
  const bracketY = above ? labelY + 10 : labelY - 10;
  const label = mark.label.replace("ma", "ᵐᵃ").replace("mb", "ᵐᵇ");
  const startX = x - 34;
  const endX = x + 36;
  const hookEndY = above ? bracketY + 16 : bracketY - 16;

  return `
    <g class="staff-octave-mark staff-octave-${mark.placement}">
      <text x="${startX}" y="${labelY}" fill="#000000" stroke="none" font-family="Times New Roman, STIX Two Text, serif" font-size="24" font-style="italic" font-weight="800">${label}</text>
      <line x1="${x - 2}" y1="${bracketY}" x2="${endX}" y2="${bracketY}" stroke="#000000" stroke-width="2.4" stroke-linecap="square"></line>
      <line x1="${endX}" y1="${bracketY}" x2="${endX}" y2="${hookEndY}" stroke="#000000" stroke-width="2.4" stroke-linecap="square"></line>
    </g>`;
}

function renderStaffSvg(items, options = {}) {
  const layout = staffLayoutForItems(items, options);
  const { review, width, height, topLineY, lineGap, bottomLineY } = layout;
  const notationSystem = options.notationSystem ?? "scientific";
  const clef = items[0]?.clef || "treble";
  const clefInfo = STAFF_CLEFS[clef];
  let svg = `<svg class="staff-svg ${review ? "staff-svg-review" : ""}" viewBox="0 0 ${width} ${height}" role="img" aria-label="${clefInfo.label} note reading exercise">`;

  svg += renderBravuraStaff(width, bottomLineY);
  svg += renderClef(clef, bottomLineY, lineGap);

  items.forEach((item, index) => {
    const x = staffXForIndex(index, layout);
    const writtenName = item.writtenNoteName || item.noteName;
    const writtenMidi = item.writtenMidi || item.midi;
    const step = staffStepFor(writtenName, writtenMidi, item.clef);
    const y = bottomLineY - step * (lineGap / 2);
    const accidental = displayName(writtenName).slice(0, -1);

    for (const ledgerStep of ledgerStepsFor(step)) {
      const ledgerY = bottomLineY - ledgerStep * (lineGap / 2);
      svg += `<line class="staff-ledger" x1="${x - 24}" y1="${ledgerY}" x2="${x + 24}" y2="${ledgerY}"></line>`;
    }

    if (accidental) {
      svg += `<text class="staff-accidental" x="${x - 50}" y="${y + 9}">${accidental}</text>`;
    }

    svg += `<text class="staff-notehead" x="${x}" y="${y}">${SMUFL_WHOLE_NOTE}</text>`;

    if (step % 2 === 0) {
      svg += renderVisibleStaffLineThroughNote(x, y);
    }

    svg += renderOctaveMark(item.octaveMark, x, y, topLineY, bottomLineY);

    if (review) {
      const answers = notationSystemsFor(notationSystem).map((system) => staffAnswerText(item, system)).filter(Boolean);
      svg += `<text class="staff-review-label" x="${x + 24}" y="${y + 8}">${answers.join(" / ")}</text>`;
    }
  });

  svg += "</svg>";
  return svg;
}

function currentSettings() {
  return {
    practiceMode: document.querySelector("input[name='practiceMode']:checked").value,
    answerMode: document.querySelector("input[name='answerMode']:checked").value,
    advanced: el.advanced.checked,
    review: el.review.checked,
    autoAdvance: el.autoAdvance.checked,
    notationSystem: document.querySelector("input[name='notationSystem']:checked").value,
    solfegeMapMode: document.querySelector("input[name='solfegeMapMode']:checked").value,
    octaveMarks: el.octaveMarks.checked,
    staffRange: document.querySelector("input[name='staffRange']:checked").value,
    readNoteFormat: document.querySelector("input[name='readNoteFormat']:checked").value,
  };
}

function clearAutoAdvanceTimer() {
  if (!state.autoAdvanceTimer) return;
  window.clearTimeout(state.autoAdvanceTimer);
  state.autoAdvanceTimer = null;
}

function syncPracticeControls() {
  const practiceMode = document.querySelector("input[name='practiceMode']:checked").value;
  if (["intervals", "solfege-map"].includes(practiceMode)) {
    document.querySelector("input[name='answerMode'][value='type']").checked = true;
  }
}

function renderKeyboard() {
  const { practiceMode } = currentSettings();
  el.keyboard.hidden = ["intervals", "solfege", "solfege-map", "read-notes"].includes(practiceMode);
  el.intervalQuiz.hidden = practiceMode !== "intervals";
  el.solfegeMap.hidden = practiceMode !== "solfege-map";
  el.staffQuiz.hidden = practiceMode !== "read-notes";
  el.solfegePanel.hidden = practiceMode !== "solfege";

  if (practiceMode === "group-name") {
    renderFullKeyboard();
    return;
  }

  if (["intervals", "solfege", "solfege-map", "read-notes"].includes(practiceMode)) {
    el.keyboard.innerHTML = "";
    return;
  }

  renderTwoOctaveKeyboard();
}

function renderTwoOctaveKeyboard() {
  const { review, advanced, practiceMode } = currentSettings();
  const whiteW = 64;
  const whiteH = 230;
  const blackW = 38;
  const blackH = 145;
  const totalWhite = 14;
  const totalW = whiteW * totalWhite;
  const target = state.target;

  let svg = `<svg viewBox="0 0 ${totalW} 254" role="img" aria-label="Two octave piano keyboard">`;

  for (let i = 0; i < totalWhite; i += 1) {
    const semitone = Math.floor(i / 7) * 12 + WHITE_INDEX_TO_SEMITONE[i % 7];
    const isTarget = target && !target.isBlack && target.whiteIndex === i && practiceMode === "name-key";
    svg += `
      <g>
        <rect class="white-key ${isTarget ? "key-target" : ""}" data-midi="${semitone}" x="${i * whiteW}" y="0" width="${whiteW}" height="${whiteH}" rx="0" fill="white" stroke="#111827" stroke-width="1.5"></rect>
        ${review ? renderWhiteLabels(i, semitone % 12, advanced) : ""}
      </g>`;
  }

  for (let group = 0; group < 2; group += 1) {
    const base = group * 7;
    for (const [wi, semitone] of BLACK_POSITIONS.entries()) {
      const keyMidi = group * 12 + semitone;
      const x = (base + wi + 1) * whiteW - blackW / 2;
      const position = base + wi;
      const isTarget = target && target.isBlack && target.blackPosition === position && practiceMode === "name-key";
      svg += `
        <g>
          <rect class="black-key ${isTarget ? "key-target" : ""}" data-midi="${keyMidi}" x="${x}" y="0" width="${blackW}" height="${blackH}" rx="0" fill="black" stroke="#111827" stroke-width="1.5"></rect>
          ${review ? renderBlackLabels(x, semitone, advanced, isTarget) : ""}
        </g>`;
    }
  }

  svg += "</svg>";
  el.keyboard.innerHTML = svg;

  el.keyboard.querySelectorAll("[data-midi]").forEach((key) => {
    key.addEventListener("click", () => handleKeyClick(Number(key.dataset.midi), key));
  });
}

function renderFullKeyboard() {
  const { review, notationSystem } = currentSettings();
  const whiteW = 22;
  const whiteH = 174;
  const blackW = 13;
  const blackH = 108;
  const totalW = whiteW * FULL_WHITE_KEYS.length;
  const labelH = review ? 36 : 14;
  const totalH = whiteH + labelH;
  const target = state.target;

  let svg = `<svg viewBox="0 0 ${totalW} ${totalH}" role="img" aria-label="Full piano keyboard from A0 to C8">`;

  FULL_WHITE_KEYS.forEach((key, index) => {
    const isTarget = target && !target.isBlack && target.midi === key.midi;
    svg += `
      <g>
        <rect class="white-key ${isTarget ? "key-target" : ""}" data-midi="${key.midi}" x="${index * whiteW}" y="0" width="${whiteW}" height="${whiteH}" rx="0" fill="white" stroke="#111827" stroke-width="1"></rect>
        ${review ? renderFullKeyLabel(index * whiteW + whiteW / 2, whiteH + 22, key.midi, notationSystem) : ""}
      </g>`;
  });

  FULL_BLACK_KEYS.forEach((key) => {
    const x = (key.previousWhiteIndex + 1) * whiteW - blackW / 2;
    const isTarget = target && target.isBlack && target.midi === key.midi;
    svg += `
      <g>
        <rect class="black-key ${isTarget ? "key-target" : ""}" data-midi="${key.midi}" x="${x}" y="0" width="${blackW}" height="${blackH}" rx="0" fill="black" stroke="#111827" stroke-width="1"></rect>
      </g>`;
  });

  svg += "</svg>";
  el.keyboard.innerHTML = svg;
}

function renderFullKeyLabel(x, y, midi, notationSystem) {
  const naturalName = spellingsForSemitone(midiPitchClass(midi), false).find((name) => accidentalOffset(name) === 0);
  if (!naturalName) return "";

  const text = answerTextFor(naturalName, midi, notationSystem);
  if (!text || !text.match(/C|c|A0|A /)) return "";

  return `<text x="${x}" y="${y}" text-anchor="middle" class="advanced-label">${text}</text>`;
}

function renderWhiteLabels(index, semitone, advanced) {
  const names = spellingsForSemitone(semitone, advanced);
  const natural = WHITE_NOTES[index % 7];
  const extras = names.filter((name) => name !== natural);
  const x = index * 64 + 32;
  const extraText = extras.slice(0, 2).map((name, i) => `<text x="${x}" y="${164 + i * 22}" text-anchor="middle" class="advanced-label">${displayName(name)}</text>`).join("");
  return `
    ${extraText}
    <text x="${x}" y="220" text-anchor="middle" class="label-white">${natural}</text>
  `;
}

function renderBlackLabels(x, semitone, advanced, isTarget) {
  const names = spellingsForSemitone(semitone, advanced);
  return names.slice(0, 3).map((name, i) => {
    const labelClass = isTarget ? "label-black label-target" : "label-black";
    return `<text x="${x + 19}" y="${48 + i * 26}" text-anchor="middle" class="${labelClass}">${displayName(name)}</text>`;
  }).join("");
}

function newQuestion() {
  clearAutoAdvanceTimer();
  syncPracticeControls();
  const { practiceMode, answerMode, advanced, review, notationSystem, solfegeMapMode, staffRange, readNoteFormat, octaveMarks } = currentSettings();
  state.target = randomTarget();
  state.answered = false;
  state.acceptedInputs = [];
  state.intervalItems = [];
  state.staffItems = [];
  state.solfegeMap = null;
  el.feedback.textContent = "";
  el.feedback.className = "feedback";
  el.hint.hidden = true;
  el.hint.textContent = "";
  el.answerInput.value = "";
  el.answerInput.disabled = false;
  el.submitAnswer.disabled = false;

  if (practiceMode === "solfege-map") {
    state.target = { practiceMode };
    state.solfegeMap = makeSolfegeMapQuestion(solfegeMapMode);
    state.acceptedInputs = state.solfegeMap.acceptedInputs;
    state.choices = [];
    el.prompt.textContent = state.solfegeMap.prompt;
    el.hint.hidden = false;
    el.hint.textContent = "Use prefix accidentals for notes, such as #F or bB.";
  } else if (practiceMode === "solfege") {
    state.target = { practiceMode };
    state.choices = [];
    el.prompt.textContent = "Open the Solfege voice trainer.";
    el.hint.hidden = false;
    el.hint.textContent = "Start the local Python trainer first, then open the Solfege Trainer link.";
  } else if (practiceMode === "intervals") {
    state.target = { practiceMode };
    state.intervalItems = makeIntervalItems(advanced, notationSystem);
    state.choices = [];
    el.prompt.textContent = "Fill the note above and below each given note.";
    el.hint.hidden = false;
    el.hint.textContent = "Use typed accidentals before the note: b = flat, # = sharp, bb = double flat, x = double sharp.";
  } else if (practiceMode === "read-notes") {
    const count = readNoteFormat === "choice" ? 1 : STAFF_WRITE_COUNT;
    state.staffItems = review ? makeStaffReviewItems(staffRange) : makeStaffItems(count, staffRange, advanced, octaveMarks);
    state.target = state.staffItems[0] || { practiceMode };
    state.target.practiceMode = practiceMode;
    state.acceptedInputs = state.staffItems[0] ? staffAcceptedInputs(state.staffItems[0], notationSystem) : [];
    state.choices = !review && readNoteFormat === "choice" && state.staffItems[0]
      ? makeStaffChoices(state.staffItems[0], notationSystem, advanced)
      : [];
    el.prompt.textContent = review
      ? "Review the staff notes in ascending order."
      : readNoteFormat === "choice" ? "Choose the name of the note." : "Write the name under each note.";
    el.hint.hidden = false;
    el.hint.textContent = review
      ? "Review labels show natural notes only."
      : octaveMarks
        ? "Octave marks change the sounding pitch: 8va/8vb by one octave, 15ma/15mb by two octaves."
        : advanced
          ? "Accidentals are included. Type them before the note, such as #F4 or bB1."
          : "Use the notation selector for Scientific, Helmholtz, or Mixed answers.";
  } else if (practiceMode === "group-name") {
    const correctAnswers = answerPoolForMidi(state.target.midi, advanced, notationSystem);
    state.target.correctTexts = new Set(correctAnswers.map((answer) => answer.text));
    state.target.correctDisplay = correctAnswers.map((answer) => answer.text);
    state.acceptedInputs = acceptedInputsForMidi(state.target.midi, advanced, notationSystem);
    state.choices = answerMode === "choice" ? makeGroupChoices(state.target, advanced, notationSystem) : [];
    const modeName = notationSystem === "scientific"
      ? "scientific pitch notation"
      : notationSystem === "helmholtz"
        ? "Helmholtz group notation"
        : "mixed scientific and Helmholtz notation";
    el.prompt.textContent = `Name the highlighted key with its group in ${modeName}.`;
    el.hint.hidden = false;
    el.hint.textContent = "Type accidentals before the note: b = flat, # = sharp, bb = double flat, x = double sharp.";
  } else {
    const validNames = spellingsForSemitone(state.target.semitone, advanced);
    const promptName = validNames[Math.floor(Math.random() * validNames.length)];
    state.target.promptName = promptName;

    if (practiceMode === "name-key") {
      state.acceptedInputs = uniqueNormalizedAnswers(validNames.flatMap(nameInputVariants));
      state.choices = answerMode === "choice" ? makeChoices(promptName, state.target.semitone, advanced) : [];
      el.prompt.textContent = "What is one valid name for the highlighted key?";
      if (answerMode === "type") {
        el.hint.hidden = false;
        el.hint.textContent = "Type accidentals before the note: b = flat, # = sharp, bb = double flat, x = double sharp.";
      }
    } else {
      state.choices = [];
      el.prompt.textContent = `Click any key named ${displayName(promptName)}.`;
    }
  }

  renderKeyboard();
  renderIntervalQuiz();
  renderSolfegeMap();
  renderStaffQuiz();
  renderAnswerControls();
  updateNextButtonLabel();
}

function renderAnswerControls(selectedChoice = null) {
  const { practiceMode, answerMode } = currentSettings();
  const shouldType = answerMode === "type" && !["click-key", "intervals", "solfege", "solfege-map", "read-notes"].includes(practiceMode);
  el.typedAnswer.hidden = !shouldType;
  renderChoices(selectedChoice);

  if (shouldType && !state.answered) {
    el.answerInput.focus();
  }
}

function renderChoices(selectedChoice = null) {
  const { answerMode, practiceMode } = currentSettings();
  el.choices.innerHTML = "";
  const hideChoices = (answerMode === "type" && practiceMode !== "read-notes")
    || ["intervals", "solfege", "solfege-map"].includes(practiceMode)
    || (practiceMode === "read-notes" && currentSettings().readNoteFormat !== "choice");
  el.choices.hidden = hideChoices;
  if (hideChoices) return;
  if (!state.choices.length) return;

  for (const choice of state.choices) {
    const button = document.createElement("button");
    button.type = "button";
    button.className = "choice-button";
    button.textContent = choice.text;
    button.disabled = state.answered;

    if (state.answered) {
      const isCorrect = isCorrectChoice(choice);
      const isSelected = selectedChoice && choice.text === selectedChoice.text;
      if (isCorrect) button.classList.add("correct");
      if (isSelected && !isCorrect) button.classList.add("wrong");
    }

    button.addEventListener("click", () => gradeChoice(choice));
    el.choices.append(button);
  }
}

function renderIntervalQuiz() {
  el.intervalQuiz.innerHTML = "";
  const { practiceMode } = currentSettings();
  if (practiceMode !== "intervals" || !state.intervalItems.length) return;

  for (const config of [
    { kind: "half", title: "Write the notes a half step from each note" },
    { kind: "whole", title: "Write the notes a whole step from each note" },
  ]) {
    const section = document.createElement("section");
    section.className = "interval-section";

    const title = document.createElement("h2");
    title.className = "interval-title";
    title.innerHTML = config.title.replace(config.kind, `<strong>${config.kind}</strong>`);
    section.append(title);

    const grid = document.createElement("div");
    grid.className = "interval-grid";

    for (const item of state.intervalItems.filter((candidate) => candidate.kind === config.kind)) {
      const card = document.createElement("div");
      card.className = "interval-card";

      const above = document.createElement("input");
      above.className = "interval-input";
      above.type = "text";
      above.autocomplete = "off";
      above.placeholder = "above";
      above.spellcheck = false;
      above.setAttribute("aria-label", `${item.prompt} ${config.kind} step above`);
      above.dataset.intervalId = item.id;
      above.dataset.direction = "above";
      above.disabled = state.answered;

      const note = document.createElement("div");
      note.className = "interval-note";
      note.textContent = item.prompt;

      const below = document.createElement("input");
      below.className = "interval-input";
      below.type = "text";
      below.autocomplete = "off";
      below.placeholder = "below";
      below.spellcheck = false;
      below.setAttribute("aria-label", `${item.prompt} ${config.kind} step below`);
      below.dataset.intervalId = item.id;
      below.dataset.direction = "below";
      below.disabled = state.answered;

      card.append(above, note, below);
      grid.append(card);
    }

    section.append(grid);
    el.intervalQuiz.append(section);
  }
}

function renderSolfegeMap() {
  el.solfegeMap.innerHTML = "";
  const { practiceMode, review } = currentSettings();
  if (practiceMode !== "solfege-map" || !state.solfegeMap) return;

  if (review) {
    el.solfegeMap.append(renderSolfegeReviewTable());
  }

  const wrapper = document.createElement("div");
  wrapper.className = "map-card";

  const context = document.createElement("div");
  context.className = "map-context";
  context.textContent = `1=${state.solfegeMap.tonic}`;
  wrapper.append(context);

  if (state.solfegeMap.mode === "sequence") {
    const grid = document.createElement("div");
    grid.className = "map-sequence";

    state.solfegeMap.scale.forEach((entry, index) => {
      const cell = document.createElement("div");
      cell.className = "map-cell";

      const degree = document.createElement("div");
      degree.className = "map-degree";
      degree.textContent = entry.degree;

      const input = document.createElement("input");
      input.className = "map-input";
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.placeholder = index === 7 ? "octave" : "note";
      input.setAttribute("aria-label", `degree ${entry.degree} note`);
      input.dataset.index = String(index);
      input.disabled = state.answered;

      cell.append(degree, input);
      grid.append(cell);
    });

    wrapper.append(grid);
  } else {
    const question = document.createElement("div");
    question.className = "map-question";
    question.textContent = state.solfegeMap.prompt;

    const input = document.createElement("input");
    input.className = "map-input";
    input.type = "text";
    input.autocomplete = "off";
    input.spellcheck = false;
    input.placeholder = state.solfegeMap.mode === "note-number" ? "number" : "note";
    input.setAttribute("aria-label", "Solfege map answer");
    input.disabled = state.answered;

    wrapper.append(question, input);
  }

  el.solfegeMap.append(wrapper);
}

function renderSolfegeReviewTable() {
  const wrapper = document.createElement("div");
  wrapper.className = "map-review";

  const title = document.createElement("h2");
  title.textContent = "Solfege key summary";
  wrapper.append(title);

  const table = document.createElement("table");
  table.className = "map-review-table";

  const thead = document.createElement("thead");
  const headRow = document.createElement("tr");
  ["1=", ...SOLFEGE_DEGREES].forEach((label) => {
    const th = document.createElement("th");
    th.textContent = label;
    headRow.append(th);
  });
  thead.append(headRow);
  table.append(thead);

  const tbody = document.createElement("tbody");
  SOLFEGE_TONICS.forEach((tonic) => {
    const row = document.createElement("tr");
    const key = document.createElement("th");
    key.textContent = `1=${tonic}`;
    row.append(key);

    solfegeScaleForTonic(tonic).forEach((entry) => {
      const td = document.createElement("td");
      td.textContent = solfegeDisplayName(entry.noteName);
      row.append(td);
    });

    tbody.append(row);
  });
  table.append(tbody);
  wrapper.append(table);

  return wrapper;
}


function renderStaffQuiz() {
  el.staffQuiz.innerHTML = "";
  const { practiceMode, readNoteFormat, notationSystem, review } = currentSettings();
  if (practiceMode !== "read-notes" || !state.staffItems.length) return;

  if (review) {
    const byClef = state.staffItems.reduce((groups, item) => {
      groups[item.clef] = groups[item.clef] || [];
      groups[item.clef].push(item);
      return groups;
    }, {});

    Object.values(byClef).forEach((items) => {
      const panel = document.createElement("div");
      panel.className = "staff-review-panel";
      panel.innerHTML = renderStaffSvg(items, { review, notationSystem });
      el.staffQuiz.append(panel);
    });
    return;
  }

  if (readNoteFormat === "choice") {
    const item = state.staffItems[0];
    const panel = document.createElement("div");
    panel.className = "staff-choice-panel";
    panel.innerHTML = renderStaffSvg([item], { review, notationSystem });
    el.staffQuiz.append(panel);
    return;
  }

  const byClef = state.staffItems.reduce((groups, item) => {
    groups[item.clef] = groups[item.clef] || [];
    groups[item.clef].push(item);
    return groups;
  }, {});

  Object.entries(byClef).forEach(([clef, items]) => {
    const section = document.createElement("section");
    section.className = "staff-write-section";
    section.innerHTML = renderStaffSvg(items, { review, notationSystem });

    const answers = document.createElement("div");
    answers.className = "staff-answer-row";
    const layout = staffLayoutForItems(items, { review, notationSystem });

    items.forEach((item, index) => {
      const input = document.createElement("input");
      input.className = "staff-input";
      input.type = "text";
      input.autocomplete = "off";
      input.spellcheck = false;
      input.placeholder = "note";
      input.setAttribute("aria-label", `${STAFF_CLEFS[clef].label} note ${index + 1}`);
      input.dataset.staffIndex = String(state.staffItems.indexOf(item));
      input.style.left = `${(staffXForIndex(index, layout) / layout.width) * 100}%`;
      input.disabled = state.answered;
      answers.append(input);
    });

    section.append(answers);
    el.staffQuiz.append(section);
  });
}

function gradeStaffNotes() {
  if (!state.staffItems.length || state.answered) return;

  let total = 0;
  let correct = 0;
  const { notationSystem } = currentSettings();

  for (const input of el.staffQuiz.querySelectorAll(".staff-input")) {
    const item = state.staffItems[Number(input.dataset.staffIndex)];
    const accepted = staffAcceptedInputs(item, notationSystem);
    const typed = normalizeTypedAnswer(input.value);
    const ok = typedInputMatches(typed, accepted);

    total += 1;
    if (ok) correct += 1;
    input.classList.toggle("correct", ok);
    input.classList.toggle("wrong", !ok);
    input.disabled = true;
  }

  const ok = correct === total;
  state.answered = true;
  updateScore(ok);
  el.feedback.textContent = ok ? "Correct." : `${correct}/${total} correct. Press Next for a new set.`;
  el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
  updateNextButtonLabel();
}

function gradeIntervals() {
  if (!state.intervalItems.length || state.answered) return;

  let total = 0;
  let correct = 0;
  for (const input of el.intervalQuiz.querySelectorAll(".interval-input")) {
    const item = state.intervalItems.find((candidate) => candidate.id === input.dataset.intervalId);
    const direction = input.dataset.direction;
    const accepted = direction === "above" ? item.aboveAccepted : item.belowAccepted;
    const typed = normalizeTypedAnswer(input.value);
    const ok = typedInputMatches(typed, accepted);

    total += 1;
    if (ok) correct += 1;
    input.classList.toggle("correct", ok);
    input.classList.toggle("wrong", !ok);
    input.disabled = true;
  }

  const ok = correct === total;
  state.answered = true;
  updateScore(ok);
  el.feedback.textContent = ok ? "Correct." : `${correct}/${total} correct. Press Next for a new set.`;
  el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
  updateNextButtonLabel();
}

function gradeSolfegeMap() {
  if (!state.solfegeMap || state.answered) return;

  if (state.solfegeMap.mode === "sequence") {
    let correct = 0;
    let total = 0;

    for (const input of el.solfegeMap.querySelectorAll(".map-input")) {
      const index = Number(input.dataset.index);
      const expected = state.solfegeMap.scale[index].noteName;
      const accepted = uniqueNormalizedAnswers([solfegeDisplayName(expected), displayName(expected)]);
      const typed = normalizeTypedAnswer(input.value);
      const ok = typedInputMatches(typed, accepted);

      total += 1;
      if (ok) correct += 1;
      input.classList.toggle("correct", ok);
      input.classList.toggle("wrong", !ok);
      input.disabled = true;
    }

    const ok = correct === total;
    state.answered = true;
    updateScore(ok);
    el.feedback.textContent = ok ? "Correct." : `${correct}/${total} correct. Answer: ${state.solfegeMap.displayAnswer}`;
    el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
    updateNextButtonLabel();
    return;
  }

  const input = el.solfegeMap.querySelector(".map-input");
  const typed = normalizeTypedAnswer(input.value);
  const ok = typedInputMatches(typed, state.acceptedInputs);

  state.answered = true;
  updateScore(ok);
  input.classList.toggle("correct", ok);
  input.classList.toggle("wrong", !ok);
  input.disabled = true;
  el.feedback.textContent = ok ? "Correct." : `Wrong. Answer: ${state.solfegeMap.displayAnswer}`;
  el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
  updateNextButtonLabel();
}

function updateNextButtonLabel() {
  const { practiceMode } = currentSettings();
  const { readNoteFormat } = currentSettings();
  const shouldCheck = (practiceMode === "intervals" && state.intervalItems.length && !state.answered)
    || (practiceMode === "solfege-map" && state.solfegeMap && !state.answered)
    || (practiceMode === "read-notes" && !currentSettings().review && readNoteFormat === "write" && state.staffItems.length && !state.answered);
  el.next.textContent = shouldCheck ? "Check" : "Next";
}

function isCorrectChoice(choice) {
  const { practiceMode } = currentSettings();
  if (practiceMode === "group-name") {
    return state.target.correctTexts.has(choice.text);
  }

  if (practiceMode === "read-notes") {
    return state.target.correctTexts.has(choice.text);
  }

  return nameSemitone(choice.noteName) === state.target.semitone;
}

function gradeChoice(choice) {
  if (!state.target || state.answered) return;

  const { practiceMode, autoAdvance } = currentSettings();
  const ok = isCorrectChoice(choice);
  state.answered = true;
  updateScore(ok);

  if (practiceMode === "group-name") {
    el.feedback.textContent = ok ? "Correct." : `Wrong. Valid answers include: ${state.target.correctDisplay.slice(0, 4).join(", ")}`;
  } else if (practiceMode === "read-notes") {
    el.feedback.textContent = ok ? "Correct." : `Wrong. Answer: ${state.target.correctDisplay.join(" or ")}`;
  } else {
    el.feedback.textContent = ok ? "Correct." : `Wrong. Valid names: ${displayList(spellingsForSemitone(state.target.semitone, el.advanced.checked))}`;
  }

  el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
  renderChoices(choice);

  if (autoAdvance) {
    clearAutoAdvanceTimer();
    state.autoAdvanceTimer = window.setTimeout(() => {
      state.autoAdvanceTimer = null;
      newQuestion();
    }, ok ? AUTO_ADVANCE_CORRECT_DELAY_MS : AUTO_ADVANCE_WRONG_DELAY_MS);
  }
}

function gradeTypedAnswer() {
  if (!state.target || state.answered) return;

  const { practiceMode, notationSystem } = currentSettings();
  const typed = normalizeTypedAnswer(el.answerInput.value);
  if (!typed) {
    el.feedback.textContent = "Type an answer first.";
    el.feedback.className = "feedback bad";
    return;
  }

  const ok = typedInputMatches(typed, state.acceptedInputs);
  state.answered = true;
  updateScore(ok);
  el.answerInput.disabled = true;
  el.submitAnswer.disabled = true;

  if (practiceMode === "group-name") {
    el.feedback.textContent = ok ? "Correct." : `Wrong. Valid answers include: ${state.target.correctDisplay.slice(0, 4).join(", ")}`;
  } else if (practiceMode === "read-notes") {
    el.feedback.textContent = ok ? "Correct." : `Wrong. Answer: ${state.target.correctDisplay.join(" or ")}`;
  } else {
    el.feedback.textContent = ok ? "Correct." : `Wrong. Valid names: ${displayList(spellingsForSemitone(state.target.semitone, el.advanced.checked))}`;
  }

  el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
  renderAnswerControls();
}

function handleKeyClick(midi, keyElement) {
  if (!state.target || state.answered) return;

  const { practiceMode } = currentSettings();
  if (practiceMode !== "click-key") return;

  const ok = midi % 12 === state.target.semitone;
  state.answered = ok;
  updateScore(ok);
  keyElement.classList.add(ok ? "key-correct" : "key-wrong");
  el.feedback.textContent = ok ? "Correct." : "Wrong key. Try again.";
  el.feedback.className = `feedback ${ok ? "good" : "bad"}`;
}

function updateScore(ok) {
  state.streak = ok ? state.streak + 1 : 0;
  el.streak.textContent = String(state.streak);
}

function refresh() {
  syncPracticeControls();
  if (state.target) {
    newQuestion();
  } else {
    renderKeyboard();
    renderIntervalQuiz();
    renderSolfegeMap();
    renderStaffQuiz();
    updateNextButtonLabel();
  }
}

el.next.addEventListener("click", () => {
  const { practiceMode } = currentSettings();
  if (practiceMode === "intervals" && state.intervalItems.length && !state.answered) {
    gradeIntervals();
    return;
  }

  if (practiceMode === "solfege-map" && state.solfegeMap && !state.answered) {
    gradeSolfegeMap();
    return;
  }

  if (practiceMode === "read-notes" && !currentSettings().review && currentSettings().readNoteFormat === "write" && state.staffItems.length && !state.answered) {
    gradeStaffNotes();
    return;
  }

  newQuestion();
});
el.typedAnswer.addEventListener("submit", (event) => {
  event.preventDefault();
  gradeTypedAnswer();
});
el.advanced.addEventListener("change", refresh);
el.octaveMarks.addEventListener("change", refresh);
el.autoAdvance.addEventListener("change", () => {
  if (!el.autoAdvance.checked) clearAutoAdvanceTimer();
});
el.review.addEventListener("change", () => {
  renderKeyboard();
  renderSolfegeMap();
  renderStaffQuiz();
});
document.querySelectorAll("input[name='practiceMode'], input[name='keyPool'], input[name='notationSystem'], input[name='answerMode'], input[name='staffRange'], input[name='readNoteFormat']").forEach((input) => {
  input.addEventListener("change", refresh);
});

document.querySelectorAll("input[name='solfegeMapMode']").forEach((input) => {
  input.addEventListener("change", refresh);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter") return;
  const { answerMode, practiceMode } = currentSettings();
  if (answerMode === "type" && practiceMode !== "click-key" && state.target && !state.answered) return;
  if (practiceMode === "intervals" && state.intervalItems.length && !state.answered) return;
  if (practiceMode === "solfege-map" && state.solfegeMap && !state.answered) return;
  if (practiceMode === "read-notes" && !currentSettings().review && currentSettings().readNoteFormat === "write" && state.staffItems.length && !state.answered) return;
  newQuestion();
});

renderKeyboard();
