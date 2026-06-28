import Image from 'next/image';
import { useState } from 'react';

type ProfileImageProps = {
  src?: string | null;
  alt: string;
  className?: string;
  fallbackLabel?: string;
  fallbackSubLabel?: string;
  sizes?: string;
  fill?: boolean;
  width?: number;
  height?: number;
};

const fallbackClass =
  'flex h-full w-full flex-col items-center justify-center bg-gradient-to-br from-[#0b0c09] via-[#14211d] to-[#263f38] text-center text-mist';

const ProfileImage = ({
  src,
  alt,
  className = '',
  fallbackLabel = 'AGG',
  fallbackSubLabel = 'Artist',
  sizes,
  fill = false,
  width = 128,
  height = 128,
}: ProfileImageProps) => {
  const [failed, setFailed] = useState(false);
  const shouldUseFallback = !src || failed;

  if (shouldUseFallback) {
    return (
      <div className={`${fallbackClass} ${className}`}>
        <span className="font-serif text-2xl font-black tracking-[0.16em] text-sun-gold">{fallbackLabel}</span>
        <span className="mt-1 text-[10px] font-black uppercase tracking-[0.24em] text-alpine">{fallbackSubLabel}</span>
      </div>
    );
  }

  if (fill) {
    return (
      <Image
        src={src}
        alt={alt}
        fill
        sizes={sizes}
        className={className}
        onError={() => setFailed(true)}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      onError={() => setFailed(true)}
    />
  );
};

export default ProfileImage;
