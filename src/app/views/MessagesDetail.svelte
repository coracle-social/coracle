<script lang="ts">
  import cx from "classnames"
  import {onMount, onDestroy} from "svelte"
  import {toHex} from "src/util/nostr"
  import {formatTimestamp} from "src/util/misc"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {
    session,
    channels,
    derivePerson,
    displayPerson,
    publishNip04Message,
    nip04MarkChannelRead,
    listenForNip04Messages,
  } from "src/engine"
  import {routes} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"

  export let entity

  const pubkey = toHex(entity)
  const person = derivePerson(pubkey)
  const channel = channels.key(pubkey)

  nip04MarkChannelRead(pubkey)

  const sendMessage = async content => {
    const pub = await publishNip04Message(pubkey, content)

    await pub.result
  }

  onMount(() => {
    const sub = listenForNip04Messages(pubkey)

    return () => sub.close()
  })

  onDestroy(() => {
    nip04MarkChannelRead(pubkey)
  })

  document.title = `DMs with ${displayPerson($person)}`
</script>

<Channel messages={$channel?.messages || []} {sendMessage}>
  <div slot="header" class="flex h-16 items-start gap-4 overflow-hidden p-2">
    <div class="flex items-center gap-4 pt-1">
      <Anchor
        type="unstyled"
        class="fa fa-arrow-left cursor-pointer text-2xl"
        href="/conversations" />
      <PersonCircle {pubkey} size={10} />
    </div>
    <div class="flex h-12 w-full flex-col overflow-hidden pt-px">
      <div class="flex w-full items-center justify-between">
        <Anchor href={routes.person(pubkey)} class="font-bold">
          {displayPerson($person)}
        </Anchor>
      </div>
      <PersonAbout truncate {pubkey} />
    </div>
  </div>
  <div
    slot="message"
    let:message
    class={cx("flex overflow-hidden text-ellipsis", {
      "ml-12 justify-end": message.pubkey === $session.pubkey,
      "mr-12": message.pubkey !== $session.pubkey,
    })}>
    <div
      class={cx("inline-block max-w-xl rounded-2xl px-4 py-2", {
        "rounded-br-none bg-gray-1 text-gray-8": message.pubkey === $session.pubkey,
        "rounded-bl-none bg-gray-7": message.pubkey !== $session.pubkey,
      })}>
      <div class="break-words">
        {#if typeof message.content === "string"}
          <NoteContent showEntire note={message} />
        {/if}
      </div>
      <small
        class="mt-1"
        class:text-gray-7={message.pubkey === $session.pubkey}
        class:text-gray-1={message.pubkey !== $session.pubkey}>
        {formatTimestamp(message.created_at)}
      </small>
    </div>
  </div>
</Channel>
