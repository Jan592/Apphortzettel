import { useState, useEffect } from "react";
import { GraduationCap } from "lucide-react";
import { api } from "../utils/api";

interface AppLogoProps {
  className?: string;
  iconClassName?: string;
}

export function AppLogo({ className, iconClassName }: AppLogoProps) {
  const [logo, setLogo] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadLogo();

    // Listen for logo updates
    const handleLogoUpdate = () => {
      loadLogo();
    };

    window.addEventListener('logoUpdated', handleLogoUpdate);
    return () => {
      window.removeEventListener('logoUpdated', handleLogoUpdate);
    };
  }, []);

  const loadLogo = async () => {
    try {
      const response = await api.getLogo();
      setLogo(response.logo);
    } catch (error: any) {
      // Nur Fehler loggen wenn es kein Auth-Fehler ist
      if (!error?.message?.includes('401')) {
        console.error('Fehler beim Laden des Logos:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className={className}>
        <GraduationCap className={iconClassName} />
      </div>
    );
  }

  return (
    <div className={className}>
      {logo ? (
        <img 
          src={logo} 
          alt="App Logo" 
          className={iconClassName}
          style={{ 
            objectFit: 'contain',
            maxWidth: '100%',
            maxHeight: '100%',
            width: 'auto',
            height: 'auto'
          }}
        />
      ) : (
        <GraduationCap className={iconClassName} />
      )}
    </div>
  );
}
