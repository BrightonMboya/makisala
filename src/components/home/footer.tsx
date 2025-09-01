import Link from 'next/link';

export default function Footer() {
    return (
        <footer className="bg-white py-16 border-t border-gray-200">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <div className="grid md:grid-cols-5 gap-8">
                    <div>
                        <div className="flex items-center space-x-2 mb-6">
                            <div className="w-8 h-8 rounded-sm flex items-center justify-center">
                                <img src="/makisala_icon.png" className="object-cover"/>
                            </div>
                            <div className="text-sm font-medium tracking-wider">
                                <div>MAKISALA</div>
                            </div>
                        </div>
                        <div className="text-sm text-gray-600 mt-2">
                            <Link href="mailto:info@makisala.com">info@makisala.com</Link>
                            <p>+255788323254</p>
                        </div>
                        <div className="flex space-x-3 mt-2 text-gray-600">
                            <Link href="https://www.instagram.com/makisala_?igsh=d3J5eTBwdjZqN3h1&utm_source=qr">
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                     className="bi bi-instagram" viewBox="0 0 20 20">
                                    <path
                                        d="M8 0C5.829 0 5.556.01 4.703.048 3.85.088 3.269.222 2.76.42a3.9 3.9 0 0 0-1.417.923A3.9 3.9 0 0 0 .42 2.76C.222 3.268.087 3.85.048 4.7.01 5.555 0 5.827 0 8.001c0 2.172.01 2.444.048 3.297.04.852.174 1.433.372 1.942.205.526.478.972.923 1.417.444.445.89.719 1.416.923.51.198 1.09.333 1.942.372C5.555 15.99 5.827 16 8 16s2.444-.01 3.298-.048c.851-.04 1.434-.174 1.943-.372a3.9 3.9 0 0 0 1.416-.923c.445-.445.718-.891.923-1.417.197-.509.332-1.09.372-1.942C15.99 10.445 16 10.173 16 8s-.01-2.445-.048-3.299c-.04-.851-.175-1.433-.372-1.941a3.9 3.9 0 0 0-.923-1.417A3.9 3.9 0 0 0 13.24.42c-.51-.198-1.092-.333-1.943-.372C10.443.01 10.172 0 7.998 0zm-.717 1.442h.718c2.136 0 2.389.007 3.232.046.78.035 1.204.166 1.486.275.373.145.64.319.92.599s.453.546.598.92c.11.281.24.705.275 1.485.039.843.047 1.096.047 3.231s-.008 2.389-.047 3.232c-.035.78-.166 1.203-.275 1.485a2.5 2.5 0 0 1-.599.919c-.28.28-.546.453-.92.598-.28.11-.704.24-1.485.276-.843.038-1.096.047-3.232.047s-2.39-.009-3.233-.047c-.78-.036-1.203-.166-1.485-.276a2.5 2.5 0 0 1-.92-.598 2.5 2.5 0 0 1-.6-.92c-.109-.281-.24-.705-.275-1.485-.038-.843-.046-1.096-.046-3.233s.008-2.388.046-3.231c.036-.78.166-1.204.276-1.486.145-.373.319-.64.599-.92s.546-.453.92-.598c.282-.11.705-.24 1.485-.276.738-.034 1.024-.044 2.515-.045zm4.988 1.328a.96.96 0 1 0 0 1.92.96.96 0 0 0 0-1.92m-4.27 1.122a4.109 4.109 0 1 0 0 8.217 4.109 4.109 0 0 0 0-8.217m0 1.441a2.667 2.667 0 1 1 0 5.334 2.667 2.667 0 0 1 0-5.334"/>
                                </svg>
                            </Link>
                            <Link href="https://www.facebook.com/makisalasafaris">
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                     className="bi bi-facebook" viewBox="0 0 20 20">
                                    <path
                                        d="M16 8.049c0-4.446-3.582-8.05-8-8.05C3.58 0-.002 3.603-.002 8.05c0 4.017 2.926 7.347 6.75 7.951v-5.625h-2.03V8.05H6.75V6.275c0-2.017 1.195-3.131 3.022-3.131.876 0 1.791.157 1.791.157v1.98h-1.009c-.993 0-1.303.621-1.303 1.258v1.51h2.218l-.354 2.326H9.25V16c3.824-.604 6.75-3.934 6.75-7.951"/>
                                </svg>
                            </Link>
                            <Link href="https://www.tiktok.com/@makisala3?_t=ZM-8z3nw4OHwSG&_r=1">
                                <svg xmlns="http://www.w3.org/2000/svg" width="25" height="25" fill="currentColor"
                                     className="bi bi-tiktok" viewBox="0 0 20 20">
                                    <path
                                        d="M9 0h1.98c.144.715.54 1.617 1.235 2.512C12.895 3.389 13.797 4 15 4v2c-1.753 0-3.07-.814-4-1.829V11a5 5 0 1 1-5-5v2a3 3 0 1 0 3 3z"/>
                                </svg>
                            </Link>
                        </div>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                            Travel Information
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link href="/blog/what-to-pack-african-safari" className="hover:text-gray-900">
                                    First Time to Africa
                                </Link>
                            </li>
                            {/*<li>*/}
                            {/*    <Link href="#" className="hover:text-gray-900">*/}
                            {/*        Sustainability*/}
                            {/*    </Link>*/}
                            {/*</li>*/}
                            <li>
                                <Link href="/to_book/migration-tracker-safari-tz-ke" className="hover:text-gray-900">
                                    The Wildebeest Migration
                                </Link>
                            </li>
                            <li>
                                <Link href="/sitemap.xml" className="hover:text-gray-900">
                                    Sitemap
                                </Link>
                            </li>
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                            Safaris by country
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link href="/safaris/tanzania" className="hover:text-gray-900">
                                    Tanzania Safaris
                                </Link>
                                <Link href="/safaris/tanzania" className="hover:text-gray-900">
                                    Visit Zanzibar
                                </Link>
                            </li>

                        </ul>
                    </div>

                    {/*<div>*/}
                    {/*    <h4 className="font-medium text-gray-900 mb-4">About Us:</h4>*/}
                    {/*    <ul className="space-y-2 text-sm text-gray-600">*/}
                    {/*        <li>*/}
                    {/*            <Link href="/about" className="hover:text-gray-900">*/}
                    {/*                Why book with us?*/}
                    {/*            </Link>*/}
                    {/*        </li>*/}
                    {/*        <li>*/}
                    {/*            <Link href="#" className="hover:text-gray-900">*/}
                    {/*                Our team*/}
                    {/*            </Link>*/}
                    {/*        </li>*/}
                    {/*        <li>*/}
                    {/*            <Link href="#" className="hover:text-gray-900">*/}
                    {/*                Guest Reviews*/}
                    {/*            </Link>*/}
                    {/*        </li>*/}
                    {/*        <li>*/}
                    {/*            <Link href="#" className="hover:text-gray-900">*/}
                    {/*                Guest Loyalty Programme*/}
                    {/*            </Link>*/}
                    {/*        </li>*/}
                    {/*        <li>*/}
                    {/*            <Link href="/contact" className="hover:text-gray-900">*/}
                    {/*                Contact*/}
                    {/*            </Link>*/}
                    {/*        </li>*/}
                    {/*    </ul>*/}
                    {/*</div>*/}

                    <div>
                        <h4 className="font-medium text-gray-900 mb-4">
                            Who is Travelling?
                        </h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link href="/who-is-travelling/couples-and-honeymooners"
                                      className="hover:text-gray-900">
                                    Couples and Honeymooners
                                </Link>
                            </li>
                            <li>
                                <Link href="/who-is-travelling/family-safari" className="hover:text-gray-900">
                                    Family Safari
                                </Link>
                            </li>
                            {/*<li>*/}
                            {/*    <Link href="#" className="hover:text-gray-900">*/}
                            {/*        Group of Friends*/}
                            {/*    </Link>*/}
                            {/*</li>*/}
                            {/*<li>*/}
                            {/*    <Link href="#" className="hover:text-gray-900">*/}
                            {/*        Solo Travellers*/}
                            {/*    </Link>*/}
                            {/*</li>*/}
                        </ul>
                    </div>

                    <div>
                        <h4 className="font-medium text-gray-900 mb-4">Safaris:</h4>
                        <ul className="space-y-2 text-sm text-gray-600">
                            <li>
                                <Link href="/location/kilimanjaro" className="hover:text-gray-900">
                                    Trekking Safaris
                                </Link>
                            </li>
                            <li>
                                <Link href="/to_book/northern-tanzania-safari" className="hover:text-gray-900">
                                    Classic Safaris
                                </Link>
                            </li>

                            <li>
                                <Link href="/location/rwanda" className="hover:text-gray-900">
                                    Gorilla Trekking
                                </Link>
                            </li>
                            <li>
                                <Link href="/location/zanzibar" className="hover:text-gray-900">
                                    Beach Safaris
                                </Link>
                            </li>
                        </ul>
                    </div>
                </div>
            </div>
        </footer>
    );
}