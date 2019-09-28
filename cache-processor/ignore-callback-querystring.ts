class Processor {
    private regex = /[?&]callback=([^&]*)/;

    computeCacheKey(request: string) {
        return request.replace(this.regex, "");
    }

    processResponse(request: string, response: string) {
        let cbOriginalName = this.regex.exec(request);
        return !cbOriginalName ? response : response.replace(/[^(]*\(/, cbOriginalName[1] + "(");
    }

    test() {

        [{ out: "some&callback=2", in: "some?callback=1&callback=2" }].forEach(test => {
            let result = this.computeCacheKey(test.in);
            console.assert(test.out === result, `${result} != ${test.out}`);
        });

        [{ out: "cb2({});", in: { request: "some?callback=cb2", response: "cb1({});" } }].forEach(test => {
            let result = this.processResponse(test.in.request, test.in.response);
            console.assert(test.out === result, `${result} != ${test.out}`);
        });
    }
}

let processor = new Processor();

export = processor;