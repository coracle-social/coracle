<script lang="ts">
  import {onMount, onDestroy} from "svelte"

  export let controller
  export let autoPlay = false
  export let autoCleanup = true

  let visualizer
  let playing = Boolean(controller.interval)

  const setAudioPosition = ({clientX}) => {
    const {left, width} = visualizer.getBoundingClientRect()

    controller.setProgress((clientX - left) / width)
  }

  const onProgress = p => {
    visualizer.childNodes[0].style = `width: ${p * 100}%;`
  }

  const onPlay = () => {
    playing = true
  }

  const onPause = () => {
    playing = false
  }

  onMount(() => {
    onProgress(controller.progress)

    controller.on("progress", onProgress)
    controller.on("play", onPlay)
    controller.on("pause", onPause)

    if (autoPlay) {
      controller.play()
    }
  })

  onDestroy(() => {
    if (autoCleanup) {
      controller.cleanup()
    } else {
      controller.off("progress", onProgress)
      controller.off("play", onPlay)
      controller.off("pause", onPause)
    }
  })
</script>

<div class="flex items-center gap-2" on:click|stopPropagation>
  <div
    class="flex h-10 w-10 cursor-pointer items-center justify-center rounded-full bg-accent"
    on:click={controller.toggle}>
    {#if playing}
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
