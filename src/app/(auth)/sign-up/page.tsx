import Image from 'next/legacy/image'
import { UserAuthForm } from '@/app/(auth)/sign-up/_components/user-auth-form'

export default function Page() {
    return (
        <>
            <div className="relative container flex h-screen items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:space-x-10">
                <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
                    <div className="absolute inset-0 bg-zinc-900" />
                    <Image
                        src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1758806094/pexels-photo-208965_avgumx.jpg"
                        alt="hero"
                        layout="fill"
                        className="object-cover opacity-40"
                    />
                </div>
                <UserAuthForm />
            </div>
        </>
    )
}
