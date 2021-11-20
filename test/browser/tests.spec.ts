declare var assert: any;

async function postMockData(data: {
  data: number | string | object;
  method?: string;
  url: string;
}) {
  let stringData = data.data;
  if (typeof stringData !== "string") {
    stringData = JSON.stringify(stringData);
  }
  await fetch("http://localhost:3002/system?mock=add", {
    method: "POST",
    body: JSON.stringify({
      url: data.url,
      method: data.method || "GET",
      data: stringData,
    }),
  });
}

async function postRegisterProxy(data: {
  about: string;
  baseUri: string;
  proxyUri: string;
}) {
  await fetch("http://localhost:3002/system?proxy=add", {
    method: "POST",
    body: JSON.stringify(data),
  });
}

describe("CORS", () => {
  before(() => {
    // register a site as a proxy
    postRegisterProxy({
      about: "Register a proxy for unit test",
      baseUri: "/mock/acme",
      proxyUri: "https://bogus.acme.com/",
    });

    // inject some mock data
    postMockData({
      data: "this is a test",
      url: "https://bogus.acme.com/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin",
    });
  });

  it("CORS", async () => {
    const response = await fetch(
      "http://localhost:3002/mock/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin"
    );
    assert.ok(response.ok, "Response is ok");
  });
});
