// This script is necessary for installing stuff on a host, since our links don't exist there.

import fs from "fs"

const pkgName = process.argv[2]

if (!pkgName?.endsWith("package.json")) {
  console.log("File passed was not a package.json file")
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync(pkgName, "utf8"))

if (pkg.pnpm && pkg.pnpm.overrides) {
  // Use $package notation to make sure we only get one copy of each welshman dependency
  // TODO: move welshman to a single package to straighten all this out.
  for (const k of Object.keys(pkg.pnpm.overrides)) {
    pkg.pnpm.overrides[k] = '$' + k
  }

  fs.writeFileSync(pkgName, JSON.stringify(pkg, null, 2) + "\n")
  console.log("Removed pnpm.overrides from package.json")
} else {
  console.log("No pnpm.overrides found in package.json")
}
