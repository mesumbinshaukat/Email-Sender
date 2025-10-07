import os
import re

def fix_controller(filepath):
    """Fix malformed try-catch blocks in controller files"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Pattern 1: Fix "async (req, res) => { try {" to proper format
    content = re.sub(
        r'= async \(req, res\) => \{ try \{',
        '= async (req, res) => {\n  try {',
        content
    )
    
    # Pattern 2: Fix "}  } catch (error) { res.status(500).json({ message: 'Server error', error: error.message }); } };"
    content = re.sub(
        r'\}  \} catch \(error\) \{ res\.status\(500\)\.json\(\{ message: \'Server error\', error: error\.message \}\); \} \};',
        '  } catch (error) {\n    res.status(500).json({ message: \'Server error\', error: error.message });\n  }\n};',
        content
    )
    
    # Pattern 3: Fix lines that end with }  } catch
    content = re.sub(
        r'(\n)(\s*)\}  \} catch \(error\) \{([^\n]+)\};',
        r'\1\2  } catch (error) {\3\n\2  }\n\2};',
        content
    )
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Fix all controllers
controllers_dir = 'backend/controllers'
fixed_count = 0

for filename in os.listdir(controllers_dir):
    if filename.endswith('.js'):
        filepath = os.path.join(controllers_dir, filename)
        if fix_controller(filepath):
            print(f'Fixed: {filename}')
            fixed_count += 1

print(f'\nTotal files fixed: {fixed_count}')
