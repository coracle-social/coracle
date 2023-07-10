<script lang="ts">
  import {parseHex} from "src/util/html"
  import {theme, getThemeColor} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import {nip05, routing, directory, user} from "src/app/system"
  import {watch} from "src/util/loki"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonNotes from "src/app/shared/PersonNotes.svelte"
  import PersonStats from "src/app/shared/PersonStats.svelte"
  import {routes} from "src/app/state"

  export let pubkey

  const profile = watch(directory.profiles, () => directory.getProfile(pubkey))
  const handle = watch(nip05.handles, () => nip05.getHandle(pubkey))
  const relays = routing.getPubkeyHints(user.getSetting("relay_limit"), pubkey)

  let rgb, rgba

  $: {
    const color = parseHex(getThemeColor($theme, "gray-7"))

    rgba = `rgba(${color.join(", ")}, 0.4)`
    rgb = `rgba(${color.join(", ")})`
  }

  document.title = directory.displayProfile($profile)
</script>

<div
  class="absolute left-0 -mt-2 h-64 w-full"
  style="background-size: cover;
         background-image:
          linear-gradient(to bottom, {rgba}, {rgb}),
          url('{$profile.banner}')" />

<Content>
  <div class="z-10 flex gap-4 text-gray-1">
    <PersonCircle pubkey={$profile.pubkey} size={16} class="sm:h-32 sm:w-32" />
    <div class="flex flex-grow flex-col gap-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-grow flex-col gap-2">
          <div class="flex items-center gap-2">
            <Anchor href={routes.person(pubkey)}>
              <h1 class="text-2xl">
                {directory.displayProfile($profile)}
              </h1>
            </Anchor>
          </div>
          {#if $handle}
            <div class="flex gap-1 text-sm">
              <i class="fa fa-user-check text-accent" />
              <span class="text-gray-1">{nip05.displayHandle($handle)}</span>
            </div>
          {/if}
        </div>
        <PersonActions {pubkey} />
      </div>
      <PersonAbout {pubkey} />
      <PersonStats {pubkey} />
    </div>
  </div>
  <div class="relative z-10">
    <PersonNotes invertColors {pubkey} {relays} />
  </div>
</Content>
