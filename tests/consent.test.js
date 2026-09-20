import { getConsent, setConsent, subscribeConsent } from '../src/lib/consent'

beforeEach(() => localStorage.clear())

describe('consent', () => {
  test('is null until the user chooses', () => {
    expect(getConsent()).toBeNull()
  })

  test('remembers granted and denied', () => {
    setConsent('granted')
    expect(getConsent()).toBe('granted')
    setConsent('denied')
    expect(getConsent()).toBe('denied')
  })

  test('null forgets the choice so the banner asks again', () => {
    setConsent('granted')
    setConsent(null)
    expect(getConsent()).toBeNull()
  })

  test('ignores garbage in storage', () => {
    localStorage.setItem('partybox_consent_v1', 'yes please')
    expect(getConsent()).toBeNull()
  })

  test('notifies subscribers on change and stops after unsubscribe', () => {
    const listener = jest.fn()
    const unsubscribe = subscribeConsent(listener)
    setConsent('granted')
    expect(listener).toHaveBeenCalledTimes(1)
    unsubscribe()
    setConsent('denied')
    expect(listener).toHaveBeenCalledTimes(1)
  })
})
