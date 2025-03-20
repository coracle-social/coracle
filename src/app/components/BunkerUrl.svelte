<script lang="ts">
  import {pushModal} from "@app/modal"
  import InfoBunker from "@app/components/InfoBunker.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"

  type Props = {
    bunker: string
    loading: boolean
  }

  let {loading, bunker = $bindable("")}: Props = $props()
</script>

<Field>
  {#snippet label()}
    <p>Bunker Link*</p>
  {/snippet}
  {#snippet input()}
    <label class="input input-bordered flex w-full items-center gap-2">
      <Icon icon="cpu" />
      <input disabled={loading} bind:value={bunker} class="grow" placeholder="bunker://" />
    </label>
  {/snippet}
  {#snippet info()}
    <p>
      A login link provided by a nostr signing app.
      <Button class="link" onclick={() => pushModal(InfoBunker)}>What is a bunker link?</Button>
    </p>
  {/snippet}
</Field>
