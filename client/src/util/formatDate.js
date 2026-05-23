export const formatDate = (date) => {
  const [year, month, day] = date.split("-");
  const formattedDate = `${year}-${month}-${day}T12:00:00Z`;
  return formattedDate;
};
