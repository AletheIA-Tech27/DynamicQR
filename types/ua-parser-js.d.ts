// Ambient type declaration for the `ua-parser-js` package.
// We only use `new UAParser(userAgent).getOS()` so a minimal surface
// is enough to satisfy the project.

declare module "ua-parser-js" {
  export interface IResult {
    ua: string;
    browser: { name?: string; version?: string };
    engine: { name?: string; version?: string };
    os: { name?: string; version?: string };
    device: { vendor?: string; model?: string; type?: string };
    cpu: { architecture?: string };
  }

  export interface UAParserInstance {
    getBrowser(): IResult["browser"];
    getEngine(): IResult["engine"];
    getOS(): IResult["os"];
    getDevice(): IResult["device"];
    getCPU(): IResult["cpu"];
    getResult(): IResult;
  }

  export class UAParser {
    constructor(ua?: string);
    getBrowser(): IResult["browser"];
    getEngine(): IResult["engine"];
    getOS(): IResult["os"];
    getDevice(): IResult["device"];
    getCPU(): IResult["cpu"];
    getResult(): IResult;
  }
}
