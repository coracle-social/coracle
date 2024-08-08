<script context="module" lang="ts">
  const modalHeight = tweened(0, {
		duration: 700,
		easing: quintOut
	})
</script>

<script lang="ts">
  import {onMount} from 'svelte'
  import {slide} from 'svelte/transition'
	import {quintOut} from 'svelte/easing'
	import {tweened} from 'svelte/motion'
  import {last} from '@welshman/lib'

	export let component
	export let props

  let box: HTMLElement
  let content: HTMLElement
  let naturalHeight = 0

  onMount(() => {
    naturalHeight = content.clientHeight + 48
    $modalHeight = naturalHeight
  })
</script>

<div class="modal-box" bind:this={box} style={`height: ${$modalHeight}px`} class:overflow-hidden={$modalHeight !== naturalHeight}>
  <div bind:this={content}>
    <svelte:component this={component} {...props} />
  </div>
</div>
