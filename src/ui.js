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
		const microphoneButtonEl = document.getElementById("microphone")
		// The event handler
		async function handler() {
			try {
				// Delete the button upon click
				microphoneButtonEl.remove()

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
	}

	async getEventualMediaStream() {
		return this.promise
	}
}
