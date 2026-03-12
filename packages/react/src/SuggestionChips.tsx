import React from 'react';

export interface SuggestionChipsProps {
  suggestions: string[];
  onSelect: (suggestion: string) => void;
  className?: string;
  chipClassName?: string;
}

export const SuggestionChips: React.FC<SuggestionChipsProps> = ({ 
  suggestions, 
  onSelect, 
  className = "",
  chipClassName = ""
}) => {
  return (
    <div className={`flex flex-wrap gap-2 ${className}`}>
      {suggestions.map((suggestion) => (
        <button
          key={suggestion}
          onClick={() => onSelect(suggestion)}
          className={`px-3 py-1.5 rounded-lg bg-white/5 border border-white/10 text-white/50 hover:text-white hover:border-white/30 text-xs transition-all ${chipClassName}`}
        >
          {suggestion}
        </button>
      ))}
    </div>
  );
};
