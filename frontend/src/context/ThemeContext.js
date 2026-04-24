import { createContext, useContext, useState, useEffect } from 'react';

const THEMES = {
  default:   { accent:'#1a1916', accentLight:'#f0ede8', name:'Charcoal' },
  ocean:     { accent:'#1a6db5', accentLight:'#e6f1fb', name:'Ocean Blue' },
  forest:    { accent:'#27a05a', accentLight:'#f0fff4', name:'Forest Green' },
  sunset:    { accent:'#d95a2e', accentLight:'#fff5f0', name:'Sunset Orange' },
  rose:      { accent:'#b03060', accentLight:'#fff0f5', name:'Rose Pink' },
  purple:    { accent:'#6c3fc9', accentLight:'#f3f0ff', name:'Purple Haze' },
  teal:      { accent:'#0f7c80', accentLight:'#e0f7f7', name:'Deep Teal' },
  amber:     { accent:'#b45309', accentLight:'#fffbeb', name:'Warm Amber' },
  indigo:    { accent:'#3730a3', accentLight:'#eef2ff', name:'Indigo' },
  crimson:   { accent:'#9b1c1c', accentLight:'#fef2f2', name:'Crimson' },
  slate:     { accent:'#334155', accentLight:'#f1f5f9', name:'Slate' },
  mint:      { accent:'#065f46', accentLight:'#ecfdf5', name:'Mint' },
};

const ThemeContext = createContext();

export function ThemeProvider({ children }) {
  const [theme, setTheme] = useState(() => localStorage.getItem('tf_theme') || 'default');
  const [dark, setDark]   = useState(() => localStorage.getItem('tf_dark') === 'true');

  useEffect(() => {
    const t = THEMES[theme] || THEMES.default;
    document.documentElement.style.setProperty('--accent', t.accent);
    document.documentElement.style.setProperty('--accent-light', t.accentLight);
    document.body.classList.toggle('dark', dark);
    localStorage.setItem('tf_theme', theme);
    localStorage.setItem('tf_dark', dark);
  }, [theme, dark]);

  return (
    <ThemeContext.Provider value={{ theme, setTheme, dark, setDark, themes: THEMES }}>
      {children}
    </ThemeContext.Provider>
  );
}

export const useTheme = () => useContext(ThemeContext);
export { THEMES };
