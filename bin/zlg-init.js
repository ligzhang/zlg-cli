const program = require("commander")
const chalk = require("chalk")
const path = require("path")
const home = require("user-home")
const tildify = require("tildify")
const inquire = require("inquirer")
const exists = require("fs").existsSync
const localPath = require("../lib/localpath")
const isLocalPath = localPath.isLocalPath
const checkVersion = require("../lib/check-version")
const ora = require("ora")
const rm = require("rimraf").sync
const download = require("download-git-repo")
const logger = require("../lib/logger")
const generate = require("../lib/generate")
const log = console.log
program
  .usage("<template-name>[project-name]")
  .option("-c, --clone", "use git clone")
  .option("-u, --offline", "use cached template")

program.on("--help", () => {
  console.log("  Examples:")
  console.log()
  console.log(
    chalk.gray("    # create a new project with an official template")
  )
  console.log("    $ vue init webpack my-project")
  console.log()
  console.log(
    chalk.gray("    # create a new project straight from a github template")
  )
  console.log("    $ vue init username/repo my-project")
  console.log()
})

function help() {
  program.parse(process.argv)
  if (program.args.length < 1) {
    return program.help()
  }
}

help()

// get args
let template = program.args[0]
let rawName = program.args[1]

// 判断是否为 vue-template/webpack 格式的文件名
const hasSlash = template.includes("/")
const inPlace = !rawName || rawName === "."

const name = inPlace ? path.relative("..", process.cwd()) : rawName
const to = path.resolve(rawName || ".")
const clone = program.clone || false

const tmp = path.join(home, ".vue-templates", template.replace(/[\/:]/g, "-"))
if (program.offline) {
  log(`> Use cached template at ${chalk.yellow(tildify(tmp))}`)
  template = tmp
}

log(
  `模板名：${template};
文件夹名：${rawName};
文件夹名是否带斜杠：${hasSlash};
最终的文件夹名字：${name};
文件路径：${to}`
)

log()
// exit 事件监听
process.on("exit", () => {
  log()
})

if (inPlace || exists(to)) {
  inquire
    .prompt([
      {
        type: "confirm",
        message: inPlace
          ? "Generate project in current directory?"
          : "Target directory exists,Continue?",
        name: "ok"
      }
    ])
    .then(answers => {
      if (answers.ok) {
        run()
      }
    })
    .catch(logger.fatal)
} else {
  run()
}

function run() {
  // check if template is local
  console.log("1")
  if (isLocalPath(template)) {
    console.log(2)
    const templatePath = getTemplate(template)
    if (exists(templatePath)) {
      generate(name, templatePath, to, err => {
        if (err) {
          logger.fatal(err)
        }
        log()
        logger.success('Generated "%s".', name)
      })
    } else {
      logger.fatal('Local template "%s" not found.', template)
    }
  } else {
    checkVersion(() => {
      if (!hasSlash) {
        // use official template

        const officialTemplate = "vuejs-templates/" + template

        if (template.includes("#")) {
          downloadAndGenerate(officialTemplate)
        } else {
          if (template.includes("-2.0")) {
            warnings.v2SuffixTemplatesDeprecated(template, inPlace ? "" : name)
            return
          }
          console.log(3, officialTemplate)

          downloadAndGenerate(officialTemplate)
        }
      } else {
        downloadAndGenerate(template)
      }
    })
  }
}

function downloadAndGenerate(template) {
  const spinner = ora("downloading template")
  spinner.start()
  if (exists(tmp)) {
    rm(tmp)
  }
  download(template, tmp, { clone }, err => {
    spinner.stop()
    if (err) {
      logger.fatal(`Failed to download repo ${template}:${err.message.trim()}`)
    }

    generate(name, tmp, to, err => {
      log(4)

      if (err) {
        logger.fatal(err)
      }
      log()
      logger.success(`Generated ${name}`)
    })
  })
}
