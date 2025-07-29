<script lang="ts">
  import {Router} from "@welshman/router"
  import {parseJson} from "src/util/misc"
  import Card from "src/partials/Card.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {router} from "src/app/util/router"

  export let note

  const {pubkey, content} = note
  const {name, picture, about} = parseJson(content) || {}

  const showPerson = () =>
    router
      .at("people")
      .of(pubkey)
      .cx({relays: Router.get().Event(note).getUrls()})
      .open()
</script>

<Card interactive class="flex flex-col gap-4 overflow-hidden" on:click={showPerson}>
  <div class="flex items-center gap-2">
    {#if picture}
      <ImageCircle class="h-10 w-10" src={picture} />
    {/if}
    <h3 class="staatliches text-2xl">{name}</h3>
  </div>
  {#if about}
    <p>{about}</p>
  {/if}
</Card>
