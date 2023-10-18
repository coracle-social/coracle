import EventEmitter from "events"
import Hls from "hls.js"

export class AudioController extends EventEmitter {
  completed = false
  progress = 0
  interval: any = null
  audio = new Audio()
  hls?: Hls

  constructor(readonly url) {
    super()

    if (url.endsWith("m3u8")) {
      this.hls = new Hls()
      this.hls.loadSource(this.url)
      this.hls.attachMedia(this.audio)
    } else {
      this.audio.src = url
    }
  }

  reportProgress = () => {
    const {currentTime, duration} = this.audio

    this.progress = currentTime ? currentTime / duration : 0

    this.emit("progress", this.progress)

    if (this.progress === 1 && !this.completed) {
      this.completed = true
      this.emit("completed")
    }
  }

  setProgress = progress => {
    this.audio.currentTime = Math.round(this.audio.duration * progress)
    this.reportProgress()
  }

  play = () => {
    if (!this.interval) {
      this.audio.play()
      this.emit("play")
      this.interval = setInterval(this.reportProgress, 30)
    }
  }

  pause = () => {
    if (this.interval) {
      this.audio.pause()
      this.emit("pause")

      clearInterval(this.interval as unknown as number)

      this.interval = null
    }
  }

  toggle = e => {
    if (this.interval) {
      this.pause()
    } else {
      this.play()
    }
  }

  cleanup() {
    clearInterval(this.interval as unknown as number)

    this.hls?.destroy()
    this.audio.pause()
  }
}
