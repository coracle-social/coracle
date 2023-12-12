<script lang="ts">
  import {pluck} from "ramda"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import Anchor from "src/partials/Anchor.svelte"
  import PersonMultiSelect from "src/app/shared/PersonMultiSelect.svelte"
  import {router} from "src/app/router"

  let profiles = []

  const submit = () => router.at("channels").of(pluck("pubkey", profiles)).push()
</script>

<form on:submit|preventDefault={submit} class="flex justify-center py-12">
  <FlexColumn>
    <h2 class="staatliches text-center text-6xl">Start a conversation</h2>
    <div class="flex w-full flex-col gap-8 pb-56">
      <Field label="Who do you want to talk to?">
        <PersonMultiSelect bind:value={profiles} />
      </Field>
      <Anchor button tag="button" type="submit">Done</Anchor>
    </div>
  </FlexColumn>
</form>
