<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/router"

  export let value
</script>

<Anchor class="underline" killEvent href={router.at("topics").of(value).toString()}>
  #{value}
</Anchor>
