import { Star } from "lucide-react";
import Image from "next/image";
import { safaris, why_travel_with_us } from "@/lib/constants";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import ImageCard from "@/components/home/image-card";

export default function SafariFrankClone() {
  const months = [
    "JAN",
    "FEB",
    "MAR",
    "APR",
    "MAY",
    "JUN",
    "JULY",
    "AUG",
    "SEPT",
    "OCT",
    "NOV",
    "DEC",
  ];
  

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative h-screen flex items-center justify-start overflow-hidden mt-16">
        <div className="absolute inset-0">
          <Image
            src="https://plus.unsplash.com/premium_photo-1661963014384-bd88252d977c?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8OXx8Z29sZGVuJTIwaG91ciUyMGluJTIwYSUyMHNhZmFyaXxlbnwwfHwwfHx8MA%3D%3D"
            alt="Makisala"
            fill
            className="object-cover"
            priority
          />
          <div className="absolute inset-0 bg-black/30" />
        </div>
        <div className="relative z-10 text-white max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 w-full">
          <div className="max-w-2xl">
            <div className="text-sm font-medium tracking-wider mb-4">
              MAKISALA
            </div>
            <h1 className="text-5xl md:text-6xl font-light mb-8 leading-tight">
              Experience the Wild,
              <br />
              Champion its Future.
            </h1>
            <div className="flex space-x-4">
              <Button
                variant="outline"
                className="border-white text-white hover:bg-white hover:text-black px-8 py-3 text-sm font-medium bg-transparent">
                EXPERIENCES
              </Button>
              <Button className="bg-white text-black hover:bg-gray-100 px-8 py-3 text-sm font-medium">
                START PLANNING
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Founder Quote Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <div>
              <div className="text-sm font-medium tracking-wider text-gray-500 mb-6">
                BRIGHTON MBOYA, CO-FOUNDER MAKISALA
              </div>
              <h2 className="text-4xl font-light mb-8 text-gray-900">
                "We're in the safari-business."
              </h2>
              <div className="space-y-6 text-gray-700 leading-relaxed">
                <p>
                  At Makisala, we're not just planning trips –{" "}
                  <strong>
                    we're in the business of making dreams come true
                  </strong>
                  . Every safari we design is a labour of love, crafted by our
                  team of passionate safari-planners who know Africa like the
                  back of their hand.
                </p>
                <p>
                  We truly believe that a safari changes you <em>for good</em>.
                </p>
                <p>
                  We've experienced it firsthand – getting out in the wild
                  brings people closer to each other and to nature. That's
                  because there's a bit of wild in all of us, and a safari
                  brings it out. When it does, we naturally want to keep that
                  wildness safe – in the world and in ourselves. We hope your
                  journey instils in you the same love for "Safari Africa" that
                  inspired us to start this company.
                </p>
                <p className="font-medium">
                  Let's make the world a little wilder, one safari at a time.
                </p>
              </div>
            </div>
            <div className="relative">
              <Image
                src="https://images.unsplash.com/photo-1602909543092-11fd98492545?w=900&auto=format&fit=crop&q=60&ixlib=rb-4.1.0&ixid=M3wxMjA3fDB8MHxzZWFyY2h8MjB8fGdvbGRlbiUyMGhvdXIlMjBpbiUyMGElMjBzYWZhcml8ZW58MHx8MHx8fDA%3D"
                alt="Safari Guide with Binoculars"
                width={500}
                height={600}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Family Passion Section */}
      <section className="pt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-sm font-medium tracking-wider text-gray-500 mb-4">
            FAMILY PASSION MEETS SAFARI EXPERTISE
          </div>
        </div>
      </section>

      {/* Why Travel With Us Section */}
      <section className="bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              Why travel with MAKISALA
            </h2>
            <div className="w-16 h-px bg-gray-300 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-12">
            {why_travel_with_us.map((item, index) => (
              <ImageCard
                key={index}
                img_url={item.img_url}
                alt={item.alt}
                title={item.title}
                description={item.description}
              />
            ))}
          </div>
        </div>
      </section>

      {/* Destinations and Experiences Section */}
      <section className="pt-16 mt-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-sm font-medium tracking-wider text-gray-500 mb-4">
            DESTINATIONS, EXPERIENCES AND TRIP TYPES
          </div>
        </div>
      </section>

      {/* What Would You Like To Experience Section */}
      <section className="pb-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              What Would You Like To Experience
            </h2>
            <div className="w-16 h-px bg-gray-300 mx-auto"></div>
          </div>
          <div className="grid md:grid-cols-3 gap-6">
            {safaris.map((experience, index) => (
              <div
                key={index}
                className="relative group cursor-pointer overflow-hidden rounded-lg">
                <div className="aspect-[4/3] relative">
                  <Image
                    src={experience.image || "/placeholder.svg"}
                    alt={experience.title}
                    fill
                    className="object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                  <div className="absolute inset-0 bg-black/40 group-hover:bg-black/50 transition-colors" />
                  <div className="absolute inset-0 flex items-center justify-center">
                    <h3 className="text-white text-lg font-medium absolute bottom-3 px-4">
                      {experience.title}
                    </h3>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* When to Travel Section */}
      <section className="py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              When to travel
            </h2>
            <div className="w-16 h-px bg-gray-300 mx-auto mb-8"></div>
            <p className="text-gray-600 max-w-4xl mx-auto leading-relaxed">
              Truth be told, there's no bad time to Africa, just different
              times! The variety served up by Africa's diversity means unique
              experiences throughout the year. See the Wildebeest Migration in
              East Africa, go gorilla trekking in Uganda, track the BIG 5 in
              Botswana or honeymoon in the Seychelles; SAFARI FRANK will give
              you 'frank' advice on what to expect when, as well as options for
              the experience of a lifetime.
            </p>
          </div>

          {/* Month Tabs */}
          <div className="flex flex-wrap justify-center mb-12">
            {months.map((month, index) => (
              <button
                key={month}
                className={`px-6 py-3 text-sm font-medium border-r border-gray-300 last:border-r-0 ${
                  index === 0
                    ? "bg-black text-white"
                    : "bg-white text-gray-700 hover:bg-gray-50"
                }`}>
                {month}
              </button>
            ))}
          </div>

          {/* Featured Destination */}
          <div className="grid lg:grid-cols-2 gap-12 items-center">
            <div className="bg-gray-800 text-white p-8 rounded-lg">
              <div className="text-sm mb-4">
                Season: High Summer / Ave Temp: 25°C / Highlight: Glorious Cape
                Town
              </div>
              <h3 className="text-3xl font-light mb-6">
                Cape Town And The Garden Route
              </h3>
              <p className="text-gray-300 leading-relaxed">
                As the new year descends on Africa so does the much-anticipated
                rain in the south. January in Southern and East Africa tends to
                be quieter making it a great time to take advantage of
                competitive rates, making safaris more accessible and
                affordable. A stay in fabulous Cape Town and self-drive up the
                Whale Coast & Garden Route is a great option and don't forget
                the Cape Vineyards....
              </p>
            </div>
            <div className="relative">
              <Image
                src="/placeholder.svg?height=400&width=600"
                alt="Cape Town Coastal View"
                width={600}
                height={400}
                className="rounded-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* Dreams to Reality Section */}
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <div className="text-sm font-medium tracking-wider text-gray-500 mb-4">
            DREAMS TO REALITY
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-white">
        <div className="max-w-lg mx-auto px-4 sm:px-6 lg:max-w-none">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-light text-gray-900 mb-4">
              How It Works
            </h2>
            <div className="w-16 h-px bg-gray-300 mx-auto"></div>
          </div>

          <div className="grid md:grid-cols-5 gap-5">
            {[
              {
                step: "STEP 1",
                title: "Discover",
                description:
                  "Start dreaming and explore our collection of hand picked African safari experiences, a perfect blend of luxury and adventure, with destinations across Africa for every intrepid traveller.",
              },
              {
                step: "STEP 2",
                title: "Connect",
                description:
                  "Let's chat! Fill in our enquiry form online or call us to discuss your ultimate African journey. We'll connect you to one of our African safari specialists for firsthand knowledge and valuable insight into each destination.",
              },
              {
                step: "STEP 3",
                title: "Plan",
                description:
                  "Our safari experts will compare deals, liaise with our industry partners and design a bespoke safari itinerary focusing on your specific interests and travel wish list.",
              },
              {
                step: "STEP 4",
                title: "Finalise",
                description:
                  "We're on hand to discuss and fine tune your tailor-made safari at any time. We're passionate about creating authentic and life changing African experiences with genuine support and guidance so you can book and travel with confidence.",
              },
              {
                step: "STEP 5",
                title: "Experience",
                description:
                  "Be immersed in your experience without a worry in the wild. Our trusted partners and dedicated SAFARI FRANK team members are on call when you touch down in Africa and throughout your adventure for peace of mind.",
              },
            ].map((item, index) => (
              <div
                key={index}
                className="bg-gray-50 p-8 rounded-lg text-center">
                <div className="text-xs font-medium tracking-wider text-gray-500 mb-2">
                  {item.step}
                </div>
                <div className="w-8 h-px bg-gray-300 mx-auto mb-4"></div>
                <h3 className="text-2xl font-light text-gray-900 mb-4">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm leading-relaxed">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Reviews Section */}
      <section className="py-20 bg-gray-900 text-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <div className="text-sm font-medium tracking-wider text-gray-400 mb-4">
              WHY OUR GUESTS RETURN:
            </div>
            <h2 className="text-4xl font-light mb-4">Our Latest Reviews</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[1, 2, 3].map((review) => (
              <Card key={review} className="bg-gray-800 border-gray-700">
                <CardContent className="p-6">
                  <div className="flex mb-4">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className="h-4 w-4 text-yellow-400 fill-current"
                      />
                    ))}
                  </div>
                  <p className="text-gray-300 mb-4 italic">
                    "An absolutely incredible experience. The attention to
                    detail and personalized service exceeded all expectations.
                    Our guide was phenomenal!"
                  </p>
                  <div className="text-sm text-gray-400">
                    <p className="font-medium">Sarah Johnson</p>
                    <p>Verified Guest</p>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Partners Section */}
      {/* <section className="py-16 bg-gray-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-12">
            <div className="text-sm font-medium tracking-wider text-gray-500 mb-4">
              OUR PARTNERS IN AFRICA WILL MAKE YOUR DREAM TRIP, A TRIP TO NEVER
              FORGET
            </div>
          </div>
          <div className="flex justify-center items-center space-x-12 opacity-60">
            {[1, 2, 3, 4, 5].map((partner) => (
              <div key={partner} className="text-2xl font-light text-gray-400">
                Partner {partner}
              </div>
            ))}
          </div>
        </div>
      </section> */}
    </div>
  );
}
