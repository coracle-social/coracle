<script lang="ts">
  import cx from "classnames"
  import {nip19} from "nostr-tools"
  import {derivePerson, displayHandle} from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)
</script>

<div class={cx($$props.class, "overflow-hidden overflow-ellipsis opacity-75")}>
  {$person.handle ? displayHandle($person.handle) : nip19.npubEncode(pubkey)}
</div>
