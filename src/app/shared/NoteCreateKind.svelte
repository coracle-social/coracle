<script lang="ts">
  import {NOTE, EVENT_TIME, CLASSIFIED} from '@welshman/util'
  import Popover from 'src/partials/Popover.svelte'
  import Chip from 'src/partials/Chip.svelte'
  import Menu from 'src/partials/Menu.svelte'
  import MenuItem from 'src/partials/MenuItem.svelte'

  export let ctrl
</script>

<div class="flex gap-2">
  <span class="text-2xl font-bold">Create a</span>
  <Popover theme="transparent" placement="bottom" opts={{hideOnClick: true}}>
    <div slot="trigger">
      <Chip class="cursor-pointer">
        {#if $ctrl.draft.kind === NOTE}
          Note
        {:else if $ctrl.draft.kind === EVENT_TIME}
          Event
        {:else if $ctrl.draft.kind === CLASSIFIED}
          Listing
        {/if}
        <i class="fa fa-caret-down" />
      </Chip>
    </div>
    <div slot="tooltip">
      <Menu class="-mt-2 w-24">
        <MenuItem on:click={() => ctrl.setKind(NOTE)}>Note</MenuItem>
        <MenuItem on:click={() => ctrl.setKind(EVENT_TIME)}>Event</MenuItem>
        <MenuItem on:click={() => ctrl.setKind(CLASSIFIED)}>Listing</MenuItem>
      </Menu>
    </div>
  </Popover>
</div>
