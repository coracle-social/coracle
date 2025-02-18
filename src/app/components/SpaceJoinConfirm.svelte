<script module lang="ts">
  import {goto} from "$app/navigation"
  import {makeSpacePath} from "@app/routes"
  import {addSpaceMembership} from "@app/commands"
  import {pushToast} from "@app/toast"

  export const confirmSpaceJoin = async (url: string) => {
    await addSpaceMembership(url)

    goto(makeSpacePath(url), {replaceState: true})

    pushToast({
      message: "Welcome to the space!",
    })
  }
</script>

<script lang="ts">
  import Confirm from "@lib/components/Confirm.svelte"

  type Props = {
    url: string
  }

  const {url}: Props = $props()

  const confirm = () => confirmSpaceJoin(url)
</script>

<Confirm
  {confirm}
  message="This space does not appear to limit who can post to it. This can result in a large amount of spam or other objectionable content. Continue?" />
