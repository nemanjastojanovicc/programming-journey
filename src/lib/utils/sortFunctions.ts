export type DatesArray = { data: { date: string } }[];

export const sortByDate = (array: DatesArray) =>
  array.sort(
    (a, b) =>
      +new Date(b.data.date && b.data.date) -
      +new Date(a.data.date && a.data.date)
  );
