// From https://gist.github.com/underground/d50e40170d54b8a0f8a3f4fdd466eee4
export class IndexedDB {
  constructor(dbName, dbVersion, stores) {
    this.db
    this.dbName = dbName
    this.dbVersion = dbVersion
    this.stores = stores
  }

  open() {
    return new Promise((resolve, reject) => {
      if (!window.indexedDB) {
        reject("Unsupported indexedDB")
      }

      const request = window.indexedDB.open(this.dbName, this.dbVersion)

      request.onsuccess = e => {
        this.db = request.result

        resolve()
      }

      request.onerror = e => reject(e.target.error)

      request.onupgradeneeded = e => {
        this.db = e.target.result

        this.stores.forEach(o => {
          try {
            this.db.createObjectStore(o.name, o.opts)
          } catch (e) {
            console.warn(e)
          }
        })
      }
    })
  }

  close() {
    return this.db.close()
  }

  delete() {
    window.indexedDB.deleteDatabase(this.dbName)
  }

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.db.transaction(storeName).objectStore(storeName)
      const request = store.getAll()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }

  async bulkPut(storeName, data) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return Promise.all(
      data.map(row => {
        return new Promise((resolve, reject) => {
          const request = store.put(row)

          request.onerror = e => reject(e.target.error)
          request.onsuccess = e => resolve(e.target.result)
        })
      })
    )
  }

  async bulkDelete(storeName, ids) {
    const transaction = this.db.transaction(storeName, "readwrite")
    const store = transaction.objectStore(storeName)

    return Promise.all(
      ids.map(id => {
        return new Promise((resolve, reject) => {
          const request = store.delete(id)

          request.onerror = e => reject(e.target.error)
          request.onsuccess = e => resolve(e.target.result)
        })
      })
    )
  }

  clear(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(storeName, "readwrite").objectStore(storeName).clear()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }

  count(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction(storeName).objectStore(storeName).count()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }
}
