import React from 'react'
import { Card, CardContent } from './ui/card'
import Image from 'next/image'
import { getCategoryIcon, getCategoryLabel } from '@/lib/data'
import { format } from 'date-fns'
import { Calendar, Eye, MapPin, QrCode, Trash2, Users, X } from 'lucide-react'
import { Badge } from './ui/badge'
import { Button } from './ui/button'

const EventCard = ({
    event,
    onClick,
    onDelete,
    variant = "grid",
    action = null,  //? event , ticket or null....
    className = ''
}) => {

    //! List Variant......
    if(variant === "list"){
        return (
            <Card
            className={`py-0 group cursor-pointer hover:shadow-lg transition-all hover:border-primary/50 ${className}`}
            onClick={onClick}
            >
                <CardContent className={'p-3 flex gap-3'}>
                     <div className='w-20 h-20 rounded-lg shrink-0 overflow-hidden relative'>
                         {event.coverImage ? (<Image src={event.coverImage} alt={event.title} fill className="object-cover" priority/> 
                         ) : (
                            <div className="absolute inset-0 flex items-center justify-center text-3xl" style={{backgroundColor: event.themeColor}}>
                            {getCategoryIcon(event.category)}
                         </div>
                        )}
                     </div>

                     <div className="flex-1 min-w-0">
                         <h3 className="font-semibold text-sm mb-1 group-hover:text-purple-400 transition-colors line-clamp-2">
                            {event.title}
                         </h3>

                         <p className="text-sm text-muted-foreground mb-1">
                             {format(event.startDate , "EEE, dd MMM, HH:mm")}
                         </p>

                         <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <MapPin className='w-3 h-3' />
                            <span className="'line-clamp-1">
                                {event.locationType ==="online" ? "Online Event" : event.city}
                            </span>
                         </div>

                         <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                            <Users className='w-3 h-3' />
    
                            <span>{event.registrationCount} attending</span>
                         </div>
                     </div>
                </CardContent>
            </Card>
        )
    }

    //! Grid Variant......
  return (
    <Card
            className={`overflow-hidden group pt-0 ${onClick ? "cursor-pointer hover:shadow-lg transition-all hover:border-purple-500/50" : ""} ${className}`}
            onClick={onClick}
            >

            <div className='relative h-48 overflow-hidden'>
                         {event.coverImage ? (
                            <Image 
                            src={event.coverImage} 
                            alt={event.title} 
                            fill 
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform" 
                            priority/> 
                         ) : (
                            <div className="w-full h-full flex items-center justify-center text-5xl" 
                            style={{backgroundColor: event.themeColor}}>
                            {getCategoryIcon(event.category)}
                         </div>
                        )}
                        <div className='absolute top-3 right-3'>
                          <Badge variant="secondary">
                            {event.ticketType === "free" ? "Free" : "Paid"}
                          </Badge>
                        </div>
                     </div>

                <CardContent className='space-y-3'>
                  <div>
                    <Badge variant="outline" className='mb-2'>
                        {getCategoryIcon(event.category)}  {getCategoryLabel(event.category)}
                    </Badge>
                    <h3 className="font-semibold text-lg line-clamp-2 group-hover:text-purple-400 transition-colors">
                        {event.title}
                    </h3>
                    </div>    

                    <div className="space-x-2 text-sm text-muted-foreground">
                         <div className="flex items-center gap-2">
                               <Calendar className="w-5 h-5" />
                               <span className="text-sm">
                                {format(event.startDate , "PPP")}
                               </span>
                            </div>

                            <div className="flex items-center gap-2">
                                 <MapPin className="w-5 h-5" />
                                 <span className="text-sm">
                                    {event.locationType ==="online" ? "Online Event" : `${event.city}, ${event.state || event.country}`}
                                 </span>
                            </div>

                            <div className="flex items-center gap-2">
                                  <Users className="w-5 h-5" />
                                  <span className="text-sm">{event.registrationCount} / {event.capacity} registered</span>
                           </div>
                    </div>

                    {action && (
                        <div className="flex gap-2 pt-2">
                            <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={(e) => {
                                e.stopPropagation();
                                onClick?.(e);
                            }}
                            >
                             {action === "event" ? (
                                <>
                                <Eye className="w-5 h-5" />
                                View
                                </>
                             ) : (
                                <>
                                <QrCode className="w-5 h-5" />
                                Show Ticket
                                </>
                             )}
                            </Button>

                            {onDelete && (
                                <Button
                                variant="outline"
                                size="sm"
                                onClick={(e) => {
                                    e.stopPropagation();
                                    onDelete(event._id);
                                }}
                                className="text-red-500 hover:text-red-700 hover:bg-red-50"
                                >
                                {action === "event" ? (
                                    <Trash2 className="w-5 h-5" />
                                ) : (
                                    <X className="w-5 h-5" />
                                )}
                                </Button>
                            )}
                        </div>
                    )}
                </CardContent>
            </Card>
  )
}

export default EventCard
