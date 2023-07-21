<script lang="ts">
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {Env, Keys, User, Nip02} from "src/app/engine"
  import {addToList} from "src/app/state"

  export let pubkey

  const npub = nip19.npubEncode(pubkey)
  const graphEntry = Nip02.graph.key(Keys.pubkey.get())
  const following = graphEntry.derived(() => User.isFollowing(pubkey))
  const muted = graphEntry.derived(() => User.isIgnoring(pubkey))

  let actions = []

  $: {
    actions = []

    if (Keys.canSign.get()) {
      actions.push({
        onClick: () => addToList("p", pubkey),
        label: "Add to list",
        icon: "scroll",
      })
    }

    actions.push({onClick: share, label: "Share", icon: "share-nodes"})

    if (Keys.pubkey.get() !== pubkey && Keys.canSign.get()) {
      actions.push({
        onClick: () => navigate(`/messages/${npub}`),
        label: "Message",
        icon: "envelope",
      })

      if ($muted) {
        actions.push({onClick: unmute, label: "Unmute", icon: "microphone"})
      } else if (Keys.pubkey.get() !== pubkey) {
        actions.push({onClick: mute, label: "Mute", icon: "microphone-slash"})
      }
    }

    if (Env.FORCE_RELAYS.length === 0) {
      actions.push({onClick: openProfileInfo, label: "Details", icon: "info"})
    }

    if (Keys.pubkey.get() === pubkey && Keys.canSign.get()) {
      actions.push({
        onClick: () => navigate("/profile"),
        label: "Edit",
        icon: "edit",
      })
    }
  }

  const openProfileInfo = () => modal.push({type: "person/info", pubkey})

  const share = () => modal.push({type: "person/share", pubkey})

  const unfollow = () => User.unfollow(pubkey)

  const follow = () => User.follow(pubkey)

  const unmute = () => User.unmute(pubkey)

  const mute = () => User.mute("p", pubkey)
</script>

<div class="flex items-center gap-3">
  {#if Keys.canSign.get()}
    <Popover triggerType="mouseenter">
      <div slot="trigger">
        {#if $following}
          <i class="fa fa-user-minus cursor-pointer" on:click={unfollow} />
        {:else if Keys.pubkey.get() !== pubkey}
          <i class="fa fa-user-plus cursor-pointer" on:click={follow} />
        {/if}
      </div>
      <div slot="tooltip">{$following ? "Unfollow" : "Follow"}</div>
    </Popover>
  {/if}
  <OverflowMenu {actions} />
</div>
