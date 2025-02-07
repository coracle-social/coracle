<script lang="ts">
  import Audio from "src/partials/Audio.svelte"

  export let url: string
</script>

{#await import("src/util/audio")}
  <span />
{:then { AudioController }}
  <Audio controller={new AudioController(url)} />
{/await}
