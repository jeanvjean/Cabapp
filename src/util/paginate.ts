/* eslint-disable no-labels */
//@ts-ignore
export default async (findService:any, countService:any, query:any, { pageNo, size }, populate:any) => {
	pageNo = parseInt(pageNo, 10);
	size = parseInt(size, 10);

	if (pageNo < 0 || pageNo === 0) {
		return {
			invalidPageNo: true
		};
	}

	const page = {};
//@ts-ignore
	page.skip = size * (pageNo - 1);
    //@ts-ignore
	page.limit = size;
    //@ts-ignore
	page.sort = {
		createdAt: -1
	};
	let totalCount;

	if (!query.text) {
		totalCount = await countService(query);
	}

	const docs = await findService(query, page, populate);


	const pagecount = docs.totalCount || totalCount;
//@ts-ignore
	const pageCount = Math.ceil(pagecount / page.limit);

	return {
		data: {
			docs: docs.rows || docs,
			totalCount: docs.totalCount || totalCount,
			pageCount
		}
	};
};
