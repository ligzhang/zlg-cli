const match = require("minimatch")

const evaluate = require("./eval")

module.exports = (files, filters, data, done) => {
  if (!filters) {
    return done()
  }

  const fileNames = Object.keys(files)
  Object.keys(filters).forEach(glob => {
    fileNames.forEach(item => {
      if (match(item, glob, { dot: true })) {
        const condition = filters[glob]
        if (!evaluate(condition, data)) {
          delete files[item]
        }
      }
    })
  })
  done()
}
