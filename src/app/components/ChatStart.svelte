<script lang="ts">
  import {goto} from "$app/navigation"
  import {pubkey} from '@welshman/app'
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ModalHeader from "@lib/components/ModalHeader.svelte"
  import ModalFooter from "@lib/components/ModalFooter.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {makeChatPath} from "@app/routes"

  const back = () => history.back()

  const onSubmit = () => goto(makeChatPath([...pubkeys, $pubkey!]))

  let pubkeys: string[] = []
</script>

<form class="column gap-4" on:submit|preventDefault={onSubmit}>
  <ModalHeader>
    <div slot="title">Start a Chat</div>
    <div slot="info">Create an encrypted chat room for private conversations.</div>
  </ModalHeader>
  <Field>
    <p slot="label">Members</p>
    <div slot="input">
      <ProfileMultiSelect bind:value={pubkeys} />
    </div>
  </Field>
  <ModalFooter>
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={pubkeys.length === 0}>
      Create Chat
      <Icon icon="alt-arrow-right" />
    </Button>
  </ModalFooter>
</form>
