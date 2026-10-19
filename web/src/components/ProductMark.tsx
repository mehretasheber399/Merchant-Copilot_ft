const tones = [
  'bg-[#F7E6C8] text-[#805119]',
  'bg-[#DEEDF1] text-[#36677B]',
  'bg-[#F6DFDB] text-[#8C443A]',
  'bg-[#E1EFE3] text-[#397249]',
  'bg-[#EAE5F7] text-[#62538C]',
  'bg-[#DEF0F1] text-[#386E78]',
  'bg-[#F4E1E9] text-[#875168]',
  'bg-[#EEE1D5] text-[#76523A]',
] as const;

function toneFor(seed: string): string {
  let hash = 0;
  for (let index = 0; index < seed.length; index += 1) {
    hash = (hash + seed.charCodeAt(index)) % tones.length;
  }
  return tones[hash] ?? tones[0];
}

export function ProductMark({ name, large = false }: { name: string; large?: boolean }) {
  const label = name.trim().slice(0, 2).toUpperCase() || '•';
  return (
    <span
      aria-hidden="true"
      className={`grid shrink-0 place-items-center font-extrabold ${large ? 'h-12 w-12 rounded-[14px] text-sm' : 'h-10 w-10 rounded-[11px] text-[11px]'} ${toneFor(name)}`}
    >
      {label}
    </span>
  );
}
