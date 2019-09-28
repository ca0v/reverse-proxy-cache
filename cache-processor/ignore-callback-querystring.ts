class Processor {
    regex = /[?&]callback=([^&]*)/;
    regexFn = /[^(]*\(/; // foo(

    computeCacheKey(request: string) {
        return request.replace(this.regex, "");
    }

    processResponse(request: string, response: string) {
        let cbOriginalName = this.regex.exec(request);
        if (!cbOriginalName) {
            if (!this.regexFn.test(response)) return response;
            response = response.replace(this.regexFn, "");
            response = response.substring(0, response.length - 2); // remove the ");"
            return response;
        }
        return response.replace(this.regexFn, cbOriginalName[1] + "(");
    }

}

let processor = new Processor();

export = processor;