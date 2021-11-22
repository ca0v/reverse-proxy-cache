declare var assert: any;

async function sleep(ms = 1000) {
  return new Promise<void>((good, bad) => {
    setTimeout(() => good(), ms);
  });
}

async function postMockData(data: {
  data: number | string | object;
  method?: "GET" | "POST";
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
  before(async () => {
    // register a site as a proxy
    await postRegisterProxy({
      about: "Register a proxy for unit test",
      baseUri: "/mock/acme/",
      proxyUri: "https://bogus.acme.com/",
    });

    // inject some mock data
    await postMockData({
      data: "this is a test",
      url: "https://bogus.acme.com/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin",
    });

    await postMockData({
      method: "POST",
      data: "POST:this is a test",
      url: "https://bogus.acme.com/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin",
    });
  });

  it("CRASHES PROXY SERVER", async () => {
    try {
      await fetch(
        "http://localhost:3002/mock/acme/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin",
        {
          method: "POST",
        }
      );
      assert.fail("Exception expected");
    } catch (ex) {
      assert.equal(ex, "TypeError: Failed to fetch");
    }
  });

  it("CORS", async () => {
    const response = await fetch(
      "http://localhost:3002/mock/acme/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin"
    );
    assert.ok(response.ok, "Response is ok");
    const data = await response.text();
    assert.equal(data, "this is a test");
  });

  it("CORS credentials GET", async () => {
    const response = await fetch(
      "http://localhost:3002/mock/acme/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin",
      {
        method: "GET",
        body: null,
        //mode: "cors",
        credentials: "include",
        headers: {
          "Content-Type": "application/json; charset=UTF-8",
          Accept: "application/json",
        },
      }
    );
    assert.ok(response.ok, "Response is ok");
    const data = await response.text();
    assert.equal(data, "this is a test");
  });

  it("CORS preflight GET", async () => {
    // server is not returning access-control-allow-methods
    await sleep(100);
    // the presence of a Content-Type header causes a CORS error
    const response = await fetch(
      "http://localhost:3002/mock/acme/ips/11.2/nextgen/api/endpoints/agencymaps/rmb-maplet-mixin",
      {
        headers: {
          "Content-Type": "application/json",
        },
      }
    );
    assert.ok(response.ok, "Response is ok");
    const data = await response.text();
    assert.equal(data, "this is a test");
  });
});
