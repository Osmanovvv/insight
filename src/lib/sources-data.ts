// Управление источниками новостей

export interface Source {
  id: string;
  name: string;
  url: string;
  supported: boolean;
  active: boolean;
  favicon?: string;
}

const SUPPORTED_SOURCES = [
  'investing.com',
  'bloomberg.com',
  'reuters.com',
  'techcrunch.com',
  'coindesk.com',
  'wsj.com',
  'ft.com',
  'cnbc.com'
];

export const checkSourceSupport = (url: string): boolean => {
  const domain = url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  return SUPPORTED_SOURCES.some(s => domain.includes(s));
};

export const saveSources = (sources: Source[]) => {
  localStorage.setItem('insight_sources', JSON.stringify(sources));
};

export const getSources = (): Source[] => {
  const stored = localStorage.getItem('insight_sources');
  return stored ? JSON.parse(stored) : [];
};

export const addSource = (url: string): { success: boolean; message: string; source?: Source } => {
  const sources = getSources();
  const domain = url.toLowerCase().replace(/^(https?:\/\/)?(www\.)?/, '').split('/')[0];
  
  if (sources.some(s => s.url === domain)) {
    return { success: false, message: 'Источник уже добавлен' };
  }
  
  const supported = checkSourceSupport(url);
  const newSource: Source = {
    id: Date.now().toString(),
    name: domain,
    url: domain,
    supported,
    active: true,
    favicon: `https://www.google.com/s2/favicons?domain=${domain}&sz=32`
  };
  
  sources.push(newSource);
  saveSources(sources);
  
  if (!supported) {
    return { success: false, message: 'Источник пока не поддерживается', source: newSource };
  }
  
  return { success: true, message: 'Источник успешно добавлен', source: newSource };
};

export const removeSource = (id: string) => {
  const sources = getSources();
  saveSources(sources.filter(s => s.id !== id));
};

export const toggleSourceActive = (id: string) => {
  const sources = getSources();
  const updatedSources = sources.map(s => 
    s.id === id ? { ...s, active: !s.active } : s
  );
  saveSources(updatedSources);
};
