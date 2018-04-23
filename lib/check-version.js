const axios = require("axios")
const semver = require("semver")
const chalk = require("chalk")
const packageConfig = require("../package.json")

module.exports = done => {
  if (!semver.satisfies(process.version, packageConfig.engines.node)) {
    return console.log(
      chalk.red(
        `  You must update node to >=${
          packageConfig.engines.node
        }.x to use vue-cli`
      )
    )
  }
  axios({ url: "https://registry.npmjs.org/vue-cli", timeout: 10000 }).then(
    res => {
      const latestVersion = res.data["dist-tags"].latest
      const localVersion = packageConfig.version
      if (semver.lt(localVersion, latestVersion)) {
        console.log(chalk.yellow("  A newer version of vue-cli is available"))
        console.log()
        console.log("  latest:   " + chalk.green(latestVersion))
        console.log("   installed: " + chalk.red(localVersion))
        console.log()
      }
      done()
    }
  )
}
