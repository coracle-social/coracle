<script lang="ts">
  import {Profile} from "@welshman/domain"
  import Card from "src/partials/Card.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {getWriteRelays, reader} from "src/engine/core"
  import {router} from "src/app/util/router"

  export let note

  const {pubkey} = note
  const profile = reader(Profile)(note)

  const showPerson = () =>
    router
      .at("people")
      .of(pubkey)
      .cx({relays: getWriteRelays(pubkey)})
      .open()
</script>

<Card interactive class="flex flex-col gap-4 overflow-hidden" on:click={showPerson}>
  <div class="flex items-center gap-2">
    {#if profile.picture()}
      <ImageCircle class="h-10 w-10" src={profile.picture()} />
    {/if}
    <h3 class="staatliches text-2xl">{profile.name()}</h3>
  </div>
  {#if profile.about()}
    <p>{profile.about()}</p>
  {/if}
</Card>
