/** Merge class names (install clsx + tailwind-merge when adding shadcn components) */
export function cn(...classes: (string | undefined | null | boolean)[]): string {
  return classes.filter(Boolean).join(' ');
}
