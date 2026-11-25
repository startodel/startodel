const date = new Intl.DateTimeFormat("en", { dateStyle: "medium", timeZone: "UTC" });
export const displayDate = (value: string) => date.format(new Date(value));
