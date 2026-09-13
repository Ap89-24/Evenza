import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react"
import { useConvexQuery } from "./use-convex-query";
import { api } from "@/convex/_generated/api";


const ATTENDEE_PAGES = ["/explore" , "/events" , "my-tickets"]

export function useOnboarding() {
     const [showOnboarding , setshowOnboarding] = useState(false);
     const pathname = usePathname();
     const router = useRouter();

     const {data: currentUser , isLoading} = useConvexQuery(
        api.users.getCurrentUser
     );

     useEffect(() => {
        if(!currentUser || isLoading) return;

        if(!currentUser.hasCompletedOnboarding){
            //check if current requires onboarding....
            const requiresOnboarding = ATTENDEE_PAGES.some((page) => 
               pathname.startsWith(page)
            );
            if(requiresOnboarding){
                // eslint-disable-next-line react-hooks/set-state-in-effect
                setshowOnboarding(true);
            }
        }

     },[currentUser,pathname,isLoading]);

     const handleOnboardingComplete = () => {
        setshowOnboarding(false);
        router.refresh();
     }

     const handleOnboardingSkip = () => {
        setshowOnboarding(false);
        router.push("/");
     }

     return {
        showOnboarding,
        handleOnboardingComplete,
        handleOnboardingSkip,
        setshowOnboarding,
        needOnboarding: currentUser && !currentUser.hasCompletedOnboarding,
     }
}