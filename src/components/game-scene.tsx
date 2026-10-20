import { BACKGROUNDS, CHARACTERS } from '@/game/assets';
import type { CharacterPlacement, LocationId } from '@/game/types';

export function GameScene({ location, characters }: { location: LocationId; characters: CharacterPlacement[] }) {
  const background = BACKGROUNDS[location];
  return <div className="tale-stage">
    {background.src && <img className="tale-backdrop" src={background.src} alt={background.label} />}
    {characters.map(c => <img key={c.id} src={CHARACTERS[c.id].src ?? undefined} alt={CHARACTERS[c.id].label}
      className="tale-character" style={{ left: `${c.x}%`, height: `${c.height}%`, transform: `translateX(-50%)${c.flip ? ' scaleX(-1)' : ''}` }} />)}
  </div>;
}