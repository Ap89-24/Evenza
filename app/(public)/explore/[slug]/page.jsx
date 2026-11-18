"use client"
import EventCard from '@/components/EventCard';
import Pagination from '@/components/Pagination';
import { api } from '@/convex/_generated/api';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { CATEGORIES } from '@/lib/data';
import { parseLocationSlug } from '@/lib/location-util';
import { Badge, Loader2, MapPin } from 'lucide-react';
import { notFound, useParams, useRouter } from 'next/navigation'
import React, { useState } from 'react'

const EVENTS_PER_PAGE = 9;

const DynamicExplorePage = () => {

  const params = useParams();
  const router = useRouter();
  const slug = params.slug;
  const [currentPage, setCurrentPage] = useState(1);

  //check if it is a valid category or not
  const categoryInfo = CATEGORIES.find((cat) => cat.id === slug);
  const isCategory = !!categoryInfo;

  //If it is not a category validate location...
  
  const { city, state, isValid } = !isCategory ? parseLocationSlug(slug) : {city: null, state: null, isValid: false};

  if(!isCategory && !isValid) {
    notFound();
  }

   const { data: eventsData, isLoading } = useConvexQuery(
      isCategory
      ? api.event.getPaginatedEventsByCategory
      : api.event.getPaginatedEventsByLocation,
      isCategory
      ? { category: slug, page: currentPage, pageSize: EVENTS_PER_PAGE }
      : city && state
      ? { city, state, page: currentPage, pageSize: EVENTS_PER_PAGE }
      : "skip"
    );

    const events = eventsData?.events || [];
    const totalCount = eventsData?.totalCount || 0;
    const totalPages = eventsData?.totalPages || 1;
    const activePage = eventsData?.page || currentPage;

    const handlePageChange = (page) => {
      setCurrentPage(page);
      window.scrollTo({ top: 0, behavior: "smooth" });
    };

    const handleEventClick = (eventslug) => {
    router.push(`/events/${eventslug}`);
  }

  if(isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500" />
      </div>
    );
  }

  if(isCategory) {
    return (
      <>
      <div className="pb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">{categoryInfo.icon}</div>

          <div>
          <h1 className="text-5xl md:text-6xl font-bold">
              {categoryInfo.label}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">{categoryInfo.description}</p>
          </div>

        </div>

        {totalCount > 0 && (
          <p className='text-muted-foreground'>
            {totalCount} event{totalCount !== 1 ? "s" : ""} found
          </p>
        )}
      </div>

        {events && events.length > 0  ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                key={event._id}
                event={event}
                onClick={() => handleEventClick(event.slug)}
                />
              ))}
            </div>
            <Pagination
              currentPage={activePage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={EVENTS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <p className='text-muted-foreground'>
              No event found in this category
          </p>
        )}
      </>
    )
  }

  return ( 
     <>
      <div className="pb-5">
        <div className="flex items-center gap-4 mb-4">
          <div className="text-6xl">📍</div>

          <div>
          <h1 className="text-5xl md:text-6xl font-bold">
              Events in {city}
          </h1>
          <p className="text-lg text-muted-foreground mt-2">{state}, India</p>
          </div>

        </div>

        <div className="flex items-center gap-3">
          <Badge variant="secondary" className="gap-2">
            <MapPin className="w-3 h-3" />
            {city}, {state}
          </Badge>

        {totalCount > 0 && (
          <p className='text-muted-foreground'>
            {totalCount} event{totalCount !== 1 ? "s" : ""} found
          </p>
        )}
        </div>
      </div>

        {events && events.length > 0  ? (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {events.map((event) => (
                <EventCard
                key={event._id}
                event={event}
                onClick={() => handleEventClick(event.slug)}
                />
              ))}
            </div>
            <Pagination
              currentPage={activePage}
              totalPages={totalPages}
              totalItems={totalCount}
              pageSize={EVENTS_PER_PAGE}
              onPageChange={handlePageChange}
            />
          </>
        ) : (
          <p className='text-muted-foreground'>
              No event found in this {city} , {state} yet
          </p>
        )}
      </>
  )
}

export default DynamicExplorePage
