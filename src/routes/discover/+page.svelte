<script lang="ts">
  import {onMount} from "svelte"
  import Masonry from "svelte-bricks"
  import {GROUP_META, displayRelayUrl} from "@welshman/util"
  import Icon from "@lib/components/Icon.svelte"
  import {makeSpacePath} from "@app/routes"
  import {load, relays, searchGroups, relayUrlsByNom, userMembership} from "@app/state"

  const getRelayUrls = (nom: string): string[] => $relayUrlsByNom.get(nom) || []

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
  <label class="input input-bordered flex w-full items-center gap-2">
    <Icon icon="magnifer" />
    <input bind:value={term} class="grow" type="text" placeholder="Search for spaces..." />
  </label>
  <Masonry
    animate={false}
    items={$searchGroups.searchOptions(term)}
    minColWidth={250}
    maxColWidth={800}
    gap={16}
    idKey="nom"
    let:item={group}>
    <a
      href={makeSpacePath(group.nom)}
      class="card bg-base-100 shadow-xl transition-all hover:shadow-2xl hover:brightness-[1.1]">
      <div class="center avatar mt-8">
        <div
          class="center relative !flex w-20 rounded-full border-2 border-solid border-base-300 bg-base-300">
          {#if group?.picture}
            <img alt="" src={group.picture} />
          {:else}
            <Icon icon="ghost" size={7} />
          {/if}
        </div>
      </div>
      {#if $userMembership?.noms.has(group.nom)}
        <div class="center absolute flex w-full">
          <div
            class="tooltip relative left-8 top-[38px] rounded-full bg-primary"
            data-tip="You are already a member of this space.">
            <Icon icon="check-circle" class="scale-110" />
          </div>
        </div>
      {/if}
      <div class="card-body">
        <h2 class="card-title justify-center">{group.name}</h2>
        <div class="text-center text-sm">
          {#each getRelayUrls(group.nom) as url}
            <div class="badge badge-neutral">{displayRelayUrl(url)}</div>
          {/each}
        </div>
        <p class="py-4 text-sm">{group.about}</p>
      </div>
    </a>
  </Masonry>
</div>
