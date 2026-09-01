/**
 * SmartTask Manager - File Parser
 * Intelligently detects and extracts tasks from various file formats
 */

const Parser = {
    // Main Entry Point
    async parseFile(file) {
        const text = await file.text();
        const extension = file.name.split('.').pop().toLowerCase();

        switch (extension) {
            case 'json':
                return this.parseJSON(text);
            case 'csv':
                return this.parseCSV(text);
            case 'txt':
                return this.parseTXT(text);
            default:
                throw new Error('Unsupported file format');
        }
    },

    parseJSON(text) {
        try {
            const data = JSON.parse(text);
            const tasks = Array.isArray(data) ? data : [data];
            return tasks.map(t => this.standardizeTask(t));
        } catch (e) {
            throw new Error('Invalid JSON format');
        }
    },

    parseCSV(text) {
        // Normalize line endings
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        if (lines.length < 2) return [];

        // Parse headers (handle quoted headers too)
        const rawHeaders = this.splitCSVLine(lines[0]);
        const headers = rawHeaders.map(h => h.trim().toLowerCase().replace(/[^a-z0-9_\s]/g, ''));

        // Smart column mapping — find best column for each field
        const fieldAliases = {
            title:       ['title', 'task', 'name', 'task_name', 'subject', 'topic',
                          'phase_name', 'phasename', 'task title', 'item', 'work item',
                          'summary', 'description_short', 'label'],
            description: ['description', 'desc', 'details', 'notes', 'note',
                          'detail', 'body', 'content', 'info'],
            priority:    ['priority', 'prio', 'importance', 'urgency', 'level'],
            status:      ['status', 'state', 'progress', 'stage', 'phase_status'],
            dueDate:     ['duedate', 'due_date', 'due', 'deadline', 'end_date',
                          'enddate', 'target_date', 'targetdate', 'finish_date',
                          'completion_date', 'due date', 'date'],
            category:    ['category', 'cat', 'type', 'group', 'section', 'phase',
                          'module', 'area', 'domain'],
            tags:        ['tags', 'tag', 'labels', 'keywords', 'skills']
        };

        // Map each field to the best matching header index
        const colMap = {};
        for (const [field, aliases] of Object.entries(fieldAliases)) {
            let bestIndex = -1;
            let bestScore = -1;
            aliases.forEach(alias => {
                const idx = headers.findIndex(h => h === alias || h.includes(alias) || alias.includes(h));
                if (idx !== -1 && bestScore < aliases.indexOf(alias)) {
                    // Earlier in alias list = higher priority
                    if (bestIndex === -1 || aliases.indexOf(alias) < bestScore) {
                        bestIndex = idx;
                        bestScore = aliases.indexOf(alias);
                    }
                }
            });
            if (bestIndex !== -1) colMap[field] = bestIndex;
        }

        // If no title column found, use the column with the most unique values (heuristic)
        if (colMap.title === undefined) {
            const usedCols = new Set(Object.values(colMap));
            // Try columns not already assigned — pick first unused text-like column
            for (let i = 0; i < headers.length; i++) {
                if (!usedCols.has(i)) {
                    colMap.title = i;
                    break;
                }
            }
            // Absolute fallback: first column
            if (colMap.title === undefined) colMap.title = 0;
        }

        const tasks = [];
        for (let i = 1; i < lines.length; i++) {
            if (!lines[i].trim()) continue;
            const values = this.splitCSVLine(lines[i]);

            const get = (field) => {
                const idx = colMap[field];
                return idx !== undefined ? (values[idx] || '').trim() : '';
            };

            // Build description from all unmapped columns
            const mappedCols = new Set(Object.values(colMap));
            const extraParts = headers
                .map((h, idx) => ({ h, idx, val: (values[idx] || '').trim() }))
                .filter(({ idx, val }) => !mappedCols.has(idx) && val)
                .map(({ idx, val }) => `${rawHeaders[idx] || headers[idx]}: ${val}`);

            const descBase = get('description');
            const fullDesc = [descBase, ...extraParts].filter(Boolean).join(' | ');

            tasks.push(this.standardizeTask({
                title:       get('title'),
                description: fullDesc,
                priority:    get('priority'),
                status:      get('status'),
                dueDate:     get('dueDate'),
                category:    get('category'),
                tags:        get('tags')
            }));
        }
        return tasks;
    },

    // Splits a CSV line respecting quoted fields
    splitCSVLine(line) {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                inQuotes = !inQuotes;
            } else if (ch === ',' && !inQuotes) {
                result.push(current);
                current = '';
            } else {
                current += ch;
            }
        }
        result.push(current);
        return result;
    },

    parseTXT(text) {
        const lines = text.split('\n');
        return lines
            .filter(line => line.trim().length > 0)
            .map(line => this.smartParseLine(line.trim()));
    },

    // Smart NLP-like Parsing
    smartParseLine(line) {
        let title = line;
        let priority = 'Medium';
        let status = 'Pending';
        let dueDate = new Date().toISOString().split('T')[0];

        // 1. Detect Priority [HIGH], [LOW], etc.
        const priorityMatch = line.match(/\[(LOW|MEDIUM|HIGH|CRITICAL)\]/i);
        if (priorityMatch) {
            priority = priorityMatch[1].charAt(0).toUpperCase() + priorityMatch[1].slice(1).toLowerCase();
            title = title.replace(priorityMatch[0], '').trim();
        }

        // 2. Detect Status [DONE], [PENDING]
        const statusMatch = line.match(/\[(DONE|PENDING|IN PROGRESS|CANCELLED)\]/i);
        if (statusMatch) {
            const statusStr = statusMatch[1].toUpperCase();
            status = statusStr === 'DONE' ? 'Completed' :
                     statusStr === 'IN PROGRESS' ? 'In Progress' :
                     statusStr === 'CANCELLED' ? 'Cancelled' : 'Pending';
            title = title.replace(statusMatch[0], '').trim();
        }

        // 3. Detect Due Dates "by September 5", "on 2026-09-05", "due 05/09/2026"
        const dateMatch = line.match(/(?:by|on|due)\s+([A-Z][a-z]+\s+\d{1,2}|\d{4}-\d{2}-\d{2}|\d{2}\/\d{2}\/\d{4})/i);
        if (dateMatch) {
            const extractedDate = dateMatch[1];
            if (extractedDate.includes('-')) {
                dueDate = extractedDate;
            } else if (extractedDate.includes('/')) {
                const [d, m, y] = extractedDate.split('/');
                dueDate = `${y}-${m.padStart(2, '0')}-${d.padStart(2, '0')}`;
            } else {
                const parsed = new Date(`${extractedDate} ${new Date().getFullYear()}`);
                if (!isNaN(parsed)) dueDate = parsed.toISOString().split('T')[0];
            }
            title = title.replace(dateMatch[0], '').trim();
        }

        // 4. Handle "tomorrow"
        if (line.toLowerCase().includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDate = tomorrow.toISOString().split('T')[0];
            title = title.replace(/tomorrow/i, '').trim();
        }

        return {
            title: title || 'Untitled Task',
            priority,
            status,
            dueDate,
            description: '',
            category: 'Imported',
            tags: 'imported'
        };
    },

    standardizeTask(raw) {
        return {
            title: raw.title || raw.name || 'Untitled Task',
            description: raw.description || raw.desc || '',
            priority: this.validatePriority(raw.priority),
            status: this.validateStatus(raw.status),
            dueDate: raw.dueDate || raw.due || new Date().toISOString().split('T')[0],
            category: raw.category || 'General',
            tags: raw.tags || ''
        };
    },

    validatePriority(p) {
        const valid = ['Low', 'Medium', 'High', 'Critical'];
        if (!p) return 'Medium';
        const found = valid.find(v => v.toLowerCase() === p.toLowerCase());
        return found || 'Medium';
    },

    validateStatus(s) {
        const valid = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
        if (!s) return 'Pending';
        const found = valid.find(v => v.toLowerCase() === s.toLowerCase());
        return found || 'Pending';
    }
};

export default Parser;
