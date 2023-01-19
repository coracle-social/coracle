<script>
  import {liveQuery} from 'dexie'
  import {nip19} from 'nostr-tools'
  import {assoc, propEq, mergeRight} from 'ramda'
  import {now, batch} from 'src/util/misc'
  import {personKinds} from 'src/util/nostr'
  import Channel from 'src/partials/Channel.svelte'
  import {getRelays, user, db, listen, load, keys} from 'src/agent'
  import cmd from 'src/app/cmd'

  export let entity

  let crypt = keys.getCrypt()
  let {data: pubkey} = nip19.decode(entity)
  let person = liveQuery(() => db.people.get(pubkey))
  let filters = [
    {kinds: [4], authors: [$user.pubkey], '#p': [pubkey]},
    {kinds: [4], authors: [pubkey], '#p': [$user.pubkey]}]

  const decryptMessages = async messages => {
    // Gotta do it in serial because of extension limitations
    for (const message of messages) {
      message.content = await crypt.decrypt(message.pubkey, message.content)
      console.log(message.content)
    }

    return messages
  }

  const listenForMessages = cb => listen(
    getRelays(),
    [{kinds: personKinds, authors: [pubkey]},
     ...filters.map(assoc('since', now()))],
    batch(300, events => {
      return cb(decryptMessages(events.filter(propEq('kind', 4))))
    })
  )

  const loadMessages = async ({until, limit}) => {
    const messages = await load(getRelays(), filters.map(mergeRight({until, limit})))

    return await decryptMessages(messages)
  }


  const sendMessage = content =>
    cmd.createDirectMessage(getRelays(), pubkey, content)
</script>

<Channel
  name={$person?.name}
  about={$person?.about}
  picture={$person?.picture}
  {loadMessages}
  {listenForMessages}
  {sendMessage}
/>
