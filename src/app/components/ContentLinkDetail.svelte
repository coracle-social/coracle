<script lang="ts">
  import Button from '@lib/components/Button.svelte'
  import {imgproxy} from "@app/state"

  export let url

  const back = () => history.back()
</script>

<Button class="m-auto h-screen w-screen p-4 cursor-pointer" on:click={back}>
  <img alt="" src={imgproxy(url)} class="m-auto rounded-box max-w-full max-h-full" />
</Button>
