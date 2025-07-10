import Link from 'next/link';
import { Star } from 'lucide-react';

export default function Footer(){
  return (
    <footer className="bg-white py-16 border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-5 gap-8">
          <div>
            <div className="flex items-center space-x-2 mb-6">
              <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
                <span className="text-white font-bold text-xs">MS</span>
              </div>
              <div className="text-sm font-medium tracking-wider">
                <div>MAKISALA</div>
              </div>
            </div>
            <div className="space-y-2 text-sm text-gray-600">
              <p>info@makisala.com</p>
              <p>+255788323254</p>
            </div>
            <div className="mt-6">
              <div className="text-xs text-gray-500 mb-2">
                TrustScore 5.0 413 reviews
              </div>
              <div className="flex">
                {[...Array(5)].map((_, i) => (
                  <Star
                    key={i}
                    className="h-4 w-4 text-green-500 fill-current"
                  />
                ))}
              </div>
            </div>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              Travel Information
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900">
                  First Time to Africa
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Sustainability
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  The Wildebeest Migration
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  How much does a safari cost?
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Sitemap
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">About Us:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Why book with us?
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Our team
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Guest Reviews
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Guest Loyalty Programme
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Contact
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">
              Who is Travelling?
            </h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Couples and Honeymooners
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Family Safari
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Group of Friends
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Solo Travellers
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-medium text-gray-900 mb-4">Safaris:</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li>
                <Link href="#" className="hover:text-gray-900">
                  All Safaris
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Sample Safaris
                </Link>
              </li>
            
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Set Departure Safaris
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-gray-900">
                  Walking Safaris
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </footer>
  );
}