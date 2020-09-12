const execa = require('execa')
const args = require('minimist')(process.argv.slice(2))
const target = args._.length ? fuzzyMatchTarget(args._)[0] : 'collection-browser'
const formats = args.formats || args.f
const sourceMap = args.sourcemap || args.s

execa(
  'rollup',
  [
    '-wc',
    '--environment',
    [
      `TARGET:${target}`,
      `FORMATS:${formats || ''}`,
      sourceMap ? `SOURCE_MAP:true` : ``
    ]
      .filter(Boolean)
      .join(',')
  ],
  {
    stdio: 'inherit'
  }
)