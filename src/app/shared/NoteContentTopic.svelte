<script lang="ts">
  import Anchor from "src/partials/Anchor.svelte"
  import {router} from "src/app/util/router"

  export let value
</script>

<Anchor modal underline href={router.at("topics").of(value).toString()}>
  #{value}
</Anchor>
