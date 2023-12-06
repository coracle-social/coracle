<script lang="ts">
  import Image from "src/partials/Image.svelte"

  export let urls

  let el
  let i = 0
  let h = 0

  $: max = urls.length

  const duration = 200

  // Hack to prevent reflow jank
  const forceHeightDuringTransition = () => {
    h = el.clientHeight

    setTimeout(() => {
      h = 0
    }, duration)
  }

  const prev = () => {
    i = i - 1 + (max % max)
    forceHeightDuringTransition()
  }

  const next = () => {
    i = (i + 1) % max
    forceHeightDuringTransition()
  }

  const getPixels = () => el.clientWidth

  const send = node => () => {
    let top = node.offsetTop - parseFloat(getComputedStyle(node).marginTop)
    let left = node.offsetLeft

    return {
      duration,
      // Remove the element from the normal flow so that it doesn't interfere with the
      // placement of the new element, but position it exactly where it was.
      css: (t, u) =>
        `position:absolute;top:${top}px;left:${left}px;transform:translateX(-${Math.floor(
          getPixels() * u,
        )}px)`,
    }
  }

  const receive = node => () => ({
    duration,
    css: (t, u) => `transform:translateX(${Math.floor(getPixels() * u)}px)`,
  })
</script>

{#if urls.length > 0}
  <div
    class="relative flex items-center overflow-hidden rounded-xl"
    style={`min-height: ${h}px`}
    on:click|stopPropagation
    bind:this={el}>
    {#if urls.length > 1}
      <div
        class="transition-duration-300 relative left-4 z-10 -mr-8 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-lightest bg-dark opacity-75 transition-all hover:opacity-100"
        on:click={prev}>
        <i class="fa fa-chevron-left" />
      </div>
    {/if}
    <div>
      {#key i}
        <div in:receive out:send>
          <Image src={urls[i]} />
        </div>
      {/key}
    </div>
    {#if urls.length > 1}
      <div
        class="transition-duration-300 relative right-4 z-10 -ml-8 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full border border-solid border-lightest bg-dark opacity-75 transition-all hover:opacity-100"
        on:click={next}>
        <i class="fa fa-chevron-right" />
      </div>
    {/if}
  </div>
{/if}
