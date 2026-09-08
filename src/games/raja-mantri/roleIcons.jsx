import { CrownIcon } from '../../components/gameIcons'
export { CrownIcon }

export function ScrollIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M6 4h9a3 3 0 013 3v1H9a3 3 0 00-3 3v10a3 3 0 01-3-3V7a3 3 0 013-3z" />
      <path d="M18 8v9a3 3 0 01-3 3H6" />
      <path d="M9 12h6M9 15h6" />
    </svg>
  )
}

export function MaskIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M3 9c3-3 15-3 18 0-1 7-5 11-9 11S4 16 3 9z" />
      <circle cx="8.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
      <circle cx="15.5" cy="10.5" r="1.2" fill="currentColor" stroke="none" />
    </svg>
  )
}

export function ShieldIcon(props) {
  return (
    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" {...props}>
      <path d="M12 3l7 3v6c0 4.5-3 7.5-7 9-4-1.5-7-4.5-7-9V6l7-3z" />
      <path d="M9 12l2 2 4-4" />
    </svg>
  )
}

export const ROLE_ICON_COMPONENTS = {
  raja: CrownIcon,
  mantri: ScrollIcon,
  chor: MaskIcon,
  sipahi: ShieldIcon,
}

const ROLE_KEY_SUFFIX = { raja: 'Raja', mantri: 'Mantri', chor: 'Chor', sipahi: 'Sipahi' }

export function roleLabel(role, t) {
  const suffix = ROLE_KEY_SUFFIX[role]
  return suffix ? t(`role${suffix}`) : role
}

export function roleDescription(role, t) {
  const suffix = ROLE_KEY_SUFFIX[role]
  return suffix ? t(`roleDesc${suffix}`) : ''
}
