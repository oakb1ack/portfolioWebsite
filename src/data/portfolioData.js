export const portfolioData = {
  header: {
    name: 'Ali Alfridawi',
    title: 'Computer Science & Electrical Engineering',
  },
  about: {
    content: "I'm a Computer Science and Electrical Engineering student at UTA driven by curiosity at the intersection of both fields. Currently conducting undergraduate research in nanophotonics, developing Python-based simulation frameworks to model optical phenomena and analyze experimental data. I'm exploring how machine learning can be applied to my research—from pattern recognition in optical datasets to predictive modeling of photonic structures. My work bridges theory and practice, translating complex mathematical models into efficient computational tools. I'm passionate about building robust engineering tooling, contributing to meaningful research, and crafting elegant solutions that combine hardware knowledge with software expertise.",
  },
  bioHighlights: [
    { label: 'Hobbies', value: 'Card Games & Working Out' },
    { label: 'Focus', value: 'Photonics & Electronics' },
    { label: 'Interest', value: 'Competitive Programming' },
  ],
  education: [{
    degree: 'Bachelor of Science in Computer Science & Electrical Engineering',
    school: 'University of Texas at Arlington',
    year: '2029',
    gpa: '4.0',
    focus: 'Optics and Electronics',
    extracurriculars: ['Society of Asian Scientists and Engineers', 'Association for Computing Machinery', 'Institute of Electrical and Electronics Engineers', 'Freshman Leaders on Campus'],
    coursework: ['Circuits Analysis One', 'Electrical Engineering Practicum', 'Introduction to Electrical Engineering', 'Intermediate Programming in C'],
    honors: ['Freshman Distinction Roll', 'Maverick Academic Scholarship'],
  }],
  experience: [
    { role: 'Undergraduate Research Assistant', company: 'University of Texas at Arlington', date: '2025 – Present', description: 'Developed Python scripts with NumPy, SciPy, Pandas, and S4 to model and analyze nanophotonics experiments, enabling faster data processing and uncovering key optical patterns that guided subsequent experimental designs.', technologies: ['Python', 'NumPy', 'SciPy', 'Pandas', 'S4'] },
    { role: 'IT Intern', company: 'iFortriss', date: '2024 – 2025', description: 'Engineered and tested a secure office network infrastructure with a patch panel, a firewall, a ticketing system, wireless access points, and a server, resulting in more reliable network performance and faster issue resolution.', technologies: ['Network Engineering', 'Firewall Config', 'Server Admin', 'Ticketing Systems'] },
  ],
  skills: {
    Software: { description: 'Core programming languages', accentVar: '--accent-violet', accentRgbVar: '--accent-violet-rgb', icon: 'Code2', items: [{ name: 'Python', icon: 'FileCode2' }, { name: 'C/C++', icon: 'Braces' }] },
    Tools: { description: 'Development & analysis', accentVar: '--accent-cyan', accentRgbVar: '--accent-cyan-rgb', icon: 'Wrench', items: [{ name: 'MATLAB', icon: 'BarChart3' }, { name: 'Git', icon: 'GitBranch' }] },
    Hardware: { description: 'EDA & circuit simulation', accentVar: '--accent-amber', accentRgbVar: '--accent-amber-rgb', icon: 'CircuitBoard', items: [{ name: 'Altium', icon: 'Layers' }, { name: 'Multisim', icon: 'CircuitBoard' }, { name: 'KiCad', icon: 'Ruler' }] },
  },
  projects: [
    { name: 'LoudPenguin', label: 'Discord Bot', shortDescription: 'A production-ready Discord bot delivering real-time financial market data, automated reports, and price alerts to servers.', technologies: ['TypeScript', 'Node.js', 'Discord.js', 'MongoDB', 'Finnhub API', 'CoinGecko API'], githubUrl: 'https://github.com/AliAlfridawi/loudPenguin', status: 'Production', icon: 'bot', features: ['Real-time stock & cryptocurrency quotes with chart data', 'Configurable price alerts with automatic DM notifications', 'Automated daily market summary reports at 4:15 PM ET'], mockupGradient: 'linear-gradient(135deg, rgba(99,102,241,0.22) 0%, rgba(34,211,238,0.15) 100%)', mockupIconBg: 'rgba(99, 102, 241, 0.35)' },
    { name: 'Citation Manager', label: 'Browser Extension', shortDescription: 'A Microsoft Edge extension for IEEE-format citation management across research projects, with auto-cite from URL/DOI.', technologies: ['JavaScript', 'HTML5', 'CSS3', 'Manifest V3', 'CrossRef API'], githubUrl: 'https://github.com/AliAlfridawi/citationExtension', status: 'Production', icon: 'fileText', features: ['IEEE-formatted citations for journals, conferences, websites, and books', 'Auto-cite from URL or DOI via CrossRef API', 'BibTeX import/export with drag-and-drop reordering'], mockupGradient: 'linear-gradient(135deg, rgba(167,139,250,0.22) 0%, rgba(251,191,36,0.14) 100%)', mockupIconBg: 'rgba(167, 139, 250, 0.35)' },
  ],
  contact: { email: 'ama3373@mavas.uta.edu', github: 'https://github.com/AliAlfridawi', linkedin: 'https://www.linkedin.com/in/alialfridawi/' },
};

export const portfolioStats = [
  { label: 'GPA', target: 4.0, decimals: 1, accent: '--accent-violet' },
  { label: 'Projects', target: 2, suffix: '+', accent: '--accent-cyan' },
  { label: 'Uptime', target: 99.9, suffix: '%', decimals: 1, accent: '--accent-amber' },
];
