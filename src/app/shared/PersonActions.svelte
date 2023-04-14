<script lang="ts">
  import {find} from "ramda"
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {displayPerson} from "src/util/nostr"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {getPubkeyWriteRelays} from "src/agent/relays"
  import user from "src/agent/user"
  import pool from "src/agent/pool"
  import {addToList} from "src/app/state"

  export let person

  const npub = nip19.npubEncode(person.pubkey)
  const {petnamePubkeys, canPublish, mutes} = user

  let actions = []

  $: muted = find(m => m[1] === person.pubkey, $mutes)
  $: following = $petnamePubkeys.includes(person.pubkey)
  $: {
    actions = []

    actions.push({
      onClick: () => addToList("p", person.pubkey),
      label: "Add to list",
      icon: "scroll",
    })

    actions.push({onClick: share, label: "Share", icon: "share-nodes"})

    if (user.getPubkey() !== person.pubkey && $canPublish) {
      actions.push({
        onClick: () => navigate(`/messages/${npub}`),
        label: "Message",
        icon: "envelope",
      })

      if (muted) {
        actions.push({onClick: unmute, label: "Unmute", icon: "microphone"})
      } else if (user.getPubkey() !== person.pubkey) {
        actions.push({onClick: mute, label: "Mute", icon: "microphone-slash"})
      }
    }

    if (pool.forceUrls.length === 0) {
      actions.push({onClick: openProfileInfo, label: "Details", icon: "info"})
    }

    if (user.getPubkey() === person.pubkey && $canPublish) {
      actions.push({
        onClick: () => navigate("/profile"),
        label: "Edit",
        icon: "edit",
      })
    }
  }

  const follow = async () => {
    const [{url}] = getPubkeyWriteRelays(person.pubkey)

    user.addPetname(person.pubkey, url, displayPerson(person))
  }

  const unfollow = async () => {
    user.removePetname(person.pubkey)
  }

  const mute = async () => {
    user.addMute("p", person.pubkey)
  }

  const unmute = async () => {
    user.removeMute(person.pubkey)
  }

  const openProfileInfo = () => {
    modal.push({type: "person/info", person})
  }

  const share = () => {
    modal.push({type: "person/share", person})
  }
</script>

<div class="flex items-center gap-3">
  {#if $canPublish}
    <Popover triggerType="mouseenter">
      <div slot="trigger">
        {#if following}
          <i class="fa fa-user-minus cursor-pointer" on:click={unfollow} />
        {:else if user.getPubkey() !== person.pubkey}
          <i class="fa fa-user-plus cursor-pointer" on:click={follow} />
        {/if}
      </div>
      <div slot="tooltip">{following ? "Unfollow" : "Follow"}</div>
    </Popover>
  {/if}
  <OverflowMenu {actions} />
</div>
