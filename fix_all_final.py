import os
import subprocess

# List of files that need fixing
error_files = [
    'ecommerceController.js',
    'emailAuthenticationController.js',
    'gamificationController.js',
    'inboxPreviewController.js',
    'predictiveAnalyticsController.js',
    'sendTimeOptimizationController.js',
    'slackController.js',
    'smartTriggersController.js',
    'workflowController.js'
]

controllers_dir = 'backend/controllers'

def check_syntax(filepath):
    """Check if file has syntax errors"""
    result = subprocess.run(['node', '--check', filepath], capture_output=True, text=True)
    return result.returncode == 0

def fix_indentation(filepath):
    """Fix indentation issues in try-catch blocks"""
    with open(filepath, 'r', encoding='utf-8') as f:
        lines = f.readlines()
    
    fixed_lines = []
    i = 0
    while i < len(lines):
        line = lines[i]
        
        # Check for "try {" followed by unindented code
        if 'try {' in line and i + 1 < len(lines):
            next_line = lines[i + 1]
            # If next line starts with "  const" instead of "    const", it needs fixing
            if next_line.startswith('  const') or next_line.startswith('  let') or next_line.startswith('  var'):
                fixed_lines.append(line)
                # Add proper indentation to following lines until we hit catch
                i += 1
                while i < len(lines) and '} catch' not in lines[i]:
                    if lines[i].strip() and not lines[i].startswith('    '):
                        # Add 2 more spaces
                        fixed_lines.append('  ' + lines[i])
                    else:
                        fixed_lines.append(lines[i])
                    i += 1
                continue
        
        # Fix broken forEach with catch
        if 'forEach' in line and i + 1 < len(lines) and '} catch' in lines[i + 1]:
            # Close the forEach properly
            fixed_lines.append(line.rstrip() + '\n')
            fixed_lines.append('    });\n')
            fixed_lines.append('\n')
            fixed_lines.append('    res.json(result);\n')
            i += 2  # Skip the broken catch line
            continue
        
        # Fix lines with "} catch" that should be "  } catch"
        if line.strip().startswith('} catch') and not line.startswith('  }'):
            fixed_lines.append('  } catch (error) {\n')
            i += 1
            continue
        
        fixed_lines.append(line)
        i += 1
    
    with open(filepath, 'w', encoding='utf-8') as f:
        f.writelines(fixed_lines)

print("Fixing remaining controllers...")
for filename in error_files:
    filepath = os.path.join(controllers_dir, filename)
    if os.path.exists(filepath):
        print(f"\nProcessing: {filename}")
        
        # Try to fix
        fix_indentation(filepath)
        
        # Check if fixed
        if check_syntax(filepath):
            print(f"✅ {filename} - FIXED")
        else:
            print(f"❌ {filename} - Still has errors")

print("\n\nFinal check of all controllers...")
all_pass = True
for file in os.listdir(controllers_dir):
    if file.endswith('.js'):
        filepath = os.path.join(controllers_dir, file)
        if not check_syntax(filepath):
            print(f"❌ {file}")
            all_pass = False

if all_pass:
    print("\n✅✅✅ ALL CONTROLLERS PASS SYNTAX CHECK! ✅✅✅")
else:
    print("\n❌ Some controllers still have errors")
