<script lang="ts">
  import cx from "classnames"
  import {toHex, displayPerson} from "src/util/nostr"
  import {now, formatTimestamp} from "src/util/misc"
  import {Tags} from "src/util/nostr"
  import Channel from "src/partials/Channel.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import NoteContent from "src/app/shared/NoteContent.svelte"
  import {getAllPubkeyRelays, sampleRelays} from "src/agent/relays"
  import {getPersonWithFallback} from "src/agent/db"
  import {watch} from "src/agent/db"
  import network from "src/agent/network"
  import {keys} from "src/system"
  import user from "src/agent/user"
  import cmd from "src/agent/cmd"
  import {routes} from "src/app/state"
  import PersonCircle from "src/app/shared/PersonCircle.svelte"
  import PersonAbout from "src/app/shared/PersonAbout.svelte"

  export let entity

  let crypt = keys.getCrypt()
  let pubkey = toHex(entity)
  let person = watch("people", () => getPersonWithFallback(pubkey))

  user.setLastChecked(`dm/${pubkey}`, now())

  const getRelays = () => sampleRelays(getAllPubkeyRelays([pubkey, user.getPubkey()]))
  const cursor = new network.Cursor({relays: getRelays()})

  const decryptMessages = async events => {
    const results = []

    // Gotta do it in serial because of extension limitations
    for (const event of events) {
      const key = event.pubkey === pubkey ? pubkey : Tags.from(event).getMeta("p")

      results.push({...event, content: await crypt.decrypt(key, event.content)})
    }

    return results
  }

  const getFilters = (extra = {}) => [
    {kinds: [4], authors: [user.getPubkey()], "#p": [pubkey], ...extra},
    {kinds: [4], authors: [pubkey], "#p": [user.getPubkey()], ...extra},
  ]

  const listenForMessages = onChunk =>
    network.listen({
      relays: getRelays(),
      filter: getFilters({since: now()}),
      onChunk: async events => onChunk(await decryptMessages(events)),
    })

  const loadMessages = onChunk =>
    cursor.loadPage({
      filter: getFilters(),
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
      <Anchor
        type="unstyled"
        class="fa fa-arrow-left cursor-pointer text-2xl"
        on:click={() => history.back()} />
      <PersonCircle person={$person} size={12} />
    </div>
    <div class="flex w-full flex-col gap-2">
      <div class="flex w-full items-center justify-between">
        <div class="flex items-center gap-4">
          <Anchor href={routes.person(pubkey)} class="text-lg font-bold">
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
      class={cx("inline-block max-w-xl rounded-2xl px-4 py-2", {
        "rounded-br-none bg-gray-1 text-end text-gray-8":
          message.person.pubkey === user.getPubkey(),
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
