// This script is necessary for installing stuff on a host, since our links don't exist there.

import fs from "fs"

const pkg = JSON.parse(fs.readFileSync("./package.json", "utf8"))

if (pkg.pnpm && pkg.pnpm.overrides) {
  delete pkg.pnpm.overrides
  fs.writeFileSync("./package.json", JSON.stringify(pkg, null, 2) + "\n")
  console.log("Removed pnpm.overrides from package.json")
} else {
  console.log("No pnpm.overrides found in package.json")
}
