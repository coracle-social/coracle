<script lang="ts">
  import {Address} from "@welshman/util"
  import {loadHandle} from "@welshman/app"
  import {ctx} from "@welshman/lib"
  import Content from "src/partials/Content.svelte"
  import Spinner from "src/partials/Spinner.svelte"
  import Redirect from "src/app/shared/Redirect.svelte"
  import NoteDetail from "src/app/views/NoteDetail.svelte"
  import PersonDetail from "src/app/views/PersonDetail.svelte"

  export let entity, type, data
</script>

{#if type === "nevent"}
  <NoteDetail id={data.id} relays={data.relays} />
{:else if type === "note"}
  <NoteDetail id={data} relays={data.relays} />
{:else if type === "naddr"}
  {@const address = new Address(data.kind, data.pubkey, data.identifier).toString()}
  {@const relays = [
    ...(data.relays || []),
    ...Array.from(ctx.app.router.FromPubkey(data.pubkey).getUrls()),
  ]}
  <NoteDetail {address} {relays} />
{:else if type === "nprofile"}
  <PersonDetail pubkey={data.pubkey} relays={data.relays} />
{:else if type === "npub"}
  <PersonDetail pubkey={data} />
{:else if entity.includes("@")}
  {#await loadHandle(entity)}
    <Spinner />
  {:then $handle}
    {#if $handle?.pubkey}
      <PersonDetail pubkey={$handle.pubkey} />
    {:else}
      <Content size="lg" class="text-center">
        <div>Sorry, we weren't able to find "{entity}".</div>
      </Content>
    {/if}
  {/await}
{:else}
  <Redirect to="/" />
{/if}
