export type DashboardSectionId =
  | 'timeline'
  | 'certifications'
  | 'key_metrics'
  | 'languages'
  | 'career_preferences'
  | 'video'
  | 'ai_proficiency'
  | 'portfolio'
  | 'word_cloud'
  | 'skills_radar'
  | 'personality'
  | 'esg'
  | 'volunteering'
  | 'map'
  | 'references'
  | 'interests';

export type DashboardColumn = 'left' | 'right' | 'full';

export interface DashboardSectionConfig {
  id: DashboardSectionId;
  label: string;
  visible: boolean;
  order: number;
  column: DashboardColumn;
}

export const DEFAULT_DASHBOARD_LAYOUT: DashboardSectionConfig[] = [
  { id: 'timeline', label: 'Career Timeline', visible: true, order: 0, column: 'left' },
  { id: 'certifications', label: 'Certifications', visible: true, order: 1, column: 'left' },
  { id: 'languages', label: 'Languages', visible: true, order: 2, column: 'right' },
  { id: 'key_metrics', label: 'Key Metrics', visible: true, order: 3, column: 'right' },
  { id: 'career_preferences', label: 'Career Preferences', visible: true, order: 4, column: 'right' },
  { id: 'video', label: 'Video Profile', visible: true, order: 5, column: 'right' },
  { id: 'ai_proficiency', label: 'AI Proficiency', visible: true, order: 6, column: 'right' },
  { id: 'portfolio', label: 'Portfolio Link', visible: true, order: 7, column: 'right' },
  { id: 'word_cloud', label: 'Biography Word Cloud', visible: true, order: 8, column: 'right' },
  { id: 'skills_radar', label: 'Skills Radar', visible: true, order: 9, column: 'right' },
  { id: 'personality', label: 'Personality', visible: true, order: 10, column: 'right' },
  { id: 'esg', label: 'ESG / Impact', visible: true, order: 11, column: 'right' },
  { id: 'volunteering', label: 'Volunteering', visible: true, order: 12, column: 'full' },
  { id: 'map', label: 'International Experience', visible: true, order: 13, column: 'full' },
  { id: 'references', label: 'References', visible: true, order: 14, column: 'full' },
  { id: 'interests', label: 'Interests', visible: true, order: 15, column: 'full' },
];

const SECTION_META = Object.fromEntries(
  DEFAULT_DASHBOARD_LAYOUT.map((s) => [s.id, { label: s.label, column: s.column }])
) as Record<DashboardSectionId, { label: string; column: DashboardColumn }>;

/** Merge stored layout with defaults so new sections appear for existing users */
export function normalizeDashboardLayout(
  raw: unknown
): DashboardSectionConfig[] {
  const byId = new Map<string, Partial<DashboardSectionConfig>>();

  if (Array.isArray(raw)) {
    for (const item of raw) {
      if (!item || typeof item !== 'object') continue;
      const id = (item as DashboardSectionConfig).id;
      if (!id || !(id in SECTION_META)) continue;
      byId.set(id, item as DashboardSectionConfig);
    }
  }

  return DEFAULT_DASHBOARD_LAYOUT.map((def, index) => {
    const saved = byId.get(def.id);
    return {
      id: def.id,
      label: SECTION_META[def.id].label,
      column: SECTION_META[def.id].column,
      visible: saved?.visible ?? def.visible,
      order: typeof saved?.order === 'number' ? saved.order : index,
    };
  }).sort((a, b) => a.order - b.order || a.label.localeCompare(b.label));
}

export function sectionsForColumn(
  layout: DashboardSectionConfig[],
  column: DashboardColumn
): DashboardSectionConfig[] {
  return layout
    .filter((s) => s.visible && s.column === column)
    .sort((a, b) => a.order - b.order);
}

export function moveSection(
  layout: DashboardSectionConfig[],
  id: DashboardSectionId,
  direction: 'up' | 'down'
): DashboardSectionConfig[] {
  const sorted = [...layout].sort((a, b) => a.order - b.order);
  const index = sorted.findIndex((s) => s.id === id);
  if (index < 0) return layout;

  const column = sorted[index].column;
  const sameColumnIndexes = sorted
    .map((s, i) => (s.column === column ? i : -1))
    .filter((i) => i >= 0);
  const posInColumn = sameColumnIndexes.indexOf(index);
  const neighborPos = direction === 'up' ? posInColumn - 1 : posInColumn + 1;
  if (neighborPos < 0 || neighborPos >= sameColumnIndexes.length) return layout;

  const target = sameColumnIndexes[neighborPos];
  const next = sorted.map((s) => ({ ...s }));
  const tmpOrder = next[index].order;
  next[index].order = next[target].order;
  next[target].order = tmpOrder;

  return next.sort((a, b) => a.order - b.order).map((s, i) => ({ ...s, order: i }));
}

export function toggleSectionVisibility(
  layout: DashboardSectionConfig[],
  id: DashboardSectionId,
  visible: boolean
): DashboardSectionConfig[] {
  return layout.map((s) => (s.id === id ? { ...s, visible } : s));
}
