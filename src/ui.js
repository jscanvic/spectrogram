// A very basic user interface with a default state and a second state after
// one of the audio sources has been chosen
// NOTE: This is messy.
export class UI {
	constructor() {
		// A slightly unidiomatic way to synchronize stuff
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})

		// Hook the logic to the UI elements
		this.hook()
	}

	// NOTE: This is very messy. The point is there's multiple user interactions
	// that determine different media streams.
	hook() {
		const microphoneButtonEl = document.getElementById("microphone")
		const soundsButtonEl = document.getElementById("sounds")
		const buttons = [microphoneButtonEl, soundsButtonEl]
		// The event handler
		async function handler() {
			try {
				// Delete the button upon click
				buttons.forEach(button => button.remove())

				// Get the instance of MediaStream corresponding to the user's microphone
				const mediaStream = await navigator.mediaDevices.getUserMedia({
					// We want access to the audio stream.
					audio: true,
					// The video stream is unnecessary.
					video: false
				})

				// Resolve the promise with the MediaStream instance
				this.resolve(mediaStream)
			} catch (err) {
				// Reject the promise with the error
				this.reject(err)
			}
		}

		// Fire the event listener when the button is clicked
		microphoneButtonEl.addEventListener("click", handler.bind(this), {
			// Remove the event listener after it's been triggered once
			once: true
		})

		soundsButtonEl.addEventListener("click", async (event) => {
			const target = event.target
			if (target.dataset.path === undefined) {
				return
			}
			buttons.forEach(button => button.remove())
			const audioEl = document.createElement("audio")
			audioEl.src = target.dataset.path

			const mediaStream = audioEl.captureStream()

			// NOTE: We wait for the audio to be fully loaded before playing it in
			// order to avoid buffering.
			audioEl.addEventListener("canplaythrough", async () => {
				audioEl.play()
				// NOTE: Before the audio starts playing, its sample rate is
				// unknown, so we need to wait a bit more.
				audioEl.addEventListener("timeupdate", () => {
					this.resolve(mediaStream)
				}, { once: true })
			})
		}, { once: true })
	}

	async getEventualMediaStream() {
		return this.promise
	}
}
