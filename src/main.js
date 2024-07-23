import { config } from "./config.js"
import { SpectrogramStream } from "./spectrogram.js"
import { Renderer } from "./renderer.js"
import { UI } from "./ui.js"

const canvas = document.getElementById('canvas')

const ui = new UI()
const mediaStream = await ui.getEventualMediaStream()
const stream = new SpectrogramStream(
	mediaStream,
	config.windowDuration,
	config.temporalResolution,
)

const height = config.windowDuration / 2
const width = config.maxDuration / config.temporalResolution
const renderer = new Renderer(
	canvas,
	stream,
	height,
	width,
	config.verticalZoom,
)

renderer.start()
