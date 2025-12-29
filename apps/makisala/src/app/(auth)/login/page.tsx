import Image from 'next/legacy/image'
import { LoginForm } from './_components/LoginForm'

export default function Page() {
    return (
        <>
            <div className="relative container flex h-screen items-center justify-center md:grid lg:max-w-none lg:grid-cols-2 lg:space-x-10">
                <div className="bg-muted relative hidden h-full flex-col p-10 text-white lg:flex dark:border-r">
                    <div className="absolute inset-0 bg-zinc-900" />
                    <Image
                        src="https://res.cloudinary.com/dr2tdyz2w/image/upload/v1758802547/photo-1623847976687-8b742dc59073_zfrip9.jpg"
                        alt="hero"
                        layout="fill"
                        className="object-cover opacity-40"
                    />
                </div>
                <LoginForm />
            </div>
        </>
    )
}
