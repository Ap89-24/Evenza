"use client";
import {  SignInButton, SignUpButton, useAuth, UserButton } from '@clerk/nextjs'
import Image from 'next/image'
import Link from 'next/link'
import React, { useState } from 'react'
import { Button } from './ui/button'
import {Authenticated , Unauthenticated} from "convex/react"
import {BarLoader} from "react-spinners"
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect';
import { Building, CreditCard, Crown, Plus, Ticket } from 'lucide-react';
import { OnBoardingModal } from './OnBoardingModal';
import { useOnboarding } from '@/hooks/use-onboarding';
import SearchLocationBar from './SearchLocationBar';
import { Badge } from './ui/badge';
import UpgradeModal from './UpgradeModal';

import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import BrandSymbol from './BrandSymbol';

const Header = () => {

  const {isLoading} = useStoreUserEffect();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  const {showOnboarding,handleOnboardingComplete,handleOnboardingSkip} = useOnboarding();

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { has } = useAuth();
  const hasPro = currentUser?.plan === "pro" || has?.({plan: "pro"});

  return (
    <>
      <nav className='fixed top-0 left-0 right-0 bg-background/80 backdrop-blur-3xl z-20 border-b'>
        <div className='max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-4 flex items-center justify-between gap-2'>
            {/* Brand Symbol & Logo */}
            <BrandSymbol hasPro={hasPro} />

            {/* {search bar and location for desktop} */}

            <div className="hidden md:flex flex-1 justify-center px-4">
                  <SearchLocationBar />
            </div>

            {/* {right side section} */}
            <div className='flex items-center gap-1.5 sm:gap-2 flex-shrink-0'>
                <Button variant='ghost' size='sm' asChild className="hidden md:inline-flex">
                  <Link href='/billing'>Pricing</Link>
                </Button>
                <Button variant='ghost' size='sm' asChild className="hidden md:inline-flex mr-1">
                  <Link href={'/explore'}>Explore</Link>
                </Button>
               <Authenticated>
                <Button size='sm' asChild className='flex items-center gap-1.5 bg-purple-600 hover:bg-purple-700 text-xs sm:text-sm px-2.5 sm:px-3'>
                  <Link href={'/create-event'}>
                  <Plus className='w-4 h-4'/>
                  <span className='hidden sm:inline'>Create Event</span>
                  </Link>
                </Button>
                <div className="flex items-center justify-center min-w-[32px]">
                  <UserButton afterSignOutUrl="/">
                    <UserButton.MenuItems>
                      <UserButton.Link
                      label='My Tickets'
                      labelIcon={<Ticket size={16} />}
                      href='/my-tickets'
                      />
                      <UserButton.Link
                      label='My Events'
                      labelIcon={<Building size={16} />}
                      href='/my-events'
                      />
                      <UserButton.Link
                      label='Billing & Plan'
                      labelIcon={<CreditCard size={16} />}
                      href='/billing'
                      />
                    </UserButton.MenuItems>
                  </UserButton>
                </div>
            </Authenticated> 
            
                 <Unauthenticated>
              <SignInButton mode='modal'>
                <Button size='sm' className="text-xs sm:text-sm px-3">Sign In</Button>
              </SignInButton>
              
            </Unauthenticated>

            </div>
          
        </div>

        {/* search and location for mobile only */}

           <div className="md:hidden border-t px-3 py-3">
                  <SearchLocationBar />
            </div>

        {/* Loader */}
       { isLoading && <div className='absolute bottom-0 left-0 w-full'>
            <BarLoader width={'100%'} color='#a855f7' />
        </div>
        }
      </nav>

      {/* Modals */}
        <OnBoardingModal
        isOpen={showOnboarding}
        onClose={handleOnboardingSkip}
        onComplete={handleOnboardingComplete}
        />

        <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        trigger="header"
        />
    </>
  )
}

export default Header
