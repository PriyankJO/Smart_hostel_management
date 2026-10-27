export const getPaginationOptions = (req) => {
  const page = parseInt(req.query.page, 10) || 1;
  const limit = parseInt(req.query.limit, 10) || 10;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

export const paginateResults = async (model, query, page, limit) => {
  const total = await model.countDocuments(query);
  const pages = Math.ceil(total / limit);

  return {
    page,
    limit,
    total,
    pages
  };
};
