import { dirname, join, extname } from 'node:path'
import { fileURLToPath } from 'node:url'
import { existsSync } from 'node:fs'

const mapping = new Map([
  ['.js', ['.js', '.ts', '.tsx', '.jsx']],
  ['.cjs', ['.cjs', '.cts']],
  ['.mjs', ['.mjs', '.mts']],
  ['.jsx', ['.jsx', '.tsx']],
])

export const resolve = (specifier, context, next) => {
  if (!specifier.startsWith('.')) {
    return next(specifier, context)
  }

  const { parentURL } = context
  if (!parentURL || !parentURL.startsWith('file:')) {
    return next(specifier, context)
  }

  const specifiedExtension = extname(specifier)
  const sourceExtensions = mapping.get(specifiedExtension)
  if (!sourceExtensions) {
    return next(specifier, context)
  }

  const location = dirname(fileURLToPath(parentURL))
  const required = specifier.slice(0, -specifiedExtension.length)
  const path = join(location, required)

  for (const sourceExtension of sourceExtensions) {
    if (existsSync(path + sourceExtension)) {
      return next(required + sourceExtension, context)
    }
  }

  return next(specifier, context)
}
