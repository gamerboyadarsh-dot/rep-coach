const fs = require('fs');
let content = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');

// The bottom row (Activity Chart, Target, Heatmap, History) are currently part of the staggerContainer.
// By adding whileInView to them directly, they will override the stagger and fade in on scroll.
const scrollProps = 'initial={{ opacity: 0, y: 40 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true, margin: "-50px" }} transition={{ duration: 0.5, ease: "easeOut" }}';

content = content.replace('<motion.div variants={cardEntrance} className="surface-raised p-8">', '<motion.div ' + scrollProps + ' className="surface-raised p-8">');
content = content.replace('<motion.div variants={cardEntrance} className="flex flex-col items-start surface-raised p-8">', '<motion.div ' + scrollProps + ' className="flex flex-col items-start surface-raised p-8">');
content = content.replace('<motion.div variants={cardEntrance} className="surface-raised p-6 mt-4">', '<motion.div ' + scrollProps + ' className="surface-raised p-6 mt-4">');
content = content.replace('<motion.div variants={cardEntrance} className="surface-raised p-8 flex flex-col h-full">', '<motion.div ' + scrollProps + ' className="surface-raised p-8 flex flex-col h-full">');

fs.writeFileSync('src/components/ExerciseSelector.tsx', content);
console.log('Scroll reveals fixed');
