import { useState } from "react";
import { Link, useLocation } from "wouter";
import { useAuth } from "@/lib/auth";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { getInitials } from "@/lib/utils";
import { useTheme } from "@/components/ui/theme-provider";
import { 
  Menu, 
  User, 
  LogOut, 
  Sun, 
  Moon
} from "lucide-react";

export function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const { user, logout } = useAuth();
  const [location] = useLocation();
  const { theme, setTheme } = useTheme();
  
  // Check if we're on a salesperson page (to hide certain elements)
  const isSalespersonPage = location.includes('/salesperson/') || location.includes('/nfc/');

  const toggleMenu = () => setIsMenuOpen(!isMenuOpen);

  return (
    <header className="bg-white dark:bg-card shadow-sm sticky top-0 z-50">
      <div className="container-custom">
        <div className="flex justify-between items-center py-4">
          <div className="flex items-center space-x-2">
            <Link href="/" className="text-primary text-xl font-bold flex items-center">
              <span className="mr-2 text-2xl">🏠</span>
              <span>ContractConnect</span>
            </Link>
          </div>

          {/* Desktop Navigation */}
          <div className="hidden md:flex items-center space-x-6">
            {!isSalespersonPage && (
              <>
                <Link href="/">
                  <Button variant="default">
                    Request a Quote
                  </Button>
                </Link>
    
                {user ? (
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="rounded-full">
                        <Avatar className="h-8 w-8">
                          <AvatarImage src={user.avatarUrl || ""} alt={user.fullName} />
                          <AvatarFallback>{getInitials(user.fullName)}</AvatarFallback>
                        </Avatar>
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <div className="px-4 py-2">
                        <p className="font-medium">{user.fullName}</p>
                        <p className="text-sm text-muted-foreground">{user.email}</p>
                      </div>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                        {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                        {theme === "light" ? "Dark Mode" : "Light Mode"}
                      </DropdownMenuItem>
                      <DropdownMenuSeparator />
                      <DropdownMenuItem onClick={() => logout()}>
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                ) : (
                  <>
                    <Link href="/login">
                      <Button variant="ghost">Log in</Button>
                    </Link>
                    <Link href="/register">
                      <Button variant="default">Sign up</Button>
                    </Link>
                  </>
                )}
              </>
            )}
            
            {/* Always show theme toggle on salesperson pages */}
            {isSalespersonPage && (
              <Button variant="ghost" size="icon" onClick={() => setTheme(theme === "light" ? "dark" : "light")}>
                {theme === "light" ? <Moon className="h-5 w-5" /> : <Sun className="h-5 w-5" />}
              </Button>
            )}
          </div>

          {/* Mobile Menu Button */}
          <Button 
            variant="ghost" 
            size="icon" 
            onClick={toggleMenu} 
            className="md:hidden text-foreground"
          >
            <Menu className="h-6 w-6" />
          </Button>
        </div>

        {/* Mobile Navigation */}
        {isMenuOpen && (
          <div className="md:hidden py-4 border-t">
            <div className="flex flex-col space-y-4">
              {!isSalespersonPage && (
                <>
                  <Link href="/">
                    <Button 
                      variant={location === "/" ? "default" : "ghost"} 
                      className="w-full justify-start"
                    >
                      Home
                    </Button>
                  </Link>
    
                  {user ? (
                    <>
                      <Link href={
                        user.role === "salesperson" ? "/sales-dashboard" :
                        user.role === "contractor" ? "/contractor-dashboard" :
                        user.role === "admin" ? "/admin-dashboard" : "/"
                      }>
                        <Button 
                          variant="ghost"
                          className="w-full justify-start"
                        >
                          Dashboard
                        </Button>
                      </Link>
    
                      <Button 
                        variant="ghost" 
                        className="w-full justify-start"
                        onClick={() => logout()}
                      >
                        <LogOut className="mr-2 h-4 w-4" />
                        <span>Log out</span>
                      </Button>
                    </>
                  ) : (
                    <>
                      <Link href="/login">
                        <Button variant="ghost" className="w-full justify-start">
                          Log in
                        </Button>
                      </Link>
                      <Link href="/register">
                        <Button variant="ghost" className="w-full justify-start">
                          Sign up
                        </Button>
                      </Link>
                    </>
                  )}
                </>
              )}
              
              {/* Always show theme toggle */}
              <Button 
                variant="ghost" 
                className="w-full justify-start"
                onClick={() => setTheme(theme === "light" ? "dark" : "light")}
              >
                {theme === "light" ? <Moon className="mr-2 h-4 w-4" /> : <Sun className="mr-2 h-4 w-4" />}
                {theme === "light" ? "Dark Mode" : "Light Mode"}
              </Button>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}