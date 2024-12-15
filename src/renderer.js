import colormap from "./colormaps.js"

// NOTE: We might be able to mutate the data array directly
// in order to avoid possibly costly memory allocations.
function applyColorMap(data) {
	const imageData = new Uint8ClampedArray(data.length * 4)
	for (let i = 0; i < data.length; i++) {
		const c = colormap[Math.floor(data[i] * (colormap.length - 1) / 255)]
		// const c = cmap[data[i]]
		imageData[i * 4] = c[0] * 255
		imageData[i * 4 + 1] = c[1] * 255
		imageData[i * 4 + 2] = c[2] * 255
		imageData[i * 4 + 3] = 255
	}
	return imageData
}

// This class is responsible for rendering the spectrogram chunk by chunk on a
// canvas.
export class Renderer {
	// The arguments height and width are the dimensions of the spectrogram
	// in number of discretized samples.
	// The discretization in the frequency domain is obtained in the same way
	// from the discretization in the time domain as for the discrete Fourier
	// transform.
	constructor(canvas, stream, height, width, maximumFrequency) {
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
		ctx.scale(-canvas.width / width, -canvas.height * stream.sampleRate / (2 * maximumFrequency * height))

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

	// This function draws a shifted copy of the canvas on itself. NOTE:
	// The canvas is **not** cleared before drawing the shifted copy.
	// For more details, see https://stackoverflow.com/a/36337777
	translateEverythingDrawn(ctx, dx, dy) {
		// It is unclear why but we need to apply the transformation
		// matrix manually to the translation vector.
		const transform = ctx.getTransform()

		// The property transform.a holds the horizontal scaling factor
		// of the transformation matrix.
		dx = transform.a * dx

		// The property transform.d holds the vertical scaling factor
		// of the transformation matrix.
		dy = transform.d * dy

		// Reset the coordinate system before drawing the translated
		// canvas
		ctx.resetTransform()

		// Draw the translated canvas
		ctx.drawImage(ctx.canvas, dx, dy)

		// Restore the transformation matrix
		ctx.setTransform(transform)
	}

	// Hook the stream to the renderer
	async start() {
		try {
			// Wait for new chunks
			for await (const chunk of this.stream.get()) {
				// Draw the chunk
				await this.renderNewSpectrogramChunk(chunk)
			}
		} catch (err) {
			console.error(err)
		}
	}
}
