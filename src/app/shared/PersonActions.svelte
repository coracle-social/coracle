<script lang="ts">
  import {nip19} from "nostr-tools"
  import {derived} from "svelte/store"
  import {toNostrURI} from "@welshman/util"
  import Popover from "src/partials/Popover.svelte"
  import OverflowMenu from "src/partials/OverflowMenu.svelte"
  import {
    loginWithPublicKey,
    session,
    hints,
    signer,
    unfollowPerson,
    followPerson,
    unmutePerson,
    mutePerson,
    userMutes,
    userFollows,
  } from "src/engine"
  import {boot} from "src/app/state"
  import {router} from "src/app/util/router"

  export let pubkey

  const isSelf = $session?.pubkey === pubkey
  const following = derived(userFollows, $m => $m.has(pubkey))
  const muted = derived(userMutes, $m => $m.has(pubkey))

  const loginAsUser = () => {
    router.clearModals()
    loginWithPublicKey(pubkey)
    boot()
  }

  const unfollow = () => unfollowPerson(pubkey)

  const follow = () => followPerson(pubkey)

  const unmute = () => unmutePerson(pubkey)

  const mute = () => mutePerson(pubkey)

  const openProfileInfo = () => router.at("people").of(pubkey).at("info").open()

  const share = () =>
    router
      .at("qrcode")
      .of(toNostrURI(nip19.nprofileEncode({pubkey, relays: hints.FromPubkeys([pubkey]).getUrls()})))
      .open()

  let actions = []

  $: {
    actions = []

    if (!isSelf && $signer) {
      actions.push({
        onClick: $muted ? unmute : mute,
        label: $muted ? "Unmute" : "Mute",
        icon: $muted ? "microphone-slash" : "microphone",
      })
    }

    if ($signer) {
      actions.push({
        onClick: () => router.at("lists/select").qp({type: "p", value: pubkey}).open(),
        label: "Add to list",
        icon: "list",
      })
    }

    if (!isSelf && $signer) {
      actions.push({
        onClick: () => router.at("notes/create").qp({pubkey}).open(),
        label: "Mention",
        icon: "at",
      })

      actions.push({
        onClick: () => router.at("channels").of([$session.pubkey, pubkey]).push(),
        label: "Message",
        icon: "envelope",
      })
    }

    if (!isSelf) {
      actions.push({onClick: loginAsUser, label: "Login as", icon: "right-to-bracket"})
    }

    actions.push({onClick: openProfileInfo, label: "Details", icon: "info"})

    if (isSelf && $signer) {
      actions.push({
        onClick: () => router.at("settings/profile").open(),
        label: "Edit",
        icon: "edit",
      })
    }
  }
</script>

<div class="flex items-center gap-3" on:click|stopPropagation>
  {#if !isSelf && ($signer || !$session)}
    <Popover triggerType="mouseenter">
      <div slot="trigger" class="w-6 cursor-pointer text-center">
        {#if $following}
          <i class="fa fa-user-minus" on:click={unfollow} />
        {:else}
          <i class="fa fa-user-plus" on:click={follow} />
        {/if}
      </div>
      <div slot="tooltip">{$following ? "Unfollow" : "Follow"}</div>
    </Popover>
  {/if}
  <Popover triggerType="mouseenter">
    <div slot="trigger" class="w-6 cursor-pointer text-center">
      <i class="fa fa-share-nodes" on:click={share} />
    </div>
    <div slot="tooltip">Share</div>
  </Popover>
  <OverflowMenu {actions} />
</div>
