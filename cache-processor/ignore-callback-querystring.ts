class Processor {
    regex = /[?&]callback=([^&]*)/;
    regexFn = /[^(]*\(/; // foo(

    computeCacheKey(request: string) {
        return request.replace(this.regex, "");
    }

    processResponse(request: string, response: string | Array<number>) {
        // only care about text response data
        if (typeof response !== "string") return response;
        // extract the callback name from the request
        let cbOriginalName = this.regex.exec(request);
        // if none found, strip the function wrapper (for what purpose?)
        if (!cbOriginalName) {
            if (!this.regexFn.test(response)) return response;
            response = response.replace(this.regexFn, "");
            response = response.substring(0, response.length - 2); // remove the ");"
            return response;
        }
        // pjson - replace the cached callback name with the requested callback name so client is callbacked back
        return response.replace(this.regexFn, cbOriginalName[1] + "(");
    }

}

let processor = new Processor();

export = processor;