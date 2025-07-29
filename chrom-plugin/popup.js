document.addEventListener('DOMContentLoaded', () => {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'analyzeJavaScript' }, (response) => {
            const resultsDiv = document.getElementById('results');
            const loadingDiv = document.getElementById('loading');

            if (chrome.runtime.lastError || !response) {
                loadingDiv.textContent = 'Error analyzing JavaScript. Try refreshing the page.';
                return;
            }

            loadingDiv.style.display = 'none';

            if (response.files.length === 0) {
                resultsDiv.innerHTML = '<p>No JavaScript files found on this page.</p>';
                return;
            }

            response.files.forEach(file => {
                const fileDiv = document.createElement('div');
                fileDiv.className = 'file';

                const header = document.createElement('div');
                header.className = 'file-header';
                header.textContent = file.url || 'Inline Script';
                header.onclick = () => {
                    const content = fileDiv.querySelector('.file-content');
                    content.style.display = content.style.display === 'none' ? 'block' : 'none';
                };

                const content = document.createElement('div');
                content.className = 'file-content';

                if (file.classes && file.classes.length > 0) {
                    const classesSection = createSection('Classes', file.classes);
                    content.appendChild(classesSection);
                }

                if (file.globalFunctions && file.globalFunctions.length > 0) {
                    const funcsSection = createSection('Global Functions', file.globalFunctions);
                    content.appendChild(funcsSection);
                }

                if (file.globalVariables && file.globalVariables.length > 0) {
                    const varsSection = createSection('Global Variables', file.globalVariables);
                    content.appendChild(varsSection);
                }

                if (file.globalConstants && file.globalConstants.length > 0) {
                    const constsSection = createSection('Global Constants', file.globalConstants);
                    content.appendChild(constsSection);
                }

                fileDiv.appendChild(header);
                fileDiv.appendChild(content);
                resultsDiv.appendChild(fileDiv);
            });
        });
    });
});

function createSection(title, items) {
    const section = document.createElement('div');
    section.className = 'section';

    const header = document.createElement('div');
    header.className = 'section-header';
    header.textContent = title;

    section.appendChild(header);

    items.forEach(item => {
        const itemDiv = document.createElement('div');
        itemDiv.className = 'item';
        itemDiv.textContent = item;
        section.appendChild(itemDiv);
    });

    return section;
}