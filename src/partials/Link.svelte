<script lang="ts">
  import {createEventDispatcher} from "svelte"
  import {randomId} from "@welshman/lib"
  import {router} from "src/app/util/router"

  export let href
  export let modal = false
  export let loading = false
  export let disabled = false
  export let external = false
  export let randomizeKey = false
  export let stopPropagation = false
  export let rel: string = undefined
  export let target: string = undefined

  const dispatch = createEventDispatcher()

  const onClick = (e: Event) => {
    if (stopPropagation) {
      e.stopPropagation()
    }

    if (!external) {
      e.preventDefault()

      router.at(href).push({modal, key: randomizeKey ? randomId() : null})
    }

    dispatch("click", e)
  }
</script>

<a
  {href}
  {...$$props}
  on:click={onClick}
  rel={rel === undefined ? (external ? "noopener noreferer" : "") : rel}
  target={target === undefined ? (external ? "_blank" : "") : target}
  class="cursor-pointer {$$props.class} {disabled || loading ? 'btn-disabled' : ''}">
  {#if loading}
    <i class="fa fa-circle-notch fa-spin fa-sm" />
  {/if}
  <slot />
</a>
