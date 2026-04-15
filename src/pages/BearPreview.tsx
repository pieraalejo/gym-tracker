import BearAvatar from '../components/bear/BearAvatar';
import BearAvatarV2 from '../components/bear/BearAvatarV2';
import type { BearState } from '../types';

const STATES: { state: BearState; label: string }[] = [
  { state: 'fresh',             label: 'ENTRENASTE HOY'   },
  { state: 'happy',             label: 'AYER ENTRENASTE'  },
  { state: 'neutral',           label: '2-3 DÍAS'         },
  { state: 'sad',               label: '4+ DÍAS SIN GYM'  },
  { state: 'workout_pecho',     label: 'PECHO'            },
  { state: 'workout_espalda',   label: 'ESPALDA'          },
  { state: 'workout_hombros',   label: 'HOMBROS'          },
  { state: 'workout_biceps',    label: 'BÍCEPS'           },
  { state: 'workout_triceps',   label: 'TRÍCEPS'          },
  { state: 'workout_piernas',   label: 'PIERNAS'          },
  { state: 'workout_abdomen',   label: 'ABDOMEN'          },
  { state: 'workout_cardio',    label: 'CARDIO'           },
];

export default function BearPreview() {
  return (
    <div className="min-h-screen bg-background pb-24">
      <div className="page-header mb-2">
        <h1 className="font-pixel text-accent" style={{ fontSize: '11px' }}>
          COMPARACIÓN DE OSOS
        </h1>
        <p className="text-textMuted text-xs mt-1">
          Decile a Claude cuál preferís para aplicarlo a la app
        </p>
      </div>

      {/* Column headers */}
      <div className="grid grid-cols-[1fr_80px_80px] gap-2 px-4 py-2 border-b border-border sticky top-[57px] bg-background z-30">
        <span className="text-textMuted text-xs font-pixel" style={{ fontSize: '7px' }}>ESTADO</span>
        <span className="text-accent text-xs font-pixel text-center" style={{ fontSize: '7px' }}>V1 ACTUAL</span>
        <span className="text-warning text-xs font-pixel text-center" style={{ fontSize: '7px' }}>V2 NUEVO</span>
      </div>

      <div className="px-4 space-y-1 mt-2">
        {STATES.map(({ state, label }) => (
          <div
            key={state}
            className="grid grid-cols-[1fr_80px_80px] gap-2 items-center py-3 border-b border-border/50"
          >
            <div>
              <p className="font-pixel text-textPrimary" style={{ fontSize: '8px' }}>{label}</p>
              <p className="text-textMuted text-xs mt-0.5" style={{ fontSize: '10px' }}>{state}</p>
            </div>

            {/* V1 */}
            <div className="flex justify-center">
              <BearAvatar state={state} size={60} />
            </div>

            {/* V2 */}
            <div className="flex justify-center">
              <BearAvatarV2 state={state} size={60} />
            </div>
          </div>
        ))}
      </div>

      <div className="px-4 mt-6">
        <div className="card border-accent/30">
          <p className="font-pixel text-accent mb-2" style={{ fontSize: '9px' }}>¿QUÉ DIFERENCIA AL V2?</p>
          <ul className="text-textMuted text-sm space-y-1.5">
            <li>• Equipamiento grande y visible (barras, discos, mancuernas)</li>
            <li>• Pecho → forma de T con barra horizontal completa</li>
            <li>• Hombros → barra encima de la cabeza</li>
            <li>• Piernas → postura de sentadilla ancha</li>
            <li>• Bíceps → curl con mancuerna visible arriba</li>
            <li>• Espalda → remo con barra en la cintura</li>
          </ul>
        </div>
      </div>
    </div>
  );
}
