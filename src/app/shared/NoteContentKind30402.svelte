<script lang="ts">
  import cx from "classnames"
  import {tagSpec, tagValue} from "@welshman/util"
  import {Events} from "@welshman/app"
  import {Classified} from "@welshman/domain"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import CurrencySymbol from "src/partials/CurrencySymbol.svelte"
  import Chip from "src/partials/Chip.svelte"
  import NoteContentTopics from "src/app/shared/NoteContentTopics.svelte"
  import NoteContentKind1 from "src/app/shared/NoteContentKind1.svelte"
  import {commaFormat} from "src/util/misc"
  import {fromApp, reader} from "src/engine/core"

  export let note
  export let showMedia = false
  export let showEntire = false

  const listing = reader(Classified)(note)
  const summary = listing.summary()
  const {amount = 0, currency = "SAT"} = listing.price() || {}
  const location = tagValue(tagSpec("location"), note.tags)
  const deleted = fromApp($app => $app.use(Events).isDeleted(note).$)
</script>

<FlexColumn>
  <div class="flex flex-col gap-2">
    <div class="flex justify-between gap-2 text-xl">
      <div class="flex items-center gap-3">
        <strong class={cx({"line-through": $deleted})}>
          {listing.title()}
        </strong>
        {#if $deleted}
          <Chip danger small>Deleted</Chip>
        {:else if listing.status() === "sold"}
          <Chip danger small>Sold</Chip>
        {:else}
          <Chip small>Available</Chip>
        {/if}
      </div>
      <span class="whitespace-nowrap">
        <CurrencySymbol code={currency} />{commaFormat(amount)}
        {currency}
      </span>
    </div>
    {#if location}
      <div class="flex items-center gap-2 text-sm text-neutral-300">
        <i class="fa fa-location-dot" />
        {location}
      </div>
    {/if}
    {#if summary !== note.content}
      <p class="text-neutral-200">{summary}</p>
    {/if}
    <div class="h-px bg-neutral-600" />
    <NoteContentKind1 {note} {showEntire} {showMedia} />
  </div>
  <NoteContentTopics {note} />
</FlexColumn>
