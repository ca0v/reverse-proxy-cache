import { assert } from "chai";
import { HttpsGet } from "../../server/fun/http-get.js";
import { run, Server as ProxyServer } from "../../server.js";
import { IConfig } from "#@app/server/contracts.js";
const got = new HttpsGet();

// http://localhost:3002/mock/services7/rest/services/IPSQAFT112_AX1_WFL1/FeatureServer/8/query?f=pbf&returnGeometry=true&spatialRel=esriSpatialRelIntersects&geometry=%7B%22xmin%22%3A-12914800.299072523%2C%22ymin%22%3A4304933.433041731%2C%22xmax%22%3A-12875664.540590564%2C%22ymax%22%3A4344069.191523688%2C%22spatialReference%22%3A%7B%22wkid%22%3A3857%7D%7D&geometryType=esriGeometryEnvelope&inSR=3857&outFields=FID&outSR=3857&resultType=tile&quantizationParameters=%7B%22mode%22%3A%22view%22%2C%22originPosition%22%3A%22upperLeft%22%2C%22tolerance%22%3A76.4370282850745%2C%22extent%22%3A%7B%22xmin%22%3A-12830637.623241322%2C%22ymin%22%3A4324064.201808335%2C%22xmax%22%3A-12824696.778567731%2C%22ymax%22%3A4327594.553695296%2C%22spatialReference%22%3A%7B%22wkid%22%3A102100%2C%22latestWkid%22%3A3857%7D%7D%7D
describe("Tests PBF format", () => {
  const proxyPort = 3004;
  let proxy: ProxyServer | void;
  before(async () => {
    const config: IConfig = {
      "reverse-proxy-cache": {
        verbose: true,
        port: `${proxyPort}`,
        isBinaryMimeType: ["application/x-protobuf"],
        "reverse-proxy-db": "unittest.sqlite",
        "proxy-pass": [
          {
            about: "ensure PBF file content is preserved",
            baseUri: "/mock/services7/",
            proxyUri: "https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/",
          },
        ],
      },
    };
    proxy = await run(config);
  });

  after(() => proxy!.stop());

  it("Tests PBF format", async () => {
    const query = {
      f: "pbf",
      returnGeometry: true,
      spatialRel: "esriSpatialRelIntersects",
      geometryType: "esriGeometryEnvelope",
      inSR: 3857,
      outFields: "FID",
      outSR: 3857,
      resultType: "tile",
      geometry: {
        xmin: -12914800.299072523,
        ymin: 4304933.433041731,
        xmax: -12875664.540590564,
        ymax: 4344069.191523688,
        spatialReference: { wkid: 3857 },
      },
      quantizationParameters: {
        mode: "view",
        originPosition: "upperLeft",
        tolerance: 76.4370282850745,
        extent: {
          xmin: -12830637.623241322,
          ymin: 4324064.201808335,
          xmax: -12824696.778567731,
          ymax: 4327594.553695296,
          spatialReference: { wkid: 102100, latestWkid: 3857 },
        },
      },
    };

    function asParam(o: object): Record<string, string> {
      const result = Object.entries(([key, value]) => [
        key,
        typeof value === "string" ? value : JSON.stringify(value),
      ]);
      return Object.fromEntries(result);
    }

    const params = new URLSearchParams(asParam(query)).toString();
    const realUrl = `https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/rest/services/IPSQAFT112_AX1_WFL1/FeatureServer/8/1?f=pbf`;

    const mockUrl = realUrl.replace(
      "https://services7.arcgis.com/k0UprFPHKieFB9UY/arcgis/",
      `http://localhost:${proxyPort}/mock/services7/`
    );

    const realResponse = await got.get(realUrl);
    const realData = realResponse.body;
    const mockResponse = await got.get(mockUrl);
    const mockData = mockResponse.body;
    assert.deepEqual(realData, mockData, "data");
    assert.exists(1);
  });
});
