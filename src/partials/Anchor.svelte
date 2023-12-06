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
    "transition-all cursor-pointer",
    {"opacity-50 pointer-events-none": loading || disabled},
    switcher(theme, {
      anchor: "underline",
      button:
        "py-2 px-4 rounded-full bg-warm text-accent whitespace-nowrap border border-solid border-mid hover:bg-warm-l",
      "button-circle":
        "w-10 h-10 flex justify-center items-center rounded-full bg-warm text-accent whitespace-nowrap border border-solid border-mid hover:bg-warm-l",
      "button-circle-dark":
        "w-10 h-10 flex justify-center items-center rounded-full bg-dark text-white whitespace-nowrap border border-solid border-cocoa",
      "button-accent":
        "py-2 px-4 rounded-full bg-accent text-white whitespace-nowrap border border-solid border-accent-l hover:bg-accent-l",
      "button-minimal":
        "py-2 px-4 rounded-full whitespace-nowrap border border-solid border-lightest",
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
