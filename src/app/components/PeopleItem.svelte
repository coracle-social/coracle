<script lang="ts">
  import {onMount} from "svelte"
  import {formatTimestampRelative} from "@welshman/lib"
  import type {Filter} from "@welshman/util"
  import {NOTE, GROUPS, MESSAGE, THREAD, COMMENT, getRelayTags, getListTags} from "@welshman/util"
  import {deriveEvents} from "@welshman/store"
  import {load} from "@welshman/net"
  import {Router} from "@welshman/router"
  import {repository, loadRelaySelections} from "@welshman/app"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import Profile from "@app/components/Profile.svelte"
  import ProfileInfo from "@app/components/ProfileInfo.svelte"
  import ProfileDetail from "@app/components/ProfileDetail.svelte"
  import {membershipsByPubkey} from "@app/state"
  import {pushModal} from "@app/modal"

  type Props = {
    pubkey: string
    url?: string
  }

  const {pubkey, url}: Props = $props()
  const filters: Filter[] = [{authors: [pubkey], limit: 1}]
  const events = deriveEvents(repository, {filters})
  const membership = $derived($membershipsByPubkey.get(pubkey))
  const relays = $derived(getRelayTags(getListTags(membership)))

  const openProfile = () => pushModal(ProfileDetail, {pubkey, url})

  onMount(async () => {
    // Make sure we have their relay selections before we load their posts
    await loadRelaySelections(pubkey)

    // Load groups and at least one note, regardless of time frame
    load({
      filters: [
        {authors: [pubkey], kinds: [GROUPS]},
        {authors: [pubkey], limit: 1, kinds: [NOTE, MESSAGE, THREAD, COMMENT]},
      ],
      relays: Router.get().FromPubkeys([pubkey]).getUrls(),
    })
  })
</script>

<div class="card2 bg-alt col-2 shadow-xl">
  <div class="flex justify-between">
    <Profile {pubkey} {url} />
    <Button onclick={openProfile} class="btn btn-primary hidden sm:flex">
      <Icon icon="user-circle" />
      View Profile
    </Button>
  </div>
  <ProfileInfo {pubkey} {url} />
  <div class="flex flex-wrap gap-2">
    {#if $events.length > 0}
      <div class="badge badge-neutral">
        Last active {formatTimestampRelative($events[0].created_at)}
      </div>
    {/if}
    {#if relays.length > 0}
      <div class="badge badge-neutral">
        {relays.length}
        {relays.length === 1 ? "space" : "spaces"}
      </div>
    {/if}
  </div>
  <Button onclick={openProfile} class="btn btn-primary sm:hidden">
    <Icon icon="user-circle" />
    View Profile
  </Button>
</div>
