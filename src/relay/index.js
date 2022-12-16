import {db} from 'src/relay/db'
import {worker} from 'src/relay/worker'
import {ensurePlural} from 'hurdak/lib/hurdak'

const filterEvents = ({kinds, ids, authors, ...filter}) => {
  let t = db.events

  if (kinds) {
    t = t.where('kind').anyOf(ensurePlural(kinds))
  }

  if (ids) {
    t = t.where('id').anyOf(ensurePlural(ids))
  }

  if (authors) {
    t = t.where('pubkey').anyOf(ensurePlural(authors))
  }

  return t
}

export default {db, worker, filterEvents}
