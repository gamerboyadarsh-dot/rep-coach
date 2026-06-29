import { useEffect, useState, useRef } from 'react';

export type VoiceCommand = 'start_squats' | 'start_pushups' | 'start_plank' | 'start_jumping_jacks' | 'finish_workout' | null;

export function useVoiceCommand(active: boolean) {
  const [command, setCommand] = useState<VoiceCommand>(null);
  const [isListening, setIsListening] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    if (!active || typeof window === 'undefined') return;

    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      console.warn('Speech recognition not supported in this browser.');
      return;
    }

    const recognition = new SpeechRecognition();
    recognitionRef.current = recognition;
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
      setIsListening(true);
    };

    recognition.onend = () => {
      setIsListening(false);
      // Automatically restart if still active
      if (active) {
        try {
          recognition.start();
        } catch (e) {
          // Ignore
        }
      }
    };

    recognition.onresult = (event: any) => {
      const current = event.resultIndex;
      const transcript = event.results[current][0].transcript.toLowerCase();
      
      console.log('🗣️ Heard:', transcript);

      if (transcript.includes('start squat')) {
        setCommand('start_squats');
      } else if (transcript.includes('start push up') || transcript.includes('start pushup')) {
        setCommand('start_pushups');
      } else if (transcript.includes('start plank')) {
        setCommand('start_plank');
      } else if (transcript.includes('start jumping jack') || transcript.includes('start jack')) {
        setCommand('start_jumping_jacks');
      } else if (transcript.includes('finish') || transcript.includes('stop workout') || transcript.includes('end workout')) {
        setCommand('finish_workout');
      }
    };

    try {
      recognition.start();
    } catch (e) {
      // Ignore
    }

    return () => {
      recognition.stop();
    };
  }, [active]);

  // Reset command after emitting
  useEffect(() => {
    if (command) {
      const t = setTimeout(() => setCommand(null), 1000);
      return () => clearTimeout(t);
    }
  }, [command]);

  return { command, isListening };
}
