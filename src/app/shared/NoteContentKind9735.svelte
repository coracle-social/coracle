<script lang="ts">
  import {readable} from "svelte/store"
  import {nth, removeUndefined, tryCatch} from "@welshman/lib"
  import type {Maybe} from "@welshman/lib"
  import {matchTags, tagSpec} from "@welshman/util"
  import {Zappers} from "@welshman/app"
  import {ZapReceipt} from "@welshman/domain"
  import type {Zapper} from "@welshman/domain"
  import {formatSats} from "src/util/misc"
  import PersonLink from "src/app/shared/PersonLink.svelte"
  import NoteContentLinks from "src/app/shared/NoteContentLinks.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {fromApp, reader} from "src/engine/core"

  export let note, showEntire, showMedia

  const receipt = reader(ZapReceipt)(note)
  const recipient = receipt.recipient()
  const urls = removeUndefined(matchTags(tagSpec("i"), note.tags).map(nth(2)))

  const zapper = fromApp($app =>
    recipient ? $app.use(Zappers).forPubkey(recipient).$ : readable<Maybe<Zapper>>(undefined),
  )

  $: zap = $zapper && tryCatch(() => $zapper.validate(receipt))
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
