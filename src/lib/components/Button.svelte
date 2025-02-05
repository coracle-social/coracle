<script lang="ts">
  import type {Snippet} from "svelte"

  const {
    children,
    onclick,
    type = "button",
    ...restProps
  }: {
    children: Snippet
    onclick?: (event: Event) => any
    type?: "button" | "submit"
    class?: string
    style?: string
    disabled?: boolean
    "data-tip"?: string
  } = $props()

  const className = $derived(`text-left ${restProps.class}`)

  const onClick = (e: Event) => {
    e.preventDefault()
    e.stopPropagation()

    onclick?.(e)
  }
</script>

{#if type === "submit"}
  <button {...restProps} {type} class={className}>
    {@render children?.()}
  </button>
{:else}
  <button {...restProps} onclick={onClick} type={type as "button" | "submit"} class={className}>
    {@render children?.()}
  </button>
{/if}
