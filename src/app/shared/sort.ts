/**
 * Sorts an array of items by multiple functions
 * @param items
 * @param languageCode
 * @param functions
 * @param orders - Defaults to 'asc' for all functions
 * @param options
 */
export function sort<Item>(items: Item[] = [], languageCode: string, functions: ((i: Item) => any)[] = [(i) => i], orders: ('asc' | 'desc')[] = [], options: Intl.CollatorOptions = {}): Item[] {
  if (!items.length) {
    return items;
  } // Return empty array if no items to sort

  const functionOrders = functions.map((f, i) => {
    return {
      function: f,
      order: orders[i] || 'asc',
    };
  });

  const collator = new Intl.Collator(languageCode, {
    numeric: true,
    ...options,
  });

  return items.sort((a, b) => {
    for (const func of functionOrders) {
      const comp1 = func.order === 'asc' ? a : b;
      const comp2 = func.order === 'asc' ? b : a;
      const value1 = func.function(comp1);
      const value2 = func.function(comp2);

      if (Number.isFinite(value1) && Number.isFinite(value2)) {
        const result = value1 - value2;

        if (result !== 0) {
          return result;
        }
      } else {
        const result = collator.compare(func.function(comp1), func.function(comp2));

        if (result !== 0) {
          return result;
        }
      }
    }

    return 0;
  });
}
