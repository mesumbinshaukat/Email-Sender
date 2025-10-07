import os
import re

def fix_complex_patterns(filepath):
    """Fix complex malformed patterns"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()
    
    original = content
    
    # Fix pattern where closing brace is before catch
    # Pattern: "status: 'active'\n    } catch (error) {"
    content = re.sub(
        r"(status: '[^']+'\n\s+)\} catch \(error\) \{",
        r"\1});\n\n    // Additional code here\n\n    res.status(201).json(result);\n  } catch (error) {",
        content
    )
    
    # Fix double try-catch blocks
    lines = content.split('\n')
    fixed_lines = []
    skip_next = False
    
    for i, line in enumerate(lines):
        if skip_next:
            skip_next = False
            continue
            
        # Check for duplicate catch blocks
        if '} catch (error) {' in line and i + 1 < len(lines):
            next_line = lines[i + 1]
            # If next line also has catch, skip this one
            if '} catch (error) {' in next_line:
                continue
        
        fixed_lines.append(line)
    
    content = '\n'.join(fixed_lines)
    
    if content != original:
        with open(filepath, 'w', encoding='utf-8') as f:
            f.write(content)
        return True
    return False

# List of files that still have errors
error_files = [
    'bulkController.js',
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
for filename in error_files:
    filepath = os.path.join(controllers_dir, filename)
    if os.path.exists(filepath):
        if fix_complex_patterns(filepath):
            print(f'Fixed: {filename}')
        else:
            print(f'No changes: {filename}')
