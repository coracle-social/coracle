<script lang="ts">
  import {preventDefault} from "@lib/html"
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushToast} from "@app/toast"
  import {publishReport} from "@app/commands"

  const {url, event} = $props()

  const back = () => history.back()

  const confirm = async () => {
    if (!reason) {
      return pushToast({
        theme: "error",
        message: "Please select a reason for your report.",
      })
    }

    loading = true

    await publishReport({event, reason: reason.toLowerCase(), content, relays: [url]})

    loading = false
    history.back()

    return pushToast({message: "Your report has been sent!"})
  }

  let reason = $state("")
  let content = $state("")
  let loading = $state(false)
</script>

<form class="column gap-4" onsubmit={preventDefault(confirm)}>
  <ModalHeader>
    {#snippet title()}
      <div>Report Content</div>
    {/snippet}
    {#snippet info()}
      <div>Flag inappropriate content.</div>
    {/snippet}
  </ModalHeader>
  <Field>
    {#snippet label()}
      <p>Reason*</p>
    {/snippet}
    {#snippet input()}
      <select class="select select-bordered" bind:value={reason}>
        <option disabled selected>Choose a reason</option>
        <option>Nudity</option>
        <option>Malware</option>
        <option>Profanity</option>
        <option>Illegal</option>
        <option>Spam</option>
        <option>Impersonation</option>
        <option>Other</option>
      </select>
    {/snippet}
    {#snippet info()}
      <p>Please select a reason for your report.</p>
    {/snippet}
  </Field>
  <Field>
    {#snippet label()}
      <p>Details</p>
    {/snippet}
    {#snippet input()}
      <textarea class="textarea textarea-bordered" bind:value={content}></textarea>
    {/snippet}
    {#snippet info()}
      <p>Please provide any additional details relevant to your report.</p>
    {/snippet}
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" onclick={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Send Report</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
