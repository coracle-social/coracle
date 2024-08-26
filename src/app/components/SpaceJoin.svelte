<script lang="ts">
  import {append, remove} from "@welshman/lib"
  import {displayRelayUrl} from "@welshman/util"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import InfoNip29 from "@app/components/InfoNip29.svelte"
  import {pushModal, clearModal} from "@app/modal"
  import {pushToast} from "@app/toast"
  import {deriveGroup, displayGroup, relayUrlsByNom} from "@app/state"
  import {sendJoinRequest, addGroupMemberships} from "@app/commands"

  export let nom

  const group = deriveGroup(nom)

  const back = () => history.back()

  const onUrlChange = (e: any) => {
    urls = urls.includes(e.target.value)
      ? remove(e.target.value, urls)
      : append(e.target.value, urls)
  }

  const tryJoin = async () => {
    for (const url of urls) {
      const [ok, message] = await sendJoinRequest(nom, url)

      if (!ok) {
        return pushToast({theme: "error", message})
      }
    }

    await addGroupMemberships(urls.map(url => ["group", nom, url]))

    clearModal()
  }

  const join = async () => {
    loading = true

    try {
      await tryJoin()
    } finally {
      loading = false
    }
  }

  let loading = false
  let urls: string[] = $relayUrlsByNom.get(nom) || []

  $: hasUrls = urls.length > 0
  $: urlOptions = $relayUrlsByNom.get(nom)?.toSorted() || []
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <h1 class="heading">
    Joining <span class="text-primary">{displayGroup($group)}</span>
  </h1>
  <p class="text-center">
    Please select which relays you'd like to use for this group.
    <Button class="link" on:click={() => pushModal(InfoNip29)}>What is a relay?</Button>
  </p>
  {#each urlOptions as url}
    <div class="alert !flex items-center justify-between">
      <div class="flex items-center gap-2">
        <Icon icon="remote-controller-minimalistic" />
        {displayRelayUrl(url)}
      </div>
      <input
        type="checkbox"
        value={url}
        class="toggle toggle-primary"
        checked={urls.includes(url)}
        on:change={onUrlChange} />
    </div>
  {/each}
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={!hasUrls || loading}>
      <Spinner {loading}>Join Space</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </div>
</form>
