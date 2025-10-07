#!/usr/bin/env python3
import re
import os

def fix_controller_comprehensive(filepath):
    """Comprehensively fix all malformed patterns in a controller file"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original_content = content
    
    # Pattern 1: Fix broken object creation followed by catch
    # Example: "status: 'pending'\n    });\n    }\n\n    // Generate DKIM keys"
    content = re.sub(
        r"(status: '[^']+'\n\s+\}\);)\n\s+\}\n\n\s+//",
        r"\1\n\n    //",
        content
    )
    
    # Pattern 2: Fix broken generateKeyPairSync followed by catch
    content = re.sub(
        r"(\}\n\s+\})\n\s+\} catch \(error\) \{",
        r"\1);\n\n    // Continue with rest of function\n\n    res.json(result);\n  } catch (error) {",
        content
    )
    
    # Pattern 3: Fix indentation issues in object literals
    content = re.sub(
        r"(\n)(  )(\w+: \{)",
        r"\1    \3",
        content
    )
    
    # Pattern 4: Fix broken if statements with throw
    content = re.sub(
        r"if \(!(\w+)\) \{\n\s+res\.status\(404\);\n\s+throw new Error\('([^']+)'\);\n\s+\}",
        r"if (!\1) {\n      return res.status(404).json({ message: '\2' });\n    }",
        content
    )
    
    # Pattern 5: Fix double closing braces before catch
    content = re.sub(
        r"\}\s+\} catch \(error\) \{",
        r"  } catch (error) {",
        content
    )
    
    # Pattern 6: Fix missing opening brace after try
    lines = content.split('\n')
    fixed_lines = []
    i = 0
    
    while i < len(lines):
        line = lines[i]
        
        # If we see "try {" followed by unindented code
        if 'try {' in line and i + 1 < len(lines):
            next_line = lines[i + 1]
            # Check if next line needs more indentation
            if next_line.strip() and not next_line.startswith('    ') and next_line.strip().startswith('const'):
                fixed_lines.append(line)
                # Fix indentation for all lines until catch
                i += 1
                while i < len(lines) and '} catch' not in lines[i]:
                    if lines[i].strip():
                        # Add 2 more spaces if not already properly indented
                        if not lines[i].startswith('    '):
                            fixed_lines.append('  ' + lines[i])
                        else:
                            fixed_lines.append(lines[i])
                    else:
                        fixed_lines.append(lines[i])
                    i += 1
                continue
        
        fixed_lines.append(line)
        i += 1
    
    content = '\n'.join(fixed_lines)
    
    # Final cleanup: ensure proper structure for broken functions
    # Fix pattern where code appears after closing brace
    content = re.sub(
        r"(\};)\n\n(\s+//[^\n]+\n\s+\w+)",
        r"\1\n\n  \2",
        content
    )
    
    if content != original_content:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# Files to fix
error_files = [
    'emailAuthenticationController.js',
    'gamificationController.js',
    'inboxPreviewController.js',
    'predictiveAnalyticsController.js',
    'sendTimeOptimizationController.js',
    'smartTriggersController.js',
    'workflowController.js'
]

controllers_dir = 'backend/controllers'
fixed_count = 0

for filename in error_files:
    filepath = os.path.join(controllers_dir, filename)
    if os.path.exists(filepath):
        if fix_controller_comprehensive(filepath):
            print(f'Fixed: {filename}')
            fixed_count += 1
        else:
            print(f'No changes: {filename}')

print(f'\nTotal files modified: {fixed_count}')
