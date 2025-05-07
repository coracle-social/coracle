// This script is necessary for installing stuff on a host, since our links don't exist there.

import fs from "fs"

const pkgName = process.argv[2]

if (!pkgName?.endsWith("package.json")) {
  console.log("File passed was not a package.json file")
  process.exit(1)
}

const pkg = JSON.parse(fs.readFileSync(pkgName, "utf8"))

if (pkg.pnpm && pkg.pnpm.overrides) {
  delete pkg.pnpm.overrides
  fs.writeFileSync(pkgName, JSON.stringify(pkg, null, 2) + "\n")
  console.log("Removed pnpm.overrides from package.json")
} else {
  console.log("No pnpm.overrides found in package.json")
}
