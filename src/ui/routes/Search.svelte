<script>
  import Heading from "src/ui/partials/Heading.svelte"
  import Content from "src/ui/partials/Content.svelte"
  import PersonSearch from "src/ui/views/person/PersonSearch.svelte"
</script>

<Content>
  <div class="flex flex-col items-center justify-center">
    <Heading>Profile Search</Heading>
    <p>
      Search for people on Nostr. For now, only profiles that have already been loaded will appear
      in search results.
    </p>
  </div>
  <PersonSearch />
</Content>
