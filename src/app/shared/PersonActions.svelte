<script lang="ts">
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {keys, social, directory} from "src/system"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import {watch} from "src/agent/db"
  import pool from "src/agent/pool"
  import {addToList} from "src/app/state"

  export let pubkey

  const {canSign} = keys
  const npub = nip19.npubEncode(pubkey)
  const following = watch(social.graph, () => social.isUserFollowing(pubkey))
  const muted = watch(social.graph, () => social.isUserIgnoring(pubkey))

  let actions = []

  $: {
    actions = []

    if ($canSign) {
      actions.push({
        onClick: () => addToList("p", pubkey),
        label: "Add to list",
        icon: "scroll",
      })
    }

    actions.push({onClick: share, label: "Share", icon: "share-nodes"})

    if (keys.getPubkey() !== pubkey && $canSign) {
      actions.push({
        onClick: () => navigate(`/messages/${npub}`),
        label: "Message",
        icon: "envelope",
      })

      if ($muted) {
        actions.push({onClick: unmute, label: "Unmute", icon: "microphone"})
      } else if (keys.getPubkey() !== pubkey) {
        actions.push({onClick: mute, label: "Mute", icon: "microphone-slash"})
      }
    }

    if (pool.forceUrls.length === 0) {
      actions.push({onClick: openProfileInfo, label: "Details", icon: "info"})
    }

    if (keys.getPubkey() === pubkey && $canSign) {
      actions.push({
        onClick: () => navigate("/profile"),
        label: "Edit",
        icon: "edit",
      })
    }
  }

  const follow = async () => {
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    social.follow(pubkey, url, directory.displayPubkey(pubkey))
  }

  const unfollow = () => social.unfollow(pubkey)

  const mute = async () => social.mute("p", pubkey)

  const unmute = () => social.unmute(pubkey)

  const openProfileInfo = () => {
    modal.push({type: "person/info", pubkey})
  }

  const share = () => {
    modal.push({type: "person/share", pubkey})
  }
</script>

<div class="flex items-center gap-3">
  {#if $canSign}
    <Popover triggerType="mouseenter">
      <div slot="trigger">
        {#if $following}
          <i class="fa fa-user-minus cursor-pointer" on:click={unfollow} />
        {:else if keys.getPubkey() !== pubkey}
          <i class="fa fa-user-plus cursor-pointer" on:click={follow} />
        {/if}
      </div>
      <div slot="tooltip">{$following ? "Unfollow" : "Follow"}</div>
    </Popover>
  {/if}
  <OverflowMenu {actions} />
</div>
