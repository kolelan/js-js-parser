// Listen for messages from the popup
chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.action === 'analyzeJavaScript') {
        analyzeJavaScript().then(result => {
            sendResponse(result);
        });
        return true; // Required to use sendResponse asynchronously
    }
});

async function analyzeJavaScript() {
    const scripts = Array.from(document.querySelectorAll('script'));
    const results = [];

    for (const script of scripts) {
        if (script.src) {
            // External script
            try {
                const response = await fetch(script.src);
                const code = await response.text();
                const analysis = analyzeCode(code);
                results.push({
                    url: script.src,
                    ...analysis
                });
            } catch (error) {
                console.error(`Failed to fetch ${script.src}:`, error);
                results.push({
                    url: script.src,
                    error: 'Failed to fetch script'
                });
            }
        } else {
            // Inline script
            const analysis = analyzeCode(script.textContent);
            results.push({
                url: null,
                ...analysis
            });
        }
    }

    // Also analyze the global scope
    const globalAnalysis = analyzeGlobalScope();
    results.push({
        url: 'Global Scope',
        ...globalAnalysis
    });

    return { files: results };
}

function analyzeCode(code) {
    // This is a simplified analyzer - in a real extension you'd want a proper JavaScript parser
    const classes = [];
    const globalFunctions = [];
    const globalVariables = [];
    const globalConstants = [];

    // Very basic regex patterns (not perfect but works for demonstration)
    const classRegex = /class\s+([A-Za-z0-9_]+)/g;
    const functionRegex = /function\s+([A-Za-z0-9_]+)\s*\(/g;
    const varRegex = /(?:var|let)\s+([A-Za-z0-9_]+)\s*[=;]/g;
    const constRegex = /const\s+([A-Za-z0-9_]+)\s*=/g;

    // Find classes
    let match;
    while ((match = classRegex.exec(code)) !== null) {
        classes.push(match[1]);
    }

    // Find global functions
    while ((match = functionRegex.exec(code)) !== null) {
        globalFunctions.push(match[1]);
    }

    // Find global variables
    while ((match = varRegex.exec(code)) !== null) {
        globalVariables.push(match[1]);
    }

    // Find global constants
    while ((match = constRegex.exec(code)) !== null) {
        globalConstants.push(match[1]);
    }

    return {
        classes: [...new Set(classes)],
        globalFunctions: [...new Set(globalFunctions)],
        globalVariables: [...new Set(globalVariables)],
        globalConstants: [...new Set(globalConstants)]
    };
}

function analyzeGlobalScope() {
    const globalFunctions = [];
    const globalVariables = [];

    // Get all properties of the window object
    for (const prop in window) {
        if (window.hasOwnProperty(prop)) {
            if (typeof window[prop] === 'function') {
                globalFunctions.push(prop);
            } else {
                globalVariables.push(prop);
            }
        }
    }

    return {
        globalFunctions: globalFunctions.sort(),
        globalVariables: globalVariables.sort()
    };
}