import { useState } from 'react';
import { sfx } from '../lib/sounds';
import { BookOpen, CheckCircle2, Activity, Image as ImageIcon } from 'lucide-react';
import Model from 'react-body-highlighter';
import type { IExerciseData } from 'react-body-highlighter';

type GuideTab = 'squat' | 'pushup' | 'jumping_jack';

export function ExerciseGuide() {
  const [activeTab, setActiveTab] = useState<GuideTab>('squat');

  const content = {
    squat: {
      title: 'Bodyweight Squat',
      subtitle: 'Lower Body & Core Stability',
      formImage: '/images/realistic_squat_form.jpg',
      muscles: [{ name: 'Squat', muscles: ['gluteal', 'quadriceps', 'hamstring', 'calves'] }] as IExerciseData[],
      instructions: [
        'Stand with feet shoulder-width apart.',
        'Keep your back straight and chest up.',
        'Lower your hips until your thighs are at least parallel to the floor (90 degree angle at the knee).',
        'Ensure your knees track over your toes, avoiding valgus collapse.',
        'Push through your heels to ascend back to a standing position.'
      ]
    },
    pushup: {
      title: 'Tactical Push-up',
      subtitle: 'Upper Body Strength & Endurance',
      formImage: '/images/realistic_pushup_form.jpg',
      muscles: [{ name: 'Push-up', muscles: ['chest', 'triceps', 'front-deltoids', 'abdominals'] }] as IExerciseData[],
      instructions: [
        'Assume a plank position with hands slightly wider than shoulder-width.',
        'Keep your body in a straight line from head to heels.',
        'Lower your body until your elbows reach a 90-degree angle.',
        'Keep elbows tucked in (not flared out at 90 degrees to your body).',
        'Push back up to the starting position.'
      ]
    },
    jumping_jack: {
      title: 'Jumping Jacks',
      subtitle: 'Cardio Intensity & Coordination',
      formImage: '/images/realistic_jumping_jack_form.jpg',
      muscles: [{ name: 'Jumping Jacks', muscles: ['calves', 'gluteal', 'front-deltoids', 'back-deltoids'] }] as IExerciseData[],
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
    <div className="flex flex-col items-center min-h-screen pt-28 pb-12 px-6 relative z-10 overflow-y-auto w-full">
      <div className="w-full max-w-6xl mx-auto">
        
        <div className="flex items-center justify-center gap-3 mb-10">
          <BookOpen className="w-8 h-8 text-blue-500" />
          <h1 className="text-4xl font-black text-white tracking-tight">Databank</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-4 mb-10">
          {[
            { id: 'squat', label: 'Squats' },
            { id: 'pushup', label: 'Push-ups' },
            { id: 'jumping_jack', label: 'Jumping Jacks' }
          ].map(tab => (
            <button 
              key={tab.id}
              onClick={() => handleTab(tab.id as GuideTab)}
              className={`px-6 py-3 rounded-2xl font-bold transition-all shadow-lg ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-blue-500/25 scale-105' 
                  : 'bg-slate-800/50 text-slate-400 hover:text-white border border-slate-700/50 hover:border-slate-600'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Instructions Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-8 rounded-3xl shadow-2xl">
              <h2 className="text-3xl font-bold text-white mb-2">{data.title}</h2>
              <p className="text-blue-400 font-semibold mb-8 uppercase tracking-widest text-sm">{data.subtitle}</p>
              
              <div className="space-y-6">
                {data.instructions.map((inst, i) => (
                  <div key={i} className="flex gap-4 items-start">
                    <div className="shrink-0 w-8 h-8 rounded-full bg-slate-800 border border-slate-700 flex items-center justify-center text-blue-400 font-bold text-sm">
                      {i + 1}
                    </div>
                    <p className="text-slate-300 leading-relaxed pt-1">{inst}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gradient-to-r from-blue-500/10 to-purple-500/10 border border-blue-500/20 p-6 rounded-3xl flex items-start gap-4 shadow-lg">
              <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h4 className="text-white font-bold mb-1">AI Coach Tip</h4>
                <p className="text-sm text-slate-400 leading-relaxed">Ensure you perform these movements at a controlled pace. The AI model tracks your joint angles and velocity—rushing through reps may cause the tracking confidence to drop.</p>
              </div>
            </div>
          </div>

          {/* Images Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-8 left-8 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white font-bold tracking-widest flex items-center gap-2 z-10 shadow-lg transition-transform group-hover:-translate-y-1">
                <ImageIcon className="w-3 h-3 text-blue-400" /> FORM_ANALYSIS.JPG
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-800 aspect-video flex items-center justify-center">
                <img src={data.formImage} alt={`${data.title} Form`} className="w-full h-full object-cover opacity-90 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-500" />
              </div>
            </div>
            
            <div className="bg-slate-900/60 backdrop-blur-xl border border-slate-700/50 p-6 rounded-3xl shadow-2xl relative overflow-hidden group">
              <div className="absolute top-8 left-8 bg-slate-900/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-slate-700 text-xs text-white font-bold tracking-widest flex items-center gap-2 z-10 shadow-lg transition-transform group-hover:-translate-y-1">
                <Activity className="w-3 h-3 text-purple-400" /> INTERACTIVE_TARGETS
              </div>
              <div className="rounded-2xl overflow-hidden border border-slate-800 bg-slate-800 flex items-center justify-center p-4">
                <div className="w-full flex justify-around opacity-90 group-hover:opacity-100 transition-opacity duration-500 max-h-[300px]">
                  <Model data={data.muscles} type="anterior" style={{ width: '120px', padding: '1rem' }} highlightedColors={['#0ea5e9']} />
                  <Model data={data.muscles} type="posterior" style={{ width: '120px', padding: '1rem' }} highlightedColors={['#8b5cf6']} />
                </div>
              </div>
            </div>
          </div>
          
        </div>
      </div>
    </div>
  );
}
