const chalk = require("chalk")
const Metalsmith = require("metalsmith")
const Handlebars = require("handlebars")
const getOptions = require("./options")
const path = require("path")
const logger = require("./logger")
const ask = require("./ask")
const filter = require("./filter")
const multimatch = require("multimatch")
const async = require("async")
const render = require("consolidate").handlebars.render
const log = console.log

Handlebars.registerHelper("if_eq", (a, b, ops) => {
  return a === b ? ops.fn(this) : ops.inverse(this)
})

Handlebars.registerHelper("unless_eq", (a, b, ops) => {
  return a === b ? ops.inverse(this) : ops.fn(this)
})

/**
 * Generate template from a 'src' and 'dest'
 *
 * @param {String} name
 * @param {String} src
 * @param {String} dest
 * @param {Function} done
 */
module.exports = (name, src, dest, done) => {
  log(5)
  const opts = getOptions(name, src)
  const metalsmith = Metalsmith(path.join(src, "template"))

  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true
  })
  log(data, "opts")

  opts.helpers &&
    Object.keys(opts.helpers).map(key => {
      Handlebars.registerHelper(key, opts.helpers[key])
    })

  const helpers = { chalk, logger }

  if (opts.metalsmith && typeof opts.metalsmith.before === "function") {
    opts.metalsmith.before(metalsmith, opts, helpers)
  }

  metalsmith
    .use(askQuestions(opts.prompts))
    .use(filterFiles(opts.filters))
    .use(renderTemplateFiles(opts.skipInterpolation))

  if (typeof opts.metalsmith === "function") {
    opts.metalsmith(metalsmith, opts, helpers)
  } else if (opts.metalsmith && opts.metalsmith.after === "function") {
    opts.metalsmith.after(metalsmith, opts, helpers)
  }

  metalsmith
    .clean(false)
    .source(".")
    .destination(dest)
    .build((err, files) => {
      done(err)
      if (typeof opts.complete === "function") {
        const helpers = { chalk, logger, files }
        opts.complete(data, helpers)
      } else {
        logMessager(opts.completeMessage, data)
      }
    })
  return data
}

function askQuestions(prompts) {
  return (files, metalsmith, done) => {
    ask(prompts, metalsmith.metadata(), done)
  }
}

function filterFiles(filters) {
  return (files, metalsmith, done) => {
    filter(files, filters, metalsmith.metadata(), done)
  }
}

function renderTemplateFiles(skipInterpolation) {
  skipInterpolation =
    typeof skipInterpolation === "string"
      ? [skipInterpolation]
      : skipInterpolation
  return (files, metalsmith, done) => {
    const keys = Object.keys(files)
    const metalsmithMetadata = metalsmith.metadata()
    async.each(
      keys,
      (file, next) => {
        if (
          skipInterpolation &&
          multimatch([file], skipInterpolation, { dot: true }).length
        ) {
          return next()
        }
        const str = files[file].contents.toString()
        if (!/{{([^{}]+)}}/g.test(str)) {
          return next()
        }

        render(str, metalsmithMetadata, (err, res) => {
          if (err) {
            err.message = `[${file}] ${err.message}`
            return next(err)
          }

          files[file].contents = new Buffer(res)
          next()
        })
      },
      done
    )
  }
}

function logMessage(message, data) {
  if (!message) {
    return
  }
  render(message, data, (err, res) => {
    if (err) {
      console.error(
        "\n Error when rendering template complete message:" +
          err.message.trim()
      )
    } else {
      console.log(
        "\n" +
          res
            .split(/\r?\n/g)
            .map(line => "  " + line)
            .join("\n")
      )
    }
  })
}
