<script lang="ts">
  import cx from "classnames"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"

  export let pubkey
  export let inert = false
  export let hideActions = false

  const showDetail = () => modal.push({type: "person/detail", pubkey})
</script>

<div class="relative flex flex-grow flex-col gap-4 px-3 py-2">
  <div class="relative grid grid-cols-4 gap-4">
    <Anchor
      on:click={inert ? null : showDetail}
      class={cx("col-span-3 flex gap-4 overflow-hidden", {"col-span-4": hideActions})}>
      <PersonCircle size={14} {pubkey} />
      <div class="mr-16 flex min-w-0 flex-grow flex-col gap-1">
        <PersonName class="text-lg" {pubkey} />
        <PersonHandle {pubkey} />
      </div>
    </Anchor>
    {#if !hideActions}
      <div class="flex items-start justify-end">
        <slot name="actions">
          <PersonActions {pubkey} />
        </slot>
      </div>
    {/if}
  </div>
  <PersonAbout truncate {pubkey} />
</div>
