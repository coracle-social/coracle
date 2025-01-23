<script lang="ts">
  import cx from "classnames"
  import {createEventDispatcher} from "svelte"
  import {router} from "src/app/util/router"
  import {randomId} from "@welshman/lib"

  export let stopPropagation = false
  export let randomizeKey = false
  export let externalHref = null
  export let external = false
  export let disabled = false
  export let loading = false
  export let modal = false
  export let button = false
  export let accent = false
  export let low = false
  export let square = false
  export let danger = false
  export let circle = false
  export let underline = false
  export let tall = false
  export let grow = false
  export let style = null
  export let type = null
  export let href = null
  export let tag = "a"

  const dispatch = createEventDispatcher()

  $: target = external ? "_blank" : null

  let className

  $: className = cx($$props.class, "transition-all cursor-pointer", {
    underline,
    "opacity-50 pointer-events-none": loading || disabled,
    "bg-white text-black hover:bg-white-l": button && !accent && !low,
    "text-base bg-tinted-700 text-tinted-200 hover:bg-tinted-600": button && low,
    "bg-accent text-white hover:bg-accent": button && accent,
    "text-danger border border-solid !border-danger": button && danger,
    "text-xl staatliches rounded whitespace-nowrap flex justify-center items-center gap-2 px-6":
      button,
    "aspect-square flex justify-center items-center rounded-full !p-0": circle,
    "aspect-square flex justify-center items-center": square,
    "h-7": button && !tall,
    "w-7": button && !tall && circle,
    "h-10": button && tall,
    "w-10": button && tall && circle,
    "flex-grow": grow,
  })

  const onClick = e => {
    if (stopPropagation) {
      e.stopPropagation()
    }

    if (href && !external && !e.metaKey && !e.ctrlKey) {
      e.preventDefault()

      router.at(href).push({modal, key: randomizeKey ? randomId() : null})
    }

    dispatch("click", e)
  }
</script>

{#if tag === "a"}
  <a {style} class={className} on:click={onClick} href={externalHref || href} {target}>
    {#if loading}
      <i class="fa fa-circle-notch fa-spin fa-sm" />
    {/if}
    <slot />
  </a>
{:else if tag === "button"}
  <button {style} class={className} on:click={onClick} {type}>
    {#if loading}
      <i class="fa fa-circle-notch fa-spin fa-sm" />
    {/if}
    <slot />
  </button>
{:else}
  <svelte:element this={tag} {style} class={className} on:click={onClick}>
    {#if loading}
      <i class="fa fa-circle-notch fa-spin fa-sm" />
    {/if}
    <slot />
  </svelte:element>
{/if}
