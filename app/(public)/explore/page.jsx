"use client";
import React, { useRef } from "react";
import { api } from "@/convex/_generated/api";
import { useConvexQuery } from "@/hooks/use-convex-query";
import {
  Carousel,
  CarouselContent,
  CarouselItem,
  CarouselNext,
  CarouselPrevious,
} from "@/components/ui/carousel";
import Autoplay from "embla-carousel-autoplay";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import { ArrowRight, Calendar, History, Loader, Loader2, MapPin, Users } from "lucide-react";
import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { createLocationSlug } from "@/lib/location-util";
import EventCard from "@/components/EventCard";
import { CATEGORIES } from "@/lib/data";
import { Card, CardContent } from "@/components/ui/card";
import { useEffect } from "react";
import { gsap } from "gsap";

const ExplorePage = () => {
  //Fetch current user for location...
  const plugin = useRef(Autoplay({ delay: 2000, stopOnInteraction: true }));

  const router = useRouter();
  const containerRef = useRef(null);

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);

  const { data: featuredEvents, isLoading: loadingFeatured } = useConvexQuery(
    api.event.getFeaturedEvents,
    { limit: 3 },
  );


  const { data: localEvents, isLoading: loadingLocal } = useConvexQuery(
    api.event.getEventsByLocation,
    {
      city: currentUser?.location?.city,
      state: currentUser?.location?.state,
      limit: 4,
    },
  );

  const { data: popularEvents, isLoading: popularLoading } = useConvexQuery(
    api.event.getPopularEvents,
    { limit: 6 },
  );

  const { data: recentEvents, isLoading: recentLoading } = useConvexQuery(
    api.event.getRecentEvents,
    { limit: 12 },
  );

  const { data: categoryCounts } = useConvexQuery(api.event.getCategoryCount);

  const categoryWithCounts = CATEGORIES.map((cat) => {
    return {
      ...cat,
      count: categoryCounts?.[cat.id] || 0,
    }
  })

  const handleEventClick = (slug) => {
    router.push(`/events/${slug}`);
  }

  const handleCategoryClick = (categoryid) => {
    router.push(`/explore/${categoryid}`);
  }

  const handleViewLocalEvents = () => {
     const city = currentUser?.location?.city;
     const state = currentUser?.location?.state;

     const slug = createLocationSlug(city, state);
     router.push(`/explore/${slug}`);
    }

    //Loading state....
    const isLoading = loadingFeatured || loadingLocal || popularLoading;
    
   useEffect(() => {
  if (!containerRef.current) return;
  if (isLoading) return;

  const ctx = gsap.context(() => {

    const sections = Array.from(containerRef.current.children);

    gsap.from(sections, {
      opacity: 0,
      y: 40,
      duration: 0.7,
      stagger: 0.15,
      ease: "power3.out",
      clearProps: "all",
    });

  }, containerRef);

  return () => ctx.revert();

}, [isLoading, featuredEvents, localEvents, popularEvents]);
  

  
  if(isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }



  return (
    <div ref={containerRef}>
      <div className="hero-section pb-12 text-center">
        <h1 className="text-5xl md:text-6xl font-bold mb-5">Discover Events</h1>
        <p className="text-lg text-muted-foreground max-w-3xl mx-auto">
          Explore featured events, find what&apos;s happening locally, or browse
          events across India
        </p>
      </div>

      {/* Featured carousel */}

      {featuredEvents && featuredEvents.length > 0 && (
        <div className="section-block mb-16">
          <Carousel plugins={[plugin.current]}
          className={'w-full'}
          onMouseEnter={plugin.current.stop}
          onMouseLeave={plugin.current.reset}
          >
            <CarouselContent>
              {featuredEvents.map((event) => (
                <CarouselItem key={event._id}>
                    <div
                    onClick={() => handleEventClick(event.slug)}
                    className="relative h-[400px] rounded-xl overflow-hidden cursor-pointer"
                    >
                     {event.coverImage ? (<Image src={event.coverImage} alt={event.title} fill className="object-cover" priority/> ): (<div className="absolute inset-0" style={{backgroundColor: event.themeColor}}/>)}

                     <div className="absolute inset-0 bg-linear-to-r from-black/60 to-black/30" />

                     <div className="relative h-full flex flex-col justify-end p-8 md:p-12">
                        <Badge className={'w-fit mb-4'} variant={'secondary'}>
                          {event.city} , {event.city || event.country}
                        </Badge>
                        <h2 className="text-3xl md:text-5xl font-bold mb-4 text-white">
                          {event.title}
                        </h2>
                        <p className="text-lg text-white/50 mb-5 max-w-2xl line-clamp-2">
                          {event.description}
                        </p>

                        <div className="flex items-center gap-4 text-white/80">
                            <div className="flex items-center gap-2">
                               <Calendar className="w-5 h-5" />
                               <span className="text-sm">
                                {format(event.startDate , "PPP")}
                               </span>
                            </div>

                            <div className="flex items-center gap-2">
                                 <MapPin className="w-5 h-5" />
                                 <span className="text-sm">{event.city}</span>
                            </div>

                            <div className="flex items-center gap-2">
                               <Users className="w-5 h-5" />
                               <span className="text-sm">{event.registrationCount}</span>
                            </div>

                        </div>
                     </div>


                    </div>
                </CarouselItem>

              ))}
            </CarouselContent>
            <CarouselPrevious className={'left-3'} />
            <CarouselNext className={'right-4'} />
          </Carousel>
        </div>
      )}

      {/* Local events */}
      {localEvents && localEvents.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-6">
             <div>
              <h2 className="text-4xl font-bold mb-2">Events Near You</h2>
              <p className="text-muted-foreground">
                 Happening in {currentUser?.location?.city || "Your City"}
              </p>
             </div>

             <Button
             variant="outline"
             className={'gap-2'}
             onClick={handleViewLocalEvents}
             >
               View All  <ArrowRight className="w-4 h-4"/>
             </Button>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {localEvents.map((event) => {
              return(
              <EventCard
              key={event._id}
              event={event}
              variant="grid"
              onClick={() => handleEventClick(event.slug)}
              className="event-card-animate"
              />
            )})}
          </div>
        </div>
      )}

      {/* Browse events by category */}

      <div className="mb-16">
        <h2 className="text-4xl font-bold mb-4">Browse by Category</h2>

       <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {categoryWithCounts.map((category) => {
            return(
            <Card
            key={category.id}
            className="py-2 group cursor-pointer hover:shadow-lg transition-all hover:border-purple-500/50"
            onClick={() => handleCategoryClick(category.id)}
            >
            <CardContent className="px-3 sm:p-6 flex items-center gap-4">
              <div className="text-3xl sm:text-4xl">{category.icon}</div>

              <div className="flex-1 min-w-0">
                <h3 className="font-semibold mb-1.5 group-hover:text-purple-400 transition-colors">
                  {category.label}
                </h3>
                <p className="text-sm text-muted-foreground">
                    {category.count} Event{category.count !== 1 ? "s" : ""}
                </p>
              </div>
            </CardContent>
            </Card>
          )})}
       </div>

      </div>

      {/* Popular events across country */}

      {popularEvents && popularEvents.length > 0 &&(
      <div className="mb-16">
        <h2 className="text-3xl font-bold mb-2">Popular events across India</h2>
        <p className="text-muted-foreground mb-3">Trending events Nationwide</p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {popularEvents.map((event) => {
            return (
              <EventCard
              key={event._id}
              event={event}
              variant="list"
              onClick={() => handleEventClick(event.slug)}
              />
            )
          })}
        </div>

      </div>
       
      )}

      {/* Recently Created Events Across All Organizers */}
      {recentEvents && recentEvents.length > 0 && (
        <div className="mb-16">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-3xl font-bold mb-1">Recently Created Events</h2>
              <p className="text-muted-foreground text-sm">Newly launched events from organizers across the platform</p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {recentEvents.map((event) => (
              <EventCard
                key={event._id}
                event={event}
                variant="grid"
                onClick={() => handleEventClick(event.slug)}
              />
            ))}
          </div>
        </div>
      )}
      {/* Banner linking to Past Events Archive */}
      <div className="mb-16 p-6 sm:p-8 rounded-2xl border border-zinc-800 bg-gradient-to-r from-zinc-900 via-zinc-950 to-purple-950/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-base font-bold text-white">
            <History className="w-5 h-5 text-purple-400" /> Looking for finished events?
          </div>
          <p className="text-xs sm:text-sm text-gray-400">
            Check out completed experiences, host details, and summaries in our Past Events Archive.
          </p>
        </div>
        <Button asChild variant="outline" className="border-purple-500/40 text-purple-300 hover:bg-purple-950/40 text-xs sm:text-sm gap-2 shrink-0">
          <Link href="/past-events">
            Browse Past Events Archive <ArrowRight className="w-4 h-4" />
          </Link>
        </Button>
      </div>

      {/* Empty state for no events */}

      {!loadingFeatured &&
      !loadingLocal &&
      !popularLoading &&
      !recentLoading &&
      (!featuredEvents || featuredEvents.length === 0) && 
      (!localEvents || localEvents.length === 0) && 
      (!popularEvents || popularEvents.length === 0) &&
      (!recentEvents || recentEvents.length === 0) && (
        <Card className="p-12 text-center">
          <div className="max-w-md mx-auto space-y-5">
            <div className="text-7xl mb-5">🎉</div>
            <h2 className="text-3xl font-bold">No events yet</h2>
            <p className="text-muted-foreground">
              Be the first to create an event in your city and get the word out! With no events currently listed, it&apos;s a great opportunity to start something amazing. Whether it&apos;s a small meetup or a large festival, your event could be the next big thing in town. Don&apos;t wait for others to take the lead - create your event today and bring people together!
            </p>
            <Button asChild className="gap-2">
               <a href="/create-event">Create Event</a>
            </Button>
          </div>
        </Card>
      )}
    </div>
  );
};

export default ExplorePage;
