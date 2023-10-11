<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"

  export let value
</script>

<Anchor modal class="underline" href={router.at("topics").of(value).toString()}>
  #{value}
</Anchor>
