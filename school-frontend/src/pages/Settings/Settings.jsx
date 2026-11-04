import { LuMonitor, LuMoon, LuRotateCcw, LuSun } from 'react-icons/lu';
import { useTheme } from '../../context/ThemeContext';
import { useToast } from '../../context/ToastContext';
import PageHeader from '../../components/ui/PageHeader';
import { Card, CardBody, CardHeader } from '../../components/ui/Card';
import Button from '../../components/ui/Button';
import { cn } from '../../lib/cn';

const THEMES = [
  { value: 'light', label: 'Light', icon: LuSun },
  { value: 'dark', label: 'Dark', icon: LuMoon },
  { value: 'system', label: 'Match system', icon: LuMonitor },
];

const SIZES = [
  { value: 'default', label: 'Default', sample: 'text-base' },
  { value: 'large', label: 'Large', sample: 'text-lg' },
  { value: 'larger', label: 'Larger', sample: 'text-xl' },
];

/** Radio group rendered as selectable cards; arrow keys work natively. */
const OptionCards = ({ name, legend, options, value, onChange, render }) => (
  <fieldset>
    <legend className="sr-only">{legend}</legend>
    <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
      {options.map((o) => (
        <label
          key={o.value}
          className={cn(
            'flex cursor-pointer flex-col gap-2 rounded-xl border p-4 transition-colors duration-fast has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-primary/40',
            value === o.value ? 'border-primary bg-primary-soft' : 'border-line hover:border-line-input'
          )}
        >
          <input type="radio" name={name} value={o.value} checked={value === o.value} onChange={() => onChange(o.value)} className="sr-only" />
          {render(o, value === o.value)}
        </label>
      ))}
    </div>
  </fieldset>
);

const Settings = () => {
  const { theme, setTheme, textSize, reduceMotion, setPreference, resetPreferences } = useTheme();
  const { showToast } = useToast();

  return (
    <>
      <PageHeader title="Settings" description="Appearance and accessibility preferences. Saved on this device and applied instantly." />
      <div className="space-y-6">
        <Card>
          <CardHeader title="Theme" description="Choose light, dark, or follow your device." />
          <CardBody>
            <OptionCards
              name="theme"
              legend="Theme"
              options={THEMES}
              value={theme}
              onChange={setTheme}
              render={(o, active) => (
                <span className="flex items-center gap-2 text-sm font-semibold text-ink">
                  <o.icon aria-hidden="true" className={cn('h-5 w-5', active ? 'text-primary-ink' : 'text-ink-subtle')} />
                  {o.label}
                </span>
              )}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Text size" description="Scales all text and spacing across Haya." />
          <CardBody>
            <OptionCards
              name="text-size"
              legend="Text size"
              options={SIZES}
              value={textSize}
              onChange={(v) => setPreference('textSize', v)}
              render={(o) => (
                <>
                  <span className={cn('font-semibold text-ink', o.sample)}>Aa</span>
                  <span className="text-sm text-ink-muted">{o.label}</span>
                </>
              )}
            />
          </CardBody>
        </Card>

        <Card>
          <CardHeader title="Motion" />
          <CardBody>
            <label className="flex cursor-pointer items-start justify-between gap-4">
              <span>
                <span className="block text-sm font-semibold text-ink">Reduce motion</span>
                <span className="mt-0.5 block text-sm text-ink-muted">
                  Turns off transitions and animations. Haya already follows your device's reduced-motion setting.
                </span>
              </span>
              <span className="relative inline-flex shrink-0">
                <input
                  type="checkbox"
                  role="switch"
                  checked={reduceMotion}
                  onChange={(e) => setPreference('reduceMotion', e.target.checked)}
                  className="peer sr-only"
                />
                <span
                  aria-hidden="true"
                  className="h-6 w-11 rounded-full bg-line-strong transition-colors duration-fast peer-checked:bg-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40"
                />
                <span
                  aria-hidden="true"
                  className="absolute left-0.5 top-0.5 h-5 w-5 rounded-full bg-surface shadow-sm transition-transform duration-fast peer-checked:translate-x-5"
                />
              </span>
            </label>
          </CardBody>
        </Card>

        <div>
          <Button
            variant="secondary"
            icon={LuRotateCcw}
            onClick={() => {
              resetPreferences();
              showToast('Preferences reset to defaults.', 'info');
            }}
          >
            Reset to defaults
          </Button>
        </div>
      </div>
    </>
  );
};

export default Settings;
