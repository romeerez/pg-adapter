import typescriptPlugin from 'rollup-plugin-typescript2'
import typescript from 'typescript'
import pkg from './package.json'

export default {
  input: 'src/adapter.ts',
  output: [
    {
      file: pkg.main,
      format: 'cjs',
    },
  ],
  external: [...Object.keys(pkg.dependencies || {})],
  plugins: [
    typescriptPlugin({ typescript }),
  ],
}
