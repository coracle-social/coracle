<script lang="ts">
  import cx from "classnames"
  import {createEventDispatcher} from "svelte"
  import {router} from "src/app/router"

  export let stopPropagation = false
  export let externalHref = null
  export let external = false
  export let disabled = false
  export let loading = false
  export let modal = false
  export let button = false
  export let accent = false
  export let low = false
  export let danger = false
  export let circle = false
  export let underline = false
  export let style = null
  export let type = null
  export let href = null
  export let tag = "a"

  const dispatch = createEventDispatcher()

  $: target = external ? "_blank" : null

  let className

  $: className = cx($$props.class, "transition-all cursor-pointer", {
    underline: underline,
    "opacity-50 pointer-events-none": loading || disabled,
    "bg-white text-black hover:bg-white-l border border-solid border-warm": button && !accent && !low,
    "text-base bg-cocoa text-warm hover:bg-white-l border border-solid border-cocoa-l": button && low,
    "bg-accent text-white hover:bg-accent-l": button && accent,
    "text-danger border border-solid !border-danger": button && danger,
    "text-xl staatliches rounded whitespace-nowrap flex justify-center items-center gap-2": button,
    "h-7 px-6": button && !circle,
    "w-10 h-10 flex justify-center items-center rounded-full": circle,
  })

  const onClick = e => {
    if (stopPropagation) {
      e.stopPropagation()
    }

    if (href && !external && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()

      router.at(href).push({modal})
    }

    dispatch("click", e)
  }
</script>

{#if tag === "a"}
  <a {style} class={className} on:click={onClick} href={externalHref || href} {target}>
    <slot />
  </a>
{:else if tag === "button"}
  <button {style} class={className} on:click={onClick} {type}>
    <slot />
  </button>
{:else}
  <svelte:element {style} this={tag} class={className} on:click={onClick}>
    <slot />
  </svelte:element>
{/if}
