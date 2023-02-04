export default class CommandError extends Error {
	readonly userMsg?: string;

	constructor(moduleName: string, userMsg?: string) {
		super(moduleName);
		this.userMsg = userMsg;
	}
}