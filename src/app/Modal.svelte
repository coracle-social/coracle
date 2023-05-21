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

{#each nonVirtual as m, i}
  <Modal
    index={i}
    virtual={false}
    isOnTop={m === last($stack)}
    onEscape={m.noEscape ? null : closeModal}>
    <ModalRoutes {m} />
  </Modal>
{/each}
