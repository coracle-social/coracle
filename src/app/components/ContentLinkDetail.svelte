<script lang="ts">
  import ContentLinkBlockImage from "@app/components/ContentLinkBlockImage.svelte"
  import Button from "@lib/components/Button.svelte"

  const {value, event} = $props()

  const back = () => history.back()
</script>

<Button class="m-auto h-screen w-screen cursor-pointer p-4" onclick={back}>
  <ContentLinkBlockImage {value} {event} class="m-auto max-h-full max-w-full rounded-box" />
</Button>
