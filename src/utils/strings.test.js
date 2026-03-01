import { resolveTitle } from './strings'

describe('resolveTitle', () => {
  it('returns a plain string as-is', () => {
    expect(resolveTitle('Dumb Charades', 'en')).toBe('Dumb Charades')
  })

  it('returns the requested language from an object', () => {
    const title = { en: 'Lucky Number', hi: 'भाग्यशाली संख्या' }
    expect(resolveTitle(title, 'en')).toBe('Lucky Number')
    expect(resolveTitle(title, 'hi')).toBe('भाग्यशाली संख्या')
  })

  it('falls back to English when requested language is missing', () => {
    const title = { en: 'Lucky Number' }
    expect(resolveTitle(title, 'hi')).toBe('Lucky Number')
  })

  it('falls back to Hindi when English is missing', () => {
    const title = { hi: 'भाग्यशाली संख्या' }
    expect(resolveTitle(title, 'fr')).toBe('भाग्यशाली संख्या')
  })

  it('returns empty string for null input', () => {
    expect(resolveTitle(null, 'en')).toBe('')
  })

  it('returns empty string for undefined input', () => {
    expect(resolveTitle(undefined, 'en')).toBe('')
  })

  it('defaults lang to "en" when not provided', () => {
    const title = { en: 'Lucky Number', hi: 'भाग्यशाली संख्या' }
    expect(resolveTitle(title)).toBe('Lucky Number')
  })

  it('returns empty string for an empty object', () => {
    expect(resolveTitle({}, 'en')).toBe('')
  })
})
