<script lang="ts">
  import {displayPerson} from "src/util/nostr"
  import PersonInfo from "src/partials/PersonInfo.svelte"
  import {getPubkeyWriteRelays, sampleRelays} from "src/agent/relays"
  import user from "src/agent/user"

  export let person

  const {petnamePubkeys} = user

  const addPetname = ({pubkey}) => {
    const [{url}] = sampleRelays(getPubkeyWriteRelays(pubkey))

    user.addPetname(pubkey, url, displayPerson(person))
  }

  const removePetname = ({pubkey}) => {
    user.removePetname(pubkey)
  }
</script>

<PersonInfo
  {person}
  addPetname={$petnamePubkeys.includes(person.pubkey) ? addPetname : null}
  removePetname={$petnamePubkeys.includes(person.pubkey) ? null : removePetname} />
