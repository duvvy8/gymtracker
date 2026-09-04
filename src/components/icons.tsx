import type { SVGProps } from 'react';

/**
 * Hand-drawn icon set.
 *
 * One grid (20 units), one stroke weight (1.6), butt caps and miter joins
 * throughout. The squared terminals are deliberate: they match the
 * rectangular language of the cards and controls rather than the rounded
 * terminals common to off-the-shelf icon libraries.
 */
type IconProps = SVGProps<SVGSVGElement> & { title?: string };

function Icon({ title, children, ...rest }: IconProps) {
  return (
    <svg
      viewBox="0 0 20 20"
      width="20"
      height="20"
      fill="none"
      stroke="currentColor"
      strokeWidth="1.6"
      strokeLinecap="butt"
      strokeLinejoin="miter"
      aria-hidden={title ? undefined : true}
      role={title ? 'img' : undefined}
      focusable="false"
      {...rest}
    >
      {title ? <title>{title}</title> : null}
      {children}
    </svg>
  );
}

export function IconToday(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 15.5a7 7 0 1 1 14 0" />
      <path d="M10 15.5V9" />
      <path d="M3 15.5h1.6M15.4 15.5H17" />
    </Icon>
  );
}

export function IconLog(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3" width="14" height="14" rx="1.5" />
      <path d="M10 6.6v6.8M6.6 10h6.8" />
    </Icon>
  );
}

export function IconHistory(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 17h14" />
      <path d="M6 17v-4.5M10 17V6M14 17v-7.5" />
    </Icon>
  );
}

export function IconSettings(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6.5h8M15 6.5h2" />
      <rect x="11" y="4.2" width="4" height="4.6" />
      <path d="M3 13.5h2M9 13.5h8" />
      <rect x="5" y="11.2" width="4" height="4.6" />
    </Icon>
  );
}

export function IconPrivacy(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="4" y="8.5" width="12" height="8.5" rx="1.2" />
      <path d="M7 8.5V6.4a3 3 0 0 1 6 0v2.1" />
      <path d="M10 11.6v2.4" />
    </Icon>
  );
}

export function IconBarcode(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 4v12M6 4v12M8.5 4v12M12 4v12M14.5 4v12M17 4v12" />
    </Icon>
  );
}

export function IconCamera(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3 6.8h3.2L7.6 4.6h4.8l1.4 2.2H17V16H3z" />
      <circle cx="10" cy="11.2" r="3" />
    </Icon>
  );
}

export function IconSearch(props: IconProps) {
  return (
    <Icon {...props}>
      <circle cx="8.8" cy="8.8" r="5" />
      <path d="M12.6 12.6 17 17" />
    </Icon>
  );
}

export function IconTrash(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.5 5.8h13" />
      <path d="M8 5.8V3.6h4v2.2" />
      <path d="M5.6 5.8 6.5 17h7l.9-11.2" />
    </Icon>
  );
}

export function IconEdit(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M13.4 3.3 16.7 6.6 7.3 16H4v-3.3z" />
      <path d="M11.6 5.1l3.3 3.3" />
    </Icon>
  );
}

export function IconClose(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M5 5l10 10M15 5 5 15" />
    </Icon>
  );
}

export function IconCheck(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M3.8 10.4 7.6 14.2 16.2 5.6" />
    </Icon>
  );
}

export function IconAlert(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3 18 16.6H2z" />
      <path d="M10 8v3.6" />
      <path d="M10 13.8v1.2" />
    </Icon>
  );
}

export function IconDownload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 3v9.4" />
      <path d="M6.2 8.8 10 12.6l3.8-3.8" />
      <path d="M3.4 16.4h13.2" />
    </Icon>
  );
}

export function IconUpload(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 12.6V3.2" />
      <path d="M6.2 7 10 3.2 13.8 7" />
      <path d="M3.4 16.4h13.2" />
    </Icon>
  );
}

export function IconScale(props: IconProps) {
  return (
    <Icon {...props}>
      <rect x="3" y="3.6" width="14" height="12.8" rx="1.5" />
      <path d="M6.6 12a3.4 3.4 0 0 1 6.8 0" />
      <path d="M10 12 8.2 8.8" />
    </Icon>
  );
}

export function IconChevronLeft(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M12.4 4 6.4 10l6 6" />
    </Icon>
  );
}

export function IconChevronRight(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M7.6 4 13.6 10l-6 6" />
    </Icon>
  );
}

export function IconPlus(props: IconProps) {
  return (
    <Icon {...props}>
      <path d="M10 4v12M4 10h12" />
    </Icon>
  );
}
