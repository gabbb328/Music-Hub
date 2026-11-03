import React from "react";
import { MusicProviderId } from "@/services/music-providers";

interface LogoProps {
  provider: MusicProviderId;
  className?: string;
  size?: number;
}

export const MusicServiceLogo: React.FC<LogoProps> = ({
  provider,
  className = "",
  size = 20,
}) => {
  switch (provider) {
    case "spotify":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M12 0C5.373 0 0 5.373 0 12s5.373 12 12 12 12-5.373 12-12S18.627 0 12 0zm5.508 17.308a.749.749 0 0 1-1.031.248c-2.822-1.724-6.374-2.114-10.558-1.159a.75.75 0 0 1-.336-1.462c4.582-1.047 8.52-.607 11.677 1.342.348.213.46.666.248 1.031zm1.47-3.267a.938.938 0 0 1-1.29.31c-3.23-1.986-8.156-2.56-11.977-1.4a.938.938 0 1 1-.548-1.794c4.373-1.328 9.799-.684 13.505 1.594.422.26.56.814.31 1.29zm.126-3.403c-3.873-2.3-10.264-2.512-13.978-1.384a1.125 1.125 0 0 1-.652-2.155c4.27-1.296 11.326-1.054 15.787 1.594a1.125 1.125 0 0 1-1.157 1.945z" />
        </svg>
      );

    case "apple_music":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 6.42c.62-.75 1.04-1.8 0.93-2.85-.9.04-1.99.6-2.63 1.35-.57.66-.99 1.72-.85 2.74 1 .08 2.02-.49 2.55-1.24z" />
        </svg>
      );

    case "youtube_music":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <circle cx="12" cy="12" r="11" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="7" fill="none" stroke="currentColor" strokeWidth="1.5" />
          <polygon points="10,8.5 16,12 10,15.5" fill="currentColor" />
        </svg>
      );

    case "amazon_music":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M13.9 12.8c-1.8 0-3.3.4-3.3 2.1 0 1.2.8 1.8 1.9 1.8 1.5 0 2.4-1 2.4-2.3v-1.6zm2.3 4.8h-2.1v-.8c-.7.7-1.6 1-2.7 1-2 0-3.4-1.2-3.4-3.2 0-2.4 2-3.3 4.2-3.3.7 0 1.3.1 1.8.2v-.6c0-1.1-.7-1.7-1.9-1.7-1.1 0-2.1.5-2.5.8l-.7-1.6c.8-.6 2.1-1 3.6-1 2.6 0 3.7 1.4 3.7 3.5v6.7zm6.8 3.5c-6.8 4.2-14.8 2-19.5-.4-.4-.2-.5-.6-.2-.9.2-.3.6-.3.9-.1 4.3 2.2 11.7 4.2 18 0 .4-.3.9-.1 1.1.3.3.4.1.9-.3 1.1zm-1.8.8c.4-.5 1.5-1.4 2.8-1.5.3 0 .5.2.4.5-.4 1.2-1.4 2.2-2.1 2.6-.3.2-.6 0-.7-.2-.2-.4-.4-.9-.4-1.4z" />
        </svg>
      );

    case "tidal":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <polygon points="6,6 9,9 6,12 3,9" />
          <polygon points="12,6 15,9 12,12 9,9" />
          <polygon points="18,6 21,9 18,12 15,9" />
          <polygon points="12,12 15,15 12,18 9,15" />
        </svg>
      );

    case "deezer":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <rect x="2" y="14" width="3" height="6" rx="1" />
          <rect x="6.5" y="10" width="3" height="10" rx="1" />
          <rect x="11" y="6" width="3" height="14" rx="1" />
          <rect x="15.5" y="11" width="3" height="9" rx="1" />
          <rect x="20" y="15" width="3" height="5" rx="1" />
        </svg>
      );

    case "soundcloud":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <path d="M19.5 12c-.3 0-.6.04-.9.1A5.002 5.002 0 0 0 9 10.5c-.2 0-.4 0-.6.04A3.5 3.5 0 0 0 5 13.5c0 .3.04.6.1.9A2.5 2.5 0 0 0 4 19h15.5a3.5 3.5 0 0 0 0-7z" />
          <line x1="2" y1="15" x2="2" y2="18" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      );

    case "qobuz":
      return (
        <svg
          width={size}
          height={size}
          viewBox="0 0 24 24"
          fill="currentColor"
          className={className}
        >
          <circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" strokeWidth="2" />
          <circle cx="12" cy="12" r="4" fill="currentColor" />
          <line x1="12" y1="2" x2="12" y2="6" stroke="currentColor" strokeWidth="2" />
          <line x1="12" y1="18" x2="12" y2="22" stroke="currentColor" strokeWidth="2" />
        </svg>
      );

    default:
      return null;
  }
};
