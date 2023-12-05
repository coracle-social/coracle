<script lang="ts">
  import {without} from "ramda"
  import Media from "src/partials/Media.svelte"

  export let compose
  export let value = []
  export let includeInContent = false

  const getUrl = imeta => imeta.type("url").values().first()

  export const getValue = () => value

  export const addImage = imeta => {
    value = value.concat(imeta)

    if (includeInContent) {
      compose.write("\n" + getUrl(imeta))
    }
  }

  export const removeImage = imeta => {
    const content = compose.parse()

    compose.clear()
    compose.write(content.replace(getUrl(imeta), ""))

    value = without([imeta], value)
  }
</script>

{#if value.length > 0}
  <div class="columns-2 gap-2 lg:columns-3">
    {#each value as imeta}
      <div class="pb-2">
        <Media {imeta} url={getUrl(imeta)} onClose={() => removeImage(imeta)} />
      </div>
    {/each}
  </div>
{/if}
