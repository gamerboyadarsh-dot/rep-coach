import re

with open('src/index.css', 'r') as f:
    content = f.read()

# Replace the shimmer keyframes with a sweep and a pause
shimmer_new = '''
@keyframes shimmer {
  0% { transform: translateX(-100%); opacity: 0; }
  10% { opacity: 1; }
  40% { transform: translateX(100%); opacity: 0; }
  100% { transform: translateX(100%); opacity: 0; }
}
'''
content = re.sub(r'@keyframes shimmer \{\n  100% \{ transform: translateX\(100%\); \}\n\}', shimmer_new.strip(), content)

with open('src/index.css', 'w') as f:
    f.write(content)
print("Shimmer fixed")
