<script lang="ts">
  import cx from "classnames"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"

  export let pubkey
</script>

<span class={cx($$props.class, "relative z-feature flex items-center gap-2")}>
  <PersonCircle {pubkey} class="h-8 w-8" />
  <PersonName {pubkey} />
</span>
