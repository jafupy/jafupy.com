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
  "Dec"
];
function format(date) {
  const d = new Date(date);
  return `${months[d.getMonth()]} ${d.getFullYear()}`;
}

export { format as f };
