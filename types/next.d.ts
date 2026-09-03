// Minimal ambient type declarations for the `next` package and its
// built-in modules. These cover the surface used by the project and
// allow `tsc --noEmit` to succeed when the `next` package itself is
// not installed in `node_modules` (e.g. during a sandboxed type-check).
// They are NOT a substitute for the real types in production builds.

declare module "next" {
  export type Metadata = Record<string, unknown>;

  export type { AppRouterInstance } from "next/dist/shared/lib/router/router";
  const _default: unknown;
  export default _default;
}

declare module "next/server" {
  import type { IncomingMessage, ServerResponse } from "node:http";

  export interface NextRequest {
    url: string;
    method: string;
    headers: Headers;
    cookies: unknown;
    nextUrl: URL;
    geo?: Record<string, string | undefined>;
    ip?: string;
  }

  export class NextResponse extends Response {
    static redirect(
      url: string | URL,
      init?: number | ResponseInit
    ): NextResponse;
    static json(body: unknown, init?: ResponseInit): NextResponse;
    static next(init?: ResponseInit): NextResponse;
  }
}

declare module "next/navigation" {
  export function redirect(
    destination: string,
    init?: { status?: number }
  ): never;
  export function permanentRedirect(
    destination: string,
    init?: { status?: number }
  ): never;
  export function notFound(): never;
  export const usePathname: () => string;
  export const useSearchParams: () => URLSearchParams;
  export const useRouter: () => {
    push: (href: string) => void;
    replace: (href: string) => void;
    refresh: () => void;
    back: () => void;
    forward: () => void;
  };
}

declare module "next/link" {
  import type { AnchorHTMLAttributes, ReactNode } from "react";
  export type LinkProps = AnchorHTMLAttributes<HTMLAnchorElement> & {
    href: string;
    children?: ReactNode;
    replace?: boolean;
    scroll?: boolean;
    prefetch?: boolean;
  };
  export default function Link(props: LinkProps): unknown;
}

declare module "next/font/google" {
  export interface FontOptions {
    subsets?: string[];
    weight?: string | string[];
    style?: string | string[];
    display?: string;
    variable?: string;
  }
  export interface FontResult {
    className: string;
    variable: string;
    style: { fontFamily: string };
  }
  export function Geist(options?: FontOptions): FontResult;
  export function Geist_Mono(options?: FontOptions): FontResult;
  export function Inter(options?: FontOptions): FontResult;
  export function Roboto(options?: FontOptions): FontResult;
}
