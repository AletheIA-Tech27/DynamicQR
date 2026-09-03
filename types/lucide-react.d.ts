// Ambient type declaration for the `lucide-react` package.
// The package does not ship its own .d.ts file in some releases, so we
// declare a permissive shape that satisfies the icon usage across the
// codebase. Each icon is a forward-ref component that accepts standard
// SVG props and renders an inline SVG.

declare module "lucide-react" {
  import type { SVGProps, ForwardRefExoticComponent, RefAttributes } from "react";

  type IconNode = readonly [string, readonly string[]][];

  interface LucideProps extends SVGProps<SVGSVGElement> {
    size?: string | number;
    color?: string;
    strokeWidth?: string | number;
    absoluteStrokeWidth?: boolean;
  }

  type LucideIcon = ForwardRefExoticComponent<
    LucideProps & RefAttributes<SVGSVGElement>
  >;

  // Icon factory — covers every icon imported across the project.
  // Using a function signature lets TypeScript accept any PascalCase name
  // (Plus, Edit, Eye, ExternalLink, Copy, LogOut, etc.) without us having
  // to enumerate them.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const icons: any;
  export const Plus: LucideIcon;
  export const Edit: LucideIcon;
  export const Eye: LucideIcon;
  export const ExternalLink: LucideIcon;
  export const Copy: LucideIcon;
  export const LogOut: LucideIcon;
  export const LogIn: LucideIcon;
  export const Mail: LucideIcon;
  export const Lock: LucideIcon;
  export const User: LucideIcon;
  export const Trash2: LucideIcon;
  export const Pause: LucideIcon;
  export const X: LucideIcon;
  export const Save: LucideIcon;
  export const QrCode: LucideIcon;
  export const Link: LucideIcon;
  export const Palette: LucideIcon;
  export const Image: LucideIcon;
  export const Check: LucideIcon;
  export const Download: LucideIcon;
  export const ArrowLeft: LucideIcon;
  export const AlertCircle: LucideIcon;
  export const BarChart3: LucideIcon;
  export const Loader2: LucideIcon;
  export const Spinner: LucideIcon;
}
