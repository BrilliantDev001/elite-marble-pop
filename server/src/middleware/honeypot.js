// A trap for spam bots. The forms will contain an extra field called "website" that is hidden from
// real visitors. People never fill it in, but many bots fill in every field they find.
// When it is filled in, we reply "thank you" exactly like a real submission but save NOTHING,
// so the bot has no signal that it was caught.
export function honeypot(thanksMessage) {
  return (req, res, next) => {
    const trap = req.body?.website;
    if (typeof trap === "string" && trap.trim() !== "") {
      return res.status(201).json({ message: thanksMessage });
    }
    next();
  };
}
