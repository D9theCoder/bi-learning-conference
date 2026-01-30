import { Checkbox } from '@/components/ui/checkbox';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import type { Powerup } from '@/types';

type PowerupSelection = {
  id: number;
  limit: number;
};

interface PowerupSelectorProps {
  availablePowerups: Powerup[];
  selectedPowerups: PowerupSelection[];
  onChange: (powerups: PowerupSelection[]) => void;
}

export function PowerupSelector({
  availablePowerups,
  selectedPowerups,
  onChange,
}: PowerupSelectorProps) {
  const selectedMap = new Map(
    selectedPowerups.map((powerup) => [powerup.id, powerup]),
  );

  const togglePowerup = (powerup: Powerup, enabled: boolean) => {
    if (!enabled) {
      onChange(selectedPowerups.filter((item) => item.id !== powerup.id));
      return;
    }

    if (selectedMap.has(powerup.id)) {
      return;
    }

    const defaultLimit = Math.max(1, powerup.default_limit ?? 1);

    onChange([
      ...selectedPowerups,
      {
        id: powerup.id,
        limit: defaultLimit,
      },
    ]);
  };

  const updateLimit = (powerupId: number, limit: number) => {
    const normalizedLimit = Math.max(1, limit);

    onChange(
      selectedPowerups.map((item) =>
        item.id === powerupId ? { ...item, limit: normalizedLimit } : item,
      ),
    );
  };

  if (availablePowerups.length === 0) {
    return (
      <div className="text-sm text-muted-foreground">
        No powerups have been configured yet.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {availablePowerups.map((powerup) => {
        const selected = selectedMap.get(powerup.id);
        const isEnabled = Boolean(selected);

        return (
          <div key={powerup.id} className="space-y-2 rounded-lg border p-3">
            <div className="flex items-start gap-3">
              <Checkbox
                id={`powerup-${powerup.id}`}
                checked={isEnabled}
                onCheckedChange={(checked) =>
                  togglePowerup(powerup, Boolean(checked))
                }
              />
              <div className="space-y-1">
                <Label
                  htmlFor={`powerup-${powerup.id}`}
                  className="cursor-pointer text-sm font-medium"
                >
                  {powerup.name}
                </Label>
                {powerup.description ? (
                  <p className="text-xs text-muted-foreground">
                    {powerup.description}
                  </p>
                ) : null}
              </div>
            </div>

            {isEnabled ? (
              <div className="flex items-center gap-2">
                <Label
                  htmlFor={`powerup-limit-${powerup.id}`}
                  className="text-xs text-muted-foreground"
                >
                  Usage limit
                </Label>
                <Input
                  id={`powerup-limit-${powerup.id}`}
                  type="number"
                  min={1}
                  value={selected?.limit ?? 1}
                  onChange={(event) => {
                    const value = Number.parseInt(event.target.value, 10);
                    updateLimit(powerup.id, Number.isNaN(value) ? 1 : value);
                  }}
                  className="h-8 w-24"
                />
              </div>
            ) : null}
          </div>
        );
      })}
    </div>
  );
}
