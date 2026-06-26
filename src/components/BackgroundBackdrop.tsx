interface BackgroundBackdropProps {
  imageUrl?: string;
}

export default function BackgroundBackdrop({ imageUrl }: BackgroundBackdropProps) {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden">
      {imageUrl ? (
        <div
          className="absolute inset-0 scale-105 bg-cover bg-center opacity-45 blur-[2px]"
          style={{ backgroundImage: `url(${imageUrl})` }}
        />
      ) : (
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_20%,#2a2a2a,transparent_50%),radial-gradient(circle_at_80%_70%,#1c1814,transparent_55%),linear-gradient(180deg,#050505,#0a0a0a)]" />
      )}
      <div className="absolute inset-0 bg-gradient-to-b from-black/40 via-black/55 to-black" />
    </div>
  );
}
