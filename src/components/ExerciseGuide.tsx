import { useState } from 'react';
import { sfx } from '../lib/sounds';
import { BookOpen, CheckCircle2, Activity, Image as ImageIcon } from 'lucide-react';
import Model from 'react-body-highlighter';
import type { IExerciseData } from 'react-body-highlighter';
import { motion } from 'framer-motion';
import { pageTransition, staggerContainer, cardEntrance, tapEffect } from '../lib/animations';

type GuideTab = 'squat' | 'pushup' | 'jumping_jack' | 'plank';

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
      muscles: [{ name: 'Push-up', muscles: ['chest', 'triceps', 'front-deltoids', 'abs'] }] as IExerciseData[],
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
    },
    plank: {
      title: 'Plank Hold',
      subtitle: 'Core & Total Body Stability',
      formImage: '/images/realistic_plank_form.jpg',
      muscles: [{ name: 'Plank', muscles: ['abs', 'obliques', 'lower-back', 'front-deltoids', 'gluteal'] }] as IExerciseData[],
      instructions: [
        'Get into a push-up position, but resting on your forearms instead of your hands.',
        'Ensure your elbows are directly beneath your shoulders.',
        'Keep your body in a straight line from your head to your heels.',
        'Engage your core by sucking your belly button toward your spine.',
        'Hold this position without letting your hips sag or pike up.'
      ]
    }
  };

  const handleTab = (tab: GuideTab) => {
    sfx.playClick();
    setActiveTab(tab);
  };

  const data = content[activeTab];

  return (
    <motion.div 
      variants={pageTransition} 
      initial="initial" 
      animate="animate" 
      exit="exit" 
      className="flex flex-col items-center min-h-screen pt-28 pb-12 px-6 relative z-10 w-full"
    >
      <div className="w-full max-w-6xl mx-auto">
        
        <div className="flex items-center justify-center gap-4 mb-12">
          <div className="icon-container-active w-16 h-16 rounded-2xl flex items-center justify-center">
            <BookOpen className="w-8 h-8 text-white" />
          </div>
          <h1 className="text-display text-white tracking-tight">Databank</h1>
        </div>

        {/* Tab Navigation */}
        <div className="flex flex-wrap justify-center gap-3 mb-12 surface-raised p-2 rounded-2xl max-w-fit mx-auto border border-white/5">
          {[
            { id: 'squat', label: 'Squats' },
            { id: 'pushup', label: 'Push-ups' },
            { id: 'jumping_jack', label: 'Jumping Jacks' },
            { id: 'plank', label: 'Plank' }
          ].map(tab => (
            <motion.button 
              key={tab.id}
              whileTap={tapEffect}
              onClick={() => handleTab(tab.id as GuideTab)}
              className={`px-6 py-2.5 rounded-xl font-bold transition-all text-sm ${
                activeTab === tab.id 
                  ? 'bg-blue-600 text-white shadow-[0_4px_20px_rgba(37,99,235,0.4)]' 
                  : 'text-slate-400 hover:text-white hover:bg-white/5'
              }`}
            >
              {tab.label}
            </motion.button>
          ))}
        </div>

        <motion.div variants={staggerContainer} initial="initial" animate="animate" className="grid grid-cols-1 lg:grid-cols-12 gap-8">
          
          {/* Instructions Column */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            <motion.div variants={cardEntrance} className="surface-raised p-8 md:p-10">
              <h2 className="text-section mb-2">{data.title}</h2>
              <p className="text-meta text-blue-400 mb-8">{data.subtitle}</p>
              
              <div className="space-y-6">
                {data.instructions.map((inst, i) => (
                  <div key={i} className="flex gap-4 items-start group">
                    <div className="shrink-0 w-8 h-8 rounded-full surface-float flex items-center justify-center text-blue-400 font-bold text-sm border border-white/5 group-hover:border-blue-500/50 transition-colors shadow-inner">
                      {i + 1}
                    </div>
                    <p className="text-body pt-1 group-hover:text-slate-200 transition-colors">{inst}</p>
                  </div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={cardEntrance} className="surface-float p-6 flex items-start gap-4 border border-blue-500/20 shadow-[0_4px_20px_rgba(37,99,235,0.1)]">
              <CheckCircle2 className="w-6 h-6 text-blue-400 shrink-0" />
              <div>
                <h4 className="text-white font-bold mb-1">AI Coach Tip</h4>
                <p className="text-xs text-body leading-relaxed">Ensure you perform these movements at a controlled pace. The AI model tracks your joint angles and velocity—rushing through reps may cause the tracking confidence to drop.</p>
              </div>
            </motion.div>
          </div>

          {/* Images Column */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            <motion.div variants={cardEntrance} className="surface-raised p-2 overflow-hidden group">
              <div className="relative rounded-2xl overflow-hidden aspect-video bg-slate-900 border border-white/5 flex items-center justify-center">
                <div className="absolute top-4 left-4 surface-float px-3 py-1.5 rounded-lg border border-white/10 text-meta flex items-center gap-2 z-10 shadow-xl transition-transform group-hover:-translate-y-1">
                  <ImageIcon className="w-3 h-3 text-blue-400" /> FORM_ANALYSIS
                </div>
                <img src={data.formImage} alt={`${data.title} Form`} className="w-full h-full object-cover opacity-80 group-hover:opacity-100 transition-opacity group-hover:scale-105 duration-700 ease-[0.22,1,0.36,1]" />
              </div>
            </motion.div>
            
            <motion.div variants={cardEntrance} className="surface-raised p-2 overflow-hidden group">
              <div className="relative rounded-2xl overflow-hidden bg-slate-900 border border-white/5 flex items-center justify-center p-8 min-h-[300px]">
                <div className="absolute top-4 left-4 surface-float px-3 py-1.5 rounded-lg border border-white/10 text-meta flex items-center gap-2 z-10 shadow-xl transition-transform group-hover:-translate-y-1">
                  <Activity className="w-3 h-3 text-purple-400" /> INTERACTIVE_TARGETS
                </div>
                <div className="w-full flex justify-around opacity-80 group-hover:opacity-100 transition-opacity duration-700 ease-[0.22,1,0.36,1]">
                  <Model data={data.muscles} type="anterior" style={{ width: '140px' }} highlightedColors={['#3b82f6']} />
                  <Model data={data.muscles} type="posterior" style={{ width: '140px' }} highlightedColors={['#a855f7']} />
                </div>
              </div>
            </motion.div>
          </div>
          
        </motion.div>
      </div>
    </motion.div>
  );
}
