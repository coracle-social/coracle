<script lang="ts">
  import Button from "@lib/components/Button.svelte"
  import {imgproxy} from "@app/state"

  const {url} = $props()

  const back = () => history.back()
</script>

<Button class="m-auto h-screen w-screen cursor-pointer p-4" onclick={back}>
  <img alt="" src={imgproxy(url)} class="m-auto max-h-full max-w-full rounded-box" />
</Button>
