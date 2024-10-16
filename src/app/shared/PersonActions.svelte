<script lang="ts">
  import {nip19} from "nostr-tools"
  import {derived} from "svelte/store"
  import {ctx} from "@welshman/lib"
  import {toNostrURI} from "@welshman/util"
  import {session, signer, tagPubkey, mute, unmute} from "@welshman/app"
  import Popover from "src/partials/Popover.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {loginWithPublicKey, unfollow, userMutes, userFollows} from "src/engine"
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

  const unfollowPerson = () => unfollow(pubkey)

  const unmutePerson = () => unmute(pubkey)

  const mutePerson = () => mute(tagPubkey(pubkey))

  const openProfileInfo = () => router.at("people").of(pubkey).at("info").open()

  const share = () =>
    router
      .at("qrcode")
      .of(
        toNostrURI(
          nip19.nprofileEncode({pubkey, relays: ctx.app.router.FromPubkeys([pubkey]).getUrls()}),
        ),
      )
      .open()

  let actions = []

  $: {
    actions = []

    if ($following && $signer) {
      actions.push({onClick: unfollowPerson, label: "Unfollow", icon: "user-minus"})
    }

    if (!isSelf && $signer) {
      actions.push({
        onClick: $muted ? unmutePerson : mutePerson,
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

<Popover theme="transparent">
  <div
    slot="trigger"
    class="cursor-pointer rounded bg-neutral-800 px-3 py-1 text-center text-neutral-50 hover:bg-neutral-700">
    <i class="fa fa-lg fa-ellipsis-v" />
  </div>
  <div
    slot="tooltip"
    let:instance
    class="relative flex flex-col gap-2"
    on:click={() => instance.hide()}>
    <div
      class="absolute bottom-0 right-0 top-0 w-32 rounded-3xl bg-neutral-800"
      style="filter: blur(15px)" />
    {#each actions as { label, icon, onClick }}
      <div
        class="relative z-popover flex cursor-pointer items-center text-neutral-100"
        on:click={onClick}>
        <span class="absolute right-0 mr-12 whitespace-nowrap">{label}</span>
        <Anchor tall button circle class="text-accent"
          ><i class={`fa fa-${icon} text-sm`} /></Anchor>
      </div>
    {/each}
  </div>
</Popover>
