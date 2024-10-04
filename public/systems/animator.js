import * as THREE from '../imports/three.module.js'
import { FBXLoader } from '../imports/FBXLoader.js'

const animations = ['fps_standard', 'fps_run', 'reloading', 'throwable', 'walk_aim', 'death']

export class Animator {
    constructor(mixer) {
        this.mixer = mixer
        this.animations = {}
        this.currentAnimationPlaying = ''
        this.timeMultiplayer = 1

        this.loader = new FBXLoader()
        this.loader.setPath('animations/')

        animations.forEach(key => {
            this.loader.load(key + '.fbx', animation => {
                this.animations[key] = this.mixer.clipAction(animation.animations[0])

                if (key === 'reloading' || key === 'death') {
                    this.animations[key].setLoop(THREE.LoopOnce)
                    this.animations[key].clampWhenFinished = true

                    // Add the event listener for 'finished' only once
                    this.mixer.addEventListener('finished', (e) => {
                        this.play('fps_standard') // Play standard animation after reload
                    })
                }
            })
        })
    }

    pauseAnimation() {
        this.animations[this.currentAnimationPlaying].paused = true
    }

    play(key) {
        if (!this.animations[key] || key === this.currentAnimationPlaying) return

        animations.forEach(_key => {
            this.animations[_key].fadeOut(0.2)
        })

        this.animations[key].reset().fadeIn(0.2).play()
        this.currentAnimationPlaying = key
    }

    update(dt) {
        dt *= this.timeMultiplayer
        this.mixer.update(dt)
    }
}
