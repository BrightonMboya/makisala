import { WifiOff } from "lucide-react";
import Image from "next/image";
import LogoLoop from "@repo/ui/logo-loop"

export function FeatureGrid() {
  const imageLogos = [
    { src: "/screenshots/features/content/1.png", alt: "Company 1" },
    { src: "/screenshots/features/content/2.png", alt: "Company 2" },
    { src: "/screenshots/features/content/3.png", alt: "Company 3" },
  ];


  return (
    <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-6">
      <div className="h-80 border border-green-700/25 bg-green-50/75 col-span-6 flex justify-between rounded-3xl overflow-hidden">
        <div className="w-full p-8 space-y-4">
          <div className="p-3 flex items-center gap-2 bg-green-200 w-fit rounded-xl">
            <WifiOff className="text-green-700" size={24} />
          </div>
          <p className="text-3xl font-bold text-green-900">Works Offline</p>
          <p className="text-green-900/75">
            Your clients can pull up their itinerary mid-safari, even with no signal.
          </p>
        </div>
        <div className="w-full relative">
          <Image
            src="/mockup.png"
            alt="Illustration of a safari vehicle in the savannah with a dashed line indicating no signal"
            fill
            className="object-cover w-full h-full"
          />
        </div>
      </div>
      <div className="h-96 border border-emerald-500/25 bg-emerald-50/75 col-span-4 rounded-3xl overflow-hidden">
        <div className="w-full p-8 space-y-4">
          <p className="text-3xl font-bold text-emerald-800">Ready-Made Content</p>
          <p className="text-emerald-700/75">
            Stop Googling for lodge photos. Pull from a library of verified images and descriptions for top destinations.
          </p>
        </div>
        <div className="flex gap-2">
          {/* MAKE MARQUEE HERE */}
          <LogoLoop
            logos={imageLogos}
            speed={25}
            direction="left"
            logoHeight={240}
            gap={4}
            hoverSpeed={0}
            scaleOnHover={false}
            fadeOut
            pauseOnHover={false}
            fadeOutColor="#F1FEF8"
            ariaLabel="Technology partners"
          />
        </div>
      </div>
      <div className="min-h-80 border border-lime-500/25 bg-lime-50 col-span-2 rounded-3xl overflow-hidden relative">
        <div className="p-8 space-y-4">
          <p className="text-3xl font-semibold text-lime-800">Drag-and-Drop Builder</p>
          <p className="text-lime-700/75">Rearrange days with a drag. Your itinerary stays organized.
          </p>
        </div>
        <div className="absolute w-full bottom-0 left-18 scale-125">
          <Image
            src="/screenshots/features/drag-and-drop.png"
            alt="Screenshot of the drag-and-drop builder feature"
            width={617}
            height={366}
            className="w-full h-full border-lime-500 shadow-2xl shadow-lime-600"
          />
        </div>
      </div>
      <div className="rounded-3xl h-96 border border-primary/30 col-span-3 flex flex-col overflow-hidden bg-primary/10">
        <div className="p-8 space-y-4">
          <p className="text-3xl font-semibold text-primary">Shareable Proposals</p>
          <p className="text-primary/90">
            Send a link, not a PDF attachment. Clients view, comment, and accept your proposal from any device.
          </p>
        </div>
        <div className="relative">
          <Image
            src="/screenshots/features/share-proposal.png"
            alt="Screenshot of the shareable proposals feature"
            width={617}
            height={366}
            className="w-full h-full border-lime-500 shadow-2xl shadow-lime-600"
          />
        </div>
      </div>

      <div className="h-96 border border-teal-900/25 col-span-3 flex flex-col-reverse overflow-hidden rounded-3xl bg-teal-100/40">
        <div className="space-y-4 p-8">
          <p className="text-3xl font-semibold text-teal-900">AI Writing Assist</p>
          <p className="text-teal-700/75">
            Stuck on a description? Generate polished copy for any destination or activity in seconds.
          </p>
        </div>
        <div className="relative">
          <Image
            src="/screenshots/features/ai-suggest.png"
            alt="Screenshot of the AI writing assist feature"
            width={617}
            height={366}
            className="w-full h-full shadow-lg shadow-teal-900/10"
          />
        </div>
      </div>
    </div>
  );
}
