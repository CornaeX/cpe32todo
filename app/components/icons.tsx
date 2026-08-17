import React from "react";

export type IconProps = React.SVGProps<SVGSVGElement>;

const base = {
  width: 20,
  height: 20,
  viewBox: "0 0 24 24",
  fill: "none",
  stroke: "currentColor",
  strokeWidth: 1.8,
  strokeLinecap: "round" as const,
  strokeLinejoin: "round" as const,
};

export const MenuIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 6h16M4 12h16M4 18h16" />
  </svg>
);

export const CloseIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 6l12 12M18 6L6 18" />
  </svg>
);

export const PlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M12 5v14M5 12h14" />
  </svg>
);

export const ChevronRightIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 6l6 6-6 6" />
  </svg>
);

export const ChevronLeftIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M15 6l-6 6 6 6" />
  </svg>
);

export const ChevronDownIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M6 9l6 6 6-6" />
  </svg>
);

export const ImageIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3" y="4" width="18" height="16" rx="2.5" />
    <circle cx="8.5" cy="9.5" r="1.5" />
    <path d="M21 15.5l-5.2-5.2a2 2 0 00-2.8 0L4 19" />
  </svg>
);

export const TrashIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M4 7h16M9 7V5a1 1 0 011-1h4a1 1 0 011 1v2m2 0l-.8 12.1a2 2 0 01-2 1.9H8.8a2 2 0 01-2-1.9L6 7h12z" />
    <path d="M10 11v6M14 11v6" />
  </svg>
);

export const LogOutIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M9 21H6a2 2 0 01-2-2V5a2 2 0 012-2h3" />
    <path d="M16 17l5-5-5-5M21 12H9" />
  </svg>
);

export const CheckIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M5 13l4 4L19 7" />
  </svg>
);

export const SpinnerIcon = (props: IconProps) => (
  <svg {...base} viewBox="0 0 24 24" className={`animate-spin ${props.className ?? ""}`} {...props}>
    <circle cx="12" cy="12" r="9" strokeOpacity="0.25" />
    <path d="M21 12a9 9 0 00-9-9" />
  </svg>
);

export const CalendarPlusIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="3.5" y="5" width="17" height="16" rx="2.5" />
    <path d="M3.5 10h17M8 3v4M16 3v4M12 13.5v5M9.5 16h5" />
  </svg>
);

export const ClipboardIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <rect x="6" y="4" width="12" height="17" rx="2" />
    <path d="M9 4V3a1 1 0 011-1h4a1 1 0 011 1v1" />
    <path d="M9 11h6M9 15h6" />
  </svg>
);

export const SunIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="12" r="4" />
    <path d="M12 2v2.2M12 19.8V22M4.93 4.93l1.55 1.55M17.52 17.52l1.55 1.55M2 12h2.2M19.8 12H22M4.93 19.07l1.55-1.55M17.52 6.48l1.55-1.55" />
  </svg>
);

export const MoonIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <path d="M21 12.79A9 9 0 1111.21 3a7.2 7.2 0 009.79 9.79z" />
  </svg>
);

export const GripIcon = (props: IconProps) => (
  <svg {...base} fill="currentColor" stroke="none" {...props}>
    <circle cx="9" cy="6" r="1.4" />
    <circle cx="9" cy="12" r="1.4" />
    <circle cx="9" cy="18" r="1.4" />
    <circle cx="15" cy="6" r="1.4" />
    <circle cx="15" cy="12" r="1.4" />
    <circle cx="15" cy="18" r="1.4" />
  </svg>
);

export const UserIcon = (props: IconProps) => (
  <svg {...base} {...props}>
    <circle cx="12" cy="8" r="3.5" />
    <path d="M4.5 20a7.5 7.5 0 0115 0" />
  </svg>
);
