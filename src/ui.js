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

	hook() {
		const stateClassBearerEl = document.getElementById("state-bearer")
		const startRecordingBtn = document.getElementById("start-recording-button")
		// The event handler
		async function handler() {
			try {
				// Update the state class lists
				stateClassBearerEl.classList.remove("default-state")
				stateClassBearerEl.classList.add("spectrogram-state")

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
		startRecordingBtn.addEventListener("click", handler.bind(this), {
			// Remove the event listener after it's been triggered once
			once: true
		})

		this.hookLineControls()
	}

	hookLineControls() {
		const horizontalLineEl = document.getElementById("horizontal-line")
		// Place the line
		const maxFreq = 3000
		const minFreq = 0
		const targetFreq = 440
		horizontalLineEl.style.bottom = `${100 * (targetFreq - minFreq) / (maxFreq - minFreq)}%`

		const checkboxEl = document.getElementById("line-controls-checkbox")

		// Handle actions
		checkboxEl.addEventListener("change", (event) => {
			event.stopPropagation()
			if (event.target.checked) {
				horizontalLineEl.style.visibility = "visible"
			} else {
				horizontalLineEl.style.visibility = "hidden"
			}
		})
	}

	async getEventualMediaStream() {
		return this.promise
	}
}
