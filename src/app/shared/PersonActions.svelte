<script lang="ts">
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {FORCE_RELAYS, keys, user, social} from "src/app/engine"
  import {watch} from "src/util/loki"
  import {addToList} from "src/app/state"

  export let pubkey

  const npub = nip19.npubEncode(pubkey)
  const following = watch(social.graph, () => user.isFollowing(pubkey))
  const muted = watch(social.graph, () => user.isIgnoring(pubkey))

  let actions = []

  $: {
    actions = []

    if (keys.canSign.get()) {
      actions.push({
        onClick: () => addToList("p", pubkey),
        label: "Add to list",
        icon: "scroll",
      })
    }

    actions.push({onClick: share, label: "Share", icon: "share-nodes"})

    if (user.getPubkey() !== pubkey && keys.canSign.get()) {
      actions.push({
        onClick: () => navigate(`/messages/${npub}`),
        label: "Message",
        icon: "envelope",
      })

      if ($muted) {
        actions.push({onClick: unmute, label: "Unmute", icon: "microphone"})
      } else if (user.getPubkey() !== pubkey) {
        actions.push({onClick: mute, label: "Mute", icon: "microphone-slash"})
      }
    }

    if (FORCE_RELAYS.length === 0) {
      actions.push({onClick: openProfileInfo, label: "Details", icon: "info"})
    }

    if (user.getPubkey() === pubkey && keys.canSign.get()) {
      actions.push({
        onClick: () => navigate("/profile"),
        label: "Edit",
        icon: "edit",
      })
    }
  }

  const openProfileInfo = () => modal.push({type: "person/info", pubkey})

  const share = () => modal.push({type: "person/share", pubkey})

  const unfollow = () => user.unfollow(pubkey)

  const follow = () => user.follow(pubkey)

  const unmute = () => user.unmute(pubkey)

  const mute = () => user.mute("p", pubkey)
</script>

<div class="flex items-center gap-3">
  {#if keys.canSign.get()}
    <Popover triggerType="mouseenter">
      <div slot="trigger">
        {#if $following}
          <i class="fa fa-user-minus cursor-pointer" on:click={unfollow} />
        {:else if user.getPubkey() !== pubkey}
          <i class="fa fa-user-plus cursor-pointer" on:click={follow} />
        {/if}
      </div>
      <div slot="tooltip">{$following ? "Unfollow" : "Follow"}</div>
    </Popover>
  {/if}
  <OverflowMenu {actions} />
</div>
