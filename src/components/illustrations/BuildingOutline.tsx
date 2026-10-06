import { cn } from '@/lib/utils';

type Variant = 'hero' | 'storeys' | 'height';

/**
 * Simple line illustrations drawn in code (PRD section 5, "Imagery"): no stock photography.
 * All three are decorative. The question text and help text carry the same information.
 * Strokes use `currentColor`, so the parent sets the colour.
 */
export function BuildingOutline({ variant, className }: { variant: Variant; className?: string }) {
  if (variant === 'hero') return <Hero className={className} />;
  if (variant === 'storeys') return <Storeys className={className} />;
  return <Height className={className} />;
}

const stroke = { fill: 'none', stroke: 'currentColor', strokeWidth: 2, strokeLinecap: 'round', strokeLinejoin: 'round' } as const;

function Hero({ className }: { className?: string }) {
  const floors = 9;
  const top = 60;
  const bottom = 380;
  const step = (bottom - top) / floors;
  return (
    <svg viewBox="0 0 400 440" aria-hidden="true" focusable="false" className={cn('h-auto w-full', className)} {...stroke}>
      {/* ground */}
      <path d="M20 380H380" />
      {/* tower */}
      <rect x="110" y={top} width="150" height={bottom - top} />
      {/* setback and plant room */}
      <path d="M140 60V40H230V60" />
      {/* floor lines */}
      {Array.from({ length: floors - 1 }, (_, i) => (
        <path key={i} d={`M110 ${top + step * (i + 1)}H260`} opacity="0.7" />
      ))}
      {/* windows */}
      {Array.from({ length: floors }, (_, row) =>
        [128, 170, 212].map((x) => (
          <rect key={`${row}-${x}`} x={x} y={top + step * row + 10} width="24" height={step - 20} opacity="0.45" strokeWidth="1.5" />
        )),
      )}
      {/* entrance */}
      <path d="M160 380V352H210V380" />
      {/* lower neighbouring building */}
      <path d="M260 380V300H340V380" opacity="0.7" />
      <path d="M278 320h12M308 320h12M278 346h12M308 346h12" opacity="0.45" strokeWidth="1.5" />
      {/* measurement arrow to the left */}
      <path d="M70 60V380" strokeDasharray="2 6" opacity="0.7" />
      <path d="M62 72L70 60L78 72M62 368L70 380L78 368" opacity="0.7" />
    </svg>
  );
}

function Storeys({ className }: { className?: string }) {
  const floors = 6;
  const groundY = 190;
  const floorH = 26;
  return (
    <svg viewBox="0 0 280 270" aria-hidden="true" focusable="false" className={cn('h-auto w-full max-w-72', className)} {...stroke}>
      {/* ground line */}
      <path d="M10 190H270" />
      {/* storeys, counted from the ground up */}
      <rect x="90" y={groundY - floors * floorH} width="100" height={floors * floorH} />
      {Array.from({ length: floors - 1 }, (_, i) => (
        <path key={i} d={`M90 ${groundY - floorH * (i + 1)}H190`} opacity="0.7" />
      ))}
      {Array.from({ length: floors }, (_, i) => (
        <text
          key={i}
          x="70"
          y={groundY - floorH * i - floorH / 2 + 5}
          textAnchor="end"
          fontSize="14"
          fontWeight="600"
          fill="currentColor"
          stroke="none"
        >
          {i + 1}
        </text>
      ))}
      {/* basement: not counted */}
      <rect x="90" y={groundY} width="100" height="44" strokeDasharray="5 5" opacity="0.7" />
      <text x="200" y={groundY + 28} fontSize="12" fill="currentColor" stroke="none">
        Basement:
      </text>
      <text x="200" y={groundY + 43} fontSize="12" fill="currentColor" stroke="none">
        not counted
      </text>
      <text x="10" y="210" fontSize="12" fill="currentColor" stroke="none">
        Ground level
      </text>
    </svg>
  );
}

function Height({ className }: { className?: string }) {
  const floors = 6;
  const groundY = 220;
  const floorH = 30;
  const topFloorY = groundY - (floors - 1) * floorH; // floor level of the top storey
  const roofY = groundY - floors * floorH;
  return (
    <svg viewBox="0 0 300 250" aria-hidden="true" focusable="false" className={cn('h-auto w-full max-w-72', className)} {...stroke}>
      <path d="M10 220H290" />
      <rect x="130" y={roofY} width="110" height={floors * floorH} />
      {Array.from({ length: floors - 1 }, (_, i) => (
        <path key={i} d={`M130 ${groundY - floorH * (i + 1)}H240`} opacity="0.7" />
      ))}
      {/* the arrow runs from the ground to the floor level of the top storey, not to the roof */}
      <path d={`M60 ${groundY}V${topFloorY}`} />
      <path d={`M52 ${groundY - 10}L60 ${groundY}L68 ${groundY - 10}M52 ${topFloorY + 10}L60 ${topFloorY}L68 ${topFloorY + 10}`} />
      <path d={`M60 ${topFloorY}H130`} strokeDasharray="4 5" opacity="0.7" />
      <text x="72" y={(groundY + topFloorY) / 2 + 4} fontSize="13" fontWeight="600" fill="currentColor" stroke="none">
        Height
      </text>
      <text x="250" y={topFloorY - 6} fontSize="11" fill="currentColor" stroke="none">
        Top storey
      </text>
      <text x="250" y={roofY - 6} fontSize="11" fill="currentColor" stroke="none">
        Roof
      </text>
    </svg>
  );
}
