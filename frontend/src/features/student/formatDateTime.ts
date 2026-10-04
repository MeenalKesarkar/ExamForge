export const formatDateTime = (
  value?: string | null
) => {
  if (!value) {
    return "";
  }

  return new Date(value).toLocaleString(
    "en-IN",
    {
      dateStyle: "medium",
      timeStyle: "short",
    }
  );
};
