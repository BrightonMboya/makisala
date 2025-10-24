import Image from 'next/legacy/image'
import { useForm, useFieldArray } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'

export default function Page() {
    return (
        <div className="container relative flex h-screen items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:space-x-10 ">
            <div className="relative hidden h-full flex-col bg-muted p-10 text-white lg:flex dark:border-r">
                <div className="absolute inset-0 bg-zinc-900 " />
                <Image
                    src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1753366416/Joys-Camp-1_nbu2ps.jpg"
                    alt="hero"
                    layout="fill"
                    className="object-cover opacity-80"
                />

                <div className="relative z-20 flex items-center text-lg font-medium">
                    <div className="relative hidden h-[65px] w-[148px] lg:block"></div>
                </div>
            </div>
            <div className="grid w-full grid-cols-1 md:grid-cols-3">
                <div className="col-span-1 flex items-center justify-center md:col-span-2">
                    <div className="w-full max-w-md overflow-hidden border-y border-gray-200 sm:rounded-2xl sm:border sm:shadow-xl">
                        <div className="flex flex-col items-center justify-center space-y-3 border-b border-gray-200 bg-white px-4 py-6 pt-8 text-center sm:px-16">
                            <p className="text-sm text-gray-500">Login to edit Makisala Content</p>
                        </div>
                        <div className="flex flex-col space-y-3 bg-gray-50 px-4 py-8 sm:px-16"></div>
                    </div>
                </div>
            </div>
        </div>
    )
}
