'use client'
import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Button } from '@repo/ui/button'
import {
    NavigationMenu,
    NavigationMenuContent,
    NavigationMenuItem,
    NavigationMenuLink,
    NavigationMenuList,
    NavigationMenuTrigger,
} from '@repo/ui/navigation-menu'
import Link from 'next/link'
import { Sheet, SheetContent, SheetTrigger } from '@repo/ui/sheet'
import { about_us_nav, destinations, inspirations, safaris_nav as safaris } from '@/lib/constants'
import { InquiryDialog } from '../enquire-dialog-button'
import { articles_url } from '@/app/where-to-go/[month]/_components/data'
import { capitalize } from '@/lib/utils'
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@repo/ui/accordion'

export default function Nav() {
    const [mobileMenuOpen, setMobileMenuOpen] = useState(false)

    return (
        <nav className="fixed top-0 z-50 w-full border-b border-gray-100 bg-white/95 backdrop-blur-sm">
            <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
                <div className="flex h-16 items-center justify-between">
                    {/* Logo */}
                    <Link href="/">
                        <div className="flex items-center space-x-2 pl-10">
                            <div className="flex h-8 w-8 items-center justify-center gap-3 rounded-sm">
                                {/*<span className="text-white font-bold text-xs">MS</span>*/}
                                <img src="/makisala_icon.png" className="object-cover" />
                                <div className="text-sm font-medium tracking-wider">
                                    <div>MAKISALA</div>
                                </div>
                            </div>
                        </div>
                    </Link>

                    <section className="flex items-center space-x-4">
                        <div className="hidden lg:flex">
                            <NavigationMenu viewport={false} className="justify-start">
                                <NavigationMenuList className="space-x-6 justify-start">
                                    <NavigationMenuItem>
                                        <NavigationMenuTrigger className="bg-transparent text-sm font-medium hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                            DESTINATIONS
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <div className="grid w-[700px] gap-6 p-6 md:grid-cols-3">
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">
                                                        Popular Safaris
                                                    </h4>
                                                    {safaris.map(safari => (
                                                        <NavigationMenuLink
                                                            asChild
                                                            key={safari.name}
                                                        >
                                                            <Link
                                                                href={safari.page_url}
                                                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                                                            >
                                                                <div className="text-sm leading-none font-medium">
                                                                    {safari.name}
                                                                </div>
                                                                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
                                                                    {safari.description}
                                                                </p>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    ))}
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">
                                                        Top Destinations
                                                    </h4>
                                                    {destinations.top_destinations.map(dest => (
                                                        <NavigationMenuLink asChild key={dest.name}>
                                                            <Link
                                                                href={dest.page_url}
                                                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                                                            >
                                                                <div className="text-sm leading-none font-medium">
                                                                    {dest.name}
                                                                </div>
                                                                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
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
                                                    {destinations.east_africa.map(dest => (
                                                        <NavigationMenuLink asChild key={dest.name}>
                                                            <Link
                                                                href={dest.page_url}
                                                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                                                            >
                                                                <div className="text-sm leading-none font-medium">
                                                                    {dest.name}
                                                                </div>
                                                                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
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
                                        <NavigationMenuTrigger className="bg-transparent text-sm font-medium hover:bg-transparent data-[active]:bg-transparent data-[state=open]:bg-transparent">
                                            ABOUT US
                                        </NavigationMenuTrigger>
                                        <NavigationMenuContent>
                                            <div className="grid w-[500px] gap-6 p-6 md:grid-cols-2">
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">
                                                        Inspiration
                                                    </h4>
                                                    {inspirations.map(inspir => (
                                                        <NavigationMenuLink
                                                            asChild
                                                            key={inspir.name}
                                                        >
                                                            <Link
                                                                href={inspir.page_url}
                                                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block rounded-md px-3 leading-none no-underline transition-colors outline-none select-none"
                                                            >
                                                                <div className="text-sm leading-none font-medium">
                                                                    {inspir.name}
                                                                </div>
                                                            </Link>
                                                        </NavigationMenuLink>
                                                    ))}
                                                </div>
                                                <div className="space-y-3">
                                                    <h4 className="text-sm font-medium">
                                                        About Us
                                                    </h4>
                                                    {about_us_nav.map(item => (
                                                        <NavigationMenuLink asChild key={item.name}>
                                                            <Link
                                                                href={item.page_url}
                                                                className="hover:bg-accent hover:text-accent-foreground focus:bg-accent focus:text-accent-foreground block space-y-1 rounded-md p-3 leading-none no-underline transition-colors outline-none select-none"
                                                            >
                                                                <div className="text-sm leading-none font-medium">
                                                                    {item.name}
                                                                </div>
                                                                <p className="text-muted-foreground line-clamp-2 text-sm leading-snug">
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

                        <div className="flex items-center space-x-4">
                            <InquiryDialog>
                                <Button className="bg-primary hidden px-6 py-2 text-sm font-medium text-white md:block">
                                    GET A FREE QUOTE
                                </Button>
                            </InquiryDialog>

                            {/* Mobile menu button */}
                            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
                                <SheetTrigger asChild>
                                    <Button variant="ghost" size="icon" className="lg:hidden">
                                        <Menu className="h-6 w-6" />
                                    </Button>
                                </SheetTrigger>
                                <SheetContent side="right" className="w-[300px] sm:w-[400px]">
                                    <div className="mt-6 flex flex-col space-y-6">
                                        <div className="flex items-center space-x-2">
                                            <div className="flex h-8 w-8 items-center justify-center rounded-sm bg-black">
                                                <span className="text-xs font-bold text-white">
                                                    MS
                                                </span>
                                            </div>
                                            <div className="text-sm font-medium tracking-wider">
                                                <div>MAKISALA</div>
                                            </div>
                                        </div>

                                        <Accordion
                                            type="single"
                                            collapsible
                                            className="w-full"
                                            // defaultValue="item-1"
                                        >
                                            <AccordionItem value="Destinations">
                                                <AccordionTrigger>DESTINATIONS</AccordionTrigger>
                                                <AccordionContent className="flex flex-col gap-6 pl-5 text-balance">
                                                    <div className="flex flex-col gap-4">
                                                        <h5 className="text-xs font-semibold uppercase text-gray-500">
                                                            Popular Safaris
                                                        </h5>
                                                        {safaris.map(safari => (
                                                            <Link
                                                                href={safari.page_url}
                                                                key={safari.name}
                                                                onClick={() =>
                                                                    setMobileMenuOpen(false)
                                                                }
                                                                className="block hover:text-gray-900"
                                                            >
                                                                {safari.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <h5 className="text-xs font-semibold uppercase text-gray-500">
                                                            Top Destinations
                                                        </h5>
                                                        {destinations.top_destinations.map(dest => (
                                                            <Link
                                                                href={dest.page_url}
                                                                key={dest.name}
                                                                onClick={() =>
                                                                    setMobileMenuOpen(false)
                                                                }
                                                                className="block hover:text-gray-900"
                                                            >
                                                                {dest.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <h5 className="text-xs font-semibold uppercase text-gray-500">
                                                            Other Destinations
                                                        </h5>
                                                        {destinations.east_africa.map(dest => (
                                                            <Link
                                                                href={dest.page_url}
                                                                key={dest.name}
                                                                onClick={() =>
                                                                    setMobileMenuOpen(false)
                                                                }
                                                                className="block hover:text-gray-900"
                                                            >
                                                                {dest.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="Travel by month">
                                                <AccordionTrigger className="font-medium uppercase">
                                                    Travel by month
                                                </AccordionTrigger>
                                                <AccordionContent className="flex flex-col gap-4 pl-5 text-balance">
                                                    {articles_url.map((page, index) => (
                                                        <Link
                                                            href={`/where-to-go/${page.month}`}
                                                            key={index}
                                                            onClick={() => setMobileMenuOpen(false)}
                                                        >
                                                            <p>{capitalize(page.month)}</p>
                                                        </Link>
                                                    ))}
                                                </AccordionContent>
                                            </AccordionItem>
                                            <AccordionItem value="About us">
                                                <AccordionTrigger className="font-medium uppercase">
                                                    About us
                                                </AccordionTrigger>
                                                <AccordionContent className="flex flex-col gap-6 pl-5 text-balance">
                                                    <div className="flex flex-col gap-4">
                                                        <h5 className="text-xs font-semibold uppercase text-gray-500">
                                                            Inspiration
                                                        </h5>
                                                        {inspirations.map(inspiration => (
                                                            <Link
                                                                key={inspiration.name}
                                                                className="block hover:text-gray-900"
                                                                href={inspiration.page_url}
                                                                onClick={() =>
                                                                    setMobileMenuOpen(false)
                                                                }
                                                            >
                                                                {inspiration.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                    <div className="flex flex-col gap-4">
                                                        <h5 className="text-xs font-semibold uppercase text-gray-500">
                                                            About Us
                                                        </h5>
                                                        {about_us_nav.map((item, index) => (
                                                            <Link
                                                                href={item.page_url}
                                                                key={index}
                                                                onClick={() =>
                                                                    setMobileMenuOpen(false)
                                                                }
                                                                className="block hover:text-gray-900"
                                                            >
                                                                {item.name}
                                                            </Link>
                                                        ))}
                                                    </div>
                                                </AccordionContent>
                                            </AccordionItem>
                                        </Accordion>

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

                                        <div className="border-t pt-6">
                                            <InquiryDialog>
                                                <Button className="w-full bg-primary text-white">
                                                    GET A FREE QUOTE
                                                </Button>
                                            </InquiryDialog>
                                        </div>
                                    </div>
                                </SheetContent>
                            </Sheet>
                        </div>
                    </section>
                </div>
            </div>
        </nav>
    )
}
