
class Piano {
		constructor() {
				this.synth = null;
				this.reverb = null;
				this.volume = null;
				this.activeNotes = new Map();
				this.noteTimeouts = new Map(); // For automatic fadeout
				this.volumeLevel = 0.5;
				this.reverbAmount = 0.2;
				this.octaveShift = 0;
				this.sustainPedal = false;
				this.sustainedNotes = new Set();

				this.init();
				this.createPianoKeys();
				this.setupControls();
				this.setupKeyboardListeners();
		}

		async init() {
				try {
						// Initialize Tone.js
						await Tone.start();

						// Prepare sample files for 88-key piano (A0-C8)
						// Only as example: adding C, D, E, F, G, A, B notes and octaves
						// File names in Media folder should be like: Piano.ff.C4.mp3
						const notes = ['A', 'A#', 'B', 'C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#'];
						const urls = {};
						// A0 (21) - C8 (108)
						for (let midi = 21; midi <= 108; midi++) {
							let noteName = this.midiToNote(midi);
							// Replace # with 'sharp' for file names
							const fileNoteName = noteName.replace(/#/g, 'sharp');
							urls[noteName] = `piano-note-key-${fileNoteName}.mp3`;
}

						this.synth = new Tone.Sampler({
								urls: urls,
								baseUrl: './audio/',
								onerror: (e) => { console.error('Sound could not be loaded:', e); }
						});

						// Reverb and volume chain
						this.reverb = new Tone.Reverb({
								decay: 4,
								wet: this.reverbAmount
						});
						this.volume = new Tone.Volume(-6);
						this.synth.connect(this.reverb);
						this.reverb.connect(this.volume);
						this.volume.toDestination();
				} catch (error) {
						console.error('Audio initialization failed:', error);
				}
		}

		createPianoKeys() {
				const piano = document.getElementById('piano');
				const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
				const whiteNotes = ['C', 'D', 'E', 'F', 'G', 'A', 'B'];
				const blackNotes = ['C#', 'D#', 'F#', 'G#', 'A#'];

				// A0 is MIDI note 21, C8 is MIDI note 108
				// 88 keys total from A0 to C8
				let keyCount = 0;

				// Start with A0, A#0, B0
				this.createKey(piano, 'A', 0, 21, true, keyCount++);
				this.createKey(piano, 'A#', 0, 22, false, keyCount++);
				this.createKey(piano, 'B', 0, 23, true, keyCount++);

				// C1 to B7 (full octaves)
				for (let octave = 1; octave <= 7; octave++) {
						for (let i = 0; i < 12; i++) {
								const note = notes[i];
								const midiNote = 24 + (octave - 1) * 12 + i; // C1 = 24
								const isWhite = whiteNotes.includes(note);
								this.createKey(piano, note, octave, midiNote, isWhite, keyCount++);
						}
				}

				// Final C8
				this.createKey(piano, 'C', 8, 108, true, keyCount++);

				// Position black keys
				this.positionBlackKeys();
		}

		createKey(container, note, octave, midiNote, isWhite, index) {
				const key = document.createElement('div');
				key.className = `key ${isWhite ? 'white-key' : 'black-key'}`;
				key.dataset.note = note;
				key.dataset.octave = octave;
				key.dataset.midi = midiNote;
				key.dataset.index = index;

				// Add note label for white keys
				if (isWhite) {
						const label = document.createElement('div');
						label.className = 'key-label';
						label.textContent = `${note}${octave}`;
						key.appendChild(label);
				}


				key.addEventListener('mousedown', (e) => {
						e.preventDefault();
						this.playNote(midiNote, true);
						key.classList.add('active');
				});

				key.addEventListener('mouseup', () => {
						this.stopNote(midiNote);
						key.classList.remove('active');
				});

				key.addEventListener('mouseleave', () => {
						this.stopNote(midiNote);
						key.classList.remove('active');
				});

				container.appendChild(key);
		}

		positionBlackKeys() {
				const whiteKeys = document.querySelectorAll('.white-key');
				const blackKeys = document.querySelectorAll('.black-key');

				let blackKeyIndex = 0;
				let whiteKeyIndex = 0;

				blackKeys.forEach(blackKey => {
						const note = blackKey.dataset.note;
						const octave = parseInt(blackKey.dataset.octave);

				// Find the corresponding white key to position relative to
				let targetWhiteKey;

						if (note === 'C#' || note === 'A#') {
								// Position between C-D or A-B
								const baseNote = note === 'C#' ? 'C' : 'A';
								targetWhiteKey = Array.from(whiteKeys).find(k =>
										k.dataset.note === baseNote &&
										parseInt(k.dataset.octave) === octave
								);
								if (targetWhiteKey) {
										blackKey.style.left = `${targetWhiteKey.offsetLeft + 22}px`;
								}
						} else if (note === 'D#') {
								// Position between D-E
								targetWhiteKey = Array.from(whiteKeys).find(k =>
										k.dataset.note === 'D' &&
										parseInt(k.dataset.octave) === octave
								);
								if (targetWhiteKey) {
										blackKey.style.left = `${targetWhiteKey.offsetLeft + 22}px`;
								}
						} else if (note === 'F#') {
								// Position between F-G
								targetWhiteKey = Array.from(whiteKeys).find(k =>
										k.dataset.note === 'F' &&
										parseInt(k.dataset.octave) === octave
								);
								if (targetWhiteKey) {
										blackKey.style.left = `${targetWhiteKey.offsetLeft + 22}px`;
								}
						} else if (note === 'G#') {
								// Position between G-A
								targetWhiteKey = Array.from(whiteKeys).find(k =>
										k.dataset.note === 'G' &&
										parseInt(k.dataset.octave) === octave
								);
								if (targetWhiteKey) {
										blackKey.style.left = `${targetWhiteKey.offsetLeft + 22}px`;
								}
						}
				});
		}

		midiToNote(midiNote) {
				const notes = ['C', 'C#', 'D', 'D#', 'E', 'F', 'F#', 'G', 'G#', 'A', 'A#', 'B'];
				const octave = Math.floor((midiNote - 12) / 12);
				const noteIndex = (midiNote - 12) % 12;
				return notes[noteIndex] + octave;
		}

		async playNote(midiNote, isPress = false) {
				if (!this.synth) {
						await this.init();
				}

				const adjustedMidi = midiNote + (this.octaveShift * 12);
				const noteName = this.midiToNote(adjustedMidi);

				// Stop existing note if playing
				if (this.activeNotes.has(midiNote)) {
						this.stopNote(midiNote);
				}

				// Play the sample (velocity parameter is not available in Sampler, only in PolySynth)
				this.synth.triggerAttack(noteName);
				this.activeNotes.set(midiNote, {
						noteName,
						isPlaying: true,
						startTime: Tone.now()
				});
		}

		stopNote(midiNote) {
				if (!this.activeNotes.has(midiNote)) return;

				const noteData = this.activeNotes.get(midiNote);

				// If sustain pedal is pressed, add to sustained notes
				if (this.sustainPedal) {
						this.sustainedNotes.add(midiNote);
						noteData.isSustained = true;
						return;
				}

				// Release the note
				this.synth.triggerRelease(noteData.noteName);
				this.activeNotes.delete(midiNote);
		}

		setSustain(isPressed) {
				this.sustainPedal = isPressed;

				// If sustain is released, stop all sustained notes
				if (!this.sustainPedal) {
						this.sustainedNotes.forEach(midiNote => {
								if (this.activeNotes.has(midiNote)) {
										const noteData = this.activeNotes.get(midiNote);
										if (noteData.isSustained) {
												this.synth.triggerRelease(noteData.noteName);
												this.activeNotes.delete(midiNote);
										}
								}
						});
						this.sustainedNotes.clear();
				}
		}

		setupControls() {
				const volumeSlider = document.getElementById('volume');
				const reverbSlider = document.getElementById('reverb');
				const octaveSlider = document.getElementById('octave');
				const octaveDisplay = document.getElementById('octave-display');

				volumeSlider.addEventListener('input', (e) => {
						this.volumeLevel = e.target.value / 100;
						if (this.volume) {
								this.volume.volume.value = Tone.gainToDb(this.volumeLevel);
						}
				});

				reverbSlider.addEventListener('input', (e) => {
						this.reverbAmount = e.target.value / 100;
						if (this.reverb) {
								this.reverb.wet.value = this.reverbAmount;
						}
				});

				octaveSlider.addEventListener('input', (e) => {
						this.octaveShift = parseInt(e.target.value);
						octaveDisplay.textContent = this.octaveShift;
				});
		}

		setupKeyboardListeners() {
				const keyMap = {
						'KeyA': 60, // C4
						'KeyW': 61, // C#4
						'KeyS': 62, // D4
						'KeyE': 63, // D#4
						'KeyD': 64, // E4
						'KeyF': 65, // F4
						'KeyT': 66, // F#4
						'KeyG': 67, // G4
						'KeyY': 68, // G#4
						'KeyH': 69, // A4
						'KeyU': 70, // A#4
						'KeyJ': 71, // B4
						'KeyK': 72, // C5
						'KeyO': 73, // C#5
						'KeyL': 74, // D5
						'KeyP': 75, // D#5
						'Semicolon': 76 // E5
				};

				const pressedKeys = new Set();


				document.addEventListener('keydown', (e) => {
						if (e.repeat) return;

						// Sustain pedal (Space key) - hold
						if (e.code === 'Space') {
								e.preventDefault();
								if (!this.sustainPedal) {
										this.setSustain(true);
								}
								return;
						}

						if (pressedKeys.has(e.code)) return;

						const midiNote = keyMap[e.code];
						if (midiNote) {
								e.preventDefault();
								pressedKeys.add(e.code);
								this.playNote(midiNote, true);

								// Visual feedback
								const targetMidi = midiNote + (this.octaveShift * 12);
								const key = document.querySelector(`[data-midi="${targetMidi}"]`);
								if (key) key.classList.add('active');
						}
				});

				document.addEventListener('keyup', (e) => {
						// Sustain pedal release
						if (e.code === 'Space') {
								e.preventDefault();
								this.setSustain(false);
								return;
						}

						const midiNote = keyMap[e.code];
						if (midiNote) {
								pressedKeys.delete(e.code);
								this.stopNote(midiNote);

								// Remove visual feedback
								const targetMidi = midiNote + (this.octaveShift * 12);
								const key = document.querySelector(`[data-midi="${targetMidi}"]`);
								if (key) key.classList.remove('active');
						}
				});
		}
}

// Initialize piano when page loads
document.addEventListener('DOMContentLoaded', () => {
		new Piano();
});

// Handle page visibility for audio context
document.addEventListener('visibilitychange', () => {
		if (document.hidden) {
				// Stop all playing notes when tab becomes hidden
				const activeKeys = document.querySelectorAll('.key.active');
				activeKeys.forEach(key => key.classList.remove('active'));
		}
});