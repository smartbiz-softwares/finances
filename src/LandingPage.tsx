import React, { useEffect } from 'react';

interface LandingPageProps {
  onOpenAuth: () => void;
}

export const LandingPage: React.FC<LandingPageProps> = ({ onOpenAuth }) => {
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data && event.data.type === 'OPEN_AUTH') {
        onOpenAuth();
      }
    };
    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onOpenAuth]);

  return (
    <div className="w-full h-screen overflow-hidden bg-[#20201F]">
      <iframe
        src="/website.html"
        title="HeraWallet — La inteligencia artificial que entiende tu dinero"
        className="w-full h-full border-none m-0 p-0 block"
        style={{ border: 'none', width: '100%', height: '100vh' }}
      />
    </div>
  );
};
