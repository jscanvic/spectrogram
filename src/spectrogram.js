function sleep(duration) {
	return new Promise(resolve => setTimeout(resolve, duration))
}

async function* getTimer(tickrate) {
	let last = Date.now()
	let ticks = 0
	while (true) {
		const now = Date.now()
		ticks += Math.floor(Math.max(0, (now - last) / tickrate))
		if (ticks != 0) {
			last = now
		}
		for (; ticks != 0; ticks--) {
			yield
			// This allows the frequency data to be gathered before the next tick
		}
		// This avoids busy waiting, i.e. putting the CPU on fire
		await sleep(last + tickrate - now)
	}

}

export class SpectrogramStream {
	constructor(mediaStream, windowDuration, temporalResolution) {
		// Try to find the sample rate of the media stream
		// NOTE: This is brittle.
		const sampleRate = mediaStream?.getAudioTracks()[0]?.getSettings().sampleRate ?? null
		const audioContext = new AudioContext({
			sampleRate,
			smoothingTimeConstant: 0,
			maxDecibels: -30,
			minDecibels: -100,
		})

		// Automatically get an audio source with exactly one audio channel
		// from the microphone
		const audioSource = audioContext.createMediaStreamSource(mediaStream)

		// This is what's responsible for computing the discrete Fourier
		// transforms.
		const analyser = new AnalyserNode(audioContext, {
			fftSize: windowDuration,
			channelCount: 1,
		})

		// Connect the microphone to the DFT node
		audioSource.connect(analyser)

		console.info(`Sample rate: ${audioContext.sampleRate} Hz`)
		this.sampleRate = audioContext.sampleRate
		this.analyser = analyser
		this.temporalResolution = temporalResolution
	}

	async* get() {
		// Periodically get the frequency data from the microphone
		const chunk = new Uint8Array(this.analyser.frequencyBinCount)
		const timer = getTimer(this.temporalResolution)
		for await (const _ of timer) {
			// Read the latest frequency data from the microphone into the
			// variable chunk
			this.analyser.getByteFrequencyData(chunk)
			yield chunk
		}
	}
}
