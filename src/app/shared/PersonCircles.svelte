<script lang="ts">
  import cx from "classnames"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"

  export let pubkeys

  const klass = $$props.class || "w-8 h-8"
</script>

<div class="flex pr-3">
  {#each pubkeys.slice(0, 15) as pubkey (pubkey)}
    <div class="z-feature -mr-3 inline-block">
      <PersonCircle class={cx(klass, "border border-solid border-neutral-800")} {pubkey} />
    </div>
  {/each}
</div>
