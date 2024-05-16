<script lang="ts">
  import {derivePerson, displayPerson} from "src/engine"

  export let pubkey

  const person = derivePerson(pubkey)
</script>

{displayPerson($person)}
