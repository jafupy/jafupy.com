const months = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];
export function format(date: Date): string {
  const d = new Date(date);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}
