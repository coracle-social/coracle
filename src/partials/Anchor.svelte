<script lang="ts">
  import cx from "classnames"
  import {switcher} from "hurdak"
  import {createEventDispatcher} from "svelte"
  import {router} from "src/app/router"

  export let stopPropagation = false
  export let externalHref = null
  export let external = false
  export let disabled = false
  export let loading = false
  export let modal = false
  export let theme = "unstyled"
  export let type = null
  export let href = null
  export let tag = "a"

  const dispatch = createEventDispatcher()

  $: target = external ? "_blank" : null

  let className

  $: className = cx(
    $$props.class,
    "transition-all cursor-pointer staatliches text-xl",
    {"opacity-50 pointer-events-none": loading || disabled},
    switcher(theme, {
      anchor: "underline",
      button:
        "h-7 px-6 rounded bg-warm text-accent whitespace-nowrap hover:bg-warm-l",
      "button-circle":
        "w-10 h-10 flex justify-center items-center rounded bg-warm text-accent whitespace-nowrap hover:bg-warm-l",
      "button-accent":
        "h-7 px-6 rounded bg-accent text-white whitespace-nowrap hover:bg-accent-l",
      "button-minimal":
        "h-7 px-6 rounded whitespace-nowrap",
    })
  )

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
  <a class={className} on:click={onClick} href={externalHref || href} {target}>
    <slot />
  </a>
{:else if tag === "button"}
  <button class={className} on:click={onClick} {type}>
    <slot />
  </button>
{:else}
  <svelte:element this={tag} class={className} on:click={onClick}>
    <slot />
  </svelte:element>
{/if}
