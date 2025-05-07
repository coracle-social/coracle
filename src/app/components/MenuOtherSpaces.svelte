<script lang="ts">
  import MenuSpacesItem from "@app/components/MenuSpacesItem.svelte"

  type Props = {
    urls: string[]
  }

  const {urls}: Props = $props()
</script>

<div class="column menu gap-2">
  {#each urls as url (url)}
    <MenuSpacesItem {url} />
  {/each}
</div>
