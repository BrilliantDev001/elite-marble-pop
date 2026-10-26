// Counts web links in a message. Links are the most common sign of spam, so the forms limit them.
// (The server uses the same rule and checks again. The browser only gives quicker feedback.)
export function countLinks(text) {
  return (text.match(/(?:https?:\/\/|www\.)\S+/gi) ?? []).length;
}
