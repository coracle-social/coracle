<script lang="ts">
  import cx from "classnames"
  import {assoc} from "ramda"
  import {toHex, displayPerson} from "src/util/nostr"
  import {now, formatTimestamp} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app2/shared/NoteContent.svelte"
  import {getAllPubkeyRelays, sampleRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/tables"
  import {watch} from "src/agent/storage"
  import network from "src/agent/network"
  import keys from "src/agent/keys"
  import user from "src/agent/user"
  import cmd from "src/agent/cmd"
  import {routes} from "src/app/ui"
  import {lastChecked} from "src/app/listener"
  import PersonCircle from "src/app2/shared/PersonCircle.svelte"
  import PersonAbout from "src/app2/shared/PersonAbout.svelte"

  export let entity

  let crypt = keys.getCrypt()
  let pubkey = toHex(entity)
  let person = watch("people", () => getPersonWithFallback(pubkey))

  lastChecked.update(assoc(pubkey, now()))

  const getRelays = () => {
    return sampleRelays(getAllPubkeyRelays([pubkey, user.getPubkey()]))
  }

  const decryptMessages = async events => {
    const results = []
    // Gotta do it in serial because of extension limitations
    for (const event of events) {
      const key = event.pubkey === pubkey ? pubkey : Tags.from(event).type("p").values().first()

      results.push({...event, content: await crypt.decrypt(key, event.content)})
    }

    return results
  }

  const getFilters = extra => [
    {kinds: [4], authors: [user.getPubkey()], "#p": [pubkey], ...extra},
    {kinds: [4], authors: [pubkey], "#p": [user.getPubkey()], ...extra},
  ]

  const listenForMessages = onChunk =>
    network.listen({
      relays: getRelays(),
      filter: getFilters({since: now()}),
      onChunk: async events => onChunk(await decryptMessages(events)),
    })

  const loadMessages = (cursor, onChunk) =>
    network.load({
      relays: getRelays(),
      filter: getFilters(cursor.getFilter()),
      onChunk: async events => onChunk(await decryptMessages(events)),
    })

  const sendMessage = async content => {
    const cyphertext = await crypt.encrypt(pubkey, content)
    const [event] = await cmd.createDirectMessage(pubkey, cyphertext).publish(getRelays())

    // Return unencrypted content so we can display it immediately
    return {...event, content}
  }

  document.title = `DMs with ${displayPerson($person)}`
</script>

<Channel {loadMessages} {listenForMessages} {sendMessage}>
  <div slot="header" class="mb-2 flex h-20 items-start gap-4 overflow-hidden p-4">
    <div class="flex items-center gap-4">
      <Anchor type="unstyled" class="fa fa-arrow-left cursor-pointer text-2xl" href="/messages" />
      <PersonCircle person={$person} size={12} />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-4">
          <Anchor type="unstyled" href={routes.person(pubkey)} class="text-lg font-bold">
            {displayPerson($person)}
          </Anchor>
        </div>
        <div class="flex items-center gap-2">
          <i class="fa fa-lock text-gray-1" />
          <span class="text-gray-1">Encrypted</span>
        </div>
      </div>
      <PersonAbout truncate person={$person} />
    </div>
  </div>
  <div
    slot="message"
    let:message
    class={cx("flex overflow-hidden text-ellipsis", {
      "ml-12 justify-end": message.person.pubkey === user.getPubkey(),
      "mr-12": message.person.pubkey !== user.getPubkey(),
    })}>
    <div
      class={cx("inline-block max-w-xl rounded-2xl py-2 px-4", {
        "rounded-br-none bg-white text-end text-black": message.person.pubkey === user.getPubkey(),
        "rounded-bl-none bg-gray-7": message.person.pubkey !== user.getPubkey(),
      })}>
      <div class="break-words">
        {#if typeof message.content === "string"}
          <NoteContent showEntire note={message} />
        {/if}
      </div>
      <small
        class="mt-1"
        class:text-gray-7={message.person.pubkey === user.getPubkey()}
        class:text-gray-1={message.person.pubkey !== user.getPubkey()}>
        {formatTimestamp(message.created_at)}
      </small>
    </div>
  </div>
</Channel>
