# Piano Note Trainer Checkpoint - 2026-05-29

## Current App

- The trainer is a static web app made of `index.html`, `styles.css`, and `app.js`.
- Existing practice modes:
  - `Name the key`: highlights a key and asks for a valid note name.
  - `Click the key`: gives a note name and asks the learner to click a matching key.
- Existing note-name logic supports natural notes plus accidentals:
  - Simple mode: flat, natural, sharp.
  - Advanced names: double flat, flat, natural, sharp, double sharp.
- Existing keyboard range is two octaves. This should stay unchanged for the simple trainer.

## User Decisions

- Add both pitch-group systems:
  - Scientific pitch notation, such as `C4`, `F2`, `A5`.
  - Helmholtz pitch notation, such as `C₂`, `C₁`, `C`, `c`, `c¹`.
- Use the full piano range only for the new group-aware advanced feature.
- The harder test should use one combined answer, such as `C4`, `♯F4`, or `c¹`.
- The UI should give learners hints for accidentals:
  - `b` means flat.
  - `#` means sharp.
  - `bb` means double flat.
  - `x` means double sharp.
- Checkpoint documentation should live under `note_trainer_app/docs/`.

## Implementation Direction

- Keep the existing two-octave keyboard for current modes.
- Add a new optional practice mode for full-range group identification.
- Represent full piano keys as semitone offsets from A0 through C8.
- Generate combined choices from the target key's spelling and group.
- Show both notation systems in the answer choices or let the learner choose which system to practice.
- Update this checkpoint after implementation with concrete behavior and any known follow-up work.

## Implemented This Checkpoint

- Added a third practice mode: `Name + group`.
- In `Name + group`, the keyboard switches from the original two-octave view to the full 88-key range from A0 through C8.
- Added a notation selector:
  - `Scientific` produces choices such as `C4`, `♯F5`, `♭C3`.
  - `Helmholtz` produces choices such as `C₂`, `C₁`, `C`, `c`, `c¹`, `♯f²`.
- Added the accidental hint under the prompt for the group-aware exercise.
- Kept the existing simple modes on the two-octave keyboard.
- Kept `Advanced names` as the source of double-flat and double-sharp choices.

## 2026-05-29 Follow-Up Change

- Removed Chinese group-name text from Helmholtz choices.
- Helmholtz answers now use direct pitch notation:
  - Scientific octaves 0 and 1 use uppercase letters with subscript group marks, such as `A₂`, `C₁`.
  - Scientific octave 2 uses uppercase letters without a mark, such as `C`.
  - Scientific octave 3 uses lowercase letters without a mark, such as `c`.
  - Scientific octaves 4 through 8 use lowercase letters with superscript marks, such as `c¹`, `c²`, `c⁵`.

## 2026-05-29 Accidental Display Change

- Updated `Name + group` answers to render accidentals like the original simple trainer.
- Accidentals now appear before the note letter:
  - `♭C3`, not `Cb3`.
  - `♯F5`, not `F#5`.
  - `𝄫D4`, not `Dbb4`.
  - `𝄪G4`, not `Gx4`.

## 2026-05-29 Typed Answer Change

- Added an `Answer` setting with `Multiple choice` and `Type answer`.
- `Multiple choice` remains the default.
- `Type answer` works for:
  - `Name the key`.
  - `Name + group`.
- `Click the key` remains a click-based exercise.
- Typed input accepts practical accidental prefixes so learners do not need to type music symbols:
  - `bC` for `♭C`.
  - `#F` for `♯F`.
  - `bbD` for `𝄫D`.
  - `xG` for `𝄪G`.
- For grouped scientific answers, typed forms such as `#F4` are accepted for displayed answers such as `♯F4`.
- For grouped Helmholtz answers, typed forms such as `#f1` are accepted for displayed answers such as `♯f¹`; uppercase/lowercase remains meaningful in Helmholtz mode.

## 2026-05-29 Steps Quiz Change

- Added a new `Steps` practice mode for half-step and whole-step note recognition.
- The mode generates:
  - 6 given notes for half-step questions.
  - 6 given notes for whole-step questions.
  - 2 blanks per note: one for the note above and one for the note below.
- `Steps` is always a typed quiz and automatically selects `Type answer`.
- The notation selector still applies:
  - `Scientific` shows notes such as `C4`, `♯F5`, `♭B3`.
  - `Helmholtz` shows notes such as `C`, `c`, `c¹`, `♯f²`.
- Typed interval answers use the same practical accidental prefixes:
  - `bC`, `#F`, `bbD`, `xG`.
- The `Next` button changes to `Check` while an interval set is ungraded. After checking, it changes back to `Next` for a fresh set.

## 2026-05-29 Mixed Notation And Solfege Change

- Added `Mixed` to the notation selector.
- `Mixed` means Scientific and Helmholtz notation can appear inside the same generated exercise.
- `Mixed` applies to notation-aware modes:
  - `Name + group`.
  - `Steps`.
  - full-keyboard review labels.
- Typed grading accepts both notation systems when `Mixed` is selected.
- Added a lightweight `Solfege` practice mode in the static trainer.
- The Solfege panel links to the existing Gradio/Whisper trainer at `http://127.0.0.1:7860`.
- The current solfege backend remains `solfege_training_whisper.py`; launch it locally with `python3 solfege_training_whisper.py`.

## 2026-05-29 Solfege Map Change

- Added `Solfege Map` as a separate static practice mode.
- Uses movable-do major scale only, with interval pattern `whole whole half whole whole whole half`.
- Limits tonics to the slide set: `1=C`, `1=D`, `1=E`, `1=F`, `1=G`, `1=A`, `1=B`.
- Added a `Map` selector with three modes:
  - `1 to note`: given `1=D` and degree `3`, type `#F`.
  - `Note to 1`: given `1=D` and note `#F`, type `3`.
  - `Sequence`: fill the whole `1 2 3 4 5 6 7 i` note sequence for a generated tonic.
- Typed note answers use prefix accidentals, such as `#F` and `bB`.
- `Solfege Map` always uses typed answers and changes the main button to `Check` until graded.
- When `Review labels` is enabled in `Solfege Map`, a full key summary table appears above the active quiz.
- The review table covers all seven slide tonics and degrees `1 2 3 4 5 6 7 i`.


## 2026-06-06 Read Notes Change

- Added a new `Read notes` practice mode for staff-note recognition.
- Added a `Staff range` selector:
  - `High` uses treble clef notes.
  - `Low` uses bass clef notes.
  - `Both` mixes treble and bass clef practice.
- Added a `Read format` selector:
  - `Write names` shows a row of staff notes and typed boxes under the notes.
  - `Multiple choice` shows one staff note with four answer buttons.
- `Review labels` now shows the note names under the staff notes for review.
- Staff notes are rendered as black notation with hollow noteheads and ledger lines, not red guide circles.
- The existing notation selector applies to this mode:
  - `Scientific` shows answers such as `C4` and `♯F4`.
  - `Helmholtz` shows answers such as `c¹` and `♯f¹`.
  - `Mixed` accepts and reviews both systems.
- Accidentals use prefix display and typed forms, such as `♯F4`, `♭B1`, `#F4`, and `bB1`.
- In `Read notes`, the existing `Advanced names` switch controls whether accidentals are included; off means natural notes only, on adds sharp/flat staff notes.


## 2026-06-06 Read Notes Rendering Follow-Up

- Corrected staff rendering details for `Read notes`:
  - Treble clef is anchored to the standard G4 line, second line from the bottom.
  - Bass clef is anchored to the standard F3 line, fourth line from the bottom.
  - Staff-note symbols now use filled black noteheads like the exercise examples.
  - Line notes redraw the visible staff-line segments around the notehead so the line remains readable.
  - Accidentals are positioned farther left of the notehead to avoid overlap.
- Changed `Review labels` behavior in `Read notes`:
  - Review mode shows natural notes only.
  - Review mode shows the full selected range in ascending pitch order instead of a random subset.
  - Labels appear to the right of each notehead.
  - `Both` range renders separate ascending low and high clef review rows.


## 2026-06-06 Anchored Clef Rendering Fix

- Replaced font-baseline positioned clefs in `Read notes` with SVG-drawn clefs anchored to staff-reference lines.
- Treble clef rendering now explicitly centers the G-clef curl on G4, the second line from the bottom.
- Bass clef rendering now explicitly centers the F-clef body/dots on F3, the fourth line from the bottom.
- Added a local numeric smoke check confirming the rendered treble anchor and bass anchor match the staff line coordinates.


## 2026-06-06 Clef Glyph Revert

- Removed the custom SVG path clefs because they looked visually strange in the rendered exercise.
- Restored standard Unicode music clef glyphs for treble and bass.
- Kept calibrated baselines relative to the standard clef anchor lines:
  - Treble glyph is positioned from the G4 line.
  - Bass glyph is positioned from the F3 line.


## 2026-06-06 Treble Clef Vertical Adjustment

- Adjusted the `Read notes` treble clef glyph upward after visual feedback.
- The treble clef is now positioned from the G4 anchor line with a smaller baseline offset so its curl aligns with line 2 instead of the ledger line below the staff.


## 2026-06-06 Treble Clef Size Calibration

- Enlarged the `Read notes` treble clef glyph after visual feedback.
- The G-clef remains positioned from the standard line-2 anchor, but the glyph is now larger so the lower round part reaches toward line 1 like a standard printed treble clef.


## 2026-06-06 Whole Note And Treble Clef Adjustment

- Enlarged the `Read notes` treble clef again after visual feedback.
- Changed staff noteheads back to hollow whole notes.
- Kept the line-note redraw behavior so notes on staff lines do not fully hide the line.


## 2026-06-06 Whole Note Shape Adjustment

- Updated `Read notes` noteheads to better match standard whole notes: flatter horizontal oval, hollow center, thicker black outline.
- For notes on staff lines, the staff line is redrawn continuously through the notehead so it remains visible.


## 2026-06-06 Bravura Music Font Change

- Downloaded Steinberg's Bravura SMuFL music font into `assets/fonts/Bravura.otf`.
- Added the Bravura license text at `assets/fonts/Bravura_LICENSE.txt`.
- Updated `Read notes` to render treble clef, bass clef, and whole-note symbols using Bravura SMuFL glyphs instead of hand-drawn noteheads or custom clef shapes.
- SMuFL glyphs used:
  - G clef: `\uE050`
  - F clef: `\uE062`
  - Whole notehead: `\uE0A2`


## 2026-06-06 Bravura Staff Scale Correction

- Updated `Read notes` to render the five-line staff with Bravura's SMuFL `staff5LinesWide` glyph (`\uE01A`) instead of plain SVG lines.
- Set staff, clefs, and whole-note glyphs to a shared Bravura scale of 72px, matching SMuFL's convention that one staff space is 0.25 em for the app's 18px staff spacing.
- This reduces the oversized clef and enlarges the whole note so all notation elements are visually consistent.


## 2026-06-06 Octave Marks Exercise Option

- Added an `Octave marks` toggle for `Read notes` exercises.
- When enabled, generated exercise notes can include:
  - `8va`: written pitch sounds one octave higher.
  - `8vb`: written pitch sounds one octave lower.
  - `15ma`: written pitch sounds two octaves higher.
  - `15mb`: written pitch sounds two octaves lower.
- Octave marks apply only to exercises, not review labels.
- Grading and multiple-choice answers use the sounding pitch, while the staff displays the written pitch with the octave mark.
- Local smoke test confirmed octave-marked items transpose correctly and review mode remains unmarked.

## 2026-06-06 Read Notes Range Expansion

- Expanded `Read notes` exercises and review labels to cover three ledger lines above and below each staff.
- Treble clef now covers written notes from F3 through E6.
- Bass clef now covers written notes from A1 through G4.
- `Review labels` remains natural-note-only, but now shows the full expanded range for the selected staff range.

## 2026-06-07 Read Notes Exercise Alignment Fix

- Kept Bravura glyphs for the staff, treble clef, bass clef, and whole-note noteheads.
- Aligned write-mode answer boxes to the exact SVG note positions instead of an independent grid, preventing boxes from drifting away from the notes they grade.
- Corrected lower-ledger rendering so space notes below the staff do not receive fake ledger lines; only actual ledger-line positions are drawn.
- `Read notes` answers use the sounding pitch when a visible octave mark is present, so `8va`, `8vb`, `15ma`, and `15mb` transpose answers correctly.

## 2026-06-07 iPhone Browser Layout

- Added iPhone-safe viewport handling with `viewport-fit=cover`.
- Kept desktop layout intact while changing small-screen controls into horizontally scrollable segmented strips.
- Made dense practice surfaces mobile-friendly with horizontal touch scrolling: piano keyboards, staff notation rows, staff review rows, and solfege map review tables.
- Increased mobile touch target sizes and adjusted mobile grids for choices, typed answers, interval cards, and solfege sequence inputs.

## 2026-06-07 GitHub Pages `/note_trainer/` Deployment

- Confirmed app asset references are relative, so the same files work in a separate GitHub Pages project repo named `note_trainer`.
- Added `.nojekyll` for plain static GitHub Pages serving.
- Added `DEPLOY.md` for serving the separate `note_trainer` repository at `https://yuyangyy.com/note_trainer/`, assuming `yuyangyy.com` is already configured on the GitHub Pages user site.

## Verification

- Ran a JavaScript syntax check on `app.js`.
- Opened the app through a local test server at `http://127.0.0.1:8765/index.html`.
- Confirmed the default mode still renders a two-octave keyboard.
- Confirmed `Name + group` renders 52 white keys and 36 black keys, with one highlighted target.
- Confirmed scientific choices render as combined answers.
- Confirmed Helmholtz choices render as combined answers and answer grading marks the correct choice.
- Confirmed typed answers grade correctly for simple note naming, scientific grouped naming, and Helmholtz grouped naming.
- Confirmed `Steps` mode renders 12 notes, 24 typed blanks, separate half-step and whole-step sections, and the `Check` to `Next` grading flow.
- Confirmed `Mixed` notation renders both Scientific and Helmholtz style answers inside the same notation-aware exercise.
- Confirmed the static Solfege panel renders as a launcher for the local Gradio app.
- Confirmed `Solfege Map` renders the three mapping modes and grades typed answers.
- Confirmed `Solfege Map` review labels render the full seven-tonic summary table and keep the active quiz visible.
- Confirmed the browser console had no errors during the checked flows.
- Confirmed `Read notes` with a local smoke test: write mode generated 8 staff notes with a `Check` flow, and multiple-choice mode generated one note with 4 choices.
- Confirmed updated `Read notes` review behavior with a local smoke test: `Both` range generated 30 natural notes across 2 clef rows, no answer inputs, and a normal `Next` flow.
- Confirmed anchored clef rendering with a local numeric smoke check: treble G4 line at y=112 and bass F3 line at y=76 are used as the SVG clef anchors.

## Follow-Up Ideas

- Add an option to show both scientific and Helmholtz answers together after each question.
- Add small C-marker labels to the full keyboard if visual orientation becomes difficult for learners.
