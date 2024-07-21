import { sleep } from "./time.js"

// NOTE: This timer is very inaccurate as it's based on the setTimeout function
// which provides no guarantee of precision. A better implementation might use
// the Date class to measure time intervals more precisely. This means that for
// high window durations, the spectrogram might be way off in time.
async function* getTimer(tickrate) {
	while (true) {
		await sleep(tickrate)
		yield
	}
}

export async function* getSpectrogramStream(mediaStream, windowDuration) {
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

	// Periodically get the frequency data from the microphone
	const chunk = new Uint8Array(analyser.frequencyBinCount)
	const tickrate = 1000 * windowDuration / audioContext.sampleRate
	const timer = getTimer(tickrate)
	for await (const _ of timer) {
		// Read the latest frequency data from the microphone into the
		// variable chunk
		analyser.getByteFrequencyData(chunk)
		yield chunk
	}
}
