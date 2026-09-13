"use client";

import { Button } from '@/components/ui/button';
import { ArrowLeft } from 'lucide-react';
import { usePathname } from 'next/navigation'
import { useRouter } from 'next/navigation';
import React from 'react'

const Explorelayout = ({children}) => {

    const pathname = usePathname();
    const router = useRouter();
    const isMainExplorePage = pathname === '/explore';
  return (
    <div className='min-h-screen pb-16'>
         <div className='max-w-7xl mx-auto px-6'>
            {!isMainExplorePage && (
              <div className='mb-6'>
                <Button
                variant='ghost'
                onClick={()=> router.push('/explore')}
                className={'gap-2 -ml-2'}
                >
                    <ArrowLeft className='w-4 h-4' />
                    Back to Explore
                </Button>
                </div>
            )}
            {children}
            </div>      
    </div>
  )
}

export default Explorelayout
