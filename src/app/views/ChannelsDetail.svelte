<script lang="ts">
  import cx from "classnames"
  import {onMount, onDestroy} from "svelte"
  import {formatTimestamp} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {
    session,
    channels,
    displayPubkey,
    createNip24Message,
    nip24MarkChannelRead,
    listenForNip59Messages,
  } from "src/engine"

  export let entity

  const channel = channels.key(entity)
  const pubkeys = entity.split(",")

  nip24MarkChannelRead(entity)

  const sendMessage = content => createNip24Message(entity, content)

  const showPerson = pubkey => modal.push({type: "person/detail", pubkey})

  onMount(() => {
    const sub = listenForNip59Messages()

    return () => sub.close()
  })

  onDestroy(() => {
    nip24MarkChannelRead(entity)
  })

  document.title = `Direct Messages`
</script>

<Channel messages={$channel.messages} {sendMessage}>
  <div slot="header" class="flex h-16 items-start gap-4 overflow-hidden p-2">
    <div class="flex items-center gap-4 pt-1">
      <Anchor type="unstyled" class="fa fa-arrow-left cursor-pointer text-2xl" href="/channels" />
      <div class="mr-3 flex pt-1">
        {#each pubkeys as pubkey (pubkey)}
          <div class="-mr-3 inline-block">
            <PersonCircle size={10} class="h-8 w-8" {pubkey} />
          </div>
        {/each}
      </div>
    </div>
    <div class="flex h-12 w-full flex-col overflow-hidden pt-1">
      <div class="w-full">
        {#each pubkeys as pubkey, i (pubkey)}
          {#if i > 0}&bullet;{/if}
          <Anchor on:click={() => showPerson(pubkey)} class="font-bold">
            {displayPubkey(pubkey)}
          </Anchor>
        {/each}
      </div>
      {#if pubkeys.length === 1}
        <PersonAbout truncate pubkey={pubkeys[0]} />
      {/if}
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
      class={cx("inline-block flex max-w-xl flex-col rounded-2xl px-4 py-2", {
        "rounded-br-none bg-gray-1 text-gray-8": message.pubkey === $session.pubkey,
        "rounded-bl-none bg-gray-7": message.pubkey !== $session.pubkey,
      })}>
      {#if message.showProfile && message.pubkey !== $session.pubkey}
        <Anchor class="mb-1" on:click={() => showPerson(message.pubkey)}>
          <strong>{displayPubkey(message.pubkey)}</strong>
        </Anchor>
      {/if}
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
