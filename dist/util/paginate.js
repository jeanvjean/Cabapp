"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
/* eslint-disable no-labels */
//@ts-ignore
exports.default = (findService, countService, query, { pageNo, size }, populate) => __awaiter(void 0, void 0, void 0, function* () {
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
        totalCount = yield countService(query);
    }
    const docs = yield findService(query, page, populate);
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
});
//# sourceMappingURL=paginate.js.map