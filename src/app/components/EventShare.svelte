<script lang="ts">
  import {goto} from "$app/navigation"
  import type {TrustedEvent} from "@welshman/util"
  import {preventDefault} from "@lib/html"
  import Icon from "@lib/components/Icon.svelte"
  import Button from "@lib/components/Button.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import ChannelName from "@app/components/ChannelName.svelte"
  import {channelsByUrl} from "@app/state"
  import {makeRoomPath} from "@app/routes"
  import {setKey} from "@app/implicit"

  const {url, noun, event}: {url: string; noun: string; event: TrustedEvent} = $props()

  const back = () => history.back()

  const onSubmit = () => {
    setKey("share", event)
    goto(makeRoomPath(url, selection), {replaceState: true})
  }

  const toggleRoom = (room: string) => {
    selection = room === selection ? "" : room
  }

  let selection = $state("")
</script>

<form class="column gap-4" onsubmit={preventDefault(onSubmit)}>
  <ModalHeader>
    {#snippet title()}
      <div>Share {noun}</div>
    {/snippet}
    {#snippet info()}
      <div>Which room would you like to share this event to?</div>
    {/snippet}
  </ModalHeader>
  <div class="grid grid-cols-3 gap-2">
    {#each $channelsByUrl.get(url) || [] as channel (channel.room)}
      <button
        type="button"
        class="btn"
        class:btn-neutral={selection !== channel.room}
        class:btn-primary={selection === channel.room}
        onclick={() => toggleRoom(channel.room)}>
        #<ChannelName {...channel} />
      </button>
    {/each}
  </div>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!selection}>
      Share {noun}
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
