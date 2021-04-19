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
exports.getTemplate = void 0;
const path_1 = require("path");
const fs_1 = require("fs");
function getTemplate(template, data
//@ts-ignore
) {
    return __awaiter(this, void 0, void 0, function* () {
        let path = path_1.join(`${__dirname}/mailing-templates/${template}.hbs`);
        let fileExists = fs_1.existsSync(path);
        let content = '';
        if (fileExists) {
            let contents = fs_1.readFileSync(path, 'utf-8');
            for (var i in data) {
                var x = '{{' + i + '}}';
                while (contents.indexOf(x) > -1) {
                    // @ts-ignore
                    contents = contents.replace(x, data[i]);
                }
            }
            content = contents;
        }
        return content;
    });
}
exports.getTemplate = getTemplate;
// export async function getTemplate(template:string, options:object) {
//   console.log(template, options)
//   const html = pug.renderFile(
//     `${__dirname}/../modules/mailing/${template}.pug`,
//     options
//   )
//   console.log(html)
//   const inlined = juice(html);
//   return inlined;
// }
//# sourceMappingURL=resolve-template.js.map