A real-time spectrogram running in the browser written in JavaScript using the [Web Audio API](https://www.w3.org/TR/webaudio/)

![Graphical User Interface of the Spectrogram](assets/gui.png)

# Demo

A live demo is available [here](https://jeremyscanvic.com/spectrogram/)

# Usage

Clone the repository

```bash
git clone https://github.com/jscanvic/spectrogram
cd spectrogram
```

Start an HTTP server in the current directory

```bash
python -m http.server -b 127.0.0.1 8000
```

Open the following URL in a web browser

```bash
xdg-open "http://127.0.0.1:8000/"
```
