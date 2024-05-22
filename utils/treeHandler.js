const handlers = require('./treeHandler');

exports.buildAncestors = async (Model, id, parent_id) => {
  let ancest = [];
  let parent_category = await Model.findOne(
    { _id: parent_id },
    { name: 1, slug: 1, ancestors: 1 }
  ).exec();
  if (parent_category) {
    const { _id, name, slug } = parent_category;
    ancest = [...parent_category.ancestors];
    ancest.unshift({ _id, name, slug });
    const category = await Model.findByIdAndUpdate(
      id,
      {
        $set: { ancestors: ancest },
      },
      {
        new: true,
      }
    );
    return category;
  }
};
exports.buildHierarchyAncestors = async (Model, category_id, parent_id) => {
  if (category_id && parent_id)
    await handlers.buildAncestors(Model, category_id, parent_id);
  const result = await Model.find({ parent: category_id }).exec();
  if (result)
    await result.forEach((doc) => {
      handlers.buildHierarchyAncestors(Model, doc._id, category_id);
    });
};
