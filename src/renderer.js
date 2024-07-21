import { applyColorMap } from "./colormaps.js"

// This class is responsible for rendering the spectrogram chunk by chunk on a
// canvas.
export class Renderer {
	// The arguments height and width are the dimensions of the spectrogram
	// in number of discretized samples.
	// The discretization in the frequency domain is obtained in the same way
	// from the discretization in the time domain as for the discrete Fourier
	// transform.
	constructor(canvas, stream, height, width) {
		// We set the resolution of the canvas to match the physical
		// resolution of the display
		// window.devicePixelRatio is the size of a CSS pixel in
		// physical pixels
		const pixelRatio = window.devicePixelRatio
		// This is the size of the canvas in CSS pixels
		const canvasRect = canvas.getBoundingClientRect()
		// Combining both, we get the physical resolution of the canvas
		// on screen and we use it as the resolution of the canvas
		canvas.width = canvasRect.width * pixelRatio
		canvas.height = canvasRect.height * pixelRatio

		// CanvasRenderingContext2D should be the best choice as
		// ImageBitmapRenderingContext appears not to support drawing
		// rescaled textures
		const ctx = canvas.getContext("2d", {
			// It's not entirely clear what this does but it might
			// be important
			antialias: false,
			// This option might be important for good performance
			// as we read the canvas each time a new chunk is rendered
			// in order to translate it
			willReadFrequently: true
		})
		// NOTE: We disable the anti-aliasing filter which might be
		// used when rescaling the the texture to the canvas
		ctx.imageSmoothingEnabled = false

		// We set the transformation matrix of the rendering context such that
		// new chunks are drawn at coordinate 0, 0 using the same scale
		// for the texture and for the rendering context
		ctx.resetTransform()
		ctx.translate(canvas.width, canvas.height)
		ctx.scale(-canvas.width / width, -canvas.height / height)

		this.stream = stream
		this.height = height
		this.ctx = ctx
	}

	// NOTE: It'd be great to make this function regular as opposed to
	// asynchronous
	async renderNewSpectrogramChunk(data) {
		const height = this.height

		// The length of data should normally be equal to width *
		// height. We verify if it's the case and report if it's not.
		let width = data.length / height
		if (!Number.isInteger(width)) {
			console.error('The width of the spectrogram chunk is not an integer')
			width = Math.floor(width)
		}

		// NOTE: We compute the bitmap early to
		// ensure the two rendering operations are
		// made sequentially, avoiding flickering
		const imageData = applyColorMap(data)
		const texture = new ImageData(imageData, width, height, {
			// This is a sensible choice for the color space.
			colorSpace: 'srgb'
		})

		// It appears that it's not possible to use the drawImage
		// method with an instance of ImageData and instead we use an
		// ImageBitmap instance obtained from it.
		const bitmap = await createImageBitmap(texture)

		// Make some space for the new spectrogram
		// chunk by moving everything else to the left
		this.translateEverythingDrawn(this.ctx, width, 0)

		// Draw the new spectrogram chunk
		this.ctx.drawImage(bitmap, 0, 0)
	}

	// This function translates everything that has been drawn on the canvas.
	// NOTE: It's somewhat expensive as it requires 1) reading the whole canvas
	// and 2) redrawing it entirely. It's unclear how to avoid that though.
	translateEverythingDrawn(ctx, dx, dy) {
		// Read the whole canvas
		const content = ctx.getImageData(0, 0, canvas.width, canvas.height)

		// Clear the canvas
		ctx.clearRect(0, 0, canvas.width, canvas.height)

		// The methods getImageData and putImageData use the global coordinate system
		// of the canvas and is unaffected by the transformation matrix. This means
		// we need to apply the transformation matrix ourselves since the variables dx
		// and dy are expected to be expressed in the local coordinate system.
		const transform = ctx.getTransform()

		// The property transform.a holds the horizontal scaling factor
		// of the transformation matrix.
		dx = transform.a * dx

		// The property transform.d holds the vertical scaling factor
		// of the transformation matrix.
		dy = transform.d * dy

		// Draw the translated content
		ctx.putImageData(content, dx, dy)
	}

	// Hook the stream to the renderer
	async start() {
		try {
			// Wait for new chunks
			for await (const chunk of this.stream) {
				// Draw the chunk
				await this.renderNewSpectrogramChunk(chunk)
			}
		} catch (err) {
			console.error(err)
		}
	}
}
