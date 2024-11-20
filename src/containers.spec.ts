import { DockerComposeEnvironment,
  StartedTestContainer,
  TestContainer
} from "testcontainers";
import {
  DockerComposeConfig,
  JestTestcontainersConfig,
  SingleContainerConfig
} from "./config";
import {
  AllStartedContainersAndMetaInfo,
  buildDockerComposeEnvironment,
  buildTestcontainer,
  getMetaInfo,
  startAllContainers,
  startContainer,
  startDockerComposeContainers,
  StartedContainerAndMetaInfo
} from "./containers";
import {HostPortWaitStrategy} from "testcontainers/build/wait-strategies/host-port-wait-strategy";
import {LogWaitStrategy} from "testcontainers/build/wait-strategies/log-wait-strategy";
import { describe, expect, it, jest } from '@jest/globals';

describe("containers", () => {
  describe("buildTestcontainer", () => {
    it("should create simple container with image only", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis"
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.imageName.image).toEqual("redis");
      expect(actualContainer.imageName.tag).toEqual("latest");
      expect(actualContainer.ports).toEqual(undefined);
      expect(actualContainer.environment).toEqual({});
      expect(actualContainer.waitStrategy).toEqual({"startupTimeout": 60000, "startupTimeoutSet": false});
      expect(actualContainer.startupTimeout).toEqual(undefined);
      expect(actualContainer.bindMounts).toEqual(undefined);
    });

    it("should set tag correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis",
        tag: "5.0.5"
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.imageName.image).toEqual("redis");
      expect(actualContainer.imageName.tag).toEqual("5.0.5");
      expect(actualContainer.createOpts.ports).toEqual(undefined);
      expect(actualContainer.environment).toEqual({});
      expect(actualContainer.waitStrategy).toEqual({"startupTimeout": 60000, "startupTimeoutSet": false});
      expect(actualContainer.startupTimeout).toEqual(undefined);
      expect(actualContainer.bindMounts).toEqual(undefined);
    });

    it("should set ports correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis",
        ports: [6379]
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.imageName.image).toEqual("redis");
      expect(actualContainer.imageName.tag).toEqual("latest");
      expect(actualContainer.exposedPorts).toEqual([6379]);
    });


    it("should set with privileged mode correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis",
        withPrivilegedMode: true
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.imageName.image).toEqual("redis");
      expect(actualContainer.hostConfig.Privileged).toEqual(true);
    });

    it("should set name correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis",
        ports: [6379],
        name: "container-name"
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.imageName.image).toEqual("redis");
      expect(actualContainer.imageName.tag).toEqual("latest");
      expect(actualContainer.exposedPorts).toEqual([6379]);
      expect(actualContainer.createOpts.name).toEqual("container-name");
    });

    it("should set env correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        env: {
          hello: "world"
        },
        image: "redis"
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.environment).toEqual({ hello: "world" });
    });

    it("should port wait strategy correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis",
        wait: {
          timeout: 30,
          type: "ports"
        }
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.startupTimeout).toEqual(30000);
      expect(actualContainer.waitStrategy.constructor).toEqual(HostPortWaitStrategy);
    });

    it("should text wait strategy correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis",
        wait: {
          text: "hello, world",
          type: "text"
        }
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.waitStrategy.constructor).toEqual(LogWaitStrategy);
      expect(actualContainer.waitStrategy.message).toEqual("hello, world");
    });
    it("should set bind mounts correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        image: "redis",
        bindMounts: [
          {
            mode: "ro",
            source: "/somepath",
            target: "/somepath"
          },
          {
            source: "/anotherpath",
            target: "/anotherpath",
            mode: "ro"
          }
        ]
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.hostConfig.Binds).toEqual([
        "/somepath:/somepath:ro",
        "/anotherpath:/anotherpath:ro"
      ]);
    });

    it("should set command correctly", () => {
      // Arrange
      const config: SingleContainerConfig = {
        command: ["echo", "'hi'"],
        image: "alpine"
      };

      // Act
      const actualContainer: any = buildTestcontainer(config);

      // Assert
      expect(actualContainer.imageName.image).toEqual("alpine");
      expect(actualContainer.imageName.tag).toEqual("latest");
      expect(actualContainer.createOpts.Cmd).toEqual(["echo", "'hi'"]);
    });
  });

  describe("buildDockerComposeEnvironment", () => {
    it("should create simple docker compose environment", () => {
      // Arrange
      const dockerComposeConfig: DockerComposeConfig = {
        composeFilePath: ".",
        composeFile: "docker-compose.yml"
      };
      const nameRegex = new RegExp(/testcontainers-[0-9A-F]{12}/i);

      // Act
      const actualEnvironment: any = buildDockerComposeEnvironment(
        dockerComposeConfig
      );

      // Assert
      expect(actualEnvironment.projectName).toEqual(
        expect.stringMatching(nameRegex)
      );
    });

    it("should set startup timeout correctly", () => {
      // Arrange
      const dockerComposeConfig: DockerComposeConfig = {
        composeFilePath: ".",
        composeFile: "docker-compose.yml",
        startupTimeout: 60000
      };

      // Act
      const actualEnvironment: any = buildDockerComposeEnvironment(
        dockerComposeConfig
      );

      // Assert
      expect(actualEnvironment.startupTimeout).toEqual(60000);
    });
  });

  describe("getMetaInfo", () => {
    it("should work with no ports", () => {
      // Arrange
      const host = "localhost";
      const name = "container-name";
      const startedContainer: StartedTestContainer = ({
        getHost: jest.fn(() => host),
        getName: jest.fn(() => name)
      } as unknown) as StartedTestContainer;
      const expectedMetaInfo: StartedContainerAndMetaInfo = {
        name,
        container: startedContainer,
        ip: host,
        portMappings: new Map<number, number>()
      };

      // Act
      const actualMetaInfo = getMetaInfo(startedContainer);

      // Assert
      expect(actualMetaInfo).toEqual(expectedMetaInfo);
    });

    it("should work with empty ports", () => {
      // Arrange
      const host = "localhost";
      const name = "container-name";
      const ports: number[] = [];
      const boundPorts = new Map<number, number>();
      const startedContainer: StartedTestContainer = ({
        getHost: jest.fn(() => host),
        getName: jest.fn(() => name),
        getMappedPort: jest.fn(port => boundPorts.get(port as number))
      } as unknown) as StartedTestContainer;
      const expectedMetaInfo: StartedContainerAndMetaInfo = {
        name,
        container: startedContainer,
        ip: host,
        portMappings: boundPorts
      };

      // Act
      const actualMetaInfo = getMetaInfo(startedContainer, ports);

      // Assert
      expect(actualMetaInfo).toEqual(expectedMetaInfo);
    });

    it("should work with ports", () => {
      // Arrange
      const host = "localhost";
      const name = "container-name";
      const ports = [1, 3, 4];
      const boundPorts = new Map<number, number>([
        [1, 2],
        [3, 4]
      ]);
      const startedContainer: StartedTestContainer = ({
        getHost: jest.fn(() => host),
        getName: jest.fn(() => name),
        getMappedPort: jest.fn(port => boundPorts.get(port as number))
      } as unknown) as StartedTestContainer;
      const expectedMetaInfo: StartedContainerAndMetaInfo = {
        name,
        container: startedContainer,
        ip: host,
        portMappings: boundPorts
      };

      // Act
      const actualMetaInfo = getMetaInfo(startedContainer, ports);

      // Assert
      expect(actualMetaInfo).toEqual(expectedMetaInfo);
    });
  });

  describe("startContainer", () => {
    it("should call builder and getter functions", async () => {
      // Arrange
      const ports = [1];
      const boundPorts = new Map<number, number>([[1, 2]]);
      const startedContainer = ({} as unknown) as StartedTestContainer;
      const container: TestContainer = ({
        start: jest.fn(() => Promise.resolve(startedContainer))
      } as unknown) as TestContainer;
      const containerBuilderFn: any = jest.fn(() => container);
      const expectedMetaResult: StartedContainerAndMetaInfo = {
        container: startedContainer,
        ip: "localhost",
        name: "container-name",
        portMappings: boundPorts
      };
      const getMetaInfoFn: any = jest.fn(() => expectedMetaResult);
      const config: SingleContainerConfig = {
        image: "test",
        ports,
        tag: "latest"
      };

      // Act
      const actualMetaResult = await startContainer(
        config,
        containerBuilderFn,
        getMetaInfoFn
      );

      // Assert
      expect(actualMetaResult).toEqual(expectedMetaResult);
      expect(getMetaInfoFn).toHaveBeenCalledWith(startedContainer, ports);
      expect(container.start).toHaveBeenCalledWith();
      expect(containerBuilderFn).toHaveBeenCalledWith(config);
    });
  });

  describe("startDockerComposeContainers", () => {
    it("should call builder and getter functions", async () => {
      // Arrange
      const ports = [1];
      const boundPorts = new Map<number, number>([[1, 2]]);
      const startedContainer = ({
        containerName: "container-name",
        boundPorts: {
          ports: boundPorts
        }
      } as unknown) as StartedTestContainer;
      const containerMeta: StartedContainerAndMetaInfo = {
        container: startedContainer,
        ip: "localhost",
        name: "container-name",
        portMappings: boundPorts
      };
      const environment: DockerComposeEnvironment = ({
        up: jest.fn(() =>
          Promise.resolve({
            startedGenericContainers: {
              "container-name": startedContainer
            }
          })
        )
      } as unknown) as DockerComposeEnvironment;
      const dockerComposeBuilderFn: any = jest.fn(() => environment);
      const expectedMetaResult: AllStartedContainersAndMetaInfo = {
        "container-name": containerMeta
      };
      const getMetaInfoFn: any = jest.fn(() => containerMeta);
      const dockerComposeConfig: DockerComposeConfig = {
        composeFilePath: ".",
        composeFile: "docker-compose.yml",
        startupTimeout: 1000
      };

      // Act
      const actualMetaResult = await startDockerComposeContainers(
        dockerComposeConfig,
        dockerComposeBuilderFn,
        getMetaInfoFn
      );

      // Assert
      expect(actualMetaResult).toEqual(expectedMetaResult);
      expect(getMetaInfoFn).toHaveBeenCalledWith(startedContainer, ports);
      expect(environment.up).toHaveBeenCalledWith();
      expect(dockerComposeBuilderFn).toHaveBeenCalledWith(dockerComposeConfig);
    });
  });

  describe("startAllContainers", () => {
    it("should call starter function", async () => {
      // Arrange
      const config: JestTestcontainersConfig = {
        rabbit: { image: "rabbit" },
        redis: { image: "redis" }
      };
      const container = (null as unknown) as StartedTestContainer;
      const redisPortMappings = new Map<number, number>([[1, 2]]);
      const rabbitPortMappings = new Map<number, number>([[3, 4]]);
      const infos: AllStartedContainersAndMetaInfo = {
        rabbit: {
          name: "rabbit",
          container,
          ip: "localhost",
          portMappings: rabbitPortMappings
        },
        redis: {
          name: "redis",
          container,
          ip: "localhost",
          portMappings: redisPortMappings
        }
      };
      const startContainerFn: any = jest.fn(
        (cfg: SingleContainerConfig) => infos[cfg.image]
      );

      // Act
      const allStartedContainerAndMetaInfo = await startAllContainers(
        config,
        startContainerFn
      );

      // Assert
      expect(allStartedContainerAndMetaInfo).toEqual(infos);
      expect(startContainerFn).toHaveBeenCalledWith(config.rabbit);
      expect(startContainerFn).toHaveBeenCalledWith(config.redis);
    });

    it("should call docker compose starter function", async () => {
      // Arrange
      const config: JestTestcontainersConfig = {
        dockerCompose: {
          composeFilePath: ".",
          composeFile: "docker-compose.yml"
        }
      };
      const container = (null as unknown) as StartedTestContainer;
      const redisPortMappings = new Map<number, number>([[1, 2]]);
      const infos: AllStartedContainersAndMetaInfo = {
        redis: {
          name: "redis",
          container,
          ip: "localhost",
          portMappings: redisPortMappings
        }
      };
      const startContainerFn: any = jest.fn();
      const startDockerComposeContainersFn: any = jest.fn(() => infos);

      // Act
      const allStartedContainerAndMetaInfo = await startAllContainers(
        config,
        startContainerFn,
        startDockerComposeContainersFn
      );

      // Assert
      expect(allStartedContainerAndMetaInfo).toEqual(infos);
      expect(startDockerComposeContainersFn).toHaveBeenCalledWith(
        config.dockerCompose
      );
    });
  });
});
