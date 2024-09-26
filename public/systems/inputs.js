

export class Inputs {
    constructor(camera, renderer) {
        this.events = {}
        this.camera = camera
        this.renderer = renderer

        this.addEvent('keydown')
        this.addEvent('keyup')
        this.addEvent('mousedown')
        this.addEvent('mouseup')

        window.addEventListener('resize', () => {
            this.onWindowResize()
        });
    }

    onWindowResize() {
        this.camera.aspect = window.innerWidth / window.innerHeight;
        this.camera.updateProjectionMatrix();

        this.renderer.setSize( window.innerWidth, window.innerHeight );
    }

    registerHandler(event, callback) {
        if (!this.events[event]) {
            this.events[event] = []
        }
        this.events[event].push(callback)
    }

    addEvent(event) {
        document.addEventListener(event, (e) => this.iterateHandlers(event, e))
    }

    iterateHandlers(event, e) {
        if (!this.events[event]) return
        this.events[event].forEach(callback => {
            callback(e)  // Pass the event object to the callback
        })
    }
}
