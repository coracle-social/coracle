<script lang="ts">
  import Popover from "src/partials/Popover.svelte"
  import Menu from "src/partials/Menu.svelte"
  import MenuItem from "src/partials/MenuItem.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import {slowConnections} from "src/app/state"
  import {router} from "src/app/router"
  import {env, pubkey, sessions, logoutPubkey, displayPubkey} from "src/engine"

  const showLogin = () => router.at("login/advanced").open()
</script>

<Popover theme="transparent" placement="top-end" opts={{hideOnClick: true}}>
  <div slot="trigger" class="relative flex cursor-pointer items-center">
    <PersonCircle class="h-10 w-10" pubkey={$pubkey} />
  </div>
  <div slot="tooltip" class="flex justify-end">
    <Menu class="w-48">
      <MenuItem href={router.at("people").of($pubkey).toString()}>
        <i class="fa fa-user mr-2" /> Profile
      </MenuItem>
      <MenuItem href="/settings/keys">
        <i class="fa fa-key mr-2" /> Keys
      </MenuItem>
      {#if $env.FORCE_RELAYS.length === 0}
        <MenuItem href="/settings/relays">
          <i class="fa fa-server mr-2" /> Relays
          {#if $slowConnections.length > 0}
            <div
              class="absolute left-3 top-3 h-2 w-2 rounded border border-solid border-white bg-accent" />
          {/if}
        </MenuItem>
      {/if}
      <MenuItem href="/settings/content">
        <i class="fa fa-volume-xmark mr-2" /> Content
      </MenuItem>
      <MenuItem href="/settings">
        <i class="fa fa-gear mr-2" /> Settings
      </MenuItem>
      <MenuItem href="/settings/data">
        <i class="fa fa-database mr-2" /> Database
      </MenuItem>
      <MenuItem href="/logout">
        <i class="fa fa-right-from-bracket mr-2" /> Logout
      </MenuItem>
      <div class="my-2 h-px w-full bg-gray-5" />
      {#each Object.values($sessions) as s (s.pubkey)}
        {#if s.pubkey !== $pubkey}
          <MenuItem on:click={() => pubkey.set(s.pubkey)}>
            <div class="flex cursor-pointer items-center justify-between gap-2">
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
          </MenuItem>
        {/if}
      {/each}
      <MenuItem on:click={showLogin}>
        <i class="fa fa-plus mr-2" /> Account
      </MenuItem>
    </Menu>
  </div>
</Popover>
