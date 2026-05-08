import { Shield, Phone, Mail, MapPin, Clock, Facebook, Twitter, Linkedin } from "lucide-react";

export const Footer = () => {
  return (
    <footer className="bg-card border-t">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
        <div className="flex justify-center items-center space-x-3">
          <span className="text-muted-foreground text-sm">Powered by</span>
          <img src="/lovable-uploads/b8cba7d5-7174-48dc-b189-00f94bb589c2.png" alt="AURA" className="h-8 w-auto" />
        </div>
      </div>
    </footer>
  );
};