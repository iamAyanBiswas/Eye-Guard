import Link from "next/link"
import { ModeToggle } from "@/components/toggle-theme"
import { createClient } from "@/utils/supabase/server"
import { signout } from "@/app/login/actions"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Eye } from "lucide-react"

export default async function Navbar() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()

  return (
    <nav className="border-b sticky top-0 z-50 bg-background/95 backdrop-blur supports-backdrop-filter:bg-background/60">
      <div className="flex h-20 items-center px-4 max-w-screen-2xl mx-auto">
        <Link href="/" className="mr-6 flex items-center space-x-2">
          <div className="flex size-10 items-center justify-center rounded-xl bg-primary/10">
            <Eye className="size-5 text-primary" />
          </div>
          <div>
            <h1 className="font-heading text-xl font-bold tracking-tight">
              EyeGuard
            </h1>
            <p className="text-xs text-muted-foreground">
              Eye Strain Detection System
            </p>
          </div>
        </Link>

        {/* Only show these links if the user is logged in */}
        {/* {user && (
          <div className="flex flex-1 items-center space-x-4 text-sm font-medium">
            <Link href="/" className="transition-colors hover:text-foreground/80 text-foreground">
              Home
            </Link>
            <Link href="/live-session" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Live-Session
            </Link>
            <Link href="/session" className="transition-colors hover:text-foreground/80 text-foreground/60">
              Session
            </Link>
          </div>
        )} */}

        <div className="flex flex-1 items-center justify-end space-x-4 ml-auto">
          <ModeToggle />
          {user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" className="relative h-8 w-8 rounded-full">
                  <Avatar className="h-8 w-8">
                    <AvatarImage src="" alt={user.email || "User"} />
                    <AvatarFallback>{user.email?.charAt(0).toUpperCase() || "U"}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="w-56" align="end" forceMount>
                <DropdownMenuLabel className="font-normal">
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">Account</p>
                    <p className="text-xs leading-none text-muted-foreground">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <Link href="/settings">Settings</Link>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild>
                  <form action={signout} className="w-full">
                    <button type="submit" className="w-full text-left">
                      Log out
                    </button>
                  </form>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <div className="flex items-center space-x-2">
              <Link href="/login">
                <Button variant="ghost">Sign In</Button>
              </Link>
              <Link href="/signup">
                <Button>Sign Up</Button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  )
}
