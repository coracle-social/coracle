<script lang="ts">
  import {
    deriveProfile,
    getUserWotScore,
    maxWot,
    session,
    deriveProfileDisplay,
    tagZapSplit,
    deriveHandleForPubkey,
    profilesByPubkey,
  } from "@welshman/app"
  import {userFollows} from "src/engine"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import WotScore from "src/partials/WotScore.svelte"
  import PersonHandle from "src/app/shared/PersonHandle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {router} from "src/app/util"
  import {ensureProto, formatTimestampRelative} from "src/util/misc"
  import {stripProtocol} from "@welshman/lib"
  import CopyValueSimple from "src/partials/CopyValueSimple.svelte"
  import {nip19} from "nostr-tools"

  export let pubkey

  const handle = deriveHandleForPubkey(pubkey)
  const wotScore = getUserWotScore(pubkey)
  const profile = deriveProfile(pubkey, {relays: []})
  const profileDisplay = deriveProfileDisplay(pubkey)
  const showPerson = () => router.at("people").of(pubkey).open()

  $: zapLink = router
    .at("zap")
    .qp({splits: [tagZapSplit(pubkey)]})
    .toString()
  $: following = $userFollows.has(pubkey)
  $: zapDisplay = $profile?.lud16 || $profile?.lud06
  $: accent = following || pubkey === $session?.pubkey
  $: profileUpdated = $profilesByPubkey.get(pubkey)?.event?.created_at
</script>

<div on:click|stopPropagation>
  <Popover triggerType="mouseenter" opts={{hideOnClick: true}} placement="right">
    <div slot="trigger">
      <WotScore score={wotScore} max={$maxWot} {accent} />
    </div>
    <div slot="tooltip" class="p-4">
      <strong class="cursor-pointer font-bold" on:click={showPerson}>{$profileDisplay}</strong>
      {#if profileUpdated}
        <div class="text-neutral-400">Updated {formatTimestampRelative(profileUpdated)}</div>
      {/if}
      {#if $profile?.about}
        <PersonAbout class="mt-4 font-thin" {pubkey} />
      {/if}
      {#if $handle}
        <div class="mt-4 flex items-center gap-2 text-accent">
          <i class="fa fa-at" />
          <PersonHandle {pubkey} />
        </div>
      {/if}
      <Anchor modal class="mt-4 flex items-center gap-2" href={zapLink}>
        <i class="fa fa-bolt" />
        {zapDisplay}
      </Anchor>
      {#if $profile?.website}
        <Anchor
          external
          class="mt-4 flex items-center gap-2 overflow-hidden overflow-ellipsis whitespace-nowrap"
          href={ensureProto($profile.website)}>
          <i class="fa fa-link text-accent" />
          {stripProtocol($profile.website)}
        </Anchor>
      {/if}
      <div class="mt-4 break-all">
        <span class="text-neutral-400">{nip19.npubEncode(pubkey)}</span>
        <CopyValueSimple class="!inline-flex pl-1" value={nip19.npubEncode(pubkey)} label="Npub" />
      </div>
      <div class="mt-4 flex items-center gap-2">
        <Anchor modal class="flex items-center gap-1" href="/help/web-of-trust">
          WoT Score: {wotScore}
          <i class="fa fa-info-circle" />
        </Anchor>
      </div>
    </div>
  </Popover>
</div>
