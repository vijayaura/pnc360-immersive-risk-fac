import React from 'react';
import siteLogo from '@/assets/logo.png';
import { useMarketThemeStore } from '@/shared/stores/useMarketThemeStore';

export const PoweredBy: React.FC = () => {
    const { theme } = useMarketThemeStore();

    // If we have a custom theme, we show the organization logo alongside Aura Branding
    // or stick to the powered by aura layout.

    return (
        <div className="pt-6 text-center text-muted-foreground/60 flex items-center justify-center gap-2 group transition-all">
            <span className="text-sm font-medium">Powered by</span>
            <img
                src={siteLogo}
                alt="AURA"
                className="h-5 w-auto object-contain grayscale transition-all group-hover:grayscale-0"
                loading="eager"
            />
        </div>
    );
};
