import * as THREE from '../imports/three.module.js';

export class Audio {
    constructor(listener) {
        this.listener = listener;
        this.audioLoader = new THREE.AudioLoader(); // Load audio files
        this.soundBuffers = {}; // Store audio buffers
        this.activeSounds = {}; // Track currently playing sounds by name
    }

    // Load a sound buffer and store it
    loadSound(name, filePath, isPositional = false) {
        this.audioLoader.load(filePath, (buffer) => {
            this.soundBuffers[name] = { buffer, isPositional }; // Store buffer and type
            this.activeSounds[name] = []; // Initialize active sounds array for this sound
        });
    }

    // Play a new instance of the sound each time
    play(name, volume = 1, loop = false) {
        const soundData = this.soundBuffers[name];
        if (soundData) {
            const audio = new THREE.Audio(this.listener); // Create new instance
            audio.setBuffer(soundData.buffer);
            audio.setVolume(volume);
            audio.setLoop(loop);
            audio.play();

            this.activeSounds[name].push(audio); // Store reference to active sound

            // Remove from activeSounds once it finishes playing
            audio.onEnded = () => {
                this.removeActiveSound(name, audio);
            };
        } else {
            console.warn(`Sound ${name} not found.`);
        }
    }

    // Play positional audio at a specific position, creating a new instance each time
    playPositionalAudio(name, x, y, z, volume = 1, loop = false) {
        const soundData = this.soundBuffers[name];
        if (soundData && soundData.isPositional) {
            const positionalAudio = new THREE.PositionalAudio(this.listener); // New instance
            positionalAudio.setBuffer(soundData.buffer);
            positionalAudio.setVolume(volume);
            positionalAudio.setLoop(loop);
            positionalAudio.position.set(x, y, z);
            positionalAudio.play();

            console.log(positionalAudio)

            //positionalAudio.setRolloffFactor(10)

            this.activeSounds[name].push(positionalAudio); // Store reference to active sound

            // Remove from activeSounds once it finishes playing
            positionalAudio.onEnded = () => {
                this.removeActiveSound(name, positionalAudio);
            };
        } else {
            console.warn(`Positional sound ${name} not found or not positional.`);
        }
    }

    // Stop a specific sound instance (e.g., stop gunshot sound)
    stop(name) {
        const activeSounds = this.activeSounds[name];
        if (activeSounds && activeSounds.length > 0) {
            activeSounds.forEach(sound => {
                if (sound.isPlaying) {
                    sound.stop();
                }
            });
            this.activeSounds[name] = []; // Clear active sounds once stopped
        }
    }

    // Remove a sound from the activeSounds list once it finishes playing
    removeActiveSound(name, audio) {
        this.activeSounds[name] = this.activeSounds[name].filter(sound => sound !== audio);
    }
}
