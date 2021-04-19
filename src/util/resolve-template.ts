import {join} from 'path'
import {existsSync, readFileSync} from 'fs'
import * as pug from 'pug';
import juice = require('juice');
export type Template = {
    name?: string
    title?: string
    email?: string
    code?: string
    description?: string
    stage?: string
    status?: string
    notes?: string
    letter?: string
    amount?: string
    period?: string
    resumption?: string
}
export async function getTemplate(
	template: string,
	data: object
  //@ts-ignore
): Promise<string> {
	let path = join(`${__dirname}/mailing-templates/${template}.hbs`);
	let fileExists = existsSync(path)
	let content = ''
	if (fileExists) {
		let contents = readFileSync(path, 'utf-8')
		for (var i in data) {
			var x = '{{' + i + '}}'
			while (contents.indexOf(x) > -1) {
				// @ts-ignore
				contents = contents.replace(x, data[i])
			}
		}
		content = contents
	}
	return content
}
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
