<script lang="ts">
  import {onMount} from 'svelte'
  import Masonry from 'svelte-bricks'
  import {GROUP_META} from '@welshman/util'
  import Icon from '@lib/components/Icon.svelte'
  import {load, relays, groups, searchGroups} from '@app/state'

  let term = ""

  onMount(() => {
    load({
      relays: $relays.map(r => r.url),
      filters: [{kinds: [GROUP_META]}],
    })
  })
</script>

<div class="content column gap-4">
  <h1 class="superheading mt-20">Discover Spaces</h1>
  <p class="text-center">Find communities all across the nostr network</p>
  <label class="input input-bordered w-full flex items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for spaces..." />
  </label>
  <Masonry animate={false} items={$searchGroups.searchOptions(term)} minColWidth={250} maxColWidth={800} gap={16} idKey="nom" let:item>
    <div class="card bg-base-100 shadow-xl">
      <div class="avatar center mt-8">
        <div class="w-20 rounded-full bg-base-300 border-2 border-solid border-base-300 !flex center">
          {#if item?.picture}
            <img alt="" src={item.picture} />
          {:else}
            <Icon icon="ghost" size={7} />
          {/if}
        </div>
      </div>
      <div class="card-body">
        <h2 class="card-title justify-center">{item.name}</h2>
        <p class="text-sm py-4">{item.about}</p>
        <div class="card-actions">
          <button class="btn btn-primary w-full">Join Space</button>
        </div>
      </div>
    </div>
  </Masonry>
</div>
