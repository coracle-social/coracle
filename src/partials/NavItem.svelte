<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"

  export let href = null
  export let modal = false
  export let external = false
  export let disabled = false
</script>

<li
  class={cx("relative", $$props.class, {
    "cursor-pointer": !disabled,
    "pointer-events-none opacity-75": disabled,
  })}>
  <Anchor
    class="block px-4 py-2 hover:bg-accent hover:text-white"
    {external}
    {href}
    {modal}
    on:click>
    <slot />
  </Anchor>
</li>
