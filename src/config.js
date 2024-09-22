export const config = {
	// Window duration in frames (ought to be a power of 2)
	// 2^9 samples span about 10ms at a sample rate of 48,000 Hz
	// windowDuration: 2 ** 9,
	// 2^12 samples span about 80ms at a sample rate of 48,000 Hz
	windowDuration: 2 ** 12,
	// Maximum duration of the spectrogram displayed on screen (in milliseconds)
	maxDuration: 5000,
	// Temporal resolution in milliseconds
	temporalResolution: 8,
	// Maximum frequency (in Hertz) shown on the spectrogram
	maximumFrequency: 3000,
}
