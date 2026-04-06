export default function AdsLayout({ children }: { children: React.ReactNode }) {
    return (
        <>
            <style>{`
                html > body > nav,
                html > body > header,
                body > nav,
                body > header,
                footer,
                .woot-widget-bubble,
                .woot-widget-holder,
                .woot--bubble-holder {
                    display: none !important;
                }
            `}</style>
            {children}
        </>
    )
}
