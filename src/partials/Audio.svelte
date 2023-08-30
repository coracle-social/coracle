<script>
  import Hls from "hls.js"
  import {onDestroy} from "svelte"

  export let url

  let visualizer, timeout

  const audio = new Audio()
  const hls = new Hls()

  hls.loadSource(url)
  hls.attachMedia(audio)

  const toggleAudio = e => {
    if (timeout) {
      audio.pause()
      timeout = clearInterval(timeout)
    } else {
      audio.play()
      timeout = setInterval(updateAudio, 30)
    }
  }

  const updateAudio = () => {
    const {currentTime, duration} = audio
    const pct = currentTime ? currentTime / duration : 0

    visualizer.childNodes[0].style = `width: ${pct * 100}%;`
  }

  const setAudioPosition = ({clientX}) => {
    const {left, width} = visualizer.getBoundingClientRect()
    const pct = (clientX - left) / width

    if (!isNaN(audio.duration)) {
      audio.currentTime = Math.round(audio.duration * pct)
    }
  }

  onDestroy(() => {
    clearInterval(timeout)
    hls?.destroy()
  })
</script>

<div class="flex items-center gap-2" on:click|stopPropagation>
  <div
    class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent"
    on:click={toggleAudio}>
    {#if timeout}
      <i class="fa fa-pause" />
    {:else}
      <i class="fa fa-play ml-1" />
    {/if}
  </div>
  <div
    class="flex h-2 flex-grow cursor-pointer overflow-hidden rounded-full bg-gray-6"
    bind:this={visualizer}
    on:click={setAudioPosition}>
    <div class="inline-block h-2 bg-accent" />
  </div>
</div>
