<script lang="ts">
  import cx from 'classnames'
  import {slide} from 'src/util/transition'
  import {remove, append} from '@welshman/lib'
  import Card from 'src/partials/Card.svelte'
  import Anchor from 'src/partials/Anchor.svelte'
  import FlexColumn from 'src/partials/FlexColumn.svelte'
  import NoteCreateRelays from 'src/app/shared/NoteCreateRelays.svelte'
  import NoteCreateGroups from 'src/app/shared/NoteCreateGroups.svelte'
  import NoteCreateOptions from 'src/app/shared/NoteCreateOptions.svelte'
  import {env} from 'src/engine'

  export let ctrl

  const toggleCard = card => {
    cards = cards.includes(card) ? remove(card, cards) : append(card, cards)
  }

  const className = active => cx("!text-sm mr-2 mb-2 !inline-flex", {'opacity-50': active})

  const handler = card => () => toggleCard(card)

  let cards = []
</script>

{#each cards as card (card)}
  <div transition:slide|local class="mb-4 mt-2">
    <Card class="relative">
      <span class="h-4 w-4 cursor-pointer absolute top-2 right-2" on:click={handler(card)}>
        <i class="fa fa-times" />
      </span>
      <FlexColumn>
        {#if card === "relays"}
          <NoteCreateRelays {ctrl} />
        {:else if card === "groups"}
          <NoteCreateGroups {ctrl} />
        {:else if card === "options"}
          <NoteCreateOptions {ctrl} />
        {/if}
      </FlexColumn>
    </Card>
  </div>
{/each}

<div class="flex flex-col gap-4">
  <div>
    <Anchor button low class={className(cards.includes('relays'))} on:click={handler('relays')}>
      {$ctrl.draft.relays.length} Relays
    </Anchor>
    {#if !$env.FORCE_GROUP}
      <Anchor button low class={className(cards.includes('groups'))} on:click={handler('groups')}>
        {$ctrl.draft.groups.length} Groups
      </Anchor>
    {/if}
    <Anchor button low class={className(cards.includes('options'))} on:click={handler('options')}>
      Options
    </Anchor>
  </div>
  <div class="flex justify-end gap-3">
    <Anchor button on:click={$ctrl.save}>Save as Draft</Anchor>
    <Anchor button accent on:click={$ctrl.publish}>Send Note</Anchor>
  </div>
</div>
