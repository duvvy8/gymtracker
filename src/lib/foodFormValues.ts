import type { Food } from '../types';

/**
 * The food form's fields as raw strings.
 *
 * Text is kept as typed until submit so that a half-entered number is never
 * coerced behind the user's back. Parsing and bounds checking happen once,
 * on submit, in parseNumberInput.
 */
export interface FoodFormValues {
  name: string;
  brand: string;
  servingLabel: string;
  servingGrams: string;
  calories: string;
  protein: string;
  carbs: string;
  fat: string;
}

export const EMPTY_FOOD_FORM: FoodFormValues = {
  name: '',
  brand: '',
  servingLabel: '100 g',
  servingGrams: '100',
  calories: '',
  protein: '0',
  carbs: '0',
  fat: '0',
};

export function foodToFormValues(food: Food): FoodFormValues {
  return {
    name: food.name,
    brand: food.brand ?? '',
    servingLabel: food.servingLabel,
    servingGrams: food.servingGrams === undefined ? '' : String(food.servingGrams),
    calories: String(food.calories),
    protein: String(food.protein),
    carbs: String(food.carbs),
    fat: String(food.fat),
  };
}
