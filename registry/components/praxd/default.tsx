import { PdLogo } from './PdLogo';

export default function Header() {
  return (
    <div className="flex items-center justify-center p-8 bg-neutral-950">
      {/* Default megethos */}
      <PdLogo size={128} />

      {/* Me Tailwind CSS styling */}
      <PdLogo size={48} className="hover:opacity-90 transition-opacity" />
    </div>
  );
}