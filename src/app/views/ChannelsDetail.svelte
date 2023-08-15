<script lang="ts">
  import cx from "classnames"
  import {filter, whereEq} from "ramda"
  import {onMount} from "svelte"
  import {generatePrivateKey} from "nostr-tools"
  import {formatTimestamp} from "src/util/misc"
  import {modal} from "src/partials/state"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import {wrap} from "src/engine/util/nip59"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {
    user,
    Nip24,
    Nip65,
    Outbox,
    Directory,
    Settings,
    Builder,
    Network,
    Keys,
  } from "src/app/engine"

  export let entity

  const relayLimit = Settings.getSetting("relay_limit")
  const userPubkey = Keys.pubkey.get()
  const channel = Nip24.channels.key(entity)
  const messages = Nip24.messages.derived(filter(whereEq({channel: entity})))
  const pubkeys = entity.split(",")

  // Only mark a real channel as checked
  if ($channel) {
    user.setNip24ChannelLastChecked(entity)
  }

  const sendMessage = async content => {
    const {privkey} = Keys.current.get()
    const rumor = {
      kind: 14,
      content,
      pubkey: userPubkey,
      tags: pubkeys.map(Builder.mention),
    }

    for (const pubkey of pubkeys.concat(userPubkey)) {
      const wrapperTags = [Builder.mention(pubkey)]
      const event = wrap(privkey, pubkey, generatePrivateKey(), rumor, wrapperTags)
      const relays = Nip65.getPubkeyHints(relayLimit, pubkey, "read")

      Outbox.publish(event, relays)
    }
  }

  const showPerson = pubkey => modal.push({type: "person/detail", pubkey})

  onMount(() => {
    const sub = Network.subscribe({
      relays: Nip65.getPubkeyHints(relayLimit, userPubkey, "read"),
      filter: [{kinds: [1059], "#p": [userPubkey]}],
    })

    return () => sub.close()
  })

  document.title = `Direct Messages`
</script>

<Channel {messages} {sendMessage}>
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
            {Directory.displayPubkey(pubkey)}
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
      "ml-12 justify-end": message.profile.pubkey === userPubkey,
      "mr-12": message.profile.pubkey !== userPubkey,
    })}>
    <div
      class={cx("inline-block flex max-w-xl flex-col rounded-2xl px-4 py-2", {
        "rounded-br-none bg-gray-1 text-gray-8": message.profile.pubkey === userPubkey,
        "rounded-bl-none bg-gray-7": message.profile.pubkey !== userPubkey,
      })}>
      {#if message.showProfile && message.profile.pubkey !== userPubkey}
        <Anchor class="mb-1" on:click={() => showPerson(message.profile.pubkey)}>
          <strong>{Directory.displayProfile(message.profile)}</strong>
        </Anchor>
      {/if}
      <div class="break-words">
        {#if typeof message.content === "string"}
          <NoteContent showEntire note={message} />
        {/if}
      </div>
      <small
        class="mt-1"
        class:text-gray-7={message.profile.pubkey === userPubkey}
        class:text-gray-1={message.profile.pubkey !== userPubkey}>
        {formatTimestamp(message.created_at)}
      </small>
    </div>
  </div>
</Channel>
