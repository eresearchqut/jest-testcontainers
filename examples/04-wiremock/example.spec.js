describe('wiremock example suite', () => {

  const wiremockBaseUrl = `http://${global.__TESTCONTAINERS_WIREMOCK_IP__}:${global.__TESTCONTAINERS_WIREMOCK_PORT_8080__}`
  const smockerBaseUrl = `http://${global.__TESTCONTAINERS_SMOCKER_IP__}:${global.__TESTCONTAINERS_SMOCKER_PORT_8081__}`

  it("should set a container name", async() => {
    expect(global.__TESTCONTAINERS_WIREMOCK_NAME__).toBeDefined();
    expect(global.__TESTCONTAINERS_SMOCKER_NAME__).toBeDefined();
  });

  it('should be the same response from smocker and wiremock', async () => {
    const smockerResponse = await fetch(`${smockerBaseUrl}/version`, {}).then((response) => response.ok ? response.json() : response.statusText);
    const wirmockResponse = await fetch(`${wiremockBaseUrl}/version`, {}).then((response) => response.ok ? response.json() : response.statusText);
    expect(smockerResponse).toEqual(wirmockResponse);
  });


});
