#!/usr/bin/env node

const axios = require("axios")
const chalk = require("chalk")
const log = console.log

log()
process.on("exit", () => {
  log()
})

axios({
  url: "https://api.github.com/users/vuejs-templates/repos",
  headers: {
    "User-Agent": "vue-cli"
  }
})
  .then(res => {
    if (res.status === 200) {
      let requestBody = res.data
      if (Array.isArray(requestBody)) {
        log("Avaliable official templates:")
        log()
        requestBody.forEach(repo => {
          log(
            "  " +
              chalk.yellow("★") +
              "  " +
              chalk.blue(repo.name) +
              "  " +
              repo.description
          )
        })
      }
    }
  })
  .catch(err => {
    log(err)
  })
