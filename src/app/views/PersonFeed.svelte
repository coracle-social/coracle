<script lang="ts">
  import {last} from "ramda"
  import {displayPerson} from "src/util/nostr"
  import {parseHex} from "src/util/html"
  import {theme, getThemeColor} from "src/partials/state"
  import Content from "src/partials/Content.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonActions from "src/app/shared/PersonActions.svelte"
  import {sampleRelays, getPubkeyWriteRelays} from "src/agent/relays"
  import {getPersonWithFallback, watch} from "src/agent/db"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import PersonNotes from "src/app/shared/PersonNotes.svelte"
  import PersonStats from "src/app/shared/PersonStats.svelte"
  import {routes} from "src/app/state"

  export let pubkey

  const person = watch("people", () => getPersonWithFallback(pubkey))

  let rgb, rgba

  $: relays = sampleRelays(getPubkeyWriteRelays(pubkey))

  $: {
    const color = parseHex(getThemeColor($theme, "gray-7"))

    rgba = `rgba(${color.join(", ")}, 0.4)`
    rgb = `rgba(${color.join(", ")})`
  }

  document.title = displayPerson($person)
</script>

<div
  class="absolute left-0 h-64 w-full -mt-2"
  style="background-size: cover;
         background-image:
          linear-gradient(to bottom, {rgba}, {rgb}),
          url('{$person.kind0?.banner}')" />

<Content>
  <div class="flex gap-4 text-gray-1 z-10">
    <PersonCircle person={$person} size={16} class="sm:h-32 sm:w-32" />
    <div class="flex flex-grow flex-col gap-4">
      <div class="flex items-start justify-between gap-4">
        <div class="flex flex-grow flex-col gap-2">
          <div class="flex items-center gap-2">
            <Anchor type="unstyled" href={routes.person(pubkey)}>
              <h1 class="text-2xl">
                {displayPerson($person)}
              </h1>
            </Anchor>
          </div>
          {#if $person.verified_as}
            <div class="flex gap-1 text-sm">
              <i class="fa fa-user-check text-accent" />
              <span class="text-gray-1">{last($person.verified_as.split("@"))}</span>
            </div>
          {/if}
        </div>
        <PersonActions person={$person} />
      </div>
      <PersonAbout person={$person} />
      <PersonStats person={$person} />
    </div>
  </div>
  <PersonNotes invertColors {pubkey} {relays} />
</Content>
