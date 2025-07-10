import { ChevronDown, Search } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function Nav() {
  return (
    <nav className="fixed top-0 w-full bg-white/95 backdrop-blur-sm border-b border-gray-100 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center space-x-2">
            <div className="w-8 h-8 bg-black rounded-sm flex items-center justify-center">
              <span className="text-white font-bold text-xs">MS</span>
            </div>
            
          </div>
          <div className="hidden lg:flex items-center space-x-8">
            <div className="flex items-center space-x-1 text-sm font-medium">
              <span>SAFARIS</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium">
              <span>DESTINATIONS</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium">
              <span>EXPERIENCES</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium">
              <span>INSPIRATION</span>
              <ChevronDown className="h-4 w-4" />
            </div>
            <div className="flex items-center space-x-1 text-sm font-medium">
              <span>ABOUT US</span>
              <ChevronDown className="h-4 w-4" />
            </div>
          </div>
          <div className="flex items-center space-x-4">
            
            <Button className="bg-black text-white px-6 py-2 text-sm font-medium">
              START PLANNING
            </Button>
          </div>
        </div>
      </div>
    </nav>
  );
}
