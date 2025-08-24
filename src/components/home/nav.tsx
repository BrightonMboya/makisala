"use client";
import {useState} from "react";
import {Menu,} from "lucide-react";
import {Button} from "@/components/ui/button";
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from "@/components/ui/navigation-menu";
import Link from "next/link";
import {Sheet, SheetContent, SheetTrigger} from "@/components/ui/sheet";
import {safaris_nav as safaris, experiences, destinations, inspirations, about_us_nav} from "@/lib/constants";
import {InquiryDialog} from "@/components/enquire-dialog-button";

export default function Nav() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

    return (
        <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="flex justify-between items-center h-16">
                    {/* Logo */}
                    <Link href="/">
                        <div className="flex items-center space-x-2 pl-10">
                            <div className="w-8 h-8 rounded-sm flex items-center justify-center gap-3">
                                {/*<span className="text-white font-bold text-xs">MS</span>*/}
                                <img src="/makisala_icon.png" className="object-cover"/>
                                <div className="text-sm font-medium tracking-wider">
                                    <div>MAKISALA</div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    {/* Desktop Navigation */}
                    <div className="hidden lg:flex ">
                        <NavigationMenu viewport={false}>
                            <NavigationMenuList className="space-x-6">
                                <NavigationMenuItem>
                                    <NavigationMenuTrigger
                                        className="text-sm font-medium bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                        SAFARIS
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="w-[500px] gap-3 p-6">
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium">Popular Safaris</h4>
                                                {safaris.map((safari) => (
                                                    <NavigationMenuLink asChild key={safari.name}>
                                                        <Link
                                                            href={safari.page_url}
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                            <div className="text-sm font-medium leading-none">
                                                                {safari.name}
                                                            </div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                {safari.description}
                                                            </p>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                <NavigationMenuItem>
                                    <NavigationMenuTrigger
                                        className="text-sm font-medium bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                        DESTINATIONS
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="grid w-[500px] gap-3 p-6 md:grid-cols-2">
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium">
                                                    Top Destinations
                                                </h4>
                                                {destinations.top_destinations.map((dest) => (
                                                    <NavigationMenuLink asChild key={dest.name}>
                                                        <Link
                                                            href={dest.page_url}
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                            <div className="text-sm font-medium leading-none">
                                                                {dest.name}
                                                            </div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                {dest.description}
                                                            </p>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                            <div className="space-y-3">
                                                <h4 className="text-sm font-medium">
                                                    Other Destinations
                                                </h4>
                                                {destinations.east_africa.map((dest) => (
                                                    <NavigationMenuLink asChild key={dest.name}>
                                                        <Link
                                                            href={dest.page_url}
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                            <div className="text-sm font-medium leading-none">
                                                                {dest.name}
                                                            </div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                {dest.description}
                                                            </p>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                {/*<NavigationMenuItem>*/}
                                {/*    <NavigationMenuTrigger*/}
                                {/*        className="text-sm font-medium bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">*/}
                                {/*        EXPERIENCES*/}
                                {/*    </NavigationMenuTrigger>*/}
                                {/*    <NavigationMenuContent>*/}
                                {/*        <div className="w-[400px] gap-3 p-6">*/}
                                {/*            <div className="space-y-3">*/}
                                {/*                {experiences.map((experience) => (*/}
                                {/*                    <NavigationMenuLink asChild key={experience.name}>*/}
                                {/*                        <Link*/}
                                {/*                            href="#"*/}
                                {/*                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">*/}
                                {/*                            <div className="text-sm font-medium leading-none">*/}
                                {/*                                {experience.name}*/}
                                {/*                            </div>*/}
                                {/*                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">*/}
                                {/*                                {experience.description}*/}
                                {/*                            </p>*/}
                                {/*                        </Link>*/}
                                {/*                    </NavigationMenuLink>*/}
                                {/*                ))}*/}
                                {/*            </div>*/}
                                {/*        </div>*/}
                                {/*    </NavigationMenuContent>*/}
                                {/*</NavigationMenuItem>*/}

                                <NavigationMenuItem>
                                    <NavigationMenuTrigger
                                        className="text-sm font-medium bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                        INSPIRATION
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="w-[400px] gap-3 p-6">
                                            <div className="space-y-3">
                                                {inspirations.map((inspir) => (
                                                    <NavigationMenuLink asChild key={inspir.name}>
                                                        <Link
                                                            href={inspir.page_url}
                                                            className="block select-none rounded-md px-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                            <div className="text-sm font-medium leading-none">
                                                                {inspir.name}
                                                            </div>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>

                                <NavigationMenuItem>
                                    <NavigationMenuTrigger
                                        className="text-sm font-medium bg-transparent hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                        ABOUT US
                                    </NavigationMenuTrigger>
                                    <NavigationMenuContent>
                                        <div className="w-[400px] gap-3 p-6">
                                            <div className="space-y-3">
                                                {about_us_nav.map((item) => (
                                                    <NavigationMenuLink asChild key={item.name}>
                                                        <Link
                                                            href={item.page_url}
                                                            className="block select-none space-y-1 rounded-md p-3 leading-none no-underline outline-none transition-colors hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground">
                                                            <div className="text-sm font-medium leading-none">
                                                                {item.name}
                                                            </div>
                                                            <p className="line-clamp-2 text-sm leading-snug text-muted-foreground">
                                                                {item.description}
                                                            </p>
                                                        </Link>
                                                    </NavigationMenuLink>
                                                ))}
                                            </div>
                                        </div>
                                    </NavigationMenuContent>
                                </NavigationMenuItem>
                            </NavigationMenuList>
                        </NavigationMenu>
                    </div>

                    {/* Right side items */}
                    <div className="flex items-center space-x-4">
                        <InquiryDialog>
                            <Button className="bg-primary text-white px-6 py-2 text-sm font-medium hidden md:block">
                                START PLANNING
                            </Button>
                        </InquiryDialog>

                        {/* Mobile menu button */}
                        <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                            <SheetTrigger asChild>
                                <Button variant="ghost" size="icon" className="lg:hidden">
                                    <Menu className="h-6 w-6"/>
                                </Button>
                            </SheetTrigger>
                            <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                <div className="flex flex-col space-y-6 mt-6">
                                    <div className="flex items-center space-x-2">
                                        <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                                            <span className="text-white font-bold text-xs">MS</span>
                                        </div>
                                        <div className="text-sm font-medium tracking-wider">
                                            <div>MAKISALA</div>
                                        </div>
                                    </div>

                                    <div className="space-y-4">
                                        <div className="space-y-2">
                                            <h3 className="font-medium">SAFARIS</h3>
                                            <div className="pl-4 space-y-2 text-sm text-gray-600">
                                                {safaris.map((safari) => (
                                                    <Link
                                                        href={safari.page_url}
                                                        key={safari.name}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block hover:text-gray-900">
                                                        {safari.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        <div className="space-y-2">
                                            <h3 className="font-medium">DESTINATIONS</h3>
                                            <div className="pl-4 space-y-2 text-sm text-gray-600">
                                                {destinations.top_destinations.map((dest) => (
                                                    <Link
                                                        href={dest.page_url}
                                                        key={dest.name}
                                                        onClick={() => setMobileMenuOpen(false)}
                                                        className="block hover:text-gray-900">
                                                        {dest.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>

                                        {/*<div className="space-y-2">*/}
                                        {/*    <h3 className="font-medium">EXPERIENCES</h3>*/}
                                        {/*    <div className="pl-4 space-y-2 text-sm text-gray-600">*/}
                                        {/*        {experiences.map((experience) => (*/}
                                        {/*            <Link*/}
                                        {/*                href="#"*/}
                                        {/*                key={experience.name}*/}
                                        {/*                className="block hover:text-gray-900">*/}
                                        {/*                {experience.name}*/}
                                        {/*            </Link>*/}
                                        {/*        ))}*/}
                                        {/*    </div>*/}
                                        {/*</div>*/}

                                        <div className="space-y-2">
                                            <h3 className="font-medium">INSPIRATIONS</h3>
                                            <div className="pl-4 space-y-2 text-sm text-gray-600">
                                                {inspirations.map((inspiration) => (
                                                    <Link key={inspiration.name} className="block hover:text-gray-900"
                                                          href={inspiration.page_url}
                                                          onClick={() => setMobileMenuOpen(false)}
                                                    >
                                                        {inspiration.name}
                                                    </Link>
                                                ))}
                                            </div>
                                        </div>
                                        <Link href="/about" className="font-medium">
                                            ABOUT US
                                        </Link>
                                    </div>

                                    <div className="pt-6 border-t">
                                        <InquiryDialog>
                                            <Button className="w-full bg-black text-white">
                                                START PLANNING
                                            </Button>
                                        </InquiryDialog>
                                    </div>
                                </div>
                            </SheetContent>
                        </Sheet>
                    </div>
                </div>
            </div>
        </nav>
    );
}
