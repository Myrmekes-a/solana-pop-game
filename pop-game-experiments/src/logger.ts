import { Console } from "console";
import fs from "fs";

export const log = new Console({
    stdout: fs.createWriteStream(__dirname + "/server.access.log", {
        flags: "a",
    }),
    stderr: fs.createWriteStream(__dirname + "/server.error.log", {
        flags: "a",
    }),
});

const now = () => {
    return new Date().toISOString().replace("T", " ").replace("Z", "");
};

export const logger = {
    info: (...args: any[]) => log.info(`[${now()}]`, ...args),
    error: (...args: any[]) => {
        log.error(`[${now()}] <Error:>`, ...args);
        log.info(`[${now()}] <Error:>`, ...args);
    },
    debug: (...args: any[]) => log.debug(`[${now()}] <Debug:>`, ...args),
    warn: (...args: any[]) => {
        log.warn(`[${now()}] <Warn:>`, ...args);
        log.info(`[${now()}] <Warn:>`, ...args);
    },
};
