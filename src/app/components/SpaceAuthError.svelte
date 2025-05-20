<script lang="ts">
  import {displayRelayUrl} from "@welshman/util"
  import {parse, renderAsHtml} from "@welshman/content"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import {preventDefault} from "@lib/html"
  import {ucFirst} from "@lib/util"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import SpaceAccessRequest from "@app/components/SpaceAccessRequest.svelte"
  import {pushModal} from "@app/modal"

  const {url, error} = $props()

  const back = () => history.back()

  const requestAccess = () => pushModal(SpaceAccessRequest, {url})
</script>

<form class="column gap-4" onsubmit={preventDefault(requestAccess)}>
  <ModalHeader>
    {#snippet title()}
      <div>Access Error</div>
    {/snippet}
    {#snippet info()}
      <div>We couldn't connect you to this space.</div>
    {/snippet}
  </ModalHeader>
  <p>
    We received an error from the relay indicating you don't have access to {displayRelayUrl(url)}:
  </p>
  <p class="bg-alt card2 welshman-content">
    {@html renderAsHtml(parse({content: ucFirst(error)}))}
  </p>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary">
      Request Access
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
