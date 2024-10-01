import debug, { IDebugger } from "debug";


export class Logger {
    private readonly logger: IDebugger;

    constructor(namespace: string, private readonly showLevel = true) {
        this.logger = debug(namespace);
    }

    public enabled(): boolean {
        return this.logger.enabled;
    }


    public debug(message: string): void {
        this.logger(this.formatMessage(message, "DEBUG"));
    }


    private formatMessage(message: string, level: string): string {
        return `${this.showLevel ? `[${level}] ` : ""}${message}`;
    }


}

export const log = new Logger("testcontainers:jest");
