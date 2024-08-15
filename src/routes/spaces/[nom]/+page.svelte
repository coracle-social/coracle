<script lang="ts">
  import {page} from '$app/stores'
  import {deriveGroup, deriveGroupConversation} from '@app/state'

  const group = deriveGroup($page.params.nom)
  const conversation = deriveGroupConversation($page.params.nom)
</script>

<div class="h-screen flex flex-col">
  <div class="min-h-32 bg-base-100">
  </div>
  <div class="flex-grow overflow-auto">
  </div>
  <div class="min-h-32 bg-base-100">
  </div>
</div>
