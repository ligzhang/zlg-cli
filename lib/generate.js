const chalk = require("chalk")
const Metalsmith = require("metalsmith")
const Handlebars = require("handlebars")
const getOptions = require("./options")
const path = require("path")
const logger = require("./logger")

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
  const opts = getOptions(name, src)
  const metalsmith = Metalsmith(path.join(src, "template"))
  const data = Object.assign(metalsmith.metadata(), {
    destDirName: name,
    inPlace: dest === process.cwd(),
    noEscape: true
  })
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
}
