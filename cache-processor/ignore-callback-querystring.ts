import { ProxyInfo, IProcessor } from "#@app/server/contracts";

class Processor implements IProcessor {
  name = "ignore-callback-querystring";
  regex = /[?&]callback=([^&]*)/;
  regexFn = /[\w_][\w\d_]*\(/; // foo(

  computeCacheKey(request: string) {
    return request.replace(this.regex, "");
  }

  processResponse(request: string, response: string) {
    // only care about text response data
    if (typeof response !== "string") return response;
    // extract the callback name from the request
    let cbOriginalName = this.regex.exec(request);
    // if none found, strip the function wrapper (for what purpose?)
    if (!cbOriginalName) {
      return response;
    }
    // pjson - replace the cached callback name with the requested callback name so client is callbacked back
    return response.replace(this.regexFn, cbOriginalName[1] + "(");
  }
}

export const processor = new Processor();
