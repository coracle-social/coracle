<script lang="ts">
  import {onMount} from "svelte"
  import {nth, removeUndefined} from "@welshman/lib"
  import {zapFromEvent, getTags, getTagValue} from "@welshman/util"
  import {deriveZapperForPubkey, loadZapper} from "@welshman/app"
  import {formatSats} from "src/util/misc"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"

  export let note, showEntire, showMedia

  const recipient = getTagValue("p", note.tags)
  const urls = removeUndefined(getTags("i", note.tags).map(nth(2)))
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
    {#if urls.length > 0}
      <NoteContentLinks {urls} {showMedia} />
    {/if}
  </div>
{/if}
