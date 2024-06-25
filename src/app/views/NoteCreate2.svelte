<script lang="ts">
  import {switcher} from "hurdak"
  import {NOTE} from '@welshman/util'
  import {showWarning, showPublishInfo} from "src/partials/Toast.svelte"
  import Field from "src/partials/Field.svelte"
  import FlexColumn from "src/partials/FlexColumn.svelte"
  import NsecWarning from "src/app/shared/NsecWarning.svelte"
  import NoteCreateKind from "src/app/shared/NoteCreateKind.svelte"
  import NoteCreateFields from "src/app/shared/NoteCreateFields.svelte"
  import NoteCreateContent from "src/app/shared/NoteCreateContent.svelte"
  import NoteCreateControls from "src/app/shared/NoteCreateControls.svelte"
  import {router, makeDraftNote, DraftError, DraftController} from "src/app/util"
  import {publishToZeroOrMoreGroups} from "src/engine"

  export let draft = makeDraftNote()

  const ctrl = new DraftController(draft, {
    publish: async () => {
      for (const error of ctrl.validate()) {
        const message = switcher(error, {
          [DraftError.EmptyContent]: "Please provide a description.",
          [DraftError.EmptyTitle]: "Please provide a title.",
          [DraftError.EmptyCurrency]: "Please select a currency.",
          [DraftError.EmptyTime]: "Please provide a start and end date and time.",
          [DraftError.InvalidPrice]: "Please provide a valid price.",
          default: null
        })

        if (message) {
          return showWarning(error)
        }
      }

      const {groups, anonymous} = ctrl.draft
      const {pubs} = await publishToZeroOrMoreGroups(groups, ctrl.getEvent(), {anonymous})

      showPublishInfo(pubs[0])
      router.clearModals()
    },
  })
</script>

<FlexColumn>
  <NoteCreateKind {ctrl} />
  <div>
    <NoteCreateFields {ctrl} />
    <Field label={$ctrl.draft.kind === NOTE ? "What do you want to say?" : "Description"}>
      <NoteCreateContent {ctrl} />
    </Field>
    <NoteCreateControls {ctrl} />
  </div>
</FlexColumn>

{#if $ctrl.nsecWarning}
  <NsecWarning onAbort={ctrl.clearNsecWarning} onBypass={ctrl.ignoreNsecWarning} />
{/if}
