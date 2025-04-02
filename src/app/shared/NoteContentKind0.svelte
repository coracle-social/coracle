<script lang="ts">
  import {Router} from "@welshman/app"
  import {parseJson} from "src/util/misc"
  import {themeBackgroundGradient} from "src/partials/state"
  import Card from "src/partials/Card.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {router} from "src/app/util/router"
  import {imgproxy} from "src/engine"

  export let note

  const {pubkey, content} = note
  const {name, picture, about, banner} = parseJson(content) || {}
  const bannerUrl = imgproxy(banner)

  $: ({rgba} = $themeBackgroundGradient)

  const showPerson = () =>
    router
      .at("people")
      .of(pubkey)
      .cx({relays: Router.get().Event(note).getUrls()})
      .open()
</script>

<Card interactive class="overflow-hidden" on:click={showPerson}>
  <FlexColumn
    class="relative -m-4 p-4"
    style="background-size: cover; background-image: linear-gradient({rgba}, {rgba}), url('{bannerUrl}')">
    <div class="flex items-center gap-2">
      {#if picture}
        <ImageCircle class="h-10 w-10" src={picture} />
      {/if}
      <h3 class="staatliches text-2xl">{name}</h3>
    </div>
    {#if about}
      <p>{about}</p>
    {/if}
  </FlexColumn>
</Card>
