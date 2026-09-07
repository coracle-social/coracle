<script lang="ts">
  import {derived} from "svelte/store"
  import {onMount, onDestroy} from "svelte"
  import {noop} from "@welshman/lib"
  import {isShareableRelayUrl} from "@welshman/util"
  import {MessagingRelayLists, Profiles} from "@welshman/app"
  import Link from "src/partials/Link.svelte"
  import Button from "src/partials/Button.svelte"
  import Channel from "src/app/shared/Channel.svelte"
  import PersonCircles from "src/app/shared/PersonCircles.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import {router} from "src/app/util/router"
  import Popover from "src/partials/Popover.svelte"
  import {
    getChannelIdFromEvent,
    listenForMessages,
    messages as allMessages,
    setChecked,
    shouldUnwrap,
  } from "src/engine"
  import {fromApp, messagingRelayLists, pubkey} from "src/engine/core"

  export let pubkeys: string[]
  export let channelId

  const messages = derived(allMessages, $events =>
    $events.filter(e => getChannelIdFromEvent(e) === channelId),
  )

  // Read messaging relays off the plugin's projection rather than the reader — the plugin
  // normalizes urls, and subscribing to it is what triggers the lazy load for each pubkey.
  const pubkeysWithoutMessaging = fromApp($app =>
    derived(
      pubkeys.map((pk: string) => $app.use(MessagingRelayLists).urls(pk).$),
      ($urls: string[][]) =>
        pubkeys.filter((pk: string, i: number) => !$urls[i].some(isShareableRelayUrl)),
    ),
  )

  const displays = fromApp($app =>
    derived(
      pubkeys.map((pk: string) => $app.use(Profiles).display(pk).$),
      ($displays: string[]) => $displays,
    ),
  )

  let isAccepted

  const showPerson = (pk: string) => router.at("people").of(pk).open()

  onMount(() => {
    if (!$shouldUnwrap) {
      router.at("channels/enable").open({mini: true, noEscape: true})
    }

    const unsubscriber = listenForMessages()

    isAccepted = $messages.some(m => m.pubkey === $pubkey)
    setChecked("channels/" + channelId)

    for (const pk of pubkeys) {
      messagingRelayLists.get().load(pk).catch(noop)
    }

    return () => {
      unsubscriber()
    }
  })

  onDestroy(() => {
    setChecked("channels/" + channelId)
  })

  document.title = `Direct Messages`
</script>

<Channel {pubkeys} {channelId} messages={$messages}>
  <div slot="header" class="flex h-16 justify-between px-4">
    <div class="flex items-center gap-4">
      <div class="flex items-center gap-4 pt-1">
        <Link
          class="fa fa-arrow-left cursor-pointer text-2xl"
          href={"/channels" + (isAccepted ? "" : "/requests")} />
        <PersonCircles {pubkeys} />
      </div>
      <div class:h-16={pubkeys.length === 1} class="flex flex-col items-start overflow-hidden pt-2">
        <div>
          {#each pubkeys as memberPubkey, i (memberPubkey)}
            {#if i > 0}&bullet;{/if}
            <Button class="hover:underline" on:click={() => showPerson(memberPubkey)}>
              {$displays[i]}
            </Button>
          {/each}
        </div>
        {#if pubkeys.length === 1}
          <PersonAbout truncate pubkey={pubkeys[0]} />
        {/if}
      </div>
    </div>
    {#if $pubkeysWithoutMessaging.length > 0}
      <div class="flex items-center">
        <Popover triggerType="mouseenter" placement="left">
          <div
            slot="trigger"
            class="flex cursor-pointer items-center gap-1 rounded-full bg-danger px-2">
            <i class="fa fa-exclamation-triangle" />
            <span>
              {$pubkeysWithoutMessaging.length}
            </span>
          </div>
          <div slot="tooltip">
            {$pubkeysWithoutMessaging.length} inbox is not configured
          </div>
        </Popover>
      </div>
    {/if}
  </div>
</Channel>
