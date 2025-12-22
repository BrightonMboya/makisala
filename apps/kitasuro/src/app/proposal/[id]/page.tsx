"use client";

import React from "react";
import { useParams, useRouter } from "next/navigation";
import { itineraries } from "@/data/itineraries";
import MinimalisticTheme from "@/components/themes/MinimalisticTheme";
import SafariPortalTheme from "@/components/themes/SafariPortalTheme";

export default function ItineraryPage() {
  const params = useParams();
  const router = useRouter();
  const id = params.id as string;
  const data = itineraries[id];

  if (!data) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FDFCFB]">
        <div className="text-center space-y-4">
          <h1 className="text-4xl font-serif">Itinerary not found</h1>
          <button 
            onClick={() => router.push("/proposal/rwanda-gorilla-3d")}
            className="text-stone-500 hover:text-stone-800 transition-colors uppercase tracking-widest text-xs"
          >
            Go back to Rwanda Safari
          </button>
        </div>
      </div>
    );
  }

  if (data.theme === "safari-portal") {
    return <SafariPortalTheme data={data} />;
  }

  return <MinimalisticTheme data={data} />;
}
