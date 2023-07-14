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
          this.db.createObjectStore(o.name, o.opts)
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

  deleteStore(storeName) {
    return new Promise((resolve, reject) => {
      this.db.deleteObjectStore()
      this.db.oncomplete = e => resolve(e.target.result)
      this.db.onabort = e => reject(e.target.error)
      this.db.error = e => reject(e.target.error)
    })
  }

  bulkAdd(storeName, data) {
    return new Promise((resolve, reject) => {
      const transaction = this.db.transaction([storeName], "readwrite")

      for (const row of data) {
        const request = transaction.objectStore(storeName).add(row)

        request.onerror = e => reject(e.target.error)
        request.onsuccess = e => resolve(e.target.result)
      }
    })
  }

  getAll(storeName) {
    return new Promise((resolve, reject) => {
      const store = this.db.transaction(storeName).objectStore(storeName)
      const request = store.openCursor(null, IDBCursor.NEXT)
      const results = []

      request.onsuccess = e => {
        const cursor = e.target.result

        if (cursor) {
          results.push(cursor.value)
          cursor.continue()
        } else {
          resolve(results)
        }
      }

      request.onerror = e => reject(e.target.error)
    })
  }

  clear(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction([storeName], "readwrite").objectStore(storeName).clear()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }

  count(storeName) {
    return new Promise((resolve, reject) => {
      const request = this.db.transaction([storeName]).objectStore(storeName).count()

      request.onerror = e => reject(e.target.error)
      request.onsuccess = e => resolve(e.target.result)
    })
  }
}
