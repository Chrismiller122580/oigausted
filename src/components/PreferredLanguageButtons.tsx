'use client';

import {
  recommendLanguageFromLocation,
  languageRecommendationLabel,
  type AppLanguage,
} from '@/lib/preferred-language';

export function PreferredLanguageButtons({
  value,
  countryCode,
  city,
  disabled,
  onChange,
}: {
  value: AppLanguage;
  countryCode?: string | null;
  city?: string | null;
  disabled?: boolean;
  onChange: (lang: AppLanguage) => void | Promise<void>;
}) {
  const recommended = recommendLanguageFromLocation({ countryCode, city });
  return (
    <div className="space-y-2">
      <div className="flex flex-wrap gap-2">
        {(
          [
            { code: 'es' as const, label: 'Español' },
            { code: 'en' as const, label: 'English' },
          ] as const
        ).map((opt) => {
          const active = value === opt.code;
          return (
            <button
              key={opt.code}
              type="button"
              disabled={disabled}
              onClick={() => onChange(opt.code)}
              className={`px-4 py-2 rounded-full border text-sm font-medium transition ${
                active
                  ? 'bg-orange-600 text-white border-orange-600'
                  : 'border-border hover:bg-muted'
              }`}
            >
              {opt.label}
              {recommended === opt.code ? ' · Rec' : ''}
            </button>
          );
        })}
      </div>
      <p className="text-xs text-muted-foreground">
        {languageRecommendationLabel(recommended, countryCode)}
      </p>
    </div>
  );
}
