import Link from "next/link";
import { ThemeToggle } from "./ThemeToggle";

export function Nav() {
  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between px-4">
        <Link href="/" className="text-lg font-semibold tracking-tight">
          OwnCo
        </Link>
        <nav className="flex items-center gap-6">
          <Link href="/calculator" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Calculator
          </Link>
          <Link href="/pricing" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            Pricing
          </Link>
          <Link href="/about" className="text-sm text-muted-foreground hover:text-foreground transition-colors">
            About
          </Link>
          <ThemeToggle />
        </nav>
      </div>
    </header>
  );
}
