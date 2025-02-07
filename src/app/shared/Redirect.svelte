<script lang="ts">
  import {onMount} from "svelte"
  import {router} from "src/app/util"

  export let to: string

  onMount(() => {
    router.at(to).replace()
  })
</script>
