<script lang="ts">
  import {goto} from "$app/navigation"
  import Field from "@lib/components/Field.svelte"
  import Button from "@lib/components/Button.svelte"
  import Icon from "@lib/components/Icon.svelte"
  import ProfileMultiSelect from "@app/components/ProfileMultiSelect.svelte"
  import {makeChatPath} from "@app/routes"

  const back = () => history.back()

  const onSubmit = async () => {
    goto(makeChatPath(pubkeys))
  }

  let pubkeys: string[] = []
</script>

<form class="column gap-4" on:submit|preventDefault={onSubmit}>
  <h1 class="heading">Start a Chat</h1>
  <p class="text-center">Create an encrypted chat room for private conversations.</p>
  <Field>
    <p slot="label">Members</p>
    <div slot="input">
      <ProfileMultiSelect bind:value={pubkeys} />
    </div>
  </Field>
  <div class="flex flex-row items-center justify-between gap-4">
    <Button class="btn btn-link" on:click={back}>
      <Icon icon="alt-arrow-left" />
      Go back
    </Button>
    <Button type="submit" class="btn btn-primary" disabled={pubkeys.length === 0}>
      Create Chat
      <Icon icon="alt-arrow-right" />
    </Button>
  </div>
</form>
