"use client";
import React, { useEffect, useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import { Loader2, QrCode } from 'lucide-react';
import { useConvexMutation } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import { toast } from 'sonner';

const QRScannerModel = ({isOpen , onClose}) => {

  const [showScannerReady , setShowScannerReady] = useState(false);
  const [error , setError] = useState(null);

  const  {mutate: checkInAttendee} = useConvexMutation(
    api.registrations.checkInAttendee,
  );

      const handleCheckIn = async(qrCode) => {
        try {
            const result = await checkInAttendee({
                qrCode
            });
            if(result.success){
                toast.success("Check-In Successfully");
                onClose();
            }
            else{
                toast.error(result.message || "Failed to check-in");
            }
        } catch (error) {
            toast.error(error.message || "Failed to checked In");
        }
    };

    useEffect(() => {
      let scanner = null;
      let mounted = true;

      const initScanner = async() => {
        if(!isOpen) return;

        try {
          //? Check camera permission first....
          try {
            await navigator.mediaDevices.getUserMedia({video: true});
            console.log("Camera permission granted");
          } catch (permError) {
            console.error("Camera permission denied" , permError);
            setError("Camera permission denied. Please enabled camera access");
            return;
          }

          //! Dynamically import the library.....
          const {Html5QrcodeScanner} = await import("html5-qrcode");
          if(!mounted) return;

          scanner = new Html5QrcodeScanner(
            "qr-reader",
            {
              fps: 10,
              qrbox: {width: 250, height: 250,},
              aspectRatio: 1.0,
              showTorchButtonIfSupported: true,
              showZoomSliderIfSupported: true,
              videoConstraints: {
                facingMode: "environment"  //* use back camera of mobile
              },
            },
          );

          const onScanSuccess = (decodedtext) => {
            console.log("QR code detected" , decodedtext);
            if(scanner) {
              scanner.clear().catch(console.error);
            }
            handleCheckIn(decodedtext);
          };

          const onScanError = (error) => {
            if(error && !error.includes("NotFoundException")){
              console.debug("Scan error" , error);
            }
          }

          scanner.render(onScanSuccess , onScanError);
          setShowScannerReady(true);
          setError(null);
        } catch (error) {
          console.error("Failed to initialize scanner" , error);
          setError(`Failed to start camera ${error.message}`);
          toast.error("Camera failed. Please use manual entry.")
        }
      };

      initScanner();

      return () => {
        mounted = false;
        if (scanner) {
          console.log("cleaning up scanner");
          scanner.clear().catch(console.error);
        }
        setShowScannerReady(false);
      }
    },[isOpen])

  return (
<Dialog open={isOpen} onOpenChange={onClose}>
  <DialogContent>
    <DialogHeader>
      <DialogTitle className="flex items-center gap-2">
        <QrCode className="w-6 h-6 text-purple-600" />
        Check-In Attendee
      </DialogTitle>
      <DialogDescription>
        Scan QR code or enter ticket ID manually
      </DialogDescription>
    </DialogHeader>
    {error ? (
      <div className="text-red-600 text-sm">{error}</div>
    ) : (
      <>
      <div
      id="qr-reader"
      className="w-full"
      style={{minHeight: "350px"}}
      >
      </div>
      {!showScannerReady && (
        <div className="flex items-center justify-center py-5">
          <Loader2 className="w-6 h-6 animate-spin text-purple-500" />
          <span className="ml-2 text-sm text-muted-foreground">
            Starting Camera.....
          </span>
        </div>
      )};

      <p className="text-sm text-muted-foreground text-center">
         {showScannerReady 
         ? "Position the QR code within the frame"
         : "Please allow camera access when prompted"
        }
      </p>
      </>
    )}
  </DialogContent>
</Dialog>
  )
}

export default QRScannerModel
