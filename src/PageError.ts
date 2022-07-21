import { Page } from "playwright";

export default class PageError extends Error {
    public page: Page

    constructor(maybeError: any, page: Page) {
        super(maybeError);
        this.message = `Page Error ${maybeError}`
        if (maybeError instanceof Error) {
            this.message = `Page Error: ${maybeError.message}`
        }
        this.page = page;

        // Set the prototype explicitly.
        Object.setPrototypeOf(this, PageError.prototype);
    }

}