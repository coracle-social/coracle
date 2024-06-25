<script lang="ts">
  import Field from 'src/partials/Field.svelte'
  import FieldInline from 'src/partials/FieldInline.svelte'
  import Input from 'src/partials/Input.svelte'
  import Toggle from 'src/partials/Toggle.svelte'

  export let ctrl
</script>

<p>Control how your note is presented</p>
<Field icon="fa-warning" label="Content warnings">
  <Input
    bind:value={$ctrl.draft.warning}
    placeholder="Why might people want to skip this post?" />
</Field>
<FieldInline icon="fa-user-secret" label="Post anonymously">
  <Toggle bind:value={$ctrl.draft.anonymous} />
  <p slot="info">Enable this to create an anonymous note.</p>
</FieldInline>
