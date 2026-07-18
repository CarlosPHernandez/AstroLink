/** Inline SVG paths for public-route icons — avoids font FOUT on first paint. */
const SVG_PATHS: Record<string, string> = {
  arrow_back:
    'M20 11H7.83l5.58-5.59L12 4l-8 8 8 8 1.41-1.41L7.83 13H20v-2z',
  arrow_downward: 'M20 12l-1.41-1.41L13 16.17V4h-2v12.17l-5.58-5.59L4 12l8 8 8-8z',
  arrow_forward:
    'M12 4l-1.41 1.41L16.17 11H4v2h12.17l-5.58 5.59L12 20l8-8-8-8z',
  auto_awesome:
    'm19 9 1.25-2.75L23 5l-2.75-1.25L19 1l-1.25 2.75L15 5l2.75 1.25L19 9zm-7.5.5L9 4 6.5 9.5 1 12l5.5 2.5L9 20l2.5-5.5L17 12l-5.5-2.5zM19 15l-1.25 2.75L15 19l2.75 1.25L19 23l1.25-2.75L23 19l-2.75-1.25L19 15z',
  call: 'M20.01 15.38c-1.23 0-2.42-.2-3.53-.56a.977.977 0 0 0-1.01.24l-1.57 1.97c-2.83-1.35-5.48-3.9-6.89-6.83l1.95-1.66c.27-.28.35-.67.24-1.02-.37-1.11-.56-2.3-.56-3.53 0-.54-.45-.99-.99-.99H4.19C3.65 3 3 3.24 3 3.99 3 13.28 10.73 21 20.01 21c.71 0 .99-.63.99-1.01v-3.61c0-.54-.45-.99-.99-.99z',
  cancel:
    'M12 2C6.47 2 2 6.47 2 12s4.47 10 10 10 10-4.47 10-10S17.53 2 12 2zm5 13.59L15.59 17 12 13.41 8.41 17 7 15.59 10.59 12 7 8.41 8.41 7 12 10.59 15.59 7 17 8.41 13.41 12 17 15.59z',
  chat_bubble:
    'M20 2H4c-1.1 0-2 .9-2 2v18l4-4h14c1.1 0 2-.9 2-2V4c0-1.1-.9-2-2-2zm0 14H6l-2 2V4h16v12z',
  check_circle:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z',
  close:
    'M19 6.41 17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z',
  expand_less: 'M12 8l-6 6 1.41 1.41L12 10.83l4.59 4.58L18 14l-6-6z',
  expand_more: 'M16.59 8.59 12 13.17 7.41 8.59 6 10l6 6 6-6-1.41-1.41z',
  lock:
    'M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1s3.1 1.39 3.1 3.1v2z',
  menu: 'M3 18h18v-2H3v2zm0-5h18v-2H3v2zm0-7v2h18V6H3z',
  person:
    'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z',
  play_arrow: 'M8 5v14l11-7L8 5z',
  play_circle:
    'M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 14.5v-9l6 4.5-6 4.5z',
  rocket_launch:
    'M9.19 6.35c-2.67 2.25-4 5.92-4 8.48V18h3.29c2.58 0 6.14-1.36 8.41-4.05l.29-.34 1.42 1.42-.29.34c-2.52 2.93-6.03 4.68-9.83 4.68H5v-3.17c0-2.46 1.49-6.44 4.47-9.05l.34-.29-1.42-1.42-.34.29zM11.5 2 9.91 3.59l1.42 1.42L12 3.34l.67.67 1.42-1.42L12.5 2h-1zm5.09 1.59L15 2l1.59 1.59-1.42 1.42L13.59 4l1.42-1.41zm-8.18 0L5.41 4 6.83 5.41 5.41 6.83 4 5.41 5.41 4zM12 7.5c-2.49 0-4.5 2.01-4.5 4.5s2.01 4.5 4.5 4.5 4.5-2.01 4.5-4.5-2.01-4.5-4.5-4.5z',
  satellite_alt:
    'M4 6c-1.1 0-2 .9-2 2v4c0 1.1.9 2 2 2h1v4c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2v-4h1c1.1 0 2-.9 2-2V8c0-1.1-.9-2-2-2H4zm15 8h-4v4H9v-4H5V8h14v6z',
  shield:
    'M12 1 3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 10.99h7c-.53 4.12-3.28 7.79-7 8.94V12H5V6.3l7-3.11v8.8z',
  verified:
    'M23 12l-2.44-2.79.34-3.69-3.61-.82-1.89-3.2L12 2.96 8.6 1.5 6.71 4.69 3.1 5.51l.34 3.7L1 12l2.44 2.79-.34 3.7 3.61.82L8.6 22.5l3.4-1.47 3.4 1.46 1.89-3.19 3.61-.82-.34-3.69L23 12zm-12.91 4.72-3.2-3.2 1.41-1.41 1.79 1.79 4.59-4.59 1.41 1.41-6 6z',
  videocam:
    'M17 10.5V7c0-.55-.45-1-1-1H4c-.55 0-1 .45-1 1v10c0 .55.45 1 1 1h12c.55 0 1-.45 1-1v-3.5l4 4v-11l-4 4z',
  volume_off:
    'M16.5 12c0-1.77-1.02-3.29-2.5-4.03v2.21l2.45 2.45c.03-.2.05-.41.05-.63zm2.5 0c0 .94-.2 1.82-.54 2.64l1.51 1.51C20.63 14.91 21 13.5 21 12c0-4.28-2.99-7.86-7-8.77v2.06c2.89.86 5 3.54 5 6.71zM4.27 3 3 4.27 7.73 9H3v6h4l5 5v-6.73l4.25 4.25c-.67.52-1.42.93-2.25 1.18v2.06c1.38-.31 2.63-.95 3.69-1.81L19.73 21 21 19.73l-9-9L4.27 3zM12 4 9.91 6.09 12 8.18V4z',
  volume_up:
    'M3 9v6h4l5 5V4L7 9H3zm13.5 3c0-1.77-1.02-3.29-2.5-4.03v8.05c1.48-.73 2.5-2.25 2.5-4.02zM14 3.23v2.06c2.89.86 5 3.54 5 6.71s-2.11 5.85-5 6.71v2.06c4.01-.91 7-4.49 7-8.77s-2.99-7.86-7-8.77z',
};

export type MaterialIconName = keyof typeof SVG_PATHS;

export function hasMaterialIconSvg(name: string): name is MaterialIconName {
  return name in SVG_PATHS;
}

type MaterialIconProps = {
  name: string;
  className?: string;
  size?: number;
  /** Filled variant (play_circle, check_circle, etc.) */
  fill?: boolean;
  'aria-hidden'?: boolean;
  'aria-label'?: string;
};

export function MaterialIcon({
  name,
  className = '',
  size,
  fill = false,
  'aria-hidden': ariaHidden = true,
  'aria-label': ariaLabel,
}: MaterialIconProps) {
  const path = SVG_PATHS[name];

  if (path) {
    const dimension = size ?? 24;
    return (
      <svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="0 0 24 24"
        width={dimension}
        height={dimension}
        fill="currentColor"
        className={`inline-block shrink-0 ${className}`}
        aria-hidden={ariaHidden}
        aria-label={ariaLabel}
      >
        <path d={path} />
      </svg>
    );
  }

  return (
    <span
      className={`material-symbols-outlined inline-block ${fill ? 'material-symbols-filled' : ''} ${className}`}
      style={size ? { fontSize: size } : undefined}
      aria-hidden={ariaHidden}
      aria-label={ariaLabel}
    >
      {name}
    </span>
  );
}