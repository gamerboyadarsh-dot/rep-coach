import re

with open('src/index.css', 'r') as f:
    content = f.read()

content = content.replace("rgba(59, 130, 246", "rgba(163, 230, 53")
content = content.replace("#A855F7", "#84cc16") # purple to lime
content = content.replace("#3B82F6", "#a3e635") # blue to lime

# Fix slider colors
content = content.replace("#6366f1", "#84cc16")
content = content.replace("#8b5cf6", "#a3e635")
content = content.replace("#818cf8", "#bef264")
content = content.replace("rgba(99,102,241", "rgba(132,204,22")

with open('src/index.css', 'w') as f:
    f.write(content)
print("CSS colors fixed")
