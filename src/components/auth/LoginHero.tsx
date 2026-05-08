import React from 'react';
import { Users, Shield, Building } from 'lucide-react';
import { useMarketThemeStore } from '@/shared/stores/useMarketThemeStore';
import defaultIllustration from '@/assets/illustration.svg';

interface LoginHeroProps {
    portalType: 'broker' | 'insurer' | 'admin' | 'super_admin' | 'call_center';
    title?: string;
    subtitle?: string;
}

export const LoginHero: React.FC<LoginHeroProps> = ({
    portalType,
    title: manualTitle,
    subtitle: manualSubtitle
}) => {
    const { theme } = useMarketThemeStore();

    // Dynamic branding based on theme OR portal type
    const branding = {
        title: theme?.clientName || "Riyadh Re Platform",
        logoUrl: theme?.logoUrl || null,
        heroTitle: manualTitle || (portalType === 'insurer' ? "Welcome Back!" : "Hey, Hello!"),
        heroSubtitle: manualSubtitle || (
            portalType === 'insurer'
                ? "Manage your underwriter operations with ease and control."
                : "We provide all the advantages that can simplify your marketplace operations without any further requirements."
        )
    };

    const getIcon = () => {
        switch (portalType) {
            case 'insurer': return <Building className="w-6 h-6" />;
            case 'admin':
            case 'super_admin': return <Shield className="w-6 h-6" />;
            default: return <Users className="w-6 h-6" />;
        }
    };

    return (
        <div className="hidden lg:flex w-1/2 bg-gradient-to-br from-primary to-primary/70 text-white relative overflow-hidden">
            {/* Decorative patterns or shapes can be added here */}
            <div className="absolute inset-0 bg-primary/10 backdrop-blur-[1px]" />

            <div className="max-w-xl mx-auto my-auto px-12 py-16 relative z-10">
                <div className="mb-10">
                    <img
                        src={defaultIllustration}
                        alt="Hero Illustration"
                        className="w-full max-w-md h-auto object-contain drop-shadow-2xl"
                    />
                </div>

                <div className="flex items-center gap-3 mb-10">
                    <div className="w-10 h-10 rounded-lg bg-white/20 flex items-center justify-center backdrop-blur-md">
                        {getIcon()}
                    </div>
                    <h2 className="text-2xl font-semibold tracking-tight">
                        {branding.title}
                    </h2>
                </div>

                <h1 className="text-5xl font-bold leading-tight mb-4 tracking-tight">
                    {branding.heroTitle}
                </h1>
                <p className="text-white/80 text-lg leading-relaxed">
                    {branding.heroSubtitle}
                </p>
            </div>
        </div>
    );
};
