<script lang="ts">
  import {tryJson} from "src/util/misc"
  import {themeBackgroundGradient} from "src/partials/state"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {router} from "src/app/router"
  import {imgproxy, getEventHints} from "src/engine"

  export let note

  const {pubkey, content} = note
  const {name, picture, about, banner} = tryJson(() => JSON.parse(content))
  const bannerUrl = imgproxy(banner)

  $: ({rgba} = $themeBackgroundGradient)

  const showPerson = () =>
    router
      .at("people")
      .of(pubkey)
      .cx({relays: getEventHints(note)})
      .open()
</script>

<Card interactive class="overflow-hidden" on:click={showPerson}>
  <div
    class="relative -m-4 p-4"
    style="background-size: cover; background-image: linear-gradient({rgba}, {rgba}), url('{bannerUrl}')">
    <Content>
      <div class="flex items-center gap-2">
        {#if picture}
          <ImageCircle class="h-10 w-10" src={picture} />
        {/if}
        <h3 class="staatliches text-2xl">{name}</h3>
      </div>
      {#if about}
        <p>{about}</p>
      {/if}
    </Content>
  </div>
</Card>
