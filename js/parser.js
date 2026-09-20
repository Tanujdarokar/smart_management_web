/**
 * SmartTask Manager - File Parser
 * Intelligently detects and extracts tasks from various file formats
 */

const Parser = {
    // Main Entry Point
    async parseFile(file) {
        const extension = file.name.split('.').pop().toLowerCase();

        if (['xlsx', 'xls'].includes(extension)) {
            return this.parseExcel(file);
        }

        const text = await file.text();

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

    async parseExcel(file) {
        let XLSX;
        try {
            XLSX = await import('xlsx');
        } catch (error) {
            XLSX = await import('https://cdn.jsdelivr.net/npm/xlsx@0.18.5/+esm');
        }

        const buffer = await file.arrayBuffer();
        const workbook = XLSX.read(buffer, { type: 'array' });

        const candidates = workbook.SheetNames.map(sheetName => {
            const worksheet = workbook.Sheets[sheetName];
            const rows = XLSX.utils.sheet_to_json(worksheet, { raw: false, defval: '', blankrows: false });
            return { sheetName, rows, score: this.scoreSheetForTasks(rows) };
        }).filter(item => item.score > 0 && Array.isArray(item.rows) && item.rows.length > 0);

        const selectedRows = candidates.length > 0
            ? candidates.sort((a, b) => b.score - a.score).flatMap(item => item.rows)
            : workbook.SheetNames.map(sheetName => XLSX.utils.sheet_to_json(workbook.Sheets[sheetName], { raw: false, defval: '', blankrows: false })).flat();

        const taskRows = selectedRows.filter(row => row && Object.values(row).some(value => String(value ?? '').trim()));
        if (taskRows.length === 0) return [];

        return this.assignSequentialDueDates(
            taskRows
                .map(row => this.taskFromRowObject(row))
                .filter(task => task && task.title && task.title !== 'Untitled Task')
        );
    },

    scoreSheetForTasks(rows) {
        if (!Array.isArray(rows) || rows.length === 0) return 0;

        let score = 0;
        const summaryTriggers = ['overall', 'total problems', 'attempted', 'solved without hints', 'progress summary'];

        rows.forEach(row => {
            if (!row || typeof row !== 'object') return;

            const textValues = Object.values(row).map(value => String(value ?? '').trim().toLowerCase()).filter(Boolean);
            const joinedText = textValues.join(' ');

            if (summaryTriggers.some(trigger => joinedText.includes(trigger))) {
                score -= 25;
            }

            const normalizedKeys = Object.keys(row).map(key => this.normalizeFieldName(key));
            for (const key of normalizedKeys) {
                if (['title', 'task', 'name', 'question', 'topic', 'status', 'priority', 'difficulty', 'level', 'date', 'duedate', 'revisitdate', 'notes', 'attempted', 'solvedwithouthints', 'description'].includes(key)) {
                    score += 5;
                }
            }

            if (textValues.some(value => /two sum|design a url shortener|arrays & hashing|system design/.test(value))) {
                score += 10;
            }
        });

        return score;
    },

    taskFromRowObject(row) {
        const fieldAliases = {
            title: ['title', 'task', 'name', 'task_name', 'subject', 'topic', 'question',
                'phase_name', 'phasename', 'task title', 'item', 'work item', 'summary',
                'description_short', 'label'],
            description: ['description', 'desc', 'details', 'notes', 'note', 'detail', 'body', 'content', 'info'],
            priority: ['priority', 'prio', 'importance', 'urgency', 'level', 'difficulty'],
            status: ['status', 'state', 'progress', 'stage', 'phase_status', 'attempted', 'solvedwithouthints'],
            dueDate: ['duedate', 'due_date', 'due', 'deadline', 'end_date', 'enddate', 'target_date', 'targetdate', 'finish_date', 'completion_date', 'due date', 'date', 'revisitdate', 'revisit'],
            category: ['category', 'cat', 'type', 'group', 'section', 'phase', 'module', 'area', 'domain', 'dsatopic', 'topic'],
            tags: ['tags', 'tag', 'labels', 'keywords', 'skills', 'company', 'maangfaang', 'topstartups', 'topmncs']
        };

        const rawEntries = Object.entries(row || {}).filter(([, value]) => value !== undefined && value !== null);
        const normalizedEntries = rawEntries.map(([key, value]) => [this.normalizeFieldName(key), value]);

        const getValue = (field) => {
            const aliases = fieldAliases[field].map(alias => this.normalizeFieldName(alias));
            let bestMatch = { score: -1, value: '' };

            for (const [key, value] of normalizedEntries) {
                for (const alias of aliases) {
                    let score = 0;
                    if (key === alias) score = 100;
                    else if (key.includes(alias) || alias.includes(key)) score = 60;

                    if (score > bestMatch.score) {
                        bestMatch = { score, value: String(value ?? '').trim() };
                    }
                }
            }

            return bestMatch.value;
        };

        const matchedKeys = new Set();
        for (const field of Object.keys(fieldAliases)) {
            const aliases = fieldAliases[field].map(alias => this.normalizeFieldName(alias));
            for (const [key] of normalizedEntries) {
                for (const alias of aliases) {
                    if (key === alias || key.includes(alias) || alias.includes(key)) {
                        matchedKeys.add(key);
                    }
                }
            }
        }

        const extraParts = normalizedEntries
            .filter(([key]) => !matchedKeys.has(key))
            .map(([key, value]) => `${this.titleCaseKey(key)}: ${String(value ?? '').trim()}`)
            .filter(part => part && !part.endsWith(': '));

        const titleValue = getValue('title') || this.firstMeaningfulValue(rawEntries.filter(([key, value]) => {
            const normalizedKey = this.normalizeFieldName(key);
            return normalizedKey && normalizedKey !== '#' && !/^\d+$/.test(String(value ?? '').trim());
        }));
        const descriptionValue = [getValue('description'), ...extraParts].filter(Boolean).join(' | ');

        const explicitDueDate = getValue('dueDate');
        const normalizedPriority = this.normalizePriority(getValue('priority'));
        const normalizedStatus = this.normalizeStatus(getValue('status'));

        return this.standardizeTask({
            title: titleValue,
            description: descriptionValue,
            priority: normalizedPriority,
            status: normalizedStatus,
            dueDate: explicitDueDate || null,
            category: getValue('category') || 'General',
            tags: getValue('tags') || '',
            _dueDateMissing: !explicitDueDate
        });
    },

    detectExcelDate(row) {
        const values = Object.values(row || {});
        for (const value of values) {
            if (typeof value === 'string' && /\d{4}-\d{2}-\d{2}/.test(value.trim())) return value.trim();
        }
        return this.toLocalDateString(new Date());
    },

    normalizePriority(value) {
        const v = String(value || '').trim().toLowerCase();
        if (!v) return 'Medium';
        if (['easy', 'low', 'minor'].includes(v)) return 'Low';
        if (['medium', 'moderate', 'normal'].includes(v)) return 'Medium';
        if (['hard', 'high', 'critical', 'urgent'].includes(v)) return 'High';
        if (['easy', 'medium', 'hard', 'low', 'high'].includes(v)) return v.charAt(0).toUpperCase() + v.slice(1);
        return this.validatePriority(value);
    },

    normalizeStatus(value) {
        const v = String(value || '').trim().toLowerCase();
        if (!v) return 'Pending';
        if (['yes', 'done', 'completed', 'solved', 'finished', 'success', 'passed'].includes(v)) return 'Completed';
        if (['in progress', 'progressing', 'working', 'active', 'partial'].includes(v)) return 'In Progress';
        if (['no', 'pending', 'not started', 'not attempted', 'todo', 'backlog'].includes(v)) return 'Pending';
        if (['cancelled', 'canceled', 'rejected'].includes(v)) return 'Cancelled';
        return this.validateStatus(value);
    },

    firstMeaningfulValue(entries) {
        for (const [key, value] of entries) {
            const text = String(value ?? '').trim();
            const normalizedKey = this.normalizeFieldName(key);
            if (!text || /^\d+$/.test(text) || normalizedKey === '#' || normalizedKey === 'id') continue;
            return text;
        }
        return 'Untitled Task';
    },

    titleCaseKey(value) {
        return String(value || '')
            .replace(/[_-]+/g, ' ')
            .replace(/\s+/g, ' ')
            .trim()
            .replace(/\b\w/g, char => char.toUpperCase());
    },

    parseJSON(text) {
        try {
            const data = JSON.parse(text);
            const tasks = Array.isArray(data) ? data : [data];
            return this.assignSequentialDueDates(tasks.map(t => this.standardizeTask(t)));
        } catch (e) {
            throw new Error('Invalid JSON format');
        }
    },

    parseCSV(text) {
        // Normalize line endings
        const lines = text.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
        const nonEmptyLines = lines.filter(line => line.trim());
        if (nonEmptyLines.length < 2) return [];

        const delimiter = this.detectDelimiter(nonEmptyLines);

        // Parse headers (handle quoted headers too)
        const rawHeaders = this.splitCSVLine(nonEmptyLines[0], delimiter);
        const headers = rawHeaders.map(h => this.normalizeFieldName(h));

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
            const normalizedAliases = aliases.map(alias => this.normalizeFieldName(alias));
            let bestIndex = -1;
            let bestScore = Number.MAX_SAFE_INTEGER;

            headers.forEach((header, idx) => {
                const candidateScore = normalizedAliases.findIndex(alias => {
                    return header === alias || header.includes(alias) || alias.includes(header);
                });

                if (candidateScore !== -1 && candidateScore < bestScore) {
                    bestIndex = idx;
                    bestScore = candidateScore;
                }
            });

            if (bestIndex !== -1) colMap[field] = bestIndex;
        }

        // If no title column found, use the column with the most unique values (heuristic)
        if (colMap.title === undefined) {
            const usedCols = new Set(Object.values(colMap));
            for (let i = 0; i < headers.length; i++) {
                if (!usedCols.has(i)) {
                    colMap.title = i;
                    break;
                }
            }
            if (colMap.title === undefined) colMap.title = 0;
        }

        const tasks = [];
        for (let i = 1; i < nonEmptyLines.length; i++) {
            const values = this.splitCSVLine(nonEmptyLines[i], delimiter);
            const paddedValues = [...values];
            while (paddedValues.length < headers.length) paddedValues.push('');

            const get = (field) => {
                const idx = colMap[field];
                return idx !== undefined ? (paddedValues[idx] || '').trim() : '';
            };

            const mappedCols = new Set(Object.values(colMap));
            const extraParts = [];

            for (let idx = 0; idx < Math.max(headers.length, paddedValues.length); idx++) {
                const label = rawHeaders[idx] || headers[idx] || `Column ${idx + 1}`;
                const value = (paddedValues[idx] || '').trim();

                if (!mappedCols.has(idx) && value) {
                    extraParts.push(`${label}: ${value}`);
                }
            }

            const descBase = get('description');
            const fullDesc = [descBase, ...extraParts].filter(Boolean).join(' | ');

            const rawDueDate = get('dueDate');
            tasks.push(this.standardizeTask({
                title:       get('title'),
                description: fullDesc,
                priority:    get('priority'),
                status:      get('status'),
                dueDate:     rawDueDate || null,
                category:    get('category'),
                tags:        get('tags'),
                _dueDateMissing: !rawDueDate
            }));
        }
        return this.assignSequentialDueDates(tasks);
    },

    assignSequentialDueDates(tasks, startDate = new Date()) {
        const pointer = new Date(startDate);
        pointer.setHours(0, 0, 0, 0);

        return tasks.map(task => {
            const normalizedDate = this.normalizeDueDate(task?.dueDate);
            if (normalizedDate && !(task?._dueDateMissing === true)) {
                task.dueDate = normalizedDate;
                delete task._dueDateMissing;
                return task;
            }

            const current = new Date(pointer);
            task.dueDate = this.toLocalDateString(current);
            pointer.setDate(pointer.getDate() + 1);
            delete task._dueDateMissing;
            return task;
        });
    },

    toLocalDateString(date) {
        const local = new Date(date);
        const year = local.getFullYear();
        const month = String(local.getMonth() + 1).padStart(2, '0');
        const day = String(local.getDate()).padStart(2, '0');
        return `${year}-${month}-${day}`;
    },

    normalizeDueDate(value) {
        if (value === null || value === undefined) return null;
        const text = String(value).trim();
        if (!text || /^\d+$/.test(text)) return null;

        if (/^\d{4}-\d{2}-\d{2}$/.test(text)) return text;
        if (/^\d{4}\/\d{2}\/\d{2}$/.test(text)) return text.replace(/\//g, '-');
        if (/^\d{2}\/\d{2}\/\d{4}$/.test(text)) {
            const [day, month, year] = text.split('/');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }
        if (/^\d{2}-\d{2}-\d{4}$/.test(text)) {
            const [day, month, year] = text.split('-');
            return `${year}-${month.padStart(2, '0')}-${day.padStart(2, '0')}`;
        }

        const parsed = new Date(text);
        if (!isNaN(parsed.getTime())) return this.toLocalDateString(parsed);
        return null;
    },

    detectDelimiter(lines) {
        const candidates = [',', ';', '\t', '|'];
        const best = { delimiter: ',', score: -1 };

        for (const delimiter of candidates) {
            let score = 0;
            for (const line of lines) {
                let inQuotes = false;
                for (let i = 0; i < line.length; i++) {
                    const ch = line[i];
                    if (ch === '"') {
                        inQuotes = !inQuotes;
                    } else if (ch === delimiter && !inQuotes) {
                        score++;
                    }
                }
            }
            if (score > best.score) {
                best.delimiter = delimiter;
                best.score = score;
            }
        }

        return best.delimiter;
    },

    normalizeFieldName(value) {
        return String(value || '')
            .trim()
            .toLowerCase()
            .replace(/[^a-z0-9]+/g, '');
    },

    // Splits a CSV-like line respecting quoted fields and a chosen delimiter
    splitCSVLine(line, delimiter = ',') {
        const result = [];
        let current = '';
        let inQuotes = false;
        for (let i = 0; i < line.length; i++) {
            const ch = line[i];
            if (ch === '"') {
                if (inQuotes && line[i + 1] === '"') {
                    current += '"';
                    i++;
                } else {
                    inQuotes = !inQuotes;
                }
            } else if (ch === delimiter && !inQuotes) {
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
        return this.assignSequentialDueDates(
            lines
                .filter(line => line.trim().length > 0)
                .map(line => this.smartParseLine(line.trim()))
        );
    },

    // Smart NLP-like Parsing
    smartParseLine(line) {
        let title = line;
        let priority = 'Medium';
        let status = 'Pending';
        let dueDate = null;
        let dueDateMissing = true;

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
                if (!isNaN(parsed)) dueDate = this.toLocalDateString(parsed);
            }
            dueDateMissing = !dueDate;
            title = title.replace(dateMatch[0], '').trim();
        }

        // 4. Handle "tomorrow"
        if (line.toLowerCase().includes('tomorrow')) {
            const tomorrow = new Date();
            tomorrow.setDate(tomorrow.getDate() + 1);
            dueDate = this.toLocalDateString(tomorrow);
            dueDateMissing = false;
            title = title.replace(/tomorrow/i, '').trim();
        }

        return {
            title: title || 'Untitled Task',
            priority,
            status,
            dueDate,
            description: '',
            category: 'Imported',
            tags: 'imported',
            _dueDateMissing: dueDateMissing
        };
    },

    standardizeTask(raw) {
        const explicitDueDate = raw.dueDate ?? raw.due ?? null;
        const hasMissingDueDate = raw._dueDateMissing === true || (!explicitDueDate && raw.dueDate === undefined && raw.due === undefined);

        return {
            title: raw.title || raw.name || 'Untitled Task',
            description: raw.description || raw.desc || '',
            priority: this.validatePriority(raw.priority),
            status: this.validateStatus(raw.status),
            dueDate: explicitDueDate || (hasMissingDueDate ? null : this.toLocalDateString(new Date())),
            category: raw.category || 'General',
            tags: raw.tags || '',
            _dueDateMissing: hasMissingDueDate
        };
    },

    validatePriority(p) {
        const valid = ['Low', 'Medium', 'High', 'Critical'];
        if (!p) return 'Medium';
        const normalized = String(p).trim();
        if (normalized.toLowerCase() === 'easy') return 'Low';
        if (normalized.toLowerCase() === 'medium') return 'Medium';
        if (normalized.toLowerCase() === 'hard') return 'High';
        const found = valid.find(v => v.toLowerCase() === normalized.toLowerCase());
        return found || 'Medium';
    },

    validateStatus(s) {
        const valid = ['Pending', 'In Progress', 'Completed', 'Cancelled'];
        if (!s) return 'Pending';
        const normalized = String(s).trim();
        if (normalized.toLowerCase() === 'yes') return 'Completed';
        if (normalized.toLowerCase() === 'no') return 'Pending';
        const found = valid.find(v => v.toLowerCase() === normalized.toLowerCase());
        return found || 'Pending';
    }
};

export default Parser;
