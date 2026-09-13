import { formatAmount, formatCalories, sumNutrients } from '../lib/nutrition';
import type { MealWithComponents } from '../db/queries';
import { MacroSummary } from './MacroSummary';

const label = { breakfast: 'Breakfast', lunch: 'Lunch', dinner: 'Dinner', snack: 'Snack' } as const;

export function MealSummaryList({ meals }: { meals: MealWithComponents[] }) {
  return (
    <div className="divide-y divide-line">
      {meals.map(({ meal, components }) => {
        const total = sumNutrients(components);
        return (
          <article key={meal.id} className="px-4 py-4 sm:px-5">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-semibold">{meal.name}</p>
                <p className="mt-0.5 text-xs text-ink-3">
                  {label[meal.category]} · {components.length}{' '}
                  {components.length === 1 ? 'item' : 'items'}
                </p>
                <MacroSummary
                  protein={total.protein}
                  carbs={total.carbs}
                  fat={total.fat}
                  className="mt-1"
                />
              </div>
              <p className="numeric shrink-0 font-semibold">
                {formatCalories(total.calories)}{' '}
                <span className="text-xs font-normal text-ink-3">kcal</span>
              </p>
            </div>
            <ul className="mt-2 flex flex-wrap gap-x-3 gap-y-1 text-xs text-ink-3">
              {components.map((item) => (
                <li key={item.id}>
                  {item.name} · {formatAmount(item.amount, item.unit, item.servingLabel)}
                </li>
              ))}
            </ul>
          </article>
        );
      })}
    </div>
  );
}
