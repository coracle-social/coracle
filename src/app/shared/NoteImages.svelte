<script lang="ts">
  import {first} from "@welshman/lib"
  import {getTagValues} from "@welshman/util"
  import Media from "src/partials/Media.svelte"

  export let compose
  export let value = []
  export let includeInContent = false

  const getUrl = imeta => first(getTagValues("url", imeta))

  export const getValue = () => value

  export const addImage = imeta => {
    value = [...value, imeta]

    if (includeInContent) {
      compose.write("\n" + getUrl(imeta))
    }
  }

  export const removeImage = i => {
    if (includeInContent) {
      const imeta = value[i]
      const content = compose.parse()

      compose.clear()
      compose.write(content.replace(getUrl(imeta), ""))
    }

    value = value.slice(0, i).concat(value.slice(i + 1))
  }
</script>

{#if value.length > 0}
  <div class="columns-2 gap-2 lg:columns-3">
    {#each value as imeta, i (getUrl(imeta) + i)}
      <div class="pb-2">
        <Media tags={imeta} url={getUrl(imeta)} onClose={() => removeImage(i)} />
      </div>
    {/each}
  </div>
{/if}
