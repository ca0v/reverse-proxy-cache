import { HttpsGet } from "../server/fun/http-get";
import * as assert from "assert";

let got = new HttpsGet();
describe("download-image tests", () => {
    it("downloads a picture through the proxy", async () => {
        let actualUrl = "https://usgvncalix01.infor.com/IPS112/client/images/MapDrawer/MapIcons/AbandonedVehicle.png";
        let response1 = await got.get(actualUrl, {
            rejectUnauthorized: false,
        });
        console.log(response1.body.length);
        assert.equal(response1.body.length, 2 * 4580, "response body is correct size");
        assert(
            [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a].every((v, i) => v === response1.body[i]),
            "PNG header is correct"
        );
        let cacheUrl = "http://localhost:3002/mock/test/MapIcons/AbandonedVehicle.png";
        let response2 = await got.get(cacheUrl);
        console.log(response2.body.length);
    });
});
