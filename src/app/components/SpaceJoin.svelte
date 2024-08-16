<script lang="ts">
  import {append, remove} from '@welshman/lib'
  import {displayRelayUrl} from '@welshman/util'
  import {goto} from "$app/navigation"
  import CardButton from "@lib/components/CardButton.svelte"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import InfoNip29 from '@app/components/InfoNip29.svelte'
  import {pushToast} from "@app/toast"
  import {pushModal} from "@app/modal"
  import {deriveGroup, displayGroup, relayUrlsByNom} from "@app/state"
  import {addGroupMemberships} from "@app/commands"

  export let nom

  const group = deriveGroup(nom)

  const back = () => history.back()

  const onUrlChange = (e: any) => {
    urls = urls.includes(e.target.value) ? remove(e.target.value, urls) : append(e.target.value, urls)
  }

  const join = async () => {
    loading = true

    try {
      await addGroupMemberships(urls.map(url => ["group", nom, url]))
    } finally {
      loading = false
    }

    goto(`/spaces/${nom}`)
  }

  let urls: string[] = $relayUrlsByNom.get(nom) || []
  let loading = false

  $: hasUrls = urls.length > 0
  $: urlOptions = $relayUrlsByNom.get(nom)?.toSorted() || []
</script>

<form class="column gap-4" on:submit|preventDefault={join}>
  <h1 class="heading">
    Joining <span class="text-primary">{displayGroup($group)}</span>
  </h1>
  <p class="text-center">
    Please select which relays you'd like to use for this group.
    <Button class="link" on:click={() => pushModal(InfoNip29)}>More information</Button>
  </p>
  {#each urlOptions as url}
    <div class="alert !flex justify-between items-center">
      <div class="flex gap-2 items-center">
        <Icon icon="remote-controller-minimalistic" />
        {displayRelayUrl(url)}
      </div>
      <input type="checkbox" value={url} class="toggle toggle-primary" checked={urls.includes(url)} on:change={onUrlChange} />
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
