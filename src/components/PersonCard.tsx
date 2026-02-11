import Image from "next/image";

type PersonCardProps = {
  name: string;
  roleLabel: string;
  photo_url: string | null;
  placeholderImage: string;
  featured?: boolean;
};

export function PersonCard({ name, roleLabel, photo_url, placeholderImage, featured }: PersonCardProps) {
  const src = photo_url || placeholderImage;
  return (
    <div
      className={`
        group flex flex-shrink-0 snap-center overflow-hidden rounded-2xl border border-siyah/10 bg-beyaz
        transition-all duration-300 hover:border-bordo/40 hover:shadow-[0_0_24px_rgba(139,21,56,0.15)]
        ${featured ? "w-[200px] sm:w-[220px]" : "w-[140px] sm:w-[160px]"}
      `}
    >
      <div className={`relative w-full overflow-hidden ${featured ? "aspect-[3/4]" : "aspect-[3/4]"}`}>
        <Image
          src={src}
          alt={name}
          fill
          className="object-cover grayscale-[30%] transition-all duration-300 group-hover:grayscale-0 group-hover:scale-105"
          unoptimized
        />
        <div className="absolute inset-0 bg-gradient-to-t from-siyah/50 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
      </div>
      <div className="p-3 text-center">
        <h3 className={`font-display font-semibold text-siyah truncate ${featured ? "text-base" : "text-sm"}`}>
          {name}
        </h3>
        <p className="mt-0.5 text-xs font-medium text-bordo truncate">{roleLabel}</p>
      </div>
    </div>
  );
}
