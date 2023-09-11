<script lang="ts">
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {modal} from "src/partials/state"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {mute, unmute, isMuted} from "src/engine2"
  import {Env, Keys, user, Nip02} from "src/app/engine"
  import {addToList} from "src/app/state"

  export let pubkey

  const {canSign, canUseGiftWrap} = Keys
  const isSelf = Keys.pubkey.get() === pubkey
  const npub = nip19.npubEncode(pubkey)
  const graphEntry = Nip02.graph.key(Keys.pubkey.get())
  const following = graphEntry.derived(() => user.isFollowing(pubkey))
  const muted = graphEntry.derived(() => isMuted(pubkey))

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

    if (!isSelf && $canSign) {
      if ($canUseGiftWrap) {
        actions.push({
          onClick: () => navigate(`/channels/${pubkey}`),
          label: "Message",
          icon: "envelope",
        })
      } else {
        actions.push({
          onClick: () => navigate(`/conversations/${npub}`),
          label: "Message",
          icon: "envelope",
        })
      }
    }

    if (!isSelf) {
      actions.push({onClick: loginAsUser, label: "Login as", icon: "right-to-bracket"})
    }

    if (Env.FORCE_RELAYS.length === 0) {
      actions.push({onClick: openProfileInfo, label: "Details", icon: "info"})
    }

    if (isSelf && $canSign) {
      actions.push({
        onClick: () => navigate("/profile"),
        label: "Edit",
        icon: "edit",
      })
    }
  }

  const loginAsUser = () => {
    modal.clear()
    Keys.login("pubkey", pubkey)
  }

  const openProfileInfo = () => modal.push({type: "person/info", pubkey})

  const unfollow = () => user.unfollow(pubkey)

  const follow = () => user.follow(pubkey)

  const unmutePerson = () => unmute(pubkey)

  const mutePerson = () => mute("p", pubkey)
</script>

<div class="flex items-center gap-3" on:click|stopPropagation>
  {#if !isSelf}
    <Popover triggerType="mouseenter">
      <div slot="trigger" class="w-6 text-center">
        {#if $muted}
          <i class="fa fa-microphone-slash cursor-pointer" on:click={unmutePerson} />
        {:else}
          <i class="fa fa-microphone cursor-pointer" on:click={mutePerson} />
        {/if}
      </div>
      <div slot="tooltip">{$muted ? "Unmute" : "Mute"}</div>
    </Popover>
    <Popover triggerType="mouseenter">
      <div slot="trigger" class="w-6 text-center">
        {#if $following}
          <i class="fa fa-user-minus cursor-pointer" on:click={unfollow} />
        {:else}
          <i class="fa fa-user-plus cursor-pointer" on:click={follow} />
        {/if}
      </div>
      <div slot="tooltip">{$following ? "Unfollow" : "Follow"}</div>
    </Popover>
  {/if}
  <OverflowMenu {actions} />
</div>
