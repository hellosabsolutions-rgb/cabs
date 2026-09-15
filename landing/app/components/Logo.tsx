import Image from 'next/image';

export function Logo({ size = 'md' }: { size?: 'sm' | 'md' }) {
  const box = size === 'sm' ? 'h-8 w-8' : 'h-9 w-9';

  return (
    <span className="inline-flex items-center gap-2.5">
      <span className={`relative ${box} overflow-hidden rounded-md shrink-0 bg-white`}>
        <Image
          src="/logo-light.png"
          alt=""
          width={72}
          height={72}
          className="absolute left-1/2 top-[38%] h-[165%] w-[165%] -translate-x-1/2 -translate-y-1/2 object-cover"
        />
      </span>
      <span className="font-bold text-[17px] tracking-tight text-foreground">
        KABPRO
      </span>
    </span>
  );
}
