// A very basic user interface with a default state and a second state after
// one of the audio sources has been chosen

// NOTE: This is messy.
export class UI {
	constructor(maximumFrequency) {
		this.maximumFrequency = maximumFrequency

		// A slightly unidiomatic way to synchronize stuff
		this.promise = new Promise((resolve, reject) => {
			this.resolve = resolve
			this.reject = reject
		})

		// Hook the logic to the UI elements
		this.hook()
		this.setUpAxisLabels()
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

	setUpAxisLabels() {
		const el = document.getElementById("axes-overlay")
		const minimumFrequency = 0
		const maximumFrequency = this.maximumFrequency
		const N = 5
		const step = Math.floor((maximumFrequency - minimumFrequency) / N)
		const freqs = []
		for (let f = maximumFrequency; f >= minimumFrequency; f -= step) {
			freqs.push(f)
		}

		function formatFreq(freq) {
			return `${freq} Hz`
		}

		for (const freq of freqs) {
			const childEl = document.createElement("div")
			childEl.textContent = formatFreq(freq)
			el.appendChild(childEl)
		}
	}
}
