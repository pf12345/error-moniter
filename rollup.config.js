import path from 'path'
import ts from 'rollup-plugin-typescript2'
import json from '@rollup/plugin-json'

if (!process.env.TARGET) {
  throw new Error('TARGET package must be specified via --environment flag.')
}
const packagesDir = path.resolve(__dirname, 'packages');
const packageDir = path.resolve(packagesDir, process.env.TARGET);
const name = path.basename(packageDir)
const resolve = p => path.resolve(packageDir, p)
const pkg = require(resolve(`package.json`))
const packageOptions = pkg.buildOptions || {}

let hasTSChecked = false
const outputConfigs = {
  browser: {
    file: resolve(`dist/${name}.browser.js`),
    format: `es`
  },
  cjs: {
    file: resolve(`dist/${name}.cjs.js`),
    format: `cjs`
  },
  global: {
    file: resolve(`dist/${name}.global.js`),
    format: `iife`
  }
}
const defaultFormats = ['cjs']
const inlineFormats = process.env.FORMATS && process.env.FORMATS.split(',')
const packageFormats = inlineFormats || packageOptions.formats || defaultFormats
const packageConfigs = packageFormats.map(format => createConfig(format, outputConfigs[format]))

function createConfig(format, output, plugins = []) {
  if (!output) {
    console.log(require('chalk').yellow(`invalid format: "${format}"`))
    process.exit(1)
  }

  output.sourcemap = !!process.env.SOURCE_MAP
  output.externalLiveBindings = false

  const isGlobalBuild = /global/.test(format)

  if (isGlobalBuild) {
    output.name = packageOptions.name
  }

  const shouldEmitDeclarations = process.env.TYPES != null && !hasTSChecked

  const tsPlugin = ts({
    check: process.env.NODE_ENV === 'production' && !hasTSChecked,
    tsconfig: path.resolve(__dirname, 'tsconfig.json'),
    cacheRoot: path.resolve(__dirname, 'node_modules/.rts2_cache'),
    tsconfigOverride: {
      compilerOptions: {
        sourceMap: output.sourcemap,
        declaration: shouldEmitDeclarations,
        declarationMap: shouldEmitDeclarations
      },
      exclude: ['**/__tests__', 'test-dts']
    }
  })
  
  hasTSChecked = true

  const entryFile = `src/index.ts`

  const external =
    isGlobalBuild
      ? ['source-map', '@babel/parser', 'estree-walker']
      :
        [
          ...Object.keys(pkg.dependencies || {}),
          ...Object.keys(pkg.peerDependencies || {}),
          ...['path', 'url']
        ]

  output.globals = {
    postcss: 'postcss'
  }

  const nodePlugins =
    format !== 'cjs'
      ? [
          require('@rollup/plugin-node-resolve').nodeResolve({
            preferBuiltins: true
          }),
          require('@rollup/plugin-commonjs')({
            sourceMap: false
          }),
          require('rollup-plugin-node-builtins')(),
          require('rollup-plugin-node-globals')()
        ]
      : []

  return {
    input: resolve(entryFile),
    external,
    plugins: [
      json({
        namedExports: false
      }),
      tsPlugin,
      ...nodePlugins,
      ...plugins
    ],
    output,
    treeshake: {
      moduleSideEffects: false
    }
  }
}

export default packageConfigs