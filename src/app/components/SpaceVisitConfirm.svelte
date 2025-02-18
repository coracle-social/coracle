<script module lang="ts">
  import {goto} from "$app/navigation"
  import {makeSpacePath} from "@app/routes"

  export const confirmSpaceVisit = (url: string) => {
    goto(makeSpacePath(url), {replaceState: true})
  }
</script>

<script lang="ts">
  import Confirm from "@lib/components/Confirm.svelte"

  type Props = {
    url: string
  }

  const {url}: Props = $props()

  const confirm = () => confirmSpaceVisit(url)
</script>

<Confirm
  {confirm}
  message="This space does not appear to limit who can post to it. This can result in a large amount of spam or other objectionable content. Continue?" />
