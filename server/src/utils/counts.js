// Counts every record by one field, for the status tabs in the admin.
// Returns { all, <value>: count, ... }. Every listed value is included, even with zero records.
// Usage: await countBy(Review, "status", ["pending", "approved", "rejected"])
export async function countBy(Model, field, values) {
  const grouped = await Model.aggregate([
    { $group: { _id: `$${field}`, count: { $sum: 1 } } },
  ]);

  const counts = {
    all: 0,
    ...Object.fromEntries(values.map((value) => [value, 0])),
  };
  for (const group of grouped) {
    if (group._id in counts) counts[group._id] = group.count;
    counts.all += group.count;
  }
  return counts;
}
