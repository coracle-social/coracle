<script lang="ts">
  import {onMount} from 'svelte'
  import Masonry from 'svelte-bricks'
  import {append, remove} from '@welshman/lib'
  import {GROUP_META, displayRelayUrl} from '@welshman/util'
  import Icon from '@lib/components/Icon.svelte'
  import Button from '@lib/components/Button.svelte'
  import Spinner from '@lib/components/Spinner.svelte'
  import {makeSpacePath} from '@app/routes'
  import {load, relays, groups, searchGroups, relayUrlsByNom, userMembership} from '@app/state'
  import {updateGroupMemberships} from '@app/commands'

  const getRelayUrls = (nom: string): string[] => $relayUrlsByNom.get(nom) || []

  const join = async (nom: string) => {
    loading = append(nom, loading)

    try {
      await updateGroupMemberships(getRelayUrls(nom).map(url => ["group", nom, url]))
    } finally {
      loading = remove(nom, loading)
    }
  }

  let term = ""
  let loading: string[] = []

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
  <Masonry animate={false} items={$searchGroups.searchOptions(term)} minColWidth={250} maxColWidth={800} gap={16} idKey="nom" let:item={group}>
    <div class="card bg-base-100 shadow-xl">
      <div class="avatar center mt-8">
        <div class="w-20 rounded-full bg-base-300 border-2 border-solid border-base-300 !flex center">
          {#if group?.picture}
            <img alt="" src={group.picture} />
          {:else}
            <Icon icon="ghost" size={7} />
          {/if}
        </div>
      </div>
      <div class="card-body">
        <a href={makeSpacePath(group.nom)}>
          <h2 class="card-title justify-center">{group.name}</h2>
        </a>
        <div class="text-sm text-center">
          {#each getRelayUrls(group.nom) as url}
            <div class="badge badge-neutral">{displayRelayUrl(url)}</div>
          {/each}
        </div>
        <p class="text-sm py-4">{group.about}</p>
        <div class="card-actions">
          <Button
            class="btn btn-primary w-full"
            disabled={loading.includes(group.nom) || $userMembership?.noms.has(group.nom)}
            on:click={() => join(group.nom)}>
            {#if $userMembership?.noms.has(group.nom)}
              <Icon icon="check-circle" />
              Joined
            {:else}
              <Spinner loading={loading.includes(group.nom)} />
              Join Space
            {/if}
          </Button>
        </div>
      </div>
    </div>
  </Masonry>
</div>
