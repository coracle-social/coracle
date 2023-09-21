<script lang="ts">
  import {navigate} from "svelte-routing"
  import {nip19} from "nostr-tools"
  import {tryJson} from "src/util/misc"
  import {getThemeBackgroundGradient} from "src/partials/state"
  import Card from "src/partials/Card.svelte"
  import Content from "src/partials/Content.svelte"
  import ImageCircle from "src/partials/ImageCircle.svelte"
  import {imgproxy, getEventHints} from "src/engine"

  export let note

  const {pubkey, content} = note
  const {name, picture, about, banner} = tryJson(() => JSON.parse(content))
  const nprofile = nip19.nprofileEncode({pubkey, relays: getEventHints(note)})
  const {rgba} = getThemeBackgroundGradient()
  const bannerUrl = imgproxy(banner)
</script>

<Card interactive invertColors class="overflow-hidden" on:click={() => navigate(nprofile)}>
  <div
    class="relative -m-4 p-4"
    style="background-size: cover; background-image: linear-gradient({rgba}, {rgba}), url('{bannerUrl}')">
    <Content>
      <div class="flex items-center gap-2">
        {#if picture}
          <ImageCircle size={10} src={picture} />
        {/if}
        <h3 class="staatliches text-2xl">{name}</h3>
      </div>
      {#if about}
        <p>{about}</p>
      {/if}
    </Content>
  </div>
</Card>
