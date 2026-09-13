"use client";
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { api } from '@/convex/_generated/api'
import { useConvexMutation } from '@/hooks/use-convex-query'
import { format } from 'date-fns';
import { Award, CheckCircle, Circle, Loader, Loader2 } from 'lucide-react';
import React from 'react'
import { toast } from 'sonner';

const AttendeeCard = ({registration, onGenerateCertificate, isPro = false}) => {

    const {mutate: checkInAttendee , isLoading} = useConvexMutation(
        api.registrations.checkInAttendee
    );

    const handleManualCheckIn = async() => {
        try {
            const result = await checkInAttendee({
                qrCode: registration.qrCode,
            });
            if(result.success){
                toast.success("Attendee checked in successfully");
            }
            else{
                toast.error(result.message);
            }
        } catch (error) {
            toast.error(error.message || "Failed to checked In");
        }
    };

  return (
    <Card className="py-0">
        <CardContent className="p-4 flex items-center gap-4">
          <div
          className={`mt-1 p-2 rounded-full ${registration.checkedIn ? "bg-green-200" : "bg-gray-200"}`}
          >
           {registration.checkedIn ? (
            <CheckCircle className="w-5 h-5 text-green-600" />
           ) : (
            <Circle className="w-5 h-5 text-gray-500" />
           )}
          </div>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <h3 className="font-semibold mb-1">{registration.attendeeName}</h3>
              {registration.ticketTypeName && (
                <span className="text-[10px] px-2 py-0.5 rounded bg-purple-900/40 text-purple-300 border border-purple-700/50">
                  {registration.ticketTypeName}
                </span>
              )}
            </div>
            <p className="text-sm text-muted-foreground mb-2">{registration.attendeeEmail}</p>

            <div className="flex flex-wrap gap-3 text-xs text-muted-foreground">
               <span>
                {registration.checkedIn ? "⏰ Checked in" : "📅 Registered"}{" "}
                {registration.checkedIn && registration.checkedInAt
                ? format(registration.checkedInAt, "PPp")
                : format(registration.registeredAt, "PPp")
                }
               </span>
               <span className="font-mono">QR: {registration.qrCode}</span>
            </div>

          </div>

          <div className="flex items-center gap-2">
            {registration.checkedIn && onGenerateCertificate && (
              <Button
                size="sm"
                variant="outline"
                onClick={() => onGenerateCertificate(registration)}
                className="gap-1 text-purple-400 border-purple-500/30 hover:bg-purple-950/30"
              >
                <Award className="w-4 h-4" />
                Certificate
              </Button>
            )}

            {!registration.checkedIn && (
              <Button
                size="sm"
                variant="outline"
                onClick={handleManualCheckIn}
                disabled={isLoading}
                className="gap-2"
              >
                {isLoading ? (
                  <Loader2 className="w-4 h-4 animate-spin" />
                ) : (
                  <>
                  <CheckCircle className="w-4 h-4" />
                  Check In
                  </>
                )}
              </Button>
            )}
          </div>
        </CardContent>
    </Card>
  )
}

export default AttendeeCard
