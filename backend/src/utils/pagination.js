/**
 * Pagination utility.
 *
 * Accepts two calling conventions:
 *   getPaginationParams(page, limit)           — used by services
 *   getPaginationParams({ page, limit })       — used by legacy code
 */
export const getPaginationParams = (pageOrQuery, limitArg) => {
  let page, limit;

  if (typeof pageOrQuery === "object" && pageOrQuery !== null) {
    // Called as getPaginationParams({ page, limit, ... })
    page  = parseInt(pageOrQuery.page,  10) || 1;
    limit = parseInt(pageOrQuery.limit, 10) || 10;
  } else {
    // Called as getPaginationParams(page, limit)
    page  = parseInt(pageOrQuery, 10) || 1;
    limit = parseInt(limitArg,    10) || 10;
  }

  // Safety clamps
  page  = Math.max(1, page);
  limit = Math.min(Math.max(1, limit), 100); // never more than 100 per page

  const skip = (page - 1) * limit;
  return { page, limit, skip };
};

/**
 * Build pagination metadata for API responses.
 */
export const getPaginationMeta = (page, limit, total) => {
  const totalPages = Math.ceil(total / limit);
  return {
    page,
    limit,
    total,
    totalPages,
    hasNextPage: page < totalPages,
    hasPrevPage: page > 1,
  };
};

export default {
  getPaginationParams,
  getPaginationMeta,
};
