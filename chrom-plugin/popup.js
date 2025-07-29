document.addEventListener('DOMContentLoaded', () => {
    let allFilesData = [];

    // Setup search functionality
    const searchInput = document.getElementById('search');
    searchInput.addEventListener('input', handleSearch);

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.tabs.sendMessage(tabs[0].id, { action: 'analyzeJavaScript' }, (response) => {
            const resultsDiv = document.getElementById('results');
            const loadingDiv = document.getElementById('loading');
            const noResultsDiv = document.getElementById('no-results');

            if (chrome.runtime.lastError || !response) {
                loadingDiv.textContent = 'Error analyzing JavaScript. Try refreshing the page.';
                return;
            }

            loadingDiv.style.display = 'none';

            if (response.files.length === 0) {
                resultsDiv.innerHTML = '<p>No JavaScript files found on this page.</p>';
                return;
            }

            allFilesData = response.files;
            renderFiles(allFilesData);
        });
    });

    function handleSearch() {
        const searchTerm = searchInput.value.toLowerCase();
        if (!searchTerm) {
            renderFiles(allFilesData);
            document.getElementById('no-results').style.display = 'none';
            return;
        }

        const filteredFiles = allFilesData.map(file => {
            const filteredFile = { ...file };

            // Filter and highlight classes
            if (file.classes) {
                filteredFile.classes = file.classes.filter(cls =>
                    cls.toLowerCase().includes(searchTerm)
                ).map(cls => highlightMatch(cls, searchTerm));
            }

            // Filter and highlight functions
            if (file.globalFunctions) {
                filteredFile.globalFunctions = file.globalFunctions.filter(fn =>
                    fn.toLowerCase().includes(searchTerm)
                ).map(fn => highlightMatch(fn, searchTerm));
            }

            // Filter and highlight variables
            if (file.globalVariables) {
                filteredFile.globalVariables = file.globalVariables.filter(v =>
                    v.toLowerCase().includes(searchTerm)
                ).map(v => highlightMatch(v, searchTerm));
            }

            // Filter and highlight constants
            if (file.globalConstants) {
                filteredFile.globalConstants = file.globalConstants.filter(c =>
                    c.toLowerCase().includes(searchTerm)
                ).map(c => highlightMatch(c, searchTerm));
            }

            return filteredFile;
        }).filter(file => {
            // Keep only files that have matches
            return (
                (file.classes && file.classes.length > 0) ||
                (file.globalFunctions && file.globalFunctions.length > 0) ||
                (file.globalVariables && file.globalVariables.length > 0) ||
                (file.globalConstants && file.globalConstants.length > 0) ||
                (file.url && file.url.toLowerCase().includes(searchTerm))
            );
        });

        if (filteredFiles.length === 0) {
            document.getElementById('results').innerHTML = '';
            document.getElementById('no-results').style.display = 'block';
        } else {
            document.getElementById('no-results').style.display = 'none';
            renderFiles(filteredFiles, true);
        }
    }

    function highlightMatch(text, searchTerm) {
        const index = text.toLowerCase().indexOf(searchTerm);
        if (index === -1) return text;

        const before = text.substring(0, index);
        const match = text.substring(index, index + searchTerm.length);
        const after = text.substring(index + searchTerm.length);

        return `${before}<span class="highlight">${match}</span>${after}`;
    }

    function renderFiles(files, expandAll = false) {
        const resultsDiv = document.getElementById('results');
        resultsDiv.innerHTML = '';

        files.forEach(file => {
            const fileDiv = document.createElement('div');
            fileDiv.className = 'file';

            const header = document.createElement('div');
            header.className = 'file-header';

            // Add match count to header if searching
            const searchTerm = document.getElementById('search').value;
            if (searchTerm) {
                const matchCount = calculateMatchCount(file);
                header.innerHTML = `${file.url || 'Inline Script'} <span class="match-count">${matchCount} matches</span>`;
            } else {
                header.textContent = file.url || 'Inline Script';
            }

            header.onclick = () => {
                const content = fileDiv.querySelector('.file-content');
                content.style.display = content.style.display === 'none' ? 'block' : 'none';
            };

            const content = document.createElement('div');
            content.className = 'file-content';
            content.style.display = expandAll ? 'block' : 'none';

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
    }

    function calculateMatchCount(file) {
        let count = 0;
        if (file.url && document.getElementById('search').value &&
            file.url.toLowerCase().includes(document.getElementById('search').value.toLowerCase())) {
            count++;
        }
        if (file.classes) count += file.classes.length;
        if (file.globalFunctions) count += file.globalFunctions.length;
        if (file.globalVariables) count += file.globalVariables.length;
        if (file.globalConstants) count += file.globalConstants.length;
        return count;
    }

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
            itemDiv.innerHTML = item; // Use innerHTML to preserve highlighting
            section.appendChild(itemDiv);
        });

        return section;
    }
});