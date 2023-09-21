<script lang="ts">
  import {nip19} from "nostr-tools"
  import {modal} from "src/partials/state"
  import Anchor from "src/partials/Anchor.svelte"
  import Popover from "src/partials/Popover.svelte"
  import Card from "src/partials/Card.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {slowConnections} from "src/app/state"
  import {env, pubkey, sessions, logoutPubkey, displayPubkey} from "src/engine"

  const showLogin = () => modal.push({type: "login/advanced"})
</script>

<Popover theme="transparent" placement="top-end" opts={{hideOnClick: true}}>
  <div slot="trigger" class="relative flex cursor-pointer items-center">
    <PersonCircle size={10} pubkey={$pubkey} />
  </div>
  <div slot="tooltip" class="flex justify-end">
    <Card class="mt-1 w-48 overflow-hidden shadow-lg">
      <div class="-mx-3 -mt-1">
        <Anchor
          class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
          href={`/${nip19.npubEncode($pubkey)}`}>
          <i class="fa fa-user mr-2" /> Profile
        </Anchor>
        <Anchor class="block p-3 px-4 transition-all hover:bg-accent hover:text-white" href="/keys">
          <i class="fa fa-key mr-2" /> Keys
        </Anchor>
        {#if $env.FORCE_RELAYS.length === 0}
          <Anchor
            class="relative block p-3 px-4 transition-all hover:bg-accent hover:text-white"
            href="/relays">
            <i class="fa fa-server mr-2" /> Relays
            {#if $slowConnections.length > 0}
              <div
                class="absolute left-3 top-3 h-2 w-2 rounded border border-solid border-white bg-accent" />
            {/if}
          </Anchor>
        {/if}
        <Anchor
          class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
          href="/settings">
          <i class="fa fa-gear mr-2" /> Settings
        </Anchor>
        <Anchor
          class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
          href="/database">
          <i class="fa fa-database mr-2" /> Database
        </Anchor>
        <Anchor
          class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
          href="/logout">
          <i class="fa fa-right-from-bracket mr-2" /> Logout
        </Anchor>
        <div class="my-2 h-px w-full bg-gray-5" />
        {#each Object.values($sessions) as s (s.pubkey)}
          {#if s.pubkey !== $pubkey}
            <div
              class="block flex cursor-pointer items-center justify-between gap-2 p-3 px-4
                     transition-all hover:bg-accent hover:text-white"
              on:click={() => pubkey.set(s.pubkey)}>
              <div class="flex items-center gap-2">
                <PersonCircle pubkey={s.pubkey} />
                {displayPubkey(s.pubkey)}
              </div>
              <div
                class="flex h-6 w-6 cursor-pointer items-center justify-center rounded-full"
                on:click|stopPropagation={() => logoutPubkey(s.pubkey)}>
                <i class="fa fa-circle-xmark fa-lg" />
              </div>
            </div>
          {/if}
        {/each}
        <Anchor
          class="block p-3 px-4 transition-all hover:bg-accent hover:text-white"
          on:click={showLogin}>
          <i class="fa fa-plus mr-2" /> Account
        </Anchor>
      </div>
    </Card>
  </div>
</Popover>
