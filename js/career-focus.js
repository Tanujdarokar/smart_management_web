import Storage from './storage.js';
import Utils from './utils.js';

// Curated MNC & Top Startup Directory with Direct Career Portal URLs
export const CURATED_COMPANIES = [
    // ══════════════════════════════════════════════
    // Top MNCs & Big Tech Giants (FAANG / Fortune 500)
    // ══════════════════════════════════════════════
    {
        name: 'Google',
        careerUrl: 'https://careers.google.com',
        type: 'MNC',
        domain: 'Cloud, Search & AI',
        tags: ['MNC', 'FAANG', 'AI / Cloud'],
        description: 'Global technology leader in search, AI, cloud computing, Android, and hardware.'
    },
    {
        name: 'Microsoft',
        careerUrl: 'https://careers.microsoft.com',
        type: 'MNC',
        domain: 'Enterprise, Azure & AI',
        tags: ['MNC', 'Enterprise', 'AI / Cloud'],
        description: 'Empowering digital transformation across enterprise software, Windows, and Azure cloud.'
    },
    {
        name: 'Amazon',
        careerUrl: 'https://www.amazon.jobs',
        type: 'MNC',
        domain: 'AWS, E-Commerce & Logistics',
        tags: ['MNC', 'FAANG', 'Cloud'],
        description: 'World-scale cloud infrastructure (AWS) and global customer fulfillment operations.'
    },
    {
        name: 'Apple',
        careerUrl: 'https://jobs.apple.com',
        type: 'MNC',
        domain: 'Hardware, iOS & Services',
        tags: ['MNC', 'FAANG', 'Consumer Tech'],
        description: 'Pioneering consumer electronics, operating systems, Apple Silicon, and digital services.'
    },
    {
        name: 'Meta',
        careerUrl: 'https://www.metacareers.com',
        type: 'MNC',
        domain: 'Social Tech, VR & AI',
        tags: ['MNC', 'FAANG', 'Social & AI'],
        description: 'Connecting billions of people across Instagram, WhatsApp, Facebook, Quest, and Llama AI.'
    },
    {
        name: 'Netflix',
        careerUrl: 'https://jobs.netflix.com',
        type: 'MNC',
        domain: 'Streaming & Distributed Systems',
        tags: ['MNC', 'FAANG', 'Media & Tech'],
        description: 'Leading global streaming entertainment service with cutting-edge engineering culture.'
    },
    {
        name: 'NVIDIA',
        careerUrl: 'https://www.nvidia.com/en-us/about-nvidia/careers/',
        type: 'MNC',
        domain: 'AI Compute & GPU Architecture',
        tags: ['MNC', 'AI & Hardware'],
        description: 'The engine of generative AI, accelerated computing, CUDA, and deep learning platforms.'
    },
    {
        name: 'Adobe',
        careerUrl: 'https://careers.adobe.com',
        type: 'MNC',
        domain: 'Creative Cloud & Document Tech',
        tags: ['MNC', 'Creative SaaS'],
        description: 'Revolutionizing creative media, digital publishing, Photoshop, and enterprise marketing.'
    },
    {
        name: 'Salesforce',
        careerUrl: 'https://careers.salesforce.com',
        type: 'MNC',
        domain: 'CRM, Enterprise & Data Cloud',
        tags: ['MNC', 'Enterprise SaaS'],
        description: 'World #1 customer relationship management, Slack, Tableau, and enterprise cloud platform.'
    },
    {
        name: 'Uber',
        careerUrl: 'https://www.uber.com/careers',
        type: 'MNC',
        domain: 'Mobility, Delivery & Logistics',
        tags: ['MNC', 'Mobility & Scale'],
        description: 'Transforming urban transit and global delivery with real-time algorithmic platforms.'
    },
    {
        name: 'Oracle',
        careerUrl: 'https://www.oracle.com/corporate/careers/',
        type: 'MNC',
        domain: 'Cloud Infrastructure & Database',
        tags: ['MNC', 'Database & Cloud'],
        description: 'Mission-critical enterprise software, database management, and high-performance OCI cloud.'
    },
    {
        name: 'Cisco',
        careerUrl: 'https://jobs.cisco.com',
        type: 'MNC',
        domain: 'Networking & Cybersecurity',
        tags: ['MNC', 'Security & Networks'],
        description: 'Powering the Internet infrastructure, telecommunications, and enterprise threat protection.'
    },
    {
        name: 'IBM',
        careerUrl: 'https://www.ibm.com/careers',
        type: 'MNC',
        domain: 'Hybrid Cloud & Enterprise AI',
        tags: ['MNC', 'Enterprise & Consulting'],
        description: 'Hybrid cloud transformation via Red Hat, quantum computing, and watsonx enterprise AI.'
    },
    {
        name: 'Intel',
        careerUrl: 'https://jobs.intel.com',
        type: 'MNC',
        domain: 'Semiconductors & Foundry',
        tags: ['MNC', 'Hardware'],
        description: 'Global semiconductor innovation, x86 silicon manufacturing, and chip architecture.'
    },
    {
        name: 'AMD',
        careerUrl: 'https://www.amd.com/en/corporate/careers',
        type: 'MNC',
        domain: 'High-Performance Computing & GPUs',
        tags: ['MNC', 'Hardware', 'AI / Cloud'],
        description: 'High-performance computing chips, Ryzen processors, and Instinct AI accelerators.'
    },
    {
        name: 'Qualcomm',
        careerUrl: 'https://www.qualcomm.com/company/careers',
        type: 'MNC',
        domain: 'Wireless Tech, 5G & Snapdragon',
        tags: ['MNC', 'Wireless & Hardware'],
        description: 'Pioneering mobile processors, 5G wireless technology, and edge computing chips.'
    },
    {
        name: 'Broadcom',
        careerUrl: 'https://www.broadcom.com/company/careers',
        type: 'MNC',
        domain: 'Enterprise Virtualization & Silicon',
        tags: ['MNC', 'Hardware & Cloud'],
        description: 'Infrastructure software, VMware cloud solutions, and semiconductor technology.'
    },
    {
        name: 'ServiceNow',
        careerUrl: 'https://careers.servicenow.com',
        type: 'MNC',
        domain: 'Enterprise Workflow Automation',
        tags: ['MNC', 'Enterprise SaaS'],
        description: 'Making the world work better for everyone through cloud-based digital workflow platforms.'
    },
    {
        name: 'Atlassian',
        careerUrl: 'https://www.atlassian.com/company/careers',
        type: 'MNC',
        domain: 'Developer Tools & Collaboration',
        tags: ['MNC', 'Developer Tools'],
        description: 'Powering team collaboration with Jira, Confluence, Trello, and Bitbucket.'
    },
    {
        name: 'Spotify',
        careerUrl: 'https://www.lifeatspotify.com/jobs',
        type: 'MNC',
        domain: 'Audio Streaming & Recommendation AI',
        tags: ['MNC', 'Media & Tech'],
        description: 'Leading global audio streaming subscription service revolutionizing music and podcasts.'
    },
    {
        name: 'PayPal',
        careerUrl: 'https://careers.pypl.com',
        type: 'MNC',
        domain: 'Global Digital Payments & Commerce',
        tags: ['MNC', 'Fintech'],
        description: 'Digital payment platform enabling hundreds of millions of consumers and merchants globally.'
    },
    {
        name: 'Intuit',
        careerUrl: 'https://jobs.intuit.com',
        type: 'MNC',
        domain: 'Financial SaaS, TurboTax & QuickBooks',
        tags: ['MNC', 'Fintech & SaaS'],
        description: 'Global financial technology platform powering prosperity with TurboTax, Credit Karma, and QuickBooks.'
    },
    {
        name: 'LinkedIn',
        careerUrl: 'https://careers.linkedin.com',
        type: 'MNC',
        domain: 'Professional Network & Graph Systems',
        tags: ['MNC', 'Social & Big Data'],
        description: 'World’s largest professional network connecting global professionals to make them more productive.'
    },
    {
        name: 'SAP',
        careerUrl: 'https://jobs.sap.com',
        type: 'MNC',
        domain: 'Enterprise ERP & Supply Chain',
        tags: ['MNC', 'Enterprise SaaS'],
        description: 'Market leader in enterprise application software, helping companies of all sizes run at their best.'
    },
    {
        name: 'Workday',
        careerUrl: 'https://www.workday.com/en-us/company/careers.html',
        type: 'MNC',
        domain: 'Cloud HR & Financial Management',
        tags: ['MNC', 'Enterprise SaaS'],
        description: 'Leading provider of enterprise cloud applications for finance, HR, and planning.'
    },
    {
        name: 'Palantir',
        careerUrl: 'https://www.palantir.com/careers',
        type: 'MNC',
        domain: 'Defense Tech, Foundry & Big Data',
        tags: ['MNC', 'Data & AI', 'Enterprise'],
        description: 'Building software that empowers organizations to effectively integrate their data, decisions, and operations.'
    },

    // ══════════════════════════════════════════════
    // Premier Financial Tech & Banking MNCs
    // ══════════════════════════════════════════════
    {
        name: 'Goldman Sachs',
        careerUrl: 'https://www.goldmansachs.com/careers',
        type: 'MNC',
        domain: 'Fintech & Investment Banking',
        tags: ['MNC', 'Fintech'],
        description: 'High-frequency algorithmic trading, quantitative finance, and wealth technology.'
    },
    {
        name: 'JPMorgan Chase',
        careerUrl: 'https://careers.jpmorgan.com',
        type: 'MNC',
        domain: 'Global Banking & Financial Tech',
        tags: ['MNC', 'Fintech'],
        description: 'World-leading financial services firm investing billions annually in modern technology.'
    },
    {
        name: 'Morgan Stanley',
        careerUrl: 'https://www.morganstanley.com/careers',
        type: 'MNC',
        domain: 'Wealth Tech & Investment Banking',
        tags: ['MNC', 'Fintech'],
        description: 'Global financial services leader advising, originating, and managing capital worldwide.'
    },
    {
        name: 'Bloomberg',
        careerUrl: 'https://www.bloomberg.com/careers',
        type: 'MNC',
        domain: 'Financial Data & Realtime Terminal',
        tags: ['MNC', 'Fintech & Media'],
        description: 'Delivering business and financial information, news, and insights via the Bloomberg Terminal.'
    },
    {
        name: 'BlackRock',
        careerUrl: 'https://careers.blackrock.com',
        type: 'MNC',
        domain: 'Asset Management & Aladdin Platform',
        tags: ['MNC', 'Fintech'],
        description: 'World’s largest asset manager powered by the Aladdin unified investment platform.'
    },
    {
        name: 'Visa',
        careerUrl: 'https://usa.visa.com/careers.html',
        type: 'MNC',
        domain: 'Global Payments Network & Cryptography',
        tags: ['MNC', 'Fintech & Payments'],
        description: 'World leader in digital payments, facilitating transactions between consumers, merchants, and banks.'
    },
    {
        name: 'Mastercard',
        careerUrl: 'https://careers.mastercard.com',
        type: 'MNC',
        domain: 'Payment Processing & Cyber Intelligence',
        tags: ['MNC', 'Fintech & Payments'],
        description: 'Global technology company in the payments industry connecting billions of transactions.'
    },

    // ══════════════════════════════════════════════
    // Global IT & Consulting MNCs
    // ══════════════════════════════════════════════
    {
        name: 'Accenture',
        careerUrl: 'https://www.accenture.com/careers',
        type: 'MNC',
        domain: 'Global IT Consulting & Cloud',
        tags: ['MNC', 'IT & Consulting'],
        description: 'Global professional services company with leading capabilities in digital, cloud, and security.'
    },
    {
        name: 'TCS',
        careerUrl: 'https://www.tcs.com/careers',
        type: 'MNC',
        domain: 'Enterprise IT Services & Automation',
        tags: ['MNC', 'Global IT & Services'],
        description: 'Tata Consultancy Services: India’s flagship IT services and consulting powerhouse.'
    },
    {
        name: 'Infosys',
        careerUrl: 'https://www.infosys.com/careers',
        type: 'MNC',
        domain: 'Digital Services & AI Consulting',
        tags: ['MNC', 'Global IT & Services'],
        description: 'Global leader in next-generation digital services, consulting, and enterprise AI.'
    },
    {
        name: 'Wipro',
        careerUrl: 'https://careers.wipro.com',
        type: 'MNC',
        domain: 'Cloud Transformation & Cybersecurity',
        tags: ['MNC', 'IT & Consulting'],
        description: 'Leading global information technology, consulting, and business process services company.'
    },
    {
        name: 'Cognizant',
        careerUrl: 'https://careers.cognizant.com',
        type: 'MNC',
        domain: 'Modern Software & Digital Engineering',
        tags: ['MNC', 'IT & Consulting'],
        description: 'Engineering modern businesses to improve everyday life through cloud and AI technology.'
    },

    // ══════════════════════════════════════════════
    // Frontier AI & DeepTech Unicorn Startups
    // ══════════════════════════════════════════════
    {
        name: 'OpenAI',
        careerUrl: 'https://openai.com/careers',
        type: 'Top startup',
        domain: 'Generative AI & Frontier Models',
        tags: ['Top startup', 'AI Research'],
        description: 'Creators of ChatGPT, GPT-4, Sora, and pioneers of artificial general intelligence (AGI).'
    },
    {
        name: 'Anthropic',
        careerUrl: 'https://www.anthropic.com/careers',
        type: 'Top startup',
        domain: 'Constitutional AI & Safety',
        tags: ['Top startup', 'AI Research'],
        description: 'AI safety and research company building the Claude family of intelligent models.'
    },
    {
        name: 'Scale AI',
        careerUrl: 'https://scale.com/careers',
        type: 'Top startup',
        domain: 'Data Engine for Generative AI',
        tags: ['Top startup', 'AI Infrastructure'],
        description: 'Providing the data infrastructure for the world’s leading generative AI models and enterprises.'
    },
    {
        name: 'Hugging Face',
        careerUrl: 'https://huggingface.co/jobs',
        type: 'Top startup',
        domain: 'Open Source Machine Learning & Hub',
        tags: ['Top startup', 'AI Community'],
        description: 'The platform where the machine learning community collaborates on models, datasets, and apps.'
    },
    {
        name: 'Cohere',
        careerUrl: 'https://cohere.com/careers',
        type: 'Top startup',
        domain: 'Enterprise LLMs & Neural Search',
        tags: ['Top startup', 'AI / Cloud'],
        description: 'Enterprise AI platform providing world-class LLMs and multilingual search capabilities.'
    },
    {
        name: 'Perplexity AI',
        careerUrl: 'https://www.perplexity.ai/careers',
        type: 'Top startup',
        domain: 'Conversational Answer Engine',
        tags: ['Top startup', 'AI Search'],
        description: 'AI-first conversational search engine providing direct, cited answers to complex queries.'
    },
    {
        name: 'Mistral AI',
        careerUrl: 'https://mistral.ai/jobs',
        type: 'Top startup',
        domain: 'Open Weight Frontier Models',
        tags: ['Top startup', 'AI Research'],
        description: 'European AI champion building state-of-the-art open and commercial language models.'
    },
    {
        name: 'Databricks',
        careerUrl: 'https://www.databricks.com/company/careers',
        type: 'Top startup',
        domain: 'Data Lakehouse & Apache Spark',
        tags: ['Top startup', 'Data & AI'],
        description: 'Unified lakehouse platform unifying data engineering, governance, BI, and ML models.'
    },

    // ══════════════════════════════════════════════
    // High-Growth Global Unicorns & SaaS
    // ══════════════════════════════════════════════
    {
        name: 'Stripe',
        careerUrl: 'https://stripe.com/jobs',
        type: 'Top startup',
        domain: 'Financial Infrastructure & Billing',
        tags: ['Top startup', 'Fintech'],
        description: 'Developer-first payment processing and financial infrastructure for the internet.'
    },
    {
        name: 'Figma',
        careerUrl: 'https://www.figma.com/careers',
        type: 'Top startup',
        domain: 'Collaborative Design Platform',
        tags: ['Top startup', 'Design & Web'],
        description: 'Browser-native collaborative interface design, FigJam whiteboard, and Dev Mode.'
    },
    {
        name: 'Canva',
        careerUrl: 'https://www.canva.com/careers',
        type: 'Top startup',
        domain: 'Visual Communication & Design',
        tags: ['Top startup', 'Productivity'],
        description: 'Empowering the world to design everything from social graphics to presentations.'
    },
    {
        name: 'Notion',
        careerUrl: 'https://www.notion.so/careers',
        type: 'Top startup',
        domain: 'Connected Workspace & Docs',
        tags: ['Top startup', 'Productivity & AI'],
        description: 'All-in-one productivity workspace for notes, projects, wikis, and team collaboration.'
    },
    {
        name: 'Airbnb',
        careerUrl: 'https://careers.airbnb.com',
        type: 'Top startup',
        domain: 'Travel & Global Marketplace',
        tags: ['Top startup', 'Consumer Tech'],
        description: 'Online marketplace connecting travelers with unique accommodations worldwide.'
    },
    {
        name: 'Snowflake',
        careerUrl: 'https://careers.snowflake.com',
        type: 'Top startup',
        domain: 'Cloud Data Warehouse',
        tags: ['Top startup', 'Data Infrastructure'],
        description: 'Cloud-native data warehouse enabling massive concurrent data processing and analytics.'
    },
    {
        name: 'Discord',
        careerUrl: 'https://discord.com/careers',
        type: 'Top startup',
        domain: 'Realtime Voice & Chat Platform',
        tags: ['Top startup', 'Realtime Systems'],
        description: 'Low-latency voice, video, and text communication platform for global communities.'
    },
    {
        name: 'Linear',
        careerUrl: 'https://linear.app/careers',
        type: 'Top startup',
        domain: 'Modern Software Project Tracker',
        tags: ['Top startup', 'Developer Tools'],
        description: 'Streamlined issue tracking and product roadmap tool beloved by high-growth startups.'
    },
    {
        name: 'Vercel',
        careerUrl: 'https://vercel.com/careers',
        type: 'Top startup',
        domain: 'Frontend Cloud & Next.js',
        tags: ['Top startup', 'Developer Platform'],
        description: 'Creators of Next.js providing the ultimate developer experience for modern web apps.'
    },
    {
        name: 'Supabase',
        careerUrl: 'https://supabase.com/careers',
        type: 'Top startup',
        domain: 'Open Source Firebase Alternative',
        tags: ['Top startup', 'Developer Tools'],
        description: 'Open source Postgres platform with instant REST, GraphQL, Auth, and Realtime.'
    },
    {
        name: 'Retool',
        careerUrl: 'https://retool.com/careers',
        type: 'Top startup',
        domain: 'Low-Code Internal Tools Platform',
        tags: ['Top startup', 'Developer Tools'],
        description: 'Fast way to build internal tools, connect to any database, and deploy custom workflows.'
    },
    {
        name: 'Airtable',
        careerUrl: 'https://airtable.com/careers',
        type: 'Top startup',
        domain: 'Connected App Platform & Databases',
        tags: ['Top startup', 'Productivity'],
        description: 'Low-code platform for building collaborative applications and relational databases.'
    },
    {
        name: 'Miro',
        careerUrl: 'https://miro.com/careers',
        type: 'Top startup',
        domain: 'Visual Workspace for Innovation',
        tags: ['Top startup', 'Productivity'],
        description: 'Visual collaboration platform enabling distributed teams to innovate and plan together.'
    },
    {
        name: 'GitLab',
        careerUrl: 'https://about.gitlab.com/jobs',
        type: 'Top startup',
        domain: 'The DevSecOps Platform',
        tags: ['Top startup', 'Developer Tools'],
        description: 'Single application for the entire software development lifecycle, from planning to deployment.'
    },
    {
        name: 'Brex',
        careerUrl: 'https://www.brex.com/careers',
        type: 'Top startup',
        domain: 'Corporate Cards & Spend Management',
        tags: ['Top startup', 'Fintech'],
        description: 'AI-powered spend management, corporate credit cards, and global travel platform.'
    },
    {
        name: 'Ramp',
        careerUrl: 'https://ramp.com/careers',
        type: 'Top startup',
        domain: 'Finance Automation & Corporate Cards',
        tags: ['Top startup', 'Fintech'],
        description: 'Ultimate finance platform designed to save businesses time and money with corporate cards.'
    },
    {
        name: 'DoorDash',
        careerUrl: 'https://careers.doordash.com',
        type: 'Top startup',
        domain: 'Local Commerce & Logistics',
        tags: ['Top startup', 'Logistics'],
        description: 'Connecting consumers with their favorite local businesses across 30+ countries.'
    },
    {
        name: 'Instacart',
        careerUrl: 'https://instacart.careers',
        type: 'Top startup',
        domain: 'Online Grocery & Delivery Tech',
        tags: ['Top startup', 'E-Commerce'],
        description: 'Leading grocery technology company in North America partnering with grocers.'
    },
    {
        name: 'ByteDance',
        careerUrl: 'https://jobs.bytedance.com',
        type: 'Top startup',
        domain: 'Content Discovery & Algorithms',
        tags: ['Top startup', 'Social & Big Data'],
        description: 'Global tech company operating TikTok, creating content platforms that inform and inspire.'
    },
    {
        name: 'Postman',
        careerUrl: 'https://www.postman.com/careers',
        type: 'Top startup',
        domain: 'API Lifecycle & Development',
        tags: ['Top startup', 'Developer Platform'],
        description: 'Industry-standard collaboration platform for building, testing, and managing APIs.'
    },

    // ══════════════════════════════════════════════
    // Top High-Growth Asian / Indian Tech Unicorns
    // ══════════════════════════════════════════════
    {
        name: 'Razorpay',
        careerUrl: 'https://razorpay.com/jobs',
        type: 'Top startup',
        domain: 'Fintech, Neo-banking & Payments',
        tags: ['Top startup', 'Fintech'],
        description: 'India’s premier payment gateway and banking suite for modern businesses.'
    },
    {
        name: 'Swiggy',
        careerUrl: 'https://careers.swiggy.com',
        type: 'Top startup',
        domain: 'On-Demand Delivery & Instamart',
        tags: ['Top startup', 'Logistics & Tech'],
        description: 'Leading hyper-local convenience and food delivery platform serving millions daily.'
    },
    {
        name: 'Zomato',
        careerUrl: 'https://www.zomato.com/careers',
        type: 'Top startup',
        domain: 'FoodTech & Blinkit Quick Commerce',
        tags: ['Top startup', 'E-Commerce'],
        description: 'Pioneering restaurant discovery, food delivery, and 10-minute quick commerce with Blinkit.'
    },
    {
        name: 'Zepto',
        careerUrl: 'https://www.zeptonow.com/careers',
        type: 'Top startup',
        domain: 'Quick Commerce & Micro-Warehousing',
        tags: ['Top startup', 'Logistics'],
        description: 'Fastest-growing quick commerce unicorn startup revolutionizing 10-minute grocery delivery.'
    },
    {
        name: 'Zerodha',
        careerUrl: 'https://zerodha.com/careers',
        type: 'Top startup',
        domain: 'Discount Broking & Fintech',
        tags: ['Top startup', 'Fintech'],
        description: 'Bootstrapped fintech giant driving India’s retail capital markets and trading tech.'
    },
    {
        name: 'CRED',
        careerUrl: 'https://cred.club/careers',
        type: 'Top startup',
        domain: 'Fintech & High-Trust Ecosystem',
        tags: ['Top startup', 'Fintech'],
        description: 'Rewarding creditworthy individuals with premium lifestyle and financial products.'
    },
    {
        name: 'Flipkart',
        careerUrl: 'https://www.flipkartcareers.com',
        type: 'Top startup',
        domain: 'E-Commerce & Supply Chain Tech',
        tags: ['Top startup', 'E-Commerce'],
        description: 'India’s homegrown e-commerce marketplace leading customer tech and supply chain scale.'
    },
    {
        name: 'PhonePe',
        careerUrl: 'https://www.phonepe.com/careers',
        type: 'Top startup',
        domain: 'Digital Payments & Financial Services',
        tags: ['Top startup', 'Fintech'],
        description: 'Leading digital payments company processing billions of UPI transactions monthly.'
    },
    {
        name: 'Meesho',
        careerUrl: 'https://www.meesho.io/jobs',
        type: 'Top startup',
        domain: 'Social Commerce & Retail Tech',
        tags: ['Top startup', 'E-Commerce'],
        description: 'Empowering small businesses and millions of customers through democratized e-commerce.'
    }
];

let state = {
    search: '',
    selectedTag: 'all',
    sortBy: 'recommended',
    trackedApplications: [],
    unifiedCompanies: []
};

if (typeof document !== 'undefined') {
    document.addEventListener('DOMContentLoaded', () => {
        Utils.renderSidebar('career-focus');
        initEventListeners();
        refreshData();
    });
}

function currentUserId() {
    const user = Storage.getCurrentUser() || Storage.getGuestUser();
    return user.id;
}

function initEventListeners() {
    // Search input
    const searchInput = document.getElementById('careerSearch');
    if (searchInput) {
        searchInput.addEventListener('input', (e) => {
            state.search = e.target.value.trim().toLowerCase();
            renderCompanyGrid();
        });
    }

    // Sort select
    const sortSelect = document.getElementById('careerSort');
    if (sortSelect) {
        sortSelect.addEventListener('change', (e) => {
            state.sortBy = e.target.value;
            renderCompanyGrid();
        });
    }

    // Filter Chips
    const chipsContainer = document.getElementById('careerTagChips');
    if (chipsContainer) {
        chipsContainer.addEventListener('click', (e) => {
            const chip = e.target.closest('.career-chip');
            if (!chip) return;
            chipsContainer.querySelectorAll('.career-chip').forEach(c => c.classList.remove('active'));
            chip.classList.add('active');
            state.selectedTag = chip.dataset.tag || 'all';
            renderCompanyGrid();
        });
    }

    // Quick Paste Banner Form
    const quickPasteForm = document.getElementById('quickPasteForm');
    if (quickPasteForm) {
        quickPasteForm.addEventListener('submit', handleQuickPaste);
    }

    // Modal Events
    const openModalBtn = document.getElementById('openAddCareerModalBtn');
    if (openModalBtn) {
        openModalBtn.addEventListener('click', () => openTrackModal());
    }

    const closeModalBtn = document.getElementById('closeCareerModal');
    if (closeModalBtn) {
        closeModalBtn.addEventListener('click', closeTrackModal);
    }

    const cancelModalBtn = document.getElementById('cancelCareerEdit');
    if (cancelModalBtn) {
        cancelModalBtn.addEventListener('click', closeTrackModal);
    }

    const careerForm = document.getElementById('careerFocusForm');
    if (careerForm) {
        careerForm.addEventListener('submit', handleSaveCompany);
    }

    // Grid Action Delegation
    const grid = document.getElementById('careerGrid');
    if (grid) {
        grid.addEventListener('click', handleGridAction);
    }

    // Close on Escape or backdrop click
    const modal = document.getElementById('careerFocusModal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target.id === 'careerFocusModal') closeTrackModal();
        });
    }
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') closeTrackModal();
    });
}

export function refreshData() {
    const userId = currentUserId();
    state.trackedApplications = Storage.getCompanyApplications(userId) || [];
    state.unifiedCompanies = buildUnifiedCompanies(CURATED_COMPANIES, state.trackedApplications);
    updateStats();
    renderCompanyGrid();
}

/**
 * Merges curated companies with user-tracked applications from Company Tracker.
 * If user pasted a URL in Company Tracker, it shows up here seamlessly.
 */
export function buildUnifiedCompanies(curatedList, trackedList) {
    const result = [];
    const matchedTrackedIds = new Set();

    // 1. Process Curated List & check if user has tracked them
    for (const item of curatedList) {
        const itemLower = item.name.trim().toLowerCase();
        const tracked = trackedList.find(app => {
            const appName = String(app.company || '').trim().toLowerCase();
            return appName === itemLower;
        });

        if (tracked) {
            matchedTrackedIds.add(tracked.id);
            result.push({
                ...item,
                careerUrl: tracked.companyUrl || item.careerUrl,
                jobUrl: tracked.jobUrl || '',
                isTracked: true,
                pinned: tracked.pinned === true,
                status: tracked.status || 'Interested',
                role: tracked.role || '',
                location: tracked.location || '',
                notes: tracked.notes || '',
                trackedId: tracked.id,
                appliedDate: tracked.appliedDate || '',
                updatedAt: tracked.updatedAt || tracked.createdAt || '',
                source: 'both' // Curated + Tracked by user
            });
        } else {
            result.push({
                ...item,
                jobUrl: '',
                isTracked: false,
                pinned: false,
                status: null,
                role: '',
                location: '',
                notes: '',
                trackedId: null,
                appliedDate: '',
                updatedAt: '',
                source: 'curated'
            });
        }
    }

    // 2. Add ANY company from Company Tracker that was NOT in the curated list!
    // This directly fulfills: "and if user also paste the URl in company tracker it will also show into this"
    for (const app of trackedList) {
        if (!matchedTrackedIds.has(app.id)) {
            const hasUrl = Boolean(app.companyUrl || app.jobUrl);
            const appType = app.companyType || 'MNC'; // default or custom
            const tags = ['From Company Tracker'];
            if (app.companyType) {
                tags.push(app.companyType);
            }
            if (app.pinned) {
                tags.push('Pinned');
            }

            result.push({
                name: app.company,
                careerUrl: app.companyUrl || app.jobUrl || '',
                jobUrl: app.jobUrl || '',
                type: appType,
                domain: app.location || (hasUrl ? 'Pasted Career URL' : 'Tracked Company'),
                tags,
                description: app.notes || (app.role ? `Tracked role: ${app.role}` : 'Added via Company Tracker.'),
                isTracked: true,
                pinned: app.pinned === true,
                status: app.status || 'Interested',
                role: app.role || '',
                location: app.location || '',
                notes: app.notes || '',
                trackedId: app.id,
                appliedDate: app.appliedDate || '',
                updatedAt: app.updatedAt || app.createdAt || '',
                source: 'tracker-only'
            });
        }
    }

    return result;
}

function updateStats() {
    const list = state.unifiedCompanies;
    const totalCount = list.length;
    const mncCount = list.filter(c => c.type === 'MNC' || c.tags.includes('MNC')).length;
    const startupCount = list.filter(c => c.type === 'Top startup' || c.tags.includes('Top startup')).length;
    const trackedCount = list.filter(c => c.isTracked).length;

    const elTotal = document.getElementById('statTotalCompanies');
    if (elTotal) elTotal.textContent = String(totalCount);

    const elMnc = document.getElementById('statMncCount');
    if (elMnc) elMnc.textContent = String(mncCount);

    const elStartup = document.getElementById('statStartupCount');
    if (elStartup) elStartup.textContent = String(startupCount);

    const elTracked = document.getElementById('statTrackedCount');
    if (elTracked) elTracked.textContent = String(trackedCount);

    // Update chip counts
    updateChipBadge('all', totalCount);
    updateChipBadge('mnc', mncCount);
    updateChipBadge('startup', startupCount);
    updateChipBadge('faang', list.filter(c => c.tags.includes('FAANG')).length);
    updateChipBadge('tracker', trackedCount);
    updateChipBadge('pinned', list.filter(c => c.pinned).length);
}

function updateChipBadge(tagKey, count) {
    const chip = document.querySelector(`.career-chip[data-tag="${tagKey}"] .career-chip-count`);
    if (chip) chip.textContent = String(count);
}

function renderCompanyGrid() {
    const grid = document.getElementById('careerGrid');
    if (!grid) return;

    const query = state.search;
    const tag = state.selectedTag;
    const sort = state.sortBy;

    const filtered = state.unifiedCompanies.filter(company => {
        // Tag filter
        if (tag === 'mnc' && company.type !== 'MNC' && !company.tags.includes('MNC')) return false;
        if (tag === 'startup' && company.type !== 'Top startup' && !company.tags.includes('Top startup')) return false;
        if (tag === 'faang' && !company.tags.includes('FAANG')) return false;
        if (tag === 'tracker' && !company.isTracked) return false;
        if (tag === 'pinned' && !company.pinned) return false;

        // Search filter
        if (query) {
            const matchName = company.name.toLowerCase().includes(query);
            const matchDomain = (company.domain || '').toLowerCase().includes(query);
            const matchRole = (company.role || '').toLowerCase().includes(query);
            const matchDesc = (company.description || '').toLowerCase().includes(query);
            const matchTags = company.tags.some(t => t.toLowerCase().includes(query));
            if (!matchName && !matchDomain && !matchRole && !matchDesc && !matchTags) {
                return false;
            }
        }

        return true;
    });

    // Sorting
    filtered.sort((a, b) => {
        if (sort === 'name') {
            return a.name.localeCompare(b.name);
        }
        if (sort === 'tracked') {
            if (a.isTracked && !b.isTracked) return -1;
            if (!a.isTracked && b.isTracked) return 1;
            return a.name.localeCompare(b.name);
        }
        if (sort === 'category') {
            return a.type.localeCompare(b.type) || a.name.localeCompare(b.name);
        }
        // Recommended: Tracked/Pinned first, then Curated
        if (a.pinned !== b.pinned) return a.pinned ? -1 : 1;
        if (a.isTracked !== b.isTracked) return a.isTracked ? -1 : 1;
        return a.name.localeCompare(b.name);
    });

    if (filtered.length === 0) {
        grid.innerHTML = `
            <div class="career-empty">
                <div class="career-empty-icon" aria-hidden="true">🎯</div>
                <h3>No focus companies found</h3>
                <p>No companies match your current search or tag filters. Try clearing filters or paste a career URL above.</p>
                <button class="btn btn-primary" onclick="window.clearCareerFilters()">Clear All Filters</button>
            </div>
        `;
        return;
    }

    grid.innerHTML = filtered.map(renderCompanyCard).join('');
}

if (typeof window !== 'undefined') {
    window.clearCareerFilters = () => {
        state.search = '';
        state.selectedTag = 'all';
        const searchInput = document.getElementById('careerSearch');
        if (searchInput) searchInput.value = '';
        document.querySelectorAll('.career-chip').forEach(c => {
            c.classList.toggle('active', c.dataset.tag === 'all');
        });
        renderCompanyGrid();
    };
}

function renderCompanyCard(company) {
    const isMnc = company.type === 'MNC' || company.tags.includes('MNC');
    const isStartup = company.type === 'Top startup' || company.tags.includes('Top startup');
    const isFaang = company.tags.includes('FAANG');
    const isCustom = company.source === 'tracker-only';

    let avatarClass = 'avatar-custom';
    if (isFaang) avatarClass = 'avatar-faang';
    else if (isMnc) avatarClass = 'avatar-mnc';
    else if (isStartup) avatarClass = 'avatar-startup';

    const safeCareerUrl = getSafeUrl(company.careerUrl);
    const safeJobUrl = getSafeUrl(company.jobUrl);

    // Tags rendering
    const tagsHtml = [];
    if (company.source === 'tracker-only' || company.isTracked) {
        tagsHtml.push(`<span class="career-tag tag-tracker">📋 In Tracker</span>`);
    }
    if (isFaang) {
        tagsHtml.push(`<span class="career-tag tag-faang">FAANG</span>`);
    }
    if (isMnc) {
        tagsHtml.push(`<span class="career-tag tag-mnc">MNC</span>`);
    }
    if (isStartup) {
        tagsHtml.push(`<span class="career-tag tag-startup">Top startup</span>`);
    }
    if (company.status) {
        const statusClass = `status-${company.status.toLowerCase()}`;
        tagsHtml.push(`<span class="career-tag tag-status ${Utils.escapeHtml(statusClass)}">${Utils.escapeHtml(company.status)}</span>`);
    }

    const cardClass = [
        'career-card',
        company.isTracked ? 'is-tracked' : '',
        company.source === 'tracker-only' ? 'from-tracker-only' : ''
    ].filter(Boolean).join(' ');

    return `
        <article class="${cardClass}" data-company-name="${Utils.escapeHtml(company.name)}">
            <div class="career-card-top">
                <div class="career-avatar ${avatarClass}" aria-hidden="true">
                    ${Utils.escapeHtml(company.name.slice(0, 2).toUpperCase())}
                </div>
                <div class="career-card-tags">
                    ${company.pinned ? '<span class="company-pin-badge">📌 Pinned</span>' : ''}
                    ${tagsHtml.join('')}
                </div>
            </div>

            <h2 class="career-card-title">
                ${Utils.escapeHtml(company.name)}
            </h2>

            <div class="career-card-subtitle">
                <span>🏷️ ${Utils.escapeHtml(company.type)}</span>
                <span>•</span>
                <span>📍 ${Utils.escapeHtml(company.domain || 'Global')}</span>
            </div>

            <p style="font-size: 13px; color: var(--text-muted); margin-bottom: 12px; line-height: 1.45;">
                ${Utils.escapeHtml(company.description || '')}
            </p>

            ${company.isTracked && company.role ? `
                <div class="career-tracked-note">
                    <strong>🎯 Tracked Role: ${Utils.escapeHtml(company.role)}</strong>
                    ${company.location ? `<span>Location: ${Utils.escapeHtml(company.location)}</span>` : ''}
                    ${company.appliedDate ? `<span>Applied: ${Utils.escapeHtml(Utils.formatDate(company.appliedDate))}</span>` : ''}
                </div>
            ` : ''}

            ${safeCareerUrl ? `
                <div class="career-url-snippet" title="${Utils.escapeHtml(safeCareerUrl)}">
                    <span>🌐 ${Utils.escapeHtml(safeCareerUrl)}</span>
                </div>
            ` : ''}

            <div class="career-card-actions">
                ${safeCareerUrl ? `
                    <a href="${Utils.escapeHtml(safeCareerUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-visit-career" id="visit_${Utils.escapeHtml(company.name.replace(/\s+/g, '_'))}">
                        🌐 Visit Career Page ↗
                    </a>
                ` : `
                    <button class="btn btn-outline" type="button" data-action="add-url" data-company="${Utils.escapeHtml(company.name)}">
                        🔗 Add Career URL
                    </button>
                `}

                ${safeJobUrl ? `
                    <a href="${Utils.escapeHtml(safeJobUrl)}" target="_blank" rel="noopener noreferrer" class="btn btn-outline" title="View specific job posting">
                        💼 Job Posting ↗
                    </a>
                ` : ''}

                <button class="btn btn-track-action" type="button" data-action="track" data-company="${Utils.escapeHtml(company.name)}">
                    ${company.isTracked ? '✏️ Edit in Tracker' : '＋ Track Company'}
                </button>
            </div>
        </article>
    `;
}

function handleGridAction(event) {
    const button = event.target.closest('button[data-action]');
    if (!button) return;

    const action = button.dataset.action;
    const companyName = button.dataset.company;
    const company = state.unifiedCompanies.find(c => c.name === companyName);
    if (!company) return;

    if (action === 'track' || action === 'add-url') {
        openTrackModal(company);
    }
}

function handleQuickPaste(event) {
    event.preventDefault();
    const input = document.getElementById('quickCareerUrl');
    const rawUrl = input.value.trim();
    const safeUrl = getSafeUrl(rawUrl);

    if (!safeUrl) {
        Utils.showToast('Please enter a valid http or https URL.', 'error');
        return;
    }

    // Auto-detect company name from domain if possible
    let detectedName = '';
    try {
        const parsed = new URL(safeUrl);
        const parts = parsed.hostname.replace('www.', '').replace('careers.', '').replace('jobs.', '').split('.');
        if (parts.length > 0 && parts[0]) {
            detectedName = parts[0].charAt(0).toUpperCase() + parts[0].slice(1);
        }
    } catch {
        // fallback
    }

    openTrackModal({
        name: detectedName,
        careerUrl: safeUrl,
        type: 'MNC',
        status: 'Interested',
        role: ''
    });

    input.value = '';
}

function openTrackModal(prefill = null) {
    const form = document.getElementById('careerFocusForm');
    form.reset();

    const titleEl = document.getElementById('careerModalTitle');
    const idInput = document.getElementById('careerModalCompanyId');
    const nameInput = document.getElementById('modalCompanyName');
    const typeInput = document.getElementById('modalCompanyType');
    const urlInput = document.getElementById('modalCareerUrl');
    const jobUrlInput = document.getElementById('modalJobUrl');
    const roleInput = document.getElementById('modalJobRole');
    const statusInput = document.getElementById('modalApplicationStatus');
    const pinnedInput = document.getElementById('modalCompanyPinned');
    const notesInput = document.getElementById('modalCompanyNotes');

    if (prefill) {
        titleEl.textContent = prefill.isTracked ? `Edit ${prefill.name} in Tracker` : `Track ${prefill.name || 'Company'}`;
        idInput.value = prefill.trackedId || '';
        nameInput.value = prefill.name || '';
        typeInput.value = prefill.type || 'MNC';
        urlInput.value = prefill.careerUrl || '';
        jobUrlInput.value = prefill.jobUrl || '';
        roleInput.value = prefill.role || 'Software Engineer';
        statusInput.value = prefill.status || 'Interested';
        pinnedInput.checked = prefill.pinned === true;
        notesInput.value = prefill.notes || '';
    } else {
        titleEl.textContent = 'Add Goal Career Focus Company';
        idInput.value = '';
        nameInput.value = '';
        typeInput.value = 'MNC';
        urlInput.value = '';
        jobUrlInput.value = '';
        roleInput.value = '';
        statusInput.value = 'Interested';
        pinnedInput.checked = false;
        notesInput.value = '';
    }

    document.getElementById('careerFocusModal').style.display = 'flex';
    nameInput.focus();
}

function closeTrackModal() {
    const modal = document.getElementById('careerFocusModal');
    if (modal) modal.style.display = 'none';
}

function handleSaveCompany(event) {
    event.preventDefault();
    const userId = currentUserId();
    const id = document.getElementById('careerModalCompanyId').value;
    const name = document.getElementById('modalCompanyName').value.trim();
    const companyType = document.getElementById('modalCompanyType').value;
    const careerUrlInput = document.getElementById('modalCareerUrl').value.trim();
    const jobUrlInput = document.getElementById('modalJobUrl').value.trim();
    const role = document.getElementById('modalJobRole').value.trim() || 'Software Engineer';
    const status = document.getElementById('modalApplicationStatus').value;
    const pinned = document.getElementById('modalCompanyPinned').checked;
    const notes = document.getElementById('modalCompanyNotes').value.trim();

    const companyUrl = getSafeUrl(careerUrlInput);
    const jobUrl = getSafeUrl(jobUrlInput);

    if (careerUrlInput && !companyUrl) {
        Utils.showToast('Please enter a valid HTTP or HTTPS career URL.', 'error');
        return;
    }
    if (jobUrlInput && !jobUrl) {
        Utils.showToast('Please enter a valid HTTP or HTTPS job URL.', 'error');
        return;
    }

    // Check if an existing application exists by id or company name
    const existing = state.trackedApplications.find(a => 
        (id && a.id === id) || (String(a.company || '').trim().toLowerCase() === name.toLowerCase())
    );

    const timestamp = new Date().toISOString();
    const application = {
        id: existing ? existing.id : (id || Utils.generateId()),
        userId,
        company: name,
        role,
        companyType,
        status,
        pinned,
        location: existing ? existing.location || '' : 'Remote / Hybrid',
        expectedSalary: existing ? existing.expectedSalary || '' : '',
        appliedDate: existing ? existing.appliedDate || (status === 'Applied' ? timestamp.split('T')[0] : '') : (status === 'Applied' ? timestamp.split('T')[0] : ''),
        followUpDate: existing ? existing.followUpDate || '' : '',
        companyUrl: companyUrl || (existing ? existing.companyUrl : ''),
        jobUrl: jobUrl || (existing ? existing.jobUrl : ''),
        notes,
        createdAt: existing ? existing.createdAt : timestamp,
        updatedAt: timestamp
    };

    Storage.upsertCompanyApplication(userId, application);
    closeTrackModal();
    refreshData();
    Utils.showToast(`${name} saved! Synced with Company Tracker.`);
}

export function getSafeUrl(value) {
    if (!value) return '';
    try {
        const url = new URL(value);
        return url.protocol === 'http:' || url.protocol === 'https:' ? url.href : '';
    } catch {
        return '';
    }
}
