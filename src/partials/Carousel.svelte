<script lang="ts">
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
  import Image from 'src/partials/Image.svelte'

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
    i = (i - 1) + max % max
    forceHeightDuringTransition()
  }

  const next = () => {
    i = (i + 1) % max
    forceHeightDuringTransition()
  }

  const getPixels = () => el.clientWidth

  const send = (node) => () => {
    let top = node.offsetTop - parseFloat(getComputedStyle(node).marginTop);
    let left = node.offsetLeft;

    return {
      duration,
      // Remove the element from the normal flow so that it doesn't interfere with the
      // placement of the new element, but position it exactly where it was.
      css: (t, u) => `position:absolute;top:${top}px;left:${left}px;transform:translateX(-${Math.floor(getPixels()*u)}px)`
    }
  }

  const receive = node => () => ({
    duration,
    css: (t, u) => `transform:translateX(${Math.floor(getPixels()*u)}px)`,
  })
</script>

{#if urls.length > 0}
  <div
    class="rounded-xl overflow-hidden flex items-center relative"
    style={`min-height: ${h}px`}
    on:click|stopPropagation
    bind:this={el}>
    {#if urls.length > 1}
      <div class="rounded-full w-8 h-8 bg-gray-8 border border-solid border-gray-1 cursor-pointer flex justify-center items-center -mr-8 relative z-10 left-4 opacity-75 hover:opacity-100 transition-all transition-duration-300" on:click={prev}>
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
      <div class="rounded-full w-8 h-8 bg-gray-8 border border-solid border-gray-1 cursor-pointer flex justify-center items-center -ml-8 relative z-10 right-4 opacity-75 hover:opacity-100 transition-all transition-duration-300" on:click={next}>
        <i class="fa fa-chevron-right" />
      </div>
    {/if}
  </div>
{/if}
