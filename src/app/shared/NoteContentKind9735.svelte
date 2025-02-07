<script lang="ts">
  import {onMount} from "svelte"
  import {nthEq} from "@welshman/lib"
  import {zapFromEvent} from "@welshman/util"
  import {deriveZapperForPubkey, loadZapper} from "@welshman/app"
  import {formatSats} from "src/util/misc"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import NoteContentLink from "src/app/shared/NoteContentLink.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showEntire, showMedia

  const recipient = note.tags.find(nthEq(0, "p"))?.[1]
  const url = note.tags.find(nthEq(0, "i"))?.[2]
  const zapper = deriveZapperForPubkey(recipient)

  $: zap = zapFromEvent(note, $zapper)

  onMount(() => {
    loadZapper(recipient)
  })
</script>

{#if zap}
  <div class="flex flex-col gap-2 overflow-hidden text-ellipsis">
    <div>
      <PersonLink pubkey={zap.request?.pubkey} /> zapped <PersonLink pubkey={recipient} />
      {formatSats(zap.invoiceAmount / 1000)} sats!
    </div>
    <NoteContentKind1 note={zap.request} {showEntire} />
    {#if url}
      <NoteContentLink {url} {showMedia} />
    {/if}
  </div>
{/if}
