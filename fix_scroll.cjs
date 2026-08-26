const fs = require('fs');
let exSel = fs.readFileSync('src/components/ExerciseSelector.tsx', 'utf8');

if (!exSel.includes('import { ScrollReveal }')) {
  exSel = exSel.replace("import { ExerciseVideo", "import { ScrollReveal } from './ScrollReveal';\nimport { ExerciseVideo");
}

exSel = exSel.replace('<motion.div variants={cardEntrance} className="w-full">', '<ScrollReveal>\n          <motion.div variants={cardEntrance} className="w-full">');
exSel = exSel.replace('</LineChart>\n                </ResponsiveContainer>\n              </div>\n            </div>\n          </motion.div>', '</LineChart>\n                </ResponsiveContainer>\n              </div>\n            </div>\n          </motion.div>\n          </ScrollReveal>');

exSel = exSel.replace('<motion.div variants={cardEntrance} className="flex flex-col items-start surface-raised p-8">', '<ScrollReveal>\n          <motion.div variants={cardEntrance} className="flex flex-col items-start surface-raised p-8">');
exSel = exSel.replace('</motion.div>\n        </div>\n\n        {/* Right Column', '</motion.div>\n          </ScrollReveal>\n        </div>\n\n        {/* Right Column');

// Replace Right Column's first element
exSel = exSel.replace('{/* Right Column */}\n        <div className="lg:col-span-4 flex flex-col gap-6">', '{/* Right Column */}\n        <div className="lg:col-span-4 flex flex-col gap-6">\n          <ScrollReveal>');

exSel = exSel.replace('</Heatmap3D>\n          </motion.div>', '</Heatmap3D>\n          </motion.div>\n          </ScrollReveal>');

exSel = exSel.replace('<motion.div variants={cardEntrance} className="surface-raised p-6 flex flex-col h-full">', '<ScrollReveal>\n          <motion.div variants={cardEntrance} className="surface-raised p-6 flex flex-col h-full">');
exSel = exSel.replace('</div>\n          </motion.div>\n        </div>', '</div>\n          </motion.div>\n          </ScrollReveal>\n        </div>');

fs.writeFileSync('src/components/ExerciseSelector.tsx', exSel);
console.log('ScrollReveal added');
