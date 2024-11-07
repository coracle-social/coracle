<script lang="ts">
  import {derived} from "svelte/store"
  import {onMount, onDestroy} from "svelte"
  import {deriveEvents} from "@welshman/store"
  import {DIRECT_MESSAGE} from "@welshman/util"
  import {session} from "@welshman/app"
  import {repository, displayProfileByPubkey, loadInboxRelaySelections} from "@welshman/app"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {router} from "src/app/util/router"
  import {
    hasNip44,
    sendMessage,
    sendLegacyMessage,
    markChannelRead,
    getChannelIdFromEvent,
    listenForMessages,
  } from "src/engine"

  export let pubkeys
  export let channelId
  export let initialMessage = null

  const messages = derived(
    deriveEvents(repository, {filters: [{kinds: [4, DIRECT_MESSAGE]}]}),
    $events => $events.filter(e => getChannelIdFromEvent(e) === channelId),
  )

  let isAccepted

  const showPerson = pubkey => router.at("people").of(pubkey).open()

  const send = async (content, useNip17) => {
    // If we don't have nip44 support, just send a legacy message
    if (!$hasNip44 || !useNip17) {
      return sendLegacyMessage(channelId, content)
    }

    await sendMessage(channelId, content)
  }

  onMount(() => {
    isAccepted = $messages.some(m => m.pubkey === $session.pubkey)
    markChannelRead(channelId)

    for (const pubkey of pubkeys) {
      loadInboxRelaySelections(pubkey)
    }

    return listenForMessages(pubkeys)
  })

  onDestroy(() => {
    markChannelRead(channelId)
  })

  document.title = `Direct Messages`
</script>

<Channel {pubkeys} messages={$messages} sendMessage={send} {initialMessage}>
  <div slot="header" class="flex h-16 items-start gap-4 overflow-hidden p-1 px-4">
    <div class="flex items-center gap-4 pt-1">
      <Anchor
        class="fa fa-arrow-left cursor-pointer text-2xl"
        href={"/channels" + (isAccepted ? "" : "/requests")} />
      <PersonCircles {pubkeys} />
    </div>
    <div class="flex h-12 w-full flex-col overflow-hidden pt-1">
      <div class="w-full">
        {#each pubkeys as pubkey, i (pubkey)}
          {#if i > 0}&bullet;{/if}
          <Anchor class="hover:underline" on:click={() => showPerson(pubkey)}>
            {displayProfileByPubkey(pubkey)}
          </Anchor>
        {/each}
      </div>
      {#if pubkeys.length === 1}
        <PersonAbout truncate pubkey={pubkeys[0]} />
      {/if}
    </div>
  </div>
</Channel>
