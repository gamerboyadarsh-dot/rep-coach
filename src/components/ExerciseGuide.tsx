import { useState } from 'react';
import { sfx } from '../lib/sounds';

type GuideTab = 'squat' | 'pushup' | 'jumping_jack';

export function ExerciseGuide() {
  const [activeTab, setActiveTab] = useState<GuideTab>('squat');

  const content = {
    squat: {
      title: 'BODYWEIGHT SQUAT',
      formImage: '/images/squat_form_1782494716211.jpg',
      muscleImage: '/images/squat_muscles_1782494730641.jpg',
      instructions: [
        'Stand with feet shoulder-width apart.',
        'Keep your back straight and chest up.',
        'Lower your hips until your thighs are at least parallel to the floor (90 degree angle at the knee).',
        'Ensure your knees track over your toes, avoiding valgus collapse.',
        'Push through your heels to ascend back to a standing position.'
      ]
    },
    pushup: {
      title: 'TACTICAL PUSH-UP',
      formImage: '/images/pushup_form_1782494744608.jpg',
      muscleImage: '/images/pushup_muscles_1782494767040.jpg',
      instructions: [
        'Assume a plank position with hands slightly wider than shoulder-width.',
        'Keep your body in a straight line from head to heels.',
        'Lower your body until your elbows reach a 90-degree angle.',
        'Keep elbows tucked in (not flared out at 90 degrees to your body).',
        'Push back up to the starting position.'
      ]
    },
    jumping_jack: {
      title: 'JUMPING JACKS',
      formImage: '/images/jumping_jack_form_1782494780010.jpg',
      muscleImage: '/images/jumping_jack_muscles_1782494792361.jpg',
      instructions: [
        'Stand upright with your legs together and arms at your sides.',
        'Jump into the air while simultaneously spreading your legs wider than shoulder-width.',
        'At the same time, raise your arms overhead (wrists above shoulders).',
        'Jump again to return to the starting position.',
        'Maintain a steady, continuous rhythm.'
      ]
    }
  };

  const handleTab = (tab: GuideTab) => {
    sfx.playClick();
    setActiveTab(tab);
  };

  const data = content[activeTab];

  return (
    <div className="flex flex-col items-center min-h-screen p-6 relative z-10 pt-24 overflow-y-auto">
      <div className="hud-panel p-8 w-full max-w-5xl mb-12">
        <div className="corner-bracket tl"></div>
        <div className="corner-bracket tr"></div>
        <div className="corner-bracket bl"></div>
        <div className="corner-bracket br"></div>

        <h1 className="text-4xl font-bold mb-8 text-center glow-text uppercase">DATABANK: EXERCISE FORMS</h1>

        <div className="flex flex-wrap gap-4 justify-center mb-8">
          <button 
            onClick={() => handleTab('squat')}
            className={`px-6 py-2 border transition-colors uppercase font-bold tracking-widest cursor-pointer ${activeTab === 'squat' ? 'bg-[var(--color-hud-cyan)]/20 border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)]' : 'border-[var(--color-hud-cyan)]/30 opacity-60 hover:opacity-100'}`}
          >
            SQUAT
          </button>
          <button 
            onClick={() => handleTab('pushup')}
            className={`px-6 py-2 border transition-colors uppercase font-bold tracking-widest cursor-pointer ${activeTab === 'pushup' ? 'bg-[var(--color-hud-cyan)]/20 border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)]' : 'border-[var(--color-hud-cyan)]/30 opacity-60 hover:opacity-100'}`}
          >
            PUSH-UP
          </button>
          <button 
            onClick={() => handleTab('jumping_jack')}
            className={`px-6 py-2 border transition-colors uppercase font-bold tracking-widest cursor-pointer ${activeTab === 'jumping_jack' ? 'bg-[var(--color-hud-cyan)]/20 border-[var(--color-hud-cyan)] text-[var(--color-hud-cyan)]' : 'border-[var(--color-hud-cyan)]/30 opacity-60 hover:opacity-100'}`}
          >
            JUMPING JACKS
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Instructions */}
          <div className="bg-[var(--color-hud-bg)] border border-[var(--color-hud-cyan)]/30 p-6">
            <h2 className="text-2xl font-bold mb-4 text-[var(--color-hud-violet)] uppercase glow-text">{data.title}</h2>
            <ul className="space-y-4">
              {data.instructions.map((inst, i) => (
                <li key={i} className="flex gap-4 items-start">
                  <span className="text-[var(--color-hud-cyan)] font-bold opacity-70">0{i+1}</span>
                  <span className="opacity-90 leading-relaxed">{inst}</span>
                </li>
              ))}
            </ul>
          </div>

          {/* Images */}
          <div className="space-y-6">
            <div className="border border-[var(--color-hud-cyan)]/30 relative group overflow-hidden bg-black/50">
              <div className="absolute top-2 left-2 bg-[var(--color-hud-bg)] px-2 text-xs opacity-70 font-bold tracking-widest z-10">FORM_ANALYSIS.JPG</div>
              <img src={data.formImage} alt={`${data.title} Form`} className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen" />
            </div>
            
            <div className="border border-[var(--color-hud-violet)]/50 relative group overflow-hidden bg-black/50">
              <div className="absolute top-2 left-2 bg-[var(--color-hud-bg)] px-2 text-xs text-[var(--color-hud-violet)] opacity-70 font-bold tracking-widest z-10">MUSCLE_TARGETS.JPG</div>
              <img src={data.muscleImage} alt={`${data.title} Muscles`} className="w-full h-auto opacity-80 group-hover:opacity-100 transition-opacity mix-blend-screen" />
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}
