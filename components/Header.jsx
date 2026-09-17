"use client";
import { SignInButton, useAuth, UserButton } from '@clerk/nextjs';
import Link from 'next/link';
import React, { useState } from 'react';
import { Button } from './ui/button';
import { Authenticated, Unauthenticated } from "convex/react";
import { BarLoader } from "react-spinners";
import { useStoreUserEffect } from '@/hooks/useStoreUserEffect';
import { Building, CreditCard, Globe, History as HistoryIcon, Menu, Plus, Ticket, X } from 'lucide-react';
import { OnBoardingModal } from './OnBoardingModal';
import { useOnboarding } from '@/hooks/use-onboarding';
import SearchLocationBar from './SearchLocationBar';
import UpgradeModal from './UpgradeModal';
import { useConvexQuery } from '@/hooks/use-convex-query';
import { api } from '@/convex/_generated/api';
import BrandSymbol from './BrandSymbol';

const Header = () => {
  const { isLoading } = useStoreUserEffect();
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const { showOnboarding, handleOnboardingComplete, handleOnboardingSkip } = useOnboarding();

  const { data: currentUser } = useConvexQuery(api.users.getCurrentUser);
  const { has } = useAuth();
  const hasPro = currentUser?.plan === "pro" || has?.({ plan: "pro" });

  return (
    <>
      <nav className='fixed top-0 left-0 right-0 bg-background/90 backdrop-blur-3xl z-30 border-b max-w-full overflow-x-hidden'>
        <div className='max-w-7xl mx-auto px-3 sm:px-6 py-2.5 sm:py-3.5 flex items-center justify-between gap-2 min-w-0 max-w-full'>
          {/* Brand Symbol & Logo */}
          <BrandSymbol hasPro={hasPro} />

          {/* Search bar and location for desktop */}
          <div className="hidden md:flex flex-1 justify-center px-4 max-w-2xl min-w-0">
            <SearchLocationBar />
          </div>

          {/* Right side navigation (Desktop & User actions) */}
          <div className='flex items-center gap-1.5 sm:gap-2 flex-shrink-0'>
            <Button variant='ghost' size='sm' asChild className="hidden md:inline-flex text-xs sm:text-sm">
              <Link href='/billing'>Pricing</Link>
            </Button>
            <Button variant='ghost' size='sm' asChild className="hidden md:inline-flex text-xs sm:text-sm">
              <Link href='/explore'>Explore</Link>
            </Button>
            <Button variant='ghost' size='sm' asChild className="hidden md:inline-flex mr-1 text-xs sm:text-sm">
              <Link href='/past-events'>Past Events</Link>
            </Button>

            <Authenticated>
              <Button size='sm' asChild className='hidden sm:inline-flex items-center gap-1.5 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold text-xs sm:text-sm px-2.5 sm:px-3 shadow-md shadow-purple-500/25 border-none'>
                <Link href={'/create-event'} className="flex items-center gap-1.5 text-white">
                  <Plus className='w-4 h-4 text-white' />
                  <span className='hidden sm:inline text-white'>Create Event</span>
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
                      label='Past Events Archive'
                      labelIcon={<HistoryIcon size={16} />}
                      href='/past-events'
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

            {/* Mobile Hamburger Menu Toggle Button */}
            <Button
              variant="ghost"
              size="icon"
              className="md:hidden h-8 w-8 text-gray-300 hover:text-white"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              aria-label="Toggle Navigation Menu"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
            </Button>
          </div>
        </div>

        {/* Mobile Search & Location Bar */}
        <div className="md:hidden border-t px-3 py-2 bg-background/60">
          <SearchLocationBar />
        </div>

        {/* Mobile Navigation Drawer Dropdown */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t bg-background/95 backdrop-blur-2xl px-4 py-3 space-y-2 animate-in slide-in-from-top-2 duration-200">
            <div className="flex flex-col gap-1">
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="justify-start text-xs sm:text-sm h-9"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/explore" className="flex items-center gap-2.5">
                  <Globe className="w-4 h-4 text-purple-400" /> Explore Events
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="justify-start text-xs sm:text-sm h-9"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/past-events" className="flex items-center gap-2.5">
                  <HistoryIcon className="w-4 h-4 text-purple-400" /> Past Events
                </Link>
              </Button>
              <Button
                variant="ghost"
                size="sm"
                asChild
                className="justify-start text-xs sm:text-sm h-9"
                onClick={() => setMobileMenuOpen(false)}
              >
                <Link href="/billing" className="flex items-center gap-2.5">
                  <CreditCard className="w-4 h-4 text-purple-400" /> Pricing & Plans
                </Link>
              </Button>

              <Authenticated>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start text-xs sm:text-sm h-9"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/my-tickets" className="flex items-center gap-2.5">
                    <Ticket className="w-4 h-4 text-purple-400" /> My Tickets
                  </Link>
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  asChild
                  className="justify-start text-xs sm:text-sm h-9"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/my-events" className="flex items-center gap-2.5">
                    <Building className="w-4 h-4 text-purple-400" /> My Events
                  </Link>
                </Button>
                <Button
                  size="sm"
                  asChild
                  className="mt-2 bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold justify-center shadow-md shadow-purple-500/25 border-none h-9 text-xs"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <Link href="/create-event" className="flex items-center gap-2 text-white">
                    <Plus className="w-4 h-4 text-white" /> Create Event
                  </Link>
                </Button>
              </Authenticated>

              <Unauthenticated>
                <SignInButton mode="modal">
                  <Button size="sm" className="mt-2 w-full text-xs h-9">Sign In</Button>
                </SignInButton>
              </Unauthenticated>
            </div>
          </div>
        )}

        {/* Loader */}
        {isLoading && (
          <div className='absolute bottom-0 left-0 w-full'>
            <BarLoader width={'100%'} color='#a855f7' />
          </div>
        )}
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
  );
};

export default Header;
