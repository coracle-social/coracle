<script lang="ts">
  import Spinner from "@lib/components/Spinner.svelte"
  import Button from "@lib/components/Button.svelte"
  import Field from "@lib/components/Field.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import {pushToast} from "@app/toast"
  import {publishReport} from "@app/commands"

  export let url
  export let event

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

  let reason = ""
  let content = ""
  let loading = false
</script>

<form class="column gap-4" on:submit|preventDefault={confirm}>
  <ModalHeader>
    <div slot="title">Report Content</div>
    <div slot="info">Flag inappropriate content.</div>
  </ModalHeader>
  <Field>
    <p slot="label">Reason*</p>
    <select slot="input" class="select select-bordered" bind:value={reason}>
      <option disabled selected>Choose a reason</option>
      <option>Nudity</option>
      <option>Malware</option>
      <option>Profanity</option>
      <option>Illegal</option>
      <option>Spam</option>
      <option>Impersonation</option>
      <option>Other</option>
    </select>
    <p slot="info">Please select a reason for your report.</p>
  </Field>
  <Field>
    <p slot="label">Details</p>
    <textarea slot="input" class="textarea textarea-bordered" bind:value={content} />
    <p slot="info">Please provide any additional details relevant to your report.</p>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={loading}>
      <Spinner {loading}>Send Report</Spinner>
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
