export const formatHours = (hours) => {
  var h = Math.floor(hours);
  var m = Math.round((hours - h) * 60);
  return `${h}h ${m > 0 ? m + "min" : ""}`;
};
