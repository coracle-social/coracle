<script>
  import {nip19} from "nostr-tools"
  import {navigate} from "svelte-routing"
  import {fly} from "src/util/transition"
  import {ellipsize} from "hurdak/lib/hurdak"
  import Anchor from "src/partials/Anchor.svelte"
  import {user, chat} from "src/app/engine"

  export let channel

  const enter = () => navigate(`/chat/${nip19.noteEncode(channel.id)}`)
  const join = () => chat.joinRoom(channel.id)
  const leave = () => chat.leaveRoom(channel.id)
</script>

<button
  class="flex cursor-pointer gap-4 rounded border border-solid border-gray-6 bg-gray-7 px-4 py-6 transition-all hover:bg-gray-6"
  on:click={enter}
  in:fly={{y: 20}}>
  <div
    class="h-14 w-14 shrink-0 overflow-hidden rounded-full border border-solid border-white bg-cover bg-center"
    style="background-image: url({channel.picture})" />
  <div class="flex min-w-0 flex-grow flex-col justify-start gap-2">
    <div class="flex flex-grow items-start justify-between gap-2">
      <div class="flex items-center gap-2 overflow-hidden">
        <i class="fa fa-lock-open text-gray-1" />
        <h2 class="text-lg">{channel.name || ""}</h2>
      </div>
      {#if channel.joined}
        <Anchor theme="button" killEvent class="flex items-center gap-2" on:click={leave}>
          <i class="fa fa-right-from-bracket" />
          <span>Leave</span>
        </Anchor>
      {:else if user.canSign()}
        <Anchor theme="button" killEvent class="flex items-center gap-2" on:click={join}>
          <i class="fa fa-right-to-bracket" />
          <span>Join</span>
        </Anchor>
      {/if}
    </div>
    {#if channel.about}
      <p class="text-start text-gray-1">
        {ellipsize(channel.about, 300)}
      </p>
    {/if}
  </div>
</button>
