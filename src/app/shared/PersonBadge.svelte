<script lang="ts">
  import cx from "classnames"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonName from "src/app/shared/PersonName.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import {router} from "src/app/util/router"
  import {loadPubkeys} from 'src/engine'

  export let pubkey
  export let inert = false

  loadPubkeys([pubkey])
</script>

{#if inert}
  <div class={cx($$props.class, "relative flex gap-4")}>
    <PersonCircle class="h-12 w-12" {pubkey} />
    <div class="flex flex-col" style="min-width: 48px;">
      <PersonName {pubkey} />
      <PersonHandle {pubkey} />
    </div>
  </div>
{:else}
  <Anchor
    modal
    href={router.at("people").of(pubkey).toString()}
    class={cx($$props.class, "relative flex gap-4")}>
    <PersonCircle class="h-12 w-12" {pubkey} />
    <div class="flex flex-col" style="min-width: 48px;">
      <PersonName {pubkey} />
      <PersonHandle {pubkey} />
    </div>
  </Anchor>
{/if}
