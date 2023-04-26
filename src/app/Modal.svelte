<script lang="ts">
  import {last} from "ramda"
  import {menuIsOpen} from "src/app/state"
  import {modal} from "src/partials/state"
  import Modal from "src/partials/Modal.svelte"
  import ModalRoutes from "src/app/ModalRoutes.svelte"

  const {stack} = modal

  $: nonVirtual = $stack.filter(m => !m.virtual)

  const closeModal = async () => {
    modal.pop()
    menuIsOpen.set(false)
  }
</script>

{#each nonVirtual as m}
  <Modal virtual={false} onEscape={!m.noEscape && m === last($stack) ? closeModal : null}>
    <ModalRoutes {m} />
  </Modal>
{/each}
